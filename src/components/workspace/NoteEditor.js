'use client'

import { useRef, useState } from 'react'
import NoteView from '@/components/workspace/NoteView'

const btn = 'rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1 text-xs hover:bg-neutral-700'
const tab = (on) =>
  `rounded-md border px-3 py-1 text-xs ${
    on ? 'border-cyan-400 bg-cyan-900/40 text-cyan-200' : 'border-neutral-700 bg-neutral-800 hover:bg-neutral-700'
  }`

export default function NoteEditor({ note, notes, items, onChange, onDelete, onLink }) {
  const ref = useRef(null)
  const [mode, setMode] = useState('split')
  const [msg, setMsg] = useState('')

  const set = (patch) => onChange({ ...note, ...patch })

  const insert = (text, block) => {
    const el = ref.current
    const v = note.body
    const s = el ? el.selectionStart : v.length
    const e = el ? el.selectionEnd : v.length
    const pre = block && s > 0 && v[s - 1] !== '\n' ? '\n' : ''
    const post = block ? '\n' : ''
    const ins = pre + text + post
    set({ body: v.slice(0, s) + ins + v.slice(e) })
    requestAnimationFrame(() => {
      if (!el) return
      el.focus()
      el.selectionStart = el.selectionEnd = s + ins.length
    })
  }

  const toggleLine = (idx) => {
    const lines = note.body.split('\n')
    lines[idx] = lines[idx].replace(/\[( |x)\]/, (m, c) => (c === 'x' ? '[ ]' : '[x]'))
    set({ body: lines.join('\n') })
  }

  const key = '[[' + note.title.trim().toLowerCase() + ']]'
  const backlinks = notes.filter((n) => n.id !== note.id && n.body.toLowerCase().includes(key))

  const download = () => {
    const blob = new Blob([note.body], { type: 'text/markdown' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = (note.title.trim() || 'nota') + '.md'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(note.body)
      setMsg('Copiado')
    } catch {
      setMsg('No pude copiar')
    }
    setTimeout(() => setMsg(''), 1800)
  }

  const showEdit = mode !== 'read'
  const showRead = mode !== 'edit'

  return (
    <div className="mx-auto max-w-6xl space-y-3">
      <div className="flex items-center gap-3">
        <input
          className="flex-1 border-b border-transparent bg-transparent text-xl font-semibold outline-none focus:border-neutral-700"
          value={note.title}
          onChange={(e) => set({ title: e.target.value })}
        />
        <button className="text-xs text-neutral-400 hover:text-red-400" onClick={onDelete}>
          Eliminar
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button className={tab(mode === 'edit')} onClick={() => setMode('edit')}>
          Editar
        </button>
        <button className={tab(mode === 'split')} onClick={() => setMode('split')}>
          Dividido
        </button>
        <button className={tab(mode === 'read')} onClick={() => setMode('read')}>
          Leer
        </button>
        <span className="mx-1 text-neutral-700">|</span>
        <button className={btn} onClick={() => insert('## ', true)}>
          Título
        </button>
        <button className={btn} onClick={() => insert('- ', true)}>
          Lista
        </button>
        <button className={btn} onClick={() => insert('- [ ] ', true)}>
          ☑ Tarea
        </button>
        <button className={btn} onClick={() => insert('> ', true)}>
          Cita
        </button>
        <select
          className={btn}
          value=""
          onChange={(e) => e.target.value && insert('![[' + e.target.value + ']]', true)}
        >
          <option value="">📎 Insertar del portafolio…</option>
          {items.map((it) => (
            <option key={it.id} value={it.title}>
              {it.title}
            </option>
          ))}
        </select>
        <select className={btn} value="" onChange={(e) => e.target.value && insert('[[' + e.target.value + ']]', false)}>
          <option value="">🔗 Enlazar nota…</option>
          {notes
            .filter((n) => n.id !== note.id)
            .map((n) => (
              <option key={n.id} value={n.title}>
                {n.title}
              </option>
            ))}
        </select>
        <span className="mx-1 text-neutral-700">|</span>
        <button className={btn} onClick={download}>
          Exportar .md
        </button>
        <button className={btn} onClick={copy}>
          Copiar
        </button>
        {msg && <span className="text-xs text-cyan-300">{msg}</span>}
      </div>

      <div className={`grid gap-4 ${mode === 'split' ? 'lg:grid-cols-2' : ''}`}>
        {showEdit && (
          <textarea
            ref={ref}
            className="min-h-[60vh] w-full resize-y rounded-lg border border-neutral-800 bg-neutral-900 p-3 font-mono text-sm outline-none focus:border-cyan-400"
            value={note.body}
            onChange={(e) => set({ body: e.target.value })}
            placeholder={'# Título\n\nEscribí en Markdown.\n[[Otra nota]] enlaza, ![[Título de un item]] incrusta un gráfico, mapa o esquema.'}
          />
        )}
        {showRead && (
          <div className="min-h-[20vh] rounded-lg border border-neutral-800 p-4">
            <NoteView body={note.body} items={items} notes={notes} onLink={onLink} onToggle={toggleLine} />
          </div>
        )}
      </div>

      <div className="text-xs text-neutral-500">
        {backlinks.length > 0 ? (
          <>
            Mencionada en:{' '}
            {backlinks.map((n) => (
              <button key={n.id} className="mr-2 text-cyan-300 underline" onClick={() => onLink(n.title)}>
                {n.title}
              </button>
            ))}
          </>
        ) : (
          'Ninguna otra nota enlaza a esta todavía.'
        )}
      </div>

      <details className="text-xs text-neutral-500">
        <summary className="cursor-pointer">Ayuda de sintaxis</summary>
        <pre className="mt-2 rounded-lg bg-neutral-900 p-3 text-neutral-400">{`# Título   ## Subtítulo   ### Sección
**negrita**   *cursiva*   \`código\`
- lista        1. numerada
- [ ] tarea (se tilda en la vista de lectura)
> cita
---  (línea divisoria)
[[Nombre de otra nota]]        enlace entre notas
![[Título de un item]]         incrusta gráfico, línea de tiempo, mapa mental, esquema o mapa`}</pre>
      </details>
    </div>
  )
}
