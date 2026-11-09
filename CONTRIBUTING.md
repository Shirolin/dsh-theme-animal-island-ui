# 贡献指南

感谢你参与改进这个主题。本文说明项目的本地开发流程、样式边界约束以及改动验证方式。

## 开发环境

- **Node.js ≥ 22.13**（见 `package.json` 的 `engines`），包管理器固定为 **pnpm 11.1.2**；
- **DSH 客户端**（可选，用于运行离屏 DOM 夹具）：支持直接读取 `~/.dsh/app`（或 `DSH_APP` 环境变量），或自动从 Windows / macOS 桌面客户端的 `app.asar` 解包提取运行时；
- **Headless Chrome**（可选，用于执行离屏夹具的浏览器断言与截图；未安装时仍可运行常规门禁）。

```sh
pnpm install
pnpm run check          # 完整门禁：站点检查 + typecheck + build + 单元测试 + 兼容性检查
```

单项命令：

```sh
pnpm run typecheck      # tsc --noEmit
pnpm run format         # Biome：格式化源码、脚本、测试与 JSON / CSS
pnpm run lint           # Biome：静态检查
pnpm run build          # 构建客户端 bundle 与类型声明至 lib/
pnpm test               # build + node test/run.mjs
pnpm run check:compat   # 对照锁定的 DSH 版本核对公开接缝与 Token 覆盖率
```

提交代码前请确保 `pnpm run check`、`pnpm run format:check` 与 `pnpm run lint` 全部通过。

## 样式改动的边界

本主题作为叠加在 DSH 上的外观扩展，**只在 DSH 的公开接缝上着色**。完整规范见 [docs/compatibility.md](docs/compatibility.md) 与 [docs/design.md](docs/design.md)。日常改动中最常遇到的三条禁区：

1. **不重画已封装容器的内部节点**（如代码块内的 `pre`、组合输入框内的 `input`）—— 否则会出现双层边框与圆角错位；
2. **不改写插件的自有布局**（如设置页的自定义网格、行内 flex、滚动容器与行高）—— 仅通过公开 Token 影响配色；
3. **不用「事后清零几何」去抵消过宽的规则** —— 应在选择器主语上用 `:not()` 提前排除不该命中的控件。

若需新增任何 `data-*` 或 ARIA 选择器接缝，必须先在 `scripts/seam-contract.mjs` 中登记用途、DSH 源码证据与探针决策；策略测试、兼容性检查与文档覆盖测试均以该文件为单一事实源。

## 验证方式

针对 CSS 选择器、圆角、阴影或布局边界的改动，请使用离屏夹具从真实 DSH 运行时提取 CSS 进行渲染验证：

```sh
pnpm run fixture sidebar-masthead                        # 自动探测本机 Web 或桌面端 DSH 运行时
pnpm run fixture document-preview-plain --dsh <app_dir>  # 显式指定 Web 端 DSH 目录
pnpm run fixture boot-loading --desktop                  # 显式解包桌面端 app.asar 运行时
pnpm run check:visual                                    # 侧栏船票真实 DOM 视觉门禁
pnpm run check:fixtures                                  # 全套夹具（11 个，浅/深）
```

- 夹具位于 `test/fixtures/<name>/`，由 `fixture.json`（依赖的插件 CSS、窗口尺寸与浏览器断言）和 `body.html`（最小可复现 DOM 片段）组成；
- `assertions` 中的每条 `{ message, expression }` 在真实 Chromium 中求值，返回非 `true` 时命令以非零状态码退出；
- 渲染截图输出在 `artifacts/smoke/`（已被 git 忽略），提交涉及视觉变化的 PR 时请附上前后对比图。

夹具镜像的是某个具体 DSH 版本的 DOM 与 CSS，因此：

- 运行时版本会打印在每次输出的第一行，`pnpm run check:fixtures -- --expect-dsh 0.2.2-rc.1` 可以把结论钉到某个版本；
- 断言只比较设计意图（元素的实际位置、尺寸、计算样式），不要从 `padding`/`margin` 反推几何 —— 那会在 DSH 调整自身内边距时误报；
- 桌面客户端升级后先跑一遍全套夹具，再判断是皮肤回归还是夹具 DOM 过期，判据见 [docs/compatibility.md](docs/compatibility.md#dsh-升级时怎么处理)。

## 提交与 Pull Request

- 提交信息遵循 `type: subject` 格式（如 `feat:`、`fix:`、`docs:`、`release:`），一次提交只聚焦一件事；
- PR 描述请写明改动原因、执行的验证命令，涉及界面变化时附上截图对照；
- 面向用户的可见变更请同步记录到 [CHANGELOG.md](CHANGELOG.md)；
- 涉及破坏性接缝变更（如增删公开 Slot 或调整外观持久化结构）请先提交 Issue 讨论。

## 发布

1. 在 [CHANGELOG.md](CHANGELOG.md) 中补齐新版本变更说明：把顶部的「未发布」段落改名为 `## <version>（<主题>）`，没有则新增一段；
2. 执行打包与产物清单更新脚本：
   ```sh
   pnpm run release <version>
   ```
   该脚本会更新 `package.json` 版本号、生成 `artifacts/release-v<version>/` 下的 `.tgz` 包；这个包只用于本机核对，**不要记录它的 SHA-256**（见下一步）；
3. 运行 `pnpm run check`、`pnpm run format:check` 和 `pnpm run lint`；
4. 如本机装有客户端，可运行 `pnpm run install:local` 将新产物同步至本机 `web` 与 `desktop` profile 进行实机核对；
5. 提交变更并推送带 `v` 前缀的标签：
   ```sh
   git tag v<version>
   git push origin main v<version>
   ```

推送标签后，GitHub Actions 的 `release` 工作流会重新运行完整门禁，`verify-release.mjs` 会解包并逐个文件比对 CI 出包与仓库内容（版本号、CHANGELOG 段落、`package.json` 的 `files` 清单与文件字节），然后通过 OIDC Trusted Publishing 将包发布至 npm（附带 Sigstore Provenance 签名），并创建附带 `.tgz` 与 `SHA256SUMS` 的 GitHub Release。

- 发布产物的 SHA-256 由该工作流计算并写进 Release 说明，不落在仓库里：`pnpm pack` 的 gzip 流因平台而异，本机算出的校验值不可能与发布产物相同；
- 工作流失败时：修好问题后删除并重打同一个 tag（`git tag -d v<version> && git push origin :refs/tags/v<version>`），不要靠改本机 SHA 对齐。

## 许可证

提交代码即表示你同意以本仓库的 [MIT License](LICENSE) 授权你的贡献；若引入第三方字体或素材，请同步更新 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) 与 `licenses/` 目录。
