# 桌面客户端（Electron）说明

官方桌面版不是另一套前端。它内置同一个 web 应用，加上一层 Electron 壳与一个独立 profile。本文记录
在这个环境里安装、验证、回滚本主题时要用的命令与边界。

## 它是什么

- 外壳是 `@deepseek-ai/dsh-desktop`（Electron），内置 runtime `@deepseek-ai/dsh-desktop-runtime`；
  本文的验证基线是 `0.2.1-rc.5`。
- 桌面宿主 `dsh-desktop-host/lib/index.js` 的 `main()` 直接调用：

  ```js
  runProfile({ profile: "desktop", args: ["--no-open", "--port", "19387"] })
  ```

  也就是与 `dsh web` **同一套** web 应用（`dsh-web-app` + `dsh-web-frontend`），只是换了 profile
  目录，外面套了 Electron。
- 所以客户端插件不需要为桌面版改造：`dsh-client-modules` 仍然只认 `dsh.client.platform === "web"`
  （0.2.1-rc.5 里还是这一行），本主题的 `package.json` 声明的正是这个值。

## profile 是隔离的

- 桌面版读 `$DSH_HOME/profiles/desktop`，与 `web` profile 的 `node_modules` 完全隔离：装在 `web`
  profile 里的插件，桌面版**看不见**。要两边都用就得装两次。
- 组合包列表在 profile `package.json` 的 `dsh.profile.bundles`；主题必须在里面才会被挂载。
- CLI 不接管这个 profile：`dsh --profile desktop ...` 会被拒绝，报
  `profile "desktop" is managed exclusively by the Electron application`。因此不能用
  `dsh plugin --profile desktop add`，只能改文件 + 用桌面自带的 pnpm 安装。

## 安装、验证、回滚

装：把 profile 的依赖指向目标 `.tgz`，再用**桌面自带的 pnpm** 安装 —— 它的 `node` 是 Electron 自己
（`ELECTRON_RUN_AS_NODE=1`），profile 里的生命周期脚本依赖这套环境：

```powershell
$prof = "$env:USERPROFILE\.dsh\profiles\desktop"
$exe  = "C:\Software\DeepSeek Harness\DeepSeek Harness.exe"          # 安装目录下的可执行文件
$pnpm = "C:\Software\DeepSeek Harness\resources\runtime\pnpm\bin\pnpm.mjs"

$env:ELECTRON_RUN_AS_NODE = "1"
$env:DSH_DESKTOP_NODE_EXECUTABLE = $exe
$env:PATH = "C:\Software\DeepSeek Harness\resources\runtime\bin;$env:PATH"
& $exe --expose-internals $pnpm install --dir $prof
```

`dsh.profile.bundles` 里还要有 `dsh-theme-animal-island-ui`，否则包装了也不会挂载。

离线验证组合结果（不必启动客户端）。桌面宿主用的就是
`loadProfileDirectory(binName, dir, installAnchor)`，可以直接调它并打印被跳过的组合包：

```js
const boot = await import('file:///C:/Software/DeepSeek%20Harness/resources/app.asar/dsh/node_modules/@deepseek-ai/dsh-app-boot/lib/index.js')
const profile = boot.loadProfileDirectory(
  'dsh',
  process.env.USERPROFILE + '\\.dsh\\profiles\\desktop',
  'C:\\Software\\DeepSeek Harness\\resources\\app.asar\\dsh\\node_modules\\@deepseek-ai\\dsh\\package.json',
)
console.log(profile.skippedBundles, profile.layers.map((layer) => layer.packageName))
```

期望 `skippedBundles: []`，且 `layers` 末尾是本主题。普通 node 读不了 asar 里的模块，这一步同样要用
上面的 Electron-as-node 环境跑。

回滚：把依赖指回上一版的 `.tgz` 再 `pnpm install` 即可（`artifacts/README.md` 的表格里记着当前的
规范产物与上一版目录）。

## 版本兼容门禁

- `loadProfileDirectory` 在启动时与每次重组时都会检查**组合包自己声明的 DSH peer**；不兼容且没有豁免
  的组合包会被跳过（与读不到的组合包同等待遇），并出现在 `skippedBundles` 里。
- 豁免写在 profile 自己的 `compatibility.json`（与 `package.json`、`cordis.patch.yml` 并列），把精确的
  `package-name@version` 映射到精确的 DSH runtime 版本；授权与风险确认由插件管理器负责。
- 本主题不声明 `peerDependencies`，所以不受这条门禁影响。但要注意**开发基线与桌面 runtime 可能不同**：
  仓库锁的是 `0.1.5-rc.3`，桌面内置的是 `0.2.1-rc.5`。桌面打包时剥掉了 `lib/types/**`，因此
  `scripts/check-compat.mjs` 不能直接对着桌面包跑（它读 `lib/types/client/index.d.ts` 拿
  `overrideTokens` 的返回类型）。要对桌面版做接缝检查，先把类型声明补出来，或临时把基线
  devDependency 升到桌面 runtime 的版本。

## 什么时候要重启

- **新增或删除**组合包：要重启。runtime resolution 由 launcher 在启动时计算并装进 Node 的解析器，
  运行中的 HMR 重组补不上这一层。
- **就地更新**已挂载组合包的内容（例如换掉同名的 `.tgz` 后重装）：通常不用重启。desktop profile 里
  `dsh-hmr` 是启用的（`runProfile` 会提供 `profileContext`，它的那一行就不会被 `disabled`），
  `dsh-client-hmr` 会把新的客户端 bundle 推到渲染端就地替换。0.3.4 → 0.3.5 这次就是这样生效的。

## 对着桌面 runtime 跑夹具

桌面 runtime 在 `app.asar` 里，先抽出一个夹具能用的目录：需要
`node_modules/@deepseek-ai/dsh-web-frontend/dist/assets/*.css`，以及夹具 `pluginCss` 里列出的
`dsh-client-ui-*/lib/client.js` 与 `dsh-client-ui-theme/lib/client.js`。

```sh
node scripts/fixture.mjs sidebar-brand-desktop --dsh <抽出来的目录>
```

夹具 `body.html` 里的 hash 前缀取自当前桌面 runtime（`0.2.1-rc.5` 是 `wtg9ga_`）；桌面升级后要同步
更新这一处，否则真实 CSS 不命中，夹具会渲染成没有样式的样子。

抽 asar 时注意头部偏移 —— **`dataStart = 8 + readUInt32LE(4)`**，不是
`8 + readUInt32LE(12)`：后者会早 8 字节，读出来的 JSON 带一段垃圾前缀、文件尾部被截掉，而且包的
`package.json` 会直接解析失败。

## 桌面侧已知差异

- `[data-windows-titlebar]`：logoRow 变成 40px 且没有内边距，折叠按钮改成 `position: fixed`，
  `brandIdentity` / `brandMark` 各带一个 1px transform。
- 侧栏品牌区落在 DSH 自己的 24px 品牌盒里，那个盒子 `overflow: hidden` —— 预算约束见
  [compatibility.md](compatibility.md) 的「品牌字标预算」。
