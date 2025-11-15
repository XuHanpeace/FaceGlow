#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <StoreKit/StoreKit.h>

@interface ApplePayModule : RCTEventEmitter <RCTBridgeModule, SKProductsRequestDelegate, SKPaymentTransactionObserver>

@property (nonatomic, strong) RCTPromiseResolveBlock resolveBlock;
@property (nonatomic, strong) RCTPromiseRejectBlock rejectBlock;
@property (nonatomic, strong) NSString *pendingProductId;
@property (nonatomic, assign) BOOL isRestoring;
@property (nonatomic, strong) NSMutableArray<SKPaymentTransaction *> *restoredTransactions;

@end
