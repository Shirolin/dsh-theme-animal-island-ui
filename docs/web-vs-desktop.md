# Web 与 Windows 桌面端的样式差异清单

> 目的：把「web 正常、desktop 不对」拆成**平台分支**、**版本差异**、**主题自身问题**三类，避免再靠截图逐个猜。
>
> 基线：桌面客户端 `0.2.1-rc.5`（`app.asar` 内置 runtime），浏览器 web 端可能来自不同构建；两者共用同一套 web app 与 client plugin 契约（见 [compatibility.md](compatibility.md)）。

## 先判定，再改样式

1. 看 `html` 标记：`data-windows-titlebar` = Windows Electron；`data-platform=darwin` = macOS；两者都没有 = 普通浏览器。主题的桌面分支现在只依赖 `data-windows-titlebar`。
2. web 与 desktop 的 DSH 版本可能不同，且 web 标签页可能还挂着旧 bundle。比较前先硬刷新 web，并确认两边的 `data-platform` / runtime 版本。
3. 只有 `[data-windows-titlebar]` 下才成立的差异，不要用 web 截图反推；只有 web 才有的差异，也不要写成全局规则。

## 统一策略

主题只保留**一个**平台分支：`html[data-windows-titlebar]` 下的 parity block（清 frame 背景 + 把外壳自带的 16px 内容圆角压成 0）。除此之外，所有颜色、圆角、间距、字体和组件规则都走同一套共享 CSS，web 与 desktop 不各写一份。

能统一的部分尽量统一；不能统一的只有 DSH/Electron 自己拥有的 chrome：

- **可统一**：整窗外壳 surface、主内容面、内容列左上角圆角、侧栏品牌盒预算、所有插件自有组件；
- **不可直接覆盖**：native `titleBarOverlay` 本体；它的颜色只能通过 `windowsAppearance` 读取的 sidebar-fill 间接上报。Windows 折叠侧栏的 rail 行为、DSH 的 40px caption 高度、dock/rightbar 的几何计算同样属于 DSH/Electron。

这才是「方便调试」的边界：调试主题时只需要看共享 CSS；只有怀疑 chrome 时才看桌面分支。

## Windows 桌面端差异

| 面 | DSH 的 Windows 行为（0.2.1-rc.5） | 主题状态 | 备注 |
| --- | --- | --- | --- |
| 整窗外壳 AppFrame | `[data-windows-titlebar] .frame` 用**不透明**的 `--dsw-specific-sidebar-fill` 铺满整窗；macOS 给同一个 frame 的是 `background: 0 0`，浏览器没有这层 | **已修（0.3.10）**：`html[data-windows-titlebar] #root > div > div { background: transparent !important }` | 官方讨论 [#9490](https://github.com/deepseek-ai/deepseek-harness/discussions/9490)；回归测试见 [skin.test.mjs](../test/skin.test.mjs) |
| 标题栏条（40px） | 由 Desktop 主进程的 **native `titleBarOverlay`** 绘制（`height:40`，颜色由 renderer 的 `windowsAppearance` IPC 读取 sidebar-fill 后更新），不是 frame 的 CSS 背景 | **亮暗都保持三层**：亮色把上报色设为薄荷 `#e7efe5`，再在 `#root` 内恢复奶油 sidebar token；暗色把上报色设为 `#1f3034`，侧栏用 `div:has(> nav[aria-label])` 恢复 `#303444`。侧栏根节点同时恢复本地 sidebar-fill，供会话列表渐隐层使用；不改侧栏几何 | 亮色标题栏/窗口按钮区实测约 `(231,239,229)`，侧栏约 `(247,246,240)`，主内容约 `(193,224,201)`；暗色 caption `#1f3034` / 侧栏 `#303444` / 画布夜棕色。原生 overlay 本体仍不能直接写 CSS |
| 侧栏 logoRow / 品牌 | `logoRow` 高 40px；`brandIdentity` 下移 1px；`brandMark` 右移 1px；`brandName` 字重 400；未折叠时 `brand` 左内边距 4px | **已覆盖**：logoRow 长到 80px，品牌是 216×60 的渡岛船票；主题清零 Windows 的 4px 左内边距，让票根贴住纸面；夹具见 [desktop.md](desktop.md) | 若 DSH 再次改品牌盒高度或 padding，先跑 `sidebar-masthead` 夹具，不要凭截图调数值 |
| 折叠侧栏 | Windows 直接去掉 56px rail：`logoRow` 高 0、`panelList/regionArea/footArea` 隐藏、`toggle` 与 `newSession` 固定在标题栏左侧 12px/48px | 主题没有依赖 rail 的规则，品牌 slot 由 DSH 隐藏 | 折叠态的 28px 固定按钮只继承主题的字体过渡/focus 环，不会被 3D 按钮规则命中 |
| 标题绶带文字 | 0.2.x 的当前 crumb 是 `<span class="crumbCurrent">`，自己声明 `color: var(--dsw-alias-label-primary)`；主题的 nav 继承色赢不过它 | **已修（0.3.13）**：`nav :where(span)` 显式奶油色，深色给米色 | 这是版本差异在 Windows 上先暴露；web 旧版 crumb 没有显式 color |
| 内容列左上角 | `--dsh-windows-content-radius: 16px`，只有内容列左上角是圆角，其余列与分隔线保持直角 | **已统一（0.3.16）**：在 **frame 元素**上设 `--dsh-windows-content-radius: 0px`，去掉外壳自带圆角，与 web 的直角一致 | 变量必须写在 frame 上：DSH 的 `[data-windows-titlebar] .frame` 自己声明了 `16px`，写在 `<html>` 上会被覆盖（0.3.12–0.3.15 就是这样失效的） |
| 右侧面板全屏 | `max-width: calc(100vw - var(--dsh-windows-sidebar-width))`，dock pane 左上角用同一 16px 圆角 | 圆角已由上面的 0px 统一；`max-width` 是 DSH 几何 | 打开全屏右栏时需再验一次，当前低风险 |
| Dock 浮动面板 | `--dsh-dockkit-float-top` 在 Windows 上要加 caption 高度 | 主题的菜单/弹层不是 dockkit float | 不需要处理 |
| 窗口按钮区 | 原生 caption 按钮在标题栏右侧，叠在 `titleBarOverlay` 上 | **背景已间接统一**：亮色 `#e7efe5`、暗色 `#1f3034`；hover/close 状态仍由 Windows 绘制 | 不要试图用 CSS 盖/改这一层；只通过 sidebar-fill 上报色影响背景 |

## macOS 差异（仅登记，不在 Windows 范围）

- macOS 的 `frame` 和 `body` 都是透明的（`background: 0 0` / `transparent`），所以画布 veil 在 macOS 上本来就能透出来；Windows 是唯一的例外。
- 折叠侧栏在 macOS 上完全隐藏列；frame 还会挂 `shell.leading` 座位（红绿灯旁），并发布 `--dsh-frame-leading-clearance`。
- 普通侧栏有 window vibrancy；抽屉/全屏右栏有额外的 `-webkit-app-region` 与 strip 偏移。
- 本主题目前**没有** darwin 专属规则。如果以后支持 macOS，品牌/hero 需要按 `--dsh-frame-leading-clearance` 让位，不能直接套 Windows 的 40px caption 逻辑。

## 历史问题归类

| 历史问题 | 是否 web/desktop 差异 | 结论 |
| --- | --- | --- |
| 0.3.5 侧栏品牌字标顶部被削 | **desktop 先暴露**（Windows logoRow/transform 更紧），但根因是 14px CJK 字形盒 vs 24px 裁剪盒 | 0.3.18 把 logoRow 长到 80px、品牌做成 216×52 门牌，并释放 24px 内盒；平台仍只是暴露面 |
| 0.3.10 画布透明度 desktop 调不动 | **是，desktop-only** | Windows frame 不透明，已修 |
| 0.3.13 桌面标题绶带只剩木板、字看不见 | **是，desktop/版本差异**：0.2.x 的 `.crumbCurrent` 自己写 `color: var(--dsw-alias-label-primary)`（深棕），压在棕色木板上 | 主题现在对 `nav :where(span)` 显式给奶油色（深色给米色），不再只依赖 nav 继承，已修 |
| 插件市场搜索框双框、命令面板行高、面包屑胶囊、图片缩略图、设置头部预留高度、文档预览纯文本、代码块 banner | 否 | 两边同一 DOM/规则；是主题越界或插件自有布局 |
| 侧栏会话列表整块空白 | 否 | DSH 持久化快照形状问题，见 [session-list-blank.md](session-list-blank.md) |
| 0.3.9「画布预览」看不出变化 | 否 | 设置卡片不透明 + 预览缺失，已加实时预览 |

## 顺手发现的非平台问题

- **预览与真实画布的层数不一致（0.3.11 已修）**：主内容列 `centerCol` 和会话根 `an3WzG_root` 各有一层 `--dsw-alias-bg-base`，实际是两层 veil 叠加（0.15 → `(172,215,186)`）；而 0.3.9 的预览只画了一层（0.15 → `(159,209,176)`），看起来比真实内容更绿。现在预览 sheet 也叠两层，0.15 时预览与实际一致。这个问题 web/desktop 都有，不是平台差异。

## 待定

1. **标题栏条只能间接供色**：native `titleBarOverlay` 的颜色仍由 `windowsAppearance` IPC 上报；当前亮/暗三层通过 sidebar-fill + `#root`/语义侧栏底色实现，不依赖原生 caption CSS。若 DSH 未来提供独立 caption token，应优先迁移到该入口，并移除这组兼容分支。
2. **右侧栏/全屏右栏的底色**：透明 frame 后，右栏未自绘表面的缝隙会直接露画布。要不要给它补一层 veil（需要找一个公开 surface token，不能打 hash class）。
3. **macOS 支持范围**：如果要把 macOS 纳入验收，需要单独立项，而不是在 Windows 规则里顺手补。
