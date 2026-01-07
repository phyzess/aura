# Aura 色彩系统规范

## 概述

Aura 采用语义化的色彩系统，确保整个应用的视觉一致性和可维护性。所有交互元素（按钮、输入框、卡片等）都遵循统一的色彩规范。

## 按钮色彩系统

### 设计原则
- **语义化**：每种按钮类型都有明确的使用场景
- **一致性**：全局统一使用相同的按钮样式
- **可访问性**：确保足够的对比度和可读性

### 按钮类型

#### 1. Primary Button (主要操作)
**颜色**: 珊瑚橙 `rgb(255 95 64)`
**使用场景**: 页面中最重要的操作，每个页面/区域只应有一个
**示例**:
```tsx
<button className="btn-primary">Save Current Session</button>
<button className="btn-primary btn-full">Create Tab Space</button>
```

#### 2. Secondary Button (次要操作)
**颜色**: 紫色 `oklch(65% 0.17 290)`
**使用场景**: 重要但非主要的操作
**示例**:
```tsx
<button className="btn-secondary">Create</button>
<button className="btn-secondary btn-sm">Add New</button>
```

#### 3. Ghost Button (幽灵按钮)
**颜色**: 透明背景，hover 时显示浅色背景
**使用场景**: 低优先级操作，不希望过于突出的按钮
**示例**:
```tsx
<button className="btn-ghost">Cancel</button>
<button className="btn-ghost btn-sm">Skip</button>
```

#### 4. Outline Button (描边按钮)
**颜色**: 透明背景 + 边框
**使用场景**: 需要明确边界但不希望太突出的操作
**示例**:
```tsx
<button className="btn-outline">Open Full Dashboard</button>
<button className="btn-outline btn-lg">Learn More</button>
```

#### 5. Destructive Button (危险操作)
**颜色**: 红色调 `oklch(60% 0.22 25)`
**使用场景**: 删除、清空等不可逆操作
**示例**:
```tsx
<button className="btn-destructive">Delete Space</button>
<button className="btn-destructive btn-sm">Remove</button>
```

### 按钮尺寸

```tsx
// 默认尺寸
<button className="btn-primary">Default</button>

// 小尺寸
<button className="btn-primary btn-sm">Small</button>

// 大尺寸
<button className="btn-primary btn-lg">Large</button>

// 全宽
<button className="btn-primary btn-full">Full Width</button>
```

### 按钮状态

所有按钮自动支持以下状态：
- **Hover**: 颜色变亮
- **Active**: 颜色变暗 + 轻微缩放
- **Disabled**: 50% 透明度 + 禁用光标

```tsx
<button className="btn-primary" disabled>Disabled</button>
```

## 其他交互元素色彩

### Accent Colors (强调色)
用于图标、徽章、小元素点缀：
- `--color-accent`: 紫色（与 secondary 一致）
- `--color-accent-cyan`: 青色，用于特殊强调

### Status Colors (状态色)
- `--color-success`: 成功/完成
- `--color-danger`: 错误/危险
- `--color-warning`: 警告
- `--color-info`: 信息提示

## 迁移指南

### 旧代码 → 新代码

```tsx
// ❌ 旧代码 - 混乱的颜色使用
<button className="bg-lavender-500 text-white px-4 py-2 rounded-xl">Save</button>
<button className="bg-vibrant-lime text-black border-2">Create</button>
<button className="bg-gradient-accent">Submit</button>

// ✅ 新代码 - 统一的按钮系统
<button className="btn-primary">Save</button>
<button className="btn-secondary">Create</button>
<button className="btn-primary">Submit</button>
```

## CSS 变量参考

```css
/* Primary */
--color-primary: oklch(68% 0.21 25);
--color-primary-hover: oklch(72% 0.21 25);
--color-primary-active: oklch(64% 0.21 25);
--color-on-primary: oklch(100% 0 0);

/* Secondary */
--color-secondary: oklch(65% 0.17 290);
--color-secondary-hover: oklch(70% 0.17 290);
--color-secondary-active: oklch(60% 0.17 290);
--color-on-secondary: oklch(100% 0 0);

/* Ghost */
--color-ghost: transparent;
--color-ghost-hover: oklch(0% 0 0 / 0.05);
--color-ghost-active: oklch(0% 0 0 / 0.1);

/* Outline */
--color-outline: transparent;
--color-outline-border: var(--color-surface-border);
--color-outline-hover: oklch(0% 0 0 / 0.03);
--color-outline-active: oklch(0% 0 0 / 0.06);

/* Destructive */
--color-destructive: oklch(60% 0.22 25);
--color-destructive-hover: oklch(64% 0.22 25);
--color-destructive-active: oklch(56% 0.22 25);
```

## 已更新的组件

以下组件已经迁移到新的按钮系统：

### Popup 组件
- ✅ `ExtensionPopup.tsx` - Save Current Session 按钮 (btn-primary)
- ✅ `ExtensionPopup.tsx` - Open Full Dashboard 按钮 (btn-outline)
- ✅ `ExtensionPopupHeader.tsx` - 返回按钮 (btn-ghost)
- ✅ `ExtensionPopupHeader.tsx` - 登录按钮 (btn-ghost)
- ✅ `ExtensionPopupSaveDrawer.tsx` - Save Tabs 按钮 (btn-secondary)

### Dashboard 组件
- ✅ `WorkspaceView.tsx` - Create Tab Space 按钮 (btn-primary)
- ✅ `ConfirmModal.tsx` - Cancel 按钮 (btn-ghost)
- ✅ `ConfirmModal.tsx` - Delete 按钮 (btn-destructive)

## 设计原则总结

1. **一致性优先**：所有按钮使用统一的类名系统
2. **语义化命名**：按钮类型名称清晰表达用途
3. **可访问性**：自动处理 disabled 状态和键盘导航
4. **响应式**：支持多种尺寸和宽度变体
5. **可维护性**：集中管理颜色变量，易于主题切换

