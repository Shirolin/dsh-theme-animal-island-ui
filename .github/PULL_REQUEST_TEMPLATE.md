## 这个 PR 做了什么

<!-- 一句话说明；一次 PR 只做一件事 -->

## 为什么这样改

<!-- 说清动机。若是视觉改动，说明为什么不越界（见 docs/design.md 的「样式边界」） -->

## 验证

- [ ] `pnpm run check` 通过（typecheck + build + 测试 + 兼容性检查）
- [ ] `pnpm run format:check` 与 `pnpm run lint` 通过
- [ ] 视觉改动附前后对照截图（`node scripts/fixture.mjs <夹具名>` 产出，放 `artifacts/smoke/`）
- [ ] 面向用户的变化已写进 `CHANGELOG.md`
- [ ] 新增接缝已在 `scripts/seam-contract.mjs` 登记，并同步 `docs/compatibility.md`

## 影响面

<!-- 涉及的 DSH 表面（composer / dialog / 菜单 / 侧栏 / 代码块 …）；是否改动公开契约 -->
