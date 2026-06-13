# Minimal Dark Obsidian Theme 2

一款简洁、低干扰的 Obsidian 深色主题，以深灰背景和绿色强调色为主，适合日常写作、知识管理与代码笔记。

主题优先使用 Obsidian 原生 CSS 变量，常用颜色、字号和间距集中在 `theme.css` 的 `.theme-dark` 区域，便于直接修改。

## 主要特点

- 深灰色界面与绿色强调色，降低长时间阅读的视觉干扰。
- 编辑模式和阅读模式可分别设置正文字号与行距。
- 支持调节 H1-H6 标题大小、颜色、字重及段前段后距离。
- 可分别设置链接、引用、列表、任务框、标签和 Markdown 标记颜色。
- 优化粗体、斜体、删除线、高亮、代码、表格、脚注与数学公式样式。
- 支持正文宽度、页面留白、标签页文字和滚动条颜色调节。
- 同时适配 Live Preview、源码模式和阅读模式。

## 兼容性

- 最低 Obsidian 版本：`1.5.12`
- 当前主要适配版本：`1.12.7`
- 支持桌面端和移动端

## 安装方法

1. 将整个 `Minimal-Dark-Obsidian-theme2` 文件夹放入仓库目录：

   ```text
   你的仓库/.obsidian/themes/
   ```

2. 重启 Obsidian，或重新加载主题。
3. 打开“设置 → 外观 → 主题”，选择 `Minimal-Dark-Obsidian-theme2`。

安装后的目录结构：

```text
.obsidian/
└── themes/
    └── Minimal-Dark-Obsidian-theme2/
        ├── manifest.json
        └── theme.css
```

## 常用调节

打开 `theme.css`，在 `.theme-dark` 中修改相应变量。例如：

```css
.theme-dark {
  /* 编辑模式与阅读模式正文大小 */
  --md-font-size-editing: 16px;
  --md-font-size-reading: 14px;

  /* 正文宽度与页面留白 */
  --file-line-width: 750px;
  --file-margins: 16px;

  /* 链接、引用和列表标记颜色 */
  --link-color: #2E8B6F;
  --blockquote-border-color: #3AC198;
  --list-marker-color: #3AC198;

  /* 标题统一段前与段后距离 */
  --md-heading-before: 1.1rem;
  --md-heading-after: 0.5rem;
}
```

修改后重新选择主题，或重启 Obsidian 使样式生效。

## 文件说明

- `theme.css`：主题样式及可调参数。
- `manifest.json`：主题名称、版本和兼容性信息。

## 当前版本

`1.0.7`

作者：`linfeng365` & `Codex26`
