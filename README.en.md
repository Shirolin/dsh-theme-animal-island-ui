# DSH Animal Island Theme · Animal Island UI

[简体中文](README.md) · [Showcase & Live Demo](https://shirolin.github.io/dsh-theme-animal-island-ui/) · Author: [Shirolin](https://github.com/Shirolin)

[![check](https://github.com/Shirolin/dsh-theme-animal-island-ui/actions/workflows/check.yml/badge.svg?branch=main)](https://github.com/Shirolin/dsh-theme-animal-island-ui/actions/workflows/check.yml)
[![npm](https://img.shields.io/npm/v/dsh-theme-animal-island-ui)](https://www.npmjs.com/package/dsh-theme-animal-island-ui)
[![release](https://img.shields.io/github/v/release/Shirolin/dsh-theme-animal-island-ui?display_name=tag)](https://github.com/Shirolin/dsh-theme-animal-island-ui/releases)
[![license: MIT](https://img.shields.io/badge/license-MIT-f3c969.svg)](LICENSE)

`Animal Island UI` is a theme plugin for DeepSeek Harness (Web and Windows Desktop), visually inspired by the open-source component library [animal-island-ui](https://github.com/guokaigdg/animal-island-ui).

Because a coding workspace is meant for hours of reading diffs and logs, directly copying high-saturation game colors quickly causes eye strain. This theme focuses on calm reading surfaces and strict layout boundaries: conversations and code sit on low-contrast cream paper and warm wood tones, while peripheral chrome—the sidebar boarding pass, wooden header ribbon, and speech-bubble composer—carries the tactile notebook character. All changes stay within CSS tokens and public slots, leaving DSH's native layouts, shortcuts, and interactions untouched.

> [!NOTE]
> This is an independent open-source community plugin with no affiliation, endorsement, or sponsorship from DeepSeek or Nintendo. It builds solely on DSH's public ThemeRuntime tokens and slots without proprietary game assets, and degrades safely to default DSH styles across upstream upgrades.

---

## Preview

![DSH Animal Island Theme · by Shirolin](docs/screenshots/theme-poster.webp)

<details>
<summary>Expand: Day & Night workspace and sidebar (rendered from real DSH DOM fixtures)</summary>

| Day Mode (Light) | Night Mode (Dark) |
| --- | --- |
| ![Day workspace](docs/screenshots/workspace-light.webp) | ![Night workspace](docs/screenshots/workspace-dark.webp) |
| ![Day sidebar](docs/screenshots/sidebar-light.webp) | ![Night sidebar](docs/screenshots/sidebar-dark.webp) |

</details>

---

## Design & Architecture

- **Day & Night Canvases**
  - **Light**: Dual-grid polka-dot lawn, bottom wave border, and low-opacity floating leaves behind a translucent cream reading sheet.
  - **Dark**: A dedicated night palette pairing a deep teal starry canvas and cool slate sidebar with warm brown reading surfaces and dark timber code blocks.
- **Notebook Chrome & Tactile Details**
  - **Boarding-Pass Masthead**: Expands DSH's `24px` new-session button into a `216×60` ferry ticket with cream paper, a mint counterfoil, and a perforated tear seam.
  - **Wooden Signs & Speech Bubble**: Wooden header ribbons, vertical wood-grain active rows in the sidebar, and a speech-bubble composer with subtle paper grain.
  - **Focus & Press Feedback**: Tactile bottom borders on primary buttons and a `2px` inset mint focus ring that stays visible inside clipped scroll containers.
- **In-App Appearance Settings**
  - Available under **Settings → Plugins → Animal Island Appearance**, offering three presets (*Paper*, *Balanced*, *Island*) and a `0.15–0.60` canvas veil slider with live layered preview.
  - Independent toggles for **Decorative Illustrations**, **Paper Grain**, **Light Diff Syntax** (Warm / DSH Native), and **UI Font** (bundled Nunito Latin vs. system font stack), stored per client in `localStorage`.
- **Implementation Boundaries**
  - Covers 118 `ThemeRuntime` tokens and 4 public slots without DOM polling, `MutationObserver`, or build-time hashed class names.
  - Bundled Nunito WOFF2 fonts and original SVG artwork are inlined at build time with zero runtime network requests.

---

## Installation

Keep only one theme plugin enabled per profile.

### Option 1: Plugin Marketplace

Open **Settings → Plugins** in DSH, search for **`Animal Island UI`**, install, and restart the app.

### Option 2: Install via NPM into a Profile

Run inside your target DSH profile directory:

```sh
cd <dsh-profile-directory>
pnpm add dsh-theme-animal-island-ui
```

Restart the DSH service completely and refresh the browser.

### Option 3: Offline Release Tarball

Download the `.tgz` tarball and `SHA256SUMS` from [GitHub Releases](https://github.com/Shirolin/dsh-theme-animal-island-ui/releases):

```sh
cd <dsh-profile-directory>
pnpm add file:<download-directory>/dsh-theme-animal-island-ui-<version>.tgz
```

### Windows Desktop (Electron)

DSH Desktop uses an isolated `desktop` profile managed by its bundled Electron Node runtime. See [Desktop Client Guide (docs/desktop.md)](docs/desktop.md) for installation, HMR updates, and rollback steps.

From a local clone of this repository, you can pack and sync into both `web` and `desktop` profiles in one step:

```sh
pnpm install
pnpm run install:local
```

---

## Development & Verification

Requires **Node.js ≥ 22.13** and **pnpm 11.1.2**.

```sh
pnpm install
pnpm run build          # Build client bundle and type declarations into lib/
pnpm run check          # Full gate: site check + typecheck + build + tests + DSH compat check
pnpm run format         # Format with Biome
pnpm run lint           # Lint with Biome
```

**Offscreen DOM Fixtures** (renders real DSH CSS in Headless Chrome, runs in-browser assertions, and writes screenshots to `artifacts/smoke/`):

```sh
pnpm run fixture sidebar-masthead            # Render fixture (auto-detects local Web or Desktop DSH runtime)
pnpm run fixture boot-loading --desktop      # Explicitly extract and use desktop app.asar runtime
pnpm run check:visual                        # Run the sidebar ticket geometry & style gate
pnpm run check:fixtures                      # Run every fixture; add -- --expect-dsh <version> to pin the runtime
```

**Subpath Exports** (for external tools reusing the palette or contrast utilities):

```ts
import { ANIMAL_ISLAND_PALETTES } from 'dsh-theme-animal-island-ui/palette'
import { buildTokenOverrides, contrastRatio } from 'dsh-theme-animal-island-ui/tokens'
```

---

## Documentation

- [Design Language & Style Boundaries (docs/design.md)](docs/design.md): Palette tables, dark-mode derivation, component geometry, and off-limits selectors
- [DSH Compatibility Contract (docs/compatibility.md)](docs/compatibility.md): Reviewed public slots, `data-*` / ARIA seams, and fixture runner usage
- [Desktop Client Guide (docs/desktop.md)](docs/desktop.md): Electron profile isolation, installation/rollback, and CDP / DWM screenshot workflows
- [Web vs. Desktop Differences (docs/web-vs-desktop.md)](docs/web-vs-desktop.md): Cross-platform titlebars, collapsed sidebar behavior, and historical fixes
- [Blank Session List Diagnosis (docs/session-list-blank.md)](docs/session-list-blank.md): Root-cause analysis of a DSH persisted-store snapshot mismatch
- [Community Theme Settings Survey (docs/research/theme-settings-survey.md)](docs/research/theme-settings-survey.md): Survey of 12 community themes and rationale for our configuration surface
- [Changelog (CHANGELOG.md)](CHANGELOG.md): Release history

---

## Contributing & Security

- Read [Contributing Guide (CONTRIBUTING.md)](CONTRIBUTING.md) before opening a pull request for seam registration rules and visual verification workflows.
- Please follow our [Code of Conduct (CODE_OF_CONDUCT.md)](CODE_OF_CONDUCT.md).
- To report a security issue, follow [Security Policy (SECURITY.md)](SECURITY.md) via private advisory rather than a public issue.

---

## License & Attribution

Released under the [MIT License](LICENSE).

- **Visual Inspiration**: Thanks to [@guokaigdg](https://github.com/guokaigdg) for the open-source [animal-island-ui](https://github.com/guokaigdg/animal-island-ui) (MIT) component library, which inspired the color relationships and stationery motifs of this theme.
- **Bundled Font**: Nunito is licensed under the [SIL Open Font License 1.1](licenses/Nunito-OFL.txt).
- **Asset Notice**: All code, SVG artwork, and audio in this repository are written independently against DSH's public extension APIs without copying upstream source code or proprietary game assets. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for details.

---

## Support & Related Projects

If this theme makes your daily workspace more pleasant, consider starring the repository or supporting maintenance:

- **Afdian (爱发电)**: [https://ifdian.net/a/shirolin](https://ifdian.net/a/shirolin)
- **Ko-fi**: [https://ko-fi.com/shirolin](https://ko-fi.com/shirolin)
- **More from the author**: [PostPress](https://github.com/Shirolin/postpress) — A browser extension that formats X (Twitter) posts and threads into clean paper-styled cards.
