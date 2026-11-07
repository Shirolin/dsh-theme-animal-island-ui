渲染所需的 assets/（约 36MB 的 DOM 截图与录屏）不入库，跑之前从 .tmp/promo-v4/assets 复制到本目录。

竖版：`node capture-vertical.mjs --fps=30`，再 `pwsh -File encode-vertical.ps1`。
小红书画版：加 `--variant=xhs` 与 `-Variant xhs`，会去掉片尾站外网址并换掉封面横幅。
