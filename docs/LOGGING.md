# Logging System

Aura 使用 [LogTape](https://github.com/dahlia/logtape) 作为统一的日志系统，支持 Extension 和 API。

## 特性

- ✅ **零依赖** - LogTape 无外部依赖，体积小
- ✅ **结构化日志** - 支持 JSON 格式，便于分析
- ✅ **多级别** - debug, info, warning, error, fatal
- ✅ **分类系统** - 层级化的 logger 分类
- ✅ **Extension 日志存储** - IndexedDB 本地存储（最多 1000 条）
- ✅ **日志导出** - 一键导出为 JSON 文件
- ✅ **环境感知** - 开发/生产环境自动调整日志级别

## 使用方法

### Extension

```typescript
import { syncLogger, authLogger, uiLogger } from "@/config/logger";

// 基础日志
syncLogger.info("Sync started");

// 带上下文的日志
syncLogger.info("Sync completed", {
  workspacesCount: 5,
  duration: 1234,
});

// 错误日志
syncLogger.error("Sync failed", { error });

// 调试日志（仅开发环境）
syncLogger.debug("Debug info", { data });
```

### API

```typescript
import { syncLogger, authLogger, dbLogger } from "@/logger";

// 请求日志（自动通过 middleware 记录）
// 手动记录特定事件
syncLogger.info("Push request summary", {
  userId,
  workspacesCount: 10,
});

// 数据库操作
dbLogger.debug("Query executed", { table: "workspaces", duration: 12 });

// 错误日志
errorLogger.error("Database error", { error });
```

## 日志分类

### Extension

- `extension.sync` - 同步相关
- `extension.auth` - 认证相关
- `extension.storage` - 本地存储
- `extension.ui` - UI 交互
- `extension.error` - 错误追踪

### API

- `api.sync` - 同步 API
- `api.auth` - 认证 API
- `api.db` - 数据库操作
- `api.request` - HTTP 请求（自动记录）
- `api.error` - 错误追踪

## Extension 日志管理

### 导出日志

```typescript
import { exportLogs } from "@/services/logger";

// 导出所有日志
await exportLogs();

// 导出最近 24 小时的错误日志
await exportLogs({
  level: "error",
  since: Date.now() - 86400000,
});
```

### 查看日志统计

```typescript
import { getLogStats } from "@/services/logger";

const stats = await getLogStats();
console.log(stats);
// {
//   total: 234,
//   byLevel: { debug: 100, info: 80, warning: 40, error: 14 },
//   oldestTimestamp: 1736420400000,
//   newestTimestamp: 1736506800000,
//   sizeInBytes: 123456
// }
```

### 清理日志

```typescript
import { clearAllLogs } from "@/services/logger";

await clearAllLogs();
```

### UI 组件

在 Settings 页面使用 `LogManager` 组件：

```tsx
import { LogManager } from "@/components/LogManager";

function SettingsPage() {
  return (
    <div>
      <h2>Settings</h2>
      <LogManager />
    </div>
  );
}
```

## 日志级别

| 级别 | 用途 | 开发环境 | 生产环境 |
|------|------|----------|----------|
| debug | 调试信息 | ✅ | ❌ |
| info | 一般信息 | ✅ | ✅ |
| warning | 警告 | ✅ | ✅ |
| error | 错误 | ✅ | ✅ |
| fatal | 致命错误 | ✅ | ✅ |

## 最佳实践

### ✅ 推荐

```typescript
// 使用结构化日志
logger.info("User logged in", { userId, timestamp });

// 使用合适的日志级别
logger.debug("Cache hit", { key }); // 调试信息
logger.info("Sync completed", { count }); // 正常操作
logger.warning("Rate limit approaching", { remaining }); // 警告
logger.error("API request failed", { error }); // 错误
```

### ❌ 避免

```typescript
// 不要使用 console.log
console.log("User logged in"); // ❌

// 不要记录敏感信息
logger.info("User password", { password: "secret" }); // ❌

// 不要在循环中记录大量日志
for (const item of items) {
  logger.debug("Processing item", { item }); // ❌ 可能产生大量日志
}
```

## 故障排查

### Extension 日志未保存

1. 检查 IndexedDB 是否可用
2. 查看浏览器控制台是否有错误
3. 尝试清理日志后重试

### API 日志未显示

1. 检查 Cloudflare Workers 日志面板
2. 确认日志级别配置正确
3. 验证 logger 是否正确初始化

## 迁移指南

从 `console.*` 迁移到 LogTape：

```typescript
// 之前
console.log("[sync] Syncing data...");
console.error("[sync] Failed:", error);

// 之后
syncLogger.info("Syncing data...");
syncLogger.error("Failed", { error });
```

