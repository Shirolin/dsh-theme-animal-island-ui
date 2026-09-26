# 发布产物

当前唯一规范产物：

```text
release-v0.3.1/dsh-theme-animal-island-ui-0.3.1.tgz
SHA-256: A2FC5E4CB7B7C6A095813E6B42776520FDAFE2E5462A19534B6C45BFF0896FD2
```

其他 `0.1.x` 和早期 `0.2.x` 目录是历史归档，不应安装、发布或作为高还原 skin 验收依据。规范产物由 `pnpm pack --pack-destination artifacts/release-v0.3.1` 生成，`prepack` 会先清空并重建 `lib`。
