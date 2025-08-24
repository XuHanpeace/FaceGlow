# 原生COS模块使用指南

这是一个基于腾讯云COS iOS SDK的原生模块，直接暴露给React Native使用。

## 🚀 特性

- ✅ 原生性能，无JavaScript桥接开销
- ✅ 支持永久密钥和临时密钥
- ✅ 实时上传进度和状态监控
- ✅ 自动文件命名和路径生成
- ✅ 完整的错误处理
- ✅ 事件驱动的上传状态通知

## 📦 安装依赖

### 1. 安装Pods
```bash
cd ios
pod install
```

### 2. 导入模块
```typescript
import nativeCOSService from '../services/nativeCOS';
```

## ⚙️ 配置

### 1. 基本配置
```typescript
const COS_CONFIG = {
  secretId: 'your_secret_id_here',
  secretKey: 'your_secret_key_here',
  bucket: 'your_bucket_name_here',
  region: 'ap-nanjing', // 选择合适的地域
  appId: 'your_app_id_here',
};
```

### 2. 临时密钥配置（推荐）
```typescript
const COS_CONFIG_WITH_TEMP = {
  ...COS_CONFIG,
  tmpSecretId: 'temp_secret_id',
  tmpSecretKey: 'temp_secret_key',
  sessionToken: 'session_token',
};
```

## 🔧 使用方法

### 1. 初始化COS服务
```typescript
import nativeCOSService from '../services/nativeCOS';

const initializeCOS = async () => {
  try {
    const result = await nativeCOSService.initialize(COS_CONFIG);
    console.log('COS服务初始化成功:', result.message);
  } catch (error) {
    console.error('COS服务初始化失败:', error);
  }
};
```

### 2. 上传文件
```typescript
const uploadImage = async (filePath: string, fileName: string) => {
  try {
    const result = await nativeCOSService.uploadFile(filePath, fileName, 'images');
    console.log('上传成功:', result.url);
    return result.url;
  } catch (error) {
    console.error('上传失败:', error);
    return null;
  }
};
```

### 3. 监听上传进度和状态
```typescript
import { useEffect } from 'react';

const UploadComponent = () => {
  useEffect(() => {
    // 监听上传进度
    const progressListener = nativeCOSService.onUploadProgress((progress) => {
      console.log(`文件 ${progress.fileName} 上传进度: ${(progress.progress * 100).toFixed(1)}%`);
    });

    // 监听上传状态
    const stateListener = nativeCOSService.onUploadState((state) => {
      console.log(`文件 ${state.fileName} 状态: ${state.state}`);
    });

    // 监听上传完成
    const completeListener = nativeCOSService.onUploadComplete((result) => {
      if (result.success) {
        console.log(`文件 ${result.fileName} 上传成功:`, result.url);
      } else {
        console.error(`文件 ${result.fileName} 上传失败:`, result.error);
      }
    });

    // 清理监听器
    return () => {
      progressListener.remove();
      stateListener.remove();
      completeListener.remove();
    };
  }, []);

  // 组件内容...
};
```

## 📱 完整示例

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import nativeCOSService from '../services/nativeCOS';

const COS_CONFIG = {
  secretId: 'your_secret_id',
  secretKey: 'your_secret_key',
  bucket: 'myhh',
  region: 'ap-nanjing',
  appId: '1257391807',
};

const COSUploadComponent = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    // 检查初始化状态
    checkInitialization();
    
    // 设置监听器
    const progressListener = nativeCOSService.onUploadProgress((progress) => {
      setUploadProgress(progress.progress);
    });

    const completeListener = nativeCOSService.onUploadComplete((result) => {
      setIsUploading(false);
      if (result.success) {
        Alert.alert('成功', `文件上传成功！\n访问地址: ${result.url}`);
      } else {
        Alert.alert('失败', `上传失败: ${result.error}`);
      }
    });

    return () => {
      progressListener.remove();
      completeListener.remove();
    };
  }, []);

  const checkInitialization = async () => {
    try {
      const initialized = await nativeCOSService.isInitialized();
      setIsInitialized(initialized);
    } catch (error) {
      console.error('检查初始化状态失败:', error);
    }
  };

  const initializeCOS = async () => {
    try {
      await nativeCOSService.initialize(COS_CONFIG);
      setIsInitialized(true);
      Alert.alert('成功', 'COS服务初始化成功');
    } catch (error) {
      Alert.alert('错误', `初始化失败: ${error}`);
    }
  };

  const handleUpload = async () => {
    if (!isInitialized) {
      Alert.alert('错误', '请先初始化COS服务');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // 这里应该获取真实的文件路径
      const filePath = '/path/to/your/file.jpg';
      const fileName = 'test_image.jpg';
      
      await nativeCOSService.uploadFile(filePath, fileName, 'uploads');
    } catch (error) {
      setIsUploading(false);
      Alert.alert('错误', `上传异常: ${error}`);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      {!isInitialized ? (
        <TouchableOpacity onPress={initializeCOS}>
          <Text>初始化COS服务</Text>
        </TouchableOpacity>
      ) : (
        <View>
          <Text style={{ color: 'green', marginBottom: 20 }}>
            ✅ COS服务已初始化
          </Text>
          
          <TouchableOpacity 
            onPress={handleUpload}
            disabled={isUploading}
          >
            <Text>{isUploading ? '上传中...' : '上传文件'}</Text>
          </TouchableOpacity>
          
          {isUploading && (
            <View style={{ marginTop: 20 }}>
              <Text>上传进度: {(uploadProgress * 100).toFixed(1)}%</Text>
              <View style={{ 
                width: '100%', 
                height: 20, 
                backgroundColor: '#f0f0f0', 
                borderRadius: 10,
                overflow: 'hidden'
              }}>
                <View style={{ 
                  width: `${uploadProgress * 100}%`, 
                  height: '100%', 
                  backgroundColor: '#007AFF',
                  borderRadius: 10
                }} />
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

export default COSUploadComponent;
```

## 🔍 API参考

### 方法

- `initialize(config: COSConfig): Promise<COSResponse>` - 初始化COS服务
- `uploadFile(filePath, fileName, folder): Promise<UploadResult>` - 上传文件
- `isInitialized(): Promise<boolean>` - 检查是否已初始化
- `getConfig(): Promise<COSConfig>` - 获取当前配置
- `cleanup(): Promise<COSResponse>` - 清理配置

### 事件监听

- `onUploadProgress(callback)` - 监听上传进度
- `onUploadState(callback)` - 监听上传状态
- `onUploadComplete(callback)` - 监听上传完成

## ⚠️ 注意事项

1. **安全性**: 生产环境强烈建议使用临时密钥
2. **文件路径**: 确保文件路径有效且可访问
3. **网络权限**: 确保应用有网络访问权限
4. **内存管理**: 及时移除事件监听器避免内存泄漏

## 🐛 常见问题

### Q: 初始化失败怎么办？
A: 检查网络连接、API密钥是否正确、存储桶是否存在

### Q: 上传失败怎么办？
A: 检查文件路径、网络状态、存储桶权限配置

### Q: 如何获取临时密钥？
A: 参考腾讯云官方文档实现临时密钥服务

## 📚 相关链接

- [腾讯云COS官方文档](https://cloud.tencent.com/document/product/436)
- [iOS SDK文档](https://cloud.tencent.com/document/product/436/11280)
- [API密钥管理](https://console.cloud.tencent.com/cam/capi)
- [COS控制台](https://console.cloud.tencent.com/cos5)
