'use client'

import { PALETTES, gradientCss } from '@/utils/colors'

export const DEFAULT_SETTINGS = {
  palette: 'spectral',
  reverse: false,
  ocean: '#16365c',
  noData: '#9ca3af',
  border: '#374151',
  atmosphere: true,
  autoRotate: false,
  fillGaps: true,
}

const row = 'flex items-center justify-between gap-3'

export default function SettingsModal({ settings, onChange, onReset, onClose }) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 p-4">
      <div className="flex max-h-full w-full max-w-md flex-col rounded-xl bg-neutral-900 p-5 text-sm text-neutral-100 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">Ajustes</h2>
          <button className="text-neutral-400 hover:text-white" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto pr-1">
          <div>
            <p className="mb-2 text-xs uppercase tracking-wide text-neutral-400">Paleta de colores</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(PALETTES).map(([key, p]) => (
                <button
                  key={key}
                  onClick={() => onChange({ palette: key })}
                  className={`rounded-md border p-2 text-left text-xs ${
                    settings.palette === key ? 'border-cyan-400' : 'border-neutral-700 hover:bg-neutral-800'
                  }`}
                >
                  {p.name}
                  <div className="mt-1 h-2 rounded" style={{ background: gradientCss(key, settings.reverse) }} />
                </button>
              ))}
            </div>
            <label className="mt-2 flex items-center gap-2 text-xs text-neutral-300">
              <input
                type="checkbox"
                checked={settings.reverse}
                onChange={(e) => onChange({ reverse: e.target.checked })}
              />
              Invertir paleta
            </label>
          </div>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-neutral-400">Colores del globo</p>
            <div className={row}>
              <span>Mares</span>
              <input type="color" value={settings.ocean} onChange={(e) => onChange({ ocean: e.target.value })} />
            </div>
            <div className={row}>
              <span>Países sin dato</span>
              <input type="color" value={settings.noData} onChange={(e) => onChange({ noData: e.target.value })} />
            </div>
            <div className={row}>
              <span>Bordes</span>
              <input type="color" value={settings.border} onChange={(e) => onChange({ border: e.target.value })} />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-neutral-400">Comportamiento</p>
            <label className="flex items-center gap-2 text-xs text-neutral-300">
              <input
                type="checkbox"
                checked={settings.atmosphere}
                onChange={(e) => onChange({ atmosphere: e.target.checked })}
              />
              Halo atmosférico (desactivalo si va lento)
            </label>
            <label className="flex items-center gap-2 text-xs text-neutral-300">
              <input
                type="checkbox"
                checked={settings.autoRotate}
                onChange={(e) => onChange({ autoRotate: e.target.checked })}
              />
              Giro automático
            </label>
            <label className="flex items-center gap-2 text-xs text-neutral-300">
              <input
                type="checkbox"
                checked={settings.fillGaps}
                onChange={(e) => onChange({ fillGaps: e.target.checked })}
              />
              Si a un país le falta el dato de ese año, usar el último de hasta 5 años antes
            </label>
          </div>
        </div>

        <div className="mt-4 flex justify-between">
          <button
            className="rounded-md border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm hover:bg-neutral-700"
            onClick={onReset}
          >
            Restablecer
          </button>
          <button
            className="rounded-md border border-neutral-700 bg-cyan-700 px-3 py-1.5 text-sm hover:bg-cyan-600"
            onClick={onClose}
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  )
}
