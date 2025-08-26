# COS配置说明

## 敏感信息配置

为了保护您的腾讯云COS敏感信息，请按照以下步骤操作：

### 1. 复制示例配置文件

```bash
cp src/config/cosSecrets.example.js src/config/cosSecrets.js
```

### 2. 编辑配置文件

打开 `src/config/cosSecrets.js` 文件，填入您的真实配置信息：

```javascript
export const COS_SECRETS = {
  secretId: '您的真实SecretId',
  secretKey: '您的真实SecretKey',
};
```

### 3. 验证配置

确保以下文件已正确配置：

- ✅ `src/config/cosSecrets.js` - 包含真实配置（已添加到.gitignore）
- ✅ `src/config/cosSecrets.example.js` - 示例配置文件（可提交到git）

### 4. 安全注意事项

- **永远不要**将包含真实密钥的 `cosSecrets.js` 文件提交到版本控制系统
- 该文件已被添加到 `.gitignore` 中
- 如果意外提交了敏感信息，请立即轮换密钥

### 5. 团队协作

当新成员加入项目时：

1. 克隆项目后，复制示例配置文件
2. 填入自己的COS配置信息
3. 确保 `cosSecrets.js` 不会被提交

### 6. 环境配置

如果需要不同环境的配置，可以创建：

- `cosSecrets.dev.js` - 开发环境
- `cosSecrets.prod.js` - 生产环境
- `cosSecrets.local.js` - 本地环境

这些文件也已被添加到 `.gitignore` 中。

## 配置验证

配置完成后，可以通过以下方式验证：

1. 启动应用
2. 查看控制台日志，确认COS服务自动初始化成功
3. 测试图片上传功能

## 故障排除

如果遇到配置问题：

1. 检查 `cosSecrets.js` 文件是否存在
2. 验证 `secretId` 和 `secretKey` 是否正确
3. 确认文件路径和导入语句正确
4. 查看控制台错误日志
