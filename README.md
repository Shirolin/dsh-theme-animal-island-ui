# DSH Animal Island UI Theme

[English](README.en.md)

[产品页](https://shirolin.github.io/dsh-theme-animal-island-ui/) · [30 秒宣传片：从船票撕口登入完整 DSH](https://shirolin.github.io/dsh-theme-animal-island-ui/#film)

[![check](https://github.com/Shirolin/dsh-theme-animal-island-ui/actions/workflows/check.yml/badge.svg?branch=main)](https://github.com/Shirolin/dsh-theme-animal-island-ui/actions/workflows/check.yml)
[![release](https://img.shields.io/github/v/release/Shirolin/dsh-theme-animal-island-ui?display_name=tag)](https://github.com/Shirolin/dsh-theme-animal-island-ui/releases)
[![license: MIT](https://img.shields.io/badge/license-MIT-f3c969.svg)](LICENSE)

`Animal Island UI` 是一套面向 DeepSeek Harness（Web 与 Windows 桌面端）的岛屿风社区主题插件：在 ThemeRuntime 色彩层之上叠加插件自有 CSS、原创画作与 DSH 公开 Slot，还原 [animal-island-ui](https://guokaigdg.github.io/animal-island-ui/#/skill) 的手账纸感与海岛质感，同时完整保留 DSH 会话、设置、工作区、composer 与快捷键的原生行为。

发布包、下载与 `SHA256SUMS` 校验值见 [GitHub Releases](https://github.com/Shirolin/dsh-theme-animal-island-ui/releases)。主题包含 **216×60 渡岛船票**品牌区（奶油纸面 + 薄荷票根 + 虚线撕口）、对话气泡 composer、纸纹面板与木牌选中态、独立配色的夜岛星空、「设置 → 插件 → 动森外观」画布浓度调节（附实时同层数预览）、覆盖全界面控件的 2px 内嵌薄荷焦点环，以及 Windows 桌面端透明标题栏与会话列表渐隐修正。

![Animal Island DSH skin preview](docs/palette-preview.svg)

<details>
<summary>真实 DSH DOM 夹具：亮色 / 暗色侧栏</summary>

| Light | Dark |
| --- | --- |
| ![Light sidebar](docs/screenshots/sidebar-light.png) | ![Dark sidebar](docs/screenshots/sidebar-dark.png) |

</details>

## 视觉与交互

- **海岛画布与夜岛**：日间为绿色双层波点画布、草浪水纹与漂浮叶片；夜间切换为独立配色的星空、月光与萤火，内容区保留暖棕纸面；
- **侧栏与品牌区**：奶油白侧栏、蓝紫底浪、原创叶片标与渡岛船票品牌区；
- **木牌与纸面层级**：木质标题绶带、木牌选中态、奶油白卡片、对话气泡 composer、纸纹弹窗与胶囊输入框；
- **触感与微交互**：奶油色 3D 主按钮按压反馈、输入时气泡呼吸发光、发送键涟漪、叶片悬停轻摆；
- **全界面键盘焦点**：2px 内嵌薄荷焦点环，快捷键搜索框保持单一表面与单圈聚焦描边，滚动与弹窗边界不裁切；
- **代码与排版**：Light / Dark 均经对比度校准的深棕代码块与 Shiki 语法配色；内嵌 Nunito Latin 字体，中文回退至苹方 / 微软雅黑 / Noto Sans SC；
- **应用内外观设置**：「设置 → 插件 → 动森外观」提供纸白 / 均衡 / 海岛三档预设与 `0.15–0.60` 滑杆（默认均衡 `0.40`），面板内实时预览画布层次；同一页还有插画装饰、纸纹与界面字体三组细节开关。

顶部色板图为设计标本；折叠区截图由真实 DSH CSS/DOM 夹具渲染，用于回归验收，实际观感以 DSH 客户端为准。

## 文档

| 文件 | 内容 |
| --- | --- |
| [CHANGELOG.md](CHANGELOG.md) | 各版本对用户可见的变化 |
| [docs/design.md](docs/design.md) | 色板、形状与反馈、暗色派生、**样式边界**（不得越界的地方） |
| [docs/compatibility.md](docs/compatibility.md) | DSH 接缝、已审阅属性/变量、工程约束、离屏验收夹具 |
| [docs/session-list-blank.md](docs/session-list-blank.md) | 侧栏会话区空白一次误判的排查记录（结论：DSH 侧） |
| [docs/research/theme-settings-survey.md](docs/research/theme-settings-survey.md) | 社区 DSH 主题的设置项调研：常见设置面、面板落位与本主题的取舍 |
| [docs/desktop.md](docs/desktop.md) | 桌面客户端（Electron）：profile 隔离、安装/验证/回滚、截图与远程调试（CDP/DWM）、何时要重启、怎么对着桌面 runtime 跑夹具 |
| [docs/web-vs-desktop.md](docs/web-vs-desktop.md) | Web / Windows 桌面端样式差异清单：平台分支、版本差异、历史问题归类与待定项 |
| [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) | 参考项目基线与许可证 |

## 稳定边界

插件只使用：

1. `ctx.theme.overrideTokens()` 管理 Light / Dark / System token；
2. DSH `dsh.client` Module Loader；
3. `ctx.slots` 的公开品牌 / hero Slot，以及 Plugins 设置区的 `settings.plugins.tab` 入口，同时保留 DSH 官方 Sidebar 根组件；
4. 插件自己创建并清理的 `<style>`、根属性和原创资源；
5. 少量有版本测试的语义 `data-*` / ARIA 增强（清单见 [docs/compatibility.md](docs/compatibility.md)）。

不使用 DSH hash class、私有 `lib/*`、React 私有符号、DOM 扫描、MutationObserver、合成点击或焦点劫持，**也不改写插件自带的布局与几何**（只通过 token 影响颜色）。DSH 升级后缺失的能力只会安全降级，不会阻塞 GUI。

## 架构

```text
ThemeRuntime token layer
        +
plugin-owned CSS / fonts / original SVG
        +
official Sidebar + public Brand/Hero slots
```

主题仍叠加在 DSH Light / Dark / System 之上；外观偏好（纸面浓度、diff 配色、插画装饰、纸纹、界面字体）保存在本机 `localStorage`（不同 web/desktop 客户端各自记忆）。

### Host helpers

需要复用色板或 token 派生逻辑时，可以使用包的独立子路径：

```ts
import { ANIMAL_ISLAND_PALETTES } from 'dsh-theme-animal-island-ui/palette'
import { buildTokenOverrides, contrastRatio } from 'dsh-theme-animal-island-ui/tokens'
```

## 开发

需要 Node.js 22.13 或更高版本，以及 pnpm 11.1.2。

```sh
pnpm install
pnpm run format
pnpm run lint
pnpm run typecheck
pnpm run build
pnpm run install:local   # 当前版本 tarball 同步到 desktop + web profile
pnpm test
pnpm run check:compat
```

`format` 与 `lint` 使用 Biome，独立执行；统一门禁仍只包含类型、构建、测试和兼容性检查：

```sh
pnpm run check
```

构建使用 esbuild 生成适配 DSH `factory(require)` 的客户端 bundle，React 由 DSH 平台模块表提供，Nunito WOFF2 与原创 SVG 在构建时内嵌。

改动皮肤规则时的验收方式见 [docs/compatibility.md](docs/compatibility.md) 的「离屏验收夹具」：用真实 DSH/插件 CSS 渲染最小夹具，先看 computed style 探针、再看截图。

```sh
pnpm run fixture document-preview-plain    # 渲染 test/fixtures/<名称>，产物在 artifacts/smoke/
pnpm run fixture document-preview-plain --dsh "C:\path\to\.dsh\app"
pnpm run fixture boot-loading --desktop    # 自动准备桌面 runtime
pnpm run check:visual                      # 侧栏船票真实 DOM 视觉门禁
```

夹具定义在 `test/fixtures/`，runner 是 `scripts/fixture.mjs`（默认读 `~/.dsh/app`，可用 `DSH_APP`
覆盖）。桌面夹具可用 `--desktop` 自动准备 runtime，或用 `--asar` 指定 `app.asar`；`fixture.json`
的 `assertions` 在 headless Chrome 中执行，失败时命令非零退出。

## 贡献

- 改动前请读 [CONTRIBUTING.md](CONTRIBUTING.md)：边界约束、验证方式、提交与发布流程；
- 参与即适用 [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)；
- 安全问题请走 [SECURITY.md](SECURITY.md) 的私有渠道，不要开公开 issue。

## 安装到 DSH profile

1. 从 [Releases](https://github.com/Shirolin/dsh-theme-animal-island-ui/releases) 下载最新 `.tgz` 与 `SHA256SUMS`；
2. 对照 `SHA256SUMS` 校验下载文件；
3. 把 `.tgz` 装进目标 profile，并让 profile 的依赖指向它（否则下一次 `pnpm install` 会退回旧版）。

```sh
cd <profile 目录>
pnpm add file:<下载目录>/dsh-theme-animal-island-ui-<version>.tgz
```

之后完整重启 DSH Web 并刷新页面。当前 profile 应只启用一个主题层；Ember Dusk 可保留安装但禁用，用于回滚。

桌面客户端（Electron）用的是独立的 `desktop` profile，插件不会跨 profile 生效，安装方式也不同 —— 见 [docs/desktop.md](docs/desktop.md)。

## 维护者发布

发布步骤与验证要求见 [CONTRIBUTING.md](CONTRIBUTING.md#发布)。推送 `v<version>` tag 后，GitHub Actions 会重新运行完整门禁、打包、核对版本/CHANGELOG/tarball SHA，并创建 GitHub Release。维护者的本地产物与哈希记录在仓库内 `artifacts/README.md`，不随 tgz 打包；公开下载以 GitHub Release 附件及其 `SHA256SUMS` 为准。**同一版本号不要重复出包。**

## 兼容性

默认检查仓库锁定的 DSH `0.1.5-rc.3`：

```sh
pnpm run check:compat
```

检查其他 DSH 安装时显式指定 ThemeRuntime 包目录：

```sh
node scripts/check-compat.mjs --dsh-package "C:\path\to\@deepseek-ai\dsh-client-ui-theme"
```

也可设置 `DSH_THEME_PACKAGE`。检查覆盖 ThemeRuntime disposer、全部 token、服务/Provider 顺序、公开 Slot 类型、DOM fallback、Observer 和私有导入。详见 [docs/compatibility.md](docs/compatibility.md) 与 [docs/design.md](docs/design.md)。

侧栏「会话列表」整块空白但有品牌和 `新会话` 时，先按 [docs/session-list-blank.md](docs/session-list-blank.md) 的判定点走一遍：那种现象来自 DSH 自身的槽错误边界与持久化快照形状，不属于皮肤的作用面。

## 许可证与来源

- 本插件代码：MIT，见 `LICENSE`。
- Nunito：SIL OFL 1.1，见 `licenses/Nunito-OFL.txt`。
- Animal Island UI：只参考视觉语言；没有复制其代码、组件、Logo、字体、插画或完整 CSS。参考基线与许可证见 `THIRD_PARTY_NOTICES.md`。






