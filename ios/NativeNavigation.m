 #import "NativeNavigation.h"
#import "RNViewController.h"

@implementation NativeNavigation

RCT_EXPORT_MODULE(NativeNavigation)

+ (instancetype)sharedInstance {
    static NativeNavigation *instance = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        instance = [[NativeNavigation alloc] init];
    });
    return instance;
}

+ (BOOL)requiresMainQueueSetup {
    return YES;
}

RCT_EXPORT_METHOD(openNewScreen:(NSString *)screenName params:(NSDictionary *)params)
{
    dispatch_async(dispatch_get_main_queue(), ^{
        UIViewController *rootVC = [UIApplication sharedApplication].keyWindow.rootViewController;
        
        // 创建新的 RNViewController
        RNViewController *newVC = [[RNViewController alloc] initWithModuleName:screenName initialProps:params];
        
        // 设置模态展示样式
        newVC.modalPresentationStyle = UIModalPresentationFullScreen;
        
        // 展示新页面
        [rootVC presentViewController:newVC animated:YES completion:nil];
    });
}

RCT_EXPORT_METHOD(closeScreen)
{
    dispatch_async(dispatch_get_main_queue(), ^{
        UIViewController *rootVC = [UIApplication sharedApplication].keyWindow.rootViewController;
        if ([rootVC presentedViewController]) {
            [[rootVC presentedViewController] dismissViewControllerAnimated:YES completion:nil];
        }
    });
}

@end