'use client'

import { useMemo, useState } from 'react'
import ChartView, { CHART_COLORS } from '@/components/ui/ChartView'
import LineChart from '@/components/ui/LineChart'
import { CATALOG } from '@/data/catalog'
import { fetchCountrySeries } from '@/utils/worldbank'

export const DEFAULT_WB = {
  code: 'SP.POP.TOTL',
  name: 'Población total',
  unit: 'personas',
  isos: [],
  names: {},
  series: null,
  year: null,
  key: '',
}

const TYPES = [
  ['bars', 'Barras'],
  ['rank', 'Ranking'],
  ['pie', 'Torta'],
  ['line', 'Evolución'],
]

const color = (i) => CHART_COLORS[i % CHART_COLORS.length]

function valueAt(series, iso, year) {
  for (let k = 0; k <= 5; k++) {
    const row = series[year - k]
    if (row && typeof row[iso] === 'number') return row[iso]
  }
  return undefined
}

export function buildItems(data) {
  if (data.source === 'wb') {
    const wb = data.wb
    if (!wb || !wb.series) return []
    return wb.isos.map((iso, i) => ({
      iso,
      label: (wb.names && wb.names[iso]) || iso,
      color: color(i),
      value: valueAt(wb.series, iso, wb.year),
    }))
  }
  return (data.rows || [])
    .filter((r) => r.label && r.label.trim())
    .map((r, i) => {
      const n = Number(String(r.value).replace(',', '.'))
      const label = r.label.trim()
      return {
        iso: label.length > 6 ? label.slice(0, 5) + '…' : label,
        label,
        color: color(i),
        value: r.value !== '' && Number.isFinite(n) ? n : undefined,
      }
    })
}

export function ChartItemView({ data }) {
  const isWb = data.source === 'wb'
  const items = buildItems(data)
  const type = data.type === 'line' && !isWb ? 'bars' : data.type

  if (!items.length) {
    return (
      <p className="text-xs text-neutral-500">
        {isWb ? 'Elegí países y tocá “Descargar y graficar”.' : 'Agregá filas con etiqueta y valor.'}
      </p>
    )
  }

  const unit = isWb ? data.wb.unit : data.unit
  return (
    <div className="mx-auto max-w-xl">
      {isWb && (
        <p className="mb-1 text-xs uppercase tracking-wide text-neutral-400">
          {data.wb.name} {unit && `(${unit})`} {type !== 'line' && `· ${data.wb.year}`}
        </p>
      )}
      {!isWb && unit && <p className="mb-1 text-xs uppercase tracking-wide text-neutral-400">{unit}</p>}

      {type === 'line' ? (
        <LineChart dataset={{ series: data.wb.series }} items={items} year={null} />
      ) : (
        <ChartView type={type} items={items} datasets={[]} />
      )}

      {(type === 'line' || type === 'bars') && (
        <ul className="mt-2 flex flex-wrap gap-3 text-xs">
          {items.map((it) => (
            <li key={it.iso + it.label} className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full" style={{ background: it.color }} />
              {it.label}
            </li>
          ))}
        </ul>
      )}
      {isWb && <p className="mt-1 text-xs text-neutral-600">Fuente: Banco Mundial ({data.wb.code})</p>}
    </div>
  )
}

const input =
  'w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm outline-none focus:border-cyan-400'
const btn = 'rounded-md border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs hover:bg-neutral-700'
const tab = (on) =>
  `rounded-md border px-3 py-1 text-xs ${
    on ? 'border-cyan-400 bg-cyan-900/40 text-cyan-200' : 'border-neutral-700 bg-neutral-800 hover:bg-neutral-700'
  }`

export function ChartItemEditor({ data, onChange, countryList }) {
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [paste, setPaste] = useState('')

  const isWb = data.source === 'wb'
  const wb = data.wb || DEFAULT_WB
  const set = (patch) => onChange({ ...data, ...patch })
  const setWb = (patch) => onChange({ ...data, wb: { ...wb, ...patch } })
  const currentKey = wb.code + ':' + wb.isos.join(',')
  const stale = isWb && wb.series && wb.key !== currentKey
  const types = TYPES.filter(([id]) => id !== 'line' || isWb)

  const suggestions = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return []
    return countryList
      .filter((c) => !wb.isos.includes(c.iso3) && (c.name.toLowerCase().includes(q) || c.iso3.toLowerCase() === q))
      .slice(0, 6)
  }, [search, countryList, wb.isos])

  const chooseSource = (src) => {
    if (src === 'wb') set({ source: 'wb', wb: data.wb || DEFAULT_WB })
    else set({ source: 'manual', type: data.type === 'line' ? 'bars' : data.type })
  }

  const rows = data.rows || []
  const patchRow = (i, p) => set({ rows: rows.map((r, k) => (k === i ? { ...r, ...p } : r)) })

  const importPaste = () => {
    const parsed = paste
      .split(/\r?\n/)
      .map((l) => l.split(/[,;\t]/).map((s) => s.trim()))
      .filter((p) => p.length >= 2 && p[0] && Number.isFinite(Number(p[p.length - 1].replace(',', '.'))))
      .map((p) => ({ label: p[0], value: p[p.length - 1].replace(',', '.') }))
    if (!parsed.length) return setError('No encontré filas con formato etiqueta,valor.')
    set({ rows: [...rows.filter((r) => r.label || r.value), ...parsed] })
    setPaste('')
    setError('')
  }

  const download = async () => {
    if (!wb.isos.length) return setError('Elegí al menos un país.')
    setBusy(true)
    setError('')
    try {
      const { series, names } = await fetchCountrySeries(wb.code, wb.isos)
      const years = Object.keys(series).map(Number).sort((a, b) => a - b)
      let year = years[years.length - 1]
      for (let i = years.length - 1; i >= 0; i--) {
        const row = series[years[i]]
        if (wb.isos.every((iso) => row && row[iso] !== undefined)) {
          year = years[i]
          break
        }
      }
      setWb({ series, names, year, key: currentKey })
    } catch (e) {
      setError(e.message || 'No pude consultar el Banco Mundial.')
    }
    setBusy(false)
  }

  const years = wb.series ? Object.keys(wb.series).map(Number).sort((a, b) => a - b) : []

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button className={tab(!isWb)} onClick={() => chooseSource('manual')}>
          Datos propios
        </button>
        <button className={tab(isWb)} onClick={() => chooseSource('wb')}>
          🌐 Datos abiertos (Banco Mundial)
        </button>
        <span className="mx-1 text-neutral-700">|</span>
        {types.map(([id, label]) => (
          <button key={id} className={tab(data.type === id)} onClick={() => set({ type: id })}>
            {label}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
        <ChartItemView data={data} />
      </div>

      {!isWb && (
        <div className="space-y-2">
          <input
            className={input}
            placeholder="Unidad (opcional, ej: millones de personas)"
            value={data.unit || ''}
            onChange={(e) => set({ unit: e.target.value })}
          />
          <ul className="space-y-1">
            {rows.map((r, i) => (
              <li key={i} className="flex items-center gap-2">
                <input
                  className={input}
                  placeholder="Etiqueta"
                  value={r.label}
                  onChange={(e) => patchRow(i, { label: e.target.value })}
                />
                <input
                  className={`${input} w-32 text-right`}
                  placeholder="Valor"
                  inputMode="decimal"
                  value={r.value}
                  onChange={(e) => patchRow(i, { value: e.target.value })}
                />
                <button className="text-neutral-400 hover:text-red-400" onClick={() => set({ rows: rows.filter((_, k) => k !== i) })}>
                  ✕
                </button>
              </li>
            ))}
          </ul>
          <button className={btn} onClick={() => set({ rows: [...rows, { label: '', value: '' }] })}>
            + Fila
          </button>
          <details className="text-xs text-neutral-400">
            <summary className="cursor-pointer">Pegar varias filas</summary>
            <textarea
              className={`${input} mt-2 h-24 font-mono`}
              placeholder={'Argentina,46\nBrasil,216\nChile,19.5'}
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
            />
            <button className={`${btn} mt-1`} onClick={importPaste}>
              Importar filas
            </button>
          </details>
        </div>
      )}

      {isWb && (
        <div className="space-y-3">
          <div>
            <p className="mb-1 text-xs uppercase tracking-wide text-neutral-400">Indicador</p>
            <select
              className={input}
              value={wb.code}
              onChange={(e) => {
                const c = CATALOG.find((x) => x.code === e.target.value)
                if (c) setWb({ code: c.code, name: c.name, unit: c.unit })
              }}
            >
              {CATALOG.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.topic} · {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="mb-1 text-xs uppercase tracking-wide text-neutral-400">Países (hasta 8)</p>
            <div className="mb-2 flex flex-wrap gap-1">
              {wb.isos.map((iso, i) => (
                <span key={iso} className="flex items-center gap-1 rounded-full bg-neutral-800 px-2 py-0.5 text-xs">
                  <span className="h-2 w-2 rounded-full" style={{ background: color(i) }} />
                  {(wb.names && wb.names[iso]) || (countryList.find((c) => c.iso3 === iso) || {}).name || iso}
                  <button className="text-neutral-400 hover:text-red-400" onClick={() => setWb({ isos: wb.isos.filter((x) => x !== iso) })}>
                    ✕
                  </button>
                </span>
              ))}
            </div>
            <div className="relative">
              <input
                className={input}
                placeholder="Buscar país (nombre en inglés o ISO3)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {suggestions.length > 0 && (
                <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border border-neutral-700 bg-neutral-800">
                  {suggestions.map((c) => (
                    <li
                      key={c.iso3}
                      className="cursor-pointer px-2 py-1.5 hover:bg-neutral-700"
                      onClick={() => {
                        if (wb.isos.length >= 8) return setError('Máximo 8 países.')
                        setWb({ isos: [...wb.isos, c.iso3], names: { ...wb.names, [c.iso3]: c.name } })
                        setSearch('')
                        setError('')
                      }}
                    >
                      {c.name} <span className="text-neutral-400">({c.iso3})</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className={`${btn} bg-cyan-700 hover:bg-cyan-600`} onClick={download} disabled={busy}>
              {busy ? 'Descargando…' : 'Descargar y graficar'}
            </button>
            {stale && <span className="text-xs text-yellow-300">Cambiaste la selección: volvé a descargar.</span>}
          </div>

          {wb.series && data.type !== 'line' && years.length > 0 && (
            <label className="flex items-center gap-2 text-xs text-neutral-300">
              Año {wb.year}
              <input
                type="range"
                className="flex-1"
                min={years[0]}
                max={years[years.length - 1]}
                value={wb.year}
                onChange={(e) => setWb({ year: Number(e.target.value) })}
              />
            </label>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
