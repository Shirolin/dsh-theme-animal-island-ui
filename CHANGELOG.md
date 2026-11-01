# 变更记录

本文件记录每个发布版本对用户可见的变化。安装与验收流程见 `README.md`，设计映射见 `docs/design.md`，DSH 兼容边界见 `docs/compatibility.md`。

## 未发布

- Windows 暗色桌面标题栏从与侧栏同色改为夜青 `#1f3034`，侧栏保持深蓝 `#303444`，画布保持暖棕，恢复“标题栏 / 侧栏 / 画布”三层关系；
- Windows 亮色标题栏与右侧窗口按钮区统一为画布薄荷色 `#e7efe5`，侧栏仍保持奶油纸面，消除原生按钮区的色块断层；
- 标题栏只改变 native caption 的上报色，`#root` 恢复应用内奶油 token，侧栏通过直接语义 `nav[aria-label]` 的父节点恢复底色；不改侧栏列宽、内边距或排列，桌面夹具同时断言 caption、侧栏和画布三种颜色；
- 亮色模式下，插件开关改用暖奶油轨道、`#8f765e` 内描边与清晰的开关滑块；开启态改为深薄荷轨道，保留原有 36×20 尺寸和 16px 滑块行程；
- 插件管理列表行增加很淡的奶油阅读面，避免固定画布波浪穿过描述文字，同时保持 DSH/插件自己的行距、圆角与列表排列；
- 两处修改都只在亮色模式启用，暗色模式与全局 token 不变。

## 0.3.22（亮色标题栏分隔）

- 亮色模式下，会话标题栏底边从几乎融入画布的 `border-l3` 改为暖灰棕 `#b9aa90`，保留原有 `0.5px` 线宽；
- 只作用于带 `[data-conversation-header-corner]` 的会话标题栏，不修改全局 token、控件边框或暗色模式；
- 这条线只承担标题区与滚动正文的结构分隔，对比度控制得更低，不与可操作控件争夺注意力。

## 0.3.21（亮色分裂按钮边界）

- 亮色模式下，「打开方式」分裂按钮的外框与中缝改用独立的深暖棕 `#8f765e`，不再沿用几乎融入画布的 faint border；
- 只增强功能性边界，不改线宽、图标颜色或全局 `--dsw-alias-border-l4`；暗色模式不受影响；
- 选择器只依赖 OpenTargetButton 的 `[data-open-target]` 与下拉按钮的标准 `aria-haspopup="menu"` 语义，不依赖组件 CSS module hash。

## 0.3.20（渡岛船票与对比度修正）

- 侧栏品牌从 216×52 木质门牌换成 216×60 渡岛船票：奶油纸面、薄荷票根、虚线撕口与上下透明半圆缺口；
- 外轮廓改由深棕实心底与内层透明 2px 边框共同形成，圆角、直边和两个缺口都从这层厚度推导；纸面遮罩的缺口半径只比底遮罩大相同的 2px，不再拼接独立圆弧；虚线撕口居中于票根边缘并从缺口描边外侧开始；
- 票根直接贴着纸面左缘，叶片放在奶油圆徽上；纸面只保留 1px 顶部受光和底部轻压，不再用全周白色内高光制造纸张厚度，hover 上浮 1px、按下落回 2px；
- 窄侧栏票根从约 54px 收至 44px，180px 宽度下 `动森岛` / `ANIMAL ISLAND` 仍完整；
- 会话空状态的裸品牌行改成场景式游戏开场字标：去掉外层牌框，以叶片字标、`探索未至之境` 大标题和轻量预览章建立层级；内联 SVG 在亮色下画暖阳、云朵、树枝与浅色山丘，暗色下切换为月亮、星空、萤火虫和夜色山丘，共用同一布局与响应式几何；
- 修复暗色模式下「工作区内修改」被发送键立体选择器误命中的问题：图标加文字触发器不再套深青色外圈，发送/停止键的三层立体描边保持不变；
- 会话输入框聚焦时，气泡尖角同步切换薄荷色描边，与焦点边框保持一致；
- 明亮模式把链接、business 与小字号辅助文字的对比度补到真实画布 AA；成功、警告状态在 layer-2 / layer-3 纸面上同步留出余量；
- 键盘焦点统一为深薄荷：全局控件、弹层输入壳、品牌入口与 Composer 共用同一颜色，Composer 另用奶油间隔分隔外环；
- 工作区与模型菜单改为不透明暖棕材质，Composer 的薄荷焦点环和输入内容不再透进浮层；
- 选中会话与当前侧栏项内的次级文字提升到可读层级，亮暗模式的木牌时间与图标不再贴线；
- 动森外观滑杆改成主题化轨道：亮色用暖木、暗色用深棕，填充和滑块保留薄荷，WebKit 与 Firefox 都有显式样式；「画布预览」标签提升到 11px / 70% 白底；
- 代码注释色提高到 `5.42:1`；启动失败页的长诊断增加轻量奶油阅读面，避免插画与波点持续干扰；
- 暗色画布补齐夜岛纹理：新增原创夜叶/萤火虫与深青山影资源，叠在星点和月晕之上，不再只剩点阵背景；
- DSH 启动等待页改成昼夜两套「渡岛启航」场景：叶片票章、纸质卡片、环形航线与金色萤火点；进度弧继续读取 DSH 的实时 `--dsh-boot-arc`，纸卡只锚定公开进度章，加载失败时自动退回官方错误列表并允许滚动；
- `sidebar-masthead` 夹具继续覆盖 280 / 240 / 180 × 浅/深，并在浏览器内锁住双层遮罩的 2px 半径差、贴边票根、字标边界与纸面几何；`pnpm run check:visual` 作为独立视觉门禁。

## 0.3.18（木质门牌）

0.3.17 只是把字放大，整块还是像贴在侧栏上的标签。这次把品牌区做成一块真正的门牌：

- 216×52 的木质门牌：竖向木纹、两枚奶油铆钉、内嵌高光与柔和投影，木色和标题绶带是同一套；
- 叶片放进 32px 奶油圆徽，18px 奶油字标 + 9px 金色拉丁行，门牌在 80px 的 logoRow 里居中；
- 门牌本身是 DSH 的「新会话」按钮，所以不做 3D 底边，只留投影和 hover 上浮 1px；focus ring 画在行外；
- 窄侧栏用 `max-width: 100%` 收窄，折叠态、web 的 60px logoRow 和官方 fallback 品牌都不动；
- `test/fixtures/sidebar-masthead/` 继续覆盖 280 / 240 / 180 × 浅/深；`test/skin.test.mjs` 锁住 80px 行高、52px 门牌、216px 宽度、内盒释放与「不得嵌套 `:has()`」。

## 0.3.17（侧栏头图）

侧栏顶部的品牌区原来是 14px 字标 + 7px 拉丁小字挤在 DSH 的 24px 品牌盒里，叶子只有 24px，整块读起来像贴在角落的标签。这次把它做成真正的头图：

- 品牌按钮从 24px 长到 40px（正好是 Windows logoRow 的高度），字标按 19px / 8.5px 重排，行盒 22 + 1 + 11 = 34px 完整落在按钮里，不再靠 DSH 的裁剪盒；
- 叶子从 24px 提到 32px，拉丁行字距从 0.08em 提到 0.15em，`ANIMAL ISLAND` 在 1x 下也能读；
- 按钮内层的 24px identity / name 盒释放成 `height: auto`，同时放开 logoRow 的 `overflow`，focus ring 不再被 40px 行裁掉；折叠态、web 的 60px logoRow 和官方 fallback 品牌都不受影响；
- 品牌按钮同时是 DSH 的「新会话」快捷入口，长高后点击区域随行高变大；这是 40px 行预算内的自然结果，没有额外加可点击装饰；
- 新增 `test/fixtures/sidebar-masthead/`（280 / 240 / 180 三档宽度 × 浅/深色）替代旧的 `sidebar-brand-desktop`；`test/skin.test.mjs` 锁住 40px 预算、`overflow: visible`、内盒释放与「不得嵌套 `:has()`」（嵌套 `:has()` 会被浏览器整条丢弃）。

## 0.3.16（圆角真正去掉）

- 0.3.15 没生效：`--dsh-windows-content-radius: 0px` 写在 `<html>` 上，但 DSH 的 `[data-windows-titlebar] .frame` **自己又声明了 `16px`**，局部声明覆盖继承，所以重启后那个圆角还在；
- 现在把变量写在 frame 元素本身（`html[data-windows-titlebar] #root > div > div`）上，直接覆盖 DSH 的声明；`.centerCol` 的 `border-radius` 继承到 0，左上角变成直角；
- `docs/compatibility.md` 明确记录「必须写在 frame 上」，`test/skin.test.mjs` 也改为断言 frame 规则里带 `0px`，防止再写错层级。

## 0.3.15（去掉 Windows 自带圆角）

- 0.3.14 误判了这个角：那 16px 圆角不是主题画的，是 DSH Windows 外壳给内容列加的 `--dsh-windows-content-radius: 16px`；主题要的是去掉它，而不是保留；
- 现在重新设为 `0px`：内容列左上角与 web 一样是直角，外壳圆角不再出现；frame 透明与 `--animal-canvas-veil` 的画布统一不变；
- `docs/web-vs-desktop.md`、`docs/compatibility.md` 和 `test/skin.test.mjs` 同步改成「frame 透明 + 内容圆角 0」。

## 0.3.14（恢复 Windows 圆角）

- 撤回 0.3.12 的 `--dsh-windows-content-radius: 0px`：内容列左上角恢复 DSH 原生的 16px 圆角。0px 虽然能和 web 完全一致，但 web 没有对应的角可对齐，实际观感像被切掉；
- 这是主题**唯一保留的 Windows chrome 例外**：frame 仍然透明（画布/透明度统一），但内容列圆角跟随 DSH 窗口 chrome；web 不受影响；
- `docs/web-vs-desktop.md` 的「统一策略」「内容列左上角」与 `test/skin.test.mjs` 同步改成「frame 透明 + 保留 16px」，防止再次被误删。

## 0.3.13（桌面标题绶带）

- 修好 0.2.x 桌面端「标题绶带只剩一块棕色木板、字看不见」：当前 crumb 的 `<span class="crumbCurrent">` 自己声明了 `color: var(--dsw-alias-label-primary)`（深棕），压在棕色木板上就是 brown-on-brown；主题现在对 `nav :where(span)` 显式给奶油色（深色给米色），不再只靠 `nav` 继承；
- 这是 0.2.x 在 Windows 上先暴露的版本差异，登记进 [web-vs-desktop.md](docs/web-vs-desktop.md)；
- 不改任何布局/几何，只改标题文字颜色与阴影。

## 0.3.12（平台样式统一）

- Windows parity block 扩到几何：`html[data-windows-titlebar] { --dsh-windows-content-radius: 0px }`，内容列与全屏右栏 dock pane 的左上角和 web 一样是直角，不再保留桌面独有的 16px 圆角；
- 主题现在只保留**一个**平台分支（frame 透明 + 圆角 0），其余颜色/间距/组件规则全部 web/desktop 共享；[web-vs-desktop.md](docs/web-vs-desktop.md) 的「统一策略」写明可统一与不可统一的边界；
- 核实 40px 标题栏条是 Desktop 主进程的 native `titleBarOverlay`（`windowsAppearance` IPC），CSS 改不到；不再尝试用 `::before` 覆盖，避免制造“改了但没生效”的假象；
- 回归测试锁住 frame 透明与 `--dsh-windows-content-radius: 0px`。

## 0.3.11（预览保真）

- 「画布预览」原来只叠一层 `--dsw-alias-bg-base`，而真实主内容是 `centerCol` + 会话根两层叠加；预览看起来比实际更绿。现在预览同步叠两层，0.15 时预览与实际都落在 `(172,215,186)`；
- 新增 [docs/web-vs-desktop.md](docs/web-vs-desktop.md)：把 Windows 标题栏、折叠侧栏、右栏全屏、dock float、macOS 分支与历史问题逐项归类，并记录 0.3.10 外壳修复；
- 无平台行为变化，0.3.10 的 Windows frame 透明修复保持。

## 0.3.10（Windows 桌面画布）

修掉桌面端「web 能调、desktop 调了没反应」：DSH 的 Windows 外壳把整窗 AppFrame 画成了不透明的 `--dsw-specific-sidebar-fill`，画布的奶油层只是叠在这块不透明底上，所以透明度再低也只看到一块奶油灰。macOS 分支给同一个 frame 的是 `background: 0 0`，Windows 漏了。

### 外观设置

- 皮肤在 `html[data-windows-titlebar]` 下把 AppFrame 清成透明：侧栏/右栏各自重画自己的表面，只有主内容列换成画布，滑杆在桌面端和 web 一致生效；
- 这是 DSH 外壳的路径差异（[discussion #9490](https://github.com/deepseek-ai/deepseek-harness/discussions/9490)），不是主题 token 没写进去 —— 用 `getComputedStyle` 在桌面端核对过：`--dsw-alias-bg-base` 已经是 `rgba(248,248,240,0.15)`，只是被外层不透明 frame 盖住；
- 该规则登记进 `docs/compatibility.md` 的接缝表与 `test/skin.test.mjs`，防止后续重构把它删掉。

## 0.3.9（外观预览）

修掉「改了透明度却看不到变化」的困惑：设置页是一张不透明的纸卡，滑杆真正调整的是它背后的画布，加上弹层遮罩，面板打开时几乎看不到画布变化，于是像是失效。

### 外观设置

- 「动森外观」页新增实时「画布预览」：绿色波点画布 + 同一条 `--animal-canvas-veil` 奶油层，拖动滑杆即可在面板内看到变化，不用关掉设置再去分辨背景；
- 说明文案讲清「设置卡片是固定纸面，滑杆调的是它背后的画布」，并指明预览会实时同步；
- 深色画布也改由 `--animal-canvas-veil` 驱动（`0.40` 仍落在原来的 `0.84`，默认观感不变），滑杆在夜间主题下同样生效；
- 修正：此前深色主题把纸面透明度写死为 `0.84`，滑杆在深色下完全无效。

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
