# @aura/extension

## 1.3.0

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

## 1.2.0

### Minor Changes

- minor

  Features:

  - Added onboarding page for new users with multi-language support
  - Implemented options/settings page with customizable configurations
  - Added new tab override functionality
  - Introduced error handler service for better error management
  - Introduced notifications system for user alerts
  - Introduced offline detector for network status monitoring
  - Added Toggle UI component

  Bug Fixes:

  - Fixed header count display issue
  - Fixed sidebar overflow problem

  Infrastructure:

  - Updated API version
  - Updated Better Auth trusted origins configuration

## 1.1.1

### Patch Changes

- fix for pipeline errors

## 1.1.0

### Minor Changes

- ## Features

  - **Tab Management Enhancements**

    - Drag-and-drop sorting for tabs and collections with cross-collection movement support
    - Pin/unpin tabs for quick access
    - Grouped tab search with smart filtering and workspace/collection grouping
    - One-click session restore from collections and workspaces
    - Save session with optional tab closure

  - **Export & Import**

    - Export workspace, collection, or all tabs

  - **Link Management**

    - Automatic detection and flagging of invalid links

  - **Performance & UX**
    - Optimized animations for smoother interactions
    - Enhanced sync strategy for better data synchronization

  ## Bug Fixes

  - Fixed drawer click-through issue
  - Fixed sync errors
  - Fixed import-related bugs
  - Fixed UI styling issues

## 1.0.0

### Major Changes

- init 1.0.0

### Patch Changes

- Updated dependencies
  - @aura/config@1.0.0
