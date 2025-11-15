#import "ApplePayModule.h"
#import <React/RCTLog.h>
#import <React/RCTUtils.h>
#import <StoreKit/StoreKit.h>
#import <UIKit/UIKit.h>


@implementation ApplePayModule

// 确保模块在主线程初始化
+ (BOOL)requiresMainQueueSetup {
    return YES;
}

RCT_EXPORT_MODULE();


- (instancetype)init {
    self = [super init];
    if (self) {
        self.restoredTransactions = [NSMutableArray array];
        // 确保在主线程添加观察者
        dispatch_async(dispatch_get_main_queue(), ^{
            [[SKPaymentQueue defaultQueue] addTransactionObserver:self];
        });
    }
    return self;
}

- (void)dealloc {
    // 移除支付队列观察者
    [[SKPaymentQueue defaultQueue] removeTransactionObserver:self];
}

// 获取可用产品
RCT_EXPORT_METHOD(getAvailableProducts:(NSArray *)productIdentifiers
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    
    NSSet *productSet = [NSSet setWithArray:productIdentifiers];
    SKProductsRequest *request = [[SKProductsRequest alloc] initWithProductIdentifiers:productSet];
    request.delegate = self;
    
    // 保存回调
    self.resolveBlock = resolve;
    self.rejectBlock = reject;
    
    [request start];
}

// 购买产品
RCT_EXPORT_METHOD(purchaseProduct:(NSString *)productIdentifier
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    
    
    // 确保在主线程执行
    dispatch_async(dispatch_get_main_queue(), ^{
        // 检查是否可以支付
        if (![SKPaymentQueue canMakePayments]) {
            reject(@"payment_disabled", @"设备不支持支付", nil);
            return;
        }
        
        // 确保观察者已添加（多次添加是安全的，系统会自动去重）
        [[SKPaymentQueue defaultQueue] addTransactionObserver:self];
        
        // 如果已有待处理的购买，先拒绝之前的请求
        if (self.resolveBlock || self.rejectBlock) {
            if (self.rejectBlock) {
                self.rejectBlock(@"purchase_in_progress", @"已有购买请求在处理中", nil);
            }
        }
        
        // 保存回调和产品ID
        self.resolveBlock = resolve;
        self.rejectBlock = reject;
        self.pendingProductId = productIdentifier;
        
        
        // 获取产品信息
        NSSet *productSet = [NSSet setWithObject:productIdentifier];
        SKProductsRequest *request = [[SKProductsRequest alloc] initWithProductIdentifiers:productSet];
        request.delegate = self;
        
        [request start];
    });
}

// 恢复购买
RCT_EXPORT_METHOD(restorePurchases:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    self.resolveBlock = resolve;
    self.rejectBlock = reject;
    self.isRestoring = YES;
    
    [[SKPaymentQueue defaultQueue] restoreCompletedTransactions];
}


#pragma mark - SKProductsRequestDelegate

- (void)productsRequest:(SKProductsRequest *)request didReceiveResponse:(SKProductsResponse *)response {
    if (self.pendingProductId) {
        // 处理购买请求
        SKProduct *product = nil;
        for (SKProduct *p in response.products) {
            if ([p.productIdentifier isEqualToString:self.pendingProductId]) {
                product = p;
                break;
            }
        }
        
        if (product) {
            SKPayment *payment = [SKPayment paymentWithProduct:product];
            [[SKPaymentQueue defaultQueue] addPayment:payment];
            // 不清除回调，等待购买完成
            // 注意：这里不清除 pendingProductId，因为需要在交易回调中验证
        } else {
            if (self.rejectBlock) {
                self.rejectBlock(@"product_not_found", @"产品不存在", nil);
                self.resolveBlock = nil;
                self.rejectBlock = nil;
                self.pendingProductId = nil;
            }
        }
    } else {
        // 处理产品列表请求
        NSMutableArray *products = [NSMutableArray array];
        for (SKProduct *product in response.products) {
            [products addObject:@{
                @"productId": product.productIdentifier,
                @"title": product.localizedTitle,
                @"description": product.localizedDescription,
                @"price": product.price,
                @"priceLocale": product.priceLocale.localeIdentifier
            }];
        }
        
        if (self.resolveBlock) {
            self.resolveBlock(products);
            self.resolveBlock = nil;
            self.rejectBlock = nil;
        }
    }
}

- (void)request:(SKRequest *)request didFailWithError:(NSError *)error {
    if (self.rejectBlock) {
        self.rejectBlock(@"request_failed", error.localizedDescription, error);
    }
    
    self.resolveBlock = nil;
    self.rejectBlock = nil;
    self.pendingProductId = nil;
}


#pragma mark - SKPaymentTransactionObserver

- (void)paymentQueue:(SKPaymentQueue *)queue updatedTransactions:(NSArray<SKPaymentTransaction *> *)transactions {
    
    for (SKPaymentTransaction *transaction in transactions) {
        
        // 只处理当前待购买的产品
        if (self.pendingProductId && ![transaction.payment.productIdentifier isEqualToString:self.pendingProductId]) {
            // 如果不是当前购买的产品，完成交易但不回调
            if (transaction.transactionState == SKPaymentTransactionStatePurchased ||
                transaction.transactionState == SKPaymentTransactionStateFailed ||
                transaction.transactionState == SKPaymentTransactionStateRestored) {
                [[SKPaymentQueue defaultQueue] finishTransaction:transaction];
            }
            continue;
        }
        
        switch (transaction.transactionState) {
            case SKPaymentTransactionStatePurchased:
                [self handlePurchasedTransaction:transaction];
                break;
            case SKPaymentTransactionStateFailed:
                [self handleFailedTransaction:transaction];
                break;
            case SKPaymentTransactionStateRestored:
                [self handleRestoredTransaction:transaction];
                break;
            case SKPaymentTransactionStateDeferred:
                // 等待外部操作（如家长同意）- 不完成交易，等待后续状态更新
                // 可以通知用户等待确认
                break;
            case SKPaymentTransactionStatePurchasing:
                // 正在处理中 - 不完成交易，等待后续状态更新
                break;
        }
    }
}

- (void)handlePurchasedTransaction:(SKPaymentTransaction *)transaction {
    // 保存回调块，避免在异步操作中丢失
    RCTPromiseResolveBlock resolveBlock = self.resolveBlock;
    RCTPromiseRejectBlock rejectBlock = self.rejectBlock;
    NSString *pendingProductId = self.pendingProductId;
    
    // 完成交易
    [[SKPaymentQueue defaultQueue] finishTransaction:transaction];
    
    // 在主线程通知React Native
    if (resolveBlock) {
        dispatch_async(dispatch_get_main_queue(), ^{
            resolveBlock(@{
                @"success": @YES,
                @"productId": transaction.payment.productIdentifier,
                @"transactionId": transaction.transactionIdentifier ?: @"",
                @"transactionDate": transaction.transactionDate ? @((long long)([transaction.transactionDate timeIntervalSince1970] * 1000)) : @0
            });
        });
        // 清除回调，避免重复调用
        self.resolveBlock = nil;
        self.rejectBlock = nil;
        self.pendingProductId = nil;
    }
}

- (void)handleFailedTransaction:(SKPaymentTransaction *)transaction {
    
    // 保存回调块，避免在异步操作中丢失
    RCTPromiseRejectBlock rejectBlock = self.rejectBlock;
    NSString *pendingProductId = self.pendingProductId;
    
    [[SKPaymentQueue defaultQueue] finishTransaction:transaction];
    
    if (rejectBlock) {
        // 根据错误类型分类处理
        NSString *errorCode;
        NSString *errorMessage;
        
        switch (transaction.error.code) {
            case SKErrorPaymentCancelled:
                errorCode = @"purchase_cancelled";
                errorMessage = @"用户取消了购买";
                break;
            case SKErrorPaymentNotAllowed:
                errorCode = @"payment_not_allowed";
                errorMessage = @"设备不允许进行支付";
                break;
            case SKErrorPaymentInvalid:
                errorCode = @"payment_invalid";
                errorMessage = @"支付信息无效";
                break;
            case SKErrorClientInvalid:
                errorCode = @"client_invalid";
                errorMessage = @"客户端无效";
                break;
            case SKErrorStoreProductNotAvailable:
                errorCode = @"product_not_available";
                errorMessage = @"产品不可用";
                break;
            case SKErrorCloudServicePermissionDenied:
                errorCode = @"cloud_service_denied";
                errorMessage = @"云服务权限被拒绝";
                break;
            case SKErrorCloudServiceNetworkConnectionFailed:
                errorCode = @"network_connection_failed";
                errorMessage = @"网络连接失败";
                break;
            case SKErrorCloudServiceRevoked:
                errorCode = @"cloud_service_revoked";
                errorMessage = @"云服务被撤销";
                break;
            default:
                errorCode = @"purchase_failed";
                errorMessage = transaction.error.localizedDescription ?: @"支付失败";
                break;
        }
        
        // 在主线程调用回调
        dispatch_async(dispatch_get_main_queue(), ^{
            rejectBlock(errorCode, errorMessage, transaction.error);
        });
        // 清除回调，避免重复调用
        self.resolveBlock = nil;
        self.rejectBlock = nil;
        self.pendingProductId = nil;
    } else {
    }
}

- (void)handleRestoredTransaction:(SKPaymentTransaction *)transaction {
    // 收集恢复的交易
    if (self.isRestoring && self.resolveBlock) {
        if (!self.restoredTransactions) {
            self.restoredTransactions = [NSMutableArray array];
        }
        [self.restoredTransactions addObject:transaction];
    }
    
    [[SKPaymentQueue defaultQueue] finishTransaction:transaction];
}

- (void)paymentQueueRestoreCompletedTransactionsFinished:(SKPaymentQueue *)queue {
    if (self.isRestoring) {
        // 构建恢复的交易列表
        NSMutableArray *transactions = [NSMutableArray array];
        for (SKPaymentTransaction *transaction in self.restoredTransactions) {
            [transactions addObject:@{
                @"productId": transaction.payment.productIdentifier,
                @"transactionId": transaction.transactionIdentifier ?: @"",
                @"transactionDate": transaction.transactionDate ? @((long long)([transaction.transactionDate timeIntervalSince1970] * 1000)) : @0,
                @"originalTransactionId": transaction.originalTransaction.transactionIdentifier ?: @""
            }];
        }
        
        if (self.resolveBlock) {
            self.resolveBlock(@{
                @"success": @YES,
                @"transactions": transactions
            });
        }
        
        self.resolveBlock = nil;
        self.rejectBlock = nil;
        self.isRestoring = NO;
        [self.restoredTransactions removeAllObjects];
    }
}

- (void)paymentQueue:(SKPaymentQueue *)queue restoreCompletedTransactionsFailedWithError:(NSError *)error {
    if (self.isRestoring) {
        if (self.rejectBlock) {
            self.rejectBlock(@"restore_failed", error.localizedDescription, error);
        }
        self.resolveBlock = nil;
        self.rejectBlock = nil;
        self.isRestoring = NO;
        [self.restoredTransactions removeAllObjects];
    }
}


@end
