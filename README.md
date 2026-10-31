# DSH Animal Island UI Theme

`Animal Island UI`（一动森）是一个面向 DeepSeek Harness Web GUI 的高还原社区 skin plugin：在 ThemeRuntime 色彩层之上叠加插件自有 CSS、原创资源与 DSH 公开 Slot，目标是接近 [animal-island-ui](https://guokaigdg.github.io/animal-island-ui/#/skill) 的岛屿游戏界面，同时保持 DSH 会话、设置、工作区和 composer 的原生行为。

当前发布 **0.3.18**。开发中的侧栏品牌已换成 **216×60 的渡岛船票**（奶油纸面 + 薄荷票根 + 虚线撕口）；其余已发布内容包含气泡 composer、纸纹/木牌、夜岛星空、微交互与木牌选中态，「设置 → 插件 → 动森外观」的透明度调节（含与真实画布同层数的预览），以及 Windows 桌面端外壳透明化与圆角归零。Windows 只保留一个 parity 分支。

![Animal Island DSH skin preview](docs/palette-preview.svg)

## 视觉范围

- 绿色双层波点画布 + 底部草/水波纹 + 漂浮叶子；
- 奶油白侧栏、蓝紫底部波浪、原创叶片标与渡岛船票品牌区；
- 木质标题绶带、暖棕文字和木牌 active；
- 白色/奶油色卡片、对话气泡 composer、纸纹 dialog、pill 输入与文字按钮；
- 奶油色 3D 主按钮和 hover/active 按压反馈；
- 输入时气泡发光、发送键按压涟漪、叶片 hover 轻摆；
- Light / Dark 均可读的深棕色代码块与 Shiki 配色；深色画布为「夜岛」星空；
- 设置 → 插件 → 动森外观：纸白 / 均衡 / 海岛三档预设 + 0.15–0.60 滑杆，默认均衡 0.40，面板内附实时「画布预览」；
- 内嵌 Nunito Latin 字体，中文回退 Noto Sans SC / 苹方 / 微软雅黑。

设计图是方向性 specimen；真实 DSH 截图是最终验收依据。

## 文档

| 文件 | 内容 |
| --- | --- |
| [CHANGELOG.md](CHANGELOG.md) | 各版本对用户可见的变化 |
| [docs/design.md](docs/design.md) | 色板、形状与反馈、暗色派生、**样式边界**（不得越界的地方） |
| [docs/compatibility.md](docs/compatibility.md) | DSH 接缝、已审阅属性/变量、工程约束、离屏验收夹具 |
| [docs/session-list-blank.md](docs/session-list-blank.md) | 侧栏会话区空白一次误判的排查记录（结论：DSH 侧） |
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

主题仍叠加在 DSH Light / Dark / System 之上；唯一的持久化外观设置是「画布透明度」，保存在本机 `localStorage`（不同 web/desktop 客户端各自记忆）。

## 开发

```sh
pnpm install
pnpm run typecheck
pnpm run build
pnpm test
pnpm run check:compat
```

统一门禁：

```sh
pnpm run check
```

构建使用 esbuild 生成适配 DSH `factory(require)` 的客户端 bundle，React 由 DSH 平台模块表提供，Nunito WOFF2 与原创 SVG 在构建时内嵌。

改动皮肤规则时的验收方式见 [docs/compatibility.md](docs/compatibility.md) 的「离屏验收夹具」：用真实 DSH/插件 CSS 渲染最小夹具，先看 computed style 探针、再看截图。

```sh
pnpm run fixture document-preview-plain    # 渲染 test/fixtures/<名称>，产物在 artifacts/smoke/
pnpm run fixture document-preview-plain --dsh "C:\path\to\.dsh\app"
pnpm run fixture boot-loading --desktop    # 自动准备桌面 runtime
```

夹具定义在 `test/fixtures/`，runner 是 `scripts/fixture.mjs`（默认读 `~/.dsh/app`，可用 `DSH_APP`
覆盖）。桌面夹具可用 `--desktop` 自动准备 runtime，或用 `--asar` 指定 `app.asar`；`fixture.json`
的 `assertions` 在 headless Chrome 中执行，失败时命令非零退出。

## 贡献

- 改动前请读 [CONTRIBUTING.md](CONTRIBUTING.md)：边界约束、验证方式、提交与发布流程；
- 参与即适用 [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)；
- 安全问题请走 [SECURITY.md](SECURITY.md) 的私有渠道，不要开公开 issue。

## 安装到 DSH profile

```sh
pnpm install
pnpm run release 0.3.6     # 打包 + 回写 SHA；版本号必须是新的
```

`prepack` 会自动重建 `lib`。当前规范产物为：

```text
artifacts/release-v0.3.18/dsh-theme-animal-island-ui-0.3.18.tgz
SHA-256: 2C375E601CB7F411418E809DC7307756672959B2D9591BDEB917B9C687E1A965
```

把 `.tgz` 装进目标 `web` profile 并让 profile 的依赖指向它（否则下一次 `pnpm install` 会退回旧版）：

```sh
cd <profile 目录>
pnpm add file:<仓库>/artifacts/release-v0.3.18/dsh-theme-animal-island-ui-0.3.18.tgz
```

之后完整重启 DSH Web 并刷新页面。当前 profile 应只启用一个主题层；Ember Dusk 可保留安装但禁用，用于回滚。

桌面客户端（Electron）用的是独立的 `desktop` profile，插件不会跨 profile 生效，安装方式也不同 —— 见 [docs/desktop.md](docs/desktop.md)。

发布脚本会改版本号、出包、把新 SHA-256 同时写进本文件与 `artifacts/README.md`（测试 `docs.test.mjs` 会校验两处一致）；**已分发过的版本请改版本号，不要原地重打**。

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






