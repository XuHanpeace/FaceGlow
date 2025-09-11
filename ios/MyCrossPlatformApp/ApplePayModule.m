#import "ApplePayModule.h"
#import <React/RCTLog.h>
#import <React/RCTUtils.h>
#import <StoreKit/StoreKit.h>

@implementation ApplePayModule

RCT_EXPORT_MODULE();

- (instancetype)init {
    self = [super init];
    if (self) {
        // 添加支付队列观察者
        [[SKPaymentQueue defaultQueue] addTransactionObserver:self];
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
    
    // 检查是否可以支付
    if (![SKPaymentQueue canMakePayments]) {
        reject(@"payment_disabled", @"设备不支持支付", nil);
        return;
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
}

// 恢复购买
RCT_EXPORT_METHOD(restorePurchases:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    
    self.resolveBlock = resolve;
    self.rejectBlock = reject;
    self.isRestoring = YES;
    
    [[SKPaymentQueue defaultQueue] restoreCompletedTransactions];
}

// 检查订阅状态
RCT_EXPORT_METHOD(checkSubscriptionStatus:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    
    // 这里需要实现服务器端验证
    // 暂时返回本地存储的状态
    NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
    BOOL isSubscribed = [defaults boolForKey:@"isSubscribed"];
    NSString *subscriptionType = [defaults stringForKey:@"subscriptionType"];
    
    resolve(@{
        @"isSubscribed": @(isSubscribed),
        @"subscriptionType": subscriptionType ?: @"",
        @"expirationDate": [defaults objectForKey:@"expirationDate"] ?: @""
    });
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
        } else {
            if (self.rejectBlock) {
                self.rejectBlock(@"product_not_found", @"产品不存在", nil);
                self.resolveBlock = nil;
                self.rejectBlock = nil;
            }
        }
        
        self.pendingProductId = nil;
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
                // 等待外部操作（如家长同意）
                break;
            case SKPaymentTransactionStatePurchasing:
                // 正在处理中
                break;
        }
    }
}

- (void)handlePurchasedTransaction:(SKPaymentTransaction *)transaction {
    // 保存购买信息
    NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
    [defaults setBool:YES forKey:@"isSubscribed"];
    [defaults setObject:transaction.payment.productIdentifier forKey:@"subscriptionType"];
    [defaults setObject:transaction.transactionDate forKey:@"purchaseDate"];
    
    // 计算过期时间（这里需要根据实际产品类型计算）
    NSDate *expirationDate = [self calculateExpirationDate:transaction.payment.productIdentifier];
    [defaults setObject:expirationDate forKey:@"expirationDate"];
    
    // 完成交易
    [[SKPaymentQueue defaultQueue] finishTransaction:transaction];
    
    // 通知React Native
    if (self.resolveBlock) {
        self.resolveBlock(@{
            @"success": @YES,
            @"productId": transaction.payment.productIdentifier,
            @"transactionId": transaction.transactionIdentifier
        });
        self.resolveBlock = nil;
        self.rejectBlock = nil;
    }
}

- (void)handleFailedTransaction:(SKPaymentTransaction *)transaction {
    [[SKPaymentQueue defaultQueue] finishTransaction:transaction];
    
    if (self.rejectBlock) {
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
        
        self.rejectBlock(errorCode, errorMessage, transaction.error);
        self.resolveBlock = nil;
        self.rejectBlock = nil;
    }
}

- (void)handleRestoredTransaction:(SKPaymentTransaction *)transaction {
    // 保存恢复的购买信息
    NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
    [defaults setBool:YES forKey:@"isSubscribed"];
    [defaults setObject:transaction.payment.productIdentifier forKey:@"subscriptionType"];
    
    [[SKPaymentQueue defaultQueue] finishTransaction:transaction];
}

- (void)paymentQueueRestoreCompletedTransactionsFinished:(SKPaymentQueue *)queue {
    if (self.isRestoring) {
        self.resolveBlock(@{@"success": @YES, @"message": @"恢复购买完成"});
        self.resolveBlock = nil;
        self.rejectBlock = nil;
        self.isRestoring = NO;
    }
}

- (void)paymentQueue:(SKPaymentQueue *)queue restoreCompletedTransactionsFailedWithError:(NSError *)error {
    if (self.isRestoring) {
        self.rejectBlock(@"restore_failed", error.localizedDescription, error);
        self.resolveBlock = nil;
        self.rejectBlock = nil;
        self.isRestoring = NO;
    }
}

#pragma mark - Helper Methods

- (NSDate *)calculateExpirationDate:(NSString *)productId {
    NSDate *now = [NSDate date];
    NSCalendar *calendar = [NSCalendar currentCalendar];
    
    if ([productId containsString:@"weekly"]) {
        return [calendar dateByAddingUnit:NSCalendarUnitWeekOfYear value:1 toDate:now options:0];
    } else if ([productId containsString:@"monthly"]) {
        return [calendar dateByAddingUnit:NSCalendarUnitMonth value:1 toDate:now options:0];
    } else if ([productId containsString:@"yearly"]) {
        return [calendar dateByAddingUnit:NSCalendarUnitYear value:1 toDate:now options:0];
    }
    
    return now;
}

@end
