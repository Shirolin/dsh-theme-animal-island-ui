# 社区 DSH 主题的设置项调研（2026-11）

这份记录回答两个问题：其它 DSH 主题一般提供哪些可设置项，以及本主题为什么只取其中三项。
样本来自 npm 与 GitHub 上可安装的 12 个社区主题（含一个主题管理器），调研日期 2026-11-03。

## 结论

设置项的数量几乎由主题类型决定：

| 类型 | 设置项数量 | 典型内容 |
| --- | --- | --- |
| 纯 token 皮肤 | 0–2 | 装即生效，最多一个明暗开关 |
| 调色板 / 主题包 | 3–8 | 预设、明暗、强调色、背景、前景、字体、对比度 |
| 皮肤 / 工作室 | 8–15 | 预设、透明度、玻璃、壁纸、装饰、动效、语言、导入导出 |

抽样里最常见的六组依次是：**预设/主题选择（10/12）→ 明暗模式 → 核心颜色 → 界面与代码字体 → 表面透明度/玻璃 → 恢复默认**。
再往上才是对比度护栏、壁纸参数、动效开关、预设导入导出与诊断信息。

## 样本与设置面

| 主题 | 类型 | 主要设置项 |
| --- | --- | --- |
| [oil-oil/dsh-theme](https://github.com/oil-oil/dsh-theme) | 调色板/编辑器 | 15 套预设；浅/深/系统；accent、background、foreground、surface、sidebar 实时取色；UI 与代码字体、字号分开；浏览器本地持久化 |
| [dsh-theme（30 款主题包）](https://github.com/mux9056-bot/dsh-theme) | 主题包 | 30 套主题色卡；浅/深/自动；恢复默认；`window.dshTheme` API；`localStorage` 保存主题与模式 |
| [BeiZi6/dsh-theme-plugin](https://github.com/BeiZi6/dsh-theme-plugin) | 调色板/工作室 | 5 预设 + custom；light/dark 分别保存 accent/bg/fg、UI/代码字体、半透明侧栏、对比度 0–100；`cordis.patch.yml` 可预置 |
| [dsh-theme-studio](https://github.com/hj01857655/dsh-plugins/tree/main/packages/dsh-theme-studio) | 调色板 | 14 预设、明暗各选一套；自定义 accent + 暗色 accent + 对比度护栏；密度 6 档（走宿主 `setFontSize`）；字体族 3 选；动画开关；自定义 token CSS；JSON 导入导出 |
| [dsh-theme-palette](https://github.com/zuoyunlai/dsh-theme-palette) | 调色板 | 4 预设 + 自定义三色；强度 3 档；面板层次 3 档；Markdown/滚动条/开关配色；高对比；分享码导入导出；4 语言 |
| [dsh-theme-tuner](https://github.com/shawnlone/dsh-theme-tuner) | 轻量调色板 | accent/bg/fg/对比度/渐变度；复用宿主明暗切换；明暗分开保存；恢复当前主题默认 |
| [dsh-theme-whalegirl](https://github.com/ZHOUcourier/dsh-theme-whalegirl) | 皮肤 | 3 预设；主框模糊、表面透明度、对话纸面、气泡透明度；壁纸遮罩/显示/焦点/缩放/模糊；聚焦光晕；语言；恢复默认；宿主适配自检 3/3 |
| [@eternalnight/dsh-theme](https://github.com/EternalNight996/dsh-theme) | 皮肤/壁纸 | 内置主题/图片/视频三形态；视频“跟随鼠标/循环”；主题面板透明、对话栏透明、背景压暗；导入图片视频持久化 |
| [dsh-theme-customizer](https://github.com/lxxz1918/dsh-theme-customizer) | 皮肤/编辑器 | 7 个区域背景（纯色/图片/裁剪/透明度）；5 类文字色；5 区边框色；logo 调色；对话区细节；输入区高度与统计条；浮动面板；`.tczp` 预设导入导出 |
| [dsh-theme-mineradio](https://github.com/dhicoc/dsh-theme-mineradio) | 皮肤 | Mica/兼容模式；玻璃模糊与霜度；流体/壁纸背景（模糊、霜度）；背景明度；粒子/星点/网格开关；聚光晕 |
| [dsh-theme-center](https://github.com/dac114514/dsh-theme-center) | 画廊 | 11 主题；壁纸裁剪/缩放/遮罩/表面透明；`dsh-theme` 文件导入导出 |
| [dsh-theme-picker](https://github.com/yhPrime/dsh-theme-picker) | 管理器 | 原生主题切换；已装主题插件启停/卸载；单主题互斥；软开关 |
| `dsh-theme-ember-dusk`（本仓库同级） | 纯 token | 零设置，装即生效 |

## 十类设置项

1. **预设 / 主题选择**：几乎每个主题的第一屏。要么是 N 套策展配色，要么是 3–4 档风格预设（whalegirl 的清爽玻璃 / 原味 / 纯净实底）。
2. **明暗模式**：多数不重复造，直接复用「设置 → 通用 → 外观」；只有多主题包自带三态。whalegirl 反向锁定为仅浅色。
3. **核心颜色**：`accent / background / foreground` 是标准三件套，扩展项是 surface、sidebar、bubble、border。惯例是 **light 与 dark 成对、分开保存**。
4. **字体**：UI 字体与代码字体分开，通常给下拉栈而不是自由输入。
5. **字号 / 密度**：必须走宿主 `ctx.theme.setFontSize()`；用 token 覆盖 `--dsh-content-font-size` 会让官方 stepper 显示一个界面并未渲染的数字。
6. **表面与透明度**：全局表面、对话纸面、气泡、面板、背景压暗、模糊/霜度。皮肤型主题的核心。
7. **壁纸 / 背景**：图片、视频、纯色三形态，配套裁剪、焦点、缩放、模糊、遮罩、显示开关。
8. **对比度与可读性**：对比度滑杆、强度档、高对比模式、自定义 accent 低于亮度阈值时自动提亮并提示。
9. **动效 / 装饰**：动画总开关（用 `0.001ms` 而非 `0s`，避免 `transitionend` 不触发）、粒子/光晕/网格开关、开屏动画。
10. **预设管理与兜底**：保存/命名/导入导出/分享码、恢复默认、语言切换、宿主适配自检。

## 面板落位与持久化

| 落位 | 代表 | 代价 |
| --- | --- | --- |
| 通用 → 外观正下方（`settings.general.item`） | tuner 10.5、mux 20 | 最好找，但多个主题插件会抢同一区域 |
| 设置顶层分区（`settings.section`） | customizer、center、palette、studio 47 | 空间大、适合工作室；入口更深 |
| 插件 tab（`settings.plugins.tab`） | 本主题（order 40） | 与插件管理同处，符合“皮肤即插件”的心智 |
| 已安装插件配置页（`plugins.bundle.config`） | whalegirl | 与插件生命周期绑定 |
| 侧边栏按钮 / 浮窗 | EternalNight、customizer | 高频切换，但侵入主界面 |

持久化分两派：`localStorage`（whalegirl、studio、mux、本主题）适合每台设备各自记忆的视觉偏好；
Host settings namespace / configForms（tuner、endfield）更耐久，但要处理 schema、volatile 字段与版本兼容。

## 本主题的取舍

采用（0.3.35）：

- **插画装饰**：对应「皮肤型」里最常见的装饰开关，也是本主题画布层唯一没有暴露的维度；
- **纸纹**：与 composer/dialog 的纸张语言直接相关，成本低、辨识度高；
- **界面字体**：抽样中约 1/4 的主题提供字体，且都强调“只换 UI、不碰字号”；本主题只做 UI 字体二选一。

延后：

- **外观预设导入导出 / 分享码**：当前只有 6 个轴，收益低于维护成本；等设置面变大再做；
- **宿主适配自检**：属于兼容性工程，单独排期；
- **分层透明度**（侧栏/对话/卡片分开）：与现有 veil 重叠，容易把面板做成仪表盘。

不做：

- 任意 accent 取色器 / 对比度滑杆：会破坏薄荷 + 纸面的身份与已校准对比度；
- 圆角、密度、代码字体：DSH 没有全局 radius token；字号归宿主管理；代码字体是主题身份的一部分；
- 壁纸 / 视频 / 磨砂玻璃：与固定身份皮肤冲突，是另一类产品；
- 搬到「设置 → 通用」：现有插件 tab 的入口已经稳定，移动会打断用户路径，收益不足以抵消。

## 工程约束（来自样本的踩坑）

- `overrideTokens` 的值必须 `{ light, dark }` 成对；层按注册顺序叠加，后写者胜，disposer 要能完整还原；
- 字号必须走 `setFontSize`，不要用 token 影子覆盖；
- 禁用动画用 `0.001ms`，不要用 `0s`；
- 不要假设存在全局 radius token；
- 透明度偏好按客户端保存即可，跨设备同步需求低；
- 主题管理器（picker/center/manager）证明“选择层”可以独立于“皮肤层”，但皮肤本身不需要为此改造。

## 来源

- [oil-oil/dsh-theme](https://github.com/oil-oil/dsh-theme)
- [mux9056-bot/dsh-theme](https://github.com/mux9056-bot/dsh-theme)
- [BeiZi6/dsh-theme-plugin](https://github.com/BeiZi6/dsh-theme-plugin)
- [dsh-theme-studio](https://github.com/hj01857655/dsh-plugins/tree/main/packages/dsh-theme-studio)
- [dsh-theme-palette](https://github.com/zuoyunlai/dsh-theme-palette)
- [dsh-theme-tuner](https://github.com/shawnlone/dsh-theme-tuner)
- [dsh-theme-whalegirl](https://github.com/ZHOUcourier/dsh-theme-whalegirl)
- [EternalNight996/dsh-theme](https://github.com/EternalNight996/dsh-theme)
- [dsh-theme-customizer](https://github.com/lxxz1918/dsh-theme-customizer)
- [dsh-theme-mineradio](https://github.com/dhicoc/dsh-theme-mineradio)
- [dsh-theme-center](https://github.com/dac114514/dsh-theme-center)
- [dsh-theme-picker](https://github.com/yhPrime/dsh-theme-picker)
- DSH 内置主题设置：[packages/client/ui-theme](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-theme/README.md)
