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

## 已审阅的属性与变量接缝

除 Slot/token 之外，皮肤只允许使用下表列出的语义标签、角色与 DSH 自己的属性。任何新增都必须在 `test/skin.test.mjs` 的 `allowed` 集合里登记，并在此处说明理由。

| 接缝 | 用途 | 为什么稳定 |
| --- | --- | --- |
| `[data-composer-card]` | composer 卡片范围：按钮 pill、输入重置、胶囊排除的作用域 | 会话 composer 的语义容器，多轮迭代未变 |
| `[data-conversation-header-corner]` | 标题绶带的启用条件（`header:has(...)`） | 会话头部角落插槽的标记 |
| `[data-trigger-menu]` | composer 的 `/`｜`@` 触发面板，排除胶囊与弹出层装饰 | DSH 自己的 pointerdown 关闭逻辑依赖它 |
| `[data-code-block-banner]` | 代码块 banner（语言标签 + 复制按钮）的文字颜色 —— 它继承 `label-primary`，亮色下压在深色代码岛上不可读 | 代码块 banner 的标记；只改颜色不动几何，且必须连 banner 的直接子元素一起改：语言标签自己声明了 `label-primary`，元素自身声明赢过继承 |
| `[data-code-preview]`、`[data-textpreview-plain]` | 右侧栏「文档」预览的两条平面视图（高亮代码体 / 纯文本页）：把它们的 `<pre>` 从主题代码排版规则里排除，保留 DSH 自己的内边距与文字颜色 | 预览 `CodeBody` / `TextBody` 自己渲染的属性；纯文本视图**不是** `CodeBlock` 那条路径，单独用 `data-textpreview-plain` 才命中 |
| `--dsl-code-block-*` | 代码块圆角/底色/banner 变量 —— 皮肤**只读不写**：写了会连带顶掉文档预览刻意设的 `0px` / `transparent` | DSH 为代码块预留的公开样式变量 |
| `body[data-ds-dark-theme]` | 深色分支 | ThemePresenter 写出的调色板属性 |
| `role="option" / menuitem / menuitemradio` | 弹出层行列高亮 | ARIA 角色 |
| `[aria-pressed]`、`[aria-selected]` | 选中态（预设卡片、列表项） | ARIA 状态属性 |

不得使用：hash class、`data-slot`、固定祖先深度、`nth-child`/`first-child`/`last-child`（测试会拒绝）。

## 插件自有布局

DSH 生态里的设置页常常由插件自带布局（例如 `dsh-opencode-go` 的 `modelLayout` 两列网格、`modelRow` 行内 flex、自己的滚动与行高）。皮肤**不得**改写这类布局：0.3.4 删掉了为那页写的 `nav[aria-label]` 覆盖，因为同一条规则会顶掉插件自己的列宽比例，并把行拆成两列网格导致行内开关位置参差。

判断口径：只覆盖 DSH 与插件都**没有**给出外观的语义元素；已经自带 CSS 的组件，最多通过 token 影响它的颜色，不改它的几何。

## 禁止依赖

- DSH 构建 hash class；
- DSH 私有 `lib/*`；
- React fiber/container/private internals；
- `window.__DSH_BOOT__`；
- 固定 nth-child/祖先深度；
- `querySelector`、closest、MutationObserver；
- 合成 click、focus/blur、scrollIntoView；
- 复制官方组件 DOM 或重写业务状态。

## 工程约束

- **包清单**：`package.json` 的 `dsh.client.inject` 写**包名**（`@deepseek-ai/dsh-client-ui-theme` 等），用于声明依赖与加载顺序；
- **服务注入**：客户端入口内部 `inject` 写 **Cordis 服务名**（`['theme', 'slots']`）。写包名会让插件永久停在 `pending (waiting for service: ...)`；
- **主题注册**：必须走 `ctx.theme.overrideTokens(source, tokens)`，disposer 交给 `ctx.effect()`；禁止 `document.body`、`window`、`querySelector`、DSH 内部 CSS module hash 或直接覆盖 DSH 核心样式表；
- **自有样式生命周期**：`<style data-plugin>` 与根属性成对安装/清理，重复 apply/dispose 不得残留；
- **构建**：`lib/client.js` 必须是 DSH Module Loader 形状（`globalThis.__ModuleLoader__.load({ id, factory })`），React 由平台模块表提供，Nunito WOFF2 与原创 SVG 构建期内嵌；
- **门禁**：`pnpm run check` = typecheck + build + `node test/run.mjs` + `check:compat`，全部必须通过；token 测试要求 light/dark key 集合一致且对比度达标，bundle 测试禁止 hash class、私有 import、DOM fallback 与 Observer。

## 离屏验收夹具

主题的历史问题大多是「规则打到不该打的地方」，肉眼难判，因此每次改动都用离屏夹具验收：从已安装的 DSH 前端与插件包中提取**真实 CSS**，配真实 DOM 形状渲染，再截图对比。

- 夹具脚本与生成页面：`.dsh/`（忽略目录），按页面分目录，例如 `.dsh/code-block/`、`.dsh/composer-chip/`、`.dsh/agent-preset/`；
- 输出截图：`artifacts/smoke/`（忽略目录，保留作为回归证据）；
- 渲染命令：headless Chrome `--headless=new --screenshot`，`--user-data-dir` 用系统临时目录，**不要**往仓库里写浏览器 profile；
- 判定优先级：先看 computed style 探针（几何/颜色/命中规则），再看截图观感；两者都通过才算修好。


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
