# Pushy 热更新最佳实践

本文档基于 [Pushy 官方文档](https://pushy.reactnative.cn/docs/) 总结的最佳实践方案。

## 核心原则

1. **使用 Pushy 官方 CLI 能力**：所有操作都通过 `react-native-update-cli` 完成，避免自定义交互式脚本
2. **版本号统一管理**：版本号统一从 `package.json` 读取，避免手动维护多份版本号
3. **自动化流程**：通过 npm scripts 封装常用操作，减少手动步骤

## 版本号管理

### 版本号来源

- **原生版本 (Native Version)**：从 `package.json` 的 `version` 字段读取
- **JS Bundle 版本**：与原生版本保持一致，从 `package.json` 读取
- **版本号更新**：使用 `node scripts/bump-version.js` 自动递增 patch 版本

### 版本号同步

`scripts/bump-version.js` 会自动同步以下文件：
- `package.json` → `version`
- `src/config/version.ts` → `appVersion` 和 `jsVersion`
- `ios/MyCrossPlatformApp.xcodeproj/project.pbxproj` → `MARKETING_VERSION`

## 常用命令

### 1. 登录 Pushy

```bash
npm run pushy:login
```

首次使用或登录过期时需要执行。

### 2. 上传原生 IPA

```bash
npm run pushy:upload-ipa <ipa-path>
```

**使用场景**：
- 首次发布新版本
- 重新打包后需要更新 Pushy 上的原生包记录

**示例**：
```bash
npm run pushy:upload-ipa "/Users/hanksxu/Desktop/FaceGlow-1.0.11.ipa"
```

**说明**：
- 上传后，Pushy 会记录这个原生包的编译时间戳
- 后续的热更新必须绑定到对应的原生包版本

### 3. 发布热更新

```bash
npm run pushy:hot-update [--packageVersion <version>]
```

**使用场景**：
- 只修改了 JS 代码，需要发布热更新
- 不需要重新打包原生 App

**示例**：
```bash
# 使用默认版本号（从 package.json 读取）
npm run pushy:hot-update

# 指定绑定到特定原生版本
npm run pushy:hot-update -- --packageVersion "1.0.11"

# 自定义版本名称和描述
npm run pushy:hot-update -- --name "1.0.12" --description "修复了某个 Bug"
```

**说明**：
- 脚本会自动从 `package.json` 读取当前版本号
- 使用 Pushy CLI 的 `bundle` 命令，一次性完成：打包 → 上传 → 发布 → 绑定
- 无需手动交互，所有参数通过命令行传入

### 4. 完整发布流程

```bash
npm run pushy:release
```

**使用场景**：
- 首次发布新版本
- 需要同时更新原生版本和 JS Bundle

**流程**：
1. 自动版本号 +1（patch 版本）
2. Git 提交和打 Tag
3. Pod Install
4. 提示用户在 Xcode 中 Archive 并导出 IPA
5. 上传 IPA 到 Pushy
6. 发布热更新并绑定到新版本

**说明**：
- 这是最完整的发布流程，适合正式发布
- 会引导你完成所有必要步骤

## 工作流程示例

### 场景 1：首次发布新版本

```bash
# 1. 完整发布流程（会自动版本号+1）
npm run pushy:release

# 按照提示在 Xcode 中 Archive 并导出 IPA
# 输入 IPA 路径后，脚本会自动上传并发布热更新
```

### 场景 2：只修改 JS 代码（热更新）

```bash
# 1. 修改 JS 代码（例如修改某个页面文案）

# 2. 发布热更新（版本号不变，只更新 JS Bundle）
npm run pushy:hot-update

# 3. 在手机上测试：杀掉 App → 重新打开 → 检查更新
```

### 场景 3：重新打包原生包（时间戳匹配）

```bash
# 1. 在 Xcode 中重新 Archive 并导出 IPA（时间戳会变）

# 2. 上传新的 IPA（更新 Pushy 上的原生包记录）
npm run pushy:upload-ipa "/path/to/new.ipa"

# 3. 发布热更新并绑定到新上传的原生包
npm run pushy:hot-update -- --packageVersion "1.0.11"
```

## 技术细节

### Pushy CLI 命令说明

#### `pushy bundle`

官方提供的打包和发布命令，支持以下参数：

```bash
npx react-native-update-cli bundle \
  --platform ios \
  --name "1.0.12" \                    # 热更版本名称
  --description "修复了某个 Bug" \      # 版本描述
  --metaInfo '{"key":"value"}' \        # 自定义元信息（JSON 字符串）
  --packageVersion "1.0.11"            # 绑定到原生包版本
```

**优势**：
- 一次性完成打包、上传、发布、绑定
- 无需交互式输入
- 适合 CI/CD 自动化

#### `pushy uploadIpa`

上传原生 IPA 文件：

```bash
npx react-native-update-cli uploadIpa \
  --platform ios \
  --ipaPath "/path/to/app.ipa"
```

### 版本号策略

- **Major.Minor.Patch**：遵循语义化版本
- **Patch 版本**：用于热更新（只改 JS）
- **Minor/Major 版本**：用于原生版本更新（需要重新打包）

### 编译时间戳匹配

Pushy 会校验原生包的编译时间戳，确保热更新绑定到正确的原生包。

**重要**：
- 如果重新打包了原生包，必须重新上传 IPA 到 Pushy
- 否则会出现"编译时间戳不匹配"的错误

## 常见问题

### Q: 为什么检查更新返回空结果？

A: 可能的原因：
1. 本地 JS 版本和服务器版本相同（已是最新）
2. 编译时间戳不匹配（需要重新上传 IPA）
3. 热更包未绑定到对应的原生包版本

### Q: 如何验证热更新是否生效？

A: 
1. 在「关于我们」页面查看 Bundle 版本号
2. 检查是否有新的测试文案（V6、V7 等）
3. 查看 `currentHash` 是否变化

### Q: Debug 和 Release 的区别？

A:
- **Debug**：使用 Metro Server，无法真正应用热更新（只能检查）
- **Release**：使用 Pushy SDK，可以真正下载和应用热更新

## 参考文档

- [Pushy 官方文档](https://pushy.reactnative.cn/docs/)
- [Pushy API 文档](https://pushy.reactnative.cn/docs/api)
- [Pushy CLI 文档](https://pushy.reactnative.cn/docs/cli)
- [Pushy 最佳实践](https://pushy.reactnative.cn/docs/bestpractice)

