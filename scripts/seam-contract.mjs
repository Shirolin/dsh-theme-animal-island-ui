/**
 * Machine-readable public seams used by the compatibility checker, the CSS
 * policy test, and the documentation coverage test. Keep this list limited to
 * seams the skin actually consumes.
 */

export const PLUGIN_ROOT_ATTRIBUTE = 'dsh-animal-island-skin'

/*
 * Attributes the skin writes on <html> itself. They are plugin-owned (not DSH
 * seams), but the CSS policy test still requires every data-* selector to be
 * reviewed, so they live in the same allowlist under a separate category.
 */
export const PLUGIN_OWNED_DATA_ATTRIBUTES = ['animal-appearance', 'animal-diff-syntax', 'animal-decor', 'animal-grain', 'animal-font']

const dshSource = (packageName, file, marker, note) => ({
  kind: 'dsh-source',
  package: packageName,
  file,
  marker,
  note,
})

const fixtureEvidence = (fixture, note) => ({
  kind: 'fixture',
  fixture,
  note,
})

const ariaStandard = (note) => ({
  kind: 'aria-standard',
  note,
})

const probeOf = (evidence) => (evidence.kind === 'dsh-source' ? evidence : null)

const publicDataHook = ({ attribute, selector, required, purpose, evidence }) => ({
  attribute,
  selector,
  required,
  purpose,
  evidence,
  probe: probeOf(evidence),
})

export const PUBLIC_DATA_HOOKS = [
  publicDataHook({
    attribute: 'ds-dark-theme',
    selector: 'body[data-ds-dark-theme]',
    required: true,
    purpose: 'Select the light or dark skin branch.',
    evidence: dshSource('@deepseek-ai/dsh-client-ui-theme', 'lib/client.js', 'data-ds-dark-theme', 'ThemePresenter writes the active palette marker.'),
  }),
  publicDataHook({
    attribute: 'composer-card',
    selector: '[data-composer-card]',
    required: true,
    purpose: 'Scope composer controls without reaching into component classes.',
    evidence: dshSource(
      '@deepseek-ai/dsh-client-ui-conversation',
      'lib/client.js',
      'data-composer-card',
      'The conversation composer renders this semantic container.',
    ),
  }),
  publicDataHook({
    attribute: 'conversation-header-corner',
    selector: '[data-conversation-header-corner]',
    required: true,
    purpose: 'Enable the conversation-header ribbon and divider treatment.',
    evidence: dshSource(
      '@deepseek-ai/dsh-client-ui-conversation',
      'lib/client.js',
      'data-conversation-header-corner',
      'The conversation header renders this public corner marker.',
    ),
  }),
  publicDataHook({
    attribute: 'trigger-menu',
    selector: '[data-trigger-menu]',
    required: false,
    purpose: 'Identify the composer trigger popup for scoped decoration.',
    evidence: dshSource(
      '@deepseek-ai/dsh-client-ui-conversation',
      'lib/client.js',
      'data-trigger-menu',
      'DSH pointer dismissal logic also keys off this marker.',
    ),
  }),
  publicDataHook({
    attribute: 'code-block-banner',
    selector: '[data-code-block-banner]',
    required: false,
    purpose: 'Keep the code banner readable on the dark code surface.',
    evidence: dshSource(
      '@deepseek-ai/dsh-client-ui-chat',
      'lib/client.js',
      'data-code-block-banner',
      'The chat code block renders the language and copy banner.',
    ),
  }),
  publicDataHook({
    attribute: 'turn-trigger',
    selector: '[data-turn-trigger]',
    required: false,
    purpose: 'Keep the turn-trigger notice label readable on its dark code surface.',
    evidence: dshSource(
      '@deepseek-ai/dsh-client-ui-chat',
      'lib/client.js',
      'data-turn-trigger',
      'The chat turn-trigger notice renders this marker on its section root.',
    ),
  }),
  publicDataHook({
    attribute: 'code-preview',
    selector: '[data-code-preview]',
    required: false,
    purpose: 'Exclude document code previews from conversation code-block geometry.',
    evidence: dshSource(
      '@deepseek-ai/dsh-client-ui-sidebar-documentpreview',
      'lib/client.js',
      'data-code-preview',
      'The document preview renders this code-body marker.',
    ),
  }),
  publicDataHook({
    attribute: 'textpreview-plain',
    selector: '[data-textpreview-plain]',
    required: false,
    purpose: 'Exclude plain document previews from conversation code-block geometry.',
    evidence: dshSource(
      '@deepseek-ai/dsh-client-ui-sidebar-documentpreview',
      'lib/client.js',
      'data-textpreview-plain',
      'Plain text preview is a separate path from the code block.',
    ),
  }),
  publicDataHook({
    attribute: 'review-view',
    selector: '[data-review-view]',
    required: false,
    purpose: 'Restore a light-surface syntax palette in the deliverables code diff.',
    evidence: fixtureEvidence(
      'test/fixtures/deliverables-diff/body.html',
      'The deliverables review renders this flat diff body on the sidebar paper; the fixture pins its light-surface colours in both palettes.',
    ),
  }),
  publicDataHook({
    attribute: 'open-target',
    selector: '[data-open-target]',
    required: false,
    purpose: 'Strengthen the light-mode open-target outline and divider.',
    evidence: dshSource(
      '@deepseek-ai/dsh-client-ui-open-in-app',
      'lib/client.js',
      'data-open-target',
      'The open-in-app control writes the marker with standard menu semantics.',
    ),
  }),
  publicDataHook({
    attribute: 'plugin-item',
    selector: '[data-plugin-item]',
    required: false,
    purpose: 'Give plugin-manager rows a readable paper surface.',
    evidence: dshSource(
      '@deepseek-ai/dsh-client-ui-plugin-manager',
      'lib/client.js',
      'data-plugin-item',
      'Plugin manager rows use this identity marker for their own row actions.',
    ),
  }),
  publicDataHook({
    attribute: 'plugin-package',
    selector: '[data-plugin-package]',
    required: false,
    purpose: 'Give package-backed plugin rows the same readable surface.',
    evidence: dshSource(
      '@deepseek-ai/dsh-client-ui-plugin-manager',
      'lib/client.js',
      'data-plugin-package',
      'Installed package rows render this identity marker.',
    ),
  }),
  publicDataHook({
    attribute: 'action-card',
    selector: '[data-action-card]',
    required: false,
    purpose: 'Keep action-card result text on the card’s own label colours instead of the dark island foreground.',
    evidence: dshSource(
      '@deepseek-ai/dsh-client-ui-action-cards',
      'lib/client.js',
      'data-action-card',
      'ActionCard renders this marker on the section that wraps its body.',
    ),
  }),
  publicDataHook({
    attribute: 'tool',
    selector: '[data-tool="present"]',
    required: false,
    purpose: 'Keep plain-text tool output (the present row and the schedule-create fallback) on the card’s own label colours.',
    evidence: dshSource(
      '@deepseek-ai/dsh-client-ui-deliverables',
      'lib/client.js',
      'data-tool',
      'Present outcomes render the tool marker on the row root that wraps their output.',
    ),
  }),
  publicDataHook({
    attribute: 'dsh-boot',
    selector: '[data-dsh-boot]',
    required: false,
    purpose: 'Scope the pre-plugin boot backdrop without taking over boot state.',
    evidence: dshSource(
      '@deepseek-ai/dsh-client-ui-renderer',
      'lib/client.js',
      'data-dsh-boot',
      'The web boot page renders this root marker before plugins load.',
    ),
  }),
  publicDataHook({
    attribute: 'dsh-boot-spinner',
    selector: '[data-dsh-boot-spinner]',
    required: false,
    purpose: 'Anchor the boot progress seal and only decorate the loading card.',
    evidence: fixtureEvidence('test/fixtures/boot-loading/body.html', 'Loading and failure fixtures pin the public spinner hook and its removal on failure.'),
  }),
  publicDataHook({
    attribute: 'windows-titlebar',
    selector: '[data-windows-titlebar]',
    required: false,
    purpose: 'Select the Windows-only desktop frame and titlebar surfaces.',
    evidence: dshSource(
      '@deepseek-ai/dsh-client-ui-layout',
      'lib/client.js',
      'data-windows-titlebar',
      'The desktop shell writes the marker and the layout package consumes it.',
    ),
  }),
]

export const ALLOWED_DATA_HOOKS = [PLUGIN_ROOT_ATTRIBUTE, ...PLUGIN_OWNED_DATA_ATTRIBUTES, ...PUBLIC_DATA_HOOKS.map(({ attribute }) => attribute)]

export const PUBLIC_ARIA_ROLES = [
  {
    role: 'alert',
    purpose: 'Recolor the toast icons and inline action on the theme tooltip surface.',
    evidence: ariaStandard('Reviewed against the DSH toast markup, which portals role="alert" to <body>.'),
  },
  {
    role: 'button',
    purpose: 'Style controls whose native semantics are expressed as a button role.',
    evidence: ariaStandard('Reviewed against DSH control markup.'),
  },
  {
    role: 'checkbox',
    purpose: 'Style checkbox-semantic options.',
    evidence: ariaStandard('Reviewed against DSH selection controls.'),
  },
  {
    role: 'dialog',
    purpose: 'Scope modal surfaces and fields.',
    evidence: ariaStandard('Reviewed against DSH modal markup.'),
  },
  {
    role: 'group',
    purpose: 'Style grouped controls without relying on wrapper classes.',
    evidence: ariaStandard('Reviewed against DSH grouped controls.'),
  },
  {
    role: 'listbox',
    purpose: 'Style listbox popup rows.',
    evidence: ariaStandard('Reviewed against DSH popup markup.'),
  },
  {
    role: 'menu',
    purpose: 'Scope menu surfaces and menu descendants.',
    evidence: ariaStandard('Reviewed against DSH menu markup.'),
  },
  {
    role: 'menuitem',
    purpose: 'Style standard menu rows.',
    evidence: ariaStandard('Reviewed against DSH menu markup.'),
  },
  {
    role: 'menuitemradio',
    purpose: 'Style radio-style menu rows and their checked state.',
    evidence: ariaStandard('Reviewed against DSH selection menus.'),
  },
  {
    role: 'option',
    purpose: 'Style listbox and combobox option rows.',
    evidence: ariaStandard('Reviewed against DSH popup markup.'),
  },
  {
    role: 'radio',
    purpose: 'Style radio-semantic options.',
    evidence: ariaStandard('Reviewed against DSH selection controls.'),
  },
  {
    role: 'search',
    purpose: 'Scope search fields whose wrapper supplies the field surface.',
    evidence: ariaStandard('Reviewed against the DSH shortcut reference search field.'),
  },
  {
    role: 'switch',
    purpose: 'Style switch controls and their checked state.',
    evidence: ariaStandard('Reviewed against DSH settings controls.'),
  },
  {
    role: 'treeitem',
    purpose: 'Style session and search tree rows, including selected rows.',
    evidence: ariaStandard('Reviewed against DSH workspace trees.'),
  },
].map((entry) => ({ ...entry, probe: null }))

export const REVIEWED_ARIA_ROLES = PUBLIC_ARIA_ROLES.map(({ role }) => role)

export const PUBLIC_ARIA_ATTRIBUTES = [
  {
    attribute: 'aria-checked',
    selector: '[aria-checked]',
    kind: 'state',
    purpose: 'Style checked radio, switch, and menu-radio states.',
    evidence: dshSource(
      '@deepseek-ai/dsh-client-ui-model-selection',
      'lib/client.js',
      'aria-checked',
      'DSH model and effort selectors expose checked state with ARIA.',
    ),
  },
  {
    attribute: 'aria-current',
    selector: "[aria-current='page']",
    kind: 'state',
    purpose: 'Style the current sidebar page.',
    evidence: dshSource('@deepseek-ai/dsh-client-ui-sidebar', 'lib/client.js', 'aria-current', 'Sidebar panel rows mark the active page with aria-current.'),
  },
  {
    attribute: 'aria-expanded',
    selector: '[aria-expanded]',
    kind: 'state',
    purpose: 'Exclude or style expanded disclosure controls by state.',
    evidence: dshSource(
      '@deepseek-ai/dsh-client-ui-conversation',
      'lib/client.js',
      'aria-expanded',
      'Conversation disclosures expose expanded state with ARIA.',
    ),
  },
  {
    attribute: 'aria-haspopup',
    selector: '[aria-haspopup="menu"]',
    kind: 'property',
    purpose: 'Locate the open-target menu trigger without component classes.',
    evidence: dshSource('@deepseek-ai/dsh-client-ui-conversation', 'lib/client.js', 'aria-haspopup', 'DSH menu triggers declare the popup kind with ARIA.'),
  },
  {
    attribute: 'aria-label',
    selector: '[aria-label]',
    kind: 'label',
    purpose: 'Use accessible labels to distinguish text-bearing controls.',
    evidence: dshSource(
      '@deepseek-ai/dsh-client-ui-sidebar',
      'lib/client.js',
      'aria-label',
      'Sidebar navigation and controls expose localized accessible labels.',
    ),
  },
  {
    attribute: 'aria-pressed',
    selector: '[aria-pressed]',
    kind: 'state',
    purpose: 'Style pressed preset and toggle controls.',
    evidence: dshSource('@deepseek-ai/dsh-client-ui-theme', 'lib/client.js', 'aria-pressed', 'Theme preference controls expose pressed state with ARIA.'),
  },
  {
    attribute: 'aria-selected',
    selector: '[aria-selected]',
    kind: 'state',
    purpose: 'Style selected tabs and tree rows.',
    evidence: dshSource('@deepseek-ai/dsh-client-ui-conversation', 'lib/client.js', 'aria-selected', 'Conversation tabs expose selection with ARIA.'),
  },
].map((entry) => ({ ...entry, probe: probeOf(entry.evidence) }))

export const REVIEWED_ARIA_ATTRIBUTES = PUBLIC_ARIA_ATTRIBUTES.map(({ attribute }) => attribute)

const publicSlot = ({ key, name, kind, scope, priority, required, purpose, evidence }) => ({
  key,
  name,
  kind,
  scope,
  priority,
  required,
  purpose,
  evidence,
  probe: probeOf(evidence),
})

export const PUBLIC_SLOTS = [
  publicSlot({
    key: 'sidebarBrandMark',
    name: 'sidebar.brand.mark',
    kind: 'single',
    scope: 'root',
    priority: -100,
    required: true,
    purpose: "Replace the sidebar mark inside DSH's public brand composition.",
    evidence: dshSource(
      '@deepseek-ai/dsh-client-ui-sidebar',
      'lib/types/client/contract/slots.d.ts',
      'sidebar.brand.mark',
      'The sidebar package declares this single root slot.',
    ),
  }),
  publicSlot({
    key: 'sidebarBrandName',
    name: 'sidebar.brand.name',
    kind: 'single',
    scope: 'root',
    priority: -100,
    required: true,
    purpose: 'Render the branded name inside the sidebar brand button.',
    evidence: dshSource(
      '@deepseek-ai/dsh-client-ui-sidebar',
      'lib/types/client/contract/slots.d.ts',
      'sidebar.brand.name',
      'The sidebar package declares this single root slot.',
    ),
  }),
  publicSlot({
    key: 'heroBrandMark',
    name: 'conversation.hero.brand.mark',
    kind: 'single',
    scope: 'root',
    priority: -100,
    required: true,
    purpose: 'Render the island title scene in the conversation hero.',
    evidence: dshSource(
      '@deepseek-ai/dsh-client-ui-conversation',
      'lib/types/client/contract/slots.d.ts',
      'conversation.hero.brand.mark',
      'The conversation package declares this single root slot.',
    ),
  }),
  publicSlot({
    key: 'appearanceTab',
    name: 'settings.plugins.tab',
    kind: null,
    scope: null,
    priority: null,
    required: false,
    purpose: 'Add the per-client appearance preference to plugin settings.',
    evidence: dshSource(
      '@deepseek-ai/dsh-client-ui-settings-plugins',
      'lib/client.js',
      'settings.plugins.tab',
      'The plugins settings section declares and renders this list slot.',
    ),
  }),
]

export const PUBLIC_SERVICES = ['theme', 'slots']

export const PROVIDER_ORDER = [
  '@deepseek-ai/dsh-client-ui-theme',
  '@deepseek-ai/dsh-client-ui-renderer',
  '@deepseek-ai/dsh-client-ui-sidebar',
  '@deepseek-ai/dsh-client-ui-conversation',
]
