改造优化工具 Sublime Text， markdown 文件预览工具

Markdown Preview

预览时，生成的 html 文件，文件名不要数字。保持与原文件名一样。保存位置修改为当前文件夹。


MarkdownPreview-Packages-update
项目更新了  Markdown Preview （Sublime Text 插件） 生成 html 预览时， 使 html 文件名，与原 md 文件名一致。

安装使用方法：覆盖到原目录；另外设置里也可以自定义 html 预览的保存位置（ 例如：```"parser": "markdown",
    "path_tempfile": "/Users/linfeng365/Documents/SublimeText-html",```）；


继续优化，替换 markdown_preview.py 文件更新。预览生成的 html 文件保存到 md 同文件夹；还没有保存的临时 md 文件除外。


MarkdownPreview-Packages-update （for Sublime Text）
https://github.com/linfeng365/MyTampermonkeyScripts/tree/main/MarkdownPreview-Packages-update