# DSH 兼容性说明

## 支持基线

- **仓库测试基线**：DSH `0.1.5-rc.3`（`@deepseek-ai/dsh-client-ui-theme@0.1.5-rc.3` 及同版本 Sidebar / Conversation / Layout，React 18）。
- **桌面客户端验证基线**：`0.2.2-rc.1`（内置于桌面端 `app.asar`）。它与 Web 端运行同一套前端应用与客户端插件契约；关于桌面端 profile 隔离、安装与夹具验证的细节见 [desktop.md](desktop.md)。
- **支持区间**：桌面客户端 `>= 0.2.2 < 0.3`。跨 minor 升级通常不需要改皮肤（Token、Slot 与 `data-*` 接缝都稳定），需要核对的是夹具还原的 DOM 是否仍与真实运行时一致。

DSH 仍处于 `0.x` 迭代阶段。本插件仅依赖已验证的公开接缝（Seam），在接缝变更时按下方降级矩阵回退。

### 夹具运行时

夹具用真实 DSH 的 CSS 与手写 DOM 还原界面，所以同一个夹具在不同 DSH 版本上本来就可能得到不同结论。因此：

- 每次运行都会先打印 `[fixture] DSH runtime <版本> <- <路径>`；截图与断言结论只对该版本成立。
- 需要可复现的结论时用 `--expect-dsh <版本>` 固定，版本不符立即失败：
  ```sh
  pnpm run check:fixtures -- --expect-dsh 0.2.2-rc.1
  ```
- `--desktop` 自动解包本机安装的桌面端，版本随桌面客户端自动更新而变化；不要把它当成「基线」本身。

## DSH 升级时怎么处理

桌面客户端会自动更新，因此每个新版本都要跑一遍夹具（`pnpm run build && pnpm run check:fixtures`）。失败分两类，处理方式不同：

| 现象 | 判定 | 处理 |
| --- | --- | --- |
| 断言失败且涉及的量在**新旧运行时都会变** | 夹具还原的 DOM 或 DSH 自身 CSS 变了，皮肤没变 | 更新 `body.html` 与断言到新结构，只动受影响的夹具 |
| 断言通过但截图出现样式错位，或 `skin.css` 的规则未命中 | 皮肤回归 | 改 `skin.css`，按 [design.md](design.md) 的样式边界处理 |
| 断言里的数字来自 DSH 而非皮肤（如标题内边距推算） | 断言耦合了实现细节 | 改成比较设计意图（元素实际位置/尺寸），不要回推 padding |

跨 minor 的实际经验：`0.2.1-rc.5 → 0.2.2-rc.1` 皮肤零改动（22 张夹具截图逐字节相同），只把设置面板的夹具 DOM 同步到 0.2.2 新的 grid 结构（标题从 `nav` 子元素变为面板级格子）。

## 公开扩展面

- `ctx.theme.overrideTokens(source, { light, dark }) -> disposer`
- `ctx.slots.inject / register / spec`
- `sidebar.brand.mark`、`sidebar.brand.name`
- `conversation.hero.brand.mark`
- `settings.plugins.tab`（插件自有的「动森外观」设置页入口）
- `body[data-ds-dark-theme]`
- DSH 公开的 `--dsw-*` 与 `--shiki-*` Token

Slot 仅用于公开组件注入；`data-slot` 仅在测试断言中用于定位，不作为生产环境 CSS 选择器。

## 已审阅的属性与变量接缝

除 Slot 与 Token 外，皮肤 CSS 只允许使用下表列出的语义标签、ARIA 角色与 DSH 属性。机器可读的完整契约、DSH 源码证据与探针定义统一在 `scripts/seam-contract.mjs` 中维护，由 `pnpm run check` 自动核对。

| 接缝 | 用途 | 稳定性依据 |
| --- | --- | --- |
| `[data-composer-card]` | Composer 卡片作用域：按钮胶囊化、输入框重置与特殊控件排除的边界 | 会话输入区的语义容器，跨版本稳定 |
| `[data-conversation-header-corner]` | 标题木牌绶带与亮色标题栏底边的启用条件（`header:has(...)`）；底边仅调色，保留 `0.5px` 几何 | 会话头部角落插槽标记 |
| `[data-trigger-menu]` | Composer 的 `/` 与 `@` 触发面板：排除胶囊与对话框装饰，并在底边加 `16px` 渐隐（`::after`），不改内联 `max-height` | DSH 自身的 pointerdown 关闭逻辑依赖该属性 |
| `[data-code-block-banner]` | 代码块顶部栏（语言标签 + 复制按钮）文字颜色：亮色下将默认深棕字改为浅色代码前景，连同直接子元素一并覆盖 | 代码块头部标记；仅改颜色，不改几何 |
| `[data-code-preview]`、`[data-textpreview-plain]` | 右侧栏「文档」预览的两条平面视图（高亮代码 / 纯文本）：排除深色代码岛排版，保留 DSH 原生内边距与文字色 | `CodeBody` 与 `TextBody` 渲染的公开属性 |
| `[data-turn-trigger]` | 会话里的触发提示条：DSH 用深色代码面作底，却配浅色界面的三级文字色。亮色下仅在卡片保持深色底时把该作用域内的 `label-primary/secondary/tertiary` 换成深面可读的暖色；悬停时 DSH 会把底色换成浅色交互面，该状态交还它原本的深色文字。卡片底色、边框与 hover 配色保持原样 | `TurnTriggerNodeView` 渲染在 section 根上的标记；由 `turn-trigger-notice` 夹具锁定默认态对比度，CSS 规则测试锁定 `:not(:hover)` 作用域 |
| `body > [role="alert"]` | 应用内浮层提示（toast）：DSH 把它 portal 到 `body`，底色是本主题的深色工具栏棕。亮色下把图标（`state-success-primary` / `state-warn-label`）换成深面可读的浅色；行内操作链接（`static-deepseek-400`）在两种模式下都换成浅蓝——DSH 静态蓝在该底色上也只有 3.4:1。浮层底色、圆角与阴影保持原样 | DSH `createPortal(..., document.body)` 的 toast 根节点；由 `toast-notice` 夹具锁定对比度 |
| `[data-review-view]` | 右侧栏 Deliverables 代码 diff：画在浅色纸面上的平面视图。亮色下将 `--shiki-*` 切换为浅面可读的暖色语法色，几何由组件自身控制 | `FileDiff` 组件的根标记；由 `deliverables-diff` 夹具锁定计算色 |
| `[data-open-target]` | 分裂式「打开方式」按钮在亮色下的外框与中缝（内部 `button[aria-haspopup="menu"]`）：增强在浅色画布上过淡的原生边框 | `OpenTargetButton` 的语义标记，不依赖 CSS Module 哈希 |
| `[data-plugin-item]`、`[data-plugin-package]` | 插件管理列表行在亮色下的浅奶油阅读面，防止画布底部波浪穿过透明行文字；不改边距与排列 | Plugin Manager 为配置行与插件行写出的标记 |
| `[data-action-card]` | 动作卡内的结果文本是浅色卡面上的普通文本：不套深色代码岛前景与 `20px` 代码排版，保留 DSH 自身的标签色与紧凑度量 | `ActionCard` 渲染在包裹卡体 section 上的标记；由 `code-island-scopes` 夹具锁定 |
| `[data-tool="present"]`、`[data-tool="schedule_create"]` | Present 结果行与「创建自动化任务」回退文本位于浅色工具卡：同样交还原生 label 色与度量 | 工具行根节点的语义工具标记；由 `code-island-scopes` 夹具锁定 |
| `[data-dsh-boot]` | 全屏启动等待页：提供昼夜岛屿背景；失败页保持官方错误列表可滚动 | `WebBootPage` 在插件加载前写出的根标记 |
| `[data-dsh-boot-spinner]` | 启动进度章：通过 `[data-dsh-boot]:has([data-dsh-boot-spinner])` 启用渡岛船票纸卡；进度弧读取 `--dsh-boot-arc` | 启动失败时该节点被移除，纸卡条件随之失配，自动退回官方错误页 |
| `--dsl-code-block-*` | 代码块圆角、底色与 Banner 变量 —— 皮肤**只读不写**，避免顶掉文档预览的 `0px` / `transparent` 平面设置 | DSH 为代码块预留的样式变量 |
| `body[data-ds-dark-theme]` | 深色模式分支选择器 | `ThemePresenter` 写出的主题状态属性 |
| `[data-windows-titlebar]` | Windows 桌面端外壳标记：将 `AppFrame` 上的不透明 `sidebar-fill` 清为透明，露出底层画布 | Electron 外壳写入的平台属性（见 [#9490](https://github.com/deepseek-ai/deepseek-harness/discussions/9490)） |
| `#root` + `div:has(> nav[aria-label])` | Windows 标题栏三层表面：让 `body` 的 `sidebar-fill` 供原生标题栏读取，再在 `#root` 与侧栏根节点恢复各自底色 | `#root` 为根容器，侧栏根节点包含直接子元素 `nav[aria-label]`；仅改底色 |
| `--dsh-windows-content-radius` | Windows 内容列左上角圆角：在 **frame 元素**上设为 `0px`，与 Web 端直角对齐 | Layout 插件公开变量；必须写在 `.frame` 元素上才能覆盖其自身声明 |
| `--dsw-menu-surface-fill` | 桌面端新版菜单材质底色别名：映射到不透明的 `--dsw-specific-menu`，防止透出下方焦点环 | 仅在支持该变量的运行时生效，旧版自然忽略 |
| `role="alert" / button / checkbox / dialog / group / listbox / menu / menuitem / menuitemradio / option / radio / search / switch / treeitem` | 控件、弹层、搜索框与树行的语义锚点；对话框内的 `<pre>`（插件更新日志、预设源码查看）保持对话框自身的文字色，不套深色代码岛排版 | 标准 ARIA 角色 |
| `[role='treeitem'][aria-selected='true']` | 选中的会话行与搜索结果行：木牌底色、木纹与内嵌压边 | 树行选中态 ARIA 属性 |
| `[aria-current='page']` | 侧栏面板行的当前选中项：木牌底色、木纹与内嵌压边 | 导航当前页 ARIA 属性 |
| `[aria-pressed]`、`[aria-selected]`、`[aria-checked]`、`[aria-expanded]` | 按钮按压、列表选中、开关与展开状态 | 标准 ARIA 状态属性 |
| `[aria-haspopup]`、`[aria-label]` | 识别菜单触发器与带文字标签的控件 | 标准 ARIA 属性，只读语义 |

### 插件自有属性与受限例外

- **自有 CSS 变量**：`--animal-canvas-veil`（默认 `0.4`，高对比模式下强制 `0.52`）控制画布奶油面透明度；`--animal-decor-*` 与 `--animal-paper-grain` 控制插画层与纸纹开关（关闭时设为 `none`）。
- **自有根属性**：在 `<html>` 上维护五个自有状态属性（非 DSH 接缝）：`data-animal-appearance`、`data-animal-diff-syntax`（`warm` / `native`）、`data-animal-decor`（`on` / `off`）、`data-animal-grain`（`on` / `off`）与 `data-animal-font`（`theme` / `system`）。切换为系统字体时，通过独立的 `dsh-theme-animal-island-ui:appearance` Token 层将 `--dsw-font-family` 指向系统字体栈，卸载时随层移除。
- **选择器禁令与两个结构例外**：严禁使用构建哈希类名、`data-slot`、固定祖先深度或 `nth-child` / `first-child` / `last-child`。仅有的两处结构选择器为：
  1. `html[data-windows-titlebar] #root > div > div`：用于在 Windows 桌面端将唯一的 `AppFrame` 容器背景清为透明；
  2. `[data-dsh-boot]:has([data-dsh-boot-spinner])`：用于在启动等待页定位纸卡与标题，当 spinner 在报错页移除时整组规则自动失效。

## 插件自有布局与第三方市场兼容性

DSH 生态中的插件设置页常带有自定义网格与行内布局（例如 `dsh-opencode-go` 的 `modelLayout` 两列网格）。皮肤**不改写任何插件的自有布局**——已自带样式的组件仅通过 `--dsw-*` Token 继承颜色与字体，不干预其宽高、边距或弹性排列。

会命中第三方插件界面的通用材质仅有三处：

| 通用材质层 | 作用范围 | 边界约束 |
| --- | --- | --- |
| `[role="dialog"]` 纸面 | 所有模态对话框（含插件与市场弹窗） | 仅加纸纹、内缩纸边与虚线缝线，不改宽高、内边距与内部布局 |
| 输入框 `3px` 底边 | 组合式输入外壳与原生 `input` | 仅加描边与底边阴影，不改高度与内边距 |
| 文字按钮胶囊与立体底边 | 带文字的通用按钮 | 排除含 `svg` / `img` / `video` / `canvas` 及开关/复选框角色的控件 |

**第三方界面验收口径**：布局不变、文字可读、输入框高度不变、焦点环不被裁切。若仅某一个第三方插件显示异常而其余正常，归为该插件的独立样式冲突，不在主题中硬编码针对性选择器。

## 禁止依赖清单

以下依赖由 `test/bundle.test.mjs` 与 `test/skin.test.mjs` 自动拦截：

- DSH 构建期 CSS Module 哈希类名（如 `wtg9ga_*`）
- DSH 私有模块路径（`@deepseek-ai/*/lib/*`）
- React 内部实例（Fiber / Container / `ReactDOM`）
- `window.__DSH_BOOT__`
- `nth-child` 或固定 DOM 层级深度假设
- `document.querySelector`、`closest`、`MutationObserver`、`ResizeObserver`
- 合成 DOM 事件（`click`、`focus`、`scrollIntoView`）

## 工程与生命周期约束

- **声明与注入区分**：`package.json` 的 `dsh.client.inject` 填写**包名**（如 `@deepseek-ai/dsh-client-ui-theme`）以声明加载顺序；客户端代码内的 `inject` 填写 **Cordis 服务名**（`['theme', 'slots']`），写错会导致插件永久停留在 `pending`。
- **对称清理**：`ctx.theme.overrideTokens()` 返回的 disposer、`<style data-plugin>` 节点与 `<html>` 根属性全部交由 `ctx.effect()` 托管，确保多次 HMR 重载或启停后无残留。
- **构建产物格式**：`lib/client.js` 遵循 DSH Module Loader 协议（`globalThis.__ModuleLoader__.load({ id, factory })`），Nunito WOFF2 与 SVG 资源在构建期内联。

## 离屏验收夹具（Offscreen Fixtures）

为防止样式规则误伤非目标区域，项目使用 `scripts/fixture.mjs` 从本机安装的 DSH 中提取**真实 CSS**，配合 `test/fixtures/<名称>/` 下的真实 DOM 结构在 Headless Chrome 中渲染，先运行浏览器内 `getComputedStyle` 断言，再输出截图至 `artifacts/smoke/`。

```sh
pnpm run fixture sidebar-masthead            # 自动探测本机 ~/.dsh/app 或桌面端 app.asar
pnpm run fixture boot-loading --desktop      # 显式解包并使用桌面端 app.asar 运行时
pnpm run check:visual                        # 运行侧栏船票的真实 DOM 视觉门禁
```

- **运行时缓存**：桌面端 `app.asar` 按文件大小与修改时间解包缓存在 `.tmp/dsh-runtime/`，后续运行直接复用；非默认安装路径可通过 `--asar <路径>` 或 `--dsh <目录>` 指定。
- **内嵌字体渲染**：夹具会一并加载主题内嵌的 Nunito 字体，确保行高、字宽与 CJK 字形边界的测量结果与真实客户端一致。
- **验收优先级**：先过 `fixture.json` 中的 `getComputedStyle` 几何与颜色断言，再核对 `artifacts/smoke/` 下的渲染截图。

## 目标 DSH 兼容性检查

针对仓库锁定的开发基线运行检查：

```sh
pnpm run check:compat
```

针对本机指定的其它 DSH 版本包运行检查：

```sh
node scripts/check-compat.mjs --dsh-package "C:\path\to\@deepseek-ai\dsh-client-ui-theme"
```

## 降级矩阵

| 异常场景 | 降级行为 |
| --- | --- |
| `ThemeRuntime` 缺失、抛错或未返回 disposer | 整个主题跳过安装（no-op），保持 DSH 原生外观 |
| `SlotRegistry` 缺失 | `ThemeRuntime` Token 与自有 CSS 正常生效，仅跳过品牌插槽 |
| 品牌 / Hero Slot 名称变更或移除 | 保留 DSH 官方默认品牌区，其余皮肤样式正常生效 |
| 局部 `data-*` 钩子移除 | 仅对应局部装饰（如标题木牌或底边渐隐）不匹配，不影响功能与布局 |
| 内嵌字体加载失败 | 自动回退至系统默认字体栈与 CJK 字体 |
| SVG / CSS 资源异常 | 跳过自定义样式表注入，仅保留基础 Token 配色 |
