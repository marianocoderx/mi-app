'use client'

import { useState } from 'react'
import { newId } from '@/utils/store'

const COLORS = ['#22d3ee', '#facc15', '#f472b6', '#a3e635', '#c084fc', '#fb923c', '#f87171']
const STEPS = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000]
const cut = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s)

export function TimelineView({ data }) {
  const events = (data.events || []).filter((e) => Number.isFinite(e.year)).sort((a, b) => a.year - b.year)
  const periods = (data.periods || []).filter((p) => Number.isFinite(p.start) && Number.isFinite(p.end))
  if (!events.length && !periods.length) {
    return <p className="text-xs text-neutral-500">Todavía no hay eventos ni períodos.</p>
  }

  const ys = [...events.map((e) => e.year), ...periods.flatMap((p) => [p.start, p.end])]
  let min = Math.min(...ys)
  let max = Math.max(...ys)
  if (min === max) {
    min -= 5
    max += 5
  }
  const pad = (max - min) * 0.04
  min -= pad
  max += pad

  const W = 900
  const M = 40
  const x = (y) => M + ((y - min) / (max - min)) * (W - 2 * M)

  // Carriles para los períodos
  const laneEnd = []
  const placed = [...periods]
    .sort((a, b) => a.start - b.start)
    .map((p) => {
      let l = laneEnd.findIndex((end) => end < p.start)
      if (l === -1) {
        l = laneEnd.length
        laneEnd.push(p.end)
      } else laneEnd[l] = p.end
      return { ...p, lane: l }
    })
  const lanes = laneEnd.length
  const top = 14
  const laneH = 24
  const axisY = top + lanes * laneH + (lanes ? 24 : 8)

  // Marcas del eje
  const span = max - min
  const step = STEPS.find((s) => span / s <= 10) || 1000
  const ticks = []
  for (let t = Math.ceil(min / step) * step; t <= max; t += step) ticks.push(t)

  // Eventos en 3 alturas, evitando que se pisen
  const lastEnd = [-1e9, -1e9, -1e9]
  const evs = events.map((e) => {
    const cx = x(e.year)
    const label = cut(e.title || '', 26)
    const half = label.length * 3.3 + 8
    let lvl = lastEnd.findIndex((end) => cx - half > end)
    if (lvl === -1) lvl = lastEnd.indexOf(Math.min(...lastEnd))
    lastEnd[lvl] = cx + half
    return { ...e, cx, lvl, label }
  })
  const H = axisY + 56 + 3 * 38

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 700 }}>
        {placed.map((p) => {
          const px = x(p.start)
          const pw = Math.max(6, x(p.end) - px)
          const py = top + p.lane * laneH
          const fits = pw > (p.title || '').length * 6.2 + 10
          return (
            <g key={p.id}>
              <title>
                {p.title} ({p.start}–{p.end})
              </title>
              <rect x={px} y={py} width={pw} height={18} rx="4" fill={p.color} fillOpacity="0.35" stroke={p.color} />
              <text x={fits ? px + 5 : px + pw + 5} y={py + 13} fontSize="11" fill={fits ? '#fff' : p.color}>
                {p.title}
              </text>
            </g>
          )
        })}

        <line x1={M - 10} x2={W - M + 10} y1={axisY} y2={axisY} stroke="#737373" strokeWidth="2" />
        {ticks.map((t) => (
          <g key={t}>
            <line x1={x(t)} x2={x(t)} y1={axisY - 4} y2={axisY + 4} stroke="#737373" />
            <text x={x(t)} y={axisY - 8} textAnchor="middle" fontSize="10" fill="#737373">
              {t}
            </text>
          </g>
        ))}

        {evs.map((e) => {
          const ly = axisY + 34 + e.lvl * 38
          const anchor = e.cx < 70 ? 'start' : e.cx > W - 70 ? 'end' : 'middle'
          return (
            <g key={e.id}>
              <title>
                {e.year} · {e.title}
                {e.desc ? '\n' + e.desc : ''}
              </title>
              <line x1={e.cx} x2={e.cx} y1={axisY} y2={ly - 12} stroke={e.color} strokeOpacity="0.6" />
              <circle cx={e.cx} cy={axisY} r="5" fill={e.color} />
              <text x={e.cx} y={ly} textAnchor={anchor} fontSize="10" fill={e.color}>
                {e.year}
              </text>
              <text x={e.cx} y={ly + 13} textAnchor={anchor} fontSize="11" fill="#e5e5e5">
                {e.label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

const input =
  'rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1 text-sm outline-none focus:border-cyan-400'
const btn = 'rounded-md border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs hover:bg-neutral-700'
const num = (v) => (v === '' ? '' : Number(v))

export function TimelineEditor({ data, onChange }) {
  const [info, setInfo] = useState('')
  const events = data.events || []
  const periods = data.periods || []
  const set = (patch) => onChange({ ...data, ...patch })

  const addEvent = () => {
    const last = events.filter((e) => Number.isFinite(e.year)).map((e) => e.year)
    const year = last.length ? Math.max(...last) + 10 : 2000
    set({
      events: [...events, { id: newId(), year, title: 'Nuevo evento', desc: '', color: COLORS[events.length % COLORS.length] }],
    })
  }
  const addPeriod = () =>
    set({
      periods: [
        ...periods,
        { id: newId(), title: 'Nuevo período', start: 2000, end: 2010, color: COLORS[periods.length % COLORS.length] },
      ],
    })

  const patchEvent = (id, p) => set({ events: events.map((e) => (e.id === id ? { ...e, ...p } : e)) })
  const patchPeriod = (id, p) => set({ periods: periods.map((e) => (e.id === id ? { ...e, ...p } : e)) })

  const importGlobe = () => {
    try {
      const tl = JSON.parse(localStorage.getItem('timeline-items') || '[]')
      const have = new Set(periods.map((p) => p.id))
      const add = tl
        .filter((p) => p.type === 'period' && !have.has(p.id))
        .map((p) => ({ id: p.id, title: p.title, start: p.start, end: p.end, color: p.color }))
      if (!add.length) return setInfo('No hay períodos nuevos para traer.')
      set({ periods: [...periods, ...add] })
      setInfo(`Se trajeron ${add.length} períodos del globo.`)
    } catch {
      setInfo('No pude leer los períodos del globo.')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button className={btn} onClick={addEvent}>
          + Evento
        </button>
        <button className={btn} onClick={addPeriod}>
          + Período
        </button>
        <button className={btn} onClick={importGlobe}>
          Traer períodos del globo
        </button>
        {info && <span className="text-xs text-cyan-300">{info}</span>}
      </div>

      <div>
        <p className="mb-1 text-xs uppercase tracking-wide text-neutral-400">Eventos ({events.length})</p>
        <ul className="space-y-1">
          {events.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center gap-2">
              <input
                type="number"
                className={`${input} w-24`}
                value={e.year}
                onChange={(ev) => patchEvent(e.id, { year: num(ev.target.value) })}
              />
              <input
                className={`${input} min-w-40 flex-1`}
                value={e.title}
                onChange={(ev) => patchEvent(e.id, { title: ev.target.value })}
                placeholder="Título"
              />
              <input
                className={`${input} min-w-40 flex-1`}
                value={e.desc || ''}
                onChange={(ev) => patchEvent(e.id, { desc: ev.target.value })}
                placeholder="Descripción (se ve al pasar el cursor)"
              />
              <input type="color" value={e.color} onChange={(ev) => patchEvent(e.id, { color: ev.target.value })} />
              <button className="text-neutral-400 hover:text-red-400" onClick={() => set({ events: events.filter((x) => x.id !== e.id) })}>
                ✕
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="mb-1 text-xs uppercase tracking-wide text-neutral-400">Períodos ({periods.length})</p>
        <ul className="space-y-1">
          {periods.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-2">
              <input
                className={`${input} min-w-40 flex-1`}
                value={p.title}
                onChange={(ev) => patchPeriod(p.id, { title: ev.target.value })}
                placeholder="Nombre"
              />
              <input
                type="number"
                className={`${input} w-24`}
                value={p.start}
                onChange={(ev) => patchPeriod(p.id, { start: num(ev.target.value) })}
              />
              <span className="text-neutral-500">a</span>
              <input
                type="number"
                className={`${input} w-24`}
                value={p.end}
                onChange={(ev) => patchPeriod(p.id, { end: num(ev.target.value) })}
              />
              <input type="color" value={p.color} onChange={(ev) => patchPeriod(p.id, { color: ev.target.value })} />
              <button className="text-neutral-400 hover:text-red-400" onClick={() => set({ periods: periods.filter((x) => x.id !== p.id) })}>
                ✕
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
