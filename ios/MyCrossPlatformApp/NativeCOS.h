#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <QCloudCOSXML/QCloudCOSXML.h>

@interface NativeCOS : RCTEventEmitter <RCTBridgeModule, QCloudSignatureProvider>

@end
