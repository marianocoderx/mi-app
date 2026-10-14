const ITEMS_KEY = 'ws-items-v1'
const NOTES_KEY = 'ws-notes-v1'

export const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`

function read(key) {
  try {
    const v = JSON.parse(localStorage.getItem(key) || '[]')
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

function write(key, list) {
  try {
    localStorage.setItem(key, JSON.stringify(list))
    return true
  } catch {
    return false
  }
}

export const loadItems = () => read(ITEMS_KEY)
export const saveItems = (list) => write(ITEMS_KEY, list)
export const loadNotes = () => read(NOTES_KEY)
export const saveNotes = (list) => write(NOTES_KEY, list)

export function addItem(item) {
  const list = loadItems()
  list.unshift(item)
  return saveItems(list)
}

export function defaultData(type) {
  switch (type) {
    case 'chart':
      return {
        source: 'manual',
        type: 'bars',
        unit: '',
        rows: [
          { label: 'A', value: '10' },
          { label: 'B', value: '25' },
          { label: 'C', value: '15' },
        ],
        wb: null,
      }
    case 'timeline':
      return {
        events: [{ id: newId(), year: 1900, title: 'Evento de ejemplo', desc: '', color: '#22d3ee' }],
        periods: [],
      }
    case 'mindmap':
      return {
        nodes: [{ id: newId(), x: 500, y: 300, text: 'Idea central', color: '#22d3ee', shape: 'pill' }],
        edges: [],
      }
    case 'diagram':
      return {
        nodes: [{ id: newId(), x: 500, y: 70, text: 'Inicio', color: '#22c55e', shape: 'oval' }],
        edges: [],
      }
    default:
      return {}
  }
}

const TITLES = {
  chart: 'Gráfico sin título',
  timeline: 'Línea de tiempo sin título',
  mindmap: 'Mapa mental sin título',
  diagram: 'Esquema sin título',
  map: 'Mapa',
}

export function makeItem(type) {
  const now = Date.now()
  return { id: newId(), type, title: TITLES[type] || 'Sin título', data: defaultData(type), createdAt: now, updatedAt: now }
}

export function makeNote(title) {
  const now = Date.now()
  const t = title || 'Nota sin título'
  return { id: newId(), title: t, body: `# ${t}\n\n`, createdAt: now, updatedAt: now }
}
