import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react'
import { APPEARANCE_DEFAULTS, APPEARANCE_PRESETS, type AppearancePreset, type AppearanceStore } from '../appearance.ts'

type NamedPreset = Exclude<AppearancePreset, 'custom'>

const PRESET_LABELS: Record<NamedPreset, string> = {
  paper: '纸白',
  balanced: '均衡',
  island: '海岛',
}

const PRESET_ORDER: NamedPreset[] = ['paper', 'balanced', 'island']

export interface AppearanceTabProps {
  appearance: AppearanceStore
}

export function AppearanceTab({ appearance }: AppearanceTabProps): React.JSX.Element {
  const { getSnapshot, set, subscribe } = appearance
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  const [draftVeil, setDraftVeil] = useState(state.veil)
  const draftRef = useRef(state.veil)
  const draftDirty = useRef(false)
  const latestSet = useRef(set)
  const commitFrame = useRef<number | null>(null)
  const sliderProgress = ((draftVeil - APPEARANCE_DEFAULTS.min) / (APPEARANCE_DEFAULTS.max - APPEARANCE_DEFAULTS.min)) * 100
  const panelStyle = {
    '--animal-appearance-draft': String(draftVeil),
  } as CSSProperties
  const sliderStyle = {
    '--animal-slider-progress': `${sliderProgress}%`,
  } as CSSProperties

  const cancelPendingCommit = () => {
    if (commitFrame.current === null) return
    cancelAnimationFrame(commitFrame.current)
    commitFrame.current = null
  }

  const flushDraft = () => {
    if (!draftDirty.current) return
    draftDirty.current = false
    latestSet.current({ preset: 'custom', veil: draftRef.current })
  }

  const scheduleCommit = () => {
    if (!draftDirty.current || commitFrame.current !== null) return
    commitFrame.current = requestAnimationFrame(() => {
      commitFrame.current = null
      flushDraft()
    })
  }

  useEffect(() => {
    latestSet.current = set
  }, [set])

  useEffect(() => {
    if (draftDirty.current) return
    draftRef.current = state.veil
    setDraftVeil(state.veil)
  }, [state.veil])

  useEffect(
    () => () => {
      if (commitFrame.current !== null) {
        cancelAnimationFrame(commitFrame.current)
        commitFrame.current = null
      }
      if (!draftDirty.current) return
      draftDirty.current = false
      latestSet.current({ preset: 'custom', veil: draftRef.current })
    },
    [],
  )

  const updateVeil = (veil: number) => {
    draftRef.current = veil
    draftDirty.current = true
    setDraftVeil(veil)
  }

  const applyPreset = (preset: NamedPreset) => {
    const veil = APPEARANCE_PRESETS[preset]
    cancelPendingCommit()
    draftDirty.current = false
    draftRef.current = veil
    setDraftVeil(veil)
    set({ preset, veil })
  }

  return (
    <section className="animal-island-appearance" style={panelStyle}>
      <h3>动森外观</h3>
      <p>画布上那层奶油「纸面」的透明度。越低越绿、越像游戏；越高越纸白、越好读。</p>

      {/* Settings itself is an opaque paper card, so the canvas behind it is hidden
          while this tab is open. This swatch mirrors the real canvas (same green
          dotted ground, same cream veil) so the slider shows its effect instantly. */}
      <div className="animal-island-appearance__preview" role="img" aria-label={`纸面透明度预览，当前 ${draftVeil.toFixed(2)}`}>
        <div className="animal-island-appearance__preview-sheet">
          <strong>动森岛</strong>
          <span>今天的岛也是绿油油的。</span>
        </div>
        <small className="animal-island-appearance__preview-tag">画布预览</small>
      </div>

      <fieldset className="animal-island-appearance__presets" aria-label="外观预设">
        {PRESET_ORDER.map((preset) => (
          <button
            key={preset}
            type="button"
            aria-pressed={draftVeil === state.veil && state.preset === preset}
            className="animal-island-appearance__preset"
            onClick={() => applyPreset(preset)}
          >
            {PRESET_LABELS[preset]}
            <small>{APPEARANCE_PRESETS[preset].toFixed(2)}</small>
          </button>
        ))}
      </fieldset>

      <div className="animal-island-appearance__custom">
        <label className="animal-island-appearance__slider">
          <span className="animal-island-appearance__slider-title">自定义</span>
          <output className="animal-island-appearance__slider-value">{draftVeil.toFixed(2)}</output>
          <input
            type="range"
            min={APPEARANCE_DEFAULTS.min}
            max={APPEARANCE_DEFAULTS.max}
            step={0.01}
            value={draftVeil}
            style={sliderStyle}
            onChange={(event) => updateVeil(Number(event.target.value))}
            onPointerUp={scheduleCommit}
            onPointerCancel={scheduleCommit}
            onLostPointerCapture={scheduleCommit}
            onKeyUp={scheduleCommit}
            onBlur={scheduleCommit}
          />
        </label>

        <div className="animal-island-appearance__custom-actions">
          <span className="animal-island-appearance__custom-hint">拖动微调纸面浓度</span>
          <button
            type="button"
            className="animal-island-appearance__reset"
            onClick={() => {
              cancelPendingCommit()
              draftDirty.current = false
              draftRef.current = APPEARANCE_DEFAULTS.veil
              setDraftVeil(APPEARANCE_DEFAULTS.veil)
              set({
                preset: APPEARANCE_DEFAULTS.preset,
                veil: APPEARANCE_DEFAULTS.veil,
              })
            }}
          >
            <span className="animal-island-appearance__reset-icon" aria-hidden="true">
              <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M4.7 5.8A4.2 4.2 0 1 1 4.4 10" />
                <path d="M4.7 2.7v3.1h3.1" />
              </svg>
            </span>
            <span className="animal-island-appearance__reset-copy">
              <span>恢复默认</span>
              <small>
                {PRESET_LABELS[APPEARANCE_DEFAULTS.preset]} {APPEARANCE_DEFAULTS.veil.toFixed(2)}
              </small>
            </span>
          </button>
        </div>
      </div>

      <fieldset className="animal-island-appearance__diff" aria-label="diff 语法配色">
        <span className="animal-island-appearance__diff-title">diff 语法配色</span>
        <p className="animal-island-appearance__diff-hint">
          只影响右侧栏中画在纸面上的代码 diff（深色模式始终使用深色代码岛的配色）。「暖色」与整套动森纸面更统一，「DSH 原生」则是 DSH 自带的中性亮色语法色。
        </p>
        <div className="animal-island-appearance__diff-options">
          <button
            type="button"
            className="animal-island-appearance__preset"
            aria-pressed={state.diffSyntax === 'warm'}
            onClick={() => set({ diffSyntax: 'warm' })}
          >
            暖色
            <small>跟随纸面</small>
          </button>
          <button
            type="button"
            className="animal-island-appearance__preset"
            aria-pressed={state.diffSyntax === 'native'}
            onClick={() => set({ diffSyntax: 'native' })}
          >
            中性
            <small>DSH 原生</small>
          </button>
        </div>
      </fieldset>

      <p className="animal-island-appearance__note">
        设置卡片本身是固定纸面，滑杆调整的是它背后的画布，上方「画布预览」会实时同步；偏好保存在本机这个客户端，系统开启「高对比」时会自动回到纸白。
      </p>
    </section>
  )
}
