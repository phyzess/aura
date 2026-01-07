# Data Layer API Documentation

数据访问层（Data Layer）提供了对数据库的抽象访问接口，使用函数式编程风格实现。

## 概述

数据层位于 `src/data/` 目录，为每个实体提供 CRUD 操作：

- `workspace.data.ts` - Workspace 数据访问
- `collection.data.ts` - Collection 数据访问
- `tab.data.ts` - Tab 数据访问

## 设计原则

1. **函数式风格** - 所有函数都是纯函数，无副作用
2. **类型安全** - 使用 TypeScript 严格类型检查
3. **批量操作** - 支持批量 upsert 和 delete
4. **增量查询** - 支持基于时间戳的增量查询
5. **软删除** - 使用 `deletedAt` 字段标记删除

## Workspace Data API

### `createWorkspaceData(db: DrizzleD1Database)`

创建 Workspace 数据访问对象。

**参数:**
- `db: DrizzleD1Database` - Drizzle ORM 数据库实例

**返回:**
```typescript
{
  findByUserId: (userId: string, lastSyncTimestamp: number) => Promise<Workspace[]>
  batchUpsert: (items: Workspace[]) => Promise<void>
  batchDelete: (ids: string[]) => Promise<void>
}
```

### `findByUserId(userId: string, lastSyncTimestamp: number)`

查询用户的所有 workspaces。

**参数:**
- `userId: string` - 用户 ID
- `lastSyncTimestamp: number` - 上次同步时间戳（毫秒），0 表示获取所有数据

**返回:**
- `Promise<Workspace[]>` - Workspace 数组，包括软删除的项

**示例:**
```typescript
const workspaceData = createWorkspaceData(db);

// 获取所有 workspaces
const allWorkspaces = await workspaceData.findByUserId(userId, 0);

// 获取增量更新
const updatedWorkspaces = await workspaceData.findByUserId(userId, lastSyncTime);
```

### `batchUpsert(items: Workspace[])`

批量插入或更新 workspaces。

**参数:**
- `items: Workspace[]` - Workspace 数组

**返回:**
- `Promise<void>`

**行为:**
- 如果 ID 已存在，则更新
- 如果 ID 不存在，则插入
- 使用 SQLite 的 `ON CONFLICT DO UPDATE`

**示例:**
```typescript
await workspaceData.batchUpsert([
  {
    id: 'workspace-1',
    userId: 'user-1',
    name: 'My Workspace',
    order: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
]);
```

### `batchDelete(ids: string[])`

批量软删除 workspaces。

**参数:**
- `ids: string[]` - Workspace ID 数组

**返回:**
- `Promise<void>`

**行为:**
- 设置 `deletedAt` 为当前时间戳
- 不会物理删除数据
- 级联软删除关联的 collections 和 tabs

**示例:**
```typescript
await workspaceData.batchDelete(['workspace-1', 'workspace-2']);
```

## Collection Data API

### `createCollectionData(db: DrizzleD1Database)`

创建 Collection 数据访问对象。

**参数:**
- `db: DrizzleD1Database` - Drizzle ORM 数据库实例

**返回:**
```typescript
{
  findByUserId: (userId: string, lastSyncTimestamp: number) => Promise<Collection[]>
  batchUpsert: (items: Collection[]) => Promise<void>
  batchDelete: (ids: string[]) => Promise<void>
}
```

### API 方法

与 Workspace Data API 相同，但操作 Collection 实体。

**注意:**
- Collection 必须关联到有效的 Workspace（外键约束）
- 删除 Collection 会级联软删除关联的 Tabs

## Tab Data API

### `createTabData(db: DrizzleD1Database)`

创建 Tab 数据访问对象。

**参数:**
- `db: DrizzleD1Database` - Drizzle ORM 数据库实例

**返回:**
```typescript
{
  findByUserId: (userId: string, lastSyncTimestamp: number) => Promise<TabItem[]>
  batchUpsert: (items: TabItem[]) => Promise<void>
  batchDelete: (ids: string[]) => Promise<void>
}
```

### API 方法

与 Workspace Data API 相同，但操作 TabItem 实体。

**注意:**
- Tab 必须关联到有效的 Collection（外键约束）

## 数据模型

### Workspace

```typescript
interface Workspace {
  id: string;
  userId: string;
  name: string;
  description?: string | null;
  order: number;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;
}
```

### Collection

```typescript
interface Collection {
  id: string;
  workspaceId: string;
  userId: string;
  name: string;
  order: number;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;
}
```

### TabItem

```typescript
interface TabItem {
  id: string;
  collectionId: string;
  userId: string;
  url: string;
  title: string;
  faviconUrl?: string | null;
  isPinned: boolean;
  order: number;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;
}
```

## 错误处理

数据层函数可能抛出以下错误：

### 外键约束错误

```typescript
// 创建 Collection 时 Workspace 不存在
Error: FOREIGN KEY constraint failed: SQLITE_CONSTRAINT
```

**解决方案:** 确保先创建 Workspace，再创建 Collection

### 数据库锁错误

```typescript
// 并发访问数据库
Error: NOSENTRY database is locked: SQLITE_BUSY
```

**解决方案:** 在测试中单独运行测试文件，避免并发访问

## 最佳实践

### 1. 批量操作

优先使用批量操作而不是单个操作：

```typescript
// ✅ 好的做法
await workspaceData.batchUpsert([workspace1, workspace2, workspace3]);

// ❌ 不好的做法
await workspaceData.batchUpsert([workspace1]);
await workspaceData.batchUpsert([workspace2]);
await workspaceData.batchUpsert([workspace3]);
```

### 2. 增量同步

使用时间戳进行增量同步：

```typescript
// 首次同步
const allData = await workspaceData.findByUserId(userId, 0);

// 保存同步时间
const lastSyncTime = Date.now();

// 后续增量同步
const updates = await workspaceData.findByUserId(userId, lastSyncTime);
```

### 3. 软删除

使用软删除而不是物理删除：

```typescript
// ✅ 软删除（推荐）
await workspaceData.batchDelete([workspaceId]);

// ❌ 物理删除（不支持）
// 数据层不提供物理删除功能
```

### 4. 事务处理

对于需要原子性的操作，使用数据库事务：

```typescript
// 示例：创建 workspace 和 collection
await db.transaction(async (tx) => {
  const workspaceData = createWorkspaceData(tx);
  const collectionData = createCollectionData(tx);
  
  await workspaceData.batchUpsert([workspace]);
  await collectionData.batchUpsert([collection]);
});
```

## 性能考虑

### 批量大小

建议每批次不超过 100 个项目：

```typescript
import { chunk } from '@aura/shared/array';

const BATCH_SIZE = 100;
const batches = chunk(items, BATCH_SIZE);

for (const batch of batches) {
  await workspaceData.batchUpsert(batch);
}
```

### 索引

数据库已为以下字段创建索引：

- `userId` - 用于快速查询用户数据
- `updatedAt` - 用于增量同步
- `workspaceId` - 用于 Collection 查询
- `collectionId` - 用于 Tab 查询

## 测试

数据层有完整的集成测试覆盖：

- `pull.integration.test.ts` - 测试数据读取
- `push.integration.test.ts` - 测试数据写入
- `sync-cycle.integration.test.ts` - 测试完整同步周期
- `error-handling.integration.test.ts` - 测试错误处理

运行测试：

```bash
pnpm -F @aura/api test pull.integration.test.ts
pnpm -F @aura/api test push.integration.test.ts
pnpm -F @aura/api test sync-cycle.integration.test.ts
pnpm -F @aura/api test error-handling.integration.test.ts
```

## 相关文档

- [测试文档](../__tests__/README.md)
- [数据库 Schema](../src/db/app.schema.ts)
- [Domain Types](../../../packages/domain/src/types.ts)
