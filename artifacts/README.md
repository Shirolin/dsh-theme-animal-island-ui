# 发布产物

当前唯一规范产物：

```text
release-v0.1.3/dsh-theme-animal-island-ui-0.1.3.tgz
SHA-256: B08D75A0DCFB5EF939463778CBA6670DB4046288E1E64CE9565BC58B9E16160B
```

其他 `0.1.0`～`0.1.2` 目录是修正前生成的本地历史归档，不应安装、发布或作为验收依据。规范产物由 `pnpm pack --pack-destination artifacts/release-v0.1.3` 生成，`prepack` 会自动重建 `lib`。
