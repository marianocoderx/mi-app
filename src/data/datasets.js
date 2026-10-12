import { CATALOG } from '@/data/catalog'

// Convierte un indicador del Banco Mundial en una estadística (todavía sin descargar)
export function catalogToDataset(c) {
  return {
    id: `wb-${c.code}`,
    kind: 'numeric',
    wb: c.code,
    name: c.name,
    unit: c.unit,
    scale: c.log ? 'log' : 'linear',
    series: null,
    pending: true,
  }
}

const fromCatalog = (code) => catalogToDataset(CATALOG.find((c) => c.code === code))

// Criterios por categorías: salen de las propiedades del mapa (Natural Earth)
const geo = (id, prop, name) => ({
  id: `geo-${id}`,
  kind: 'category',
  geoProp: prop,
  name,
  unit: '',
})

export const DEFAULT_DATASETS = [
  fromCatalog('SP.POP.TOTL'),
  fromCatalog('NY.GDP.PCAP.CD'),
  fromCatalog('SP.DYN.LE00.IN'),
  geo('continent', 'CONTINENT', 'Continente'),
  geo('subregion', 'SUBREGION', 'Subregión'),
  geo('income', 'INCOME_GRP', 'Nivel de ingreso'),
  geo('economy', 'ECONOMY', 'Clasificación económica'),
]

// Periodizaciones iniciales (editables)
export const DEFAULT_PERIODS = [
  { id: 'p-80', type: 'period', title: 'Años 80 (década perdida)', start: 1980, end: 1989, color: '#fb923c' },
  { id: 'p-gf', type: 'period', title: 'Guerra Fría', start: 1947, end: 1991, color: '#f87171' },
  { id: 'p-gl', type: 'period', title: 'Globalización', start: 1992, end: 2007, color: '#22d3ee' },
  { id: 'p-cr', type: 'period', title: 'Crisis y recuperación', start: 2008, end: 2019, color: '#facc15' },
  { id: 'p-pd', type: 'period', title: 'Pandemia y después', start: 2020, end: 2025, color: '#c084fc' },
]
