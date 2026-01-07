# New Tab Override Feature

## Overview

Aura can replace Chrome's default new tab page with the Aura dashboard, giving you instant access to your workspaces, collections, and saved tabs every time you open a new tab.

## How it works

When you install Aura, it automatically sets the Aura dashboard as your new tab page using Chrome's `chrome_url_overrides` API.

### What happens when you open a new tab:

1. Instead of Chrome's default new tab page, you'll see the Aura dashboard
2. All your workspaces and collections are immediately accessible
3. You can use `Cmd+K` (or `Ctrl+K`) to quickly search your saved tabs
4. The page works exactly like the dashboard you can access from the popup

## Technical Details

- **Manifest configuration**: `chrome_url_overrides.newtab` points to `pages/newtab.html`
- **Implementation**: The newtab page uses the same React app as the dashboard (`src/pages/dashboard/main.tsx`)
- **Offline support**: Works offline with locally cached data via IndexedDB
- **Performance**: Optimized for fast loading with code splitting and lazy loading

## User Experience

### Benefits:
- ✅ Instant access to your saved tabs and workspaces
- ✅ No need to click the extension icon
- ✅ Keyboard shortcuts work immediately (`Cmd+K` for search)
- ✅ Seamless integration with your browsing workflow

### Considerations:
- ⚠️ Replaces Chrome's default new tab page (with Google search and shortcuts)
- ⚠️ Only one extension can override the new tab page at a time
- ⚠️ Users who prefer Chrome's default new tab may want to disable this

## Future Enhancements

Potential improvements for the new tab experience:

1. **Settings toggle**: Allow users to enable/disable new tab override from settings
2. **Quick actions**: Add quick capture button for current session
3. **Recent tabs**: Show recently saved or accessed tabs
4. **Statistics**: Display usage stats (number of tabs saved, workspaces, etc.)
5. **Customization**: Allow users to choose between dashboard view and a simplified view

## Disabling the Feature

If users want to restore Chrome's default new tab page, they can:

1. Go to `chrome://extensions`
2. Find another extension that provides new tab override, or
3. Uninstall Aura (if they only want to disable this feature, we should add a settings toggle)

## Related Files

- `apps/extension/manifest.config.ts` - Manifest configuration
- `apps/extension/pages/newtab.html` - New tab HTML entry point
- `apps/extension/src/pages/dashboard/App.tsx` - Shared dashboard component
- `apps/extension/vite.config.ts` - Build configuration for newtab page

