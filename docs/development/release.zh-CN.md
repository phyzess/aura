# 发布指南（中文）

本文档给出一个在 Aura monorepo 中发布版本的实用流程，重点围绕 Chrome 扩展包 `@aura/extension`，并使用 Changesets 进行版本管理。

## 1. 前置条件

你已经具备：

- 一个使用 pnpm 的 workspace，包含：
  - `apps/extension`（Chrome 扩展，包名 `@aura/extension`）
  - `apps/api`（Cloudflare Worker API）
  - `packages/*`（共享库）
- 根目录已配置 Changesets：
  - `.changeset/config.json`，其中 `baseBranch: "main"`
  - 根 `package.json` 中有脚本：

    ````bash
    pnpm changeset          # 创建 changeset
    pnpm changeset:version  # 应用所有待处理的 changeset 并 bump 版本
    ````

- `apps/extension/manifest.config.ts` 已从 `apps/extension/package.json` 读取版本号。

## 2. 日常开发中的 Changesets 使用方式

### 2.1 完成一组改动之后

在仓库根目录执行：

````bash
pnpm changeset
````

按照交互提示进行：

1. 选择受影响的包（例如：`@aura/extension`、`@aura/config`）。
2. 为每个受影响包选择 bump 类型：
   - `patch`：修复 bug、小改动，无破坏性变更；
   - `minor`：向后兼容的新功能；
   - `major`：有破坏性的变更。
3. 写一段简短的变更摘要（会出现在 CHANGELOG 里）。

这一步会在 `.changeset/` 目录下生成一个 markdown 文件，记录：

- 哪些包需要 bump；
- 它们各自的 bump 类型；
- 这条变更的说明。

提交代码时，把 `.changeset/*.md` 一起提交即可。

### 2.2 准备正式发布一个版本时

在 `main` 分支上（已合并最新改动）执行：

````bash
pnpm changeset:version
````

它会自动：

- 更新所有被标记包的 `package.json.version`（包括 `apps/extension/package.json`）；
- 为这些包生成或更新 `CHANGELOG.md`；
- 清理已经处理完的 `.changeset/*.md` 文件。

执行完之后，`@aura/extension` 的版本号会成为单一事实来源（single source of truth）：

- Chrome 扩展 manifest 的版本号来源于此；
- 你构建出来的 CRX zip 文件名中使用的版本号也来源于此（通过 Vite / zip 的命名逻辑）。

随后你可以提交版本变更和 CHANGELOG，例如：

````bash
git add .
git commit -m "chore: version packages"
````

接着给本次扩展发布打一个 Git tag：

````bash
git tag ext-vX.Y.Z
git push && git push --tags
````

`ext-v*` 前缀约定用于 Chrome 扩展版本，例如当 `apps/extension/package.json` 里是 `"version": "1.2.3"` 时，对应的 tag 应为 `ext-v1.2.3`。

### 2.3 Tag 命名与 CI 约定（ext-v / api-v）

为了区分 monorepo 中不同的可部署目标，约定使用带作用域的 tag：

- `ext-vX.Y.Z`：Chrome 扩展版本，对应 `apps/extension/package.json.version`；
- `api-vX.Y.Z`：API 版本，对应 `apps/api/package.json.version`。

GitHub Actions 将按前缀触发不同流程：

- 推送 `ext-v*` tag 时，构建扩展并在 GitHub Releases 中创建带 zip 附件的 release；
- 推送 `api-v*` tag 时，通过 `pnpm deploy:api` 部署 `@aura/api` 到 Cloudflare Workers。

## 3. 构建 Chrome 扩展发布包

在通过 Changesets bump 完版本号之后，从仓库根目录构建扩展：

````bash
pnpm build:extension
````

这一步会：

- 使用 Vite 为 `@aura/extension` 进行构建；
- 将 `apps/extension/package.json` 中的版本写入扩展 manifest；
- 在 `apps/extension/release` 目录下生成 zip 文件，文件名中包含扩展名与版本号，并附带：
  - 自动生成的时间戳，或
  - 由环境变量 `BUILD_META` / `RELEASE_TAG` 指定的自定义后缀（取决于你的 Vite 配置）。

示例：

- 简单本地构建：

  ````bash
  pnpm build:extension
  # => release/crx-<name>-<version>-<timestamp>.zip
  ````

- 带有显式 tag 的候选版本（RC）：

  ````bash
  RELEASE_TAG=v1.2.0-rc.1 pnpm build:extension
  # => release/crx-<name>-<version>-v1.2.0-rc.1.zip
  ````

构建完成后，你可以：

- 解压并在 `chrome://extensions` 中以「加载已解压的扩展程序」方式安装测试；
- 或将 zip 上传到 Chrome Web Store（如未来有上架需求）。

## 4. 发布 API（Cloudflare Worker）

如果这次改动同时影响了 `@aura/api`，在版本 bump 之后，可以用已有脚本发布生产环境 API：

````bash
pnpm deploy:api
````

该命令会运行 `apps/api/package.json` 中的 `deploy` 脚本（通常是 `wrangler deploy --env production`），并使用 `apps/api/wrangler.toml` 中配置的生产环境参数。

## 5. 推荐的完整发布 Checklist

综合起来，一次标准发布流程可以是：

1. 在本地实现并自测改动。
2. 记录变更：
   - 运行 `pnpm changeset` 并选择受影响的包、bump 类型，写明摘要；
   - 提交代码和 `.changeset/*.md`。
3. 在 `main` 上准备版本：
   - 合并相关 PR；
   - 运行 `pnpm changeset:version`；
   - 检查各 `package.json` 和 `CHANGELOG.md` 中的变更；
   - 提交，例如：`chore: version packages`。
4. 构建产物：
   - 运行 `pnpm build:extension` 生成扩展 zip 包；
   - 如有需要，用 `RELEASE_TAG` / `BUILD_META` 为本次构建增加可识别的后缀。
5. 部署后端（如有变更）：
   - 运行 `pnpm deploy:api` 部署 Cloudflare Worker API。
6. 打 tag 并推送：
   - 扩展：`git tag ext-vX.Y.Z`（与 `apps/extension/package.json.version` 一致）；
   - API（如需要部署）：`git tag api-vX.Y.Z`（与 `apps/api/package.json.version` 一致）；
   - `git push && git push --tags`。

通过以上流程，可以在保持简单的前提下，让版本号、CHANGELOG、扩展 manifest、构建产物与自动化流程始终保持一致，方便团队协作与追踪历史。

