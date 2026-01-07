# 认证配置指南

本指南说明如何为 Aura 配置各种认证提供商。

## 目录

- [Cloudflare KV 配置](#cloudflare-kv-配置)
- [Cloudflare Turnstile 配置](#cloudflare-turnstile-配置)
- [Google OAuth 配置](#google-oauth-配置)
- [GitHub OAuth 配置](#github-oauth-配置)
- [邮箱验证](#邮箱验证)

---

## Cloudflare KV 配置

KV 用于存储邮箱验证的临时验证码。

### 1. 创建 KV 命名空间

```bash
# 开发环境
wrangler kv namespace create "AUTH_KV"

# 预览环境（可选）
wrangler kv namespace create "AUTH_KV" --preview
```

### 2. 更新 wrangler.toml

在 `apps/api/wrangler.toml` 中替换占位符 ID：

```toml
[[kv_namespaces]]
binding = "AUTH_KV"
id = "你的-kv-命名空间-id"
preview_id = "你的-预览-kv-命名空间-id"
```

生产环境：

```toml
[[env.production.kv_namespaces]]
binding = "AUTH_KV"
id = "你的-生产环境-kv-命名空间-id"
```

### 3. 设置认证密钥

**本地开发环境：**

创建 `.dev.vars` 文件：

```bash
cd apps/api
cp .dev.vars.example .dev.vars
```

编辑 `.dev.vars` 并设置密钥：

```bash
# 生成随机密钥（至少 32 个字符）
openssl rand -base64 32

# 添加到 .dev.vars
BETTER_AUTH_SECRET="粘贴生成的密钥"
```

**生产环境：**

使用 Cloudflare Secrets（更安全）：

```bash
wrangler secret put BETTER_AUTH_SECRET --env production
# 输入一个随机字符串（至少 32 个字符）
```

---

## Cloudflare Turnstile 配置

Turnstile 为注册和登录表单提供机器人防护。

### 1. 创建 Turnstile 站点

1. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/) → Zero Trust → Turnstile
2. 点击 "Add Site"
3. 配置：
   - **站点名称**: Aura
   - **域名**: 你的域名（开发环境可用 `localhost`）
   - **Widget 模式**: Managed（推荐）
4. 复制 **Site Key** 和 **Secret Key**

### 2. 配置密钥

**本地开发：**

添加到 `apps/api/.dev.vars`：

```bash
TURNSTILE_SECRET_KEY="你的-turnstile-secret-key"
```

**生产环境：**

使用 Cloudflare Secrets：

```bash
wrangler secret put TURNSTILE_SECRET_KEY --env production
```

### 3. 添加到前端

Site key 需要添加到扩展的环境变量：

```env
VITE_TURNSTILE_SITE_KEY=你的-turnstile-site-key
```

---

## Google OAuth 配置

### 1. 创建 Google OAuth 凭据

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用 "Google+ API"
4. 进入 "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. 配置：
   - **应用类型**: Web application
   - **授权重定向 URI**: 
     - `http://localhost:8787/api/auth/callback/google` (开发环境)
     - `https://你的-api-域名.com/api/auth/callback/google` (生产环境)
6. 复制 **Client ID** 和 **Client Secret**

### 2. 配置 OAuth 凭据

**Client ID（公开，可提交到 git）：**

添加到 `apps/api/wrangler.toml`：

```toml
[vars]
GOOGLE_CLIENT_ID = "你的-google-client-id.apps.googleusercontent.com"
```

**Client Secret（敏感信息，不要提交）：**

本地开发，添加到 `apps/api/.dev.vars`：

```bash
GOOGLE_CLIENT_SECRET="你的-google-client-secret"
```

生产环境使用 Cloudflare Secrets：

```bash
wrangler secret put GOOGLE_CLIENT_SECRET --env production
```

**生产环境的 Client ID（仅在使用不同 OAuth 应用时需要）：**

如果生产环境使用与开发环境**相同的** Google OAuth 应用，则不需要在 `[env.production.vars]` 中重复设置，会自动继承 `[vars]` 中的值。

如果生产环境使用**不同的** OAuth 应用（推荐），则添加到 `wrangler.toml`：

```toml
[env.production.vars]
GOOGLE_CLIENT_ID = "你的-生产环境-google-client-id.apps.googleusercontent.com"
```

---

## GitHub OAuth 配置

### 1. 创建 GitHub OAuth 应用

**推荐做法：为开发和生产环境创建两个独立的 OAuth App**

#### 开发环境 OAuth App

1. 访问 [GitHub Settings](https://github.com/settings/developers) → OAuth Apps
2. 点击 "New OAuth App"
3. 配置：
   - **应用名称**: `Aura Dev` (或 `Aura - Development`)
   - **主页 URL**: `http://localhost:8787`
   - **授权回调 URL**: `http://localhost:8787/api/auth/callback/github`
4. 点击 "Register application"
5. 复制并保存 **Client ID** 和 **Client Secret**

#### 生产环境 OAuth App

1. 再次点击 "New OAuth App" 创建第二个应用
2. 配置：
   - **应用名称**: `Aura` (或 `Aura - Production`)
   - **主页 URL**: `https://aura-api.phyzess.me` (替换为你的域名)
   - **授权回调 URL**: `https://aura-api.phyzess.me/api/auth/callback/github`
3. 点击 "Register application"
4. 复制并保存 **Client ID** 和 **Client Secret**

> **⚠️ 重要提示：**
> - GitHub OAuth App **不支持**在一个应用中配置多个回调 URL
> - 如果在回调 URL 字段中填写多个地址（用逗号分隔），会导致 OAuth 流程失败并报错
> - 因此强烈建议为开发和生产环境创建两个独立的 OAuth App

### 2. 配置 OAuth 凭据

#### 开发环境配置

**Client ID（公开，可提交到 git）：**

添加到 `apps/api/wrangler.toml`：

```toml
[vars]
# Development environment - for local testing
GITHUB_CLIENT_ID = "Ov23liqER5n9iRD0qAAO"  # 替换为你的开发环境 Client ID
```

**Client Secret（敏感信息，不要提交）：**

添加到 `apps/api/.dev.vars`：

```bash
GITHUB_CLIENT_SECRET="你的-开发环境-client-secret"
```

#### 生产环境配置

**Client ID（公开，可提交到 git）：**

添加到 `apps/api/wrangler.toml` 的生产环境部分：

```toml
[env.production.vars]
# Production OAuth Client IDs (create separate OAuth apps for production)
GITHUB_CLIENT_ID = "你的-生产环境-github-client-id"
```

**Client Secret（敏感信息，使用 Cloudflare Secrets）：**

```bash
wrangler secret put GITHUB_CLIENT_SECRET --env production
# 输入你的生产环境 Client Secret
```

**生产环境的 Client ID（仅在使用不同 OAuth 应用时需要）：**

如果生产环境使用与开发环境**相同的** GitHub OAuth 应用，则不需要在 `[env.production.vars]` 中重复设置，会自动继承 `[vars]` 中的值。

如果生产环境使用**不同的** OAuth 应用（推荐），则添加到 `wrangler.toml`：

```toml
[env.production.vars]
GITHUB_CLIENT_ID = "你的-生产环境-github-client-id"
```

---

## 邮箱验证

邮箱验证使用 MailChannels，对 Cloudflare Workers 免费。

### 配置

无需额外配置！MailChannels 在 Cloudflare Workers 中自动可用。

### 自定义

要自定义发件人邮箱，编辑 `apps/api/src/auth/email.ts`：

```typescript
const fromEmail = options.from?.email || "noreply@你的域名.com";
const fromName = options.from?.name || "你的应用名称";
```

---

## 测试

### 本地开发

1. 启动 API：
   ```bash
   pnpm dev:api
   ```

2. 启动扩展：
   ```bash
   pnpm dev:extension
   ```

3. 点击社交登录按钮测试 OAuth 流程

### 生产环境

1. 部署 API：
   ```bash
   pnpm deploy:api
   ```

2. 构建扩展：
   ```bash
   pnpm build:extension
   ```

---

## 故障排查

### OAuth 重定向问题

- 确保回调 URL 在 OAuth 提供商设置中完全匹配
- 检查 `BETTER_AUTH_URL` 设置正确
- 验证 `BETTER_AUTH_TRUSTED_ORIGINS` 包含你的扩展来源

### 邮件发送失败

- 检查 Cloudflare Workers 日志中的错误
- 验证邮箱地址格式有效
- MailChannels 可能有速率限制

### KV 不工作

- 验证 KV 命名空间在 wrangler.toml 中正确绑定
- 检查 KV 命名空间 ID 是否正确
- 确保已运行 `wrangler kv namespace create`（注意：是空格，不是冒号）

