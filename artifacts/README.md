# 发布产物

当前唯一规范产物：

```text
release-v0.2.7/dsh-theme-animal-island-ui-0.2.7.tgz
SHA-256: C425748CC8C30FDC6D4BB6095760757CB40EEA4A9B944D9977414B05CE76B076
```

其他 `0.1.x` 和早期 `0.2.x` 目录是历史归档，不应安装、发布或作为高还原 skin 验收依据。规范产物由 `pnpm pack --pack-destination artifacts/release-v0.2.7` 生成，`prepack` 会先清空并重建 `lib`。
