# Aura Extension Design Update - Outlined Stroke Style

## Overview
Updated the entire extension UI (popup and dashboard) to follow an outlined stroke design style with vibrant accent colors, inspired by modern layered composition aesthetics.

## Design Principles Applied

### 1. Outlined Stroke Style (轮廓化描边)
- **Black/White Borders**: All cards, buttons, and interactive elements now use 2px solid borders
  - Light mode: Black borders (`border-surface-border` → black)
  - Dark mode: White borders (`border-surface-border` → white)
- **Strong Line Presence**: Increased border thickness from 1px to 2px for better visual impact
- **Layered Composition**: Elements overlap with depth using z-index and positioning

### 2. Vibrant Accent Colors (活力色系)
Added 5 new vibrant colors for highlights and interactive elements:
- **Orange**: `oklch(75% 0.18 40)` - Energy and action
- **Pink**: `oklch(70% 0.20 350)` - Playfulness
- **Yellow**: `oklch(85% 0.15 95)` - Brightness
- **Cyan**: `oklch(75% 0.12 200)` - Calm focus
- **Lime**: `oklch(80% 0.16 130)` - Fresh vitality

### 3. Visual Effects
- **Blur Overlays**: Subtle colored blur effects on hover for depth
- **Random Color Assignment**: Each card gets a random vibrant color for variety
- **Gradient Accents**: Layered gradient effects on primary buttons

## Files Modified

### Theme & Styles
1. **`apps/extension/src/styles/theme.css`**
   - Added vibrant color palette
   - Updated border colors (black for light, white for dark)
   - Updated text colors for better contrast

2. **`apps/extension/src/styles/global.css`**
   - Added outline utilities (`.outline-text`, `.outline-box`)
   - Added vibrant color utilities (`.bg-vibrant-*`, `.text-vibrant-*`, `.border-vibrant-*`)

### Popup Components
3. **`apps/extension/src/popup/components/ExtensionPopup.tsx`**
   - Main container: 2px border
   - Save button: Vibrant orange with yellow blur overlay

4. **`apps/extension/src/popup/components/ExtensionPopupHeader.tsx`**
   - Header border: 2px bottom border
   - Background: Pink and cyan blur overlays
   - Back button: Yellow hover with black border
   - Login button: Lime hover
   - Search input: 2px border, cyan focus ring

5. **`apps/extension/src/popup/components/PopupListItem.tsx`**
   - 2px borders with hover effects
   - Random vibrant color icons
   - Blur overlay on hover

6. **`apps/extension/src/popup/components/ExtensionPopupSaveDrawer.tsx`**
   - Confirm button: Lime background with cyan blur

### Dashboard Components
7. **`apps/extension/src/components/TabCard.tsx`**
   - 2px borders
   - Random vibrant color icons
   - Blur overlay effects
   - Vibrant hover states (cyan for open, pink for delete)

8. **`apps/extension/src/components/Header.tsx`**
   - 2px bottom border
   - All buttons with 2px borders
   - Vibrant hover states
   - Lime login button

## Color Usage Strategy

### Primary Actions
- **Save/Submit**: Orange or Lime
- **Navigation**: Yellow
- **Focus/Search**: Cyan
- **Delete/Remove**: Pink

### Interactive States
- **Hover**: Border changes to black/white + vibrant background
- **Focus**: Vibrant color ring
- **Active**: Scale transform + vibrant accent

## Next Steps (Optional)
1. Update remaining components (Sidebar, CollectionColumn, Modals)
2. Add outlined text effects for headings
3. Implement more layered compositions
4. Add decorative geometric elements
5. Create custom illustrations with stroke style

