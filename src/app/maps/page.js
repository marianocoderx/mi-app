'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { geoPath, geoMercator, geoNaturalEarth1 } from 'd3-geo'
import FlatMap from '@/components/maps/FlatMap'
import { DRAW_COLORS } from '@/components/ui/DrawToolbar'
import { VIEWS } from '@/data/regions'
import { CATALOG } from '@/data/catalog'
import { OWID_CATALOG } from '@/data/catalogOwid'
import { fetchDataset } from '@/utils/sources'
import { getCountryList, getIso3, getName } from '@/utils/countries'
import { getYears, getValues, getRange, defaultYear, makeNormalizer } from '@/utils/dataset'
import { findValue } from '@/utils/parseDataset'
import { getColor, gradientCss } from '@/utils/colors'

const MARKS_KEY = 'flatmap-marks-v1'
const BASE = '#d1d5db'
const DIM = '#3b4350'
const NO_DATA = '#9ca3af'
const OCEAN = '#16365c'
const BORDER = '#374151'

const OPTIONS = [
  ...CATALOG.map((c) => ({ key: 'worldbank:' + c.code, src: 'worldbank', code: c.code, name: 'Banco Mundial · ' + c.name, unit: c.unit, log: !!c.log })),
  ...OWID_CATALOG.map((c) => ({ key: 'owid:' + c.code, src: 'owid', code: c.code, name: 'OWID · ' + c.name, unit: c.unit, log: false })),
]

const compact = (n) => n.toLocaleString('es-AR', { notation: 'compact', maximumFractionDigits: 1 })
const input =
  'w-full rounded-md bg-neutral-800 border border-neutral-700 px-2 py-1.5 text-sm outline-none focus:border-cyan-400'
const btn = 'rounded-md border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs hover:bg-neutral-700'
const tab = (on) =>
  `flex-1 rounded-md border px-2 py-1 text-xs ${
    on ? 'border-cyan-400 bg-cyan-900/40 text-cyan-200' : 'border-neutral-700 bg-neutral-800 hover:bg-neutral-700'
  }`

export default function MapsPage() {
  const svgRef = useRef(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [world, setWorld] = useState([])
  const [arg, setArg] = useState(null) // null = sin cargar, 'error', o lista de provincias
  const [viewId, setViewId] = useState('world')
  const [mode, setMode] = useState('stats')
  const [optKey, setOptKey] = useState(OPTIONS[0].key)
  const [load, setLoad] = useState({ key: '', status: 'idle', series: null, error: '' })
  const [year, setYear] = useState(null)
  const [color, setColor] = useState(DRAW_COLORS[0])
  const [showNames, setShowNames] = useState(true)
  const [marks, setMarks] = useState({})
  const [loaded, setLoaded] = useState(false)
  const [retry, setRetry] = useState(0)

  const view = VIEWS.find((v) => v.id === viewId)
  const effMode = view.kind === 'argentina' ? 'paint' : mode
  const opt = OPTIONS.find((o) => o.key === optKey)

  useEffect(() => {
    fetch('/data/countries.geojson')
      .then((r) => r.json())
      .then((g) => setWorld(g.features))
    try {
      setMarks(JSON.parse(localStorage.getItem(MARKS_KEY) || '{}'))
    } catch {}
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!loaded) return
    try {
      localStorage.setItem(MARKS_KEY, JSON.stringify(marks))
    } catch {}
  }, [marks, loaded])

  useEffect(() => {
    if (viewId !== 'argentina' || arg !== null) return
    fetch('/data/argentina.geojson')
      .then((r) => {
        if (!r.ok) throw new Error('404')
        return r.json()
      })
      .then((g) => setArg(g.features))
      .catch(() => setArg('error'))
  }, [viewId, arg])

  const validIso = useMemo(() => new Set(getCountryList(world).map((c) => c.iso3)), [world])

  // Descarga de la estadística elegida (con caché en IndexedDB)
  useEffect(() => {
    if (effMode !== 'stats' || !validIso.size) return
    let cancel = false
    setLoad({ key: optKey, status: 'loading', series: null, error: '' })
    fetchDataset({ src: opt.src, wb: opt.code }, validIso)
      .then((series) => {
        if (cancel) return
        setLoad({ key: optKey, status: 'ok', series, error: '' })
        setYear(defaultYear({ series }))
      })
      .catch((e) => !cancel && setLoad({ key: optKey, status: 'error', series: null, error: e.message || 'Error de red' }))
    return () => {
      cancel = true
    }
  }, [optKey, effMode, validIso, retry])

  const ds = load.status === 'ok' && load.key === optKey ? { series: load.series } : null
  const years = useMemo(() => (ds ? getYears(ds) : []), [load])
  const range = useMemo(() => (ds ? getRange(ds) : { min: 0, max: 0 }), [load])
  const values = useMemo(() => (ds && year ? getValues(ds, { mode: 'year', year }, true) : {}), [load, year])
  const norm = useMemo(
    () => makeNormalizer(opt.log && range.min > 0 ? 'log' : 'linear', range.min, range.max, values),
    [opt, range, values]
  )

  const projection = useMemo(() => {
    if (view.kind === 'world') return geoNaturalEarth1().fitExtent([[10, 10], [990, 590]], { type: 'Sphere' })
    if (view.kind === 'argentina') {
      if (!Array.isArray(arg) || !arg.length) return null
      return geoMercator().fitExtent([[40, 20], [960, 580]], { type: 'FeatureCollection', features: arg })
    }
    return geoMercator().rotate([-view.lng, 0]).center([0, view.lat]).scale(view.scale).translate([500, 300])
  }, [view, arg])

  const viewMarks = marks[viewId] || {}

  const shapes = useMemo(() => {
    if (!projection) return []
    const path = geoPath(projection).digits(1)
    const out = []

    world.forEach((f, i) => {
      const p = f.properties
      const iso = getIso3(p)
      const name = getName(p)

      if (view.kind === 'argentina') {
        if (iso === 'ARG') return
        const d = path(f)
        if (d) out.push({ key: 'w' + i, d, fill: DIM, interactive: false })
        return
      }

      const inView =
        view.kind === 'world' || view.continents.includes(p.CONTINENT) || (view.extra || []).includes(iso)
      let fill
      let label = null
      if (effMode === 'paint') {
        fill = viewMarks[iso || name] || (inView ? BASE : DIM)
        label = showNames ? name : null
      } else if (!inView) {
        fill = DIM
      } else {
        const v = findValue(values, p)
        fill = v === undefined ? NO_DATA : getColor(norm(v))
        label = name + '\n' + (v === undefined ? 'Sin datos' : v.toLocaleString('es-AR', { maximumFractionDigits: 2 }) + ' ' + (opt.unit || ''))
      }
      const d = path(f)
      if (d) out.push({ key: 'w' + i, id: iso || name, d, fill, label, interactive: inView })
    })

    if (view.kind === 'argentina' && Array.isArray(arg)) {
      arg.forEach((f, i) => {
        const name = f.properties.name
        const d = path(f)
        if (d)
          out.push({
            key: 'a' + i,
            id: name,
            d,
            fill: viewMarks[name] || BASE,
            label: showNames ? name : null,
            interactive: true,
          })
      })
    }
    return out
  }, [projection, world, arg, view, effMode, viewMarks, values, norm, showNames, opt])

  const handleClick = (s) => {
    if (effMode !== 'paint' || !s.id) return
    setMarks((m) => {
      const cur = { ...(m[viewId] || {}) }
      if (cur[s.id] === color) delete cur[s.id]
      else cur[s.id] = color
      return { ...m, [viewId]: cur }
    })
  }

  const exportSvg = () => {
    const svg = svgRef.current
    if (!svg) return
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = view.name.replace(/[^\w]+/g, '-') + '.svg'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <main className="fixed inset-0 bg-black text-sm text-neutral-100">
      <FlatMap
        shapes={shapes}
        ocean={OCEAN}
        border={BORDER}
        onShapeClick={handleClick}
        svgRef={svgRef}
        resetKey={viewId}
      />

      <button
        className="absolute left-2 top-2 z-20 rounded-md border border-neutral-700 bg-neutral-900/90 px-3 py-2 text-xs text-neutral-100 backdrop-blur md:hidden"
        onClick={() => setMenuOpen((o) => !o)}
      >
        {menuOpen ? '✕ Cerrar' : '☰ Menú'}
      </button>
      <aside className={(menuOpen ? '' : 'max-md:hidden ') + 'absolute left-4 top-4 z-10 max-h-[calc(100vh-2rem)] w-72 space-y-4 overflow-y-auto rounded-xl bg-neutral-900/85 p-4 backdrop-blur max-md:left-2 max-md:right-2 max-md:top-14 max-md:z-20 max-md:w-auto max-md:max-h-[calc(100vh-4.5rem)]'}>
        <div className="flex items-center justify-between">
          <h1 className="text-base font-semibold">Mapas planos</h1>
          <div className="flex gap-3 text-xs">
            <Link href="/" className="text-cyan-300 underline">
              🏠 Dashboard
            </Link>
            <Link href="/globe" className="text-cyan-300 underline">
              🌍 Globo
            </Link>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs uppercase tracking-wide text-neutral-400">Mapa</label>
          <select className={input} value={viewId} onChange={(e) => setViewId(e.target.value)}>
            {VIEWS.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>

        {view.kind !== 'argentina' && (
          <div className="flex gap-2">
            <button className={tab(mode === 'stats')} onClick={() => setMode('stats')}>
              Estadística
            </button>
            <button className={tab(mode === 'paint')} onClick={() => setMode('paint')}>
              Mapa mudo
            </button>
          </div>
        )}

        {view.kind === 'argentina' && (
          <p className="text-xs text-neutral-400">
            Argentina funciona como mapa mudo: pintá provincias con el color elegido. Los datos por provincia
            todavía no están conectados.
          </p>
        )}
        {view.kind === 'argentina' && arg === 'error' && (
          <p className="text-xs text-red-400">
            No encuentro public/data/argentina.geojson. Corré: node scripts/make-argentina.mjs
          </p>
        )}

        {effMode === 'stats' && (
          <div className="space-y-2">
            <select className={input} value={optKey} onChange={(e) => setOptKey(e.target.value)}>
              {OPTIONS.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.name}
                </option>
              ))}
            </select>

            {load.status === 'loading' && <p className="text-xs text-cyan-300">Descargando datos…</p>}
            {load.status === 'error' && (
              <p className="text-xs text-red-400">
                {load.error}{' '}
                <button className="underline" onClick={() => setRetry((r) => r + 1)}>
                  Reintentar
                </button>
              </p>
            )}

            {ds && (
              <>
                <div>
                  <div className="h-3 w-full rounded" style={{ background: gradientCss('spectral', false) }} />
                  <div className="mt-1 flex justify-between text-xs text-neutral-300">
                    <span>{compact(range.min)}</span>
                    <span className="truncate px-1">{opt.unit}</span>
                    <span>{compact(range.max)}</span>
                  </div>
                </div>
                {years.length > 1 && (
                  <label className="flex items-center gap-2 text-xs text-neutral-300">
                    <span className="w-9 font-semibold">{year}</span>
                    <input
                      type="range"
                      className="flex-1"
                      min={years[0]}
                      max={years[years.length - 1]}
                      value={year || years[years.length - 1]}
                      onChange={(e) => setYear(Number(e.target.value))}
                    />
                  </label>
                )}
              </>
            )}
          </div>
        )}

        {effMode === 'paint' && (
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-neutral-400">Color para pintar</p>
            <div className="flex gap-2">
              {DRAW_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`h-6 w-6 rounded-full border-2 ${color === c ? 'border-cyan-400' : 'border-neutral-700'}`}
                  style={{ background: c }}
                  aria-label={c}
                />
              ))}
            </div>
            <p className="text-xs text-neutral-400">Click en una zona para pintarla; con el mismo color la despinta.</p>
            <label className="flex items-center gap-2 text-xs text-neutral-300">
              <input type="checkbox" checked={showNames} onChange={(e) => setShowNames(e.target.checked)} />
              Mostrar nombres al pasar el cursor
            </label>
            <button
              className={`${btn} hover:border-red-400`}
              onClick={() => setMarks((m) => ({ ...m, [viewId]: {} }))}
            >
              Borrar colores de este mapa
            </button>
          </div>
        )}

        <button className={`${btn} w-full`} onClick={exportSvg}>
          Guardar SVG
        </button>

        <p className="text-xs text-neutral-500">Rueda para zoom · arrastrá para mover · ⟲ vuelve a la vista inicial.</p>
      </aside>
    </main>
  )
}
