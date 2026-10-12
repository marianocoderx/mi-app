export const PALETTES = {
  spectral: { name: 'Azul → Rojo', colors: ['#2c7bb6', '#abd9e9', '#ffffbf', '#fdae61', '#d7191c'] },
  viridis: { name: 'Viridis', colors: ['#440154', '#3b528b', '#21918c', '#5ec962', '#fde725'] },
  plasma: { name: 'Plasma', colors: ['#0d0887', '#7e03a8', '#cc4778', '#f89540', '#f0f921'] },
  blues: { name: 'Azules', colors: ['#deebf7', '#9ecae1', '#4292c6', '#2171b5', '#08306b'] },
  reds: { name: 'Rojos', colors: ['#fee5d9', '#fcae91', '#fb6a4a', '#de2d26', '#a50f15'] },
  greens: { name: 'Verdes', colors: ['#edf8e9', '#bae4b3', '#74c476', '#31a354', '#006d2c'] },
  earth: { name: 'Tierra', colors: ['#f6e8c3', '#dfc27d', '#a6611a', '#80cdc1', '#018571'] },
}

// Colores para estadísticas por categorías
export const CAT_COLORS = [
  '#22d3ee', '#f472b6', '#facc15', '#a3e635', '#c084fc', '#fb923c',
  '#60a5fa', '#34d399', '#f87171', '#e879f9', '#fde68a', '#94a3b8',
]

function ordered(key, reverse) {
  const base = (PALETTES[key] || PALETTES.spectral).colors
  return reverse ? [...base].reverse() : base
}

export function gradientCss(key = 'spectral', reverse = false) {
  return `linear-gradient(to right, ${ordered(key, reverse).join(',')})`
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

// t entre 0 y 1 -> color interpolado
export function getColor(t, key = 'spectral', reverse = false) {
  const pal = ordered(key, reverse)
  const clamped = Number.isFinite(t) ? Math.min(1, Math.max(0, t)) : 0
  const pos = clamped * (pal.length - 1)
  const i = Math.min(Math.floor(pos), pal.length - 2)
  const f = pos - i
  const a = hexToRgb(pal[i])
  const b = hexToRgb(pal[i + 1])
  const rgb = a.map((v, k) => Math.round(v + (b[k] - v) * f))
  return `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`
}
