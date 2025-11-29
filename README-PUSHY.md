# Pushy 热更新快速开始

## 安装

项目已集成 Pushy SDK，无需额外安装。

## 快速使用

### 1. 登录 Pushy

首次使用或登录过期时：

```bash
npm run pushy:login
```

### 2. 发布热更新（最常用）

只修改了 JS 代码时：

```bash
npm run pushy:hot-update
```

### 3. 上传原生 IPA

重新打包了原生包后：

```bash
npm run pushy:upload-ipa "/path/to/your.ipa"
```

### 4. 完整发布流程

首次发布新版本时：

```bash
npm run pushy:release
```

## 详细文档

查看 [docs/pushy-best-practices.md](./docs/pushy-best-practices.md) 了解完整的最佳实践。

## 版本号管理

- 版本号统一从 `package.json` 读取
- 使用 `node scripts/bump-version.js` 自动递增版本号
- 会自动同步到 `src/config/version.ts` 和 Xcode 项目文件

