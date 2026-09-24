# DSH Animal Island UI Theme

`Animal Island UI`（一动森）是为 DeepSeek Harness（DSH）Web GUI 制作的 light-first 独立主题。视觉以奶油纸张背景、暖棕文字、薄荷绿主色、浅蓝紫侧栏和柔和状态色为核心，参考 [guokaigdg/animal-island-ui](https://guokaigdg.github.io/animal-island-ui/) 的设计语言，但不复制其组件源码、插画、字体文件或运行时。

实现只使用 DSH 公开的 `ctx.theme.overrideTokens()` 与 `--dsw-*` / `--shiki-*` token seam。

## 视觉目标

- Light 是主验收画面：奶油纸背景、浅色内容层、薄荷绿交互强调。
- 正文使用暖棕色阶；侧栏采用淡蓝紫，选中与 hover 对应参考项目的游戏标签色。
- `#19c8b9` 保留为品牌填充色；业务文字、链接和 focus 使用可读的深薄荷语义色。
- Dark 是独立派生的暖色夜间方案，不从 Ember Dusk 色板复制。
- 阴影、遮罩和滚动条均使用暖色，不引入冷灰或纯黑文字。
- Markdown、代码块、语法高亮、菜单、tooltip、bubble 与状态色同步适配。

DSH 当前公开主题 seam 主要覆盖颜色 token，因此本项目保留 DSH 原生布局、字体、圆角和交互结构；不使用 DOM selector、CSS module hash 或 `document/window` fallback 强行实现参考项目的组件造型。

0.1.3 设计色板预览：[SVG](docs/palette-preview.svg)。该预览用于检查 light/dark 关系，不冒充 DSH 组件截图。

## 开发与验收

```sh
pnpm install
pnpm run typecheck
pnpm run build
pnpm test
pnpm run check:compat
```

统一入口：

```sh
pnpm run check
```

`pnpm test` 和 `pnpm run check:compat` 会先构建 `lib/client.js`，因为 DSH 客户端模块系统加载的是构建产物而不是 `src/`。

## 安装到 DSH profile

```sh
pnpm install
pnpm pack
```

`prepack` 会自动重建 `lib`，无需依赖人工先运行 build。0.1.3 的规范发布产物为：

```text
artifacts/release-v0.1.3/dsh-theme-animal-island-ui-0.1.3.tgz
```

把生成的 `.tgz` 作为树外插件加入目标 `web` profile，或按该 profile 的插件配置引用本包。包内 `cordis.patch.yml` 会以 `insert` 行加入 `dsh-theme-animal-island-ui`，避免覆盖已有 profile 行。

目标 DSH 环境必须提供：

```text
@deepseek-ai/dsh-client-ui-theme
```

安装后重启对应 profile 并刷新 Web GUI。主题选择仍由 DSH 的 Light / Dark / System 外观设置控制。

## 兼容性

默认命令检查仓库锁定的开发基线：

```sh
pnpm run check:compat
```

升级或部署到其他 DSH 安装时，必须显式传入目标 `@deepseek-ai/dsh-client-ui-theme` 包目录：

```sh
node scripts/check-compat.mjs --dsh-package "C:\path\to\@deepseek-ai\dsh-client-ui-theme"
```

也可通过 `DSH_THEME_PACKAGE` 环境变量传入同一路径。输出会明确标记使用的是 `repository-devDependency` 还是 `requested-package`，并验证：

- ThemeRuntime 与 `overrideTokens` 存在；
- `overrideTokens` 返回 `() => void` disposer；
- 主题实际发出的全部 `--dsw-*` / `--shiki-*` token 均被目标 DSH 识别；
- 不存在 DOM fallback 或 DSH 私有导入。

若公开 API 变化，应升级客户端入口与 token 数据层，不能用私有 CSS 或 DOM 改写绕过。详见 [docs/compatibility.md](docs/compatibility.md) 与 [docs/design.md](docs/design.md)。

## 许可证

本插件代码采用 MIT。视觉方向参考 `animal-island-ui`；未复制其源代码、资源或完整实现。参考项目采用 CC BY-NC 4.0 并限制商业使用，详见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
