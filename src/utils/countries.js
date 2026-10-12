// Helpers para trabajar con las propiedades de cada país del GeoJSON
export function getIso3(props) {
  if (props.ISO_A3 && props.ISO_A3 !== '-99') return props.ISO_A3
  return props.ADM0_A3
}

export function getName(props) {
  return props.ADMIN || props.NAME
}

// Lista ordenada y sin duplicados: [{ iso3, name }]
export function getCountryList(features) {
  const seen = new Set()
  const list = []
  features.forEach((f) => {
    const iso3 = getIso3(f.properties)
    if (!iso3 || iso3 === '-99' || seen.has(iso3)) return
    seen.add(iso3)
    list.push({ iso3, name: getName(f.properties) })
  })
  return list.sort((a, b) => a.name.localeCompare(b.name))
}
