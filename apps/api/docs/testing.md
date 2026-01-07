# API Integration Tests

本目录包含 Aura API 的集成测试，使用真实的 Cloudflare D1 数据库和 KV 存储。

## 测试策略

我们采用**数据层集成测试**策略：
- ✅ 使用真实的 D1 数据库（通过 `wrangler getPlatformProxy`）
- ✅ 测试数据访问层（Data Layer）的业务逻辑
- ✅ 使用简化的 mock 认证（绕过 Better Auth 的复杂性）
- ✅ 专注于核心业务逻辑和数据完整性

## 目录结构

```
__tests__/
├── helpers/
│   ├── test-db.ts          # 数据库初始化和清理
│   ├── test-auth.ts        # Mock 用户创建
│   ├── test-data.ts        # 测试数据创建 helpers
│   └── test-env.ts         # 测试环境配置
└── handlers/
    ├── sync/
    │   └── pull.integration.test.ts  # Sync Pull 数据层测试
    └── user/
        └── me.test.ts      # User Me endpoint 测试（部分完成）
```

## 运行测试

```bash
# 运行特定测试文件（推荐）
pnpm -F @aura/api test pull.integration.test.ts
pnpm -F @aura/api test push.integration.test.ts
pnpm -F @aura/api test sync-cycle.integration.test.ts
pnpm -F @aura/api test error-handling.integration.test.ts

# 运行所有测试（可能会遇到数据库锁问题）
pnpm -F @aura/api test

# Watch 模式
pnpm -F @aura/api test:watch
```

**注意**: 由于 Cloudflare D1 的本地模拟器限制，并发运行多个测试文件可能会遇到 `SQLITE_BUSY` 错误。这是预期行为，建议单独运行每个测试文件。

## 代码覆盖率

```bash
# 生成覆盖率报告（单个测试文件）
pnpm -F @aura/api test --coverage pull.integration.test.ts

# 生成所有测试的覆盖率报告
pnpm -F @aura/api test:coverage

# 查看 HTML 覆盖率报告
# 报告生成在 apps/api/coverage/index.html
open apps/api/coverage/index.html
```

### 覆盖率报告说明

覆盖率报告包含以下指标：

- **% Stmts** - 语句覆盖率：执行的语句占总语句的百分比
- **% Branch** - 分支覆盖率：执行的分支（if/else）占总分支的百分比
- **% Funcs** - 函数覆盖率：调用的函数占总函数的百分比
- **% Lines** - 行覆盖率：执行的代码行占总代码行的百分比

当前测试主要覆盖数据层（`src/data/`）和数据库 schema（`src/db/`），覆盖率约为 50-60%。

## 已实现的测试

### ✅ Sync Pull Data Layer (5 tests) - `pull.integration.test.ts`

测试 `sync/pull` 的数据访问层：

1. **空数据测试** - 新用户应返回空数组
2. **初始同步** - 返回用户的所有数据（workspace, collection, tab）
3. **增量同步** - 只返回 `lastSyncTimestamp` 之后更新的数据
4. **软删除** - 包含已删除的数据（用于客户端同步）
5. **数据隔离** - 不返回其他用户的数据

### ✅ Sync Push Data Layer (10 tests) - `push.integration.test.ts`

测试 `sync/push` 的数据写入操作：

**Workspace Operations (4 tests)**
1. **创建** - 创建新的 workspace
2. **更新** - 更新现有 workspace
3. **软删除** - 标记 workspace 为已删除
4. **批量操作** - 批量创建多个 workspaces

**Collection Operations (3 tests)**
5. **创建** - 创建新的 collection
6. **更新** - 更新现有 collection
7. **软删除** - 标记 collection 为已删除

**Tab Operations (3 tests)**
8. **创建** - 创建新的 tab
9. **更新** - 更新现有 tab（包括 URL、title、isPinned）
10. **软删除** - 标记 tab 为已删除

### ✅ Sync Cycle Integration (5 tests) - `sync-cycle.integration.test.ts`

测试完整的同步周期：

1. **完整同步周期** - 测试 pull -> push -> pull 的完整流程
2. **增量同步** - 测试基于时间戳的增量同步
3. **并发更新** - 测试 last-write-wins 策略
4. **数据一致性** - 测试跨多个实体的关系完整性
5. **软删除同步** - 测试软删除在同步中的处理

### ✅ Error Handling Integration (10 tests) - `error-handling.integration.test.ts`

测试错误处理和边界情况：

**Foreign Key Constraints (2 tests)**
1. **Collection 外键约束** - 测试创建 collection 时 workspace 不存在的情况
2. **Tab 外键约束** - 测试创建 tab 时 collection 不存在的情况

**Cascade Delete (2 tests)**
3. **Workspace 级联删除** - 测试删除 workspace 时级联删除 collections
4. **Collection 级联删除** - 测试删除 collection 时级联删除 tabs

**Empty Data Handling (2 tests)**
5. **空数组处理** - 测试空数组的 upsert 和 delete 操作
6. **不存在的用户** - 测试查询不存在用户的数据

**Duplicate ID Handling (1 test)**
7. **重复 ID 更新** - 测试使用相同 ID 插入时的 upsert 行为

**Large Batch Operations (1 test)**
8. **大批量操作** - 测试批量插入 50 个 workspaces

**Timestamp Edge Cases (2 tests)**
9. **旧时间戳** - 测试非常旧的时间戳
10. **时间戳过滤** - 测试基于时间戳的正确过滤

## 测试统计

- **总测试数**: 30 个
- **测试文件**: 4 个
- **覆盖功能**:
  - ✅ 数据读取（Pull）
  - ✅ 数据写入（Push）
  - ✅ 完整同步周期
  - ✅ 增量同步
  - ✅ 软删除
  - ✅ 数据隔离
  - ✅ 批量操作
  - ✅ 错误处理
  - ✅ 外键约束
  - ✅ 级联删除
  - ✅ 边界情况

## 测试辅助函数

### test-db.ts

```typescript
// 初始化数据库 schema
await initTestDb(db);

// 清理所有测试数据
await cleanupTestDb(db);
```

### test-auth.ts

```typescript
// 创建 mock 用户（绕过 Better Auth）
const user = await createMockUser(db, email, name);
```

### test-data.ts

```typescript
// 创建测试 workspace
const workspace = await createTestWorkspace(db, userId, {
  name: "My Workspace",
  order: 0,
});

// 创建测试 collection
const collection = await createTestCollection(db, workspaceId, userId, {
  name: "My Collection",
});

// 创建测试 tab
const tab = await createTestTab(db, collectionId, userId, {
  url: "https://example.com",
  title: "Example",
  isPinned: true,
});
```

## 测试模式

### 标准测试结构

```typescript
describe("Feature Name", () => {
  let env: Env;
  let cleanup: () => Promise<void>;
  let db: D1Database;

  beforeEach(async () => {
    // 获取 Cloudflare bindings
    const proxy = await getPlatformProxy();
    db = proxy.env.DB as D1Database;
    const kv = proxy.env.AUTH_KV as KVNamespace;

    // 初始化数据库
    await initTestDb(db);

    env = createTestEnv(db, kv);
    cleanup = proxy.dispose;
  });

  afterEach(async () => {
    // 清理数据
    if (db) {
      await cleanupTestDb(db);
    }
    if (cleanup) {
      await cleanup();
    }
  });

  it("should do something", async () => {
    // Arrange - 准备测试数据
    const user = await createMockUser(db, "test@example.com");
    
    // Act - 执行操作
    const result = await someFunction(user.id);
    
    // Assert - 验证结果
    expect(result).toBeDefined();
  });
});
```

## 下一步计划

### 待实现的测试

1. **Sync Push Data Layer** - 测试数据创建、更新、删除
2. **User Me Handler** - 完成认证集成（需要解决 Better Auth cookie 问题）
3. **数据验证** - 测试输入验证和错误处理
4. **并发测试** - 测试并发更新和冲突解决

### 改进方向

1. **性能测试** - 测试大量数据的同步性能
2. **边界测试** - 测试极端情况和边界条件
3. **错误恢复** - 测试错误处理和恢复机制

## 注意事项

1. **数据隔离** - 每个测试都应该清理自己的数据
2. **时间戳** - 使用 `Date.now()` 创建时间戳，注意时间精度
3. **异步操作** - 所有数据库操作都是异步的，记得 `await`
4. **Mock 认证** - 当前使用简化的 mock，不测试真实的 Better Auth 流程

## 贡献指南

添加新测试时：

1. 遵循现有的测试结构和命名约定
2. 使用 helper 函数创建测试数据
3. 确保测试是独立的（不依赖其他测试）
4. 添加清晰的注释说明测试目的
5. 在 beforeEach/afterEach 中正确清理资源

