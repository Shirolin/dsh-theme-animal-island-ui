import { useSyncExternalStore, type CSSProperties } from 'react'
import { APPEARANCE_DEFAULTS, APPEARANCE_PRESETS, getAppearance, setAppearance, subscribeAppearance, type AppearancePreset } from '../appearance.ts'

type NamedPreset = Exclude<AppearancePreset, 'custom'>

const PRESET_LABELS: Record<NamedPreset, string> = {
  paper: '纸白',
  balanced: '均衡',
  island: '海岛',
}

const PRESET_ORDER: NamedPreset[] = ['paper', 'balanced', 'island']

export function AppearanceTab(): React.JSX.Element {
  const state = useSyncExternalStore(subscribeAppearance, getAppearance, getAppearance)
  const sliderProgress = ((state.veil - APPEARANCE_DEFAULTS.min) / (APPEARANCE_DEFAULTS.max - APPEARANCE_DEFAULTS.min)) * 100
  const sliderStyle = {
    '--animal-slider-progress': `${sliderProgress}%`,
  } as CSSProperties

  return (
    <section className="animal-island-appearance">
      <h3>动森外观</h3>
      <p>画布上那层奶油「纸面」的透明度。越低越绿、越像游戏；越高越纸白、越好读。</p>

      {/* Settings itself is an opaque paper card, so the canvas behind it is hidden
          while this tab is open. This swatch mirrors the real canvas (same green
          dotted ground, same cream veil) so the slider shows its effect instantly. */}
      <div className="animal-island-appearance__preview" role="img" aria-label={`纸面透明度预览，当前 ${state.veil.toFixed(2)}`}>
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
            aria-pressed={state.preset === preset}
            className="animal-island-appearance__preset"
            onClick={() => setAppearance({ preset, veil: APPEARANCE_PRESETS[preset] })}
          >
            {PRESET_LABELS[preset]}
            <small>{APPEARANCE_PRESETS[preset].toFixed(2)}</small>
          </button>
        ))}
      </fieldset>

      <label className="animal-island-appearance__slider">
        <span>自定义</span>
        <input
          type="range"
          min={APPEARANCE_DEFAULTS.min}
          max={APPEARANCE_DEFAULTS.max}
          step={0.01}
          value={state.veil}
          style={sliderStyle}
          onChange={(event) => setAppearance({ preset: 'custom', veil: Number(event.target.value) })}
        />
        <output>{state.veil.toFixed(2)}</output>
      </label>

      <button
        type="button"
        className="animal-island-appearance__reset"
        onClick={() =>
          setAppearance({
            preset: APPEARANCE_DEFAULTS.preset,
            veil: APPEARANCE_DEFAULTS.veil,
          })
        }
      >
        恢复默认（{PRESET_LABELS[APPEARANCE_DEFAULTS.preset]} {APPEARANCE_DEFAULTS.veil.toFixed(2)}）
      </button>

      <p className="animal-island-appearance__note">
        设置卡片本身是固定纸面，滑杆调整的是它背后的画布，上方「画布预览」会实时同步；偏好保存在本机这个客户端，系统开启「高对比」时会自动回到纸白。
      </p>
    </section>
  )
}
