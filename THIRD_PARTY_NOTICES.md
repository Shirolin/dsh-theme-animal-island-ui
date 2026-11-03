# Third-party notices

## animal-island-ui

本项目在视觉方向和交互节奏上参考了 `guokaigdg/animal-island-ui`，固定审查基线为 commit `29051196bd7586d4484b55431b03178e6046fa64`、版本 2.0.0。

本插件没有复制其源代码、组件实现、Logo、字体文件、插画、照片或完整 CSS。色板关系、波点规格、原创波浪、岛标、DSH token 映射和 Sidebar 集成均为本项目实现。标题绶带沿用参考 `Title` 的三层构造（正面主体 / 燕尾 / 折角三角，见 `docs/design.md`），实现是本项目在 DSH `nav` 与两个伪元素上的独立重写，未复制其 CSS。按钮的轻微上浮/下沉和像素阴影属于受其 MIT 许可设计语言启发，本项目以 DSH 公开组件边界重新实现。

上游版权与许可：

```text
MIT License

Copyright (c) 2026 guokaigdg

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Nunito

构建时内嵌 `@fontsource/nunito` 提供的 Nunito Latin WOFF2。Nunito 由 The Nunito Project Authors 创作，采用 SIL Open Font License 1.1。完整许可证见 `licenses/Nunito-OFL.txt`。

## Original resources

`src/client/assets/sidebar-wave.svg`、React Brand/Hero Mark 和 skin CSS geometry 为本项目原创资源，随本插件 MIT License 发布。

`site/promo/animal-island-promo.mp4`、poster、storyboard 与 social card 同为项目发布素材，随本项目 MIT License 发布。真实界面来自项目自有的 DSH CSS/DOM 夹具与站点资源；纸艺海岛与撕票微距为制作阶段由 AI 生成、再按项目视觉重新构图的原创素材，不含第三方界面或品牌素材。配乐、纸张撕裂、转场与 UI 音效均由项目程序化生成，不含第三方音频采样。
