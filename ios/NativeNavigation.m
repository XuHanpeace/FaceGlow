#import "NativeNavigation.h"
#import <React/RCTRootView.h>
#import <React/RCTBridge.h>
#import <React/RCTBundleURLProvider.h>

@interface NativeNavigation()
@property (nonatomic, weak) RCTBridge *bridge;
@end

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

- (void)setBridge:(RCTBridge *)bridge {
    _bridge = bridge;
}

RCT_EXPORT_METHOD(openNewScreen:(NSString *)screenName params:(NSDictionary *)params)
{
    NSLog(@"[NativeNavigation] Opening new screen: %@ with params: %@", screenName, params);
    
    dispatch_async(dispatch_get_main_queue(), ^{
        if (!self.bridge) {
            NSLog(@"[NativeNavigation] Error: Bridge is nil!");
            return;
        }
        
        UIViewController *rootViewController = [UIApplication sharedApplication].delegate.window.rootViewController;
        NSLog(@"[NativeNavigation] Root ViewController: %@", rootViewController);

        // 创建 RCTRootView 并设置初始属性
        RCTRootView *rootView = [[RCTRootView alloc]
            initWithBridge:self.bridge
            moduleName:screenName
            initialProperties:params];
            
        if (!rootView) {
            NSLog(@"[NativeNavigation] Error: Failed to create RCTRootView");
            return;
        }
        
        // 设置背景色和调试标识
        rootView.backgroundColor = [UIColor blackColor];
        rootView.accessibilityIdentifier = [NSString stringWithFormat:@"RCTRootView_%@", screenName];
        
        NSLog(@"[NativeNavigation] Successfully created RCTRootView for module: %@", screenName);
        NSLog(@"[NativeNavigation] RCTRootView properties: %@", rootView.appProperties);

        // 创建承载 RCTRootView 的视图控制器
        UIViewController *newController = [[UIViewController alloc] init];
        newController.view = rootView;
        newController.modalPresentationStyle = UIModalPresentationFullScreen;
        
        // 设置视图控制器的标题（可选）
        newController.title = screenName;

        if ([rootViewController isKindOfClass:[UINavigationController class]]) {
            NSLog(@"[NativeNavigation] Pushing view controller to navigation stack");
            [(UINavigationController *)rootViewController pushViewController:newController animated:YES];
        } else {
            NSLog(@"[NativeNavigation] Presenting view controller modally with navigation controller");
            UINavigationController *navController = [[UINavigationController alloc] initWithRootViewController:newController];
            [rootViewController presentViewController:navController animated:YES completion:^{
                NSLog(@"[NativeNavigation] New screen presentation completed");
                // 验证视图是否正确加载
                if ([newController.view.subviews count] > 0) {
                    NSLog(@"[NativeNavigation] View hierarchy: %@", newController.view.subviews);
                } else {
                    NSLog(@"[NativeNavigation] Warning: No subviews found in the new controller");
                }
            }];
        }
    });
}

RCT_EXPORT_METHOD(closeScreen)
{
    dispatch_async(dispatch_get_main_queue(), ^{
        UIViewController *rootVC = [UIApplication sharedApplication].keyWindow.rootViewController;
        
        // 获取当前的 UINavigationController
        UINavigationController *navController;
        
        if ([rootVC isKindOfClass:[UINavigationController class]]) {
            navController = (UINavigationController *)rootVC;
        } else if ([rootVC.presentedViewController isKindOfClass:[UINavigationController class]]) {
            navController = (UINavigationController *)rootVC.presentedViewController;
        }
        
        if (navController) {
            if (navController.viewControllers.count > 1) {
                // 如果导航栈中有多个页面，执行 pop 操作
                [navController popViewControllerAnimated:YES];
            } else {
                // 如果只有一个页面，关闭整个导航控制器
                [navController dismissViewControllerAnimated:YES completion:nil];
            }
        } else if ([rootVC presentedViewController]) {
            // 降级处理：如果没有导航控制器，直接关闭模态视图
            [[rootVC presentedViewController] dismissViewControllerAnimated:YES completion:nil];
        }
    });
}

@end
