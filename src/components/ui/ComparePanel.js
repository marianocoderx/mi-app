'use client'

import { useState } from 'react'
import ChartView, { CHART_COLORS } from '@/components/ui/ChartView'
import LineChart from '@/components/ui/LineChart'

const TYPES = [
  ['bars', 'Barras'],
  ['rank', 'Ranking'],
  ['pie', 'Torta'],
  ['line', 'Evolución'],
  ['radar', 'Radar'],
]

const fmt = (n) =>
  typeof n === 'number'
    ? n.toLocaleString('es-AR', { maximumFractionDigits: 2 })
    : n === undefined || n === null
    ? '—'
    : n

export default function ComparePanel({
  selected,
  nameOf,
  datasets,
  active,
  activeVals,
  getVals,
  time,
  timeLabel,
  onRemove,
  onClear,
}) {
  const [type, setType] = useState('bars')

  const items = selected.map((iso, i) => ({
    iso,
    label: nameOf[iso] || iso,
    value: activeVals[iso],
    color: CHART_COLORS[i % CHART_COLORS.length],
  }))

  const numeric = active.kind !== 'category'
  const types = TYPES.filter(([id]) => id !== 'line' || active.series)
  const current = types.some(([id]) => id === type) ? type : 'bars'

  const loaded = datasets.filter((d) => !d.pending && !d.error)
  const rows = loaded.map((d) => ({ d, vals: getVals(d) }))
  const radarDs = loaded.filter((d) => d.kind !== 'category').map((d) => ({ ...d, values: getVals(d) }))

  return (
    <aside className="absolute top-4 right-4 z-10 w-80 max-h-[calc(100vh-2rem)] overflow-y-auto rounded-xl bg-neutral-900/90 p-4 text-sm text-neutral-100 backdrop-blur space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Comparar países</h2>
        {selected.length > 0 && (
          <button className="text-xs text-neutral-400 hover:text-white" onClick={onClear}>
            Limpiar
          </button>
        )}
      </div>

      {selected.length === 0 ? (
        <p className="text-xs text-neutral-400">
          Hacé click en hasta 5 países del globo para compararlos.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-1">
            {items.map((it) => (
              <span
                key={it.iso}
                className="flex items-center gap-1 rounded-full bg-neutral-800 px-2 py-0.5 text-xs"
              >
                <span className="h-2 w-2 rounded-full" style={{ background: it.color }} />
                {it.label}
                <button className="text-neutral-400 hover:text-red-400" onClick={() => onRemove(it.iso)}>
                  ✕
                </button>
              </span>
            ))}
          </div>

          {numeric && (
            <div className="flex gap-1">
              {types.map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setType(id)}
                  className={`flex-1 rounded-md border px-1 py-1 text-xs ${
                    current === id
                      ? 'border-cyan-400 bg-cyan-900/40 text-cyan-200'
                      : 'border-neutral-700 bg-neutral-800 hover:bg-neutral-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          <div>
            {current !== 'radar' && numeric && (
              <p className="mb-1 text-xs uppercase tracking-wide text-neutral-400">
                {active.name} {active.unit && `(${active.unit})`} {timeLabel && `· ${timeLabel}`}
              </p>
            )}
            {!numeric ? (
              <p className="text-xs text-neutral-400">
                La estadística activa es por categorías. Elegí una numérica para graficar; la tabla de
                abajo sí muestra todas.
              </p>
            ) : current === 'line' ? (
              <LineChart dataset={active} items={items} year={time.mode === 'year' ? time.year : null} />
            ) : (
              <ChartView type={current} items={items} datasets={radarDs} />
            )}
          </div>

          <div className="overflow-x-auto">
            <p className="mb-1 text-xs uppercase tracking-wide text-neutral-400">
              Todas las estadísticas {timeLabel && `· ${timeLabel}`}
            </p>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-neutral-400">
                  <th className="pb-1 pr-2 font-normal">Estadística</th>
                  {selected.map((iso) => (
                    <th key={iso} className="pb-1 pr-2 font-normal">
                      {iso}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(({ d, vals }) => (
                  <tr key={d.id} className="border-t border-neutral-800">
                    <td className="py-1 pr-2">{d.name}</td>
                    {selected.map((iso) => (
                      <td key={iso} className="py-1 pr-2">
                        {fmt(vals[iso])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </aside>
  )
}
