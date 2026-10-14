'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import FormatPicker from '@/components/ui/FormatPicker'
import ItemEditor from '@/components/workspace/ItemEditor'
import NoteEditor from '@/components/workspace/NoteEditor'
import { GraphView } from '@/components/workspace/GraphView'
import { FORMAT_BY_ID } from '@/data/formats'
import useCountries from '@/utils/useCountries'
import { loadItems, saveItems, loadNotes, saveNotes, makeItem, makeNote } from '@/utils/store'

const same = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase()
const fmtDate = (t) => new Date(t).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })

// Grafo estilo Obsidian: notas, items incrustados y los enlaces entre ellos
function buildGraph(notes, items) {
  const nodes = []
  const edges = []
  const seen = new Set()
  const usedItems = new Set()

  notes.forEach((n) => {
    for (const m of n.body.matchAll(/(!?)\[\[([^\]]+)\]\]/g)) {
      if (m[1]) {
        const it = items.find((x) => same(x.title, m[2]))
        if (it) {
          usedItems.add(it.id)
          const id = 'n:' + n.id + '>i:' + it.id
          if (!seen.has(id)) {
            seen.add(id)
            edges.push({ id, from: 'n:' + n.id, to: 'i:' + it.id })
          }
        }
      } else {
        const t = notes.find((x) => same(x.title, m[2]))
        if (t && t.id !== n.id) {
          const id = 'n:' + n.id + '>n:' + t.id
          if (!seen.has(id)) {
            seen.add(id)
            edges.push({ id, from: 'n:' + n.id, to: 'n:' + t.id })
          }
        }
      }
    }
  })

  const list = [
    ...notes.map((n) => ({ id: 'n:' + n.id, text: n.title || 'Sin título', color: '#22d3ee', shape: 'pill', ref: { kind: 'note', id: n.id } })),
    ...items
      .filter((i) => usedItems.has(i.id))
      .map((i) => ({ id: 'i:' + i.id, text: i.title, color: '#facc15', shape: 'rect', ref: { kind: 'item', id: i.id } })),
  ]
  const N = list.length
  list.forEach((n, k) => {
    if (N === 1) {
      n.x = 500
      n.y = 300
    } else {
      const a = (2 * Math.PI * k) / N - Math.PI / 2
      n.x = 500 + 400 * Math.cos(a)
      n.y = 300 + 230 * Math.sin(a)
    }
    nodes.push(n)
  })
  return { nodes, edges }
}

export default function Workspace() {
  const [items, setItems] = useState([])
  const [notes, setNotes] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [tab, setTab] = useState('items')
  const [selItemId, setSelItemId] = useState(null)
  const [selNoteId, setSelNoteId] = useState(null)
  const [q, setQ] = useState('')
  const [pick, setPick] = useState(false)
  const [warn, setWarn] = useState('')
  const [navOpen, setNavOpen] = useState(true)
  useEffect(() => {
    if (selItemId || selNoteId) setNavOpen(false)
  }, [selItemId, selNoteId])
  const countryList = useCountries()
  const handled = useRef(false)
  const created = useRef(null)

  useEffect(() => {
    let list = loadItems()
    const nl = loadNotes()
    if (!handled.current) {
      handled.current = true
      const want = new URLSearchParams(window.location.search).get('new')
      if (want && FORMAT_BY_ID[want] && want !== 'map') {
        created.current = makeItem(want)
        window.history.replaceState(null, '', '/workspace')
      }
    }
    if (created.current) {
      list = [created.current, ...list]
      setSelItemId(created.current.id)
    }
    setItems(list)
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
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!loaded) return
    const t = setTimeout(() => {
      setWarn(saveItems(items) ? '' : 'No se pudo guardar: el almacenamiento del navegador está lleno.')
    }, 400)
    return () => clearTimeout(t)
  }, [items, loaded])

  useEffect(() => {
    if (!loaded) return
    const t = setTimeout(() => {
      setWarn(saveNotes(notes) ? '' : 'No se pudo guardar: el almacenamiento del navegador está lleno.')
    }, 400)
    return () => clearTimeout(t)
  }, [notes, loaded])

  const ql = q.trim().toLowerCase()
  const shownItems = items.filter(
    (i) => !ql || i.title.toLowerCase().includes(ql) || (FORMAT_BY_ID[i.type] || {}).name?.toLowerCase().includes(ql)
  )
  const shownNotes = notes.filter((n) => !ql || n.title.toLowerCase().includes(ql) || n.body.toLowerCase().includes(ql))

  const selItem = items.find((i) => i.id === selItemId)
  const selNote = notes.find((n) => n.id === selNoteId)
  const graph = useMemo(() => buildGraph(notes, items), [notes, items])

  const createItem = (type) => {
    setPick(false)
    if (type === 'map') {
      window.location.href = '/globe'
      return
    }
    const it = makeItem(type)
    setItems((prev) => [it, ...prev])
    setTab('items')
    setSelItemId(it.id)
  }

  const createNote = () => {
    const n = makeNote()
    setNotes((prev) => [n, ...prev])
    setTab('notes')
    setSelNoteId(n.id)
  }

  const openLink = (title) => {
    let n = notes.find((x) => same(x.title, title))
    if (!n) {
      n = makeNote(title.trim())
      setNotes((prev) => [n, ...prev])
    }
    setTab('notes')
    setSelNoteId(n.id)
  }

  const updateItem = (it) =>
    setItems((prev) => prev.map((x) => (x.id === it.id ? { ...it, updatedAt: Date.now() } : x)))
  const updateNote = (n) =>
    setNotes((prev) => prev.map((x) => (x.id === n.id ? { ...n, updatedAt: Date.now() } : x)))

  const deleteItem = (id) => {
    if (!window.confirm('¿Eliminar este item del portafolio?')) return
    setItems((prev) => prev.filter((x) => x.id !== id))
    setSelItemId(null)
  }
  const deleteNote = (id) => {
    if (!window.confirm('¿Eliminar esta nota?')) return
    setNotes((prev) => prev.filter((x) => x.id !== id))
    setSelNoteId(null)
  }

  const onGraphClick = (node) => {
    if (!node.ref) return
    if (node.ref.kind === 'note') {
      setTab('notes')
      setSelNoteId(node.ref.id)
    } else {
      setTab('items')
      setSelItemId(node.ref.id)
    }
  }

  const tabBtn = (id, label) => (
    <button
      onClick={() => setTab(id)}
      className={`flex-1 rounded-md border px-2 py-1 text-xs ${
        tab === id ? 'border-cyan-400 bg-cyan-900/40 text-cyan-200' : 'border-neutral-700 bg-neutral-800 hover:bg-neutral-700'
      }`}
    >
      {label}
    </button>
  )

  const rowCls = (on) =>
    `w-full rounded-md px-2 py-1.5 text-left hover:bg-neutral-800 ${on ? 'bg-neutral-800 text-cyan-200' : ''}`

  return (
    <div className="fixed inset-0 flex bg-neutral-950 text-sm text-neutral-100">
      <button
        className="absolute left-2 top-2 z-40 rounded-md border border-neutral-700 bg-neutral-900/90 px-3 py-2 text-xs text-neutral-100 md:hidden"
        onClick={() => setNavOpen((o) => !o)}
      >
        {navOpen ? '✕ Cerrar' : '☰ Mi espacio'}
      </button>
      <aside className={(navOpen ? '' : 'max-md:hidden ') + 'flex w-72 shrink-0 flex-col gap-3 border-r border-neutral-800 p-3 max-md:absolute max-md:inset-y-0 max-md:left-0 max-md:z-30 max-md:w-[85vw] max-md:max-w-xs max-md:bg-neutral-950 max-md:pt-14 max-md:shadow-2xl'}>
        <div className="flex items-center justify-between">
          <h1 className="text-base font-semibold">Mi espacio</h1>
          <a href="/" className="text-xs text-cyan-300 underline">
            ← Dashboard
          </a>
        </div>

        <div className="flex gap-1">
          {tabBtn('items', 'Portafolio')}
          {tabBtn('notes', 'Notas')}
          {tabBtn('graph', 'Grafo')}
        </div>

        <input
          className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm outline-none focus:border-cyan-400"
          placeholder="Buscar…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        {tab === 'items' && (
          <button
            className="rounded-md border border-neutral-700 bg-cyan-700 px-3 py-1.5 text-xs hover:bg-cyan-600"
            onClick={() => setPick(true)}
          >
            + Nuevo
          </button>
        )}
        {tab === 'notes' && (
          <button
            className="rounded-md border border-neutral-700 bg-cyan-700 px-3 py-1.5 text-xs hover:bg-cyan-600"
            onClick={createNote}
          >
            + Nueva nota
          </button>
        )}

        <div className="flex-1 space-y-0.5 overflow-y-auto">
          {tab === 'items' &&
            shownItems.map((it) => (
              <button key={it.id} className={rowCls(it.id === selItemId)} onClick={() => setSelItemId(it.id)}>
                <div className="truncate">
                  {(FORMAT_BY_ID[it.type] || {}).icon} {it.title}
                </div>
                <div className="text-xs text-neutral-500">
                  {(FORMAT_BY_ID[it.type] || {}).name} · {fmtDate(it.updatedAt)}
                </div>
              </button>
            ))}
          {tab === 'items' && shownItems.length === 0 && (
            <p className="p-2 text-xs text-neutral-500">
              Tu portafolio está vacío. Creá algo con “+ Nuevo” o guardá una vista desde el globo.
            </p>
          )}

          {tab === 'notes' &&
            shownNotes.map((n) => (
              <button key={n.id} className={rowCls(n.id === selNoteId)} onClick={() => setSelNoteId(n.id)}>
                <div className="truncate">📝 {n.title || 'Sin título'}</div>
                <div className="text-xs text-neutral-500">{fmtDate(n.updatedAt)}</div>
              </button>
            ))}
          {tab === 'notes' && shownNotes.length === 0 && (
            <p className="p-2 text-xs text-neutral-500">Todavía no hay notas.</p>
          )}

          {tab === 'graph' && (
            <p className="p-2 text-xs text-neutral-500">
              Celeste: notas. Amarillo: items del portafolio incrustados con ![[…]]. Las líneas son enlaces
              [[…]] entre notas. Hacé click en un nodo para abrirlo.
            </p>
          )}
        </div>

        {warn && <p className="text-xs text-red-400">{warn}</p>}
      </aside>

      <main className="flex-1 overflow-y-auto p-6 max-md:p-3 max-md:pt-14">
        {tab === 'items' &&
          (selItem ? (
            <ItemEditor
              key={selItem.id}
              item={selItem}
              onChange={updateItem}
              onDelete={() => deleteItem(selItem.id)}
              countryList={countryList}
            />
          ) : (
            <p className="text-neutral-500">Elegí un item de la lista o creá uno nuevo.</p>
          ))}

        {tab === 'notes' &&
          (selNote ? (
            <NoteEditor
              key={selNote.id}
              note={selNote}
              notes={notes}
              items={items}
              onChange={updateNote}
              onDelete={() => deleteNote(selNote.id)}
              onLink={openLink}
            />
          ) : (
            <p className="text-neutral-500">Elegí una nota de la lista o creá una nueva.</p>
          ))}

        {tab === 'graph' && (
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-3 text-lg font-semibold">Grafo de notas</h2>
            {graph.nodes.length ? (
              <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-3">
                <GraphView graph={graph} onNodeClick={onGraphClick} maxHeight={640} />
              </div>
            ) : (
              <p className="text-neutral-500">Creá notas y enlazalas con [[Nombre]] para verlas acá.</p>
            )}
          </div>
        )}
      </main>

      {pick && <FormatPicker onPick={createItem} onClose={() => setPick(false)} />}
    </div>
  )
}
