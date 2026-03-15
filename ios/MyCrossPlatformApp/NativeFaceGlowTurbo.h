#import <Foundation/Foundation.h>

#ifdef RCT_NEW_ARCH_ENABLED
#if __has_include(<FaceGlowSpecs/FaceGlowSpecs.h>)
#import <FaceGlowSpecs/FaceGlowSpecs.h>
#else
@protocol NativeFaceGlowTurboSpec <NSObject>
@end
#endif
#endif

#ifdef RCT_NEW_ARCH_ENABLED
@interface NativeFaceGlowTurbo : NSObject <NativeFaceGlowTurboSpec>
#else
#import <React/RCTBridgeModule.h>
@interface NativeFaceGlowTurbo : NSObject <RCTBridgeModule>
#endif

@end
