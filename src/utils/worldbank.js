const BASE = 'https://api.worldbank.org/v2'

// Descarga un indicador para todos los países y años.
// Devuelve { "2020": { ARG: 123, BRA: 456 }, ... }
export async function fetchIndicator(code, validIso) {
  const end = new Date().getFullYear()
  const series = {}
  let page = 1
  let pages = 1
  while (page <= pages) {
    const url = `${BASE}/country/all/indicator/${encodeURIComponent(
      code
    )}?format=json&per_page=20000&date=1960:${end}&page=${page}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Error ${res.status} al consultar el Banco Mundial`)
    const json = await res.json()
    if (!Array.isArray(json) || !json[1]) {
      const msg = json && json[0] && json[0].message && json[0].message[0]
      throw new Error(msg ? msg.value : 'Indicador no encontrado o sin datos')
    }
    pages = json[0].pages || 1
    for (const r of json[1]) {
      if (r.value === null || r.value === undefined) continue
      const iso = r.countryiso3code
      if (!iso || (validIso && !validIso.has(iso))) continue
      if (!series[r.date]) series[r.date] = {}
      series[r.date][iso] = r.value
    }
    page++
  }
  if (!Object.keys(series).length) throw new Error('El indicador no tiene datos por país')
  return series
}

// Nombre y unidad de un indicador a partir de su código
export async function fetchIndicatorInfo(code) {
  const res = await fetch(`${BASE}/indicator/${encodeURIComponent(code)}?format=json`)
  const json = await res.json()
  const row = Array.isArray(json) && json[1] && json[1][0]
  if (!row) throw new Error('No encontré ese código de indicador')
  return { code: row.id, name: row.name, unit: row.unit || '' }
}
