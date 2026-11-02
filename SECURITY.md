# 安全策略

## 支持范围

只维护 GitHub Releases 中的最新发布版本。旧版本的问题请先升级复现。

## 报告漏洞

请**不要**开公开 issue。用以下任一方式：

- GitHub 的私有漏洞报告（仓库 Security → Report a vulnerability）；
- 或直接联系维护者（见仓库主页）。

请在报告里包含：受影响版本、复现步骤、影响面，以及你认为的严重程度。我们会在 7 天内回应，
并在修复发布后于 CHANGELOG 里注明（不公开报告者身份，除非你同意）。

## 本项目的安全面

这是一个**纯前端皮肤插件**，运行在 DSH Web 客户端里，安全相关面很小但明确：

- 插件不发起网络请求、不读写文件、不执行子进程；构建期的 `@fontsource/nunito` 字体与原创 SVG
  以 data URI 内嵌进 `lib/client.js`；
- 插件注入的唯一 DOM 是 `<style data-plugin="dsh-theme-animal-island-ui">`、根属性
  `data-dsh-animal-island-skin`，以及公开 Slot 里的品牌组件；不做 DOM 扫描、不注册
  `MutationObserver`、不合成事件；
- 皮肤 CSS 只使用语义选择器、ARIA 角色与已审阅的 `data-*` 接缝（见
  [docs/compatibility.md](docs/compatibility.md)）；不使用 DSH 构建 hash class 或私有 `lib/*`。

因此，以下情况都属于需要报告的问题：CSS 注入越界改写非皮肤范围、插件在运行时发起外部请求、
`lib/client.js` 与源码不一致（被篡改）、或发布产物与记录的 SHA-256 不匹配。
