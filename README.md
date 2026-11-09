# DSH 动森主题 · Animal Island UI

[English](README.en.md) · [宣传页与实机演示](https://shirolin.github.io/dsh-theme-animal-island-ui/) · 作者：[Shirolin](https://github.com/Shirolin)

[![check](https://github.com/Shirolin/dsh-theme-animal-island-ui/actions/workflows/check.yml/badge.svg?branch=main)](https://github.com/Shirolin/dsh-theme-animal-island-ui/actions/workflows/check.yml)
[![npm](https://img.shields.io/npm/v/dsh-theme-animal-island-ui)](https://www.npmjs.com/package/dsh-theme-animal-island-ui)
[![release](https://img.shields.io/github/v/release/Shirolin/dsh-theme-animal-island-ui?display_name=tag)](https://github.com/Shirolin/dsh-theme-animal-island-ui/releases)
[![license: MIT](https://img.shields.io/badge/license-MIT-f3c969.svg)](LICENSE)

`Animal Island UI` 是 DeepSeek Harness（Web 与 Windows 桌面端）的主题插件，视觉参考自开源组件库 [animal-island-ui](https://github.com/guokaigdg/animal-island-ui)。

编码工作台需要长时间盯屏读代码、看 diff，直接照搬高饱和度的游戏配色很容易视觉疲劳。因此这套主题把重心放在了「纸面」与「边界」上：对话区与代码区采用低对比的奶油手账纸和暖棕木色，让阅读面安静下来；而在侧栏船票、标题木牌、输入框气泡这些外围界面上，保留一点手账与海岛的小巧思。所有改动都停留在样式与公开插槽层，不改动 DSH 原有的布局、快捷键和交互习惯。

> [!NOTE]
> 本项目为开源社区插件，与 DeepSeek 官方及 Nintendo（任天堂）无任何隶属、授权或背书关系。主题仅消费 DSH 公开的 ThemeRuntime Token 与 Slot 接缝，不包含任何受版权保护的游戏专有资产；DSH 升级后若接缝变更可自动回退到原生界面。

---

## 界面预览

![DSH 动森主题 · by Shirolin](docs/screenshots/theme-poster.webp)

<details>
<summary>展开查看：日间 / 夜间工作台与侧栏实拍（基于真实 DSH DOM 夹具渲染）</summary>

| 日间模式 (Light) | 夜间模式 (Dark) |
| --- | --- |
| ![日间工作台](docs/screenshots/workspace-light.webp) | ![夜间工作台](docs/screenshots/workspace-dark.webp) |
| ![日间侧栏](docs/screenshots/sidebar-light.webp) | ![夜间侧栏](docs/screenshots/sidebar-dark.webp) |

</details>

---

## 设计与实现机制

- **昼夜两套画布**
  - **日间**：双层波点草坪、底部波浪与低透明度漂浮叶片，主内容区铺设半透明奶油白纸面。
  - **夜间**：独立调校的深色方案。深青色夜空与星点画布，配冷色侧栏与暖棕内容纸面，代码块采用深棕底色。
- **手账部件与交互细节**
  - **渡岛船票品牌区**：将侧栏顶部 `24px` 的新会话入口扩展为 `216×60` 的船票样式（奶油纸面、薄荷票根与打孔撕口）。
  - **木牌与对话气泡**：顶部路径采用木质绶带，侧栏选中项改为竖向木纹牌，底部输入框加了对话气泡尾标与纸纹。
  - **焦点与按压反馈**：主按钮带实体底边与按压位移；键盘焦点环改为 `2px` 内嵌薄荷环，避免在 DSH 的滚动容器边缘被裁切。
- **应用内外观设置**
  - 在「**设置 → 插件 → 动森外观**」中提供「纸白 / 均衡 / 海岛」三档预设与 `0.15–0.60` 画布浓度滑杆，带实时分层预览。
  - 可单独开关**插画装饰**、**纸纹颗粒**、**浅色 Diff 语法配色**（暖色 / DSH 原生）与**界面字体**（Nunito 拉丁字体 / 系统默认字体）。偏好保存在当前客户端的 `localStorage` 中。
- **实现边界**
  - 覆盖 118 项 `ThemeRuntime` Token 与 4 个公开 Slot，不使用 DOM 轮询、`MutationObserver` 或构建期随机哈希类名。
  - 字体（Nunito WOFF2）与原创 SVG 插画在构建期直接内嵌进 bundle，运行时不发起外部网络请求。

---

## 安装

建议同一 profile 下只启用一个主题插件。

### 方式一：插件市场安装

在 DSH 内打开「**设置 → 插件**」，搜索 **`Animal Island UI`** 或 **`动森`** 安装，重启应用生效。

### 方式二：通过 NPM 安装到 Profile

进入你的 DSH profile 目录直接安装：

```sh
cd <DSH_Profile_目录>
pnpm add dsh-theme-animal-island-ui
```

安装后**完整重启 DSH 服务并刷新页面**。

### 方式三：离线 `.tgz` 安装包

从 [GitHub Releases](https://github.com/Shirolin/dsh-theme-animal-island-ui/releases) 下载对应版本的 `.tgz` 与 `SHA256SUMS`：

```sh
cd <DSH_Profile_目录>
pnpm add file:<下载目录>/dsh-theme-animal-island-ui-<version>.tgz
```

### Windows 桌面端（Electron）

DSH 桌面客户端使用独立的 `desktop` profile，并依赖客户端内置的 Electron Node 运行时执行安装。详细步骤、热更新与回滚方式见 [桌面客户端指南 (docs/desktop.md)](docs/desktop.md)。

如果已克隆本仓库，可用脚本一键打包并同步到本机的 `web` 与 `desktop` 两个 profile：

```sh
pnpm install
pnpm run install:local
```

---

## 开发与验证

环境要求：**Node.js ≥ 22.13**，**pnpm 11.1.2**。

```sh
pnpm install
pnpm run build          # 构建客户端 bundle 与类型声明（输出至 lib/）
pnpm run check          # 完整门禁：站点检查 + 类型 + 构建 + 单元/契约测试 + DSH 兼容性核对
pnpm run format         # Biome 格式化
pnpm run lint           # Biome 静态检查
```

**离屏夹具与视觉验证**（抽取本机 DSH 真实 CSS 渲染 DOM 并执行浏览器内断言，截图输出至 `artifacts/smoke/`）：

```sh
pnpm run fixture sidebar-masthead            # 渲染指定夹具（自动探测本机 Web 或桌面端 DSH 运行时）
pnpm run fixture boot-loading --desktop      # 显式使用桌面端 app.asar 运行时渲染
pnpm run check:visual                        # 运行侧栏船票的 DOM 几何与样式门禁
pnpm run check:fixtures                      # 全套夹具；加 -- --expect-dsh <版本> 可钉死运行时版本
```

**子路径导出**（供外部脚本或工具直接复用色板与对比度计算）：

```ts
import { ANIMAL_ISLAND_PALETTES } from 'dsh-theme-animal-island-ui/palette'
import { buildTokenOverrides, contrastRatio } from 'dsh-theme-animal-island-ui/tokens'
```

---

## 文档导航

仓库内维护了完整的设计约束、接缝契约与排障记录：

- [设计语言与样式边界 (docs/design.md)](docs/design.md)：色板表、明暗派生关系、组件造型与越界案例归档
- [DSH 兼容性契约 (docs/compatibility.md)](docs/compatibility.md)：公开 Slot、`data-*` / ARIA 接缝清单与离屏夹具用法
- [桌面客户端指南 (docs/desktop.md)](docs/desktop.md)：Electron profile 隔离机制、安装回滚、CDP / DWM 截图方案
- [Web 与桌面端差异清单 (docs/web-vs-desktop.md)](docs/web-vs-desktop.md)：跨平台标题栏、折叠侧栏与历史适配问题对照
- [侧栏会话列表空白排查 (docs/session-list-blank.md)](docs/session-list-blank.md)：一次 DSH 侧持久化快照引发槽位崩溃的诊断记录
- [社区主题设置项调研 (docs/research/theme-settings-survey.md)](docs/research/theme-settings-survey.md)：12 款社区主题的配置面梳理与本项目的取舍依据
- [版本变更日志 (CHANGELOG.md)](CHANGELOG.md)：各版本演进与修复记录

---

## 贡献与问题反馈

- 参与开发前请先阅读 [贡献指南 (CONTRIBUTING.md)](CONTRIBUTING.md)，了解样式禁区、接缝契约登记与发版流程。
- 社区交流请遵守 [行为准则 (CODE_OF_CONDUCT.md)](CODE_OF_CONDUCT.md)。
- 发现安全问题请按 [安全策略 (SECURITY.md)](SECURITY.md) 通过私有渠道联系，勿在公开 Issue 中披露。

---

## 许可证与致谢

本项目采用 [MIT License](LICENSE) 许可发布。

- **视觉启发**：感谢 [@guokaigdg](https://github.com/guokaigdg) 开源的 [animal-island-ui](https://github.com/guokaigdg/animal-island-ui)（MIT），本主题的色彩关系与手账组件造型受其启发。
- **字体许可**：内嵌的 Nunito 字体遵循 [SIL Open Font License 1.1](licenses/Nunito-OFL.txt)。
- **资产声明**：本项目所有代码、SVG 矢量图形与音效均基于 DSH 公开扩展接口独立编写，未复制上游代码或第三方专有资产，详见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

---

## 支持与相关项目

如果这个主题让你的日常编码环境顺眼了一些，欢迎点亮一颗 **Star**，或通过以下方式支持维护：

- **爱发电 (Afdian)**：[https://ifdian.net/a/shirolin](https://ifdian.net/a/shirolin)
- **Ko-fi**：[https://ko-fi.com/shirolin](https://ko-fi.com/shirolin)
- **作者的其他开源项目**：[PostPress（印推）](https://github.com/Shirolin/postpress) —— 将 X（Twitter）推文与长串排版为纸质卡片的浏览器扩展。
