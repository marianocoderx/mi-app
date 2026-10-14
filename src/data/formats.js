export const FORMATS = [
  { id: 'map', icon: '🌍', name: 'Mapa mundi', desc: 'Pinta países según una estadística, con tiempo y períodos. Se arma en el globo.' },
  { id: 'chart', icon: '📊', name: 'Gráfico', desc: 'Barras, ranking, torta o evolución. Con datos propios o del Banco Mundial.' },
  { id: 'timeline', icon: '⏳', name: 'Línea de tiempo', desc: 'Eventos y períodos ordenados en el tiempo.' },
  { id: 'mindmap', icon: '🧠', name: 'Mapa mental', desc: 'Red de ideas: nodos conectados que podés arrastrar.' },
  { id: 'diagram', icon: '🔷', name: 'Esquema', desc: 'Diagrama o cuadro con formas y flechas.' },
]

export const FORMAT_BY_ID = Object.fromEntries(FORMATS.map((f) => [f.id, f]))
