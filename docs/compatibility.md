# DSH 兼容性说明

## 支持边界

本插件针对 DSH 0.1.x 的公开 Web 主题 seam 开发，当前仓库验证基线为 `@deepseek-ai/dsh-client-ui-theme@0.1.5-rc.3`。

“兼容”指主题使用 DSH 官方 ThemeRuntime 和 CSS custom property token 约定，不依赖私有实现。DSH 当前仍是预发布版本，未知未来 breaking change 无法由第三方插件保证。

## 固定基线检查

```sh
pnpm run check:compat
```

该命令解析仓库 `devDependencies` 锁定的 ThemeRuntime，输出中的 `source` 为 `repository-devDependency`。它用于保证源码在固定基线上可构建，不自动推断目标 profile 的实际 DSH 安装。

## 检查目标 DSH 安装

部署或升级后，必须把目标 `@deepseek-ai/dsh-client-ui-theme` 包目录显式传给检查脚本：

```sh
node scripts/check-compat.mjs --dsh-package "C:\path\to\@deepseek-ai\dsh-client-ui-theme"
```

也可设置：

```sh
DSH_THEME_PACKAGE="C:\path\to\@deepseek-ai\dsh-client-ui-theme"
```

此时输出中的 `source` 为 `requested-package`。检查内容包括：

- `ThemeRuntime` 和 `overrideTokens` 声明存在；
- `overrideTokens` 的返回类型是 `() => void`；
- 主题实际发出的全部 `--dsw-*` / `--shiki-*` token 均被目标 DSH 识别；
- bundle 使用 `overrideTokens`，且不存在 DOM fallback 或 DSH 私有导入。

## 升级步骤

1. 安装依赖并构建：

   ```sh
   pnpm install
   pnpm run build
   ```

2. 对目标 DSH 安装运行静态契约检查：

   ```sh
   node scripts/check-compat.mjs --dsh-package "C:\path\to\@deepseek-ai\dsh-client-ui-theme"
   ```

3. 运行完整 token、bundle 与生命周期测试：

   ```sh
   pnpm test
   ```

4. 将包加入目标 web profile，重启 profile 并刷新 GUI。
5. 分别验证 Light、Dark、System，检查会话主界面、侧栏、菜单、tooltip、composer、Markdown、代码块、滚动条、窄窗口与长文本。
6. 重启或卸载主题，确认 token layer 被释放且没有重复覆盖。

## 失败分类

| 现象 | 处理 |
| --- | --- |
| `overrideTokens` 不存在 | 主题安全 no-op；升级入口到新的公开 Theme API |
| `overrideTokens` 不返回 disposer | 视为不兼容；修复生命周期契约，不能继续注册无法清理的 layer |
| token 名称消失 | 更新 `src/tokens.ts` 和完整 token manifest；不要添加 DOM fallback |
| `lib/client.js` 缺失 | 执行 `pnpm run build` |
| `pending (waiting for service: ...)` | 模块级 `inject` 使用 cordis 服务名 `theme`；包名只写在 manifest |
| 主题不生效 | 检查 profile 是否提供 ThemeRuntime，并确认安装的是本次构建产物 |
| HMR 后主题重复 | 检查是否通过 `ctx.effect` 管理 `overrideTokens` 返回的 disposer |

## 不允许的兼容方案

- 不通过 `document.body`、`window` 或产品 DOM selector 写入颜色。
- 不覆盖 DSH 生成的 hash class。
- 不直接 import DSH 安装目录中的私有 `lib/*`。
- 不修改 DSH 核心样式表。
- 不把固定开发基线的通过结果冒充为目标 DSH 已通过检查。
- 不把 `console` 诊断当作成功状态。
