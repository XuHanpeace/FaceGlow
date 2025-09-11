# iOS 应用内订阅沙盒测试指南

## 🧪 沙盒环境测试步骤

### 1. 准备工作

#### 1.1 确保沙盒环境配置
- ✅ 在 App Store Connect 中创建沙盒测试账户
- ✅ 在设备上登录沙盒测试账户（设置 → App Store → 沙盒账户）
- ✅ 确保产品ID在 App Store Connect 中已创建并审核通过

#### 1.2 产品ID配置
```javascript
// 当前配置的产品ID
const productIds = [
  'com.faceglow.weekly',   // 周付会员
  'com.faceglow.monthly',  // 月付会员  
  'com.faceglow.yearly',   // 年付会员
];
```

### 2. 测试流程

#### 2.1 启动应用
```bash
# 在项目根目录运行
npx react-native run-ios
```

#### 2.2 导航到订阅页面
1. 打开应用
2. 点击测试中心
3. 选择"苹果订阅支付"

#### 2.3 测试功能点

**A. 获取产品信息**
- 检查是否能正确获取产品列表
- 验证产品价格和描述是否正确显示

**B. 购买流程测试**
- 选择订阅方案（Weekly/Yearly）
- 点击"Continue"按钮
- 观察支付流程是否正常

**C. 恢复购买测试**
- 点击底部的"恢复"链接
- 验证是否能正确恢复之前的购买

**D. 订阅状态检查**
- 测试订阅状态查询功能
- 验证过期时间计算是否正确

### 3. 常见问题排查

#### 3.1 产品获取失败
```javascript
// 检查控制台日志
console.log('可用产品:', products);
```

**可能原因：**
- 产品ID在 App Store Connect 中未创建
- 产品状态不是"Ready for Sale"
- Bundle ID 不匹配

#### 3.2 支付失败
```javascript
// 检查错误信息
catch (error: any) {
  console.error('支付错误:', error);
}
```

**可能原因：**
- 未登录沙盒测试账户
- 设备不支持应用内购买
- 网络连接问题

#### 3.3 恢复购买失败
**可能原因：**
- 没有之前的购买记录
- 沙盒账户不匹配

### 4. 调试技巧

#### 4.1 启用详细日志
```objc
// 在 ApplePayModule.m 中添加
NSLog(@"🔍 调试信息: %@", debugInfo);
```

#### 4.2 检查沙盒环境
```javascript
// 在 SubscriptionScreen.tsx 中添加
const checkSandboxEnvironment = () => {
  console.log('🔍 检查沙盒环境...');
  // 添加环境检查逻辑
};
```

#### 4.3 模拟不同场景
- 测试网络断开情况
- 测试用户取消支付
- 测试支付超时

### 5. 测试检查清单

- [ ] 沙盒测试账户已登录
- [ ] 产品ID在 App Store Connect 中已创建
- [ ] 应用Bundle ID匹配
- [ ] 网络连接正常
- [ ] 设备支持应用内购买
- [ ] 支付流程完整测试
- [ ] 恢复购买功能测试
- [ ] 错误处理机制测试

### 6. 预期结果

**成功场景：**
- 产品列表正确加载
- 支付流程顺利完成
- 订阅状态正确更新
- 恢复购买功能正常

**失败场景：**
- 显示友好的错误提示
- 不会导致应用崩溃
- 用户可以重试操作

## 🚀 开始测试

运行以下命令启动测试：

```bash
npx react-native run-ios
```

然后按照上述步骤进行测试！
