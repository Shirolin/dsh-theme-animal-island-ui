# 发布产物

当前唯一规范产物：

```text
release-v0.3.4/dsh-theme-animal-island-ui-0.3.4.tgz
SHA-256: F3B02F51502FBDAE3817DBCD4A50ED512C121C574F3C970DCF2F9D65726D3FEC
```

规范产物由 `pnpm pack --pack-destination artifacts/release-v0.3.4` 生成，`prepack` 会先清空并重建 `lib`。重新出包后请同步更新上面的 SHA；若该版本已经分发过，请改版本号而不是原地重打。

## 目录说明

| 目录 | 内容 | 是否可用于验收 |
| --- | --- | --- |
| `release-v0.3.4/` | 当前规范产物 | 是 |
| `release-v0.3.3/` | 上一版，profile 回滚用 | 仅回滚 |
| `release-v0.1.x` – `release-v0.3.2`、`release/`、`release-final/`、`final/`、`dsh-theme-animal-island-ui-0.1.0.tgz` | 历史归档，含早期重复的 0.1.0 包 | 否 |
| `smoke/` | 离屏夹具截图（回归证据，随 `*-smoke.png` 一起被 git 忽略） | 参考 |
| `consumer-check/` | 消费端类型检查夹具（`node_modules` 已清理，可重新 `pnpm install`） | 工具 |

历史目录只作留档：不应安装、不应发布，也不应作为高还原 skin 的验收依据。任何需要复核的结论都以对应版本目录里的 tgz + `docs/design.md` 的边界规则为准。



