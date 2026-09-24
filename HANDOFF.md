# Animal Island × DSH 项目交接清单

> 本文件记录从 `dsh-theme-ember-dusk` 迁移到新项目时必须继承的工程经验、已验证的 DSH 接入方式，以及新 Animal Island 主题不能直接复制的部分。

## 1. 项目拆分

### 冻结的旧主题

```text
D:\Project\dsh-theme\dsh-theme-ember-dusk
```

- 名称：Ember Dusk（余烬暮色）
- Git 最新冻结提交：`c3724c0`
- DSH 启动修复提交：`a298c1e`
- 主题定位：暖棕背景、暖奶油文字、低饱和薄荷色、暗紫侧栏的独立 DSH 配色主题
- 保留原因：当前视觉效果用户喜欢，但不再继续作为 Animal Island 主线改造

### 新的 Animal Island 项目

```text
D:\Project\dsh-theme\dsh-theme-animal-island-ui
```

- 从新的视觉主题开始；
- 不复制 Ember Dusk 的暖棕 dark 色板；
- 不复制 Ember Dusk 的暗紫侧栏；
- 不复制 Ember Dusk 的主题名称、source 或截图效果。

## 2. 必须继承的工程基础设施

以下内容可以从 Ember Dusk 项目中参考或复用：

- DSH package manifest：`package.json` 中的 `dsh.client`；
- Host / Client 双入口结构；
- `cordis.patch.yml` 的 profile 插入方式；
- `lib/client.js` 的 DSH Module Loader 输出格式；
- TypeScript 类型声明生成方式；
- `ctx.theme.overrideTokens()` 接入；
- `ctx.effect()` disposer 生命周期管理；
- ThemeRuntime 能力检查；
- token 完整性测试；
- bundle 契约测试；
- DSH 兼容性检查脚本；
- 本地 clean package 安装流程；
- MIT 代码许可证和第三方参考声明。

## 3. DSH 接入中已经确认的关键规则

### 3.1 package manifest 的 inject

`package.json` 的这一层写包名：

```json
{
  "dsh": {
    "client": {
      "platform": "web",
      "inject": [
        "@deepseek-ai/dsh-client-ui-theme"
      ],
      "immediately": true
    }
  }
}
```

作用：声明本插件依赖 DSH 的 ThemeRuntime 插件，并保证模块加载顺序。

### 3.2 Client 插件内部的 inject

Client 入口内部写 Cordis 服务名：

```ts
export const inject = ['theme']
```

不要写成：

```ts
export const inject = ['@deepseek-ai/dsh-client-ui-theme']
```

后者会导致插件永久处于：

```text
pending (waiting for service: ...)
```

原因：模块内部 `inject` 通过 `ctx.get(name)` 查找服务，Theme 包通过 `ctx.provide('theme', ...)` 提供服务；包名和运行时服务名不是同一个命名空间。

### 3.3 主题注册

全局主题必须使用 DSH ThemeRuntime：

```ts
const dispose = ctx.theme.overrideTokens(source, tokens)
ctx.effect(() => dispose)
```

禁止：

- `document.body`；
- `window`；
- `querySelector`；
- DSH 内部 CSS module hash；
- 直接 import DSH 私有 `lib/*`；
- 直接覆盖 DSH 核心样式表。

## 4. 构建和测试要求

新项目至少需要这些命令：

```sh
pnpm install
pnpm run typecheck
pnpm run build
pnpm test
pnpm run check:compat
```

### 类型检查

确认：

- DSH Context 类型可用；
- `ThemeRuntime` / `ThemeTokenOverrides` 类型可用；
- Client 和 Host 入口导出正确。

### Bundle 检查

确认：

- `lib/client.js` 存在；
- 使用 `globalThis.__ModuleLoader__.load(...)` 协议；
- 包含 Client factory；
- 不嵌入 DSH ThemeRuntime 实现；
- 不包含 DOM fallback。

### Token 测试

确认：

- light / dark 都有值；
- token key 集合一致；
- 主题不会因为缺一个 mode 而失效；
- 主要文字与背景有足够对比度；
- 不使用不存在的 token 名称。

### 兼容性检查

每次 DSH 升级后运行：

```sh
pnpm run check:compat
```

检查：

- `ThemeRuntime` 导出仍存在；
- `overrideTokens` 仍存在；
- 当前使用的 token 能被当前 DSH 识别；
- 插件没有 `document` / `window` fallback。

## 5. 新 Animal Island 主题不能直接继承的内容

### 5.1 不继承 Ember Dusk 色板

当前 Ember Dusk 的核心色板大致是：

```text
dark bg:     #201a15
surface:     #2d251d
dark accent: #59d9c9
sidebar:     #302a3b
```

这套颜色是 Ember Dusk 的独立视觉，不属于 Animal Island 主线。

### 5.2 不把 dark 作为主视觉

Animal Island 参考项目的核心是 light-first：

- 奶油纸张背景；
- 暖棕文字；
- 薄荷绿主色；
- 浅色内容卡片；
- 淡蓝紫侧栏；
- 彩色游戏标签。

如果需要 dark mode，应作为独立派生方案设计，而不是先把主视觉做成暖棕 dark 再反向推导 light。

## 6. Animal Island 视觉目标

参考项目的 canonical 方向应优先于当前 DSH 截图，来源：

- [animal-island-ui design tokens](https://github.com/guokaigdg/animal-island-ui/blob/main/docs/design-system/design-tokens.md)
- [animal-island-ui CSS variables](https://github.com/guokaigdg/animal-island-ui/blob/main/docs/design-system/css-variables.md)
- [animal-island-ui design rules](https://github.com/guokaigdg/animal-island-ui/blob/main/docs/design-system/design-rules.md)

核心色板：

```text
primary:       #19c8b9
primary-hover: #3dd4c6
primary-active:#50b9ab
primary-bg:    #e6f9f6

background:    #f8f8f0
content-bg:    rgb(247, 243, 223)
secondary-bg:  #f0e8d8

text:          #794f27
body-text:     #725d42
secondary:     #9f927d

border:        #dcd8d1
border-hover:  #827157

sidebar-active:#b7c6e5
sidebar-hover: #d6dff0
```

参考项目的视觉规则还包括：

- 按钮和输入框使用 pill 圆角；
- 交互元素最小圆角 12px；
- 卡片约 20px；
- 暖色 3D 按钮阴影；
- hover 浮起、active 下沉；
- Nunito + Noto Sans SC；
- focus 使用黄色，不使用冷蓝色 focus ring；
- 0.15–0.35 秒柔和动效；
- 粉色、紫色、蓝色、黄色、橙色等彩色应用块。

## 7. DSH 能力边界

新主题必须区分：

### 可以稳定继承的 DSH 能力

- 背景、表面、边框、文字、状态色；
- 代码块和语法高亮；
- 侧栏、菜单、tooltip、bubble 等公开 token；
- light / dark / system 兼容；
- ThemeRuntime 生命周期。

### 不能仅靠 ThemeRuntime 完整实现的 DSH 能力

- 全局所有组件的 pill 圆角；
- DSH 所有按钮的 3D 阴影；
- 全部组件的 hover / active 位移；
- DSH 内部布局和装饰形状；
- 参考项目的插画、图标和组件结构。

如果未来需要这些效果，必须先确认 DSH 是否有公开的组件 Slot / 样式扩展点；禁止用 DSH hash class 或全局 DOM 选择器硬改。

## 8. 新项目第一阶段建议

1. 初始化新的 package.json 和 Git 仓库；
2. 复用 DSH manifest、loader、生命周期和测试结构；
3. 重新建立独立的 `src/palette.ts`；
4. 以参考项目的 light palette 为第一视觉基线；
5. 只覆盖 DSH 公开 token，不先碰组件 DOM；
6. 生成 light / dark 两套 token，但 light 作为主验收画面；
7. 安装到本地 `web` profile 进行真实截图验收；
8. 单独评估是否需要有限的公开 Slot 增强；
9. 不把 Ember Dusk 的代码和色板混入新项目。

## 9. 验收标准

新 Animal Island 主题至少应满足：

- 视觉主色与参考项目的薄荷绿方向一致；
- 主背景是奶油纸张，而不是 Ember Dusk 的暖棕 dark；
- 正文和侧栏符合参考项目的暖棕 / 浅蓝紫关系；
- Light、Dark、System 不出现不可读状态；
- 不使用 DOM hack；
- DSH ThemeRuntime 缺失时安全 no-op；
- `pnpm run check` 全部通过；
- DSH 升级后可以通过兼容性检查定位变化；
- 不影响 Ember Dusk 项目，二者可以独立安装和回滚。
