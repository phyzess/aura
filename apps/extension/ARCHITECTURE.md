# Aura Extension Architecture

## Feature-based Directory Structure

The extension now follows a feature-based architecture for better modularity and maintainability.

### Directory Structure

```
src/
├── features/              # Feature modules
│   ├── app/              # App-level state (loading, etc.)
│   │   └── store/
│   │       ├── atoms.ts
│   │       └── index.ts
│   ├── auth/             # Authentication
│   │   └── store/
│   │       ├── atoms.ts
│   │       └── index.ts
│   ├── collection/       # Collection management
│   │   └── store/
│   │       ├── atoms.ts
│   │       └── index.ts
│   ├── history/          # Undo/Redo history
│   │   └── store/
│   │       ├── atoms.ts
│   │       ├── actions.ts
│   │       └── index.ts
│   ├── locale/           # Internationalization
│   │   └── store/
│   │       ├── atoms.ts
│   │       └── index.ts
│   ├── sync/             # Data synchronization
│   │   └── store/
│   │       ├── atoms.ts
│   │       └── index.ts
│   ├── tab/              # Tab management
│   │   └── store/
│   │       ├── atoms.ts
│   │       └── index.ts
│   ├── theme/            # Theme management
│   │   └── store/
│   │       ├── atoms.ts
│   │       └── index.ts
│   ├── workspace/        # Workspace management
│   │   └── store/
│   │       ├── atoms.ts
│   │       ├── selectors.ts
│   │       └── index.ts
│   └── index.ts          # Unified exports
├── store/                # Legacy store (re-exports for compatibility)
│   ├── actions/          # Action atoms (to be moved)
│   ├── atoms.ts          # Re-exports from features
│   ├── selectors.ts      # Re-exports from features
│   └── history/          # Re-exports from features
├── components/           # React components
├── pages/                # Page components
├── services/             # Services (DB, API, etc.)
└── types/                # TypeScript types
```

## Feature Module Structure

Each feature module follows this structure:

```
feature-name/
├── store/
│   ├── atoms.ts       # Jotai atoms (state)
│   ├── actions.ts     # Jotai write-only atoms (actions)
│   ├── selectors.ts   # Derived atoms (computed state)
│   └── index.ts       # Public API exports
├── components/        # Feature-specific components (future)
├── hooks/             # Feature-specific hooks (future)
└── types.ts           # Feature-specific types (future)
```

## Migration Status

### ✅ Phase 1: Store Refactoring (Completed)

- [x] Created feature-based directory structure
- [x] Split `store/atoms.ts` into feature modules
- [x] Split `store/selectors.ts` into feature modules
- [x] Moved `store/history/*` to `features/history/`
- [x] Created backward-compatible re-exports in `store/`
- [x] Created unified `features/index.ts` export

### ✅ Phase 2: Actions Migration (Completed)

All actions have been migrated to their respective features:
- ✅ `auth.ts` → `features/auth/store/actions.ts`
- ✅ `collection.ts` → `features/collection/store/actions.ts`
- ✅ `init.ts` → `features/app/store/actions.ts`
- ✅ `sync.ts` → `features/sync/store/actions.ts`
- ✅ `tab.ts` → `features/tab/store/actions.ts`
- ✅ `theme.ts` → `features/theme/store/actions.ts`
- ✅ `workspace.ts` → `features/workspace/store/actions.ts`
- ✅ `export.ts` → `features/export/store/actions.ts`
- ✅ `import.ts` → `features/import/store/actions.ts`
- ✅ `linkCheck.ts` → merged into `features/tab/store/actions.ts`

### ✅ Phase 3: Components & Hooks (Completed)

All components and hooks have been migrated:
- [x] Identified feature-specific components
- [x] Moved components to respective feature modules
- [x] Created `components/shared/` for non-UI shared components
- [x] Moved hooks to respective feature modules
- [x] Created backward-compatible re-exports in `components/`

Component distribution:
- **Auth**: AuthDialog, User, LogoutConfirmDialog
- **Tab**: TabCard, AddTabModal, OpenTabsButton, tab-search/
- **Workspace**: Sidebar, WorkspaceView
- **Collection**: CollectionColumn
- **History**: HistoryDrawer
- **Import**: ImportModal
- **Sync**: OfflineIndicator
- **App**: Header, MoreMenu, ChangelogDialog, KeyboardShortcutsDialog
- **Shared**: AuraLogo, ConfirmModal

Hooks distribution:
- **Tab**: useTabSearch
- **Shared**: useHotkey (remains in `hooks/`)

### ✅ Phase 4: Domain Logic Integration (Completed)

All domain logic has been migrated to their respective features:
- [x] Integrated `domain/collection` into `features/collection/domain/`
- [x] Integrated `domain/sync` into `features/sync/domain/`
- [x] Integrated `domain/tab` into `features/tab/domain/`
- [x] Integrated `domain/workspace` into `features/workspace/domain/`
- [x] Integrated `domain/import` into `features/import/domain/`
- [x] Integrated `domain/link-check` into `features/tab/domain/`
- [x] Created backward-compatible re-exports in `domain/`

Domain distribution:
- **Collection**: operations.ts (CRUD operations)
- **Tab**: operations.ts (CRUD operations), link-check.ts (link validation)
- **Workspace**: operations.ts (CRUD operations)
- **Sync**: operations.ts (sync logic), client.ts (API client)
- **Import**: session.ts (session capture), toby.ts (Toby import)

## Import Guidelines

### Recommended Imports

```typescript
// Import from features (new way)
import { workspacesAtom, activeWorkspaceIdAtom } from '@/features/workspace/store';
import { collectionsAtom } from '@/features/collection/store';
import { tabsAtom } from '@/features/tab/store';

// Or use unified export
import { workspacesAtom, collectionsAtom, tabsAtom } from '@/features';
```

### Legacy Imports (Still Supported)

```typescript
// Old imports still work via re-exports
import { workspacesAtom, collectionsAtom, tabsAtom } from '@/store/atoms';
```

## Benefits

1. **Better Organization**: Related code is grouped together
2. **Easier Navigation**: Find feature code in one place
3. **Improved Maintainability**: Changes are localized to features
4. **Better Scalability**: Easy to add new features
5. **Clearer Dependencies**: Feature boundaries are explicit
6. **Backward Compatible**: Old imports still work during migration

## Next Steps

1. Move action atoms from `store/actions/` to respective features
2. Update imports to use new feature-based paths
3. Move feature-specific components
4. Integrate domain logic into features
5. Remove legacy `store/` directory after full migration

