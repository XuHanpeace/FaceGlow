#import "NativeCOS.h"
#import <QCloudCOSXML/QCloudCOSXML.h>

@implementation NativeCOS

RCT_EXPORT_MODULE();

- (instancetype)init {
    self = [super init];
    if (self) {
        // 确保事件发射器正确初始化
    }
    return self;
}

- (NSArray<NSString *> *)supportedEvents {
    return @[@"onUploadProgress", @"onUploadComplete"];
}

// 初始化COS服务
RCT_EXPORT_METHOD(initializeCOS:(NSDictionary *)config
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    NSLog(@"🔵 [NativeCOS] initializeCOS called with config: %@", config);
    
    @try {
        // 检查是否为重新初始化
        NSDictionary *existingConfig = [[NSUserDefaults standardUserDefaults] objectForKey:@"COS_CONFIG"];
        if (existingConfig) {
            NSLog(@"🔵 [NativeCOS] Re-initializing COS service - cleaning up existing configuration");
            
            // 清理旧的配置和服务
            [self cleanupExistingServices];
        }
        
        NSString *secretId = config[@"secretId"];
        NSString *secretKey = config[@"secretKey"];
        NSString *region = config[@"region"];
        NSString *appId = config[@"appId"];
        NSString *bucket = config[@"bucket"];
        
        NSLog(@"🔵 [NativeCOS] Parsed config:");
        NSLog(@"  - secretId: %@", secretId ? @"[SET]" : @"[MISSING]");
        NSLog(@"  - secretKey: %@", secretKey ? @"[SET]" : @"[MISSING]");
        NSLog(@"  - region: %@", region ?: @"[MISSING]");
        NSLog(@"  - appId: %@", appId ?: @"[MISSING]");
        NSLog(@"  - bucket: %@", bucket ?: @"[MISSING]");
        
        if (!secretId || !secretKey || !region || !appId || !bucket) {
            NSLog(@"❌ [NativeCOS] Missing required configuration parameters");
            NSString *missingParams = @"";
            if (!secretId) missingParams = [missingParams stringByAppendingString:@"secretId "];
            if (!secretKey) missingParams = [missingParams stringByAppendingString:@"secretKey "];
            if (!region) missingParams = [missingParams stringByAppendingString:@"region "];
            if (!appId) missingParams = [missingParams stringByAppendingString:@"appId "];
            if (!bucket) missingParams = [missingParams stringByAppendingString:@"bucket "];
            NSLog(@"❌ [NativeCOS] Missing parameters: %@", missingParams);
            reject(@"INVALID_CONFIG", [NSString stringWithFormat:@"Missing required configuration parameters: %@", missingParams], nil);
            return;
        }
        
        NSLog(@"🔵 [NativeCOS] Creating COS service configuration...");
        
        // 创建COS服务配置
        QCloudServiceConfiguration *configuration = [QCloudServiceConfiguration new];
        
        // 关键：设置appID（这是官方AI指出的关键问题）
        if (appId) {
            configuration.appID = appId;
            NSLog(@"🔵 [NativeCOS] AppID set to: %@", configuration.appID);
        } else {
            NSLog(@"❌ [NativeCOS] Warning: appId not found in config");
        }
        
        QCloudCOSXMLEndPoint *endpoint = [[QCloudCOSXMLEndPoint alloc] init];
        endpoint.regionName = region;
        
        // 从配置中读取HTTPS设置，默认为YES
        BOOL useHTTPS = YES;
        if (config[@"useHTTPS"] != nil) {
            useHTTPS = [config[@"useHTTPS"] boolValue];
        }
        endpoint.useHTTPS = useHTTPS;
        
        NSLog(@"🔵 [NativeCOS] Endpoint configured - region: %@, useHTTPS: %@", endpoint.regionName, useHTTPS ? @"YES" : @"NO");
        
        // 设置超时时间（如果配置了）
        if (config[@"timeoutInterval"]) {
            configuration.timeoutInterval = [config[@"timeoutInterval"] doubleValue];
            NSLog(@"🔵 [NativeCOS] Timeout set to: %f seconds", configuration.timeoutInterval);
        }
        
        // 设置签名提供者（当前类实现QCloudSignatureProvider协议）
        configuration.signatureProvider = self;
        NSLog(@"🔵 [NativeCOS] Signature provider set to self");
        
        configuration.endpoint = endpoint;
        
        NSLog(@"🔵 [NativeCOS] Registering default COS services...");
        
        // 注册默认COS服务
        [QCloudCOSXMLService registerDefaultCOSXMLWithConfiguration:configuration];
        [QCloudCOSTransferMangerService registerDefaultCOSTransferMangerWithConfiguration:configuration];
        
        NSLog(@"🔵 [NativeCOS] COS services registered successfully");
        
        // 存储配置信息
        [[NSUserDefaults standardUserDefaults] setObject:config forKey:@"COS_CONFIG"];
        [[NSUserDefaults standardUserDefaults] synchronize];
        
        NSLog(@"🔵 [NativeCOS] Configuration saved to NSUserDefaults");
        
        resolve(@{@"success": @YES, @"message": @"COS service initialized successfully"});
        
        NSLog(@"✅ [NativeCOS] initializeCOS completed successfully");
        
    } @catch (NSException *exception) {
        NSLog(@"❌ [NativeCOS] initializeCOS failed with exception: %@", exception.reason);
        reject(@"INIT_ERROR", exception.reason, nil);
    }
}

// 上传文件
RCT_EXPORT_METHOD(uploadFile:(NSString *)filePath
                  fileName:(NSString *)fileName
                  folder:(NSString *)folder
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    
    NSLog(@"🔵 [NativeCOS] uploadFile called with:");
    NSLog(@"  - filePath: %@", filePath);
    NSLog(@"  - fileName: %@", fileName);
    NSLog(@"  - folder: %@", folder);
    
    @try {
        // 获取配置
        NSDictionary *config = [[NSUserDefaults standardUserDefaults] objectForKey:@"COS_CONFIG"];
        NSLog(@"🔵 [NativeCOS] Retrieved config from NSUserDefaults: %@", config);
        
        if (!config) {
            NSLog(@"❌ [NativeCOS] COS service not initialized - no config found");
            reject(@"NOT_INITIALIZED", @"COS service not initialized", nil);
            return;
        }
        
        NSString *bucket = config[@"bucket"];
        NSString *appId = config[@"appId"];
        NSString *region = config[@"region"];
        
        NSLog(@"🔵 [NativeCOS] Parsed config - bucket: %@, appId: %@, region: %@", bucket, appId, region);
        
        if (!bucket || !appId || !region) {
            NSLog(@"❌ [NativeCOS] Missing bucket, appId, or region configuration");
            NSString *missingParams = @"";
            if (!bucket) missingParams = [missingParams stringByAppendingString:@"bucket "];
            if (!appId) missingParams = [missingParams stringByAppendingString:@"appId "];
            if (!region) missingParams = [missingParams stringByAppendingString:@"region "];
            NSLog(@"❌ [NativeCOS] Missing parameters: %@", missingParams);
            reject(@"INVALID_CONFIG", [NSString stringWithFormat:@"Missing required configuration: %@", missingParams], nil);
            return;
        }
        
        // 生成文件Key
        NSString *fileKey = [self generateFileKey:fileName folder:folder];
        NSLog(@"🔵 [NativeCOS] Generated fileKey: %@", fileKey);
        
        // 创建上传请求
        QCloudCOSXMLUploadObjectRequest *put = [QCloudCOSXMLUploadObjectRequest new];
        put.bucket = [NSString stringWithFormat:@"%@-%@", bucket, appId];
        put.object = fileKey;
        
        NSLog(@"🔵 [NativeCOS] Created upload request - bucket: %@, object: %@", put.bucket, put.object);
        
        // 处理文件路径，移除 file:// 前缀
        NSString *cleanFilePath = filePath;
        if ([filePath hasPrefix:@"file://"]) {
            cleanFilePath = [filePath substringFromIndex:7];
            NSLog(@"🔵 [NativeCOS] Cleaned file path: %@ -> %@", filePath, cleanFilePath);
        }
        
        // 检查文件是否存在
        NSFileManager *fileManager = [NSFileManager defaultManager];
        if (![fileManager fileExistsAtPath:cleanFilePath]) {
            NSLog(@"❌ [NativeCOS] File not found at path: %@", cleanFilePath);
            reject(@"FILE_NOT_FOUND", [NSString stringWithFormat:@"File not found at path: %@", cleanFilePath], nil);
            return;
        }
        
        NSLog(@"🔵 [NativeCOS] File exists at path: %@", cleanFilePath);
        
        put.body = [NSURL fileURLWithPath:cleanFilePath];
        
        NSLog(@"🔵 [NativeCOS] About to set up progress and completion blocks...");
        
        // 监听上传进度
        [put setSendProcessBlock:^(int64_t bytesSent, int64_t totalBytesSent, int64_t totalBytesExpectedToSend) {
            float progress = (float)totalBytesSent / (float)totalBytesExpectedToSend;
            NSLog(@"🔵 [NativeCOS] Upload progress: %.2f%% (%lld/%lld bytes)", progress * 100, totalBytesSent, totalBytesExpectedToSend);
            [self sendEventWithName:@"onUploadProgress" body:@{
                @"filePath": filePath,
                @"fileName": fileName,
                @"progress": @(progress),
                @"bytesSent": @(totalBytesSent),
                @"totalBytes": @(totalBytesExpectedToSend)
            }];
        }];
        
        // 监听上传完成
        [put setFinishBlock:^(QCloudUploadObjectResult *result, NSError *error) {
            if (error) {
                NSLog(@"❌ [NativeCOS] Upload failed with error: %@", error.localizedDescription);
                [self sendEventWithName:@"onUploadComplete" body:@{
                    @"filePath": filePath,
                    @"fileName": fileName,
                    @"success": @NO,
                    @"error": error.localizedDescription
                }];
                reject(@"UPLOAD_ERROR", error.localizedDescription, error);
            } else {
                NSString *fileUrl = [NSString stringWithFormat:@"https://%@-%@.cos.%@.myqcloud.com/%@", 
                                   bucket, appId, region, fileKey];
                
                NSLog(@"✅ [NativeCOS] Upload completed successfully:");
                NSLog(@"  - fileUrl: %@", fileUrl);
                NSLog(@"  - etag: %@", result.eTag ?: @"[NO_ETAG]");
                NSLog(@"  - fileKey: %@", fileKey);
                
                [self sendEventWithName:@"onUploadComplete" body:@{
                    @"filePath": filePath,
                    @"fileName": fileName,
                    @"success": @YES,
                    @"url": fileUrl,
                    @"etag": result.eTag ?: @"",
                    @"fileKey": fileKey
                }];
                
                resolve(@{
                    @"success": @YES,
                    @"url": fileUrl,
                    @"etag": result.eTag ?: @"",
                    @"fileKey": fileKey
                });
            }
        }];
        
        NSLog(@"🔵 [NativeCOS] Starting upload with QCloudCOSTransferMangerService...");
        
        // 开始上传
        [[QCloudCOSTransferMangerService defaultCOSTransferManager] UploadObject:put];
        
        NSLog(@"🔵 [NativeCOS] Upload request submitted to transfer manager");
        
    } @catch (NSException *exception) {
        NSLog(@"❌ [NativeCOS] Upload failed with exception: %@", exception.reason);
        reject(@"UPLOAD_ERROR", exception.reason, nil);
    }
}

// 生成文件Key
- (NSString *)generateFileKey:(NSString *)fileName folder:(NSString *)folder {
    NSTimeInterval timestamp = [[NSDate date] timeIntervalSince1970] * 1000;
    NSString *randomStr = [self randomStringWithLength:6];
    NSString *extension = [fileName pathExtension];
    if (!extension || extension.length == 0) {
        extension = @"jpg";
    }
    
    return [NSString stringWithFormat:@"%@/%lld_%@.%@", folder, (long long)timestamp, randomStr, extension];
}

// 生成随机字符串
- (NSString *)randomStringWithLength:(NSInteger)length {
    NSString *letters = @"abcdefghijklmnopqrstuvwxyz0123456789";
    NSMutableString *randomString = [NSMutableString stringWithCapacity:length];
    
    for (int i = 0; i < length; i++) {
        uint32_t rand = arc4random_uniform((uint32_t)[letters length]);
        [randomString appendFormat:@"%C", [letters characterAtIndex:rand]];
    }
    
    return randomString;
}

// 检查COS服务是否已初始化
RCT_EXPORT_METHOD(isInitialized:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    NSDictionary *config = [[NSUserDefaults standardUserDefaults] objectForKey:@"COS_CONFIG"];
    NSLog(@"🔵 [NativeCOS] isInitialized called - config exists: %@", config ? @"YES" : @"NO");
    resolve(@{@"initialized": @(config != nil)});
}

// 获取当前配置
RCT_EXPORT_METHOD(getConfig:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    NSDictionary *config = [[NSUserDefaults standardUserDefaults] objectForKey:@"COS_CONFIG"];
    NSLog(@"🔵 [NativeCOS] getConfig called - config: %@", config);
    if (config) {
        resolve(config);
    } else {
        NSLog(@"❌ [NativeCOS] getConfig failed - no config found");
        reject(@"NOT_INITIALIZED", @"COS service not initialized", nil);
    }
}

// 清理配置
RCT_EXPORT_METHOD(cleanup:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    NSLog(@"🔵 [NativeCOS] cleanup called - removing COS config");
    [[NSUserDefaults standardUserDefaults] removeObjectForKey:@"COS_CONFIG"];
    [[NSUserDefaults standardUserDefaults] synchronize];
    NSLog(@"✅ [NativeCOS] cleanup completed - COS config removed");
    resolve(@{@"success": @YES, @"message": @"COS configuration cleaned up"});
}

// 重新初始化COS服务
RCT_EXPORT_METHOD(reinitializeCOS:(NSDictionary *)config
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    NSLog(@"🔵 [NativeCOS] reinitializeCOS called - forcing re-initialization");
    
    @try {
        // 强制清理现有服务
        [self cleanupExistingServices];
        
        // 等待一小段时间确保清理完成
        [NSThread sleepForTimeInterval:0.1];
        
        // 重新初始化
        [self initializeCOS:config resolver:resolve rejecter:reject];
        
    } @catch (NSException *exception) {
        NSLog(@"❌ [NativeCOS] reinitializeCOS failed with exception: %@", exception.reason);
        reject(@"REINIT_ERROR", exception.reason, nil);
    }
}

// 清理旧的COS服务注册
- (void)cleanupExistingServices {
    NSLog(@"🔵 [NativeCOS] Cleaning up existing COS services...");
    
    // 注意：腾讯云COS SDK没有直接的注销方法
    // 我们通过重新注册来覆盖之前的配置
    NSLog(@"🔵 [NativeCOS] Note: COS SDK doesn't provide unregister methods, will override on re-registration");
    
    // 清理NSUserDefaults中的配置
    [[NSUserDefaults standardUserDefaults] removeObjectForKey:@"COS_CONFIG"];
    [[NSUserDefaults standardUserDefaults] synchronize];
    NSLog(@"🔵 [NativeCOS] COS config removed from NSUserDefaults.");
}

#pragma mark - QCloudSignatureProvider

// 实现QCloudSignatureProvider协议方法
- (void)signatureWithFields:(QCloudSignatureFields *)fields
                     request:(QCloudBizHTTPRequest *)request
                  urlRequest:(NSMutableURLRequest *)urlRequest
                   compelete:(void(^)(QCloudSignature *signature, NSError *error))complete {
    
    NSLog(@"🔵 [NativeCOS] signatureWithFields called");
    NSLog(@"  - fields: %@", fields);
    NSLog(@"  - request class: %@", NSStringFromClass([request class]));
    NSLog(@"  - urlRequest URL: %@", urlRequest.URL);
    NSLog(@"  - urlRequest method: %@", urlRequest.HTTPMethod);
    
    // 获取配置
    NSDictionary *config = [[NSUserDefaults standardUserDefaults] objectForKey:@"COS_CONFIG"];
    NSLog(@"🔵 [NativeCOS] Config from NSUserDefaults in signature method: %@", config);
    
    if (!config) {
        NSLog(@"❌ [NativeCOS] No config found in signature method");
        NSError *error = [NSError errorWithDomain:@"NativeCOS" code:-1 userInfo:@{NSLocalizedDescriptionKey: @"COS service not initialized"}];
        complete(nil, error);
        return;
    }
    
    NSString *secretId = config[@"secretId"];
    NSString *secretKey = config[@"secretKey"];
    
    NSLog(@"🔵 [NativeCOS] Using credentials - secretId: %@, secretKey: %@", 
          secretId ? @"[SET]" : @"[MISSING]", 
          secretKey ? @"[SET]" : @"[MISSING]");
    
    if (!secretId || !secretKey) {
        NSLog(@"❌ [NativeCOS] Missing secretId or secretKey in signature method");
        NSError *error = [NSError errorWithDomain:@"NativeCOS" code:-1 userInfo:@{NSLocalizedDescriptionKey: @"Missing secretId or secretKey"}];
        complete(nil, error);
        return;
    }
    
    NSLog(@"🔵 [NativeCOS] Creating credential and signature...");
    
    // 创建签名
    QCloudCredential *credential = [QCloudCredential new];
    credential.secretID = secretId;
    credential.secretKey = secretKey;
    
    // 创建签名提供者
    QCloudAuthentationV5Creator *creator = [[QCloudAuthentationV5Creator alloc] initWithCredential:credential];
    QCloudSignature *signature = [creator signatureForData:urlRequest];
    
    NSLog(@"🔵 [NativeCOS] Signature created successfully: %@", signature);
    
    complete(signature, nil);
}

@end
