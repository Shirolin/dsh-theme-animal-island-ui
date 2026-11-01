# 一动森设计映射（0.3.x）

## 参考基线

本项目将 `guokaigdg/animal-island-ui` commit `29051196bd7586d4484b55431b03178e6046fa64`（版本 2.0.0）作为视觉参考。该 commit 使用 MIT License。

只提炼色相、表面层级、圆润和游戏反馈等抽象关系；波点规格、波浪路径、岛标和整体 CSS 均由本项目重新设计。标题绶带沿用参考 `Title` 的三层构造（正面主体 + 燕尾 + 折角三角），配色改为木质告示牌；实现是本项目在 DSH 的 `nav` 与两个伪元素上重写的，没有复制参考代码。

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
| 主内容 | `rgba(248,248,240,var(--animal-canvas-veil,.4))` | 暖白半透明中心，透明度可调 |
| 白色表面 | `#ffffff` | 主卡片 |
| 奶油表面 | `#f7f3df` | 内容层、inline code |
| 输入高光 | `#fffbe7` | composer、输入 |
| 主文字 | `#6f451f` | 标题、侧栏 |
| 正文 | `#654a2f` | 卡片和会话 |
| 辅助文字 | `#725f48` | 12–14px 弱化文本 |
| caption | `#7c684d` | placeholder/helper |
| 品牌薄荷 | `#19c8b9` | 绶带、装饰、滑杆进度 |
| 深薄荷 | `#0b6d64` | 链接、business text、键盘 focus |
| Sidebar | `#faf8f3` | 浮动侧栏 |
| Hover | `#f0e2c8` | 导航 hover（暖木浅色） |
| Active | `#e5c99b` | 导航选中（木牌） |
| 波浪 | `#a2b0e7` | 侧栏底部原创 SVG |
| 代码背景 | `#2b2118` | 完整代码块 |
| 代码前景 | `#e8d5bc` | 代码正文 |
| 木牌绶带 | `#8a5a33` | 标题木牌正面（字 `#fff3d6`） |
| 木牌阴影 | `#5a3719` | 燕尾折角与铆钉圈 |

主文字使用比参考 canonical 更深的暖棕，以在 `#e5c99b` active 背景上达到 4.5:1（实测 5.17:1）。品牌薄荷不直接承担白色小字或 11px 文字。

## Dark

Dark 是 DSH 派生方案，不声称复刻参考项目未公开的 Dark：

- 暖黑半透明内容面（`--animal-cream: #40362b` 作浮层面，`#2a2520` 作 composer 面）；
- 深蓝紫侧栏与波浪（侧栏是整套 dark 里唯一的冷色面，与暖色内容区形成对比）；
- 选中/悬停是暖木牌，形成「蓝墙挂木牌」的对比；
- 亮薄荷 brand/business；
- 深棕代码岛；
- 浅色画布装饰层换成「夜岛」：深青天空 + 星点 + 右上月晕 + 低对比夜叶/萤火虫 + 深青分层山影与水纹。

> 注意：dark 下 `--animal-cream` 不能取侧栏的 `#303444` —— 它同时供对话框、卡片与 composer 按钮使用，取侧栏色会让对话框整块变冷，与暖色卡片、代码块打架。

## 形状与反馈

- 品牌标：原创倾斜叶片（叶尖朝上、叶脉提亮）；侧栏头图是一张 216×60 的「渡岛船票」—— 薄荷色票根、奶油叶徽、20px 深绿字标与 7px 棕色拉丁行；深棕实心底与内层纸面的透明 2px 边框共同形成连续轮廓，圆角由内外半径的差值产生，票根上下每个缺口的两层遮罩也共用同一圆心与 2px 半径差；票根贴住纸面左缘，虚线撕口居中于这条边缘；折叠态与 hero 复用同一枚 SVG；
- Hero 场景标题：不画容器边框，以叶片字标、「探索未至之境」大标题和轻量预览章组成游戏开场字标；背景使用随主题切换的内联 SVG 分层插画，亮色是暖阳、云朵、树枝与浅色山丘，暗色换成月亮、星空、萤火虫和夜色山丘。两套画面共用同一布局与几何，只切换色彩和场景元素；520px 以下收紧画幅，360px 以下隐藏英文副标，避免窄屏挤出；
- Composer：作为「对话气泡」——2px 深墨描边、顶部高光与底部小尾巴；尾巴走 `::before`，因为 DSH 已用卡片的 `::after` 画 workspace 触发虚线环；奶油面叠 7% 纸纹与右侧淡叶水印；
- 交互按钮：顶部高光 + 硬底 + 回弹；hover/active 对原生 `button` 与 `role='button'` 走同一规则（旧版只挂在 `role='button'` 分支，原生按钮会永久呈现 hover 态）；
- 输入焦点：composer `:focus-within` 改用深薄荷描边，并以奶油间隔分隔 3px 深薄荷外环（只改颜色/阴影，不改尺寸）；
- 发送键按压：`::after` 薄荷环从键位扩出（`:active`；插件没有发送事件钩子，所以是按压反馈而非发送后动画）；
- 侧栏叶片 hover 轻摆 `rotate(-6deg) scale(1.06)`；选区为半透明薄荷；以上都在 `prefers-reduced-motion` 下关闭；
- 画布：波点 + 45° 斜纹 + 底部草/水双波纹 + 低透明度漂浮叶子/花/星；深色换成「夜岛」深青天空 + 星点 + 右上月晕 + 夜叶/萤火虫与深青山影；
- 启动等待页：延伸到全屏的昼夜岛屿背景 + 渡岛船票纸卡；顶部叶片票章、`动森岛` 字标、中心叶片进度章和环绕萤火点共同显示「正在登陆无人岛」。进度环只消费 DSH 写出的 `--dsh-boot-arc`，不覆盖加载状态；纸卡只在公开进度章存在时启用，失败时自动退回官方卡片，并让错误列表在主题背景上安全居中、可横向与纵向滚动；
- 画布透明度：主内容的奶油面由 `--animal-canvas-veil`（默认 .4）驱动；「设置 → 插件 → 动森外观」提供纸白 .52 / 均衡 .40 / 海岛 .28 三档 + .15–.60 滑杆，面板内用同一变量渲染「画布预览」（绿色波点画布 + 同透明度奶油层），设置弹层本身保持固定纸面，选择存本机 `localStorage`；深色纸面同样跟随该变量（.40 落在原 .84，默认观感不变）；`prefers-contrast: more` 强制 .52；Windows 桌面外壳的 AppFrame 默认用不透明 sidebar-fill 盖住画布，皮肤在 `html[data-windows-titlebar]` 下把 frame 清成透明，并在 **frame 元素**上把外壳自带的 16px 内容圆角设为 0px，与 web 一样是直角（变量必须写在 frame 上，写在 `<html>` 上会被 DSH 的 `.frame` 声明覆盖；见 [web-vs-desktop.md](web-vs-desktop.md) 与 #9490）；40px 标题栏条是 native titleBarOverlay，皮肤不试图覆盖；
- Sidebar：18px 圆角、2px 白边、暖色 soft shadow；
- Header ribbon：木质告示牌 —— 暖木正面（`::after`，竖向木纹 + 两枚铆钉）+ 深木燕尾与折角三角（`::before`：燕尾走 `clip-path`，折角用两枚渐变三角）；奶油字 `#fff3d6`（深色 `#f6e6c8`）；三层全部收在 `nav` 盒内，因为 DSH 的 `.crumbs` 是 `overflow: hidden`；
- 文本按钮：pill、2px 暖边、4px 立体底边；
- 输入/contenteditable：24px 圆角、2.5px 边、3px 输入底边；
- DSH 组合式输入（`span > 图标 + input`）：由外壳承担输入外观，内部 `input` 保持透明，键盘焦点环随之移到外壳，避免同一字段出现两层边框；
- Composer/dialog：24–28px 圆角、奶油卡片；dialog 另叠 7% 纸纹 + 内缩纸边 + 虚线缝线（`outline-offset: -10px`，`:not(:focus-visible)` 保留焦点环）；菜单/弹出层不套这层卡片外观，沿用 DSH 自己的弹出chrome，表面取 `--dsw-specific-menu`（= `surface` 白，避免和 composer 的 `#fffbe7` 糊成一片）；
- 选中态：侧栏会话行 / 面板行用「木牌」——暖木底 + 竖向木纹 + 内嵌高光/压边（`[role='treeitem'][aria-selected='true']`、`[aria-current='page']`）；
- 弹出层行列高亮（`[role='option'|'menuitem']` 的 hover / `aria-selected`）用薄荷 `--dsw-alias-interactive-bg-hover-accent`；通用的 `--dsw-alias-interactive-bg-hover` 是暖木色，因为侧栏会话行与它共用；
- 命令面板（`/`、`@`）的滚动高度由组件按可用空间内联算出，主题只给面板底边加 16px 渐隐（`[data-trigger-menu]::after`，颜色取面板自身表面），让被裁掉的半行读作「下面还有」—— 不改高度，短列表不滚动时不受影响；
- Code block：圆角/底色跟随 DSH 的代码块变量（圆角 12px，不另立数值 —— 容器变量一旦在容器上覆写，会连带顶掉文档预览刻意设的 `0px` 平面样式）；`pre` 只保留 20/24px padding 与排版，不自己画边框/圆角/底色；banner 文字（语言标签 + 复制按钮）用代码前景色：标签自己声明了 `label-primary`、复制按钮只是 `inherit`，所以 banner 本身与它的直接子元素都要覆盖 —— 否则会出现「右边改好了、左边还是看不清」；右侧栏「文档」预览（`data-code-preview`）是**平面**代码视图，那里必须让文字回到 DSH 自己的颜色：深色代码岛的前景/配色落到浅色面板上只有 1.35:1，灰成一片（高亮的「代码」视图不受影响）；
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
| 变量要声明在**使用它的那个元素**上（继承值打不过元素自身声明，`!important` 也不行）；但组件已经在自己身上设过的变量（`--dsl-code-block-*`）就不要写 | 圆角/背景改不动，或改动了却顶掉组件的自有意图（预览平面样式） |


## 原创资源

- `src/client/assets/sidebar-wave.svg`：本项目原创贝塞尔路径；
- `src/client/assets/island-horizon.svg`：底部草/水波纹与小花；
- `src/client/assets/floating-leaves.svg`：漂浮叶子/花/星点阵（低透明度，浅色画布用）；
- `src/client/assets/night-leaves.svg`：深色画布的夜叶、萤火虫与星环点阵；
- `src/client/assets/night-horizon.svg`：深色画布的层叠山影、水纹与萤火；
- `src/client/assets/loading-leaf.svg`：启动页票章与中心进度章的叶片图标；
- `src/client/assets/paper-grain.svg`：`feTurbulence` 纸纹（composer / dialog 平铺）；
- `src/client/assets/leaf-watermark.svg`：composer 右侧的淡叶水印；
- Brand/Hero Mark：React 内联原创叶片 SVG；
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
