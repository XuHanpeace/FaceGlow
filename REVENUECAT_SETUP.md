# RevenueCat 集成指南

本文档说明如何在 FaceGlow 应用中配置和使用 RevenueCat SDK。

## 📋 目录

1. [安装 SDK](#安装-sdk)
2. [配置 API Key](#配置-api-key)
3. [RevenueCat Dashboard 配置](#revenuecat-dashboard-配置)
4. [原生平台配置](#原生平台配置)
5. [使用方法](#使用方法)
6. [测试](#测试)

## 📦 安装 SDK

SDK 已经通过 npm 安装：

```bash
npm install --save react-native-purchases react-native-purchases-ui
```

**注意**: 如果使用 React Native >= 0.60，SDK 会自动链接。对于旧版本，需要手动链接：

```bash
react-native link react-native-purchases
```

## 🔑 配置 API Key

API Key 已在 `src/config/revenueCatConfig.ts` 中配置：

```typescript
export const REVENUECAT_API_KEY = {
  ios: 'test_iTvZGIfBvovUViOOeokGpqmqmug',
  android: 'test_iTvZGIfBvovUViOOeokGpqmqmug', // TODO: 替换为生产环境的 Android API Key
};
```

**重要**: 
- 当前使用的是测试环境的 API Key
- 发布到 App Store/Google Play 之前，请替换为生产环境的 API Key
- iOS 和 Android 需要使用各自的 API Key

## 📊 RevenueCat Dashboard 配置

### 1. 创建 Entitlement

在 RevenueCat Dashboard 中：

1. 进入 **Entitlements** 页面
2. 创建名为 `FaceGlow Pro` 的 entitlement（注意大小写和空格必须完全匹配）
3. 这是用于检查用户是否有订阅权限的标识符

### 2. 配置产品

#### iOS (App Store Connect)

1. 在 App Store Connect 中创建订阅产品：
   - 月度订阅: 产品 ID 建议使用 `com.digitech.faceglow.subscribe.monthly1`
   - 年度订阅: 产品 ID 建议使用 `com.digitech.faceglow.subscribe.yearly`

2. 在 RevenueCat Dashboard 中：
   - 进入 **Products** 页面
   - 添加 iOS 产品，使用与 App Store Connect 中相同的产品 ID
   - 将产品关联到 `FaceGlow Pro` entitlement

#### Android (Google Play Console)

1. 在 Google Play Console 中创建订阅产品：
   - 月度订阅: 产品 ID 建议使用 `com.digitech.faceglow.subscribe.monthly1`
   - 年度订阅: 产品 ID 建议使用 `com.digitech.faceglow.subscribe.yearly`

2. 在 RevenueCat Dashboard 中：
   - 进入 **Products** 页面
   - 添加 Android 产品，使用与 Google Play Console 中相同的产品 ID
   - 将产品关联到 `FaceGlow Pro` entitlement

### 3. 创建 Offering

1. 在 RevenueCat Dashboard 中进入 **Offerings** 页面
2. 创建默认 Offering（identifier: `default`）
3. 将订阅产品添加到 Offering 中：
   - 添加 `monthly` 包（类型：MONTHLY）
   - 添加 `annual` 或 `yearly` 包（类型：ANNUAL）

**包标识符说明**:
- 包的 identifier 可以是 `monthly`, `annual`, `yearly` 等
- 包的类型（Package Type）应该设置为 `MONTHLY` 或 `ANNUAL`

## 📱 原生平台配置

### iOS 配置

#### 1. 启用 In-App Purchase Capability

1. 在 Xcode 中打开项目
2. 选择项目 Target
3. 进入 **Signing & Capabilities**
4. 点击 **+ Capability**
5. 添加 **In-App Purchase**

#### 2. 检查 Info.plist

确保 `Info.plist` 中包含必要的权限（通常不需要额外配置）。

#### 3. 安装 CocoaPods 依赖（如果需要）

如果使用 CocoaPods，运行：

```bash
cd ios && pod install
```

### Android 配置

#### 1. 添加 BILLING 权限

确保 `android/app/src/main/AndroidManifest.xml` 中包含：

```xml
<uses-permission android:name="com.android.vending.BILLING" />
```

#### 2. 设置 launchMode

确保主 Activity 的 `launchMode` 设置为 `standard` 或 `singleTop`：

```xml
<activity
    android:name=".MainActivity"
    android:launchMode="standard"
    ... />
```

#### 3. 连接 Google Play

1. 在 RevenueCat Dashboard 中进入 **Integrations** 页面
2. 添加 Google Play 集成
3. 上传服务账户 JSON 密钥

## 💻 使用方法

### 基本使用

应用启动时，RevenueCat SDK 会在 `App.tsx` 中自动初始化。

### 检查订阅状态

```typescript
import { useRevenueCat } from '../hooks/useRevenueCat';

const MyComponent = () => {
  const { isPro, hasActiveSubscription, subscriptionStatus } = useRevenueCat();

  if (hasActiveSubscription) {
    // 用户有活跃订阅
  }
};
```

### 购买订阅

#### 方法 1: 使用手动实现的订阅屏幕

```typescript
import { useRevenueCat } from '../hooks/useRevenueCat';

const SubscriptionScreen = () => {
  const { purchasePackage, getAvailablePackages } = useRevenueCat();

  const handlePurchase = async (pkg) => {
    try {
      await purchasePackage(pkg);
      // 购买成功
    } catch (error) {
      // 处理错误
    }
  };
};
```

#### 方法 2: 使用 RevenueCat Paywall UI

```typescript
import { PurchasesPaywallView } from 'react-native-purchases-ui';

const PaywallScreen = () => {
  return (
    <PurchasesPaywallView
      onPurchaseCompleted={(customerInfo) => {
        // 购买成功
      }}
      onPurchaseError={(error) => {
        // 处理错误
      }}
    />
  );
};
```

### 恢复购买

```typescript
const { restorePurchases } = useRevenueCat();

const handleRestore = async () => {
  try {
    await restorePurchases();
    // 恢复成功
  } catch (error) {
    // 处理错误
  }
};
```

### 监听订阅状态变化

`useRevenueCat` Hook 会自动监听订阅状态变化并更新组件。

### 使用 Customer Center

```typescript
import CustomerCenterButton from '../components/CustomerCenterButton';

const MyComponent = () => {
  return <CustomerCenterButton />;
};
```

## 🧪 测试

### iOS 测试

1. 使用 Sandbox 测试账户：
   - 在设备设置中登录 Sandbox 测试账户
   - 在 App Store Connect 中创建测试账户
   
2. 测试步骤：
   - 运行应用
   - 进入订阅页面
   - 尝试购买订阅
   - 检查订阅状态是否正确更新

### Android 测试

1. 使用许可测试账户：
   - 在 Google Play Console 中添加许可测试账户
   
2. 测试步骤：
   - 使用许可测试账户登录设备
   - 运行应用
   - 进入订阅页面
   - 尝试购买订阅
   - 检查订阅状态是否正确更新

### 常见问题

1. **购买失败**: 
   - 检查网络连接
   - 确认产品已在 RevenueCat Dashboard 中配置
   - 确认产品已在 App Store Connect/Google Play Console 中创建

2. **订阅状态不更新**:
   - 检查 entitlement 标识符是否正确
   - 确认产品已关联到 entitlement
   - 检查 API Key 是否正确

3. **恢复购买失败**:
   - 确认用户确实有购买记录
   - 检查用户是否登录了正确的账户

## 📚 参考文档

- [RevenueCat React Native 文档](https://www.revenuecat.com/docs/getting-started/installation/reactnative)
- [RevenueCat Paywall 文档](https://www.revenuecat.com/docs/tools/paywalls)
- [RevenueCat Customer Center 文档](https://www.revenuecat.com/docs/tools/customer-center)

## 🔄 下一步

1. 在 RevenueCat Dashboard 中配置产品和 Offerings
2. 测试订阅流程
3. 集成到应用的其他部分
4. 准备发布时，替换为生产环境的 API Key

