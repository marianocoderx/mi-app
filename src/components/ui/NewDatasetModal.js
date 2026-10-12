'use client'

import { useMemo, useState } from 'react'
import { parseCSV } from '@/utils/parseDataset'

const input =
  'w-full rounded-md bg-neutral-800 border border-neutral-700 px-2 py-1.5 text-sm outline-none focus:border-cyan-400'
const btn = 'rounded-md bg-neutral-800 border border-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-700'

export default function NewDatasetModal({ countryList, onCreate, onClose }) {
  const [name, setName] = useState('')
  const [unit, setUnit] = useState('')
  const [kind, setKind] = useState('numeric')
  const [rows, setRows] = useState([])
  const [search, setSearch] = useState('')
  const [pick, setPick] = useState(null)
  const [value, setValue] = useState('')
  const [csv, setCsv] = useState('')
  const [showImport, setShowImport] = useState(false)
  const [imported, setImported] = useState(null) // serie temporal importada
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const isCat = kind === 'category'

  const nameOf = useMemo(() => {
    const m = {}
    countryList.forEach((c) => (m[c.iso3] = c.name))
    return m
  }, [countryList])

  const byKey = useMemo(() => {
    const m = {}
    countryList.forEach((c) => {
      m[c.iso3.toUpperCase()] = c.iso3
      m[c.name.toUpperCase()] = c.iso3
    })
    return m
  }, [countryList])

  const suggestions = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q || pick) return []
    const used = new Set(rows.map((r) => r.iso3))
    return countryList
      .filter((c) => !used.has(c.iso3) && (c.name.toLowerCase().includes(q) || c.iso3.toLowerCase() === q))
      .slice(0, 6)
  }, [search, pick, rows, countryList])

  const switchKind = (k) => {
    setKind(k)
    setRows([])
    setImported(null)
    setError('')
    setInfo('')
  }

  const addRow = () => {
    if (!pick) return setError('Elegí un país de la lista.')
    if (isCat) {
      if (!value.trim()) return setError('Escribí la categoría (ej: OTAN).')
      setRows((prev) => [{ iso3: pick.iso3, value: value.trim() }, ...prev.filter((r) => r.iso3 !== pick.iso3)])
    } else {
      const num = Number(String(value).replace(',', '.'))
      if (value === '' || !Number.isFinite(num)) return setError('Ingresá un valor numérico.')
      setRows((prev) => [{ iso3: pick.iso3, value: String(num) }, ...prev])
    }
    setPick(null)
    setSearch('')
    setValue('')
    setError('')
    setInfo('')
  }

  const updateRow = (iso3, v) => setRows((prev) => prev.map((r) => (r.iso3 === iso3 ? { ...r, value: v } : r)))
  const removeRow = (iso3) => setRows((prev) => prev.filter((r) => r.iso3 !== iso3))

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCsv(await file.text())
    if (!name) setName(file.name.replace(/\.[^.]+$/, ''))
  }

  const importCSV = () => {
    const { values, series, count, seriesCount } = parseCSV(csv, { text: isCat })
    if (count === 0 && seriesCount === 0) return setError('No encontré filas válidas.')

    if (seriesCount > 0) {
      const out = {}
      let ok = 0
      let skipped = 0
      Object.entries(series).forEach(([y, row]) => {
        Object.entries(row).forEach(([k, v]) => {
          const iso = byKey[k]
          if (iso) {
            if (!out[y]) out[y] = {}
            out[y][iso] = v
            ok++
          } else skipped++
        })
      })
      if (!ok) return setError('No reconocí ningún país en el archivo.')
      setImported(out)
      setRows([])
      setInfo(`Serie temporal importada: ${ok} datos (${skipped} no reconocidos).`)
    } else {
      const merged = {}
      rows.forEach((r) => (merged[r.iso3] = r.value))
      let ok = 0
      let skipped = 0
      Object.entries(values).forEach(([k, v]) => {
        const iso = byKey[k]
        if (iso) {
          merged[iso] = String(v)
          ok++
        } else skipped++
      })
      setRows(Object.entries(merged).map(([iso3, v]) => ({ iso3, value: v })))
      setInfo(`Importados: ${ok}. No reconocidos: ${skipped}.`)
    }
    setCsv('')
    setError('')
    setShowImport(false)
  }

  const handleCreate = () => {
    if (!name.trim()) return setError('Ponele un nombre.')
    const base = {
      id: `custom-${Date.now()}`,
      name: name.trim(),
      unit: isCat ? '' : unit.trim(),
      kind,
      scale: 'linear',
      custom: true,
    }
    if (imported) return onCreate({ ...base, series: imported, values: {} })
    if (rows.length === 0) return setError('Agregá al menos un país.')
    const values = {}
    for (const r of rows) {
      if (isCat) values[r.iso3] = r.value
      else {
        const num = Number(String(r.value).replace(',', '.'))
        if (!Number.isFinite(num)) return setError(`Valor inválido en ${nameOf[r.iso3] || r.iso3}.`)
        values[r.iso3] = num
      }
    }
    onCreate({ ...base, values })
  }

  const tab = (on) =>
    `flex-1 rounded-md border px-2 py-1 text-xs ${
      on ? 'border-cyan-400 bg-cyan-900/40 text-cyan-200' : 'border-neutral-700 bg-neutral-800 hover:bg-neutral-700'
    }`

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 p-4">
      <div className="flex max-h-full w-full max-w-lg flex-col rounded-xl bg-neutral-900 p-5 text-sm text-neutral-100 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">Nueva estadística</h2>
          <button className="text-neutral-400 hover:text-white" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="space-y-3 overflow-y-auto pr-1">
          <div className="flex gap-2">
            <button className={tab(!isCat)} onClick={() => switchKind('numeric')}>
              Numérica (valores)
            </button>
            <button className={tab(isCat)} onClick={() => switchKind('category')}>
              Por categorías (grupos)
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <input
              className={`${input} ${isCat ? 'col-span-3' : 'col-span-2'}`}
              placeholder={isCat ? 'Nombre (ej: Alianzas militares)' : 'Nombre (ej: Consumo de café)'}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {!isCat && (
              <input className={input} placeholder="Unidad" value={unit} onChange={(e) => setUnit(e.target.value)} />
            )}
          </div>

          {!imported && (
            <div className="space-y-2 rounded-lg border border-neutral-800 p-3">
              <p className="text-xs uppercase tracking-wide text-neutral-400">Agregar país</p>
              <div className="relative">
                <input
                  className={input}
                  placeholder="Buscar país (nombre en inglés o ISO3)"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPick(null)
                  }}
                />
                {suggestions.length > 0 && (
                  <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border border-neutral-700 bg-neutral-800">
                    {suggestions.map((c) => (
                      <li
                        key={c.iso3}
                        className="cursor-pointer px-2 py-1.5 hover:bg-neutral-700"
                        onClick={() => {
                          setPick(c)
                          setSearch(c.name)
                          setError('')
                        }}
                      >
                        {c.name} <span className="text-neutral-400">({c.iso3})</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  className={input}
                  placeholder={isCat ? 'Categoría (ej: OTAN)' : 'Valor'}
                  inputMode={isCat ? 'text' : 'decimal'}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addRow()}
                />
                <button className={`${btn} bg-cyan-700 hover:bg-cyan-600`} onClick={addRow}>
                  Agregar
                </button>
              </div>
            </div>
          )}

          <div>
            <button className={btn} onClick={() => setShowImport(!showImport)}>
              {showImport ? 'Cerrar importación' : 'Importar CSV / pegar filas'}
            </button>
            {showImport && (
              <div className="mt-2 space-y-2">
                <input type="file" accept=".csv,.txt" onChange={handleFile} className="text-xs" />
                <textarea
                  className={`${input} h-24 font-mono`}
                  placeholder={isCat ? 'ARG,Mercosur\nBRA,Mercosur\nFRA,OTAN' : 'ARG,46\nBRA,216\n\nSerie temporal (ISO3,año,valor):\nARG,2019,44\nARG,2020,45'}
                  value={csv}
                  onChange={(e) => setCsv(e.target.value)}
                />
                <button className={btn} onClick={importCSV}>
                  Importar filas
                </button>
              </div>
            )}
          </div>

          {imported ? (
            <div className="rounded-lg border border-neutral-800 p-3 text-xs text-cyan-200">
              Esta estadística tiene serie temporal: vas a poder moverte por años con la barra de tiempo.
              <button className="ml-2 text-neutral-400 underline" onClick={() => setImported(null)}>
                Quitar serie
              </button>
            </div>
          ) : (
            <div>
              <p className="mb-1 text-xs uppercase tracking-wide text-neutral-400">
                Países cargados ({rows.length})
              </p>
              {rows.length === 0 ? (
                <p className="text-xs text-neutral-500">Todavía no agregaste ninguno.</p>
              ) : (
                <ul className="max-h-48 space-y-1 overflow-y-auto">
                  {rows.map((r) => (
                    <li key={r.iso3} className="flex items-center gap-2">
                      <span className="flex-1 truncate">{nameOf[r.iso3] || r.iso3}</span>
                      <input
                        className="w-28 rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1 text-right text-sm outline-none focus:border-cyan-400"
                        value={r.value}
                        onChange={(e) => updateRow(r.iso3, e.target.value)}
                      />
                      <button className="text-neutral-400 hover:text-red-400" onClick={() => removeRow(r.iso3)}>
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {info && <p className="mt-2 text-xs text-cyan-300">{info}</p>}
        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

        <div className="mt-4 flex justify-end gap-2">
          <button className={btn} onClick={onClose}>
            Cancelar
          </button>
          <button className={`${btn} bg-cyan-700 hover:bg-cyan-600`} onClick={handleCreate}>
            Crear y mostrar
          </button>
        </div>
      </div>
    </div>
  )
}
