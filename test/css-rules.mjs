import { transform } from 'lightningcss'

const colonDelimiter = new Set([':'])
const declarationBoundary = new Set([';', '{'])
const preludeBoundary = new Set(['{', ';'])

function normalize(value) {
  return value.replaceAll(/\s+/g, ' ').trim()
}

function skipComment(css, index, end) {
  if (css[index] !== '/' || css[index + 1] !== '*') return index
  const close = css.indexOf('*/', index + 2)
  return close === -1 || close >= end ? end : close + 2
}

function skipString(css, index, end) {
  const quote = css[index]
  index += 1
  while (index < end) {
    if (css[index] === '\\') index += 2
    else if (css[index] === quote) return index + 1
    else index += 1
  }
  return end
}

function findDelimiter(css, start, end, delimiters) {
  let parentheses = 0
  let brackets = 0
  for (let index = start; index < end; index += 1) {
    const character = css[index]
    if (character === '/' && css[index + 1] === '*') {
      index = skipComment(css, index, end) - 1
      continue
    }
    if (character === '"' || character === "'") {
      index = skipString(css, index, end) - 1
      continue
    }
    if (character === '(') parentheses += 1
    else if (character === ')') parentheses = Math.max(0, parentheses - 1)
    else if (character === '[') brackets += 1
    else if (character === ']') brackets = Math.max(0, brackets - 1)
    else if (parentheses === 0 && brackets === 0 && delimiters.has(character)) return index
  }
  return end
}

function findClosingBrace(css, opening, end) {
  let depth = 1
  for (let index = opening + 1; index < end; index += 1) {
    const character = css[index]
    if (character === '/' && css[index + 1] === '*') {
      index = skipComment(css, index, end) - 1
      continue
    }
    if (character === '"' || character === "'") {
      index = skipString(css, index, end) - 1
      continue
    }
    if (character === '{') depth += 1
    else if (character === '}') {
      depth -= 1
      if (depth === 0) return index
    }
  }
  return end
}

function parseDeclaration(source) {
  const colon = findDelimiter(source, 0, source.length, colonDelimiter)
  if (colon === source.length) return undefined

  const property = normalize(source.slice(0, colon))
  if (property === '') return undefined

  const rawValue = normalize(source.slice(colon + 1))
  const important = /\s*!important\s*$/i.test(rawValue)
  return Object.freeze({
    property: property.startsWith('--') ? property : property.toLowerCase(),
    value: important ? normalize(rawValue.replace(/\s*!important\s*$/i, '')) : rawValue,
    important,
  })
}

function declarationsOf(block) {
  const declarations = []
  let index = 0
  while (index < block.length) {
    while (index < block.length && (/\s/.test(block[index]) || block.startsWith('/*', index))) {
      index = block.startsWith('/*', index) ? skipComment(block, index, block.length) : index + 1
    }
    if (index >= block.length) break

    const boundary = findDelimiter(block, index, block.length, declarationBoundary)
    if (boundary === block.length) {
      const declaration = parseDeclaration(block.slice(index))
      if (declaration !== undefined) declarations.push(declaration)
      break
    }

    if (block[boundary] === '{') {
      const closing = findClosingBrace(block, boundary, block.length)
      if (closing === block.length) break
      index = closing + 1
      continue
    }

    const declaration = parseDeclaration(block.slice(index, boundary))
    if (declaration !== undefined) declarations.push(declaration)
    index = boundary + 1
  }
  return Object.freeze(declarations)
}

function createRule(selector, declarations, atRules) {
  return Object.freeze({
    selector: normalize(selector),
    declarations,
    atRules: Object.freeze(atRules.filter((atRule) => atRule !== null)),
    declaration(property) {
      const matching = declarations.filter((candidate) => candidate.property === property)
      const important = matching.filter((candidate) => candidate.important)
      return (important.length > 0 ? important : matching).at(-1)
    },
  })
}

function lineStartsOf(css) {
  const starts = [0]
  for (let index = 0; index < css.length; index += 1) {
    if (css[index] === '\n') starts.push(index + 1)
  }
  return starts
}

function sourceIndex(lineStarts, location) {
  const lineStart = lineStarts[location.line]
  if (lineStart === undefined) throw new Error(`CSS location line ${location.line} is out of range`)
  return lineStart + location.column - 1
}

function readStyleRule(css, lineStarts, location) {
  const start = sourceIndex(lineStarts, location)
  const opening = findDelimiter(css, start, css.length, preludeBoundary)
  if (opening === css.length || css[opening] !== '{') {
    throw new Error(`style rule at ${location.line + 1}:${location.column} has no opening brace`)
  }
  const closing = findClosingBrace(css, opening, css.length)
  if (closing === css.length) {
    throw new Error(`style rule at ${location.line + 1}:${location.column} has no closing brace`)
  }
  return {
    selector: css.slice(start, opening),
    block: css.slice(opening + 1, closing),
  }
}

function readAtRuleLabel(css, lineStarts, location) {
  const start = sourceIndex(lineStarts, location)
  const end = findDelimiter(css, start, css.length, preludeBoundary)
  if (end === css.length) return null
  const label = normalize(css.slice(start, end))
  return label.startsWith('@') ? label : null
}

/** Parse a stylesheet once and expose normalized style rules plus their at-rule ancestry. */
export function queryCssRules(css) {
  const lineStarts = lineStartsOf(css)
  const rules = []
  const atRules = []
  const atRuleStack = []

  transform({
    filename: 'skin.css',
    code: Buffer.from(css),
    visitor: {
      Rule(rule) {
        const location = rule.value.loc
        if (rule.type === 'style') {
          const { selector, block } = readStyleRule(css, lineStarts, location)
          rules.push(createRule(selector, declarationsOf(block), atRuleStack))
          return
        }

        const label = readAtRuleLabel(css, lineStarts, location)
        atRuleStack.push(label)
        if (label !== null) {
          atRules.push(label)
        }
      },
      RuleExit(rule) {
        if (rule.type !== 'style') atRuleStack.pop()
      },
    },
  })

  return Object.freeze({
    all: Object.freeze(rules),
    atRules: Object.freeze(atRules),
    find(predicate) {
      return rules.find(predicate)
    },
    filter(predicate) {
      return rules.filter(predicate)
    },
  })
}
