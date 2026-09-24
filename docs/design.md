# 一动森主题设计映射

## 设计基线

主题以 [Animal Island UI](https://guokaigdg.github.io/animal-island-ui/) 的公开设计文档为方向来源：

- [Design Tokens](https://github.com/guokaigdg/animal-island-ui/blob/main/docs/design-system/design-tokens.md)
- [CSS Variables](https://github.com/guokaigdg/animal-island-ui/blob/main/docs/design-system/css-variables.md)
- [Design Rules](https://github.com/guokaigdg/animal-island-ui/blob/main/docs/design-system/design-rules.md)

本项目只把颜色语言翻译到 DSH 公开的 `--dsw-*` 和 `--shiki-*` token，不声称完整还原参考组件库。

## Light palette

| 角色 | 值 | DSH 映射 |
| --- | --- | --- |
| 奶油纸背景 | `#f8f8f0` | bg base |
| 内容纸面 | `#f7f3df` | bg layer 1 |
| 嵌套纸面 | `#f0e8d8` | bg layer 2 |
| 输入高光 | `#fffbe7` | overlay / menu |
| 暖棕主文字 | `#6f451f` | label primary / brand text |
| 暖棕正文 | `#654a2f` | label secondary |
| 辅助文字 | `#75634d` | label tertiary |
| caption | `#7c684d` | label caption |
| 品牌填充 | `#19c8b9` | brand primary / primary button |
| 业务文字与链接 | `#0b7f75` | business state / DeepSeek link ramp |
| 侧栏底色 | `#e8edf9` | sidebar fill |
| 侧栏 hover | `#d6dff0` | nav item hover |
| 侧栏 active | `#b7c6e5` | nav item active |
| 气泡底色 | `#e6f9f6` | assistant bubble |

Animal Island 的 canonical 薄荷色对比度不足以直接承担 DSH 的 11–14px 业务文字和 focus outline，因此 0.1.3 将品牌填充与语义文字拆开：按钮和大色块继续使用 `#19c8b9`，文字、链接和 focus 使用同色相的 `#0b7f75`。辅助文字也使用独立可读色阶，而不是简单把 canonical 弱化色叠到背景上。

状态色保留参考项目的草绿、黄色、珊瑚红色相；light 模式使用可承载小字的深阶。所有普通文字、业务强调和代码 token 均由测试验证至少 4.5:1。

## Dark palette

Dark 是独立的暖色夜间方案：深暖棕背景、奶油前景、较亮的薄荷品牌色、蓝紫侧栏和更高的 caption 对比度。它不复用 Ember Dusk 的背景、暗紫侧栏或强调色。

## 能力边界

可以稳定实现：

- 背景、表面、边框、文字、状态色；
- 菜单、侧栏、tooltip、bubble、Markdown 和代码高亮；
- Light / Dark / System token 切换。

仅靠 ThemeRuntime 不完整实现：

- DSH 全局 pill 圆角；
- 所有按钮的 3D 阴影与按压位移；
- 插画、图标、布局装饰和组件结构；
- 外部字体加载。

这些能力若未来需要，必须先确认 DSH 提供公开组件 Slot 或样式扩展点，禁止通过私有 hash class 或全局 DOM selector 硬改。
