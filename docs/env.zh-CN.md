# 环境配置说明（中文）

本项目同时包含 Cloudflare Worker API 和 Chrome 扩展。环境变量分为两类：

1. **API（Worker）用到的变量**：通过 `apps/api/wrangler.toml` 与 Cloudflare Dashboard / Secrets 配置。
2. **扩展（Vite）用到的变量**：通过仓库根目录下的 `.env.*` 文件配置。

## 1. API（Cloudflare Worker）环境变量

Worker 使用的变量在 `packages/config` 中有完整校验：

- `BETTER_AUTH_SECRET`：鉴权密钥，只能通过 Cloudflare Secrets 设置；
- `BETTER_AUTH_URL`：API 对外暴露的基础 URL；
- `BETTER_AUTH_TRUSTED_ORIGINS`：允许访问 API 的前端来源列表（逗号分隔）。

### 1.1 本地开发（dev）

在 `apps/api/wrangler.toml` 顶部的 `[vars]` 中配置非机密值，例如：

````toml
[vars]
BETTER_AUTH_URL = "http://localhost:8787"
BETTER_AUTH_TRUSTED_ORIGINS = "http://localhost:5173,chrome-extension://*"
````

在 `apps/api` 目录下创建 `.dev.vars` 文件，为本地 `wrangler dev` 提供 `BETTER_AUTH_SECRET`（不要提交到 Git）：

````bash
# apps/api/.dev.vars
BETTER_AUTH_SECRET=your-dev-secret-here
````

Wrangler 在本地运行 `wrangler dev` 时会自动读取 `.dev.vars`。生产环境和远程调试仍然需要通过 Cloudflare Secrets 配置 `BETTER_AUTH_SECRET`（见下文）。

### 1.2 生产环境（production）

在 `apps/api/wrangler.toml` 的 `[env.production.vars]` 中配置生产环境下的非机密值：

````toml
[env.production.vars]
BETTER_AUTH_URL = "https://aura-api.your-domain.com"
BETTER_AUTH_TRUSTED_ORIGINS = "https://app.your-domain.com,chrome-extension://YOUR_PROD_EXTENSION_ID"
````

再设置生产环境的 `BETTER_AUTH_SECRET`：

````bash
pnpm --filter @aura/api wrangler secret put BETTER_AUTH_SECRET --env production
````

D1 数据库绑定也在 `apps/api/wrangler.toml` 中配置，对应 `[[d1_databases]]` 与 `[[env.production.d1_databases]]`。你需要在 Cloudflare Dashboard 创建 D1 数据库，并把 `database_id` / `database_name` 填进去。

## 2. 扩展（Vite）环境变量

扩展只关心一个变量：

- `VITE_API_BASE_URL`：前端调用的 API 基础 URL。

这个变量通过仓库根目录下的 `.env.*` 文件提供，并在 `packages/config` 中做校验：

- `buildClientConfigFromViteEnv` 会从 `import.meta.env.VITE_API_BASE_URL` 读取并验证；
- `apps/extension/src/config/env.ts` 会基于它导出 `API_BASE_URL` 供其它代码使用。

### 2.1 本地开发

在仓库根目录复制并编辑：

````bash
cp .env.example .env.local
# 打开 .env.local，确认：
VITE_API_BASE_URL=http://localhost:8787
````

### 2.2 生产构建

在根目录创建或更新 `.env.production`：

````bash
VITE_API_BASE_URL=https://aura-api.your-domain.com
````

或者在打包前导出环境变量：

````bash
export VITE_API_BASE_URL=https://aura-api.your-domain.com
````

之后运行 `pnpm build` 时，Vite 会读取并验证 `VITE_API_BASE_URL`，生成指向你自己 API 的扩展包。

