# 发布产物

当前唯一规范产物：

```text
release-v0.3.37/dsh-theme-animal-island-ui-0.3.37.tgz
```

本机产物由 `pnpm run release <version>`（内部 `pnpm pack`）生成，`prepack` 会先清空并重建 `lib`，同一版本号不要重复出包。

**校验值不记录在本文件里。** `pnpm pack` 的 gzip 流因平台而异（同一份 `HEAD` 出包时文件内容与条目顺序相同、字节不同），任何本机算出的 SHA-256 都不等于发布产物。已发布版本的 SHA-256 以 GitHub Release 说明中的「产物校验」段和随附的 `SHA256SUMS` 为准，由发布工作流在 Linux 上出包后计算。

## 目录说明

| 目录 | 内容 | 是否可用于验收 |
| --- | --- | --- |
| `release-v0.3.37/` | 当前规范产物 | 是 |
| `release-v0.3.34/` | 上一版，profile 回滚用 | 仅回滚 |
| `release-v0.3.30/` 及更早版本、`release/`、`release-final/`、`final/`、`dsh-theme-animal-island-ui-0.1.0.tgz` | 历史归档，含早期重复的 0.1.0 包 | 否 |
| `smoke/` | 离屏夹具截图（回归证据，随 `*-smoke.png` 一起被 git 忽略） | 参考 |
| `consumer-check/` | 消费端类型检查夹具（`node_modules` 已清理，可重新 `pnpm install`） | 工具 |

历史目录只作留档：不应安装、不应发布，也不应作为高还原 skin 的验收依据。任何需要复核的结论都以对应版本目录里的 tgz + `docs/design.md` 的边界规则为准。






