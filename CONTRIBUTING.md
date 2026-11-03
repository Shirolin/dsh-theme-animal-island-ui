# 贡献指南

感谢你愿意改进这个主题。本文件说明本项目的开发方式、不可越界的约束，以及改动如何被验证。

## 环境

- Node.js ≥ 22.13（`package.json` 的 `engines`），包管理用 pnpm 11.1.2；
- 本机装有 DSH（默认 `~/.dsh/app`，也可用 `DSH_APP` 环境变量或 `--dsh` 参数指定）；
- 桌面夹具可自动从官方客户端的 `app.asar` 准备 runtime；
- headless Chrome（用于离屏夹具截图与断言，可选；不装也能跑门禁）。

```sh
pnpm install
pnpm run check          # typecheck + build + 测试 + 兼容性检查
```

单项：

```sh
pnpm run typecheck      # tsc --noEmit
pnpm run format         # Biome：格式化源码、脚本、测试与 JSON/CSS
pnpm run lint           # Biome：静态检查
pnpm run build          # 生成 lib/（含 lib/client.js 与类型声明）
pnpm test               # build + node test/run.mjs
pnpm run check:compat   # 对照锁定的 DSH 版本检查接缝与 token
```

`format` 与 `lint` 是独立命令，不并入默认的 `pnpm run check`。提交前至少运行一次
`pnpm run format` 和 `pnpm run lint`。

## 改动的边界

本项目是叠加在 DSH 上的皮肤，**只在 DSH 的公开面上作画**。完整清单见
[docs/compatibility.md](docs/compatibility.md)（已审阅接缝表 + 禁止依赖）与
[docs/design.md](docs/design.md)（样式边界表，逐条写明越界后的现象）。三条最容易踩的：

1. 不重画 DSH 已经画好的容器内部（代码块的 `pre`、输入框的内层 `input`）—— 会出现两层边框、两套圆角错位；
2. 不改写插件自带布局（设置页的网格、行内 flex、滚动、行高）—— 最多用 token 影响颜色；
3. 不用「事后清零几何」压制自己的规则，改成让规则一开始就不匹配（`:not()` 挂在**主语**上，不要挂在选择器中段）。

新增任何 `data-*` / ARIA 接缝，必须先在 `scripts/seam-contract.mjs` 登记用途、DSH 证据和探测方式；
CSS 策略测试、兼容性检查与文档覆盖测试都从这份契约读取，不要在文档里再维护一份事实副本。

## 验证方式

单元与契约测试覆盖 token 完整性、bundle 形状、skin 规则约束和降级路径。**视觉问题**（本项目的
历史问题几乎都是这一类）用离屏夹具验证：从已安装的 DSH 与插件里抽取**真实 CSS**，配真实 DOM
形状渲染，先看 computed style、再看截图。

```sh
node scripts/fixture.mjs document-preview-plain          # 渲染 test/fixtures/<name>
node scripts/fixture.mjs document-preview-plain --dsh "C:\path\to\.dsh\app"
pnpm run fixture boot-loading --desktop                  # 自动准备桌面 runtime
pnpm run check:visual                                    # 侧栏船票 fixture 的独立视觉门禁
```

- `--desktop` 自动查找官方客户端；装在非默认位置时用 `--asar "C:\path\app.asar"`。runtime
  按 `app.asar` 的 size + mtime 缓存在 `.tmp/dsh-runtime/`，重复运行直接复用；
- 夹具定义在 `test/fixtures/<name>/`：`fixture.json`（真实 CSS、变体与浏览器断言）+
  `body.html`（DOM 片段，可用 `{{TOKENS}}`、`{{SKIN_CSS}}` 等占位符）；
- `assertions` 中每条 `{ message, expression }` 的 `expression` 必须返回 `true`；任一失败时命令
  非零退出；
- 产物写在 `artifacts/smoke/`（被 git 忽略），PR 里贴出前后对照即可；
- 新增夹具时，优先挑**最小可复现**的 DOM，不要整页复制 DSH。

## 提交与 PR

- 提交信息用 `type: subject`（`feat` / `fix` / `docs` / `release` …），正文说明**为什么**改，以及
  这样改为什么不会越界；一次提交只做一件事；
- PR 请附：改动说明、验证命令与结果、涉及视觉的附前后截图；
- 面向用户的可见变化要写进 [CHANGELOG.md](CHANGELOG.md)；
- 破坏既有接缝的改动（重命名 token、改 Slot 契约）请先开 issue 讨论。

## 发布

```sh
pnpm run release <version>  # 打包 + 计算 SHA-256 + 回写 artifacts/README.md
```

脚本会：改 `package.json` 版本 → `pnpm pack --pack-destination artifacts/release-v<版本>` →
把新 SHA-256 写进 `artifacts/README.md` → 打印摘要。

发布前：

1. 在 `CHANGELOG.md` 增加对应版本小节；
2. 运行 `pnpm run check`、`pnpm run format:check` 和 `pnpm run lint`；
3. 运行 `pnpm run install:local` 把新产物同步到本机 desktop / web 两个 profile（只装一个用
   `--only web`），并在客户端里点一遍设置入口；
4. 检查 `git status`，确认版本号、产物路径与 SHA 同步更新；
5. 提交并推送 `main`。

然后推送与包版本一致的 tag：

```sh
git tag v<version>
git push origin v<version>
```

`release` workflow 会重新运行门禁，核对 tag、`package.json`、CHANGELOG、产物清单与 tarball SHA，并把 `.tgz`、`SHA256SUMS` 发布到 GitHub Release。本地验收安装：

```sh
cd <profile 目录>
pnpm add file:<仓库>/artifacts/release-v<version>/dsh-theme-animal-island-ui-<version>.tgz
```

**同一版本号不要重复出包**；每次发布都使用新的版本号。

## 许可证

提交即表示你同意以仓库的 MIT 许可证（见 [LICENSE](LICENSE)）发布你的贡献；涉及第三方素材时，
请同时更新 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) 与 `licenses/`。
