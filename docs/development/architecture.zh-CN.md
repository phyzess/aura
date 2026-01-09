# 架构指南

## 概述

Aura 采用**基于功能的架构**（feature-based architecture），代码按功能/领域组织，而不是按技术层组织。这种方法提高了模块化程度、可维护性，并使功能更容易理解和修改。

## 目录结构

```
apps/extension/src/
├── features/              # 功能模块（业务逻辑）
│   ├── app/              # 应用级功能（主题、语言、更新日志）
│   ├── auth/             # 认证和用户管理
│   ├── collection/       # 集合管理
│   ├── export/           # 数据导出功能
│   ├── history/          # 撤销/重做历史
│   ├── import/           # 数据导入功能
│   ├── locale/           # 国际化
│   ├── sync/             # 跨设备同步
│   ├── tab/              # 标签页管理
│   ├── theme/            # 主题管理
│   └── workspace/        # 工作区管理
├── components/           # 共享 UI 组件
│   ├── ui/              # 通用 UI 组件（Button、Dialog 等）
│   └── shared/          # 共享业务组件（AuraLogo 等）
├── hooks/               # 共享 hooks
├── pages/               # 应用页面
├── services/            # 外部服务（Chrome API 等）
└── types/               # 共享 TypeScript 类型
```

## 功能模块结构

每个功能遵循一致的结构：

```
features/[feature-name]/
├── components/          # 功能特定的 React 组件
│   ├── ComponentA.tsx
│   ├── ComponentB.tsx
│   └── index.ts        # 重新导出所有组件
├── domain/             # 业务逻辑和操作
│   ├── operations.ts   # 数据操作的纯函数
│   ├── [other].ts      # 其他领域逻辑
│   └── index.ts        # 重新导出所有领域函数
├── hooks/              # 功能特定的 hooks
│   ├── useFeature.ts
│   └── index.ts        # 重新导出所有 hooks
├── store/              # 状态管理（Jotai atoms 和 actions）
│   ├── atoms.ts        # Jotai atoms
│   ├── actions.ts      # Jotai 只写 atoms（actions）
│   └── index.ts        # 重新导出所有 atoms 和 actions
└── index.ts            # 主入口点，重新导出所有内容
```

## 导入模式

### ✅ 推荐：直接从功能模块导入

为了最大的清晰度，直接从功能模块导入：

```typescript
// 组件
import { TabCard, AddTabModal } from '@/features/tab/components';
import { CollectionColumn } from '@/features/collection/components';

// 领域逻辑
import { createTab, updateTab } from '@/features/tab/domain';
import { createCollection } from '@/features/collection/domain';

// 状态管理
import { tabsAtom, addTabAtom } from '@/features/tab/store';
import { currentUserAtom, signInAtom } from '@/features/auth/store';

// Hooks
import { useTabSearch } from '@/features/tab/hooks';
```

### ✅ 备选：统一功能导入

为了方便，从统一的 `@/features` 入口点导入：

```typescript
import { 
  TabCard,
  createTab,
  tabsAtom,
  addTabAtom,
  currentUserAtom 
} from '@/features';
```

### ❌ 避免：深层导入

不要从内部实现文件导入：

```typescript
// ❌ 不好 - 从内部文件导入
import { TabCard } from '@/features/tab/components/TabCard';
import { createTab } from '@/features/tab/domain/operations';
```

## 状态管理（Jotai）

### Atoms

Atoms 保存状态，定义在 `features/[feature]/store/atoms.ts`：

```typescript
// features/tab/store/atoms.ts
import { atom } from 'jotai';
import type { TabItem } from '@/types';

export const tabsAtom = atom<TabItem[]>([]);
export const selectedTabIdAtom = atom<string | null>(null);
```

### Actions

Actions 是只写 atoms，封装状态更新：

```typescript
// features/tab/store/actions.ts
import { atom } from 'jotai';
import { tabsAtom } from './atoms';
import { createTab } from '../domain';

export const addTabAtom = atom(
  null,
  (get, set, params: { collectionId: string; url: string; title: string }) => {
    const tabs = get(tabsAtom);
    const newTab = createTab(params);
    set(tabsAtom, [...tabs, newTab]);
  }
);
```

### 在组件中使用

```typescript
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { tabsAtom, addTabAtom } from '@/features/tab/store';

function TabList() {
  // 只读
  const tabs = useAtomValue(tabsAtom);
  
  // 只写
  const addTab = useSetAtom(addTabAtom);
  
  // 读写
  const [selectedId, setSelectedId] = useAtom(selectedTabIdAtom);
  
  return (
    <div>
      {tabs.map(tab => <TabCard key={tab.id} tab={tab} />)}
      <button onClick={() => addTab({ collectionId: 'c1', url: '...', title: '...' })}>
        添加标签页
      </button>
    </div>
  );
}
```

## 领域逻辑

领域逻辑包含用于数据操作的纯函数。这些函数：

- 是纯函数（无副作用）
- 不依赖 React 或 Jotai
- 易于测试
- 可以在功能之间共享

```typescript
// features/tab/domain/operations.ts
import type { TabItem } from '@/types';

export const createTab = (params: {
  collectionId: string;
  url: string;
  title: string;
}): TabItem => {
  return {
    id: crypto.randomUUID(),
    ...params,
    order: 0,
    isPinned: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
};
```


