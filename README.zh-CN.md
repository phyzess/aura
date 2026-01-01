## Aura（中文文档）

Aura 是一个运行在 Chrome 扩展里的「标签页与工作区管理器」，通过 Cloudflare Worker 提供的 API 进行同步与鉴权。

### 核心功能

- 📑 **工作区与集合管理** – 将标签页组织到工作区和集合中
- 🔄 **跨设备同步** – 通过 Cloudflare Worker API 在多设备间同步数据
- 🆕 **新标签页覆盖** – 将 Chrome 新标签页替换为 Aura 仪表板，即时访问
- 🔍 **快速搜索** – 使用 `Cmd+K`（或 `Ctrl+K`）搜索所有已保存的标签页
- 💾 **离线支持** – 通过 IndexedDB 本地存储支持离线使用
- 🌐 **国际化** – 多语言支持（English、中文）
- 🎨 **深色模式** – 精美的深色/浅色主题支持
- 📤 **导入/导出** – 将工作区、集合或所有数据导出为 JSON

### Monorepo 结构

- `apps/api`：Cloudflare Worker API（Hono + Better Auth + Drizzle ORM + D1）
- `apps/extension`：Chrome 扩展（React, Vite, CRXJS, Tailwind, Jotai）
- `packages/domain`：共享领域模型（用户、工作区、集合、标签等）
- `packages/config`：共享环境配置与校验（Valibot，包含 Worker 与 Extension 的 env schema）

项目大致结构：

````text
apps/
  api/         # Worker API 入口与路由
  extension/   # 扩展 UI、popup、dashboard、content scripts

packages/
  domain/      # API 与扩展共用的领域模型
  config/      # 环境变量 schema 与配置构建工具
````

### 运行与部署（中文总览）

- **本地开发**：
  - 在仓库根目录执行：

    ````bash
    pnpm install
    pnpm dev:api                    # 启动 API（wrangler dev）
    pnpm dev                        # 启动扩展开发服务器
    ```

  - 本地环境变量如何配置，见 `docs/quickstart.zh-CN.md` 的「本地开发」章节。

- **自建部署（前后端都在你自己的环境）**：
  - 按 `docs/quickstart.zh-CN.md` 中「部署到你自己的环境」章节：
    - 先在 Cloudflare 创建 D1 数据库并配置 `apps/api/wrangler.toml`
    - 配好生产环境的 `BETTER_AUTH_*` 与 D1 绑定，运行 `pnpm deploy:api`
    - 在根目录配置 `.env.production` 的 `VITE_API_BASE_URL`，再运行 `pnpm build` 打包扩展

### 数据库维护脚本（重要）

项目内提供了两个用于**清空 D1 数据库**的脚本，请务必区分本地与生产环境。

#### 本地数据库重置（相对安全）

- **脚本位置**：`scripts/clear-db-local.sh`
- **作用环境**：本地 D1（`--local`）
- **会做什么**：删除以下所有表中的数据：
  - 鉴权相关：`users`、`sessions`、`accounts`、`verifications`
  - 业务相关：`workspaces`、`collections`、`tabs`
- **使用方式**：

  ````bash
  ./scripts/clear-db-local.sh
  ```

  运行后需要输入 `LOCAL` 才会真正执行，否则脚本会直接退出。

这个脚本仅用于本地开发场景，例如希望把数据库恢复成「全新安装」状态时使用。

#### 远程生产数据库清空（极度危险）

> ⚠️ **警告**：`scripts/clear-db-remote.sh` 会通过 `--env production --remote` 直接清空生产环境的 D1 数据库 `aura-db` 中的所有数据。请不要在 CI、定时任务等任何自动化流程中调用，只能在你完全确认安全的情况下**手动执行**。

- **脚本位置**：`scripts/clear-db-remote.sh`
- **作用环境**：Cloudflare 生产 D1（`aura-db`）
- **会做什么**：与本地脚本相同，依次执行对上述所有表的 `DELETE` 操作，但目标是远程生产数据库。
- **使用方式（仅限手动）**：

  ````bash
  ./scripts/clear-db-remote.sh
  ```

  脚本会要求进行三次确认：

  1. 输入 `PROD`
  2. 输入数据库名 `aura-db`
  3. 输入 `DELETE EVERYTHING`

  任何一步输入不正确，脚本都会立即退出，不会对数据库做任何修改。

仅在你明确确认「当前生产环境数据可以全部删除」的前提下再使用此脚本，例如早期只有内部测试账号、需要彻底重置环境时。

### 更多文档

- 环境变量与配置说明：`docs/env.zh-CN.md`
- 快速上手（本地 & 部署一步步）：`docs/quickstart.zh-CN.md`
