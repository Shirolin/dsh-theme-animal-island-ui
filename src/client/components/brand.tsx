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
      {/* Original tilted island leaf: the one shape that reads "Animal Island"
          even at 16–24px. Outline, central vein and side veins are kept thick so
          the silhouette survives the small sidebar mark. */}
      <g transform="rotate(-18 32 32)">
        <path d="M32 54c0 5-2 8-7 9" fill="none" stroke="#2f7d3c" strokeWidth="4.5" strokeLinecap="round" />
        <path
          d="M32 6C19 16 10 27 10 38c0 11 10 18 22 18s22-7 22-18C54 27 45 16 32 6Z"
          fill="#6cc35a"
          stroke="#2f7d3c"
          strokeWidth="3.2"
          strokeLinejoin="round"
        />
        <path d="M32 12v37" stroke="#d9f2c1" strokeWidth="3.4" strokeLinecap="round" />
        <path
          d="M32 25c-6-1-10-4-13-9M32 34c-7-1-12-4-15-8M32 43c-6 0-10-2-14-6"
          fill="none"
          stroke="#a6dd8c"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <path
          d="M32 25c6-1 10-4 13-9M32 34c7-1 12-4 15-8M32 43c6 0 10-2 14-6"
          fill="none"
          stroke="#a6dd8c"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
      </g>
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
