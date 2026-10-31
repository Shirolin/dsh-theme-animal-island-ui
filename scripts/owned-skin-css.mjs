import { readFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { transform } from 'lightningcss'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const fontWeights = [400, 500, 600, 700, 800, 900]
const assetPlaceholders = {
  __ANIMAL_ISLAND_WAVE__: 'sidebar-wave.svg',
  __ANIMAL_ISLAND_HORIZON__: 'island-horizon.svg',
  __ANIMAL_ISLAND_LEAVES__: 'floating-leaves.svg',
  __ANIMAL_ISLAND_NIGHT_HORIZON__: 'night-horizon.svg',
  __ANIMAL_ISLAND_NIGHT_LEAVES__: 'night-leaves.svg',
  __ANIMAL_ISLAND_BOOT_LEAF__: 'loading-leaf.svg',
  __ANIMAL_ISLAND_GRAIN__: 'paper-grain.svg',
  __ANIMAL_ISLAND_LEAF__: 'leaf-watermark.svg',
}

async function assetDataUri(file) {
  const svg = await readFile(join(root, 'src', 'client', 'assets', file), 'utf8')
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

async function fontFaces() {
  return (await Promise.all(fontWeights.map(async (weight) => {
    const file = join(
      root,
      'node_modules',
      '@fontsource',
      'nunito',
      'files',
      `nunito-latin-${weight}-normal.woff2`,
    )
    const data = (await readFile(file)).toString('base64')
    return `@font-face{font-family:Nunito;font-style:normal;font-display:swap;font-weight:${weight};src:url(data:font/woff2;base64,${data}) format("woff2")}`
  }))).join('\n')
}

/** Build the exact owned CSS embedded in the client and used by visual fixtures. */
export async function buildOwnedSkinCss() {
  const placeholders = Object.keys(assetPlaceholders)
  const [fonts, skinCss, ...assets] = await Promise.all([
    fontFaces(),
    readFile(join(root, 'src', 'client', 'skin.css'), 'utf8'),
    ...Object.values(assetPlaceholders).map(assetDataUri),
  ])

  let source = skinCss
  for (const [index, placeholder] of placeholders.entries()) {
    source = source.replaceAll(placeholder, assets[index])
  }

  const unresolved = source.match(/__ANIMAL_ISLAND_[A-Z0-9_]+__/)
  if (unresolved) {
    throw new Error(`Unresolved owned skin asset placeholder: ${unresolved[0]}`)
  }

  const transformed = transform({
    filename: 'skin.css',
    code: Buffer.from(source),
    minify: false,
    sourceMap: false,
  }).code.toString()

  return `${fonts}\n${transformed}`
}
