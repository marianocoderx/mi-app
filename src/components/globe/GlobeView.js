'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Globe from 'react-globe.gl'
import { getColor } from '@/utils/colors'
import { findValue } from '@/utils/parseDataset'
import { getIso3, getName } from '@/utils/countries'

const MUTE_COLOR = '#d1d5db'
const DIM_COLOR = '#3b4350' // países fuera de la región elegida
const HOVER_COLOR = '#22d3ee'
const SELECTED_SIDE = 'rgba(250,204,21,0.95)'

function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}

export default function GlobeView({
  globeRef,
  countries,
  dataset,
  values,
  kind,
  norm,
  catColors,
  settings,
  timeLabel,
  region,
  compareMode,
  selected,
  onCountryClick,
  mute,
  showNames,
  marks,
  pins,
  arrows,
  texts,
  pulses,
  draft,
  onMapClick,
  onItemClick,
}) {
  const [hover, setHover] = useState(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const initialized = useRef(false)
  const settingsRef = useRef(settings)
  settingsRef.current = settings

  const oceanTexture = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 2
    c.height = 2
    const ctx = c.getContext('2d')
    ctx.fillStyle = settings.ocean
    ctx.fillRect(0, 0, 2, 2)
    return c.toDataURL()
  }, [settings.ocean])

  const points = useMemo(
    () => [
      ...pins.map((p) => ({ ...p, kind: 'pin', radius: 0.45, alt: 0.03 })),
      ...arrows.map((a) => ({
        id: a.id,
        kind: 'arrow',
        lat: a.endLat,
        lng: a.endLng,
        color: a.color,
        radius: 0.7,
        alt: 0.02,
      })),
      ...pulses.map((p) => ({ ...p, kind: 'pulse', radius: 0.25, alt: 0.01 })),
      ...(draft
        ? [{ id: 'draft', kind: 'draft', lat: draft.lat, lng: draft.lng, color: '#ffffff', radius: 0.5, alt: 0.03 }]
        : []),
    ],
    [pins, arrows, pulses, draft]
  )

  const labels = useMemo(
    () => [
      ...texts.map((t) => ({ ...t, kind: 'text' })),
      ...pins.filter((p) => p.text).map((p) => ({ ...p, kind: 'pin' })),
    ],
    [texts, pins]
  )

  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight })
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const setup = () => {
    const g = globeRef.current
    if (!g || initialized.current) return
    initialized.current = true
    const controls = g.controls()
    controls.minDistance = 110
    controls.maxDistance = 500
    controls.autoRotate = settingsRef.current.autoRotate
    controls.autoRotateSpeed = 0.5
    g.pointOfView({ lat: -20, lng: -60, altitude: 2.2 }, 0)
  }

  useEffect(() => {
    if (!size.w) return
    const t = setTimeout(setup, 500)
    return () => clearTimeout(t)
  }, [size.w])

  useEffect(() => {
    const g = globeRef.current
    if (!g || !initialized.current) return
    const c = g.controls()
    c.autoRotate = settings.autoRotate
    c.autoRotateSpeed = 0.5
  }, [settings.autoRotate])

  const inRegion = (feat) => !region || feat.properties.CONTINENT === region
  const isSelected = (feat) => selected.includes(getIso3(feat.properties))
  const markOf = (feat) => marks[getIso3(feat.properties)]

  const colorFor = (feat) => {
    if (mute) return markOf(feat) || (inRegion(feat) ? MUTE_COLOR : DIM_COLOR)
    if (!inRegion(feat)) return DIM_COLOR
    const v = findValue(values, feat.properties)
    if (v === undefined) return settings.noData
    if (kind === 'category') return catColors[v] || settings.noData
    return getColor(norm(v), settings.palette, settings.reverse)
  }

  const labelFor = (feat) => {
    if (mute && !showNames) return ''
    const p = feat.properties
    const box = (inner) =>
      `<div style="background:rgba(0,0,0,.85);color:#fff;padding:6px 10px;border-radius:6px;font-size:13px">${inner}</div>`
    if (mute) return box(`<b>${getName(p)}</b>`)
    const v = findValue(values, p)
    let text
    if (v === undefined) text = 'Sin datos'
    else if (typeof v === 'number')
      text = `${v.toLocaleString('es-AR', { maximumFractionDigits: 2 })} ${dataset.unit || ''}`
    else text = String(v)
    const when = timeLabel ? `<br/><span style="opacity:.6;font-size:11px">${timeLabel}</span>` : ''
    const hint = compareMode
      ? '<br/><span style="opacity:.6;font-size:11px">Click para comparar</span>'
      : ''
    return box(`<b>${getName(p)}</b><br/>${text}${when}${hint}`)
  }

  if (!size.w) return null

  return (
    <Globe
      ref={globeRef}
      width={size.w}
      height={size.h}
      backgroundColor="#000000"
      globeImageUrl={oceanTexture}
      showAtmosphere={settings.atmosphere}
      atmosphereColor="#5b8bd6"
      atmosphereAltitude={0.15}
      rendererConfig={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
      onGlobeReady={setup}
      onGlobeClick={(coords) => {
        if (mute) onMapClick(coords, null)
      }}
      polygonsData={countries}
      polygonCapColor={(d) => (d === hover ? HOVER_COLOR : colorFor(d))}
      polygonSideColor={(d) => (isSelected(d) ? SELECTED_SIDE : 'rgba(0,0,0,0)')}
      polygonStrokeColor={() => settings.border}
      polygonAltitude={(d) =>
        isSelected(d)
          ? 0.05
          : d === hover
          ? 0.03
          : !inRegion(d)
          ? 0.002
          : mute && markOf(d)
          ? 0.012
          : 0.006
      }
      polygonLabel={labelFor}
      onPolygonHover={setHover}
      onPolygonClick={(d, _e, coords) => {
        if (compareMode && d) onCountryClick(d)
        else if (mute) onMapClick(coords, d)
      }}
      polygonsTransitionDuration={150}
      pointsData={points}
      pointLat={(d) => d.lat}
      pointLng={(d) => d.lng}
      pointColor={(d) => d.color}
      pointRadius={(d) => d.radius}
      pointAltitude={(d) => d.alt}
      onPointClick={(d) => onItemClick(d.kind, d.id)}
      arcsData={arrows}
      arcStartLat={(d) => d.startLat}
      arcStartLng={(d) => d.startLng}
      arcEndLat={(d) => d.endLat}
      arcEndLng={(d) => d.endLng}
      arcColor={(d) => d.color}
      arcStroke={0.5}
      arcAltitudeAutoScale={0.35}
      arcDashLength={0.5}
      arcDashGap={0.15}
      arcDashAnimateTime={2500}
      onArcClick={(d) => onItemClick('arrow', d.id)}
      labelsData={labels}
      labelLat={(d) => d.lat}
      labelLng={(d) => d.lng}
      labelText={(d) => d.text}
      labelSize={(d) => (d.kind === 'pin' ? 0.9 : 1.4)}
      labelColor={(d) => d.color}
      labelDotRadius={(d) => (d.kind === 'text' ? 0.4 : 0)}
      labelAltitude={0.04}
      labelResolution={2}
      onLabelClick={(d) => onItemClick(d.kind, d.id)}
      ringsData={pulses}
      ringLat={(d) => d.lat}
      ringLng={(d) => d.lng}
      ringColor={(d) => (t) => hexA(d.color, 1 - t)}
      ringMaxRadius={5}
      ringPropagationSpeed={2}
      ringRepeatPeriod={1400}
    />
  )
}
