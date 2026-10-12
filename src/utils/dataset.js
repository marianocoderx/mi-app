import { CAT_COLORS } from '@/utils/colors'
import { getIso3 } from '@/utils/countries'

// Años disponibles de una estadística con serie temporal
export function getYears(d) {
  if (!d.series) return []
  return Object.keys(d.series)
    .map(Number)
    .sort((a, b) => a - b)
}

// Último año con buena cobertura (el último año suele venir casi vacío)
export function defaultYear(d) {
  const years = getYears(d)
  if (!years.length) return null
  const counts = years.map((y) => Object.keys(d.series[y]).length)
  const best = Math.max(...counts)
  for (let i = years.length - 1; i >= 0; i--) {
    if (counts[i] >= best * 0.6) return years[i]
  }
  return years[years.length - 1]
}

// Valores { ISO3: valor } para un año, o el promedio de un rango (período)
export function getValues(d, time, fill = true) {
  if (!d.series) return d.values || {}
  const years = getYears(d)
  if (!years.length) return {}

  if (time.mode === 'range') {
    const sum = {}
    const n = {}
    years.forEach((y) => {
      if (y < time.from || y > time.to) return
      const row = d.series[y]
      for (const iso in row) {
        sum[iso] = (sum[iso] || 0) + row[iso]
        n[iso] = (n[iso] || 0) + 1
      }
    })
    const out = {}
    for (const iso in sum) out[iso] = sum[iso] / n[iso]
    return out
  }

  const y = time.year ?? years[years.length - 1]
  const back = fill ? 5 : 0 // si falta el dato, usa el último de hasta 5 años antes
  const out = {}
  for (let k = 0; k <= back; k++) {
    const row = d.series[y - k]
    if (!row) continue
    for (const iso in row) if (!(iso in out)) out[iso] = row[iso]
  }
  return out
}

// Mínimo y máximo de TODA la serie (escala fija entre años)
export function getRange(d) {
  let min = Infinity
  let max = -Infinity
  const scan = (obj) => {
    for (const k in obj) {
      const v = obj[k]
      if (typeof v === 'number') {
        if (v < min) min = v
        if (v > max) max = v
      }
    }
  }
  if (d.series) Object.values(d.series).forEach(scan)
  else scan(d.values || {})
  return min === Infinity ? { min: 0, max: 0 } : { min, max }
}

export function getCategories(values) {
  const labels = [...new Set(Object.values(values).filter(Boolean))].sort((a, b) =>
    String(a).localeCompare(String(b))
  )
  const colors = {}
  labels.forEach((l, i) => (colors[l] = CAT_COLORS[i % CAT_COLORS.length]))
  return { labels, colors }
}

// Devuelve una función valor -> 0..1 según la escala elegida
export function makeNormalizer(scale, min, max, values) {
  if (scale === 'quantile') {
    const sorted = Object.values(values)
      .filter((v) => typeof v === 'number')
      .sort((a, b) => a - b)
    const n = sorted.length
    return (v) => {
      if (n < 2) return 0.5
      let lo = 0
      let hi = n - 1
      while (lo < hi) {
        const m = (lo + hi) >> 1
        if (sorted[m] < v) lo = m + 1
        else hi = m
      }
      return lo / (n - 1)
    }
  }
  if (scale === 'log' && min > 0 && max > min) {
    return (v) => (Math.log(v) - Math.log(min)) / (Math.log(max) - Math.log(min))
  }
  return (v) => (max === min ? 0.5 : (v - min) / (max - min))
}

// Estadísticas por categorías sacadas de las propiedades del mapa
export function buildGeoValues(countries, prop) {
  const out = {}
  countries.forEach((f) => {
    const iso = getIso3(f.properties)
    const raw = f.properties[prop]
    if (!iso || iso === '-99' || !raw || raw === '-99') return
    out[iso] = String(raw).replace(/^\d+\.\s*/, '')
  })
  return out
}
