# 贡献指南

感谢你愿意改进这个主题。本文件说明本项目的开发方式、不可越界的约束，以及改动如何被验证。

## 环境

- Node.js ≥ 20（`package.json` 的 `engines`），包管理用 pnpm；
- 本机装有 DSH（默认 `~/.dsh/app`，也可用 `DSH_APP` 环境变量或 `--dsh` 参数指定）；
- headless Chrome（用于离屏夹具截图，可选；不装也能跑门禁）。

```sh
pnpm install
pnpm run check          # typecheck + build + 测试 + 兼容性检查
```

单项：

```sh
pnpm run typecheck      # tsc --noEmit
pnpm run build          # 生成 lib/（含 lib/client.js 与类型声明）
pnpm test               # build + node test/run.mjs
pnpm run check:compat   # 对照锁定的 DSH 版本检查接缝与 token
```

## 改动的边界

本项目是叠加在 DSH 上的皮肤，**只在 DSH 的公开面上作画**。完整清单见
[docs/compatibility.md](docs/compatibility.md)（已审阅接缝表 + 禁止依赖）与
[docs/design.md](docs/design.md)（样式边界表，逐条写明越界后的现象）。三条最容易踩的：

1. 不重画 DSH 已经画好的容器内部（代码块的 `pre`、输入框的内层 `input`）—— 会出现两层边框、两套圆角错位；
2. 不改写插件自带布局（设置页的网格、行内 flex、滚动、行高）—— 最多用 token 影响颜色；
3. 不用「事后清零几何」压制自己的规则，改成让规则一开始就不匹配（`:not()` 挂在**主语**上，不要挂在选择器中段）。

新增任何 `data-*` / ARIA 接缝，必须同时在 `test/skin.test.mjs` 的白名单里登记，并在
`docs/compatibility.md` 的表里写明理由 —— 测试会拒绝未登记的 hook。

## 验证方式

单元与契约测试覆盖 token 完整性、bundle 形状、skin 规则约束和降级路径。**视觉问题**（本项目的
历史问题几乎都是这一类）用离屏夹具验证：从已安装的 DSH 与插件里抽取**真实 CSS**，配真实 DOM
形状渲染，先看 computed style、再看截图。

```sh
node scripts/fixture.mjs document-preview-plain          # 渲染 test/fixtures/<name>
node scripts/fixture.mjs document-preview-plain --dsh "C:\path\to\.dsh\app"
```

- 夹具定义在 `test/fixtures/<name>/`：`fixture.json`（要引入哪些真实 CSS、有哪些变体）+
  `body.html`（DOM 片段，可用 `{{TOKENS}}`、`{{SKIN_CSS}}` 等占位符）；
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
pnpm run release 0.3.6     # 打包 + 计算 SHA-256 + 回写 README 与 artifacts/README.md
```

脚本会：改 `package.json` 版本 → `pnpm pack --pack-destination artifacts/release-v<版本>` →
把新 SHA-256 写进 `README.md` 与 `artifacts/README.md` → 打印摘要。之后把 tgz 装进目标 profile：

```sh
cd <profile 目录>
pnpm add file:<仓库>/artifacts/release-v0.3.6/dsh-theme-animal-island-ui-0.3.6.tgz
```

**同一版本号不要重复出包**（除非该版本尚未分发）；已经分发过的内容请改版本号。

## 许可证

提交即表示你同意以仓库的 MIT 许可证（见 [LICENSE](LICENSE)）发布你的贡献；涉及第三方素材时，
请同时更新 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) 与 `licenses/`。
