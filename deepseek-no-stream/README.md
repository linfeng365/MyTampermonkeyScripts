# DeepSeek Chat 增强脚本

[![Tampermonkey](https://img.shields.io/badge/Tampermonkey-✅-brightgreen)](https://www.tampermonkey.net/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

一个 Tampermonkey 用户脚本，为 [chat.deepseek.com](https://chat.deepseek.com) 提供流式打字禁用、大纲生成、复制增强和键盘快捷键等体验优化。

## 功能

### 🚫 禁用流式打字效果
AI 回复在**生成完成后一次性显示**，告别逐字蹦出的等待感。生成过程中会显示 _"✨ AI 正在思考，生成完成后将完整显示..."_ 提示。

### 🛑 阻止 AI 自动滚动
流式生成期间自动拦截程序化滚动（`scrollIntoView` / `scrollTo`），页面不会随着生成内容跳动。用户手动滚动（拖拽滚动条、触控板等）完全不受影响。

### 📋 多级标题大纲
AI 回复内容包含多级标题（`h1`~`h6`）时，自动在回复的**首尾**插入大纲面板，结构清晰，点击即可概览全文。

![大纲示例](https://via.placeholder.com/400x80?text=大纲示例)

### 📎 复制自动附带大纲
使用常规复制（`Ctrl+C` / 右键复制）时，脚本自动在剪贴板文本前加上 `> 📚 大纲` 引用格式的大纲内容，方便分享到支持 Markdown 的地方。

### ⌨️ 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+Shift+C` | 复制当前 AI 回复（含大纲） |
| `Alt+↑` / `Alt+↓` | 切换上/下一个会话（侧边栏保持不动） |
| `Ctrl+↑` / `Ctrl+↓` | 在同会话中切换上/下一个用户提问，带蓝色高亮指示 |

## 安装

### 前置条件
- 浏览器安装 [Tampermonkey](https://www.tampermonkey.net/) 扩展

### 步骤
1. 点击 [deepseek-no-stream.user.js](deepseek-no-stream.user.js) 或直接打开 `deepseek-no-stream.user.js` 文件
2. Tampermonkey 会自动识别并弹出安装对话框
3. 点击 **安装**
4. 打开 [chat.deepseek.com](https://chat.deepseek.com/) 即可生效

### 通过 GitHub 安装
```bash
# 克隆仓库
git clone https://github.com/yourusername/deepseek-no-stream.git

# 或直接下载 userscript 文件
curl -O https://raw.githubusercontent.com/yourusername/deepseek-no-stream/main/deepseek-no-stream.user.js
```

然后在 Tampermonkey 中通过 **管理面板 → 实用工具 → 导入文件** 导入。

## 使用说明

安装后访问 chat.deepseek.com，所有功能自动生效：

1. **发送消息** → AI 回复时，内容会隐藏（显示"思考中"提示），直到生成完毕一次性展示
2. **生成完成** → 回复内容出现，首尾自动插入大纲（需回复包含至少 2 个标题）
3. **复制回复** → 直接 `Ctrl+C` 复制，或按 `Ctrl+Shift+C` 快速复制当前 AI 回复，大纲自动附带
4. **切换会话** → `Alt+↑/↓` 在侧边栏会话列表间快速跳转
5. **切换提问** → `Ctrl+↑/↓` 在当前会话的各个提问间导航

## 自定义

### 修改大纲字体
在脚本 CSS 部分找到 `._ds_outline` 的 `font-family` 属性：

```css
._ds_outline {
  font-family: "宋体", "SimSun", serif;  /* 改为你想要的字体 */
}
```

### 调整等待超时
修改 `CONFIG.STREAM_IDLE_TIMEOUT` 值（单位毫秒）：

```javascript
const CONFIG = {
  STREAM_IDLE_TIMEOUT: 1200,  // 默认 1.2 秒无内容变化视为生成结束
  // ...
};
```

## 兼容性

- ✅ **浏览器**: Chrome、Edge、Firefox、Safari（需安装 Tampermonkey）
- ✅ **DeepSeek 域名**: `https://chat.deepseek.com/*`
- ⚠️ 如 DeepSeek 更新界面导致部分功能失效，欢迎提交 Issue

## 工作原理

| 机制 | 说明 |
|------|------|
| `MutationObserver` | 监视 AI 回复容器的 DOM 变化，检测流式内容更新 |
| 轮询兜底 | 200ms 间隔轮询，应对 React 异步渲染场景 |
| `scrollIntoView` 拦截 | 流式生成期间阻止 AI 的自动滚动调用 |
| `<script>` 注入 | 突破 Tampermonkey 沙箱，直接操作 `navigator.clipboard` 和键盘事件 |
| `GM_addStyle` | 注入自定义样式，控制大纲和隐藏/显示状态 |

## License

MIT
