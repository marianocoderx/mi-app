'use client'

export const CHART_COLORS = ['#22d3ee', '#facc15', '#f472b6', '#a3e635', '#c084fc']

const fmt = (n) =>
  n === undefined ? '—' : n.toLocaleString('es-AR', { maximumFractionDigits: 2 })
const compact = (n) =>
  n.toLocaleString('es-AR', { notation: 'compact', maximumFractionDigits: 1 })

function polar(cx, cy, r, a) {
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)]
}

function slicePath(cx, cy, r, a0, a1) {
  const [x0, y0] = polar(cx, cy, r, a0)
  const [x1, y1] = polar(cx, cy, r, a1)
  const large = a1 - a0 > Math.PI ? 1 : 0
  return `M${cx},${cy} L${x0},${y0} A${r},${r} 0 ${large} 1 ${x1},${y1} Z`
}

function Bars({ items }) {
  const W = 300
  const H = 170
  const top = 18
  const bottom = 26
  const chartH = H - top - bottom
  const vals = items.filter((i) => i.value !== undefined).map((i) => i.value)
  const max = vals.length ? Math.max(...vals) : 0
  const slot = (W - 20) / items.length

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      <line x1="10" x2={W - 10} y1={H - bottom} y2={H - bottom} stroke="#525252" />
      {items.map((it, i) => {
        const h = it.value !== undefined && max > 0 ? Math.max(2, (it.value / max) * chartH) : 0
        const x = 10 + i * slot + slot * 0.15
        const w = slot * 0.7
        return (
          <g key={it.iso}>
            <rect x={x} y={H - bottom - h} width={w} height={h} rx="2" fill={it.color} />
            <text x={x + w / 2} y={H - bottom - h - 4} textAnchor="middle" fontSize="9" fill="#d4d4d4">
              {it.value === undefined ? 's/d' : compact(it.value)}
            </text>
            <text x={x + w / 2} y={H - 10} textAnchor="middle" fontSize="9" fill="#a3a3a3">
              {it.iso}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function Rank({ items }) {
  const sorted = [...items].sort((a, b) => (b.value ?? -Infinity) - (a.value ?? -Infinity))
  const top = Math.max(...sorted.map((i) => i.value ?? 0), 0)
  return (
    <div className="space-y-2">
      {sorted.map((it, idx) => {
        const width = it.value !== undefined && top > 0 ? Math.max(3, (it.value / top) * 100) : 0
        return (
          <div key={it.iso}>
            <div className="flex justify-between text-xs">
              <span>
                {idx + 1}. {it.label}
              </span>
              <span>{it.value === undefined ? 'Sin datos' : fmt(it.value)}</span>
            </div>
            <div className="mt-0.5 h-2 w-full rounded bg-neutral-800">
              <div className="h-2 rounded" style={{ width: `${width}%`, background: it.color }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Pie({ items }) {
  const data = items.filter((i) => i.value > 0)
  const total = data.reduce((s, i) => s + i.value, 0)
  if (total === 0) return <p className="text-xs text-neutral-400">Ningún país elegido tiene datos positivos.</p>

  let acc = -Math.PI / 2
  return (
    <div>
      <svg viewBox="0 0 300 170" className="w-full">
        {data.length === 1 ? (
          <circle cx="150" cy="85" r="75" fill={data[0].color} />
        ) : (
          data.map((it) => {
            const a1 = acc + (it.value / total) * Math.PI * 2
            const d = slicePath(150, 85, 75, acc, a1)
            acc = a1
            return <path key={it.iso} d={d} fill={it.color} stroke="#171717" strokeWidth="1" />
          })
        )}
      </svg>
      <ul className="mt-1 space-y-0.5 text-xs">
        {data.map((it) => (
          <li key={it.iso} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ background: it.color }} />
            <span className="flex-1">{it.label}</span>
            <span className="text-neutral-400">{((it.value / total) * 100).toFixed(1)}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Radar({ items, datasets }) {
  if (datasets.length < 3) {
    return (
      <p className="text-xs text-neutral-400">
        El radar cruza varias estadísticas y necesita al menos 3. Ahora tenés {datasets.length}.
        Creá más con "+ Nueva estadística".
      </p>
    )
  }
  const cx = 150
  const cy = 110
  const R = 75
  const n = datasets.length
  const maxes = datasets.map((d) => Math.max(...Object.values(d.values), 0))
  const angle = (i) => -Math.PI / 2 + (Math.PI * 2 * i) / n

  return (
    <svg viewBox="0 0 300 220" className="w-full">
      {[0.25, 0.5, 0.75, 1].map((k) => (
        <polygon
          key={k}
          points={datasets.map((_, i) => polar(cx, cy, R * k, angle(i)).join(',')).join(' ')}
          fill="none"
          stroke="#404040"
        />
      ))}
      {datasets.map((d, i) => {
        const [x, y] = polar(cx, cy, R, angle(i))
        const [lx, ly] = polar(cx, cy, R + 14, angle(i))
        return (
          <g key={d.id}>
            <line x1={cx} y1={cy} x2={x} y2={y} stroke="#404040" />
            <text x={lx} y={ly} textAnchor="middle" fontSize="8" fill="#a3a3a3">
              {d.name.length > 14 ? d.name.slice(0, 13) + '…' : d.name}
            </text>
          </g>
        )
      })}
      {items.map((it) => {
        const pts = datasets
          .map((d, i) => {
            const v = d.values[it.iso]
            const k = v !== undefined && maxes[i] > 0 ? Math.max(0, v) / maxes[i] : 0
            return polar(cx, cy, R * k, angle(i)).join(',')
          })
          .join(' ')
        return (
          <polygon
            key={it.iso}
            points={pts}
            fill={it.color}
            fillOpacity="0.2"
            stroke={it.color}
            strokeWidth="1.5"
          />
        )
      })}
    </svg>
  )
}

export default function ChartView({ type, items, datasets }) {
  return (
    <div>
      {type === 'bars' && <Bars items={items} />}
      {type === 'rank' && <Rank items={items} />}
      {type === 'pie' && <Pie items={items} />}
      {type === 'radar' && (
        <>
          <Radar items={items} datasets={datasets} />
          <p className="mt-1 text-xs text-neutral-500">
            Cada eje está escalado al valor máximo mundial de esa estadística.
          </p>
        </>
      )}
      {type === 'radar' && (
        <ul className="mt-1 flex flex-wrap gap-2 text-xs">
          {items.map((it) => (
            <li key={it.iso} className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full" style={{ background: it.color }} />
              {it.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
