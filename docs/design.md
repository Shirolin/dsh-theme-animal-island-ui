# Animal Island UI 设计映射（0.3.x）

## 参考基线

本项目将 `guokaigdg/animal-island-ui` commit `29051196bd7586d4484b55431b03178e6046fa64`（2.0.0，MIT License）作为视觉参考。

实现上只提炼色相、表面层级、圆角与按压反馈等抽象关系；波点规格、波浪路径、岛标和整体 CSS 均由本项目独立编写。标题绶带沿用参考 `Title` 的三层构造（正面主体 + 燕尾 + 折角三角），配色改为木质告示牌，在 DSH 的 `nav` 与两个伪元素上重写。

## 三层架构

1. **ThemeRuntime Token**：负责背景、表面、边框、文字、状态色、Sidebar 底色与 hover/active、按钮、链接、字体栈、阴影以及 Markdown / 行内代码 / 代码块 / Shiki 语法色；明暗模式切换（Light / Dark / System）由 DSH 自身解析。
2. **自有 Skin CSS**：负责波点与星空画布、侧栏底部波浪、各组件（品牌、hero、button、input、composer、dialog、code）的作用域样式，以及内嵌的 Nunito Latin WOFF2 字体。根属性与 `<style>` 节点由 `ctx.effect()` 对称安装和清理。
3. **公开 Slot**：保留 DSH 原生 `sidebar` 根组件及其工作区、设置、footer、事件和滚动行为，仅注入 `sidebar.brand.mark`、`sidebar.brand.name`、`conversation.hero.brand.mark` 与 `settings.plugins.tab`。

## Light 色板

| 角色 | 值 | 用途 |
| --- | --- | --- |
| 波点画布 | `#8fcaa5` | 页面外层底色 |
| 主内容纸面 | `rgba(248,248,240,var(--animal-canvas-veil,.4))` | 暖白半透明阅读面，浓度可调 |
| 白色表面 | `#ffffff` | 主卡片、弹出菜单底色 |
| 奶油表面 | `#f7f3df` | 内容层、行内代码 |
| 输入高光 | `#fffbe7` | Composer、输入框底色 |
| 主文字 | `#6f451f` | 标题、侧栏文字 |
| 正文 | `#654a2f` | 卡片与会话正文 |
| 辅助文字 | `#725f48` | 12–14px 弱化文本 |
| Caption | `#7c684d` | 占位符与辅助说明 |
| 品牌薄荷 | `#19c8b9` | 装饰、滑杆进度 |
| 深薄荷 | `#0b6d64` | 链接、业务强调字、键盘焦点环 |
| Sidebar | `#faf8f3` | 侧栏底色 |
| Hover | `#f0e2c8` | 导航悬停（浅暖木色） |
| Active | `#e5c99b` | 导航选中（木牌底色） |
| 波浪 | `#a2b0e7` | 侧栏底部原创 SVG |
| 代码背景 | `#2b2118` | 完整代码块（深色代码岛） |
| 代码前景 | `#e8d5bc` | 代码块正文 |
| 木牌绶带 | `#8a5a33` | 标题木牌正面（配 `#fff3d6` 文字） |
| 木牌阴影 | `#5a3719` | 燕尾折角、铆钉圈与船票底边 |

主文字使用比参考色更深的暖棕，确保在 `#e5c99b` 选中木牌上满足对比度要求（实测 5.17:1 ≥ 4.5:1）。浅薄荷色 `#19c8b9` 不直接用于白色小字或 11px 文本。

## Dark 派生方案

参考项目未提供暗色模式，本项目的 Dark 为针对 DSH 独立设计的「夜岛」方案：

- **内容与输入面**：暖黑半透明内容面（`--animal-cream: #40362b` 作浮层面，`#2a2520` 作 Composer 面），代码块使用深棕底色。
- **冷色侧栏与暖木选中态**：侧栏采用深蓝紫 `#303444`（整套暗色里唯一的冷色面），悬停与选中项仍用暖木牌，形成冷墙挂暖木牌的层次对比。
- **夜岛画布**：深青夜空、星点、右上月晕、低对比夜叶与萤火虫，底部配深青分层山影与水纹。

> [!IMPORTANT]
> Dark 模式下 `--animal-cream` 不能取侧栏的冷色 `#303444`——该变量同时供对话框、卡片与 Composer 按钮消费，取冷色会让弹窗整块变冷，与暖色卡片和代码块冲突。

## 组件造型与交互细节

### 品牌区、启动页与空会话 Hero

- **渡岛船票（侧栏品牌区）**：将侧栏头部的 `24px` 新会话按钮扩展为 `216×60` 的船票（薄荷票根、奶油叶徽、20px 深绿字标与 7px 拉丁副标）。深棕实心底与内层纸面的透明 `2px` 边框共同形成连续轮廓；票根上下缺口的两层遮罩共用圆心与 `2px` 半径差；虚线撕口居中压在票根右缘。折叠态与 Hero 复用同一枚原创倾斜叶片 SVG。
- **Hero 场景标题**：不画外框，由叶片字标、「探索未至之境」大标题与预览章组成。背景为随明暗切换的内联 SVG 风景（亮色为暖阳、云朵与山丘，暗色为月亮、星空与萤火虫）。`520px` 以下收紧画幅，`360px` 以下隐藏英文副标。
- **启动等待页**：全屏昼夜岛屿背景配渡岛船票纸卡，进度环直接读取 DSH 写出的 `--dsh-boot-arc`。纸卡仅在公开进度章 `[data-dsh-boot-spinner]` 存在时启用；启动失败时该节点消失，界面自动退回官方错误卡片并保持错误列表可滚动。

### 工作区导航与面板

- **侧栏与选中态**：侧栏带 `18px` 圆角、`2px` 白边与暖色柔影；会话行与面板当前项（`[role='treeitem'][aria-selected='true']`、`[aria-current='page']`）采用竖向木纹加内嵌高光的「木牌」样式。
- **标题栏木牌绶带（Header Ribbon）**：暖木正面（`::after`，竖向木纹 + 两枚铆钉）配深木燕尾与折角三角（`::before`），三层全部收在 `nav` 盒内以适应 DSH `.crumbs` 的 `overflow: hidden`。
- **插件管理页**：亮色开关使用暖奶油轨道与 `#8f765e` 内描边，开启态为深薄荷轨道；插件行仅铺一层浅奶油阅读底色，防止侧栏或画布底纹穿过描述文字，不改动列表布局。
- **弹出菜单与命令面板**：菜单表面取不透明的 `--dsw-specific-menu`，不套对话框的纸纹卡片外观；菜单项高亮用薄荷色 `--dsw-alias-interactive-bg-hover-accent`（通用的 `--dsw-alias-interactive-bg-hover` 为暖木色，供侧栏会话行共用）。`/` 与 `@` 命令面板仅在底部加 `16px` 渐隐（`[data-trigger-menu]::after`），不改内联高度。

### 输入、按钮与对话框

- **对话气泡（Composer）**：`24–28px` 圆角、`2px` 深墨描边、顶部高光与底部气泡尾标（走 `::before`，避开 DSH 占用 `::after` 绘制的工作区虚线环）；奶油面叠 7% 纸纹与右侧淡叶水印。`:focus-within` 切换为深薄荷描边与 `3px` 外环。
- **按钮与动效反馈**：带文字按钮为胶囊造型，配 `2px` 暖边与 `4px` 立体底边，悬停上浮 `1px`、按压下沉 `2px`（原生 `button` 与 `role='button'` 共用同一分支）；发送键 `:active` 时通过 `::after` 扩出薄荷环。所有位移与叶片摆动均在 `prefers-reduced-motion` 下关闭。
- **输入框与组合输入**：`24px` 圆角、`2.5px` 描边与 `3px` 底边。DSH 组合式输入框（`span > 图标 + input`）由外层容器承担边框与焦点环，内层 `input` 保持透明，避免双层边框。
- **对话框（Dialog）**：奶油卡片叠 7% 纸纹、内缩纸边与虚线缝线（`outline-offset: -10px`，`:not(:focus-visible)` 时生效以保留键盘焦点环）。

### 代码块与平面预览

- **完整代码块（深色代码岛）**：圆角与底色直接读取 DSH 的 `--dsl-code-block-*` 变量（不在容器上覆写，以免顶掉文档预览的 `0px` 平面设置）；`pre` 仅设内边距与排版。顶部 Banner（语言标签 + 复制按钮）统一覆盖为代码前景色 `#e8d5bc`，解决亮色下深棕文字压在深色代码岛上无法辨认的问题。
- **右侧栏平面预览（文档与 Diff）**：右侧栏「文档」预览（`data-code-preview`）与 Deliverables 代码 diff（`data-review-view`）均画在浅色纸面上而非深色代码岛上。亮色模式下，文档预览恢复 DSH 原生文字色，代码 diff 将 `--shiki-*` 切换为浅面可读的暖色语法色；暗色模式仍使用深色代码岛配色。
- **行内代码**：仅对无 `class` 的裸 `<code>` 应用奶油胶囊样式，保留带样式组件（如预设 ID 标签）的原生外观。

### 外观设置与 Windows 外壳

- **外观面板（`settings.plugins.tab`）**：控制 `--animal-canvas-veil`（纸白 `0.52` / 均衡 `0.40` / 海岛 `0.28`，滑杆 `0.15–0.60`；开启系统高对比 `prefers-contrast: more` 时强制 `0.52`）。同时提供浅色 Diff 语法配色（暖色 / DSH 原生）、插画装饰开关（`data-animal-decor`）、纸纹开关（`data-animal-grain`）与界面字体开关（`data-animal-font`，通过独立的 `dsh-theme-animal-island-ui:appearance` token 层切换拉丁字体，不改字号与代码字体）。所有偏好保存在本机 `localStorage`。
- **Windows 桌面外壳适配**：Windows 下 DSH 的 `AppFrame` 默认涂满不透明 `sidebar-fill` 并带 `16px` 内容左上圆角。主题在 `html[data-windows-titlebar]` 下将 frame 清为透明、在 frame 元素上将 `--dsh-windows-content-radius` 设为 `0px`，并通过 `body`（上报给原生 `titleBarOverlay`）、`#root` 与侧栏根节点维持「标题栏 / 侧栏 / 画布」三层表面区分（详见 [web-vs-desktop.md](web-vs-desktop.md)）。

## 样式边界

主题只在 DSH 的公开面上着色。以下越界模式均在历史迭代中引发过回归，由自动化测试与代码审查共同拦截：

| 约束 | 违反后的现象 |
| --- | --- |
| 不重画 DSH 已封装容器的内部节点（代码块内的 `pre`、组合输入框内的 `input`） | 同一控件出现双层边框、两套圆角错位 |
| 不改写其他插件的自有布局（如 `opencode-go` 的 `modelLayout` 网格与 `modelRow` flex） | 列宽比例被破坏、行内开关错位 |
| 不用「事后清零几何」压制自身规则，改为在选择器主语上用 `:not()` 提前排除 | 命令面板 `40px` 行高被压扁、内边距丢失 |
| 胶囊与立体底边仅作用于纯文字按钮；含 `img` / `video` / `canvas` / `svg` 或 `switch` / `checkbox` / `radio` / `option` 角色的控件一律排除 | 附件图片缩略图被套上胶囊边框并挤压裁切 |
| 弹出菜单不套 Dialog 卡片外观；菜单底色映射到不透明的 `--dsw-specific-menu` | 菜单与输入框同色糊成一片，或半透明底色透出下方焦点环 |
| 修改通用 Token 前先核对全部消费方（如 `--dsw-alias-interactive-bg-hover` 被侧栏会话行共用） | 改一处弹出层高亮，连带改掉侧栏悬停色 |
| CSS 变量须声明在直接消费它的元素上；但组件已在自身声明的变量（`--dsl-code-block-*`）不再覆写 | 继承值赢不过元素自身声明导致修改无效，或覆写后破坏预览区的平面样式 |

## 原创资源清单

以下矢量与纹理资源均在本仓库内独立绘制，随 MIT 许可证发布，未使用参考项目的 Logo、照片、插画、图标包或 GROBOLD 字体：

- `src/client/assets/sidebar-wave.svg`：侧栏底部贝塞尔波浪路径
- `src/client/assets/island-horizon.svg`：日间画布底部草坪、水纹与小花
- `src/client/assets/floating-leaves.svg`：日间画布低透明度漂浮叶片与星点
- `src/client/assets/night-leaves.svg`：夜间画布夜叶、萤火虫与星环
- `src/client/assets/night-horizon.svg`：夜间画布层叠山影与水纹
- `src/client/assets/loading-leaf.svg`：启动页票章与进度章叶片
- `src/client/assets/paper-grain.svg`：`feTurbulence` 纸面颗粒纹理
- `src/client/assets/leaf-watermark.svg`：Composer 右侧淡叶水印
- Brand / Hero Mark：React 组件内联原创叶片 SVG 与双层波点背景
