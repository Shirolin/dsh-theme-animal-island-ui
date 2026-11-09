# 发布产物

当前唯一规范产物：

```text
release-v0.3.37/dsh-theme-animal-island-ui-0.3.37.tgz
SHA-256: C012B59CD2436EB8ABEE68F5258B7832D6635CDE7BE3FBA18AE033EA01278B91
```

规范产物由 `pnpm pack --pack-destination artifacts/release-v0.3.37` 生成，`prepack` 会先清空并重建 `lib`。重新出包后请同步更新上面的 SHA；同一版本号不要重复出包。

上面的 SHA 是**发布工作流在 Linux runner 上出包**的字节值。同一份 `HEAD` 在 Windows 与 Linux 上 `pnpm pack` 得到的**文件内容与条目顺序完全一致**，只有 gzip 流不同，因此本机出包的 SHA 必然与 CI 不同；不要用本机 SHA 覆盖这里，发布失败时以 CI 日志里 `Verify release metadata` 报告的值（或容器内 `node:24` + pnpm 11.1.2 出包的结果）为准。

## 目录说明

| 目录 | 内容 | 是否可用于验收 |
| --- | --- | --- |
| `release-v0.3.37/` | 当前规范产物 | 是 |
| `release-v0.3.34/` | 上一版，profile 回滚用 | 仅回滚 |
| `release-v0.3.30/` 及更早版本、`release/`、`release-final/`、`final/`、`dsh-theme-animal-island-ui-0.1.0.tgz` | 历史归档，含早期重复的 0.1.0 包 | 否 |
| `smoke/` | 离屏夹具截图（回归证据，随 `*-smoke.png` 一起被 git 忽略） | 参考 |
| `consumer-check/` | 消费端类型检查夹具（`node_modules` 已清理，可重新 `pnpm install`） | 工具 |

历史目录只作留档：不应安装、不应发布，也不应作为高还原 skin 的验收依据。任何需要复核的结论都以对应版本目录里的 tgz + `docs/design.md` 的边界规则为准。






