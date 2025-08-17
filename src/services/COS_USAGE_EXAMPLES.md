# 腾讯云COS上传使用示例

## 🚀 快速开始

### 1. 基本配置

首先在 `src/services/cosConfig.ts` 中配置您的COS信息：

```typescript
export const productionCOSConfig: COSConfig = {
  region: 'ap-guangzhou',                    // 您的存储桶地域
  bucket: 'your-bucket-name-1250000000',     // 您的存储桶名称
  secretId: 'your-secret-id',                // 您的腾讯云API密钥SecretId
  secretKey: 'your-secret-key',              // 您的腾讯云API密钥SecretKey
  cdnDomain: 'your-cdn-domain.com',          // 您的CDN域名
  isHttps: true,
  isDebuggable: false,
};
```

### 2. 在组件中使用

```typescript
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useCOSUpload } from '../hooks/useCOSUpload';

const PhotoUploadComponent = () => {
  const { 
    uploadUserPhoto, 
    uploadState, 
    uploadProgress, 
    uploadResult, 
    isUploading,
    error 
  } = useCOSUpload();

  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // 处理拍照
  const handleTakePhoto = async () => {
    try {
      // 假设您已经获取了拍照的图片URI
      const photoUri = 'file://path/to/photo.jpg';
      setSelectedImage(photoUri);

      const result = await uploadUserPhoto(
        { uri: photoUri, name: 'photo.jpg' }
      );

      if (result.success) {
        console.log('照片上传成功:', result.cdnUrl);
        // 这里可以保存CDN URL到其他地方
      }
    } catch (error) {
      console.error('拍照上传失败:', error);
    }
  };

  // 处理选择照片
  const handleSelectPhoto = async () => {
    try {
      // 假设您已经获取了选择的图片URI
      const photoUri = 'file://path/to/selected.jpg';
      setSelectedImage(photoUri);

      const result = await uploadUserPhoto(
        { uri: photoUri, name: 'selected.jpg' }
      );

      if (result.success) {
        console.log('照片上传成功:', result.cdnUrl);
        // 这里可以保存CDN URL到其他地方
      }
    } catch (error) {
      console.error('选择照片上传失败:', error);
    }
  };

  return (
    <View>
      <TouchableOpacity onPress={handleTakePhoto} disabled={isUploading}>
        <Text>{isUploading ? '上传中...' : '拍照'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleSelectPhoto} disabled={isUploading}>
        <Text>{isUploading ? '上传中...' : '选择照片'}</Text>
      </TouchableOpacity>

      {/* 显示上传进度 */}
      {isUploading && (
        <View>
          <Text>上传进度: {uploadProgress.percentage}%</Text>
          <Text>{uploadProgress.current} / {uploadProgress.total}</Text>
        </View>
      )}

      {/* 显示上传结果 */}
      {uploadResult?.success && (
        <View>
          <Text>上传成功!</Text>
          <Image source={{ uri: uploadResult.cdnUrl }} style={{ width: 200, height: 200 }} />
        </View>
      )}

      {/* 显示错误信息 */}
      {error && (
        <View>
          <Text style={{ color: 'red' }}>上传失败: {error}</Text>
        </View>
      )}
    </View>
  );
};
```

## 📸 拍照上传完整示例

### 1. 集成相机功能

```typescript
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Alert } from 'react-native';
import { launchCamera, launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import { useCOSUpload } from '../hooks/useCOSUpload';

const CameraUploadComponent = () => {
  const { 
    uploadUserPhoto, 
    uploadState, 
    uploadProgress, 
    uploadResult, 
    isUploading,
    error,
    resetUpload 
  } = useCOSUpload();

  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // 拍照
  const takePhoto = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1920,
      maxHeight: 1080,
      includeBase64: false,
    };

    launchCamera(options, (response: ImagePickerResponse) => {
      if (response.didCancel) {
        console.log('用户取消拍照');
      } else if (response.errorCode) {
        Alert.alert('拍照失败', response.errorMessage);
      } else if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        if (asset.uri) {
          setSelectedImage(asset.uri);
          handleUpload(asset.uri, asset.fileName || 'photo.jpg');
        }
      }
    });
  };

  // 选择照片
  const selectPhoto = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1920,
      maxHeight: 1080,
      includeBase64: false,
    };

    launchImageLibrary(options, (response: ImagePickerResponse) => {
      if (response.didCancel) {
        console.log('用户取消选择');
      } else if (response.errorCode) {
        Alert.alert('选择照片失败', response.errorMessage);
      } else if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        if (asset.uri) {
          setSelectedImage(asset.uri);
          handleUpload(asset.uri, asset.fileName || 'selected.jpg');
        }
      }
    });
  };

  // 处理上传
  const handleUpload = async (imageUri: string, fileName: string) => {
    try {
      const result = await uploadUserPhoto(
        { 
          uri: imageUri, 
          name: fileName,
          size: 0, // 可选：文件大小
          type: 'image/jpeg' // 可选：文件类型
        }
      );

      if (result.success) {
        Alert.alert('成功', '照片上传成功！');
        console.log('CDN URL:', result.cdnUrl);
        
        // 这里可以将CDN URL保存到其他地方
        // 或者传递给其他组件使用
      } else {
        Alert.alert('失败', result.errorMessage || '上传失败');
      }
    } catch (error) {
      Alert.alert('错误', '上传过程中发生错误');
      console.error('上传错误:', error);
    }
  };

  // 重新上传
  const retryUpload = () => {
    if (selectedImage) {
      handleUpload(selectedImage, 'retry.jpg');
    }
  };

  // 重置状态
  const handleReset = () => {
    setSelectedImage(null);
    resetUpload();
  };

  return (
    <View style={{ padding: 20 }}>
      {/* 操作按钮 */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 }}>
        <TouchableOpacity 
          onPress={takePhoto} 
          disabled={isUploading}
          style={{ 
            padding: 15, 
            backgroundColor: isUploading ? '#ccc' : '#007AFF',
            borderRadius: 8 
          }}
        >
          <Text style={{ color: 'white', textAlign: 'center' }}>
            {isUploading ? '上传中...' : '📸 拍照'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={selectPhoto} 
          disabled={isUploading}
          style={{ 
            padding: 15, 
            backgroundColor: isUploading ? '#ccc' : '#34C759',
            borderRadius: 8 
          }}
        >
          <Text style={{ color: 'white', textAlign: 'center' }}>
            {isUploading ? '上传中...' : '🖼️ 选择照片'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 选中的图片预览 */}
      {selectedImage && (
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
            选中的图片:
          </Text>
          <Image 
            source={{ uri: selectedImage }} 
            style={{ width: '100%', height: 200, borderRadius: 8 }}
            resizeMode="cover"
          />
        </View>
      )}

      {/* 上传进度 */}
      {isUploading && (
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
            上传进度: {uploadProgress.percentage}%
          </Text>
          <View style={{ 
            width: '100%', 
            height: 20, 
            backgroundColor: '#f0f0f0', 
            borderRadius: 10,
            overflow: 'hidden'
          }}>
            <View style={{ 
              width: `${uploadProgress.percentage}%`, 
              height: '100%', 
              backgroundColor: '#007AFF',
              borderRadius: 10
            }} />
          </View>
          <Text style={{ textAlign: 'center', marginTop: 5 }}>
            {uploadProgress.current} / {uploadProgress.total}
          </Text>
        </View>
      )}

      {/* 上传结果 */}
      {uploadResult?.success && (
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#34C759', marginBottom: 10 }}>
            ✅ 上传成功!
          </Text>
          <Text style={{ marginBottom: 10 }}>
            CDN URL: {uploadResult.cdnUrl}
          </Text>
          <Image 
            source={{ uri: uploadResult.cdnUrl }} 
            style={{ width: '100%', height: 200, borderRadius: 8 }}
            resizeMode="cover"
          />
        </View>
      )}

      {/* 错误信息 */}
      {error && (
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#FF3B30', marginBottom: 10 }}>
            ❌ 上传失败
          </Text>
          <Text style={{ color: '#FF3B30' }}>{error}</Text>
        </View>
      )}

      {/* 操作按钮 */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
        {error && (
          <TouchableOpacity 
            onPress={retryUpload}
            style={{ padding: 15, backgroundColor: '#FF9500', borderRadius: 8 }}
          >
            <Text style={{ color: 'white' }}>🔄 重试</Text>
          </TouchableOpacity>
        )}

        {(uploadResult?.success || error) && (
          <TouchableOpacity 
            onPress={handleReset}
            style={{ padding: 15, backgroundColor: '#8E8E93', borderRadius: 8 }}
          >
            <Text style={{ color: 'white' }}>🔄 重置</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default CameraUploadComponent;
```

## 🔄 换脸结果上传示例

### 1. 上传换脸结果

```typescript
import React from 'react';
import { useCOSUpload } from '../hooks/useCOSUpload';

const FaceSwapUploadComponent = () => {
  const { uploadFaceSwapResult, uploadState, uploadResult } = useCOSUpload();

  const handleFaceSwapResultUpload = async (resultImageUri: string, recordId: string) => {
    try {
      const result = await uploadFaceSwapResult(
        { 
          uri: resultImageUri, 
          name: 'face_swap_result.jpg' 
        },
        recordId
      );

      if (result.success) {
        console.log('换脸结果上传成功:', result.cdnUrl);
        return result.cdnUrl;
      } else {
        throw new Error(result.errorMessage || '上传失败');
      }
    } catch (error) {
      console.error('换脸结果上传失败:', error);
      throw error;
    }
  };

  return (
    <View>
      {/* 组件内容 */}
    </View>
  );
};
```

## 📱 在ControlPanel中集成

### 1. 修改ControlPanel组件

```typescript
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, Dimensions, ActivityIndicator } from 'react-native';
import { useCOSUpload } from '../hooks/useCOSUpload';
import { ImageComparison } from './ImageComparison';

const ControlPanel: React.FC<ControlPanelProps> = ({ selectedTemplate, onUpload, onGenerate }) => {
  const { 
    uploadUserPhoto, 
    uploadState, 
    uploadProgress, 
    uploadResult, 
    isUploading: isUploadingImage,
    error: uploadError 
  } = useCOSUpload();

  const [isLoading, setIsLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [userImage, setUserImage] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  // 处理照片上传
  const handlePhotoUpload = async (imageUri: string) => {
    try {
      setUserImage(imageUri);
      
      // 上传到COS
      const result = await uploadUserPhoto(
        { uri: imageUri, name: 'user_photo.jpg' }
      );

      if (result.success) {
        setUploadedImageUrl(result.cdnUrl!);
        console.log('照片上传成功，CDN URL:', result.cdnUrl);
      } else {
        console.error('照片上传失败:', result.errorMessage);
      }
    } catch (error) {
      console.error('照片上传错误:', error);
    }
  };

  // 处理换脸生成
  const handleGenerate = async () => {
    if (!uploadedImageUrl) {
      console.error('缺少必要参数');
      return;
    }

    try {
      setIsLoading(true);
      setGeneratedImage(null);

      // 调用换脸服务（这里需要您自己的换脸逻辑）
      // const result = await faceSwapService.performFaceSwap(
      //   selectedTemplate.modelId,
      //   uploadedImageUrl // 使用CDN URL
      // );

      // 模拟换脸结果
      setTimeout(() => {
        setGeneratedImage(uploadedImageUrl); // 临时使用原图作为结果
        setIsLoading(false);
      }, 2000);

    } catch (error) {
      console.error('换脸错误:', error);
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* 照片上传区域 */}
      <View style={styles.uploadSection}>
        <Text style={styles.sectionTitle}>上传照片</Text>
        
        {/* 拍照按钮 */}
        <TouchableOpacity 
          onPress={() => onUpload?.('camera')} 
          disabled={isUploadingImage}
          style={[styles.uploadButton, isUploadingImage && styles.uploadButtonDisabled]}
        >
          <Text style={styles.uploadButtonText}>
            {isUploadingImage ? '上传中...' : '📸 拍照'}
          </Text>
        </TouchableOpacity>

        {/* 选择照片按钮 */}
        <TouchableOpacity 
          onPress={() => onUpload?.('gallery')} 
          disabled={isUploadingImage}
          style={[styles.uploadButton, isUploadingImage && styles.uploadButtonDisabled]}
        >
          <Text style={styles.uploadButtonText}>
            {isUploadingImage ? '上传中...' : '🖼️ 选择照片'}
          </Text>
        </TouchableOpacity>

        {/* 上传进度 */}
        {isUploadingImage && (
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              上传进度: {uploadProgress.percentage}%
            </Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${uploadProgress.percentage}%` }
                ]} 
              />
            </View>
          </View>
        )}

        {/* 上传错误 */}
        {uploadError && (
          <Text style={styles.errorText}>上传失败: {uploadError}</Text>
        )}

        {/* 上传成功 */}
        {uploadResult?.success && (
          <Text style={styles.successText}>✅ 照片上传成功!</Text>
        )}
      </View>

      {/* 换脸生成区域 */}
      {uploadedImageUrl && (
        <View style={styles.generateSection}>
          <Text style={styles.sectionTitle}>开始换脸</Text>
          
          <TouchableOpacity 
            onPress={handleGenerate}
            disabled={isLoading || !uploadedImageUrl}
            style={[styles.generateButton, (isLoading || !uploadedImageUrl) && styles.generateButtonDisabled]}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.loadingText}>生成中...</Text>
              </View>
            ) : (
              <Text style={styles.generateButtonText}>开始生成</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* 结果展示区域 */}
      {generatedImage && (
        <View style={styles.resultContainer}>
          <ImageComparison
            beforeImage={uploadedImageUrl || ''}
            afterImage={generatedImage}
            width={600}
            height={400}
          />
        </View>
      )}
    </View>
  );
};
```

## 🔧 配置说明

### 1. 获取腾讯云API密钥

1. 登录腾讯云控制台
2. 访问 [API密钥管理](https://console.cloud.tencent.com/cam/capi)
3. 创建新的SecretId和SecretKey
4. 将密钥信息填入 `cosConfig.ts` 文件

### 2. 创建COS存储桶

1. 访问 [COS控制台](https://console.cloud.tencent.com/cos5)
2. 创建新的存储桶
3. 选择合适的地域和存储类型
4. 记录存储桶名称（格式：bucketname-appid）

### 3. 配置CDN（可选）

1. 访问 [CDN控制台](https://console.cloud.tencent.com/cdn)
2. 添加COS源站
3. 配置加速域名
4. 将域名填入 `cosConfig.ts` 文件

## 📋 注意事项

### 1. 安全性
- 不要在代码中硬编码API密钥
- 考虑使用环境变量或配置文件
- 定期轮换API密钥

### 2. 性能优化
- 目前只支持简单上传，适合中小文件
- 大文件建议先压缩再上传
- 使用CDN加速访问

### 3. 错误处理
- 网络异常重试
- 文件验证失败提示
- 上传进度显示

### 4. 用户体验
- 上传进度条
- 成功/失败状态提示
- 支持取消上传

## 🚀 下一步计划

### 1. 分块上传支持
- 实现大文件分块上传
- 支持断点续传
- 并发上传优化

### 2. 文件处理
- 图片压缩和格式转换
- 水印添加
- 缩略图生成

### 3. 批量操作
- 批量上传优化
- 批量删除
- 批量下载

现在您可以在拍照和选择照片成功后，自动调用COS上传模块，获取CDN资源地址了！整个流程完全基于官方SDK，无需云函数支持。
