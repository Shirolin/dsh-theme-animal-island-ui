import type { HeroBrandMarkOwnerProps } from '@deepseek-ai/dsh-client-ui-conversation/client'

interface IslandMarkProps {
  size: number
  className?: string
}

export function IslandMark({ size, className }: IslandMarkProps): React.JSX.Element {
  return (
    <svg
      aria-hidden="true"
      className={`animal-island-brand__mark ${className ?? ''}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 64 64"
    >
      <circle cx="47" cy="17" r="7" fill="#ffcc58" />
      <path d="M8 43c13-11 35-11 48 0-6 9-42 9-48 0Z" fill="#50b88a" />
      <path d="M14 45c9 4 27 4 36 0-3 7-33 7-36 0Z" fill="#3f9fc4" />
      <path d="M30 38c0-9 3-17 10-22-1 10-3 17-10 22Z" fill="#3f9f5f" />
      <path d="M33 30c4-5 9-8 15-9-3 6-8 10-15 9Z" fill="#6ccb84" />
      <path d="M16 39c-4-7-3-13 2-18 4 6 4 12-2 18Z" fill="#76c98b" />
    </svg>
  )
}

export function BrandName(): React.JSX.Element {
  return (
    <span className="animal-island-brand__name">
      <strong>动森岛</strong>
      <small>ANIMAL ISLAND</small>
    </span>
  )
}

export function HeroBrandMark({ size, className }: HeroBrandMarkOwnerProps): React.JSX.Element {
  return (
    <span className="animal-island-hero__brand">
      <IslandMark size={size} className={className} />
      <span className="animal-island-hero__wordmark">动森岛</span>
    </span>
  )
}
