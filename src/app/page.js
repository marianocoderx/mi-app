'use client'

import dynamic from 'next/dynamic'
import { useEffect, useMemo, useRef, useState } from 'react'
import Sidebar from '@/components/ui/Sidebar'
import NewDatasetModal from '@/components/ui/NewDatasetModal'
import CatalogModal from '@/components/ui/CatalogModal'
import SettingsModal, { DEFAULT_SETTINGS } from '@/components/ui/SettingsModal'
import ComparePanel from '@/components/ui/ComparePanel'
import DrawToolbar, { DRAW_COLORS } from '@/components/ui/DrawToolbar'
import TimeBar from '@/components/ui/TimeBar'
import { DEFAULT_DATASETS, DEFAULT_PERIODS } from '@/data/datasets'
import { CONTINENTS, WORLD_VIEW } from '@/data/continents'
import { getCountryList, getIso3 } from '@/utils/countries'
import {
  getYears,
  getValues,
  getRange,
  getCategories,
  defaultYear,
  makeNormalizer,
  buildGeoValues,
} from '@/utils/dataset'
import { fetchIndicator } from '@/utils/worldbank'

// three.js necesita window, por eso se carga sin SSR
const GlobeView = dynamic(() => import('@/components/globe/GlobeView'), { ssr: false })

const MAX_COMPARE = 5
const DS_KEY = 'datasets-v2'
const SET_KEY = 'settings-v1'
const TL_KEY = 'timeline-items'
const ANN_KEY = 'map-annotations'
const EMPTY = { marks: {}, pins: [], arrows: [], texts: [], pulses: [] }
const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

// Guarda solo la referencia de lo que viene de internet, no los datos
const toSaved = (d) =>
  d.custom
    ? d
    : d.wb
    ? { id: d.id, kind: 'numeric', wb: d.wb, name: d.name, unit: d.unit, scale: d.scale }
    : { id: d.id, builtin: true }

export default function Home() {
  const globeRef = useRef(null)
  const inflight = useRef(new Set())

  const [countries, setCountries] = useState([])
  const [datasets, setDatasets] = useState(DEFAULT_DATASETS)
  const [loaded, setLoaded] = useState(false)
  const [activeId, setActiveId] = useState(DEFAULT_DATASETS[0].id)
  const [time, setTime] = useState({ mode: 'year', year: null, from: 1990, to: 2010 })
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [timeline, setTimeline] = useState(DEFAULT_PERIODS)
  const [region, setRegion] = useState('')

  const [showNew, setShowNew] = useState(false)
  const [showCatalog, setShowCatalog] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [compareMode, setCompareMode] = useState(false)
  const [selected, setSelected] = useState([])

  // Mapa mudo
  const [mute, setMute] = useState(false)
  const [showNames, setShowNames] = useState(false)
  const [tool, setTool] = useState('paint')
  const [color, setColor] = useState(DRAW_COLORS[0])
  const [noteText, setNoteText] = useState('')
  const [ann, setAnn] = useState(EMPTY)
  const [draft, setDraft] = useState(null)

  // ---------- carga y guardado ----------
  useEffect(() => {
    fetch('/data/countries.geojson')
      .then((r) => r.json())
      .then((geo) => setCountries(geo.features))
  }, [])

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(DS_KEY) || 'null')
      if (Array.isArray(saved) && saved.length) {
        const list = saved
          .map((s) =>
            s.builtin
              ? DEFAULT_DATASETS.find((d) => d.id === s.id)
              : s.wb
              ? { ...s, series: null, pending: true }
              : s
          )
          .filter(Boolean)
        if (list.length) {
          setDatasets(list)
          setActiveId(list[0].id)
        }
      }
      const st = JSON.parse(localStorage.getItem(SET_KEY) || 'null')
      if (st) setSettings({ ...DEFAULT_SETTINGS, ...st })
      const tl = JSON.parse(localStorage.getItem(TL_KEY) || 'null')
      if (Array.isArray(tl)) setTimeline(tl)
      const a = JSON.parse(localStorage.getItem(ANN_KEY) || 'null')
      if (a) setAnn({ ...EMPTY, ...a })
    } catch {}
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!loaded) return
    try {
      localStorage.setItem(DS_KEY, JSON.stringify(datasets.map(toSaved)))
    } catch {}
  }, [datasets, loaded])

  useEffect(() => {
    if (!loaded) return
    try {
      localStorage.setItem(SET_KEY, JSON.stringify(settings))
      localStorage.setItem(TL_KEY, JSON.stringify(timeline))
      localStorage.setItem(ANN_KEY, JSON.stringify(ann))
    } catch {}
  }, [settings, timeline, ann, loaded])

  // ---------- datos derivados ----------
  const countryList = useMemo(() => getCountryList(countries), [countries])
  const validIso = useMemo(() => new Set(countryList.map((c) => c.iso3)), [countryList])
  const nameOf = useMemo(() => {
    const m = {}
    countryList.forEach((c) => (m[c.iso3] = c.name))
    return m
  }, [countryList])

  const resolved = useMemo(
    () => datasets.map((d) => (d.geoProp ? { ...d, values: buildGeoValues(countries, d.geoProp) } : d)),
    [datasets, countries]
  )
  const active = resolved.find((d) => d.id === activeId) || resolved[0]

  const years = useMemo(() => getYears(active), [active])
  const range = useMemo(() => getRange(active), [active])
  const values = useMemo(
    () => getValues(active, time, settings.fillGaps),
    [active, time, settings.fillGaps]
  )
  const categories = useMemo(
    () => (active.kind === 'category' ? getCategories(values) : { labels: [], colors: {} }),
    [active, values]
  )
  const scale = active.scale || 'linear'
  const effScale = scale === 'log' && range.min <= 0 ? 'linear' : scale
  const norm = useMemo(
    () => makeNormalizer(effScale, range.min, range.max, values),
    [effScale, range, values]
  )

  const timeLabel = !active.series
    ? ''
    : time.mode === 'range'
    ? `${time.from}–${time.to} (promedio)`
    : String(time.year ?? '')

  const periods = useMemo(() => timeline.filter((i) => i.type === 'period'), [timeline])

  // Ajustar el año al rango de la estadística activa
  useEffect(() => {
    if (!years.length) return
    setTime((t) =>
      t.year === null || t.year < years[0] || t.year > years[years.length - 1]
        ? { ...t, year: defaultYear(active) }
        : t
    )
  }, [years])

  // Descargar del Banco Mundial cuando se elige una estadística pendiente
  useEffect(() => {
    const d = datasets.find((x) => x.id === activeId)
    if (!d || !d.pending || d.error || !validIso.size || inflight.current.has(d.id)) return
    inflight.current.add(d.id)
    fetchIndicator(d.wb, validIso)
      .then((series) =>
        setDatasets((prev) =>
          prev.map((x) => (x.id === d.id ? { ...x, series, pending: false, error: '' } : x))
        )
      )
      .catch((e) =>
        setDatasets((prev) =>
          prev.map((x) => (x.id === d.id ? { ...x, error: e.message || 'Error de red' } : x))
        )
      )
      .finally(() => inflight.current.delete(d.id))
  }, [activeId, datasets, validIso])

  // ---------- acciones ----------
  const handleAddDataset = (ds) => {
    setDatasets((prev) => (prev.some((d) => d.id === ds.id) ? prev : [...prev, ds]))
    setActiveId(ds.id)
    setShowNew(false)
    setShowCatalog(false)
  }

  const handleRemove = (id) => {
    if (datasets.length <= 1) return
    const rest = datasets.filter((d) => d.id !== id)
    setDatasets(rest)
    if (activeId === id) setActiveId(rest[0].id)
  }

  const handleScale = (s) =>
    setDatasets((prev) => prev.map((d) => (d.id === activeId ? { ...d, scale: s } : d)))

  const handleRetry = () =>
    setDatasets((prev) => prev.map((d) => (d.id === activeId ? { ...d, error: '' } : d)))

  const handleRegion = (name) => {
    setRegion(name)
    const g = globeRef.current
    if (!g) return
    const c = CONTINENTS.find((x) => x[0] === name)
    g.pointOfView(c ? c[2] : WORLD_VIEW, 1000)
  }

  const handleZoom = (factor) => {
    const g = globeRef.current
    if (!g) return
    const { altitude } = g.pointOfView()
    g.pointOfView({ altitude: Math.min(4, Math.max(0.15, altitude * factor)) }, 400)
  }

  const toggleCompare = () => {
    setCompareMode((on) => !on)
    setSelected([])
    setMute(false)
    setDraft(null)
  }

  const toggleMute = () => {
    setMute((on) => !on)
    setCompareMode(false)
    setSelected([])
    setDraft(null)
  }

  const handleCountryClick = (feat) => {
    const iso = getIso3(feat.properties)
    if (!iso || iso === '-99') return
    setSelected((prev) => {
      if (prev.includes(iso)) return prev.filter((x) => x !== iso)
      if (prev.length >= MAX_COMPARE) return prev
      return [...prev, iso]
    })
  }

  const handleTool = (t) => {
    setTool(t)
    setDraft(null)
  }

  const handleMapClick = (coords, feat) => {
    const iso = feat ? getIso3(feat.properties) : null

    if (tool === 'erase') {
      if (iso) {
        setAnn((a) => {
          const marks = { ...a.marks }
          delete marks[iso]
          return { ...a, marks }
        })
      }
      return
    }

    if (tool === 'paint') {
      if (!iso || iso === '-99') return
      setAnn((a) => {
        const marks = { ...a.marks }
        if (marks[iso] === color) delete marks[iso]
        else marks[iso] = color
        return { ...a, marks }
      })
      return
    }

    if (!coords || typeof coords.lat !== 'number') return
    const { lat, lng } = coords

    if (tool === 'pin') {
      setAnn((a) => ({ ...a, pins: [...a.pins, { id: newId(), lat, lng, color, text: noteText.trim() }] }))
    } else if (tool === 'text') {
      setAnn((a) => ({
        ...a,
        texts: [...a.texts, { id: newId(), lat, lng, color, text: noteText.trim() || 'Nota' }],
      }))
    } else if (tool === 'pulse') {
      setAnn((a) => ({ ...a, pulses: [...a.pulses, { id: newId(), lat, lng, color }] }))
    } else if (tool === 'arrow') {
      if (!draft) {
        setDraft({ lat, lng })
      } else {
        setAnn((a) => ({
          ...a,
          arrows: [
            ...a.arrows,
            { id: newId(), startLat: draft.lat, startLng: draft.lng, endLat: lat, endLng: lng, color },
          ],
        }))
        setDraft(null)
      }
    }
  }

  const handleItemClick = (kind, id) => {
    if (!mute || tool !== 'erase') return
    const field = { pin: 'pins', text: 'texts', arrow: 'arrows', pulse: 'pulses' }[kind]
    if (!field) return
    setAnn((a) => ({ ...a, [field]: a[field].filter((x) => x.id !== id) }))
  }

  const handleExport = () => {
    const g = globeRef.current
    if (!g) return
    const link = document.createElement('a')
    link.href = g.renderer().domElement.toDataURL('image/png')
    link.download = 'mapa.png'
    link.click()
  }

  return (
    <main className="fixed inset-0 z-50 bg-black">
      <GlobeView
        globeRef={globeRef}
        countries={countries}
        dataset={active}
        values={values}
        kind={active.kind}
        norm={norm}
        catColors={categories.colors}
        settings={settings}
        timeLabel={timeLabel}
        region={region}
        compareMode={compareMode}
        selected={selected}
        onCountryClick={handleCountryClick}
        mute={mute}
        showNames={showNames}
        marks={ann.marks}
        pins={ann.pins}
        arrows={ann.arrows}
        texts={ann.texts}
        pulses={ann.pulses}
        draft={draft}
        onMapClick={handleMapClick}
        onItemClick={handleItemClick}
      />

      <Sidebar
        datasets={resolved}
        active={active}
        onSelect={setActiveId}
        onRemove={handleRemove}
        min={range.min}
        max={range.max}
        scale={scale}
        onScale={handleScale}
        categories={categories}
        settings={settings}
        region={region}
        onRegion={handleRegion}
        onZoom={handleZoom}
        onNew={() => setShowNew(true)}
        onCatalog={() => setShowCatalog(true)}
        onSettings={() => setShowSettings(true)}
        compareMode={compareMode}
        onToggleCompare={toggleCompare}
        mute={mute}
        onToggleMute={toggleMute}
        onRetry={handleRetry}
        timeLabel={timeLabel}
      />

      {compareMode && (
        <ComparePanel
          selected={selected}
          nameOf={nameOf}
          datasets={resolved}
          active={active}
          activeVals={values}
          getVals={(d) => getValues(d, time, settings.fillGaps)}
          time={time}
          timeLabel={timeLabel}
          onRemove={(iso) => setSelected((prev) => prev.filter((x) => x !== iso))}
          onClear={() => setSelected([])}
        />
      )}

      {mute && (
        <DrawToolbar
          tool={tool}
          onTool={handleTool}
          color={color}
          onColor={setColor}
          text={noteText}
          onText={setNoteText}
          showNames={showNames}
          onToggleNames={() => setShowNames((v) => !v)}
          draft={draft}
          onClear={() => {
            setAnn(EMPTY)
            setDraft(null)
          }}
          onExport={handleExport}
        />
      )}

      {!mute && years.length > 1 && (
        <TimeBar
          years={years}
          time={time}
          setTime={setTime}
          periods={periods}
          onAddPeriod={(p) => setTimeline((t) => [...t, p])}
          onRemovePeriod={(id) => setTimeline((t) => t.filter((i) => i.id !== id))}
        />
      )}

      {showNew && (
        <NewDatasetModal countryList={countryList} onCreate={handleAddDataset} onClose={() => setShowNew(false)} />
      )}

      {showCatalog && (
        <CatalogModal
          have={datasets.map((d) => d.id)}
          onAdd={handleAddDataset}
          onClose={() => setShowCatalog(false)}
        />
      )}

      {showSettings && (
        <SettingsModal
          settings={settings}
          onChange={(patch) => setSettings((s) => ({ ...s, ...patch }))}
          onReset={() => setSettings(DEFAULT_SETTINGS)}
          onClose={() => setShowSettings(false)}
        />
      )}
    </main>
  )
}
