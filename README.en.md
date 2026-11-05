# DSH Animal Island Theme

[简体中文](README.md) · by [Shirolin](https://github.com/Shirolin)

[Product site](https://shirolin.github.io/dsh-theme-animal-island-ui/) · [30-second film: open the island workspace](https://shirolin.github.io/dsh-theme-animal-island-ui/#film)

[![check](https://github.com/Shirolin/dsh-theme-animal-island-ui/actions/workflows/check.yml/badge.svg?branch=main)](https://github.com/Shirolin/dsh-theme-animal-island-ui/actions/workflows/check.yml)
[![release](https://img.shields.io/github/v/release/Shirolin/dsh-theme-animal-island-ui?display_name=tag)](https://github.com/Shirolin/dsh-theme-animal-island-ui/releases)
[![license: MIT](https://img.shields.io/badge/license-MIT-f3c969.svg)](LICENSE)

An Animal Island–inspired theme plugin for DeepSeek Harness (Web and Windows Desktop), made by Shirolin. It brings a boarding-pass masthead, cream notebook paper, wooden sign badges, and a starry night island into DSH—while keeping every session, setting, workspace, composer, and shortcut working exactly as before.

![DSH Animal Island Theme · by Shirolin](docs/screenshots/theme-poster.webp)

<details>
<summary>Real DSH DOM fixture: day and night</summary>

| Day workspace | Night workspace |
| --- | --- |
| ![Day workspace](docs/screenshots/workspace-light.webp) | ![Night workspace](docs/screenshots/workspace-dark.webp) |
| ![Day sidebar](docs/screenshots/sidebar-light.webp) | ![Night sidebar](docs/screenshots/sidebar-dark.webp) |

</details>

## Highlights

- **Day & Night islands**: Polka-dot turf, water ripples, and floating leaves by day; a separately drawn starry night island with moonlight, fireflies, and a deep-teal sidebar after dark;
- **Public slots & native shell**: A `216×60` boarding-pass masthead, bubble composer, paper-grain dialogs, wooden selection states, and 2px inset mint focus rings that never clip inside scroll views;
- **In-app appearance tab**: Built into `Settings → Plugins` with three presets (`0.52` / `0.40` / `0.28`), a `0.15–0.60` canvas-strength slider, a live layered preview, and detail switches for canvas illustrations, paper grain, and the UI font (bundled Nunito or the system stack);
- **Self-contained assets**: Bundled Nunito Latin fonts and original SVG artwork with zero runtime network requests;
- **Verified compatibility**: Contract tests for 118 ThemeRuntime tokens, public slots, ARIA/data hooks, and headless Chrome DOM fixtures.

The poster and fixture screenshots above are rendered from real DSH CSS/DOM fixtures for regression
checks; the live client is the final word on how it looks. The visual language is inspired by Animal
Island UI—no upstream code, logo, illustration, font, or complete stylesheet is copied. See
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Compatibility

The development baseline is DSH `0.1.5-rc.3`. The theme deliberately fails soft when a public
ThemeRuntime capability is unavailable. Compatibility details and the reviewed seam list live in
[docs/compatibility.md](docs/compatibility.md).

## Install

1. Download the latest `.tgz` and `SHA256SUMS` from
   [GitHub Releases](https://github.com/Shirolin/dsh-theme-animal-island-ui/releases).
2. Verify the tarball against `SHA256SUMS`.
3. Install it into the target DSH profile:

```sh
cd <profile-directory>
pnpm add file:<download-directory>/dsh-theme-animal-island-ui-<version>.tgz
```

Restart DSH completely after installation. Web and Desktop use different profiles; Desktop setup is
documented in [docs/desktop.md](docs/desktop.md).

## Development

Requirements: Node.js 22.13 or newer and pnpm 11.1.2.

```sh
pnpm install
pnpm run format:check
pnpm run lint
pnpm run check
```

`pnpm run check` covers type checking, build, contract tests, and the pinned DSH compatibility
check. Visual fixtures use real DSH CSS and DOM shapes:

```sh
pnpm run fixture sidebar-masthead
pnpm run fixture boot-loading --desktop
```

## Documentation

The detailed technical documentation is currently written in Chinese:

- [Design language and style boundaries](docs/design.md)
- [DSH compatibility contract](docs/compatibility.md)
- [Desktop installation, debugging, and rollback](docs/desktop.md)
- [Web and Desktop differences](docs/web-vs-desktop.md)
- [Community theme settings survey](docs/research/theme-settings-survey.md)
- [Changelog](CHANGELOG.md)

## Contributing and security

See [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). Report security
issues privately through [SECURITY.md](SECURITY.md), not in a public issue.

## License

MIT. Made by [Shirolin](https://github.com/Shirolin); this is a community project with no official
affiliation with DeepSeek. Bundled Nunito font files remain under SIL OFL 1.1 as recorded in
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
