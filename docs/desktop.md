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
$pnpm = "C:\Software\DeepSeek Harness\resources\runtime\primary-runtime\dependencies\pnpm\bin\pnpm.mjs"

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

桌面 runtime 在 `app.asar` 里，fixture runner 会按需解包并缓存：

```sh
pnpm run fixture sidebar-masthead --desktop
# 非默认安装位置
pnpm run fixture sidebar-masthead --asar "C:\path\to\app.asar"
```

缓存位于 `.tmp/dsh-runtime/<size-mtime>/dsh`，同一桌面构建会直接复用。首次运行可能下载
`@electron/asar`。夹具 `body.html` 里的 hash 前缀取自当前桌面 runtime（`0.2.1-rc.5` 是
`wtg9ga_`）；桌面升级后要同步更新，否则真实 CSS 不命中，夹具会渲染成没有样式的样子。

## 截图与远程调试

不要用 `CopyFromScreen` 抓桌面窗口：它抓的是屏幕，被别的窗口挡住就拍到别人。`PrintWindow` 只能当
背景参考：Electron 的 GPU 文字/滤镜层经常画不进 GDI DC，会出现“背景对、字没了”的假图。正确做法是
抓渲染器的合成表面：

- **日常主题/CSS 检查**：用 web 客户端（同一个 client bundle），Playwright/CDP 截图，跟窗口 z-order
  无关；Windows 专属分支可以在页面里模拟 `data-windows-titlebar`。
- **桌面壳专属检查**（caption、窗口按钮、原生圆角、acrylic）：给 Electron 开 CDP 端口，再走
  `Page.captureScreenshot`。这是一次性的启动参数，之后随时能抓，窗口在后台也行。

### 1. 调试启动（需要先退出正在运行的客户端）

```bat
scripts\dsh-desktop-debug.cmd
```

或从仓库根目录：

```sh
pnpm run desktop:debug
```

它会用 `--remote-debugging-port=9222` 启动客户端，并确认 `http://127.0.0.1:9222/json/list` 可访问。
如果客户端已经在运行，脚本会拒绝启动并提示先退出——调试端口只在启动时生效，单实例不会把参数补上。
端口只监听 localhost，但本地进程能控制这个窗口；只在调试时开。

### 2. 截图

```powershell
# 仓库根目录的快捷方式（等价于下面的 capture-desktop.ps1）
pnpm run capture:desktop

# CDP 优先；没有调试端口时自动回退到 DWM
powershell -ExecutionPolicy Bypass -File scripts\capture-desktop.ps1

# 指定输出、整页
powershell -ExecutionPolicy Bypass -File scripts\capture-desktop.ps1 `
  -OutFile artifacts\smoke\desktop.png -FullPage

# 只走 CDP，不降级
powershell -ExecutionPolicy Bypass -File scripts\capture-desktop.ps1 -NoFallback
```

脚本先调用 `scripts/cdp-shot.mjs`（Node 22+ 的全局 WebSocket，无额外依赖；Node 20 需加 `--experimental-websocket`）；失败时用
`scripts/dwm-shot.ps1` 把目标窗口注册成离屏 DWM 缩略图再截宿主。DWM 路径被其它窗口挡住也能拍，
最小化时可能冻结/空白；它走 Windows PowerShell 5.1，因为 pwsh 7 的 .NET 10 WinForms/GDI+ 引用链
不值得维护。

两者覆盖的范围不同：**CDP 截的是 web 内容**（不含 native caption/titleBarOverlay），**DWM 截的是
整个窗口**（含原生标题栏）。验主题表面用 CDP；验 caption/窗口按钮用 DWM。

## 桌面侧已知差异

- `[data-windows-titlebar]`：logoRow 变成 40px 且没有内边距，折叠按钮改成 `position: fixed`，
  `brandIdentity` / `brandMark` 各带一个 1px transform。
- Windows 外壳的 AppFrame（`.frame`）被画成 `--dsw-specific-sidebar-fill`，而 macOS 给同一个
  frame 的是 `background: 0 0`。这块不透明底会把插件画在 UI 后面的画布盖掉，所以皮肤在
  `html[data-windows-titlebar]` 下把它清成透明；侧栏/右栏各自重画自己的表面，不影响可读性。
  这是 DSH Windows 分支与 macOS 不一致导致的（[discussion #9490](https://github.com/deepseek-ai/deepseek-harness/discussions/9490)），
  在 DSH 修掉之前需要保留这条 workaround。
- 侧栏品牌区落在 DSH 自己的品牌按钮里：按钮本体只有 24px 高、`overflow: hidden`，而主题把
  logoRow 长到 80px、把按钮做成 216×60 的渡岛船票，并把内层 24px 盒释放成 auto。Windows 分支给
  `brand` 的 4px 左内边距由主题清零，票根才能贴住纸面边缘；约束与测试见
  [compatibility.md](compatibility.md) 的「品牌船票」。
- 其余 web / Windows 样式差异（标题栏、折叠侧栏、右栏全屏、dock float、macOS）统一登记在
  [web-vs-desktop.md](web-vs-desktop.md)，改皮肤前先对照那张表判断是平台分支还是主题问题。
