import fs from 'fs'

const URLS = [
  'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_1_states_provinces.geojson',
  'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson',
]

const r3 = (n) => Math.round(n * 1000) / 1000
const round = (c) => (typeof c[0] === 'number' ? [r3(c[0]), r3(c[1])] : c.map(round))

for (const url of URLS) {
  console.log('Descargando', url)
  let res
  try {
    res = await fetch(url)
  } catch (e) {
    console.log('  falló:', e.message)
    continue
  }
  if (!res.ok) {
    console.log('  respuesta', res.status)
    continue
  }
  const geo = await res.json()
  const feats = geo.features.filter((f) => (f.properties.adm0_a3 || f.properties.ADM0_A3) === 'ARG')
  if (!feats.length) {
    console.log('  este archivo no trae provincias de Argentina')
    continue
  }
  const out = {
    type: 'FeatureCollection',
    features: feats.map((f) => {
      const p = f.properties
      return {
        type: 'Feature',
        properties: { name: p.name_es || p.name || p.NAME, iso: p.iso_3166_2 || '' },
        geometry: { type: f.geometry.type, coordinates: round(f.geometry.coordinates) },
      }
    }),
  }
  fs.mkdirSync('public/data', { recursive: true })
  fs.writeFileSync('public/data/argentina.geojson', JSON.stringify(out))
  console.log('Listo:', feats.length, 'provincias ->', 'public/data/argentina.geojson')
  process.exit(0)
}
console.error('No pude obtener las provincias. Pegame los mensajes de arriba.')
process.exit(1)
