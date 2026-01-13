# @aura/config

## 1.1.1

### Patch Changes

- Add HTTP client with caching, performance optimizations, and CI workflows

  - Implement new httpClient service with request caching and retry logic
  - Add background preload handler for improved startup performance
  - Optimize bundle size with code splitting and tree-shaking
  - Add CI workflows for testing, linting, and bundle size monitoring
  - Improve authentication and sync reliability
  - Clean up outdated documentation

## 1.1.0

### Minor Changes

- Core packages enhancement

  **@aura/config:**

  - Add centralized constants (HTTP status, error messages, validation rules)
  - Add common error response builders
  - Add comprehensive error message definitions

  **@aura/domain:**

  - Add sync validation utilities (validateWorkspaces, validateCollections, validateTabs)
  - Add relationship validation for data integrity
  - Add merge utilities for conflict resolution
  - Extend type definitions for sync operations

## 1.0.0

### Major Changes

- init 1.0.0
