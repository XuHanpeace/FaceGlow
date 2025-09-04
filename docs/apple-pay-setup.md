# 苹果支付接入配置指南

## 概述

本文档详细说明了接入苹果支付（In-App Purchase）所需的所有配置和环境信息。

## 1. Apple Developer 账户配置

### 1.1 开发者账户要求
- ✅ **付费开发者账户**: 需要 $99/年的 Apple Developer Program 会员
- ✅ **App Store Connect 访问权限**: 用于管理应用内购买项目
- ✅ **税务和银行信息**: 完成收款设置

### 1.2 应用配置
```
Bundle ID: com.faceglow.app
Team ID: [您的开发者团队ID]
App Store Connect App ID: [应用在App Store Connect中的ID]
```

## 2. App Store Connect 配置

### 2.1 创建应用内购买项目

#### 订阅产品配置
| 产品ID | 产品名称 | 价格 | 订阅周期 | 状态 |
|--------|----------|------|----------|------|
| `com.faceglow.weekly` | 周付会员 | ¥19.9 | 每周 | 待审核 |
| `com.faceglow.monthly` | 月付会员 | ¥68 | 每月 | 待审核 |
| `com.faceglow.yearly` | 年付会员 | ¥588 | 每年 | 待审核 |

#### 配置步骤
1. 登录 [App Store Connect](https://appstoreconnect.apple.com)
2. 选择您的应用
3. 进入"功能" → "App 内购买项目"
4. 点击"+"创建新的购买项目
5. 选择"自动续期订阅"
6. 填写产品信息：
   - **产品 ID**: 如 `com.faceglow.weekly`
   - **参考名称**: 如 "周付会员"
   - **产品名称**: 如 "FaceGlow 周付会员"
   - **描述**: 详细描述订阅内容
   - **价格**: 设置对应价格
   - **订阅组**: 创建订阅组 "FaceGlow Premium"

### 2.2 订阅组配置
```
订阅组名称: FaceGlow Premium
订阅组 ID: 20912345
包含产品:
- com.faceglow.weekly
- com.faceglow.monthly  
- com.faceglow.yearly
```

### 2.3 本地化配置
为每个产品配置多语言信息：
- 中文（简体）
- 英文
- 日文（可选）

## 3. Xcode 项目配置

### 3.1 添加 StoreKit 框架
```objc
// 在项目中添加
#import <StoreKit/StoreKit.h>
```

### 3.2 配置 Capabilities
1. 在 Xcode 中选择项目
2. 进入 "Signing & Capabilities"
3. 点击 "+" 添加 "In-App Purchase"
4. 确保 "In-App Purchase" 已启用

### 3.3 Info.plist 配置
```xml
<key>SKPaymentTransactionObserver</key>
<true/>
```

## 4. 沙箱环境配置

### 4.1 沙箱测试账户
创建测试用的 Apple ID：
```
测试账户邮箱: test@faceglow.com
密码: [设置安全密码]
地区: 中国
```

### 4.2 沙箱环境特点
- 使用沙箱 Apple ID 登录
- 不会产生真实扣费
- 可以测试完整的购买流程
- 支持退款测试

### 4.3 沙箱测试步骤
1. 在设备上退出当前 Apple ID
2. 登录沙箱测试账户
3. 运行应用进行购买测试
4. 验证购买流程和恢复购买功能

## 5. 服务器端验证

### 5.1 收据验证
```javascript
// 验证收据的服务器端代码示例
const verifyReceipt = async (receiptData) => {
  const response = await fetch('https://buy.itunes.apple.com/verifyReceipt', {
    method: 'POST',
    body: JSON.stringify({
      'receipt-data': receiptData,
      'password': 'your-app-shared-secret',
      'exclude-old-transactions': true
    })
  });
  
  return response.json();
};
```

### 5.2 共享密钥
```
App Store Connect 共享密钥: [在App Store Connect中获取]
用于服务器端验证收据
```

## 6. 生产环境配置

### 6.1 审核要求
- ✅ 产品描述清晰准确
- ✅ 价格合理且符合市场标准
- ✅ 订阅条款明确
- ✅ 提供取消订阅的说明
- ✅ 支持恢复购买功能

### 6.2 隐私政策
确保隐私政策包含：
- 订阅服务说明
- 数据收集和使用
- 用户权利说明
- 联系方式

### 6.3 用户协议
包含以下内容：
- 订阅服务条款
- 自动续费说明
- 取消订阅方法
- 退款政策

## 7. 测试清单

### 7.1 功能测试
- [ ] 产品列表获取
- [ ] 购买流程
- [ ] 支付成功处理
- [ ] 支付失败处理
- [ ] 恢复购买功能
- [ ] 订阅状态检查
- [ ] 取消订阅流程

### 7.2 环境测试
- [ ] 沙箱环境测试
- [ ] 生产环境测试
- [ ] 网络异常处理
- [ ] 设备兼容性测试

### 7.3 用户体验测试
- [ ] 界面响应速度
- [ ] 错误提示友好性
- [ ] 加载状态显示
- [ ] 多语言支持

## 8. 常见问题

### 8.1 产品不可用
- 检查产品ID是否正确
- 确认产品状态为"已批准"
- 验证沙箱账户设置

### 8.2 支付失败
- 检查设备是否支持支付
- 确认Apple ID登录状态
- 验证支付方式设置

### 8.3 恢复购买失败
- 确认用户之前有购买记录
- 检查网络连接
- 验证Apple ID一致性

## 9. 监控和分析

### 9.1 关键指标
- 购买转化率
- 订阅续费率
- 退款率
- 用户满意度

### 9.2 监控工具
- App Store Connect 分析
- 自定义数据分析
- 用户反馈收集

## 10. 安全注意事项

### 10.1 客户端安全
- 不要在前端存储敏感信息
- 使用HTTPS进行网络通信
- 验证收据签名

### 10.2 服务器端安全
- 验证所有收据
- 保护共享密钥
- 记录所有交易日志
- 实现防重放攻击机制

## 11. 联系方式

如有问题，请联系：
- 技术支持: support@faceglow.com
- 开发者账户: [您的Apple ID]
- 紧急联系: [紧急联系电话]

---

**注意**: 本文档中的配置信息需要根据实际项目情况进行调整。请确保所有敏感信息的安全存储。
