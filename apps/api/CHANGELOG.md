# @aura/api

## 1.2.0

### Minor Changes

- Major feature release with architecture improvements

  **@aura/api:**

  - Add OAuth authentication (Google/GitHub) with Better Auth
  - Add email verification code system with Cloudflare KV
  - Add Turnstile CAPTCHA verification
  - Add structured logging system with LogTape
  - Add alerts and sync metrics database tables
  - Refactor to modular route architecture (app.routes, auth.routes)
  - Separate handlers for better maintainability (pull, push, me)
  - Add data layer abstraction with batch operations
  - Improve error handling and retry mechanisms

  **@aura/extension:**

  - Refactor to feature-based architecture for better modularity
  - Add Time Travel feature for history navigation
  - Add new logger system with IndexedDB persistence and export
  - Add OAuth login support (Google/GitHub)
  - Add email verification flow
  - Add context menu improvements
  - Add changelog dialog and keyboard shortcuts dialog
  - Add offline detection and error handling improvements
  - Add real-time form validation
  - Add batch operation progress indicators
  - Improve accessibility (a11y)
  - Performance optimizations for data sync

### Patch Changes

- Updated dependencies
- Updated dependencies
  - @aura/config@1.1.0
  - @aura/domain@1.1.0
  - @aura/shared@1.1.0

## 1.1.0

### Minor Changes

- update prod BETTER_AUTH_TRUSTED_ORIGINS

## 1.0.0

### Major Changes

- init 1.0.0

### Patch Changes

- Updated dependencies
  - @aura/config@1.0.0
