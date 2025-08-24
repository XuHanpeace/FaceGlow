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
    return @[@"onUploadProgress", @"onUploadState", @"onUploadComplete"];
}

// 初始化COS服务
RCT_EXPORT_METHOD(initializeCOS:(NSDictionary *)config
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    @try {
        NSString *secretId = config[@"secretId"];
        NSString *secretKey = config[@"secretKey"];
        NSString *region = config[@"region"];
        
        if (!secretId || !secretKey || !region) {
            reject(@"INVALID_CONFIG", @"Missing required configuration parameters", nil);
            return;
        }
        
        // 创建COS服务配置
        QCloudServiceConfiguration *configuration = [QCloudServiceConfiguration new];
        QCloudCOSXMLEndPoint *endpoint = [[QCloudCOSXMLEndPoint alloc] init];
        endpoint.regionName = region;
        endpoint.useHTTPS = YES;
        configuration.endpoint = endpoint;
        
        // 设置认证信息
        QCloudCredential *credential = [QCloudCredential new];
        credential.secretID = secretId;
        credential.secretKey = secretKey;
        configuration.credential = credential;
        
        // 注册默认COS服务
        [QCloudCOSXMLService registerDefaultCOSXMLWithConfiguration:configuration];
        [QCloudCOSTransferMangerService registerDefaultCOSTransferMangerWithConfiguration:configuration];
        
        // 存储配置信息
        [[NSUserDefaults standardUserDefaults] setObject:config forKey:@"COS_CONFIG"];
        [[NSUserDefaults standardUserDefaults] synchronize];
        
        resolve(@{@"success": @YES, @"message": @"COS service initialized successfully"});
        
    } @catch (NSException *exception) {
        reject(@"INIT_ERROR", exception.reason, nil);
    }
}

// 上传文件
RCT_EXPORT_METHOD(uploadFile:(NSString *)filePath
                  fileName:(NSString *)fileName
                  folder:(NSString *)folder
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    
    @try {
        // 获取配置
        NSDictionary *config = [[NSUserDefaults standardUserDefaults] objectForKey:@"COS_CONFIG"];
        if (!config) {
            reject(@"NOT_INITIALIZED", @"COS service not initialized", nil);
            return;
        }
        
        NSString *bucket = config[@"bucket"];
        NSString *appId = config[@"appId"];
        NSString *region = config[@"region"];
        
        if (!bucket || !appId) {
            reject(@"INVALID_CONFIG", @"Missing bucket or appId configuration", nil);
            return;
        }
        
        // 生成文件Key
        NSString *fileKey = [self generateFileKey:fileName folder:folder];
        
        // 创建上传请求
        QCloudCOSXMLUploadObjectRequest *put = [QCloudCOSXMLUploadObjectRequest new];
        put.bucket = [NSString stringWithFormat:@"%@-%@", bucket, appId];
        put.object = fileKey;
        put.body = [NSURL fileURLWithPath:filePath];
        
        // 设置临时密钥（如果配置了）
        if (config[@"tmpSecretId"] && config[@"tmpSecretKey"] && config[@"sessionToken"]) {
            QCloudCredential *credential = [QCloudCredential new];
            credential.secretID = config[@"tmpSecretId"];
            credential.secretKey = config[@"tmpSecretKey"];
            credential.token = config[@"sessionToken"];
            put.credential = credential;
        }
        
        // 监听上传进度
        [put setSendProcessBlock:^(int64_t bytesSent, int64_t totalBytesSent, int64_t totalBytesExpectedToSend) {
            float progress = (float)totalBytesSent / (float)totalBytesExpectedToSend;
            [self sendEventWithName:@"onUploadProgress" body:@{
                @"filePath": filePath,
                @"fileName": fileName,
                @"progress": @(progress),
                @"bytesSent": @(totalBytesSent),
                @"totalBytes": @(totalBytesExpectedToSend)
            }];
        }];
        
        // 监听上传状态
        [put setInitMultipleUploadFinishBlock:^(QCloudInitiateMultipartUploadResult *multipleUploadInitResult, NSString *bucket, NSString *object) {
            [self sendEventWithName:@"onUploadState" body:@{
                @"filePath": filePath,
                @"fileName": fileName,
                @"state": @"INITIATED",
                @"uploadId": multipleUploadInitResult.uploadId ?: @""
            }];
        }];
        
        // 监听上传完成
        [put setFinishBlock:^(QCloudUploadObjectResult *result, NSError *error) {
            if (error) {
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
        
        // 开始上传
        [[QCloudCOSTransferMangerService defaultCOSTransferManager] UploadObject:put];
        
    } @catch (NSException *exception) {
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
    resolve(@{@"initialized": @(config != nil)});
}

// 获取当前配置
RCT_EXPORT_METHOD(getConfig:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    NSDictionary *config = [[NSUserDefaults standardUserDefaults] objectForKey:@"COS_CONFIG"];
    if (config) {
        resolve(config);
    } else {
        reject(@"NOT_INITIALIZED", @"COS service not initialized", nil);
    }
}

// 清理配置
RCT_EXPORT_METHOD(cleanup:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    [[NSUserDefaults standardUserDefaults] removeObjectForKey:@"COS_CONFIG"];
    [[NSUserDefaults standardUserDefaults] synchronize];
    resolve(@{@"success": @YES, @"message": @"COS configuration cleaned up"});
}

@end
