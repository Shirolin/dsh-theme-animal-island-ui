# 变更记录

本文件记录每个发布版本对用户可见的变化。安装与验收流程见 `README.md`，设计映射见 `docs/design.md`，DSH 兼容边界见 `docs/compatibility.md`。

## 0.3.4

修复主题规则越界改写 DSH 与插件自有界面的问题，并把发布产物换成含全部修复的版本。

### 标题与顶部

- 标题绶带按参考项目 `Title` 的三层构造重做：薄荷正面主体 + 深青燕尾 + 折角三角，三层收在 `nav` 盒内（DSH 的 `.crumbs` 带 `overflow: hidden`），去掉原来的 3° 透视侧倾和 4px 硬底阴影。

### 弹出层（菜单 / 命令面板 / 下拉）

- 菜单表面改用 `--dsw-specific-menu`（= `surface`），不再复用 composer 的 `#fffbe7`，命令面板不再和输入框糊成一片；对应地，菜单/列表不再被套上 dialog/composer 的奶油卡片外观；
- 弹出层行列高亮（`[role='option'|'menuitem']` 的 hover / `aria-selected`）改用薄荷 `--dsw-alias-interactive-bg-hover-accent`；通用 `--dsw-alias-interactive-bg-hover` 保持 periwinkle，因为侧栏会话行与它共用；
- composer 的文字胶囊规则不再匹配 menu / listbox / composer 触发面板子树，也不再匹配内容含 `img` / `video` / `canvas` 的控件 —— 修掉了命令面板行高被清零、面包屑被套成胶囊、粘贴图片缩略图被挤压截断三个问题。

### 表单

- 对话框内的组合输入（`span > 图标 + input`）由外壳承担字段外观，内部 `input` 保持透明，键盘焦点环移到外壳：插件市场的搜索框不再出现内外两层框。

### 设置页

- 预设卡片的 id 恢复 DSH 的 mono 说明文字（行内代码 chip 只作用于无 class 的 `<code>`）；
- 深色 `--animal-cream` 从侧栏蓝紫改为暖色浮层 `#40362b`，对话框不再与暖色卡片互相打架；
- 「设置头部预留高度」规则加 `:not(li *)`，不再把预设卡片的底部工具条撑到 64px；
- 删除为 opencode-go 模型列表写的 `nav[aria-label]` 布局覆盖，交还插件自己的 43/57 两列与行内 flex。

### 代码块

- `pre` 不再自己画边框/圆角/底色/阴影（那会让它的圆角弧与容器错位），只保留内边距与排版；圆角与底色跟随 DSH 的代码块变量；
- banner（语言标签 + 复制按钮）文字改用代码前景色 —— 原先继承的 `label-primary` 在亮色下是暖棕，压在深色代码岛上不可读；语言标签自己声明了颜色，所以 banner 与它的直接子元素都要覆盖；
- 右侧栏「文档」预览的**纯文本**视图恢复 DSH 自身的文字颜色：预览是透明的平面代码视图，主题的深色代码岛前景色在亮色下只有 1.35:1，完全看不清（高亮的「代码」视图不受影响，它用自己的 token 配色）。

## 0.3.3

- 首个高保真版本：绿色双层波点画布、奶油白侧栏与蓝紫波浪、原创岛标与品牌 Slot；
- 薄荷标题绶带、暖棕文字层级、periwinkle 导航状态；
- composer / dialog / 卡片 / 按钮的 scoped CSS 与 3D 反馈；
- 深棕代码块与完整 Shiki 配色；
- 内嵌 Nunito Latin WOFF2，中文回退 Noto Sans SC / 苹方 / 微软雅黑；
- 配套工程设施：`lib/client.js` 走 DSH Module Loader，token 完整性测试、bundle 契约测试、`check:compat` 兼容性检查。

## 0.3.0 – 0.2.x

历史迭代（0.2.0 起引入 ThemeRuntime token 层与自有 skin 分层，0.2.x 调整色板与卡片几何）。产物留在 `artifacts/release-v0.2.*`，仅作归档，不作为验收依据。
