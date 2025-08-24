# 权限配置说明

## 概述

本应用需要以下权限来支持拍照和相册选择功能：

- **相机权限**: 用于拍照功能
- **相册权限**: 用于从相册选择图片
- **存储权限**: 用于保存和访问图片文件

## iOS 权限配置

### 1. 在 Info.plist 中添加权限描述

在 `ios/MyCrossPlatformApp/Info.plist` 文件中添加以下权限描述：

```xml
<key>NSCameraUsageDescription</key>
<string>此应用需要访问相机来拍摄照片并上传到云端</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>此应用需要访问相册来选择照片并上传到云端</string>

<key>NSPhotoLibraryAddUsageDescription</key>
<string>此应用需要访问相册来保存照片</string>
```

### 2. 权限配置示例

完整的权限配置示例：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <!-- 其他配置... -->
    
    <!-- 相机权限 -->
    <key>NSCameraUsageDescription</key>
    <string>此应用需要访问相机来拍摄照片并上传到云端</string>
    
    <!-- 相册读取权限 -->
    <key>NSPhotoLibraryUsageDescription</key>
    <string>此应用需要访问相册来选择照片并上传到云端</string>
    
    <!-- 相册写入权限 -->
    <key>NSPhotoLibraryAddUsageDescription</key>
    <string>此应用需要访问相册来保存照片</string>
    
    <!-- 其他配置... -->
</dict>
</plist>
```

## Android 权限配置

### 1. 在 AndroidManifest.xml 中添加权限

在 `android/app/src/main/AndroidManifest.xml` 文件中添加以下权限：

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.mycrossplatformapp">

    <!-- 相机权限 -->
    <uses-permission android:name="android.permission.CAMERA" />
    
    <!-- 读取外部存储权限 -->
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    
    <!-- 写入外部存储权限 -->
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    
    <!-- 网络权限 -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    
    <!-- 相机硬件特性 -->
    <uses-feature android:name="android.hardware.camera" android:required="false" />
    <uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />

    <application
        android:name=".MainApplication"
        android:label="@string/app_name"
        android:icon="@mipmap/ic_launcher"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:allowBackup="false"
        android:theme="@style/AppTheme">
        
        <!-- 其他配置... -->
        
    </application>
</manifest>
```

### 2. Android 13+ (API 33+) 权限配置

对于 Android 13 及以上版本，需要添加更细粒度的权限：

```xml
<!-- Android 13+ 图片权限 -->
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />

<!-- Android 13+ 视频权限（如果需要） -->
<uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />

<!-- Android 13+ 音频权限（如果需要） -->
<uses-permission android:name="android.permission.READ_MEDIA_AUDIO" />
```

### 3. 权限请求代码

在 Android 中，您可能需要在运行时请求权限。建议在应用启动时或使用相关功能前请求权限：

```typescript
import { PermissionsAndroid, Platform } from 'react-native';

const requestPermissions = async () => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      ]);
      
      if (granted['android.permission.CAMERA'] === PermissionsAndroid.RESULTS.GRANTED &&
          granted['android.permission.READ_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('所有权限已授予');
      } else {
        console.log('部分权限被拒绝');
      }
    } catch (err) {
      console.warn(err);
    }
  }
};
```

## 权限说明

### 相机权限 (NSCameraUsageDescription / android.permission.CAMERA)
- **用途**: 允许应用访问设备摄像头
- **何时使用**: 用户点击拍照按钮时
- **用户提示**: 系统会显示权限请求对话框

### 相册权限 (NSPhotoLibraryUsageDescription / android.permission.READ_EXTERNAL_STORAGE)
- **用途**: 允许应用读取设备相册中的图片
- **何时使用**: 用户选择从相册选择图片时
- **用户提示**: 系统会显示权限请求对话框

### 存储权限 (android.permission.WRITE_EXTERNAL_STORAGE)
- **用途**: 允许应用保存图片到设备存储
- **何时使用**: 保存拍摄的照片或下载的图片时
- **注意**: Android 10+ 默认使用分区存储，此权限可能不需要

## 测试权限

### 1. 权限状态检查

在应用中使用以下代码检查权限状态：

```typescript
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

const checkCameraPermission = async () => {
  const result = await check(PERMISSIONS.IOS.CAMERA);
  
  switch (result) {
    case RESULTS.UNAVAILABLE:
      console.log('此设备不支持此功能');
      break;
    case RESULTS.DENIED:
      console.log('权限未授予');
      const permissionResult = await request(PERMISSIONS.IOS.CAMERA);
      console.log('权限请求结果:', permissionResult);
      break;
    case RESULTS.LIMITED:
      console.log('权限受限');
      break;
    case RESULTS.GRANTED:
      console.log('权限已授予');
      break;
    case RESULTS.BLOCKED:
      console.log('权限被阻止');
      break;
  }
};
```

### 2. 权限请求流程

建议的权限请求流程：

1. 检查权限状态
2. 如果未授予，显示权限说明
3. 请求权限
4. 处理权限结果
5. 如果被拒绝，提供手动开启权限的指导

## 常见问题

### 1. 权限被拒绝
- 检查权限描述是否清晰明了
- 提供权限被拒绝后的解决方案
- 考虑在设置中引导用户手动开启权限

### 2. 权限描述不显示
- 确保权限描述已正确添加到配置文件中
- 检查文件路径和语法是否正确
- 重新构建应用

### 3. Android 权限问题
- 检查 AndroidManifest.xml 中的权限声明
- 确认目标 SDK 版本
- 测试不同 Android 版本的权限行为

## 最佳实践

1. **权限最小化**: 只请求应用真正需要的权限
2. **清晰描述**: 权限描述应该清楚说明为什么需要此权限
3. **优雅降级**: 当权限被拒绝时，提供替代方案
4. **用户教育**: 解释权限的重要性，帮助用户理解
5. **测试覆盖**: 在不同设备和系统版本上测试权限行为

## 相关链接

- [React Native 权限文档](https://github.com/zoontek/react-native-permissions)
- [iOS 权限指南](https://developer.apple.com/documentation/security/requesting_authorization_for_media_capture_on_ios)
- [Android 权限指南](https://developer.android.com/training/permissions/requesting)
- [腾讯云 COS 文档](https://cloud.tencent.com/document/product/436)
