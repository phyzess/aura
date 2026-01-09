# Contributing to Aura

Thank you for your interest in contributing to Aura! This guide will help you get started.

## Code of Conduct

Please be respectful and constructive in all interactions. We're building a welcoming community.

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm 9+
- Git
- Cloudflare account (for API development)

### Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/aura.git
   cd aura
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   ```

3. **Set Up Environment**
   - Follow [Environment Setup Guide](./docs/development/env.md)
   - Configure API secrets (see [Secrets Guide](./docs/development/secrets.md))

4. **Start Development**
   ```bash
   # Start API
   pnpm -F @aura/api dev

   # Start Extension (in another terminal)
   pnpm -F @aura/extension dev
   ```

## Development Workflow

### Branch Naming

- `feat/feature-name` - New features
- `fix/bug-description` - Bug fixes
- `docs/what-changed` - Documentation updates
- `refactor/what-changed` - Code refactoring
- `test/what-added` - Test additions

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(api): add workspace sharing endpoint
fix(extension): resolve sync conflict issue
docs(readme): update installation steps
test(api): add integration tests for pull handler
```

Types:
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Code style (formatting, etc.)
- `refactor` - Code refactoring
- `test` - Tests
- `chore` - Maintenance

### Pull Request Process

1. **Create a Branch**
   ```bash
   git checkout -b feat/your-feature
   ```

2. **Make Changes**
   - Write clean, readable code
   - Follow existing code style
   - Add tests for new features
   - Update documentation

3. **Test Your Changes**
   ```bash
   # Run tests
   pnpm -F @aura/api test
   pnpm -F @aura/extension test

   # Type check
   pnpm -F @aura/api typecheck
   pnpm -F @aura/extension typecheck
   ```

4. **Commit and Push**
   ```bash
   git add .
   git commit -m "feat(scope): description"
   git push origin feat/your-feature
   ```

5. **Open Pull Request**
   - Provide clear description
   - Reference related issues
   - Add screenshots for UI changes

## Code Style

### TypeScript

- Use TypeScript strict mode
- Prefer functional programming style
- Use pure functions where possible
- Avoid `any` type

### Naming Conventions

- **Files**: `kebab-case.ts`
- **Components**: `PascalCase.tsx`
- **Functions**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Types/Interfaces**: `PascalCase`

### Code Organization

Follow the feature-based architecture:

```typescript
// ✅ Good: Import from features
import { TabCard } from '@/features/tab/components';
import { createTab } from '@/features/tab/domain';
import { tabsAtom, addTabAtom } from '@/features/tab/store';

// ✅ Alternative: Import from unified entry
import { TabCard, createTab, tabsAtom } from '@/features';

// ❌ Avoid: Old import paths (will cause linter errors)
import { TabCard } from '@/components/TabCard';
import { createTab } from '@/domain/tab/operations';
import { tabsAtom } from '@/store/atoms';
```

Keep domain logic pure:

```typescript
// ✅ Good: Pure function
export function mergeWorkspaces(
  local: Workspace[],
  remote: Workspace[]
): Workspace[] {
  return lastWriteWins(local, remote);
}

// ❌ Avoid: Side effects in business logic
export async function syncWorkspaces(userId: string) {
  const data = await db.query(...);
  return data;
}
```

## Testing

### Writing Tests

- Write integration tests for API endpoints
- Write unit tests for pure functions
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

```typescript
describe('Pull Handler', () => {
  it('should return empty arrays for new user', async () => {
    // Arrange
    const env = await setupTestDatabase();
    
    // Act
    const result = await pullHandler(env, userId, 0);
    
    // Assert
    expect(result.workspaces).toEqual([]);
  });
});
```

### Running Tests

```bash
# API tests
pnpm -F @aura/api test

# Specific test file
pnpm -F @aura/api test pull.integration.test.ts

# With coverage
pnpm -F @aura/api test:coverage
```

## Documentation

### When to Update Docs

- Adding new features
- Changing API endpoints
- Updating configuration
- Fixing bugs that affect usage

### Documentation Style

- Use clear, concise language
- Include code examples
- Add screenshots for UI features
- Keep docs up to date with code

## Project Structure

```
aura/
├── apps/
│   ├── api/              # Cloudflare Workers API
│   └── extension/        # Chrome Extension
│       └── src/
│           ├── features/     # Feature modules (business logic)
│           ├── components/   # Shared UI components
│           ├── hooks/        # Shared hooks
│           ├── pages/        # Application pages
│           ├── services/     # External services
│           └── types/        # Shared TypeScript types
├── packages/
│   ├── domain/           # Shared types
│   └── config/           # Configuration
└── docs/                 # Documentation
```

### Feature-Based Architecture

Aura uses a feature-based architecture. Each feature is self-contained with its own:

- **Components**: UI components specific to the feature
- **Domain**: Business logic and pure functions
- **Store**: State management (Jotai atoms and actions)
- **Hooks**: Feature-specific React hooks

Example feature structure:

```
features/tab/
├── components/
│   ├── TabCard.tsx
│   ├── AddTabModal.tsx
│   └── index.ts
├── domain/
│   ├── operations.ts
│   └── index.ts
├── store/
│   ├── atoms.ts
│   ├── actions.ts
│   └── index.ts
├── hooks/
│   ├── useTabSearch.ts
│   └── index.ts
└── index.ts
```

For detailed architecture documentation, see [Architecture Guide](./docs/development/architecture.md).

## Need Help?

- **Questions**: Open a [Discussion](https://github.com/your-repo/aura/discussions)
- **Bugs**: Open an [Issue](https://github.com/your-repo/aura/issues)
- **Security**: Email security@example.com

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

