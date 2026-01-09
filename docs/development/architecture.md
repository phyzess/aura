# Architecture Guide

## Overview

Aura uses a **feature-based architecture** where code is organized by feature/domain rather than by technical layer. This approach improves modularity, maintainability, and makes it easier to understand and modify features.

## Directory Structure

```
apps/extension/src/
├── features/              # Feature modules (business logic)
│   ├── app/              # App-level features (theme, locale, changelog)
│   ├── auth/             # Authentication & user management
│   ├── collection/       # Collection management
│   ├── export/           # Data export functionality
│   ├── history/          # Undo/redo history
│   ├── import/           # Data import functionality
│   ├── locale/           # Internationalization
│   ├── sync/             # Cross-device sync
│   ├── tab/              # Tab management
│   ├── theme/            # Theme management
│   └── workspace/        # Workspace management
├── components/           # Shared UI components
│   ├── ui/              # Generic UI components (Button, Dialog, etc.)
│   └── shared/          # Shared business components (AuraLogo, etc.)
├── hooks/               # Shared hooks
├── pages/               # Application pages
├── services/            # External services (Chrome API, etc.)
└── types/               # Shared TypeScript types
```

## Feature Module Structure

Each feature follows a consistent structure:

```
features/[feature-name]/
├── components/          # Feature-specific React components
│   ├── ComponentA.tsx
│   ├── ComponentB.tsx
│   └── index.ts        # Re-exports all components
├── domain/             # Business logic & operations
│   ├── operations.ts   # Pure functions for data manipulation
│   ├── [other].ts      # Other domain logic
│   └── index.ts        # Re-exports all domain functions
├── hooks/              # Feature-specific hooks
│   ├── useFeature.ts
│   └── index.ts        # Re-exports all hooks
├── store/              # State management (Jotai atoms & actions)
│   ├── atoms.ts        # Jotai atoms
│   ├── actions.ts      # Jotai write-only atoms (actions)
│   └── index.ts        # Re-exports all atoms & actions
└── index.ts            # Main entry point, re-exports everything
```

## Import Patterns

### ✅ Recommended: Direct Feature Imports

Import directly from the feature module for maximum clarity:

```typescript
// Components
import { TabCard, AddTabModal } from '@/features/tab/components';
import { CollectionColumn } from '@/features/collection/components';

// Domain logic
import { createTab, updateTab } from '@/features/tab/domain';
import { createCollection } from '@/features/collection/domain';

// State management
import { tabsAtom, addTabAtom } from '@/features/tab/store';
import { currentUserAtom, signInAtom } from '@/features/auth/store';

// Hooks
import { useTabSearch } from '@/features/tab/hooks';
```

### ✅ Alternative: Unified Feature Import

Import from the unified `@/features` entry point for convenience:

```typescript
import { 
  TabCard,
  createTab,
  tabsAtom,
  addTabAtom,
  currentUserAtom 
} from '@/features';
```

### ❌ Avoid: Deep Imports

Don't import from internal implementation files:

```typescript
// ❌ Bad - importing from internal files
import { TabCard } from '@/features/tab/components/TabCard';
import { createTab } from '@/features/tab/domain/operations';
```

## State Management (Jotai)

### Atoms

Atoms hold state and are defined in `features/[feature]/store/atoms.ts`:

```typescript
// features/tab/store/atoms.ts
import { atom } from 'jotai';
import type { TabItem } from '@/types';

export const tabsAtom = atom<TabItem[]>([]);
export const selectedTabIdAtom = atom<string | null>(null);
```

### Actions

Actions are write-only atoms that encapsulate state updates:

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

### Usage in Components

```typescript
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { tabsAtom, addTabAtom } from '@/features/tab/store';

function TabList() {
  // Read-only
  const tabs = useAtomValue(tabsAtom);
  
  // Write-only
  const addTab = useSetAtom(addTabAtom);
  
  // Read-write
  const [selectedId, setSelectedId] = useAtom(selectedTabIdAtom);
  
  return (
    <div>
      {tabs.map(tab => <TabCard key={tab.id} tab={tab} />)}
      <button onClick={() => addTab({ collectionId: 'c1', url: '...', title: '...' })}>
        Add Tab
      </button>
    </div>
  );
}
```

## Domain Logic

Domain logic contains pure functions for data manipulation. These functions:

- Are pure (no side effects)
- Don't depend on React or Jotai
- Can be easily tested
- Can be shared across features

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

export const updateTab = (
  tab: TabItem,
  updates: Partial<TabItem>
): TabItem => {
  return {
    ...tab,
    ...updates,
    updatedAt: Date.now(),
  };
};
```

## Components

### Feature Components

Feature-specific components live in `features/[feature]/components/`:

```typescript
// features/tab/components/TabCard.tsx
import type { TabItem } from '@/types';
import { useSetAtom } from 'jotai';
import { deleteTabAtom } from '../store';

interface TabCardProps {
  tab: TabItem;
}

export function TabCard({ tab }: TabCardProps) {
  const deleteTab = useSetAtom(deleteTabAtom);

  return (
    <div>
      <h3>{tab.title}</h3>
      <a href={tab.url}>{tab.url}</a>
      <button onClick={() => deleteTab(tab.id)}>Delete</button>
    </div>
  );
}
```

### Shared Components

Generic UI components live in `components/ui/`:

```typescript
// components/ui/Button.tsx
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
}

export function Button({ children, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button className={`btn btn-${variant}`} onClick={onClick}>
      {children}
    </button>
  );
}
```

Shared business components live in `components/shared/`:

```typescript
// components/shared/AuraLogo.tsx
export function AuraLogo() {
  return <img src="/logo.png" alt="Aura" />;
}
```

## Feature Dependencies

### Cross-Feature Dependencies

Features can depend on other features when necessary:

```typescript
// features/collection/components/CollectionColumn.tsx
import { TabCard } from '@/features/tab/components';
import { tabsAtom } from '@/features/tab/store';
import { useAtomValue } from 'jotai';

export function CollectionColumn({ collectionId }: { collectionId: string }) {
  const tabs = useAtomValue(tabsAtom);
  const collectionTabs = tabs.filter(t => t.collectionId === collectionId);

  return (
    <div>
      {collectionTabs.map(tab => <TabCard key={tab.id} tab={tab} />)}
    </div>
  );
}
```

### Dependency Guidelines

1. **Prefer loose coupling**: Use shared types and domain functions
2. **Avoid circular dependencies**: Features should not depend on each other circularly
3. **Use atoms for shared state**: Don't pass state through props across features
4. **Extract shared logic**: If multiple features need the same logic, extract to `packages/domain`

## Testing

### Unit Tests for Domain Logic

```typescript
// features/tab/domain/operations.test.ts
import { describe, it, expect } from 'vitest';
import { createTab, updateTab } from './operations';

describe('Tab Operations', () => {
  it('should create tab with required fields', () => {
    const tab = createTab({
      collectionId: 'c1',
      url: 'https://example.com',
      title: 'Example',
    });

    expect(tab.id).toBeDefined();
    expect(tab.collectionId).toBe('c1');
    expect(tab.url).toBe('https://example.com');
  });

  it('should update tab and timestamp', () => {
    const original = createTab({ collectionId: 'c1', url: '...', title: '...' });
    const updated = updateTab(original, { title: 'New Title' });

    expect(updated.title).toBe('New Title');
    expect(updated.updatedAt).toBeGreaterThan(original.updatedAt);
  });
});
```

### Component Tests

```typescript
// features/tab/components/TabCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'jotai';
import { TabCard } from './TabCard';

describe('TabCard', () => {
  it('should render tab information', () => {
    const tab = {
      id: 't1',
      title: 'Example',
      url: 'https://example.com',
      // ... other fields
    };

    render(
      <Provider>
        <TabCard tab={tab} />
      </Provider>
    );

    expect(screen.getByText('Example')).toBeInTheDocument();
    expect(screen.getByText('https://example.com')).toBeInTheDocument();
  });
});
```

## Best Practices

### 1. Keep Features Independent

Each feature should be as self-contained as possible:

- ✅ Feature has its own components, domain logic, and state
- ✅ Feature can be understood without reading other features
- ❌ Don't create tight coupling between features

### 2. Use Pure Functions

Domain logic should be pure functions:

- ✅ No side effects (no API calls, no DOM manipulation)
- ✅ Deterministic (same input → same output)
- ✅ Easy to test
- ❌ Don't mix business logic with side effects

### 3. Separate Concerns

- **Components**: UI rendering and user interaction
- **Domain**: Business logic and data transformation
- **Store**: State management and side effects
- **Services**: External integrations (Chrome API, HTTP, etc.)

### 4. Type Safety

- ✅ Use TypeScript strict mode
- ✅ Define types in `@/types` or `packages/domain`
- ✅ Avoid `any` type
- ✅ Use type inference where possible

### 5. Code Organization

```typescript
// ✅ Good: Organized by feature
features/
  tab/
    components/
    domain/
    store/
    hooks/

// ❌ Bad: Organized by technical layer
components/
  TabCard.tsx
  CollectionColumn.tsx
  WorkspaceView.tsx
domain/
  tab.ts
  collection.ts
  workspace.ts
```

## Migration from Old Architecture

If you're working with legacy code that uses old import paths, update them to the new feature-based structure:

```typescript
// ❌ Old (no longer supported)
import { currentUserAtom } from '@/store/atoms';
import { signInAtom } from '@/store/actions';
import { TabCard } from '@/components/TabCard';
import { createTab } from '@/domain/tab/operations';

// ✅ New
import { currentUserAtom, signInAtom } from '@/features/auth/store';
import { TabCard } from '@/features/tab/components';
import { createTab } from '@/features/tab/domain';
```

## Further Reading

- [Jotai Documentation](https://jotai.org/)
- [React Best Practices](https://react.dev/learn)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

