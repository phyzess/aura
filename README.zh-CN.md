## Aura（中文文档）

Aura 是一个运行在 Chrome 扩展里的「标签页与工作区管理器」，通过 Cloudflare Worker 提供的 API 进行同步与鉴权。

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
	````

  - 本地环境变量如何配置，见 `docs/quickstart.zh-CN.md` 的「本地开发」章节。

- **自建部署（前后端都在你自己的环境）**：
	  - 按 `docs/quickstart.zh-CN.md` 中「部署到你自己的环境」章节：
	    - 先在 Cloudflare 创建 D1 数据库并配置 `apps/api/wrangler.toml`
	    - 配好生产环境的 `BETTER_AUTH_*` 与 D1 绑定，运行 `pnpm deploy:api`
	    - 在根目录配置 `.env.production` 的 `VITE_API_BASE_URL`，再运行 `pnpm build` 打包扩展

### 更多文档

- 环境变量与配置说明：`docs/env.zh-CN.md`
- 快速上手（本地 & 部署一步步）：`docs/quickstart.zh-CN.md`

