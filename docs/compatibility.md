# DSH 兼容性说明

## 支持基线

本版本验证基线：

- DSH `0.1.5-rc.3`
- `@deepseek-ai/dsh-client-ui-theme@0.1.5-rc.3`
- Sidebar / Conversation / Layout `0.1.5-rc.3`
- React 18

DSH 仍处于 0.1.x 预发布阶段。本插件承诺支持已验证的公开 seam，不承诺未知 future major。

## 公开扩展面

- `ctx.theme.overrideTokens(source, {light, dark}) -> disposer`
- `ctx.slots.inject/register/spec`
- `sidebar.brand.mark`、`sidebar.brand.name`
- `conversation.hero.brand.mark`
- `body[data-ds-dark-theme]`
- DSH 当前公开 `--dsw-*` / `--shiki-*` token 名称

Slot 只用于公开组件组合。`data-slot` 可在测试中定位，不作为生产 CSS API。

## 禁止依赖

- DSH 构建 hash class；
- DSH 私有 `lib/*`；
- React fiber/container/private internals；
- `window.__DSH_BOOT__`；
- 固定 nth-child/祖先深度；
- `querySelector`、closest、MutationObserver；
- 合成 click、focus/blur、scrollIntoView；
- 复制官方组件 DOM 或重写业务状态。

## 检查目标 DSH

固定仓库基线：

```sh
pnpm run check:compat
```

目标安装：

```sh
node scripts/check-compat.mjs --dsh-package "C:\path\to\@deepseek-ai\dsh-client-ui-theme"
```

或：

```sh
DSH_THEME_PACKAGE="C:\path\to\@deepseek-ai\dsh-client-ui-theme" pnpm run check:compat
```

输出明确区分 `repository-devDependency` 和 `requested-package`，避免用旧仓库依赖冒充目标 DSH 检查。

检查内容：

- ThemeRuntime 和 disposer 返回类型；
- `['theme', 'slots']` 服务顺序；
- provider package 顺序；
- Sidebar/Brand/Hero Slot 的 kind/scope；
- 全部已发送 token 是否被目标 DSH 识别；
- owned style 协议；
- DOM fallback、Observer 和私有 DSH import。

## 降级矩阵

| 失败 | 行为 |
| --- | --- |
| ThemeRuntime 缺失/抛错/无 disposer | 整个 skin no-op，DSH 原生继续 |
| SlotRegistry 缺失 | ThemeRuntime + owned CSS 继续 |
| Sidebar 根 Slot 改变 | 官方侧栏继续运行；品牌 Slot 独立降级 |
| 品牌/Hero Slot 缺失 | 官方 fallback 保留 |
| data hook 消失 | 仅局部增强不匹配 |
| 字体失败 | 系统 CJK 字体继续 |
| SVG/CSS 资源失败 | style 不安装，ThemeRuntime 仍可用 |

## 升级验收

1. 更新本仓库固定 DSH devDependency。
2. 运行 `pnpm run check`。
3. 对目标 DSH 路径运行 `check:compat`。
4. 安装 clean `.tgz` 并完整重启 Web。
5. 验证 Light / Dark / System、hero/active、idle/streaming/tool/error、附件、菜单、设置、wide/rail、窄屏、代码和 reduced-motion。
6. 连续执行 20 次 apply/dispose，确认 style、根属性和 Slot 不重复。
7. 任一公开 Slot/token 契约变化必须更新实现和视觉回归，不允许加入 hash/DOM workaround 掩盖问题。
