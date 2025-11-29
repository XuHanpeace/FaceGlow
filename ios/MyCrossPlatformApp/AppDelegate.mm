#import "AppDelegate.h"
#import "RCTPushy.h"

#import <React/RCTBundleURLProvider.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.moduleName = @"FaceGlow";
  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  // 设置初始属性
  self.initialProps = @{@"isMainApp": @YES};

  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleURL];
}

- (NSURL *)bundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [RCTPushy bundleURL];
#endif
}

@end
