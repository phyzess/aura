# GitHub OAuth 快速设置指南

## 🎯 为什么需要两个 OAuth App？

GitHub OAuth App **不支持**在一个应用中配置多个回调 URL。如果你在回调 URL 字段中填写：

```
http://localhost:8787/api/auth/callback/github,https://aura-api.phyzess.me/api/auth/callback/github
```

会导致 OAuth 流程失败，报错：`Cannot read properties of undefined (reading 'getRedirectURL')`

**解决方案：为开发和生产环境创建两个独立的 OAuth App**

---

## 📝 步骤 1：创建开发环境 OAuth App

1. 访问 [GitHub Developer Settings](https://github.com/settings/developers)
2. 点击 **"New OAuth App"**
3. 填写信息：

   | 字段 | 值 |
   |------|-----|
   | Application name | `Aura Dev` |
   | Homepage URL | `http://localhost:8787` |
   | Authorization callback URL | `http://localhost:8787/api/auth/callback/github` |

4. 点击 **"Register application"**
5. 复制 **Client ID** 和 **Client Secret**

---

## 📝 步骤 2：创建生产环境 OAuth App

1. 再次点击 **"New OAuth App"**
2. 填写信息：

   | 字段 | 值 |
   |------|-----|
   | Application name | `Aura` |
   | Homepage URL | `https://aura-api.phyzess.me` |
   | Authorization callback URL | `https://aura-api.phyzess.me/api/auth/callback/github` |

3. 点击 **"Register application"**
4. 复制 **Client ID** 和 **Client Secret**

---

## ⚙️ 步骤 3：配置开发环境

### 3.1 配置 Client ID（公开）

编辑 `apps/api/wrangler.toml`：

```toml
[vars]
BETTER_AUTH_URL = "http://localhost:8787"
BETTER_AUTH_TRUSTED_ORIGINS = "http://localhost:5173,chrome-extension://*"

# Development environment - for local testing
GITHUB_CLIENT_ID = "Ov23liqER5n9iRD0qAAO"  # 替换为你的开发环境 Client ID
```

### 3.2 配置 Client Secret（敏感）

编辑 `apps/api/.dev.vars`：

```bash
# Required: Authentication secret (at least 32 characters)
BETTER_AUTH_SECRET=your-secret-here-at-least-32-characters

# GitHub OAuth (Development)
GITHUB_CLIENT_SECRET=你的-开发环境-client-secret
```

---

## ⚙️ 步骤 4：配置生产环境

### 4.1 配置 Client ID（公开）

编辑 `apps/api/wrangler.toml`，在生产环境部分添加：

```toml
[env.production.vars]
BETTER_AUTH_URL = "https://aura-api.phyzess.me"
BETTER_AUTH_TRUSTED_ORIGINS = "chrome-extension://ojpnnkcmnbpnkhlohnkbdopkhfgjfhph"

# Production OAuth Client IDs
GITHUB_CLIENT_ID = "你的-生产环境-github-client-id"
```

### 4.2 配置 Client Secret（敏感）

使用 Cloudflare Secrets：

```bash
wrangler secret put GITHUB_CLIENT_SECRET --env production
# 输入你的生产环境 Client Secret
```

---

## 🚀 步骤 5：测试

### 开发环境测试

1. 重启开发服务器：
   ```bash
   pnpm dev:api
   ```

2. 在浏览器中打开 `http://localhost:5173`

3. 点击 GitHub 图标登录

4. 应该会跳转到 GitHub 授权页面，授权后跳转回应用

### 生产环境测试

部署后访问你的生产环境 URL 并测试 GitHub 登录。

---

## ❌ 常见错误

### 错误 1：回调 URL 配置错误

**错误信息：**
```
Cannot read properties of undefined (reading 'getRedirectURL')
```

**原因：** 在 GitHub OAuth App 的回调 URL 中填写了多个地址（用逗号分隔）

**解决：** 创建两个独立的 OAuth App，每个只配置一个回调 URL

### 错误 2：忘记重启开发服务器

**错误信息：** 各种认证相关错误

**原因：** 修改 `.dev.vars` 后没有重启服务器

**解决：** 停止并重新启动开发服务器

---

## 📋 检查清单

- [ ] 创建了开发环境 GitHub OAuth App
- [ ] 创建了生产环境 GitHub OAuth App
- [ ] 在 `wrangler.toml` 中配置了开发环境 Client ID
- [ ] 在 `.dev.vars` 中配置了开发环境 Client Secret
- [ ] 在 `wrangler.toml` 中配置了生产环境 Client ID
- [ ] 使用 `wrangler secret put` 配置了生产环境 Client Secret
- [ ] 重启了开发服务器
- [ ] 测试了 GitHub 登录功能

---

## 🔗 相关链接

- [GitHub OAuth Apps 文档](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app)
- [Better Auth 文档](https://www.better-auth.com/docs)
- [Cloudflare Workers Secrets](https://developers.cloudflare.com/workers/configuration/secrets/)

