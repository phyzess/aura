# Aura 快速上手（中文）

面向第一次接触这个仓库的开发者：本指南分两部分说明：

1. 如何在本地同时跑起来 API 和 Chrome 扩展；
2. 如何把前后端都部署到你自己的环境。

---

## 1. 前置条件

- Node.js 20+
- pnpm 10+
- Cloudflare 账号
- 已在 Cloudflare Dashboard 创建一个 D1 数据库（稍后会在 wrangler.toml 中绑定）

在仓库根目录安装依赖：

````bash
pnpm install
````

---

## 2. 本地开发：同时启动 API 和扩展

### 2.1 配置扩展的本地环境（根目录）

1. 在仓库根目录创建本地环境文件：

````bash
cp .env.example .env.local
````

2. 打开根目录下的 `.env.local`，至少保证：

````bash
VITE_API_BASE_URL=http://localhost:8787
````

> 这告诉扩展：把所有 API 请求发到本地运行的 Worker（默认 8787 端口）。

### 2.2 配置 API 的本地环境

1. 编辑 `apps/api/wrangler.toml` 顶部的 `[vars]`：

	````toml
	[vars]
	BETTER_AUTH_URL = "http://localhost:8787"
	BETTER_AUTH_TRUSTED_ORIGINS = "http://localhost:5173,chrome-extension://*"
	````

2. 在 `apps/api` 目录创建 `.dev.vars` 文件，专门存放本地开发用的机密变量（不要提交到 Git）：

	````bash
	# apps/api/.dev.vars
	BETTER_AUTH_SECRET=your-dev-secret-here
	````

	Wrangler 在本地 `wrangler dev` 时会自动读取 `.dev.vars`。生产环境的机密请仍然通过 Cloudflare Secrets 配置（见下文）。

### 2.3 启动本地服务

在仓库根目录打开两个终端：

1. 终端 A：启动 API（Cloudflare Worker dev）：

	````bash
	pnpm dev:api
	````

2. 终端 B：启动扩展开发服务器：

	````bash
	pnpm dev
	````

此时：

- API 通过 Cloudflare Worker 在本地 8787 端口提供服务；
- 扩展通过 Vite dev server 提供前端，`VITE_API_BASE_URL` 指向本地 API。

---

## 3. 部署到你自己的环境（自建前后端）

这一部分假设你已经有自己的域名，例如：

- API：`https://aura-api.your-domain.com`

### 3.1 部署 API（Cloudflare Worker + D1）

1. 在 `apps/api/wrangler.toml` 中配置生产环境非机密变量：

	````toml
	[env.production.vars]
	BETTER_AUTH_URL = "https://aura-api.your-domain.com"
	BETTER_AUTH_TRUSTED_ORIGINS = "https://app.your-domain.com,chrome-extension://YOUR_PROD_EXTENSION_ID"
	````

2. 在同一个文件中，确保 `[[env.production.d1_databases]]` 使用的是你在 Cloudflare 创建的 D1 数据库：

	````toml
	[[env.production.d1_databases]]
	binding = "DB"
	database_name = "你的 D1 名称"
	database_id = "你的 D1 ID"
	migrations_dir = "drizzle"
	````

3. 通过 Cloudflare Secrets 设置生产环境的 `BETTER_AUTH_SECRET`：

	````bash
	pnpm --filter @aura/api wrangler secret put BETTER_AUTH_SECRET --env production
	````

4. 部署 API：

	````bash
	pnpm deploy:api
	````

5. 当你修改数据库 schema 时，把迁移应用到生产 D1：

	````bash
	pnpm db:migrate:remote
	````

### 3.2 打包并发布扩展

1. 在仓库根目录创建或更新 `.env.production`，指向你刚部署好的 API：

	````bash
	VITE_API_BASE_URL=https://aura-api.your-domain.com
	````

2. 在根目录构建扩展：

	````bash
	pnpm build
	````

	   构建完成后，压缩包会出现在：

	   ````text
	   apps/extension/release/crx-aura-<version>.zip
	   ````

你可以把这个 zip 上传到 Chrome Web Store，或在 Chrome 中以「已解压扩展程序」的方式加载。

---

## 4. 进阶：在生产配置下本地调试 API

有时你想在本地以生产配置进行调试（使用相同的绑定与 D1）：

````bash
pnpm dev:api:prod
````

这会运行 `wrangler dev --env production`，直接使用生产环境的配置与数据库，请谨慎使用。

---

## 5. 推荐阅读

- `docs/env.zh-CN.md` – 更完整的环境变量说明，以及 `@aura/config` 如何做校验
- `docs/release.zh-CN.md` – 从版本管理（Changesets）到打包扩展、部署 API 的完整发布流程
