# 发布产物

当前唯一规范产物：

```text
release-v0.3.3/dsh-theme-animal-island-ui-0.3.3.tgz
SHA-256: E8E097A45ACB806DAB6E595FB94A59E8749ABA6813C8DE9F5D630B377ECD4080
```

其他 `0.1.x`、`0.2.x` 和早期 `0.3.x` 目录是历史归档，不应安装、发布或作为高还原 skin 验收依据。规范产物由 `pnpm pack --pack-destination artifacts/release-v0.3.3` 生成，`prepack` 会先清空并重建 `lib`。
