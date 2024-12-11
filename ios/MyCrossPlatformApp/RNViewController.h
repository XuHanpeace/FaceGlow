#import <UIKit/UIKit.h>
#import <React/RCTBridgeDelegate.h>

@interface RNViewController : UIViewController <RCTBridgeDelegate>

@property (nonatomic, copy) NSString *moduleName;
@property (nonatomic, strong) NSDictionary *initialProps;

- (instancetype)initWithModuleName:(NSString *)moduleName initialProps:(NSDictionary *)props;

@end 