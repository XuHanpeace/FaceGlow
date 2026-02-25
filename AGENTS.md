# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

FaceGlow (美颜换换) is a React Native mobile app (iOS/Android) for AI-powered face transformation. The backend is serverless (Tencent CloudBase) — no backend code lives in this repo.

### Development commands

| Task | Command |
|------|---------|
| Install deps | `npm install` (runs `patch-package` via postinstall) |
| Lint | `npm run lint` (ESLint) |
| Type check | `npx tsc --noEmit` |
| Tests | `npm test` |
| Metro dev server | `npx react-native start` |
| Format | `npm run format` (Prettier) |

### Non-obvious caveats

- **`src/config/cosSecrets.js` is git-ignored.** It must exist for Metro to bundle. It exports `{ secretId, secretKey }` for Tencent COS. A placeholder stub is sufficient for bundling/dev; real keys are needed for upload functionality.
- **Jest `transformIgnorePatterns`** is not configured in `jest.config.js` for the many ESM-only packages used (e.g. `@react-navigation`, `react-redux`, `toastify-react-native`). The existing test (`__tests__/App.test.tsx`) fails to parse out of the box due to this pre-existing issue.
- **TypeScript** reports pre-existing type errors (mostly unused imports and a few type mismatches). These are in the upstream codebase, not CI-blocking.
- **ESLint** reports ~90 pre-existing errors (mostly `@typescript-eslint/no-unused-vars`) and ~1759 warnings (style issues). Not CI-blocking.
- **No iOS/Android simulator** is available in Cloud VMs. You can verify JS bundling via Metro's HTTP endpoint: `curl http://localhost:8081/index.bundle?platform=ios&dev=true&minify=false`.
- The `rn-fetch-blob` package produces a non-blocking warning about invalid `dependency.hooks` config; this can be safely ignored.
- `husky` + `lint-staged` run `prettier --write` on pre-commit. The `husky install` command in `prepare` script shows a deprecation warning but still works.
