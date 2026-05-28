## My Tampermonkey Scripts

个人 Tampermonkey 脚本分享合集。这些脚本旨在提升网页浏览体验、自动化重复操作或添加实用功能。



## 📦 脚本列表

### 1. DeepSeek Chat 增强

> 📁 [`deepseek-no-stream.user.js`](https://github.com/linfeng365/MyTampermonkeyScripts/blob/main/deepseek-no-stream/deepseek-no-stream.user.js)


为 DeepSeek 网页版 [chat.deepseek.com](https://chat.deepseek.com) 提供多项体验优化：

| 功能 | 说明 |
|------|------|
| 🚫 **禁用流式打字** | AI 回复生成完成后一次性显示，告别逐字等待 |
| 🛑 **防自动滚动** | 生成期间阻止 AI 自动滚动，用户手动滚动不受影响 |
| 📋 **多级标题大纲** | 含 2+ 标题的回复自动在首尾插入大纲面板 |
| 📎 **复制附带大纲** | `Ctrl+C` 复制时自动在文本前加上 `> 📚 大纲` 引用格式 |
| ⌨️ **快捷键** | `Ctrl+Shift+C` 复制回复 · `Alt+↑/↓` 切换会话 · `Ctrl+↑/↓` 切换提问 |

**安装：** 点击 [`deepseek-no-stream.user.js`](https://github.com/linfeng365/MyTampermonkeyScripts/blob/main/deepseek-no-stream/deepseek-no-stream.user.js) 即可触发 Tampermonkey 安装。

---

### 2. 更多脚本待添加...

这个仓库会持续更新，欢迎 ⭐ Star 关注。

---

## 🚀 如何安装


### 前置要求
- 安装 [Tampermonkey](https://www.tampermonkey.net/) 浏览器扩展（支持 Chrome、Firefox、Edge、Safari）

### 安装脚本
1. 在本仓库中找到你需要的脚本文件（`.js` 结尾）
2. 点击进入脚本文件
3. 点击 `Raw` 按钮
4. Tampermonkey 会自动检测并弹出安装页面
5. 点击「安装」即可

或者直接复制脚本内容，在 Tampermonkey 管理面板中手动新建脚本并粘贴。



## 📝  脚本开发说明

这些脚本均为自用分享，随个人需求逐步迭代。每个脚本文件头部包含：

```javascript
// @name        脚本名称
// @namespace   命名空间
// @version     版本号
// @match       匹配的 URL 规则
// @grant       需要的权限
```



---

## 📄 License

MIT

