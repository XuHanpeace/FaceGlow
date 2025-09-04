#import <React/RCTBridgeModule.h>
#import <StoreKit/StoreKit.h>

@interface ApplePayModule : NSObject <RCTBridgeModule, SKProductsRequestDelegate, SKPaymentTransactionObserver>

@end
