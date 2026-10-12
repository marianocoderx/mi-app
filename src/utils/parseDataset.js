// Acepta filas "ISO3,valor" o "ISO3,año,valor" (serie temporal). Separadores: , ; tab
// Con { text: true } el valor se guarda como texto (categorías).
export function parseCSV(text, opts = {}) {
  const asText = !!opts.text
  const values = {}
  const series = {}
  let count = 0
  let seriesCount = 0
  text.split(/\r?\n/).forEach((line) => {
    const parts = line.split(/[,;\t]/).map((s) => s.trim().replace(/^"|"$/g, ''))
    if (parts.length < 2 || !parts[0]) return
    const key = parts[0].toUpperCase()
    if (
      !asText &&
      parts.length >= 3 &&
      /^-?\d{1,4}$/.test(parts[1]) &&
      parts[2] !== '' &&
      Number.isFinite(Number(parts[2]))
    ) {
      const y = parts[1]
      ;(series[y] = series[y] || {})[key] = Number(parts[2])
      seriesCount++
      return
    }
    if (parts[1] === '') return
    if (asText) {
      values[key] = parts[1]
      count++
      return
    }
    const num = Number(parts[1])
    if (!Number.isFinite(num)) return
    values[key] = num
    count++
  })
  return { values, series, count, seriesCount }
}

export function getStats(values) {
  const nums = Object.values(values).filter((v) => typeof v === 'number')
  if (nums.length === 0) return { min: 0, max: 0 }
  return { min: Math.min(...nums), max: Math.max(...nums) }
}

// Busca el valor de un país probando ISO3, ISO2 y nombre
export function findValue(values, props) {
  const keys = [props.ISO_A3, props.ADM0_A3, props.ISO_A2, props.ADMIN, props.NAME]
  for (const k of keys) {
    if (!k || k === '-99') continue
    const v = values[String(k).toUpperCase()]
    if (v !== undefined) return v
  }
  return undefined
}
