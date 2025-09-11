#import <React/RCTBridgeModule.h>
#import <StoreKit/StoreKit.h>

@interface ApplePayModule : NSObject <RCTBridgeModule, SKProductsRequestDelegate, SKPaymentTransactionObserver>

@property (nonatomic, strong) RCTPromiseResolveBlock resolveBlock;
@property (nonatomic, strong) RCTPromiseRejectBlock rejectBlock;
@property (nonatomic, strong) NSString *pendingProductId;
@property (nonatomic, assign) BOOL isRestoring;

@end
