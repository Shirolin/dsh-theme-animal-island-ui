#!/usr/bin/env node
/*
 * Keep the GitHub Pages artifact shippable without adding a site build step.
 * This script intentionally uses only Node built-ins so the Pages workflow can
 * validate the checked-in site without installing package dependencies.
 */
import { readFile, stat } from 'node:fs/promises'
import { dirname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const siteDir = resolve(root, 'site')
const failures = []

const fail = (message) => failures.push(message)
const getAttribute = (tag, name) => {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'))
  return match?.[1] ?? match?.[2] ?? match?.[3]
}
const hasAttribute = (tag, name) => new RegExp(`\\b${name}(?:\\s*=|\\s|>)`, 'i').test(tag)
const attr = (tag, name) => getAttribute(tag.markup, name)

let localReferenceCount = 0

async function validateHtmlReferences(pageFile, label) {
  const html = await readFile(pageFile, 'utf8')
  const pageDir = dirname(pageFile)
  const tags = [...html.matchAll(/<(img|a|link|script|video|source|meta)\b[^>]*>/gi)].map((match) => ({
    name: match[1].toLowerCase(),
    markup: match[0],
  }))

  const h1Count = [...html.matchAll(/<h1\b/gi)].length
  if (h1Count !== 1) fail(`${label}: expected exactly one h1, found ${h1Count}`)

  for (const tag of tags.filter((entry) => entry.name === 'img')) {
    if (!hasAttribute(tag.markup, 'alt')) fail(`${label}: image is missing alt: ${tag.markup}`)
  }

  const ids = new Set([...html.matchAll(/\bid\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/gi)].map((match) => match[1] ?? match[2] ?? match[3]))

  for (const tag of tags) {
    for (const name of ['href', 'src', 'poster']) {
      const value = attr(tag, name)
      if (value === undefined) continue

      if (value.startsWith('#')) {
        const id = decodeURIComponent(value.slice(1))
        if (id && !ids.has(id)) fail(`${label}: missing anchor target "${value}"`)
        continue
      }
      if (/^(?:https?:|mailto:|tel:|data:)/i.test(value)) continue

      const [pathPart, hashPart] = value.split('#', 2)
      const rawPath = pathPart.split('?', 1)[0]
      if (!rawPath) continue

      localReferenceCount += 1
      const decoded = decodeURIComponent(rawPath)
      let target = resolve(pageDir, decoded)
      if (decoded.endsWith('/')) target = resolve(target, 'index.html')

      if (target !== siteDir && !target.startsWith(`${siteDir}${sep}`)) {
        fail(`${label}: local reference escapes site/: ${value}`)
        continue
      }

      try {
        if (!(await stat(target)).isFile()) fail(`${label}: local reference is not a file: ${value}`)
      } catch {
        fail(`${label}: missing local reference: ${value}`)
      }

      if (hashPart && !ids.has(decodeURIComponent(hashPart))) fail(`${label}: missing anchor target "${value}"`)
    }
  }

  return { html, tags }
}

// 1. Validate landing page (site/index.html)
const { html, tags } = await validateHtmlReferences(resolve(siteDir, 'index.html'), 'index.html')

const videos = tags.filter((entry) => entry.name === 'video')
if (videos.length === 0) fail('expected a promo video')
for (const video of videos) {
  for (const attribute of ['poster', 'aria-label', 'controls', 'preload', 'src']) {
    if (!hasAttribute(video.markup, attribute)) fail(`video is missing ${attribute}`)
  }
  if (attr(video, 'preload') !== 'metadata') fail('video must use preload="metadata"')
  if (hasAttribute(video.markup, 'autoplay')) fail('promo video must not autoplay')
}

const meta = new Map()
for (const tag of tags.filter((entry) => entry.name === 'meta')) {
  const key = attr(tag, 'property') ?? attr(tag, 'name')
  const value = attr(tag, 'content')
  if (key && value !== undefined) meta.set(key, value)
}

const requiredMeta = [
  'description',
  'theme-color',
  'og:type',
  'og:locale',
  'og:site_name',
  'og:title',
  'og:description',
  'og:url',
  'og:image',
  'og:image:type',
  'og:image:width',
  'og:image:height',
  'og:image:alt',
  'twitter:card',
  'twitter:title',
  'twitter:description',
  'twitter:image',
  'twitter:image:alt',
]
for (const key of requiredMeta) {
  if (!meta.get(key)) fail(`missing meta ${key}`)
}

const siteUrl = 'https://shirolin.github.io/dsh-theme-animal-island-ui/'
const socialCardUrl = `${siteUrl}promo/social-card.png`
const canonical = tags.find((entry) => entry.name === 'link' && attr(entry, 'rel') === 'canonical')
if (!canonical || attr(canonical, 'href') !== siteUrl) fail(`canonical must be ${siteUrl}`)
if (meta.get('og:url') !== siteUrl) fail(`og:url must be ${siteUrl}`)
if (meta.get('og:image') !== socialCardUrl) fail(`og:image must be ${socialCardUrl}`)
if (meta.get('twitter:image') !== socialCardUrl) fail(`twitter:image must be ${socialCardUrl}`)
if (meta.get('og:image:width') !== '1200' || meta.get('og:image:height') !== '630') {
  fail('og:image dimensions must be 1200x630')
}
if (meta.get('twitter:card') !== 'summary_large_image') fail('twitter:card must be summary_large_image')

const semver = html.match(/(?<![\w.-])\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?![\w.-])/)
if (semver) fail(`index.html must not hardcode the current release version: ${semver[0]}`)

const socialCardPath = resolve(siteDir, 'promo/social-card.png')
try {
  const png = await readFile(socialCardPath)
  const signature = png.subarray(0, 8).toString('hex')
  if (signature !== '89504e470d0a1a0a') fail('social card is not a PNG')
  if (png.length < 24 || png.subarray(12, 16).toString('ascii') !== 'IHDR') {
    fail('social card is missing its PNG header')
  } else {
    const width = png.readUInt32BE(16)
    const height = png.readUInt32BE(20)
    if (width !== 1200 || height !== 630) fail(`social card must be 1200x630, got ${width}x${height}`)
  }
} catch {
  fail('missing promo/social-card.png')
}

// 2. Validate showcase page and generated fixture documents
const showcaseDir = resolve(siteDir, 'showcase')
await validateHtmlReferences(resolve(showcaseDir, 'index.html'), 'showcase/index.html')

const manifestPath = resolve(showcaseDir, 'generated', 'manifest.json')
try {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
  if (!Array.isArray(manifest.fixtures) || manifest.fixtures.length === 0) {
    fail('showcase/generated/manifest.json: fixtures must be a non-empty array')
  } else {
    for (const fixture of manifest.fixtures) {
      for (const variant of fixture.variants ?? []) {
        const docPath = resolve(showcaseDir, variant.src)
        if (!docPath.startsWith(`${showcaseDir}${sep}`)) {
          fail(`showcase/generated/manifest.json: path escapes showcase/: ${variant.src}`)
          continue
        }
        try {
          if (!(await stat(docPath)).isFile()) {
            fail(`showcase/generated/manifest.json: missing file ${variant.src}`)
            continue
          }
          const docHtml = await readFile(docPath, 'utf8')
          for (const linkMatch of docHtml.matchAll(/<link\b[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi)) {
            const cssPath = resolve(dirname(docPath), linkMatch[1])
            try {
              if (!(await stat(cssPath)).isFile()) fail(`${variant.src}: missing stylesheet ${linkMatch[1]}`)
            } catch {
              fail(`${variant.src}: missing stylesheet ${linkMatch[1]}`)
            }
          }
          localReferenceCount += 1
        } catch {
          fail(`showcase/generated/manifest.json: missing file ${variant.src}`)
        }
      }
    }
  }
} catch (error) {
  fail(`showcase/generated/manifest.json: ${error instanceof Error ? error.message : String(error)}`)
}

if (failures.length > 0) {
  console.error(`site check failed with ${failures.length} issue(s):`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`site check passed: ${localReferenceCount} local references, metadata, accessibility, social card and showcase`)
