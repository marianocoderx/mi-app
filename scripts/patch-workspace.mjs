import fs from 'fs'

const file = 'src/app/workspace/page.js'
let s = fs.readFileSync(file, 'utf8')

if (s.includes("sp.get('item')")) {
  console.log('Ya estaba aplicado.')
  process.exit(0)
}

const from = `    setItems(list)
    setNotes(nl)
    setLoaded(true)`

if (s.split(from).length - 1 !== 1) {
  console.error('No encontré el bloque a reemplazar. No toqué nada.')
  process.exit(1)
}

const to = `    setItems(list)
    setNotes(nl)
    const sp = new URLSearchParams(window.location.search)
    const openItem = sp.get('item')
    const openNote = sp.get('note')
    if (openItem && list.some((x) => x.id === openItem)) {
      setTab('items')
      setSelItemId(openItem)
    }
    if (openNote && nl.some((x) => x.id === openNote)) {
      setTab('notes')
      setSelNoteId(openNote)
    }
    if (sp.get('tab') === 'graph') setTab('graph')
    if (sp.get('tab') === 'notes') setTab('notes')
    if (openItem || openNote || sp.get('tab')) window.history.replaceState(null, '', '/workspace')
    setLoaded(true)`

s = s.replace(from, () => to)
fs.writeFileSync(file, s)
console.log('Listo: workspace actualizado.')
