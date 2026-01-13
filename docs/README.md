# Aura Documentation

Welcome to the Aura documentation! This guide will help you get started with Aura, a tab and workspace manager Chrome extension with cross-device sync.

## 📚 Documentation Structure

### 🚀 Getting Started
Start here if you're new to Aura:

- [Quick Start Guide](./getting-started/quickstart.md) - Get up and running in 5 minutes
- [快速开始指南](./getting-started/quickstart.zh-CN.md) - 5分钟快速上手

### 📖 User Guides
Learn how to use and configure Aura:

- **Authentication**
  - [Auth Setup Guide](./guides/auth-setup.md) - Configure authentication (email, Google, GitHub)
  - [认证设置指南](./guides/auth-setup.zh-CN.md) - 配置认证（邮箱、Google、GitHub）
  - [GitHub OAuth Setup](./guides/github-oauth-setup.zh-CN.md) - GitHub OAuth 配置

- **Features**
  - [New Tab Override](./guides/newtab-override.md) - Replace Chrome's new tab page
  - [新标签页覆盖](./guides/newtab-override.zh-CN.md) - 替换 Chrome 新标签页
  - [Testing New Tab](./guides/testing-newtab.md) - Test new tab override locally
  - [测试新标签页](./guides/testing-newtab.zh-CN.md) - 本地测试新标签页覆盖

### 🛠️ Development
For contributors and developers:

- **Architecture**
  - [Architecture Guide](./development/architecture.md) - Feature-based architecture explained
  - [架构指南](./development/architecture.zh-CN.md) - 基于功能的架构说明

- **Setup**
  - [Environment Variables](./development/env.md) - Configure environment variables
  - [环境变量配置](./development/env.zh-CN.md) - 配置环境变量
  - [Secrets Management](./development/secrets.md) - Manage API keys and secrets

- **Release**
  - [Release Process](./development/release.md) - How to release new versions
  - [发布流程](./development/release.zh-CN.md) - 如何发布新版本

- **Logging**
  - [Logging System](./LOGGING.md) - Unified logging system guide

## 🏗️ Architecture Documentation

### API (Cloudflare Workers)
Located in `apps/api/`:

- [API README](../apps/api/README.md) - API overview and quick start
- [Data Layer API](../apps/api/docs/data-layer.md) - Database access layer documentation
- [Testing Guide](../apps/api/docs/testing.md) - How to write and run tests

### Extension (Chrome Extension)
See the main [README](../README.md) for extension overview and development guide.

## 🔗 Quick Links

- [Main README](../README.md) - Project overview
- [Contributing Guide](../CONTRIBUTING.md) - How to contribute to Aura
- [API Changelog](../apps/api/CHANGELOG.md) - API version history
- [Extension Changelog](../apps/extension/CHANGELOG.md) - Extension version history

## 📝 Documentation Conventions

- **English** - Primary language for all documentation
- **中文 (Chinese)** - Available for key guides (marked with `.zh-CN.md`)
- **Markdown** - All documentation is written in Markdown
- **Code Examples** - Include practical code examples where applicable

## 🤝 Contributing to Documentation

Found an error or want to improve the docs? Please:

1. Check the [Contributing Guide](../CONTRIBUTING.md)
2. Submit a pull request with your changes
3. Follow the existing documentation structure and style

## 📮 Need Help?

- **Issues**: [GitHub Issues](https://github.com/your-repo/aura/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/aura/discussions)

---

**Last Updated**: 2026-01-09
