# 变更记录

本文件记录每个发布版本对用户可见的变化。安装与验收流程见 `README.md`，设计映射见 `docs/design.md`，DSH 兼容边界见 `docs/compatibility.md`。

## 0.3.7（外观设置）

把「画布有多绿」交给用户，而不是替他二选一。新增「设置 → 插件 → 动森外观」页：三档预设 + 透明度滑杆。

### 外观设置

- 新增公开 Slot `settings.plugins.tab` 的「动森外观」页：**纸白 0.52 / 均衡 0.40 / 海岛 0.28** 三档预设，外加 0.15–0.60 自定义滑杆与「恢复默认」；
- 默认**均衡 0.40**；选择写入本机 `localStorage`，刷新 / 重启保留；
- 画布奶油面透明度改由 `--animal-canvas-veil` 驱动（`rgba(248, 248, 240, var(--animal-canvas-veil, .4))`），不再写死 0.52；
- `prefers-contrast: more` 时自动回到纸白 0.52，滑杆不会再把对比度压低；
- 该页由插件自己的浏览器半注册到 Plugins 设置区，不依赖 Host 设置文档；web 与 desktop 各自记住本客户端的选择。

## 0.3.6（P0–P3 视觉强化）

让整体更像《动森》本尊的游戏界面。改动集中在品牌 Slot、composer、dialog、画布与侧栏选中态；除侧栏 hover/active 的暖木色外，不触碰 DSH 布局几何或其它 palette token。

### 品牌与 hero

- 品牌标换成原创倾斜叶片 `IslandMark`，侧栏与 hero 复用同一枚 SVG；24px 下仍保留叶尖、叶脉与轮廓；
- hero 字标改为深绿 900 字重 + 奶油高光/投影 + 2° 微倾的贴纸字；
- 新增 `island-horizon.svg`、`floating-leaves.svg` 两张原创资源（构建期内嵌）。

### Composer 与按钮

- composer 变成「对话气泡」：2px 深墨描边、顶部高光、底部小尾巴。DSH 已占用卡片的 `::after` 画 workspace 虚线环，尾巴改走 `::before`；
- 组合器内文字按钮加顶部高光与回弹过渡；发送 / 停止键加干边 3D 与顶部高光（几何不动，仅 `box-shadow`）；
- 修正既有选择器 bug：hover / active 之前只挂在 `[role='button']` 分支，原生 `<button>` 会永久呈现 hover 态；改用 `:is(button, [role='button'])` 后两个分支都按真实状态切换。

### 画布

- 绿色波点画布叠加斜纹、底部草 / 水波纹，以及低透明度漂浮叶子 / 花 / 星星；
- 深色仍是暖棕派生方案，只去掉浅色画布装饰层，保持夜间可读。

### P1 质感

- Composer 奶油面叠 7% 纸纹与右侧淡叶水印（纸纹为内嵌 SVG `feTurbulence`，180px 平铺）；
- dialog 叠纸纹 + 内缩纸边 + 2px 虚线缝线（`outline-offset: -10px`，`:not(:focus-visible)` 保留焦点环）；
- 标题绶带从薄荷丝带换成木质告示牌：暖木正面 + 竖向木纹 + 两枚铆钉 + 深木燕尾，奶油字；深色为深木；
- 深色画布换成「夜岛」：深青天空 + 星点 + 右上月晕，不再复用白天的草 / 水波纹；
- 中文展示体取舍：没有可承受体积的圆胖 CJK 字库，标题继续用 900 字重 + 贴纸处理，不新增字体依赖。

### P2 微交互

- composer 在 `:focus-within` 时换成薄荷描边 + 3px 柔光，输入时气泡「亮起来」，不改尺寸；
- 发送 / 停止键按压时从键位扩出一圈薄荷涟漪（`::after` + `:active`；插件没有发送事件钩子，所以是按压触发而不是发送后触发）；
- 侧栏叶片 hover 轻摆（`rotate(-6deg) scale(1.06)`）；
- 文字选区改为半透明薄荷；
- 以上位移 / 过渡都纳入 `prefers-reduced-motion`。

### 木牌选中态

- 侧栏 hover/active 从 periwinkle 换成暖木：light `#f0e2c8` / `#e5c99b`，dark `#4a3a28` / `#6b4a2c`；通用 `--dsw-alias-interactive-bg-hover` 随之变成暖木洗色；
- 选中的会话行 / 搜索结果行（`[role='treeitem'][aria-selected='true']`）与侧栏面板行（`[aria-current='page']`）叠竖向木纹 + 内嵌高光/压边，读作「木牌」而不是扁平胶囊；
- 对比度：light 主文字 5.17:1、正文 5.11:1；dark 主文字 6.52:1、正文 5.74:1。

## 0.3.5

修复侧栏品牌字标 `动森岛` 顶部笔画被削平的问题（桌面客户端上最先暴露）。

### 品牌

- 两行字标在 DSH 的 24px 品牌盒内重新分配行盒：字标行盒 `line-height` 14px → 17px，小字行放弃原来的 3px 间距。`14 + 3` 与 `17 + 0` 都等于 17px，所以小字行的位置和整体 24px 都不变，只是把间距让给了字标的字形盒；
- 原因是 14px 的 CJK 字标带约 20px 的字形盒，`line-height: 1` 把它压到只剩不到 1px 的顶部余量，贴着 DSH `.brand` 的 `overflow: hidden` 裁剪线；字面更满的中文字体（或带小数缩放的显示环境）就会削掉 `动`、`森`、`岛` 的顶部横画。现在余量约 2.3px。

## 0.3.4

修复主题规则越界改写 DSH 与插件自有界面的问题，并把发布产物换成含全部修复的版本。

### 标题与顶部

- 标题绶带按参考项目 `Title` 的三层构造重做：薄荷正面主体 + 深青燕尾 + 折角三角，三层收在 `nav` 盒内（DSH 的 `.crumbs` 带 `overflow: hidden`），去掉原来的 3° 透视侧倾和 4px 硬底阴影。

### 弹出层（菜单 / 命令面板 / 下拉）

- 菜单表面改用 `--dsw-specific-menu`（= `surface`），不再复用 composer 的 `#fffbe7`，命令面板不再和输入框糊成一片；对应地，菜单/列表不再被套上 dialog/composer 的奶油卡片外观；
- 弹出层行列高亮（`[role='option'|'menuitem']` 的 hover / `aria-selected`）改用薄荷 `--dsw-alias-interactive-bg-hover-accent`；通用 `--dsw-alias-interactive-bg-hover` 保持 periwinkle，因为侧栏会话行与它共用；
- composer 的文字胶囊规则不再匹配 menu / listbox / composer 触发面板子树，也不再匹配内容含 `img` / `video` / `canvas` 的控件 —— 修掉了命令面板行高被清零、面包屑被套成胶囊、粘贴图片缩略图被挤压截断三个问题；
- 命令面板（`/`、`@`）的高度是组件按 composer 上方可用空间算出的内联 `max-height`，主题不去改它；改为给面板底边加渐隐 —— 被滚动裁掉的半行读起来是「下面还有」而不是一行断字，短列表不滚动时不受影响。

### 表单

- 对话框内的组合输入（`span > 图标 + input`）由外壳承担字段外观，内部 `input` 保持透明，键盘焦点环移到外壳：插件市场的搜索框不再出现内外两层框。

### 设置页

- 预设卡片的 id 恢复 DSH 的 mono 说明文字（行内代码 chip 只作用于无 class 的 `<code>`）；
- 深色 `--animal-cream` 从侧栏蓝紫改为暖色浮层 `#40362b`，对话框不再与暖色卡片互相打架；
- 「设置头部预留高度」规则加 `:not(li *)`，不再把预设卡片的底部工具条撑到 64px；
- 删除为 opencode-go 模型列表写的 `nav[aria-label]` 布局覆盖，交还插件自己的 43/57 两列与行内 flex。

### 代码块

- `pre` 不再自己画边框/圆角/底色/阴影（那会让它的圆角弧与容器错位），只保留内边距与排版；圆角与底色跟随 DSH 的代码块变量；
- banner（语言标签 + 复制按钮）文字改用代码前景色 —— 原先继承的 `label-primary` 在亮色下是暖棕，压在深色代码岛上不可读；语言标签自己声明了颜色，所以 banner 与它的直接子元素都要覆盖；
- 右侧栏「文档」预览的**纯文本**视图恢复 DSH 自身的文字颜色：预览是透明的平面代码视图，主题的深色代码岛前景色在亮色下只有 1.35:1，完全看不清（高亮的「代码」视图不受影响，它用自己的 token 配色）。

## 0.3.3

- 首个高保真版本：绿色双层波点画布、奶油白侧栏与蓝紫波浪、原创岛标与品牌 Slot；
- 薄荷标题绶带、暖棕文字层级、periwinkle 导航状态；
- composer / dialog / 卡片 / 按钮的 scoped CSS 与 3D 反馈；
- 深棕代码块与完整 Shiki 配色；
- 内嵌 Nunito Latin WOFF2，中文回退 Noto Sans SC / 苹方 / 微软雅黑；
- 配套工程设施：`lib/client.js` 走 DSH Module Loader，token 完整性测试、bundle 契约测试、`check:compat` 兼容性检查。

## 0.3.0 – 0.2.x

历史迭代（0.2.0 起引入 ThemeRuntime token 层与自有 skin 分层，0.2.x 调整色板与卡片几何）。产物留在 `artifacts/release-v0.2.*`，仅作归档，不作为验收依据。
