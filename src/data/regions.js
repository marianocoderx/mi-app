// Vistas del mapa plano. Los continentes usan proyección Mercator centrada en lng/lat.
export const VIEWS = [
  { id: 'world', name: 'Mundo', kind: 'world' },
  { id: 'america', name: 'América', kind: 'region', continents: ['North America', 'South America'], lng: -80, lat: 18, scale: 190 },
  { id: 'africa', name: 'África', kind: 'region', continents: ['Africa'], lng: 20, lat: 2, scale: 420 },
  { id: 'asia', name: 'Asia', kind: 'region', continents: ['Asia'], extra: ['RUS'], lng: 90, lat: 40, scale: 260 },
  { id: 'europe', name: 'Europa', kind: 'region', continents: ['Europe'], lng: 15, lat: 54, scale: 480 },
  { id: 'oceania', name: 'Oceanía', kind: 'region', continents: ['Oceania'], lng: 150, lat: -25, scale: 450 },
  { id: 'argentina', name: 'Argentina (provincias)', kind: 'argentina' },
]
