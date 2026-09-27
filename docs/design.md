# 一动森 v0.3.4 设计映射

## 参考基线

本项目将 `guokaigdg/animal-island-ui` commit `29051196bd7586d4484b55431b03178e6046fa64`（版本 2.0.0）作为视觉参考。该 commit 使用 MIT License。

只提炼色相、表面层级、圆润和游戏反馈等抽象关系；波点规格、波浪路径、岛标和整体 CSS 均由本项目重新设计。标题绶带沿用参考 `Title` 的三层构造（正面主体 + 燕尾 + 折角三角），但实现是本项目在 DSH 的 `nav` 与两个伪元素上重写的，没有复制参考代码。

## 三层实现

### ThemeRuntime

- 背景、表面、边框、文字、状态色；
- Sidebar 底色与 hover/active；
- 按钮、链接、字体栈、elevation；
- Markdown、inline code、完整代码块和 Shiki；
- Light / Dark / System 由 DSH 解析。

### 自有 skin

- 原创绿色波点画布；
- 侧栏底部原创波浪装饰；
- 品牌、hero、button、input、composer、dialog、code 的 scoped CSS；
- 内嵌 Nunito Latin WOFF2；
- 唯一根属性和 style 由 `ctx.effect()` 对称清理。

### 公开 Slot

- 保留 DSH 官方 `sidebar` 根组件及其工作区、设置、footer、事件和滚动行为；
- 只替换 `sidebar.brand.mark`、`sidebar.brand.name`、`conversation.hero.brand.mark`；
- 不接管 root、sidebar、main、conversation session、composer 编辑器或事件行为。

## Light 色板

| 角色 | 值 | 用途 |
| --- | --- | --- |
| 波点画布 | `#8fcaa5` | 页面外层 |
| 主内容 | `rgba(248,248,240,.90)` | 暖白半透明中心 |
| 白色表面 | `#ffffff` | 主卡片 |
| 奶油表面 | `#f7f3df` | 内容层、inline code |
| 输入高光 | `#fffbe7` | composer、输入 |
| 主文字 | `#6f451f` | 标题、侧栏 |
| 正文 | `#654a2f` | 卡片和会话 |
| 辅助文字 | `#75634d` | 12–14px 弱化文本 |
| caption | `#7c684d` | placeholder/helper |
| 品牌薄荷 | `#19c8b9` | 绶带、focus、装饰 |
| 深薄荷 | `#0b7f75` | 链接和 business text |
| Sidebar | `#faf8f3` | 浮动侧栏 |
| Hover | `#d6dff0` | 导航 hover |
| Active | `#b7c6e5` | 导航选中 |
| 波浪 | `#a2b0e7` | 侧栏底部原创 SVG |
| 代码背景 | `#2b2118` | 完整代码块 |
| 代码前景 | `#e8d5bc` | 代码正文 |

主文字使用比参考 canonical 更深的暖棕，以在 `#b7c6e5` active 背景上达到 4.5:1。品牌薄荷不直接承担白色小字或 11px 文字。

## Dark

Dark 是 DSH 派生方案，不声称复刻参考项目未公开的 Dark：

- 暖黑半透明内容面（`--animal-cream: #40362b` 作浮层面，`#2a2520` 作 composer 面）；
- 深蓝紫侧栏与波浪（侧栏是整套 dark 里唯一的冷色面，与暖色内容区形成对比）；
- 亮薄荷 brand/business；
- 深棕代码岛；
- 绿色波点改为低对比深青绿。

> 注意：dark 下 `--animal-cream` 不能取侧栏的 `#303444` —— 它同时供对话框、卡片与 composer 按钮使用，取侧栏色会让对话框整块变冷，与暖色卡片、代码块打架。

## 形状与反馈

- Sidebar：18px 圆角、2px 白边、暖色 soft shadow；
- Header ribbon：参考 `Title` 的三层构造 —— 薄荷正面主体（`::after`）+ 深青燕尾与折角三角（`::before`：燕尾走 `clip-path`，折角用两枚渐变三角）；三层全部收在 `nav` 盒内，因为 DSH 的 `.crumbs` 是 `overflow: hidden`；
- 文本按钮：pill、2px 暖边、4px 立体底边；
- 输入/contenteditable：24px 圆角、2.5px 边、3px 输入底边；
- DSH 组合式输入（`span > 图标 + input`）：由外壳承担输入外观，内部 `input` 保持透明，键盘焦点环随之移到外壳，避免同一字段出现两层边框；
- Composer/dialog：24–28px 圆角、奶油卡片；菜单/弹出层不套这层卡片外观，沿用 DSH 自己的弹出chrome，表面取 `--dsw-specific-menu`（= `surface` 白，避免和 composer 的 `#fffbe7` 糊成一片）；
- 弹出层行列高亮（`[role='option'|'menuitem']` 的 hover / `aria-selected`）用薄荷 `--dsw-alias-interactive-bg-hover-accent`；通用的 `--dsw-alias-interactive-bg-hover` 保持 periwinkle，因为侧栏会话行与它共用；
- Code block：容器统一 20px 圆角 —— 通过容器上的 `--dsl-code-block-border-radius` 声明（`div:has(> [data-code-block-content])`），`pre` 只保留 20/24px padding 与排版，不自己画边框/圆角/底色；`pre` 的圆角必须与容器一致，否则底部两角错位；
- Code：inline code chip 只作用于无 class 的 `<code>`，自带样式的组件（预设 id 之类）保留原生外观；
- Hover 上浮 1px，active 下沉 2px；
- `prefers-reduced-motion` 禁用非必要位移。

## 样式边界

主题只在 DSH 的公开面上作画。以下几类越界都在 0.3.4 里被收回，属于不得再犯的约束：

| 约束 | 违反后的现象 |
| --- | --- |
| 不重画 DSH 已经画好的容器内部（代码块的 `pre`、输入框的内层 `input`） | 同一元素出现两层边框 / 两套圆角错位 |
| 不改写插件自有布局（如 opencode-go 的 `modelLayout` 两列与 `modelRow` flex） | 列宽被改、行内控件（开关）位置参差 |
| 不用「事后清零几何」的方式压制自己的规则，改为让规则一开始就不匹配 | 行高被清零、内边距消失（命令面板 40px 行被压扁） |
| 胶囊/3D 只给带文字的控件；含 `img`/`video`/`canvas`、带 `svg`、带 switch/checkbox/radio/option 角色的控件一律排除 | 粘贴图片缩略图被套胶囊、图片被挤压截断 |
| 弹出层不套 dialog 卡片外观，表面走 `--dsw-specific-menu` | 菜单与 composer 同色，看起来像嵌套双框 |
| 通用 token 改动前先查消费方（`--dsw-alias-interactive-bg-hover` 被侧栏会话行共用） | 改一处、连带改掉侧栏 hover/选中 |
| 变量要声明在**使用它的那个元素**上（继承值打不过元素自身声明，`!important` 也不行） | 圆角/背景改不动，或只改到一半 |


## 原创资源

- `src/client/assets/sidebar-wave.svg`：本项目原创贝塞尔路径；
- Brand/Hero Mark：React 内联原创 SVG；
- 波点：30px/15px 的原创双点阵；
- 没有使用参考项目 Logo、照片、插画、图标包或 GROBOLD 字体。

## 能力降级

- Slot 服务缺失：ThemeRuntime 和自有 style 继续生效。
- Sidebar Slot 契约改变：拒绝接管，官方 Sidebar 保留。
- CSS semantic hook 消失：仅丢失绶带或局部圆角/阴影；插件自有布局照旧（皮肤不去改它）。
- 字体/图片失败：系统字体和纯 CSS 背景兜底。
- ThemeRuntime 不兼容：整个 skin 安全 no-op，原生 DSH 继续运行。

## 相关文档

- `README.md`：安装、验收流程与视觉范围；
- `CHANGELOG.md`：各版本的可见变化；
- `docs/compatibility.md`：DSH 接缝、已审阅属性/变量、工程约束与离屏夹具；
- `docs/session-list-blank.md`：侧栏会话区空白一次误判的排查记录（结论：DSH 侧，与皮肤无关）。
