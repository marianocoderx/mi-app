'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { FORMATS, FORMAT_BY_ID } from '@/data/formats'
import ItemView from '@/components/workspace/ItemView'
import { loadItems, saveItems, loadNotes, saveNotes, makeNote } from '@/utils/store'

const PROFILE_KEY = 'profile-v1'
const AVATAR_COLORS = ['#22d3ee', '#f472b6', '#facc15', '#a3e635', '#c084fc', '#fb923c']
const fmtDate = (t) => new Date(t).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })

export default function Dashboard() {
  const [profile, setProfile] = useState({ name: '', color: AVATAR_COLORS[0] })
  const [items, setItems] = useState([])
  const [notes, setNotes] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [filter, setFilter] = useState('all')
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null')
      if (p) setProfile((prev) => ({ ...prev, ...p }))
    } catch {}
    setItems(loadItems())
    setNotes(loadNotes())
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!loaded) return
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
    } catch {}
  }, [profile, loaded])

  const counts = useMemo(() => {
    const c = {}
    items.forEach((i) => (c[i.type] = (c[i.type] || 0) + 1))
    return c
  }, [items])

  const ql = q.trim().toLowerCase()
  const shown = items.filter(
    (i) => (filter === 'all' || i.type === filter) && (!ql || i.title.toLowerCase().includes(ql))
  )
  const recentNotes = [...notes].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 6)

  const create = (id) => {
    if (id === 'map') window.location.href = '/globe'
    else window.location.href = '/workspace?new=' + id
  }

  const createNote = () => {
    const n = makeNote()
    const list = loadNotes()
    list.unshift(n)
    saveNotes(list)
    window.location.href = '/workspace?note=' + n.id
  }

  const deleteItem = (e, id) => {
    e.stopPropagation()
    if (!window.confirm('¿Eliminar este item del portafolio?')) return
    const next = items.filter((x) => x.id !== id)
    setItems(next)
    saveItems(next)
  }

  const initial = (profile.name.trim()[0] || '?').toUpperCase()
  const chip = (on) =>
    `rounded-full border px-3 py-1 text-xs ${
      on ? 'border-cyan-400 bg-cyan-900/40 text-cyan-200' : 'border-neutral-700 bg-neutral-800 hover:bg-neutral-700'
    }`

  return (
    <div className="min-h-screen bg-neutral-950 text-sm text-neutral-100">
      <div className="mx-auto max-w-6xl space-y-8 p-6">
        {/* Perfil */}
        <header className="flex flex-wrap items-center gap-4">
          <button
            className="flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold text-black"
            style={{ background: profile.color }}
            onClick={() => setEditing((e) => !e)}
            title="Editar perfil"
          >
            {initial}
          </button>
          <div className="min-w-0 flex-1">
            {editing ? (
              <div className="space-y-2">
                <input
                  autoFocus
                  className="w-full max-w-xs rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-lg outline-none focus:border-cyan-400"
                  placeholder="Tu nombre"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && setEditing(false)}
                />
                <div className="flex items-center gap-2">
                  {AVATAR_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setProfile({ ...profile, color: c })}
                      className={`h-6 w-6 rounded-full border-2 ${profile.color === c ? 'border-white' : 'border-neutral-700'}`}
                      style={{ background: c }}
                      aria-label={c}
                    />
                  ))}
                  <button className="ml-2 text-xs text-cyan-300 underline" onClick={() => setEditing(false)}>
                    Listo
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h1 className="truncate text-2xl font-semibold">
                  {profile.name.trim() ? `Hola, ${profile.name.trim()}` : 'Mi dashboard'}
                </h1>
                <p className="text-xs text-neutral-400">
                  {items.length} items en el portafolio · {notes.length} notas
                  {!profile.name.trim() && ' · tocá el círculo para poner tu nombre'}
                </p>
              </>
            )}
          </div>
          <div className="flex flex-wrap gap-2 max-sm:w-full">
            <Link
              href="/globe"
              className="rounded-md border border-neutral-700 bg-cyan-700 px-3 py-2 text-xs hover:bg-cyan-600"
            >
              🌍 Abrir el globo
            </Link>
            <Link
              href="/maps"
              className="rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-xs hover:bg-neutral-700"
            >
              🗺️ Mapas planos
            </Link>
            <Link
              href="/workspace?tab=graph"
              className="rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-xs hover:bg-neutral-700"
            >
              Grafo de notas
            </Link>
          </div>
        </header>

        {/* Contadores */}
        <section className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {FORMATS.map((f) => (
            <div key={f.id} className="rounded-lg border border-neutral-800 bg-neutral-900 p-3">
              <div className="text-xl font-semibold">{counts[f.id] || 0}</div>
              <div className="text-xs text-neutral-400">
                {f.icon} {f.name}
              </div>
            </div>
          ))}
          <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-3">
            <div className="text-xl font-semibold">{notes.length}</div>
            <div className="text-xs text-neutral-400">📝 Notas</div>
          </div>
        </section>

        {/* Crear */}
        <section>
          <h2 className="mb-2 text-xs uppercase tracking-wide text-neutral-400">Crear</h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {FORMATS.map((f) => (
              <button
                key={f.id}
                onClick={() => create(f.id)}
                className="rounded-lg border border-neutral-700 bg-neutral-900 p-3 text-left hover:border-cyan-400 hover:bg-neutral-800"
              >
                <div className="text-base">
                  {f.icon} {f.name}
                </div>
                <div className="mt-1 text-xs text-neutral-400">{f.desc}</div>
              </button>
            ))}
            <button
              onClick={createNote}
              className="rounded-lg border border-neutral-700 bg-neutral-900 p-3 text-left hover:border-cyan-400 hover:bg-neutral-800"
            >
              <div className="text-base">📝 Nota / informe</div>
              <div className="mt-1 text-xs text-neutral-400">
                Escribí en Markdown e incrustá items del portafolio con ![[Título]].
              </div>
            </button>
          </div>
        </section>

        {/* Portafolio */}
        <section className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="mr-2 text-xs uppercase tracking-wide text-neutral-400">Portafolio</h2>
            <button className={chip(filter === 'all')} onClick={() => setFilter('all')}>
              Todo
            </button>
            {FORMATS.map((f) => (
              <button key={f.id} className={chip(filter === f.id)} onClick={() => setFilter(f.id)}>
                {f.icon} {f.name}
              </button>
            ))}
            <input
              className="ml-auto w-48 rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-xs outline-none focus:border-cyan-400"
              placeholder="Buscar…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          {shown.length === 0 ? (
            <p className="rounded-lg border border-dashed border-neutral-800 p-6 text-center text-xs text-neutral-500">
              {items.length === 0
                ? 'Tu portafolio está vacío. Creá algo desde las tarjetas de arriba o guardá una vista desde el globo.'
                : 'Ningún item coincide con el filtro.'}
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((it) => {
                const f = FORMAT_BY_ID[it.type] || { icon: '📄', name: it.type }
                return (
                  <Link
                    key={it.id}
                    href={'/workspace?item=' + it.id}
                    className="group overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900 hover:border-cyan-400"
                  >
                    <div className="pointer-events-none h-44 overflow-hidden bg-neutral-950 p-2">
                      <ItemView item={it} />
                    </div>
                    <div className="flex items-center gap-2 border-t border-neutral-800 p-2">
                      <div className="min-w-0 flex-1">
                        <div className="truncate">{it.title}</div>
                        <div className="text-xs text-neutral-500">
                          {f.icon} {f.name} · {fmtDate(it.updatedAt)}
                        </div>
                      </div>
                      <button
                        className="text-neutral-500 opacity-0 hover:text-red-400 group-hover:opacity-100"
                        onClick={(e) => deleteItem(e, it.id)}
                        title="Eliminar"
                      >
                        ✕
                      </button>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        {/* Notas */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-wide text-neutral-400">Notas recientes</h2>
            <Link href="/workspace?tab=notes" className="text-xs text-cyan-300 underline">
              Ver todas
            </Link>
          </div>
          {recentNotes.length === 0 ? (
            <p className="text-xs text-neutral-500">Todavía no escribiste notas.</p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {recentNotes.map((n) => (
                <li key={n.id}>
                  <Link
                    href={'/workspace?note=' + n.id}
                    className="block rounded-lg border border-neutral-800 bg-neutral-900 p-3 hover:border-cyan-400"
                  >
                    <div className="truncate">📝 {n.title || 'Sin título'}</div>
                    <div className="mt-1 line-clamp-2 text-xs text-neutral-500">
                      {n.body.replace(/^#+\s.*\n?/, '').trim().slice(0, 120) || 'Vacía'}
                    </div>
                    <div className="mt-1 text-xs text-neutral-600">{fmtDate(n.updatedAt)}</div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="pb-4 text-xs text-neutral-600">
          Todo se guarda en este navegador. Más adelante lo pasamos a una cuenta en la nube.
        </p>
      </div>
    </div>
  )
}
