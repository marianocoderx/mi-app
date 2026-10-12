'use client'

import { getYears } from '@/utils/dataset'

const compact = (n) =>
  n.toLocaleString('es-AR', { notation: 'compact', maximumFractionDigits: 1 })

export default function LineChart({ dataset, items, year }) {
  const years = getYears(dataset)
  if (years.length < 2) {
    return <p className="text-xs text-neutral-400">Esta estadística no tiene serie temporal.</p>
  }

  const W = 300
  const H = 170
  const L = 38
  const R = 8
  const T = 8
  const B = 20

  let min = Infinity
  let max = -Infinity
  items.forEach((it) =>
    years.forEach((y) => {
      const v = dataset.series[y] && dataset.series[y][it.iso]
      if (typeof v === 'number') {
        if (v < min) min = v
        if (v > max) max = v
      }
    })
  )
  if (min === Infinity) {
    return <p className="text-xs text-neutral-400">Sin datos para los países elegidos.</p>
  }
  if (min === max) {
    min -= 1
    max += 1
  }

  const y0 = years[0]
  const y1 = years[years.length - 1]
  const x = (y) => L + ((y - y0) / (y1 - y0)) * (W - L - R)
  const yy = (v) => T + (1 - (v - min) / (max - min)) * (H - T - B)

  const pathFor = (iso) => {
    let d = ''
    let started = false
    years.forEach((y) => {
      const v = dataset.series[y] && dataset.series[y][iso]
      if (typeof v !== 'number') {
        started = false
        return
      }
      d += `${started ? 'L' : 'M'}${x(y).toFixed(1)},${yy(v).toFixed(1)} `
      started = true
    })
    return d
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      <line x1={L} x2={W - R} y1={H - B} y2={H - B} stroke="#525252" />
      <line x1={L} x2={L} y1={T} y2={H - B} stroke="#525252" />
      <text x={L - 4} y={T + 8} textAnchor="end" fontSize="9" fill="#a3a3a3">
        {compact(max)}
      </text>
      <text x={L - 4} y={H - B} textAnchor="end" fontSize="9" fill="#a3a3a3">
        {compact(min)}
      </text>
      <text x={L} y={H - 6} textAnchor="start" fontSize="9" fill="#a3a3a3">
        {y0}
      </text>
      <text x={W - R} y={H - 6} textAnchor="end" fontSize="9" fill="#a3a3a3">
        {y1}
      </text>
      {year !== null && year !== undefined && year >= y0 && year <= y1 && (
        <line x1={x(year)} x2={x(year)} y1={T} y2={H - B} stroke="#e5e5e5" strokeDasharray="3 3" opacity="0.6" />
      )}
      {items.map((it) => (
        <path key={it.iso} d={pathFor(it.iso)} fill="none" stroke={it.color} strokeWidth="1.8" />
      ))}
    </svg>
  )
}
