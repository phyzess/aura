# 新标签页覆盖功能

## 概述

Aura 可以将 Chrome 的默认新标签页替换为 Aura 仪表板，让你每次打开新标签页时都能立即访问工作区、集合和保存的标签页。

## 工作原理

安装 Aura 后，它会自动使用 Chrome 的 `chrome_url_overrides` API 将 Aura 仪表板设置为新标签页。

### 打开新标签页时会发生什么：

1. 你会看到 Aura 仪表板，而不是 Chrome 的默认新标签页
2. 所有工作区和集合都可以立即访问
3. 可以使用 `Cmd+K`（或 `Ctrl+K`）快速搜索已保存的标签页
4. 页面的功能与从弹出窗口访问的仪表板完全相同

## 技术细节

- **Manifest 配置**：`chrome_url_overrides.newtab` 指向 `pages/newtab.html`
- **实现方式**：newtab 页面使用与仪表板相同的 React 应用（`src/pages/dashboard/main.tsx`）
- **离线支持**：通过 IndexedDB 缓存本地数据，支持离线使用
- **性能优化**：通过代码分割和懒加载优化加载速度

## 用户体验

### 优势：
- ✅ 即时访问已保存的标签页和工作区
- ✅ 无需点击扩展图标
- ✅ 键盘快捷键立即可用（`Cmd+K` 搜索）
- ✅ 与浏览工作流程无缝集成

### 注意事项：
- ⚠️ 会替换 Chrome 的默认新标签页（包括 Google 搜索和快捷方式）
- ⚠️ 同一时间只能有一个扩展覆盖新标签页
- ⚠️ 偏好 Chrome 默认新标签页的用户可能想要禁用此功能

## 未来增强

新标签页体验的潜在改进：

1. **设置开关**：允许用户从设置中启用/禁用新标签页覆盖
2. **快速操作**：为当前会话添加快速捕获按钮
3. **最近标签**：显示最近保存或访问的标签页
4. **统计信息**：显示使用统计（已保存标签页数量、工作区数量等）
5. **自定义**：允许用户在仪表板视图和简化视图之间选择

## 禁用此功能

如果用户想要恢复 Chrome 的默认新标签页，可以：

1. 访问 `chrome://extensions`
2. 查找其他提供新标签页覆盖的扩展，或
3. 卸载 Aura（如果只想禁用此功能，我们应该添加设置开关）

## 相关文件

- `apps/extension/manifest.config.ts` - Manifest 配置
- `apps/extension/pages/newtab.html` - 新标签页 HTML 入口
- `apps/extension/src/pages/dashboard/App.tsx` - 共享的仪表板组件
- `apps/extension/vite.config.ts` - newtab 页面的构建配置

