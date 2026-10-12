'use client'

import { useMemo, useState } from 'react'
import { CATALOG } from '@/data/catalog'
import { catalogToDataset } from '@/data/datasets'
import { fetchIndicatorInfo } from '@/utils/worldbank'

const input =
  'w-full rounded-md bg-neutral-800 border border-neutral-700 px-2 py-1.5 text-sm outline-none focus:border-cyan-400'
const btn = 'rounded-md bg-neutral-800 border border-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-700'

export default function CatalogModal({ have, onAdd, onClose }) {
  const [q, setQ] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return CATALOG
    return CATALOG.filter(
      (c) =>
        c.name.toLowerCase().includes(s) ||
        c.topic.toLowerCase().includes(s) ||
        c.code.toLowerCase().includes(s)
    )
  }, [q])

  const topics = [...new Set(list.map((c) => c.topic))]

  const addByCode = async () => {
    const c = code.trim()
    if (!c) return
    setBusy(true)
    setError('')
    try {
      const info = await fetchIndicatorInfo(c)
      onAdd(catalogToDataset({ code: info.code, name: info.name, unit: info.unit, log: false }))
    } catch (e) {
      setError(e.message || 'No pude consultar el Banco Mundial.')
    }
    setBusy(false)
  }

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 p-4">
      <div className="flex max-h-full w-full max-w-lg flex-col rounded-xl bg-neutral-900 p-5 text-sm text-neutral-100 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">Datos abiertos · Banco Mundial</h2>
          <button className="text-neutral-400 hover:text-white" onClick={onClose}>
            ✕
          </button>
        </div>

        <input
          className={input}
          placeholder="Buscar (ej: salud, CO2, internet)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        <div className="mt-3 space-y-3 overflow-y-auto pr-1">
          {topics.map((t) => (
            <div key={t}>
              <p className="mb-1 text-xs uppercase tracking-wide text-neutral-400">{t}</p>
              <ul className="space-y-1">
                {list
                  .filter((c) => c.topic === t)
                  .map((c) => {
                    const id = `wb-${c.code}`
                    const used = have.includes(id)
                    return (
                      <li key={c.code} className="flex items-center gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="truncate">{c.name}</div>
                          <div className="truncate text-xs text-neutral-500">
                            {c.unit} · {c.code}
                          </div>
                        </div>
                        <button
                          className={`${btn} ${used ? 'opacity-60' : 'bg-cyan-700 hover:bg-cyan-600'}`}
                          onClick={() => onAdd(catalogToDataset(c))}
                        >
                          {used ? 'Ver' : 'Agregar'}
                        </button>
                      </li>
                    )
                  })}
              </ul>
            </div>
          ))}
          {list.length === 0 && <p className="text-xs text-neutral-500">Sin resultados en el catálogo.</p>}
        </div>

        <div className="mt-4 space-y-2 border-t border-neutral-800 pt-3">
          <p className="text-xs uppercase tracking-wide text-neutral-400">¿Otro indicador?</p>
          <div className="flex gap-2">
            <input
              className={input}
              placeholder="Código, ej: SP.DYN.AMRT.MA"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addByCode()}
            />
            <button className={`${btn} bg-cyan-700 hover:bg-cyan-600`} onClick={addByCode} disabled={busy}>
              {busy ? '...' : 'Buscar'}
            </button>
          </div>
          <p className="text-xs text-neutral-500">
            Hay más de 1.400 indicadores en data.worldbank.org/indicator (el código figura en cada ficha).
          </p>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
      </div>
    </div>
  )
}
