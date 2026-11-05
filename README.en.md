# DSH Animal Island Theme

[简体中文](README.md) · [Official Site](https://shirolin.github.io/dsh-theme-animal-island-ui/) · [30-Second Film](https://shirolin.github.io/dsh-theme-animal-island-ui/#film) · by [Shirolin](https://github.com/Shirolin)

[![check](https://github.com/Shirolin/dsh-theme-animal-island-ui/actions/workflows/check.yml/badge.svg?branch=main)](https://github.com/Shirolin/dsh-theme-animal-island-ui/actions/workflows/check.yml)
[![release](https://img.shields.io/github/v/release/Shirolin/dsh-theme-animal-island-ui?display_name=tag)](https://github.com/Shirolin/dsh-theme-animal-island-ui/releases)
[![license: MIT](https://img.shields.io/badge/license-MIT-f3c969.svg)](LICENSE)

`Animal Island UI` is an Animal Island–inspired theme plugin for DeepSeek Harness (Web and Windows Desktop). It brings a boarding-pass masthead, cream notebook paper, wooden sign badges, and a starry night island into your workspace—while keeping every DSH session, setting, composer, layout, and shortcut working as expected.

> [!NOTE]
> This is an independent community project with no official affiliation with DeepSeek. The theme builds strictly on public ThemeRuntime tokens and slots so DSH upgrades degrade gracefully without breaking the UI.

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

## Highlights

- 🏝️ **Day & Night Islands**
  - **Daytime**: Polka-dot turf, water ripples, and floating leaves paired with warm, high-contrast cream notebook paper.
  - **Nighttime**: A custom-drawn starry sky, moonlight, and fireflies with a deep-teal sidebar and warm-brown reading surfaces.
- 🎫 **Tactile Notebook Craft & Micro-interactions**
  - **Boarding-Pass Masthead**: A `216×60` cream-and-mint boarding pass with a perforated stub in the public brand slot.
  - **Wooden Signs & Bubble Composer**: Wooden ribbon headers, sign-badge active states, speech-bubble composer, and paper-grain dialogs.
  - **Keyboard & Press Feedback**: 3D cream primary buttons, breathing composer glow, and 2px inset mint focus rings that never clip inside scroll views.
- 🎛️ **In-App Appearance Settings**
  - Built into **Settings → Plugins → Animal Island Appearance** with three presets (`0.52` / `0.40` / `0.28`), a `0.15–0.60` canvas-strength slider, and a live layered preview.
  - Individual toggles for **canvas illustrations**, **paper grain**, and **UI font** (bundled Nunito Latin or native system stack), stored locally per client.
- 🛡️ **Non-Intrusive & Self-Contained**
  - Bundled Nunito WOFF2 fonts and original SVG artwork with zero runtime network requests.
  - Verified by contract tests across 118 ThemeRuntime tokens, public slots, ARIA/data hooks, and headless Chrome DOM fixtures.

---

## Quick Start

### 1. Download the Release Tarball

Download the latest `.tgz` package and `SHA256SUMS` from [GitHub Releases](https://github.com/Shirolin/dsh-theme-animal-island-ui/releases) and verify the checksum.

### 2. Install into DSH Web Profile

Install the tarball into your target DSH profile directory:

```sh
cd <dsh-profile-directory>
pnpm add file:<download-directory>/dsh-theme-animal-island-ui-<version>.tgz
```

Restart DSH Web completely and refresh the browser. Only one theme plugin should be active in a profile at a time.

### 3. Windows Desktop (Electron)

DSH Desktop uses an isolated `desktop` profile managed by its bundled Electron runtime. See **[docs/desktop.md](docs/desktop.md)** for full desktop installation, HMR update, and rollback instructions.

If you have cloned this repository locally, you can install into both `web` and `desktop` profiles with one command:

```sh
pnpm install
pnpm run install:local
```

---

## Development

Requires **Node.js ≥ 22.13** and **pnpm 11.1.2**.

```sh
pnpm install
pnpm run build          # Build client bundle into lib/
pnpm run check          # Full gate: site check + typecheck + build + tests + DSH compat check
pnpm run format:check   # Biome formatting check
pnpm run lint           # Biome static analysis
```

**Visual & DOM Fixture Verification**:

```sh
pnpm run fixture sidebar-masthead            # Render fixture with real DSH CSS into artifacts/smoke/
pnpm run fixture boot-loading --desktop      # Unpack desktop app.asar automatically and run fixture
pnpm run check:visual                        # Visual regression gate for the boarding-pass masthead
```

Host helpers for palette and token derivation are exported via subpath imports:

```ts
import { ANIMAL_ISLAND_PALETTES } from 'dsh-theme-animal-island-ui/palette'
import { buildTokenOverrides, contrastRatio } from 'dsh-theme-animal-island-ui/tokens'
```

---

## Documentation

Detailed technical documentation (written in Chinese):

- 🎨 **[Design Language & Style Boundaries](docs/design.md)** (`docs/design.md`)
- 🔌 **[DSH Compatibility Contract](docs/compatibility.md)** (`docs/compatibility.md`)
- 🖥️ **[Desktop Installation, Debugging & Rollback](docs/desktop.md)** (`docs/desktop.md`)
- ⚖️ **[Web vs. Desktop Differences](docs/web-vs-desktop.md)** (`docs/web-vs-desktop.md`)
- 🔍 **[Sidebar Blank Session List Troubleshooting](docs/session-list-blank.md)** (`docs/session-list-blank.md`)
- 📊 **[Community Theme Settings Survey](docs/research/theme-settings-survey.md)** (`docs/research/theme-settings-survey.md`)
- 📝 **[Changelog](CHANGELOG.md)** (`CHANGELOG.md`)

---

## Contributing & Security

See **[CONTRIBUTING.md](CONTRIBUTING.md)** and **[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)**. Please report security vulnerabilities privately through **[SECURITY.md](SECURITY.md)** rather than in public issues.

---

## License & Credits

Released under the **[MIT License](LICENSE)**.

- **Visual Inspiration**: Inspired by [guokaigdg/animal-island-ui](https://github.com/guokaigdg/animal-island-ui) (MIT). No upstream code, logo, illustration, font, or stylesheet was copied.
- **Bundled Font**: Nunito is licensed under the [SIL Open Font License 1.1](licenses/Nunito-OFL.txt).
- See **[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)** for complete attribution details.

---

## Sponsor & Support

If `Animal Island UI` makes your daily workspace more enjoyable, consider supporting ongoing maintenance:

- ❤️ **Afdian (爱发电)**: [https://ifdian.net/a/shirolin](https://ifdian.net/a/shirolin)
- ☕ **Ko-fi**: [https://ko-fi.com/shirolin](https://ko-fi.com/shirolin)
- ⭐ Star this repository on GitHub, or check out the author's other project **[S1er](https://github.com/Shirolin/s1er)**!
