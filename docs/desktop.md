# 桌面客户端（Electron）指南

DSH 官方桌面版并非另一套独立前端：它内置与 Web 版相同的 `dsh-web-app` 与 `dsh-web-frontend`，外加一层 Electron 窗口外壳和一个隔离的 `desktop` profile。本文记录在桌面端安装、调试、截图与回滚本主题的具体方法。

## 运行机制与 Profile 隔离

- **外壳与运行时**：桌面端外壳为 `@deepseek-ai/dsh-desktop`（Electron），内置运行时 `@deepseek-ai/dsh-desktop-runtime`（本文验证基线为 `0.2.1-rc.5`）。宿主启动时直接执行：
  ```js
  runProfile({ profile: "desktop", args: ["--no-open", "--port", "19387"] })
  ```
- **平台声明**：客户端模块加载器仍只识别 `dsh.client.platform === "web"`，因此本主题无需为桌面版拆分独立构建。
- **目录隔离**：桌面端读取 `~/.dsh/profiles/desktop`，与 `~/.dsh/profiles/web` 的 `node_modules` 完全隔离。装在 `web` profile 下的插件不会在桌面端生效。
- **CLI 限制**：DSH CLI 不允许直接操作 `desktop` profile（执行 `dsh --profile desktop ...` 会报错 `profile "desktop" is managed exclusively by the Electron application`）。除通过应用内插件市场安装外，本地离线或源码安装均需借用桌面端自带的 Electron Node 运行时。

## 安装、同步与回滚

### 1. 本地仓库一键同步（推荐）

如果已在本地克隆本仓库，可直接运行内置脚本，自动打包并通过内容寻址缓存同步到本机的 `desktop` 与 `web` 两个 profile：

```sh
pnpm run install:local                 # 同时同步 desktop 与 web
pnpm run install:local --only desktop  # 仅同步桌面端 profile
pnpm run install:local --dry-run       # 仅预览将修改的依赖配置
```

脚本会自动补齐 profile `package.json` 中的 `dsh.profile.bundles`，并在桌面端自动调用内置的 Electron Node 运行时执行 `pnpm install`。若安装或校验失败，脚本会将 profile 的 `package.json` 恢复至修改前状态。

- 桌面客户端安装在非默认路径时，可通过环境变量 `DSH_DESKTOP_APP` 指定目录；
- 可通过 `DSH_THEME_TARBALL` 指定任意 `.tgz` 包路径。

### 2. 手动调用桌面端内置 pnpm

若需手动在 `~/.dsh/profiles/desktop` 下执行 `pnpm`，需将 Electron 可执行文件作为 Node 运行时传入（profile 生命周期脚本依赖该环境）：

```powershell
$prof = "$env:USERPROFILE\.dsh\profiles\desktop"
$exe  = "C:\Software\DeepSeek Harness\DeepSeek Harness.exe"
$pnpm = "C:\Software\DeepSeek Harness\resources\runtime\primary-runtime\dependencies\pnpm\bin\pnpm.mjs"

$env:ELECTRON_RUN_AS_NODE = "1"
$env:DSH_DESKTOP_NODE_EXECUTABLE = $exe
$env:PATH = "C:\Software\DeepSeek Harness\resources\runtime\bin;$env:PATH"
& $exe --expose-internals $pnpm install --dir $prof
```

同时确保 `$prof\package.json` 的 `dsh.profile.bundles` 数组中包含 `"dsh-theme-animal-island-ui"`。

### 3. 离线验证挂载状态

无需启动 GUI 窗口，可直接用上面的 Electron-as-Node 环境调用 `loadProfileDirectory` 检查主题是否被正常解析：

```js
const boot = await import('file:///C:/Software/DeepSeek%20Harness/resources/app.asar/dsh/node_modules/@deepseek-ai/dsh-app-boot/lib/index.js')
const profile = boot.loadProfileDirectory(
  'dsh',
  process.env.USERPROFILE + '\\.dsh\\profiles\\desktop',
  'C:\\Software\\DeepSeek Harness\\resources\\app.asar\\dsh\\node_modules\\@deepseek-ai\\dsh\\package.json',
)
console.log(profile.skippedBundles, profile.layers.map((layer) => layer.packageName))
```

正常挂载时 `skippedBundles` 为空数组 `[]`，且 `layers` 列表末尾包含 `dsh-theme-animal-island-ui`。

### 4. 何时需要重启客户端

- **首次安装或移除插件**：必须完整退出并重启桌面客户端。模块解析表在主进程启动时构建，运行期无法动态增删包入口。
- **就地更新已挂载插件**：通常无需重启。`desktop` profile 默认启用了 `dsh-hmr`，重装更新后的客户端 bundle 会由 `dsh-client-hmr` 推送至渲染进程热替换。

### 5. 回滚版本

将 profile `package.json` 中的依赖指向上一版本的 `.tgz`（或 npm 版本号），重新运行一次 `pnpm run install:local`（或上述手动安装命令）即可。

## 版本兼容与类型检查说明

- `loadProfileDirectory` 启动时会核对插件声明的 `peerDependencies`。本主题未声明硬性 `peerDependencies`，因此不会被版本门禁跳过。
- 桌面端 `app.asar` 打包时剥离了 `.d.ts` 类型声明文件，因此依赖读取 `lib/types/client/index.d.ts` 的 `pnpm run check:compat` 默认针对仓库锁定的 `devDependencies` 运行，而不直接指向 `app.asar` 解包目录。

## 使用桌面端运行时渲染离屏夹具

离屏夹具脚本支持直接解包桌面客户端的 `app.asar` 提取真实 CSS：

```sh
pnpm run fixture sidebar-masthead --desktop
# 或指定自定义安装位置的 app.asar
pnpm run fixture sidebar-masthead --asar "C:\path\to\app.asar"
```

解包产物按 `app.asar` 的文件大小与修改时间缓存在 `.tmp/dsh-runtime/<size-mtime>/dsh` 下，同一版本的桌面客户端只会解包一次。

## 桌面窗口截图与远程调试

对 Electron 窗口截图时，`CopyFromScreen` 会拍到遮挡窗口，而 GDI `PrintWindow` 常丢失 GPU 合成层导致文字缺失。项目中提供两条可靠的采集路径：

- **CDP 截图（`scripts/cdp-shot.mjs`）**：通过 Chrome DevTools Protocol 抓取渲染器内部画面，不受窗口遮挡影响，适合验证网页内部表面（不含 Windows 原生标题栏与窗口控制按钮）。
- **DWM 离屏缩略图（`scripts/dwm-shot.ps1`）**：通过 Windows DWM API 注册窗口缩略图采集完整窗口（包含原生 `titleBarOverlay` 标题栏与右上角按钮），后台无遮挡亦可截取（最小化时除外）。

### 1. 以调试模式启动客户端（需先退出已运行的实例）

```sh
pnpm run desktop:debug
```

脚本会携带 `--remote-debugging-port=9222` 启动桌面端，并验证 `http://127.0.0.1:9222/json/list` 就绪。

### 2. 执行截图

```powershell
# 默认优先使用 CDP，未开启调试端口时自动回退至 DWM
pnpm run capture:desktop

# 指定输出路径与整页截取
powershell -ExecutionPolicy Bypass -File scripts\capture-desktop.ps1 `
  -OutFile artifacts\smoke\desktop.png -FullPage

# 强制仅使用 CDP
powershell -ExecutionPolicy Bypass -File scripts\capture-desktop.ps1 -NoFallback
```

## 桌面端特有的样式差异

Windows 桌面端带有 `[data-windows-titlebar]` 标记，存在三处与 Web 端不同的外壳特征（完整对照表见 [web-vs-desktop.md](web-vs-desktop.md)）：

1. **外层 Frame 底色**：Windows 分支下的 `.frame` 默认带不透明的 `--dsw-specific-sidebar-fill`（macOS 与 Web 端为透明），会挡住底层画布。主题在 `html[data-windows-titlebar]` 下将其显式清为透明（参考上游讨论 [#9490](https://github.com/deepseek-ai/deepseek-harness/discussions/9490)）。
2. **原生标题栏供色**：顶部 `40px` 标题栏由 Electron 原生 `titleBarOverlay` 绘制，通过读取 `body` 上的 `--dsw-specific-sidebar-fill` 同步颜色。主题利用 `body`、`#root` 与侧栏根节点的三级覆盖，分别维持标题栏、侧栏与画布的独立色彩层级。
3. **侧栏品牌按钮内边距**：Windows 分支为未折叠的品牌按钮增加了 `4px` 左内边距，主题将其清零以保证船票左缘票根对齐。
