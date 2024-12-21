#import <React/RCTBridgeModule.h>
#import <UIKit/UIKit.h>

@interface NativeNavigation : NSObject <RCTBridgeModule>
+ (instancetype)sharedInstance;
@end 