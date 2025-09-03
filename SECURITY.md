# 安全指南

## 敏感信息处理

本项目包含一些敏感配置信息，请遵循以下安全最佳实践：

### 1. 配置文件

#### COS配置
- **敏感文件**: `src/config/cosSecrets.js`
- **示例文件**: `src/config/cosSecrets.example.js`
- **状态**: 已添加到 `.gitignore`，不会被提交到版本控制

#### 使用方法
1. 复制示例文件：
   ```bash
   cp src/config/cosSecrets.example.js src/config/cosSecrets.js
   ```

2. 编辑配置文件，填入真实的配置信息：
   ```javascript
   export const COS_SECRETS = {
     secretId: 'YOUR_REAL_SECRET_ID',
     secretKey: 'YOUR_REAL_SECRET_KEY',
   };
   ```

### 2. 已移除的敏感信息

以下敏感信息已从Git历史中完全移除：
- 腾讯云Secret ID和Secret Key
- 包含敏感信息的COS URL签名
- 其他硬编码的敏感配置信息

### 3. 安全最佳实践

#### 开发环境
- ✅ 使用示例配置文件
- ✅ 敏感信息存储在本地环境变量中
- ✅ 定期轮换密钥
- ❌ 不要在代码中硬编码敏感信息
- ❌ 不要将包含敏感信息的文件提交到版本控制

#### 生产环境
- 使用环境变量或安全的密钥管理服务
- 定期审计和轮换密钥
- 监控异常访问

### 4. 如果意外提交了敏感信息

如果意外提交了敏感信息，请立即：

1. **移除敏感信息**：
   ```bash
   git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch path/to/sensitive/file' --prune-empty --tag-name-filter cat -- --all
   ```

2. **强制推送**：
   ```bash
   git push --force origin branch-name
   ```

3. **轮换密钥**：
   - 在云服务提供商控制台中轮换所有相关密钥
   - 更新本地配置文件

### 5. 文件监控

以下文件类型包含敏感信息，请特别注意：
- `*Secrets.js` - 包含密钥和配置
- `*.env` - 环境变量文件
- `*.pem` - 证书文件
- `*.key` - 私钥文件

### 6. 联系方式

如果发现安全漏洞或敏感信息泄露，请立即联系项目维护者。

---

**注意**: 本项目的敏感信息已从Git历史中完全移除，但请确保在本地开发时遵循上述安全最佳实践。
