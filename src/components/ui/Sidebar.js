'use client'

import { gradientCss } from '@/utils/colors'
import { CONTINENTS } from '@/data/continents'

const fmt = (n) => n.toLocaleString('es-AR', { notation: 'compact', maximumFractionDigits: 1 })

export default function Sidebar({
  datasets,
  active,
  onSelect,
  onRemove,
  min,
  max,
  scale,
  onScale,
  categories,
  settings,
  region,
  onRegion,
  onZoom,
  onNew,
  onCatalog,
  onSettings,
  compareMode,
  onToggleCompare,
  mute,
  onToggleMute,
  onRetry,
  timeLabel,
}) {
  const input =
    'w-full rounded-md bg-neutral-800 border border-neutral-700 px-2 py-1.5 text-sm outline-none focus:border-cyan-400'
  const btn = 'rounded-md bg-neutral-800 border border-neutral-700 px-3 py-1.5 hover:bg-neutral-700'

  const isCat = active.kind === 'category'
  const groups = [
    ['Banco Mundial', datasets.filter((d) => d.wb)],
    ['Criterios', datasets.filter((d) => d.geoProp)],
    ['Mis datos', datasets.filter((d) => d.custom)],
  ].filter(([, list]) => list.length)

  const source = active.wb
    ? `Fuente: Banco Mundial (${active.wb})`
    : active.geoProp
    ? 'Fuente: Natural Earth'
    : 'Datos propios'

  return (
    <aside className="absolute top-4 left-4 z-10 w-72 max-h-[calc(100vh-2rem)] overflow-y-auto rounded-xl bg-neutral-900/85 p-4 text-sm text-neutral-100 backdrop-blur space-y-4">
      <h1 className="text-base font-semibold">Globo de estadísticas</h1>

      {mute ? (
        <p className="text-xs text-neutral-400">
          Mapa mudo activo: sin datos de estadísticas, para marcar y anotar. Las herramientas están a la
          derecha.
        </p>
      ) : (
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wide text-neutral-400">Estadística</label>
          <select className={input} value={active.id} onChange={(e) => onSelect(e.target.value)}>
            {groups.map(([label, list]) => (
              <optgroup key={label} label={label}>
                {list.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>

          <p className="text-xs text-neutral-500">
            {source}
            {timeLabel && ` · ${timeLabel}`}
          </p>

          {active.pending && !active.error && (
            <p className="text-xs text-cyan-300">Descargando datos del Banco Mundial…</p>
          )}
          {active.error && (
            <p className="text-xs text-red-400">
              {active.error}{' '}
              <button className="underline" onClick={onRetry}>
                Reintentar
              </button>
            </p>
          )}

          {isCat ? (
            <ul className="max-h-40 space-y-1 overflow-y-auto text-xs">
              {categories.labels.map((l) => (
                <li key={l} className="flex items-center gap-2">
                  <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: categories.colors[l] }} />
                  <span className="truncate">{l}</span>
                </li>
              ))}
            </ul>
          ) : (
            <>
              <div>
                <div className="h-3 w-full rounded" style={{ background: gradientCss(settings.palette, settings.reverse) }} />
                <div className="mt-1 flex justify-between text-xs text-neutral-300">
                  <span>{fmt(min)}</span>
                  <span className="truncate px-1">{active.unit}</span>
                  <span>{fmt(max)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-300">
                <span>Escala</span>
                <select className={`${input} !py-1`} value={scale} onChange={(e) => onScale(e.target.value)}>
                  <option value="linear">Lineal</option>
                  <option value="log">Logarítmica</option>
                  <option value="quantile">Cuantiles</option>
                </select>
              </div>
            </>
          )}

          {datasets.length > 1 && (
            <button className="text-xs text-neutral-500 hover:text-red-400" onClick={() => onRemove(active.id)}>
              Quitar esta estadística de la lista
            </button>
          )}
        </div>
      )}

      <div className="space-y-2">
        <label className="text-xs uppercase tracking-wide text-neutral-400">Región</label>
        <select className={input} value={region} onChange={(e) => onRegion(e.target.value)}>
          <option value="">Todo el mundo</option>
          {CONTINENTS.map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <button className={`${btn} w-full bg-cyan-700 hover:bg-cyan-600`} onClick={onCatalog}>
          🌐 Datos abiertos (Banco Mundial)
        </button>
        <button className={`${btn} w-full`} onClick={onNew}>
          + Nueva estadística propia
        </button>
        <button
          className={`${btn} w-full ${compareMode ? 'border-yellow-400 text-yellow-300' : ''}`}
          onClick={onToggleCompare}
        >
          {compareMode ? '✓ Comparando países' : 'Comparar países'}
        </button>
        <button
          className={`${btn} w-full ${mute ? 'border-yellow-400 text-yellow-300' : ''}`}
          onClick={onToggleMute}
        >
          {mute ? '✓ Mapa mudo (editando)' : '🗺️ Mapa mudo (editar)'}
        </button>
        <button className={`${btn} w-full`} onClick={onSettings}>
          ⚙️ Ajustes
        </button>
      </div>

      <div className="space-y-2">
        <label className="text-xs uppercase tracking-wide text-neutral-400">Zoom</label>
        <div className="flex gap-2">
          <button className={btn} onClick={() => onZoom(0.7)}>
            + Acercar
          </button>
          <button className={btn} onClick={() => onZoom(1.4)}>
            − Alejar
          </button>
        </div>
      </div>

      <p className="text-xs text-neutral-500">
        Arrastrá para girar · rueda para zoom · pasá el cursor sobre un país.
      </p>
    </aside>
  )
}
