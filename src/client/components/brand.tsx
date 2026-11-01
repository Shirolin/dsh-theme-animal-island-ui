import type { HeroBrandMarkOwnerProps } from '@deepseek-ai/dsh-client-ui-conversation/client'

interface IslandMarkProps {
  size: number
  className?: string
}

export function IslandMark({ size, className }: IslandMarkProps): React.JSX.Element {
  return (
    <svg aria-hidden="true" className={`animal-island-brand__mark ${className ?? ''}`.trim()} width={size} height={size} viewBox="0 0 64 64">
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
        <path d="M32 25c-6-1-10-4-13-9M32 34c-7-1-12-4-15-8M32 43c-6 0-10-2-14-6" fill="none" stroke="#a6dd8c" strokeWidth="2.6" strokeLinecap="round" />
        <path d="M32 25c6-1 10-4 13-9M32 34c7-1 12-4 15-8M32 43c6 0 10-2 14-6" fill="none" stroke="#a6dd8c" strokeWidth="2.6" strokeLinecap="round" />
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

function HeroScenery(): React.JSX.Element {
  return (
    <>
      <svg
        aria-hidden="true"
        className="animal-island-hero__scenery animal-island-hero__scenery--day"
        viewBox="0 0 700 154"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <radialGradient id="animal-hero-day-sun">
            <stop offset="0" stopColor="#fff6b9" stopOpacity=".92" />
            <stop offset=".5" stopColor="#ffeaa0" stopOpacity=".34" />
            <stop offset="1" stopColor="#ffeaa0" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="animal-hero-day-hill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#9ed4ad" stopOpacity=".48" />
            <stop offset="1" stopColor="#9ed4ad" stopOpacity=".08" />
          </linearGradient>
          <linearGradient id="animal-hero-day-haze" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fffbea" stopOpacity="0" />
            <stop offset=".55" stopColor="#fffbea" stopOpacity=".22" />
            <stop offset="1" stopColor="#fffbea" stopOpacity="0" />
          </linearGradient>
        </defs>

        <ellipse cx="350" cy="77" rx="312" ry="67" fill="url(#animal-hero-day-haze)" />
        <circle className="animal-island-hero__scene-sun-glow" cx="505" cy="45" r="78" fill="url(#animal-hero-day-sun)" />
        <circle className="animal-island-hero__scene-sun" cx="505" cy="45" r="24" fill="#f5dc88" stroke="#e8c768" strokeWidth="1.2" />

        <g className="animal-island-hero__scene-cloud animal-island-hero__scene-cloud--one" opacity=".72">
          <path d="M61 52c-3-13 11-22 23-16 4-14 25-14 30 1 13-2 20 8 14 17-12 7-52 7-67-2Z" fill="#fff9e8" stroke="#b7d3ba" strokeWidth="1.1" />
          <path d="M86 47c7-2 13 0 18 5M82 40c7 0 12 2 16 6" fill="none" stroke="#d8e6d4" strokeWidth="1" strokeLinecap="round" />
        </g>
        <g className="animal-island-hero__scene-cloud animal-island-hero__scene-cloud--two" opacity=".5">
          <path d="M577 79c-2-10 8-17 18-13 3-11 20-11 24 1 10-1 16 6 11 13-10 6-40 6-53-1Z" fill="#fff9e8" stroke="#b7d3ba" strokeWidth="1" />
        </g>

        <path d="M0 125c67-15 108 1 165-9 55-10 87-25 143-18 57 7 94-7 145 0 64 7 100 20 154 14 42-5 72-6 93 3v39H0Z" fill="url(#animal-hero-day-hill)" />
        <path d="M0 131c85-6 119 7 199 0 86-7 130-20 216-12 79 8 133 18 285 7" fill="none" stroke="#82b795" strokeWidth="1.1" opacity=".44" />

        <g className="animal-island-hero__scene-branch" transform="translate(23 68) rotate(-7)" opacity=".82">
          <path d="M0 50C32 27 69 13 118 2" fill="none" stroke="#63986c" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M37 29C24 22 24 11 34 5c9 8 11 16 3 24Z" fill="#b8dda4" stroke="#6c9d6c" strokeWidth="1.2" />
          <path d="M63 17C61 6 69 0 79 2c0 10-5 16-16 15Z" fill="#9bce8b" stroke="#6c9d6c" strokeWidth="1.2" />
          <path d="M77 36c11-6 19 0 20 9-10 2-17 0-20-9Z" fill="#c9e4b2" stroke="#6c9d6c" strokeWidth="1.1" />
        </g>

        <g fill="#5f996d" opacity=".48">
          <path d="M118 142c0-9-3-15-8-20 7 2 12 7 13 14 1-8 5-12 11-15-4 7-5 14-2 21Z" />
          <path d="M558 145c0-8 4-12 10-16-3 7-2 12 3 17-8-2-11-2-16 1Z" />
          <path d="M609 144c1-8 5-12 12-14-4 6-4 10-2 15-5-2-7-2-12 0Z" />
        </g>

        <g opacity=".64">
          <circle cx="187" cy="37" r="2.2" fill="#78a97e" />
          <circle cx="238" cy="59" r="1.5" fill="#d8b866" />
          <circle cx="577" cy="33" r="1.7" fill="#78a97e" />
          <circle cx="629" cy="64" r="1.4" fill="#d8b866" />
        </g>
        <path d="M159 46q5-5 10 0M175 51q4-4 8 0" fill="none" stroke="#7ba481" strokeWidth="1.2" strokeLinecap="round" opacity=".55" />

        <g transform="translate(638 112)" opacity=".65">
          <circle cx="0" cy="-7" r="3.3" fill="#fff4d6" />
          <circle cx="7" cy="0" r="3.3" fill="#fff4d6" />
          <circle cx="0" cy="7" r="3.3" fill="#fff4d6" />
          <circle cx="-7" cy="0" r="3.3" fill="#fff4d6" />
          <circle r="2.7" fill="#e8be58" />
        </g>
      </svg>

      <svg
        aria-hidden="true"
        className="animal-island-hero__scenery animal-island-hero__scenery--night"
        viewBox="0 0 700 154"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <radialGradient id="animal-hero-night-moon">
            <stop offset="0" stopColor="#fff2c1" stopOpacity=".38" />
            <stop offset=".52" stopColor="#d7ead1" stopOpacity=".13" />
            <stop offset="1" stopColor="#d7ead1" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="animal-hero-night-title">
            <stop offset="0" stopColor="#396d58" stopOpacity=".34" />
            <stop offset="1" stopColor="#396d58" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="animal-hero-night-hill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#21483e" stopOpacity=".7" />
            <stop offset="1" stopColor="#152f2b" stopOpacity=".34" />
          </linearGradient>
        </defs>

        <ellipse cx="350" cy="76" rx="325" ry="70" fill="url(#animal-hero-night-title)" />
        <circle className="animal-island-hero__scene-moon-glow" cx="505" cy="43" r="76" fill="url(#animal-hero-night-moon)" />
        <circle className="animal-island-hero__scene-moon" cx="505" cy="43" r="25" fill="#f6e6b4" stroke="#d8c58c" strokeWidth="1.1" />
        <g fill="#d9c993" opacity=".22">
          <circle cx="496" cy="35" r="5" />
          <circle cx="513" cy="50" r="3.5" />
          <circle cx="515" cy="31" r="2.4" />
        </g>

        <g className="animal-island-hero__scene-stars" fill="#fff3c5">
          <circle cx="96" cy="28" r="1.6" />
          <circle cx="154" cy="57" r="1.2" />
          <circle cx="227" cy="25" r="1.8" />
          <circle cx="285" cy="48" r="1.1" />
          <circle cx="353" cy="20" r="1.4" />
          <circle cx="405" cy="57" r="1.1" />
          <circle cx="581" cy="27" r="1.7" />
          <circle cx="632" cy="61" r="1.3" />
          <path d="m185 14 1 4 4 1-4 1-1 4-1-4-4-1 4-1Z" opacity=".72" />
          <path d="m553 87 1 3.4 3.4 1-3.4 1-1 3.4-1-3.4-3.4-1 3.4-1Z" opacity=".67" />
        </g>

        <g className="animal-island-hero__scene-fireflies" fill="#f6d878">
          <circle cx="104" cy="113" r="2.2" />
          <circle cx="104" cy="113" r="7" opacity=".11" />
          <circle cx="165" cy="132" r="1.8" />
          <circle cx="165" cy="132" r="5.5" opacity=".1" />
          <circle cx="611" cy="112" r="2" />
          <circle cx="611" cy="112" r="6" opacity=".11" />
          <circle cx="646" cy="137" r="1.7" />
          <circle cx="646" cy="137" r="5" opacity=".1" />
        </g>

        <path d="M0 126c69-12 111 0 171-10 57-10 92-24 150-17 61 8 99-7 154 0 63 8 97 19 146 14 35-4 61-4 79 2v39H0Z" fill="url(#animal-hero-night-hill)" />
        <path d="M0 131c85-6 119 7 199 0 86-7 130-20 216-12 79 8 133 18 285 7" fill="none" stroke="#75b091" strokeWidth="1.1" opacity=".28" />

        <g className="animal-island-hero__scene-branch" transform="translate(24 68) rotate(-7)" opacity=".66">
          <path d="M0 50C32 27 69 13 118 2" fill="none" stroke="#5c9576" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M37 29C24 22 24 11 34 5c9 8 11 16 3 24Z" fill="#4f8168" stroke="#75a486" strokeWidth="1.2" />
          <path d="M63 17C61 6 69 0 79 2c0 10-5 16-16 15Z" fill="#619276" stroke="#75a486" strokeWidth="1.2" />
          <path d="M77 36c11-6 19 0 20 9-10 2-17 0-20-9Z" fill="#43755f" stroke="#75a486" strokeWidth="1.1" />
        </g>

        <g fill="#74ac88" opacity=".36">
          <path d="M118 142c0-9-3-15-8-20 7 2 12 7 13 14 1-8 5-12 11-15-4 7-5 14-2 21Z" />
          <path d="M558 145c0-8 4-12 10-16-3 7-2 12 3 17-8-2-11-2-16 1Z" />
          <path d="M609 144c1-8 5-12 12-14-4 6-4 10-2 15-5-2-7-2-12 0Z" />
        </g>
      </svg>
    </>
  )
}

export function HeroBrandMark({ size, className }: HeroBrandMarkOwnerProps): React.JSX.Element {
  return (
    <span className="animal-island-hero__brand">
      <HeroScenery />
      <span className="animal-island-hero__identity">
        <IslandMark size={size} className={className} />
        <span className="animal-island-hero__wordmark">动森岛</span>
        <span className="animal-island-hero__divider" aria-hidden="true" />
        <span className="animal-island-hero__english" aria-hidden="true">
          ANIMAL ISLAND
        </span>
      </span>
    </span>
  )
}
