# 发布产物

当前唯一规范产物：

```text
release-v0.2.5/dsh-theme-animal-island-ui-0.2.5.tgz
SHA-256: 9A037D413031758E925A7EB5639A0FE7D5D17121D057AAFBE87DFDD4E4141FD8
```

其他 `0.1.x` 和早期 `0.2.x` 目录是历史归档，不应安装、发布或作为高还原 skin 验收依据。规范产物由 `pnpm pack --pack-destination artifacts/release-v0.2.5` 生成，`prepack` 会先清空并重建 `lib`。
