# 发布产物

当前唯一规范产物：

```text
release-v0.3.4/dsh-theme-animal-island-ui-0.3.4.tgz
SHA-256: 1F5BAFE64673E3786D5E2E14A68744E128A4294BAA91AAF86787AEF5FB635315
```

其他 `0.1.x`、`0.2.x` 和早期 `0.3.x` 目录是历史归档，不应安装、发布或作为高还原 skin 验收依据。规范产物由 `pnpm pack --pack-destination artifacts/release-v0.3.4` 生成，`prepack` 会先清空并重建 `lib`。
