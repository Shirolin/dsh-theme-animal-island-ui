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
  const { getSnapshot, set, subscribe, reset } = appearance
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

  const resetAll = () => {
    cancelPendingCommit()
    draftDirty.current = false
    draftRef.current = APPEARANCE_DEFAULTS.veil
    setDraftVeil(APPEARANCE_DEFAULTS.veil)
    reset()
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
        <span className="animal-island-appearance__custom-hint">拖动微调纸面浓度</span>
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

      <fieldset className="animal-island-appearance__details" aria-label="外观细节">
        <span className="animal-island-appearance__details-title">细节</span>

        <div className="animal-island-appearance__details-row">
          <span className="animal-island-appearance__details-label">插画装饰</span>
          <fieldset className="animal-island-appearance__details-options" aria-label="插画装饰">
            <button type="button" className="animal-island-appearance__preset" aria-pressed={state.decor} onClick={() => set({ decor: true })}>
              显示
              <small>山丘与叶</small>
            </button>
            <button type="button" className="animal-island-appearance__preset" aria-pressed={!state.decor} onClick={() => set({ decor: false })}>
              隐藏
              <small>只留底纹</small>
            </button>
          </fieldset>
        </div>

        <div className="animal-island-appearance__details-row">
          <span className="animal-island-appearance__details-label">纸纹</span>
          <fieldset className="animal-island-appearance__details-options" aria-label="纸纹">
            <button type="button" className="animal-island-appearance__preset" aria-pressed={state.grain} onClick={() => set({ grain: true })}>
              开<small>纸面颗粒</small>
            </button>
            <button type="button" className="animal-island-appearance__preset" aria-pressed={!state.grain} onClick={() => set({ grain: false })}>
              关<small>纯色纸</small>
            </button>
          </fieldset>
        </div>

        <div className="animal-island-appearance__details-row">
          <span className="animal-island-appearance__details-label">界面字体</span>
          <fieldset className="animal-island-appearance__details-options" aria-label="界面字体">
            <button type="button" className="animal-island-appearance__preset" aria-pressed={state.font === 'theme'} onClick={() => set({ font: 'theme' })}>
              动森
              <small>Nunito</small>
            </button>
            <button type="button" className="animal-island-appearance__preset" aria-pressed={state.font === 'system'} onClick={() => set({ font: 'system' })}>
              系统
              <small>跟随平台</small>
            </button>
          </fieldset>
        </div>

        <p className="animal-island-appearance__details-hint">
          隐藏插画只保留波点与斜纹底；纸纹只作用于 composer 与对话框。字体只换拉丁字形，中文仍走系统 CJK 字体，字号由 DSH 设置管理。
        </p>
      </fieldset>

      <div className="animal-island-appearance__actions">
        <div className="animal-island-appearance__reset-card">
          <div className="animal-island-appearance__reset-info">
            <span className="animal-island-appearance__reset-title">重置所有外观偏好</span>
            <p className="animal-island-appearance__note">
              设置卡片本身是固定纸面，滑杆调整的是它背后的画布；偏好保存在本机这个客户端，系统开启「高对比」时会自动回到纸白。
            </p>
          </div>
          <button type="button" className="animal-island-appearance__reset" aria-label="恢复全部外观设置" onClick={resetAll}>
            <span className="animal-island-appearance__reset-icon" aria-hidden="true">
              <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M4.7 5.8A4.2 4.2 0 1 1 4.4 10" />
                <path d="M4.7 2.7v3.1h3.1" />
              </svg>
            </span>
            <span className="animal-island-appearance__reset-copy">
              <span>全部恢复默认</span>
              <small>均衡 0.40</small>
            </span>
          </button>
        </div>
      </div>

      <footer className="animal-island-appearance__about">
        <div className="animal-island-appearance__about-meta">
          <span className="animal-island-appearance__about-title">Animal Island UI</span>
          <span className="animal-island-appearance__about-author">
            作者：
            <a href="https://github.com/Shirolin" target="_blank" rel="noreferrer">
              Shirolin
            </a>
          </span>
        </div>
        <div className="animal-island-appearance__about-links">
          <a href="https://github.com/Shirolin/dsh-theme-animal-island-ui" target="_blank" rel="noreferrer" className="animal-island-appearance__about-link">
            <svg className="animal-island-appearance__about-icon" viewBox="0 0 16 16" width="12" height="12" fill="currentColor" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
              />
            </svg>
            GitHub
          </a>
          <span className="animal-island-appearance__about-dot" aria-hidden="true">
            ·
          </span>
          <a href="https://ifdian.net/a/shirolin" target="_blank" rel="noreferrer" className="animal-island-appearance__about-link">
            <svg
              className="animal-island-appearance__about-icon animal-island-appearance__about-icon--afdian"
              viewBox="0 0 16 16"
              width="12"
              height="12"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M8 14s-5.5-3.3-5.5-7.5A3.5 3.5 0 0 1 8 3.8a3.5 3.5 0 0 1 5.5 2.7C13.5 10.7 8 14 8 14z" />
            </svg>
            爱发电
          </a>
          <span className="animal-island-appearance__about-dot" aria-hidden="true">
            ·
          </span>
          <a href="https://ko-fi.com/shirolin" target="_blank" rel="noreferrer" className="animal-island-appearance__about-link">
            <svg
              className="animal-island-appearance__about-icon animal-island-appearance__about-icon--kofi"
              viewBox="0 0 16 16"
              width="12"
              height="12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M2.5 3.5h8v6a3 3 0 0 1-3 3h-2a3 3 0 0 1-3-3v-6z" fill="currentColor" fillOpacity="0.15" />
              <path d="M10.5 4.5h1.8a1.7 1.7 0 0 1 1.7 1.7v.6a1.7 1.7 0 0 1-1.7 1.7h-1.8" />
              <line x1="2" y1="14" x2="11" y2="14" strokeWidth="1.6" />
            </svg>
            Ko-fi
          </a>
        </div>
      </footer>
    </section>
  )
}
