import { fetchIndicator } from '@/utils/worldbank'
import { cacheGet, cacheSet } from '@/utils/cache'

const WEEK = 7 * 24 * 3600 * 1000

export const SOURCES = {
  worldbank: { name: 'Banco Mundial', license: 'CC BY 4.0', url: 'https://data.worldbank.org' },
  owid: { name: 'Our World in Data', license: 'CC BY (según cada gráfico)', url: 'https://ourworldindata.org' },
}

// Parte una línea CSV respetando comillas
function parseLine(line) {
  const out = []
  let cur = ''
  let q = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (q) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"'
        i++
      } else if (ch === '"') q = false
      else cur += ch
    } else if (ch === '"') q = true
    else if (ch === ',') {
      out.push(cur)
      cur = ''
    } else cur += ch
  }
  out.push(cur)
  return out
}

// Our World in Data: CSV con columnas Entity, Code, Year, <valor>.
// Si el gráfico tiene varias columnas de valor, se usa la primera.
async function fetchOwid(slug, validIso) {
  const url = `https://ourworldindata.org/grapher/${encodeURIComponent(slug)}.csv?csvType=full&useColumnShortNames=true`
  let res
  try {
    res = await fetch(url)
  } catch {
    throw new Error('No pude conectar con Our World in Data (¿bloqueo CORS o sin internet?)')
  }
  if (!res.ok) throw new Error(`Our World in Data respondió ${res.status}. Revisá el nombre del gráfico.`)
  const lines = (await res.text()).split(/\r?\n/)
  const series = {}
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i]) continue
    const p = parseLine(lines[i])
    const iso = p[1]
    const year = p[2]
    const v = Number(p[3])
    if (!iso || iso.startsWith('OWID') || !year || p[3] === '' || !Number.isFinite(v)) continue
    if (validIso && !validIso.has(iso)) continue
    ;(series[year] = series[year] || {})[iso] = v
  }
  if (!Object.keys(series).length) throw new Error('El gráfico no tiene datos por país')
  return series
}

// Punto de entrada: elige la fuente, usa la caché y devuelve { año: { ISO3: valor } }
export async function fetchDataset(d, validIso) {
  const src = d.src || 'worldbank'
  const key = `${src}:${d.wb}`
  const hit = await cacheGet(key, WEEK)
  if (hit) return hit
  const series = src === 'owid' ? await fetchOwid(d.wb, validIso) : await fetchIndicator(d.wb, validIso)
  await cacheSet(key, series)
  return series
}
