'use client'

import { useEffect, useState } from 'react'

const COLORS = ['#22d3ee', '#facc15', '#f472b6', '#a3e635', '#c084fc', '#fb923c']
const numInput =
  'w-16 rounded-md border border-neutral-700 bg-neutral-800 px-1 py-1 text-center text-xs outline-none focus:border-cyan-400'

export default function TimeBar({ years, time, setTime, periods, onAddPeriod, onRemovePeriod }) {
  const y0 = years[0]
  const y1 = years[years.length - 1]
  const [playing, setPlaying] = useState(false)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ title: '', start: '', end: '' })
  const [error, setError] = useState('')

  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => {
      setTime((t) => {
        const cur = t.year ?? y0
        return { ...t, year: cur >= y1 ? y0 : cur + 1 }
      })
    }, 900)
    return () => clearInterval(id)
  }, [playing, y0, y1, setTime])

  const goYear = () => {
    setTime((t) => ({ ...t, mode: 'year' }))
  }

  const goRange = () => {
    setPlaying(false)
    setTime((t) => {
      let from = Math.max(y0, t.from)
      let to = Math.min(y1, t.to)
      if (from > to) {
        from = y0
        to = y1
      }
      return { ...t, mode: 'range', from, to }
    })
  }

  const pickPeriod = (p) => {
    setPlaying(false)
    setTime((t) => ({ ...t, mode: 'range', from: Math.max(y0, p.start), to: Math.min(y1, p.end) }))
  }

  const addPeriod = () => {
    const start = Number(form.start)
    const end = Number(form.end)
    if (!form.title.trim()) return setError('Poné un nombre.')
    if (!Number.isFinite(start) || !Number.isFinite(end) || form.start === '' || form.end === '')
      return setError('Años inválidos.')
    if (end < start) return setError('El fin debe ser posterior al inicio.')
    onAddPeriod({
      id: `p-${Date.now()}`,
      type: 'period',
      title: form.title.trim(),
      start,
      end,
      color: COLORS[periods.length % COLORS.length],
    })
    setForm({ title: '', start: '', end: '' })
    setError('')
    setAdding(false)
  }

  const visible = periods.filter((p) => p.end >= y0 && p.start <= y1)
  const modeBtn = (on) =>
    `rounded-md border px-2 py-1 text-xs ${
      on ? 'border-cyan-400 bg-cyan-900/40 text-cyan-200' : 'border-neutral-700 bg-neutral-800 hover:bg-neutral-700'
    }`

  return (
    <div className="absolute bottom-4 left-1/2 z-10 w-[min(92vw,720px)] -translate-x-1/2 space-y-2 rounded-xl bg-neutral-900/90 p-3 text-sm text-neutral-100 backdrop-blur">
      <div className="flex items-center gap-2">
        {time.mode === 'year' && (
          <button
            className="w-8 rounded-md border border-neutral-700 bg-neutral-800 py-1 hover:bg-neutral-700"
            onClick={() => setPlaying((p) => !p)}
            aria-label="Reproducir"
          >
            {playing ? '⏸' : '▶'}
          </button>
        )}

        {time.mode === 'year' ? (
          <>
            <input
              type="range"
              className="flex-1"
              min={y0}
              max={y1}
              value={time.year ?? y1}
              onChange={(e) => setTime((t) => ({ ...t, year: Number(e.target.value) }))}
            />
            <span className="w-12 text-right font-semibold">{time.year ?? y1}</span>
          </>
        ) : (
          <div className="flex flex-1 items-center gap-2 text-xs">
            <span className="text-neutral-400">Promedio de</span>
            <input
              type="number"
              className={numInput}
              value={time.from}
              min={y0}
              max={y1}
              onChange={(e) => setTime((t) => ({ ...t, from: Number(e.target.value) }))}
            />
            <span className="text-neutral-400">a</span>
            <input
              type="number"
              className={numInput}
              value={time.to}
              min={y0}
              max={y1}
              onChange={(e) => setTime((t) => ({ ...t, to: Number(e.target.value) }))}
            />
            <span className="text-neutral-500">
              ({y0}–{y1})
            </span>
          </div>
        )}

        <button className={modeBtn(time.mode === 'year')} onClick={goYear}>
          Año
        </button>
        <button className={modeBtn(time.mode === 'range')} onClick={goRange}>
          Período
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-1 text-xs">
        {visible.map((p) => (
          <span
            key={p.id}
            className="flex items-center gap-1 rounded-full border border-neutral-700 bg-neutral-800 px-2 py-0.5"
          >
            <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
            <button className="hover:text-cyan-300" onClick={() => pickPeriod(p)} title={`${p.start}–${p.end}`}>
              {p.title}
            </button>
            <button className="text-neutral-500 hover:text-red-400" onClick={() => onRemovePeriod(p.id)}>
              ✕
            </button>
          </span>
        ))}
        <button
          className="rounded-full border border-dashed border-neutral-600 px-2 py-0.5 text-neutral-300 hover:bg-neutral-800"
          onClick={() => setAdding((a) => !a)}
        >
          + Período
        </button>
      </div>

      {adding && (
        <div className="flex flex-wrap items-center gap-2">
          <input
            className="min-w-32 flex-1 rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1 text-xs outline-none focus:border-cyan-400"
            placeholder="Nombre del período"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <input
            className={numInput}
            placeholder="Desde"
            value={form.start}
            onChange={(e) => setForm({ ...form, start: e.target.value })}
          />
          <input
            className={numInput}
            placeholder="Hasta"
            value={form.end}
            onChange={(e) => setForm({ ...form, end: e.target.value })}
          />
          <button
            className="rounded-md border border-neutral-700 bg-cyan-700 px-2 py-1 text-xs hover:bg-cyan-600"
            onClick={addPeriod}
          >
            Agregar
          </button>
          {error && <span className="text-xs text-red-400">{error}</span>}
        </div>
      )}
    </div>
  )
}
