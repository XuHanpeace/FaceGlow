#import "RNViewController.h"
#import <React/RCTBridge.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>

@interface RNViewController ()
@property (nonatomic, strong) RCTBridge *bridge;
@end

@implementation RNViewController

- (instancetype)initWithModuleName:(NSString *)moduleName initialProps:(NSDictionary *)props {
    if (self = [super init]) {
        self.moduleName = moduleName;
        self.initialProps = props;
    }
    return self;
}

- (void)viewDidLoad {
    [super viewDidLoad];
    
    self.bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:nil];
    RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:self.bridge
                                                    moduleName:self.moduleName
                                             initialProperties:self.initialProps];
    
    self.view = rootView;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge {
#if DEBUG
    return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
    return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

@end 