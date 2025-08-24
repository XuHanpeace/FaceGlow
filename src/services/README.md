# 服务模块说明

本项目包含以下服务模块：

## 📁 文件结构

```
src/services/
├── cloudbaseConfig.ts      # CloudBase配置
├── cloudbaseHttpApi.ts     # CloudBase HTTP API服务
├── tcb.ts                  # 兼容性接口
├── faceSwapService.ts      # 换脸服务
├── imageUploadService.ts   # 图片上传服务
├── userService.ts          # 用户服务
├── nativeCOS.ts            # 原生COS模块接口
├── NATIVE_COS_USAGE.md     # 原生COS使用指南
└── README.md               # 本说明文档
```

## 🔧 主要服务

### CloudBase服务
- 云函数调用
- 用户认证
- 数据库操作

### 图片处理服务
- 图片上传
- 换脸处理
- 文件管理

### 原生COS服务
- 基于腾讯云COS iOS SDK
- 原生性能，无JavaScript桥接开销
- 支持永久密钥和临时密钥
- 实时上传进度和状态监控

### 用户服务
- 用户信息管理
- 登录认证
- 数据同步

## 📚 相关链接

- [CloudBase官方文档](https://cloud.tencent.com/product/tcb)
- [React Native开发指南](https://reactnative.dev/)

## 🤝 贡献

如果您发现bug或有改进建议，请提交issue或pull request。

## 📄 许可证

本项目遵循MIT许可证。
