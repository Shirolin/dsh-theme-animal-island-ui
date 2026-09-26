# 侧栏会话列表整块空白的排查

> 记录一次真实误判：DSH 侧栏「会话列表」完全不显示，最初被当成皮肤问题。结论是它由 DSH 自身的持久化快照形状不匹配引起，与本仓库皮肤无关。本文给出可复现的判定点，避免下次再走弯路。

## 症状

- 侧栏只剩品牌、`新会话` 和底部 `待处理改动` / `设置`；
- `工作区 / 会话` 那一整块（区域头、会话行、空态）全都不出现；
- 新建任意数量会话都不显示，列表内容与会话数量无关。

## 两个判定点

### A. 区域里连空态都没有 ⇒ 不是「没有数据」

`sidebar.workspaces` 槽的浏览区在无会话时会渲染空态文案 `empty.none = 暂无会话`（`dsh-client-ui-workspace` 的 `workspace` 词典），区域头也是无条件渲染的。如果三者都缺席，说明这个槽条目**根本没渲染**，不要去查会话数据。

数据是否存在可以直接看宿主落盘的工作区注册表：

```text
~/.dsh/storages/workspace.json          # global.workspaceIds + tables.workspaces[].sessionIds
```

### B. Console 里有关键字 ⇒ 是槽内组件抛错被错误边界接住

```text
slot entry crashed in 'sidebar.workspaces': TypeError: Cannot convert undefined or null to object
    at Object.entries
    at retainAccountKeys (client.js:218)
    at client.js:2017
```

`slot entry crashed in '<hole>'` 是 DSH 槽条目的错误边界日志：**边界只吞掉该槽条目的渲染**，所以侧栏其余部分（别的槽、别的插件）全都正常 —— 这正是「只有会话区空白」的原因。

## 根因链

以 DSH `0.1.5-rc.3` 为例（只读参考，不在本仓库范围内）：

| 位置 | 内容 |
| --- | --- |
| `dsh-client-ui-workspace/lib/client.js:194-228` | 会话视图 store：`init()` 给 `groupBy` / `orderBy` / `groupExpansion` / `sessionOrderByAccount` / `sessionUpdatedAtByAccount`，`persist: "dsh.workspace.view.v5"` |
| 同文件 `:214-218` | `retainAccountKeys` 连续三次 `Object.entries(...)`，**218 行**处理最后新增的 `sessionUpdatedAtByAccount` |
| 同文件 `:2015-2026` | `workspacePhase === "ready"` 时无条件调用该动作，因此每次渲染都会触发 |
| 前端 `index-*.js`（`dsh-client-store`） | 持久化回读是**整对象替换**：`setState(JSON.parse(snapshot), true)`，不补齐缺失字段 |

于是：浏览器里那份**旧的 4 键快照**（缺 `sessionUpdatedAtByAccount`）被整对象替换进 store → 该字段为 `undefined` → `Object.entries(undefined)` 抛错 → 槽条目不渲染。

本次实测快照：

```text
dsh.workspace.view.v5  (4) ['groupBy','orderBy','groupExpansion','sessionOrderByAccount']
```

persist 键仍是 `v5`，但状态形状已经变过 —— 这是 DSH 侧的版本管理缺口：**形状变化没有升 persist 键**。

## 修复

只动浏览器本地存储，不改代码、不改插件。在 GUI 所在的确切源（如 `http://127.0.0.1:3080`）上执行：

先确认快照形状：

```js
Object.keys(localStorage).filter(k => k.includes('workspace.view')).forEach(k => {
  let v
  try { v = JSON.parse(localStorage.getItem(k)) } catch { v = '<解析失败>' }
  console.log(k, v && typeof v === 'object' ? Object.keys(v) : v)
})
```

确认缺少 `sessionUpdatedAtByAccount` 后清除并刷新：

```js
Object.keys(localStorage).filter(k => k.includes('workspace.view')).forEach(k => localStorage.removeItem(k))
location.reload()
```

刷新后侧栏恢复，新快照为 5 键健康形状。副作用仅限工作区视图偏好（分组方式、排序、分组展开、会话手动顺序），会话与工作区数据不受影响。

## 复发条件

同源上跑过**旧构建**就会复发：旧构建会用 4 键形状把快照写回，下一次用新构建打开同一地址时列表再次整块消失。典型场景是 `~/.dsh/app` 与 `~/.dsh/app.bak-*` 共用 `127.0.0.1:3080`。清理 localStorage 是治标；治本是 DSH 侧给这三次 `Object.entries` 加 `?? {}` 兜底并升 persist 键。

方向判断：

- **升级到更新的构建**：新形状通常是旧形状的超集，一般不触发；
- **回退到旧构建、之后再升回来**：每次回退都会把 4 键快照写回，升回来时必炸。

## 例行处理（跨构建切换）

这类持久化 store 在整个 DSH 与 profile 里只有一个键：`dsh.workspace.view.v5`（`defineStore` + `persist` 只被 `dsh-client-ui-workspace` 使用）。其余 localStorage 键（`dshm-*`、看板选择、会话草稿等）都是各自插件的 UI 偏好，版本切换最多让偏好不同步，不会整块丢面板。

所以「换版本」只需要养成一个习惯：

1. 把上一节的清除片段存成 DevTools 的 **Snippets**（Sources → Snippets → 新建，命名如 `dsh-fix-session-list`），它按浏览器持久保存，不用记命令；
2. 换版本后如果会话列表整块空白，跑一次它即可，5 秒结束。

不建议给 `~/.dsh/app` 打防御性补丁：该目录在每次升级/回退时会被整体替换，补丁随之丢失，重打补丁比跑一次 Snippet 更麻烦。它更适合作为**上报材料**。

## 本仓库皮肤为什么无关

本次用三条可复核的检查排除皮肤：

1. **CSS 匹配面**：把 `src/client/skin.css` 的每条选择器在按真实 bundle 重建的会话列表 DOM（`div[role="tree"][aria-label="会话"]` + `div[role="treeitem"]`）上求值，命中 0 条；只有全局控件底座规则（`font-family: inherit`、过渡、focus 环）落在行内小图标按钮上。
2. **Slot 注册面**：安装包内的 `lib/client.js` 与源码逐字节一致，只注册 `sidebar.brand.mark` / `sidebar.brand.name` / `conversation.hero.brand.mark`，不触碰 `sidebar.workspaces`。
3. **数据层**：`~/.dsh/storages/workspace.json` 中工作区与会话齐全，问题不在数据。

诊断顺序建议固定为：**先看 Console 关键字 → 再看槽是否渲染 → 最后才怀疑皮肤**。皮肤只通过 `ctx.theme.overrideTokens()`、自有 CSS 和三个公开 Slot 生效，见 [design.md](design.md) 与 [compatibility.md](compatibility.md)；DSH 侧 store 数据、槽错误边界和持久化快照都不属于皮肤的作用面，禁止用 DOM hack、hash class 或全局选择器去掩盖这类问题。
