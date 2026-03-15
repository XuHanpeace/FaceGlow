#import "NativeFaceGlowTurbo.h"
#import <React/RCTLog.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import <ReactCommon/RCTTurboModule.h>
#endif

@implementation NativeFaceGlowTurbo

RCT_EXPORT_MODULE(NativeFaceGlowTurbo)

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(getDeviceUptimeMsSync)
{
  NSTimeInterval uptime = [NSProcessInfo processInfo].systemUptime * 1000.0;
  return @(uptime);
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(echoSync:(NSString *)value)
{
  if (value == nil) {
    return @"";
  }
  return value;
}

RCT_EXPORT_METHOD(measureLoopAsync:(nonnull NSNumber *)iterations
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  @try {
    NSInteger loops = MAX(0, [iterations integerValue]);
    CFAbsoluteTime start = CFAbsoluteTimeGetCurrent();
    volatile NSInteger sink = 0;
    for (NSInteger i = 0; i < loops; i++) {
      sink += (i % 7);
    }
    CFAbsoluteTime end = CFAbsoluteTimeGetCurrent();
    NSNumber *elapsedMs = @((end - start) * 1000.0);
    (void)sink;
    resolve(elapsedMs);
  } @catch (NSException *exception) {
    reject(@"NATIVE_TURBO_ERROR", exception.reason, nil);
  }
}

#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
#if __has_include(<FaceGlowSpecs/FaceGlowSpecs.h>)
  return std::make_shared<facebook::react::NativeFaceGlowTurboSpecJSI>(params);
#else
  RCTLogWarn(@"[NativeFaceGlowTurbo] FaceGlowSpecs codegen header not found.");
  return nullptr;
#endif
}
#endif

@end
