'use client'

import ItemView from '@/components/workspace/ItemView'

const same = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase()

function Inline({ text, notes, onLink }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|`[^`]+`|\[\[[^\]]+\]\])/g)
  return parts.map((p, i) => {
    if (!p) return null
    if (p.startsWith('**') && p.endsWith('**') && p.length > 4) return <strong key={i}>{p.slice(2, -2)}</strong>
    if (p.startsWith('`') && p.endsWith('`') && p.length > 2)
      return (
        <code key={i} className="rounded bg-neutral-800 px-1 text-cyan-200">
          {p.slice(1, -1)}
        </code>
      )
    if (p.startsWith('[[') && p.endsWith(']]')) {
      const t = p.slice(2, -2)
      const exists = notes.some((n) => same(n.title, t))
      return (
        <button
          key={i}
          onClick={() => onLink(t)}
          className={exists ? 'text-cyan-300 underline' : 'text-neutral-400 underline decoration-dashed'}
          title={exists ? 'Abrir nota' : 'No existe: click para crearla'}
        >
          {t}
        </button>
      )
    }
    if (p.startsWith('*') && p.endsWith('*') && p.length > 2) return <em key={i}>{p.slice(1, -1)}</em>
    return <span key={i}>{p}</span>
  })
}

export default function NoteView({ body, items, notes, onLink, onToggle }) {
  const lines = body.split('\n')
  const blocks = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    let m

    if (line.trim() === '') {
      i++
      continue
    }
    if (line.startsWith('```')) {
      const buf = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) buf.push(lines[i++])
      i++
      blocks.push({ t: 'code', text: buf.join('\n') })
      continue
    }
    if ((m = line.match(/^!\[\[(.+)\]\]\s*$/))) {
      blocks.push({ t: 'embed', title: m[1] })
      i++
      continue
    }
    if ((m = line.match(/^(#{1,3})\s+(.*)$/))) {
      blocks.push({ t: 'h', n: m[1].length, text: m[2] })
      i++
      continue
    }
    if (/^---+\s*$/.test(line)) {
      blocks.push({ t: 'hr' })
      i++
      continue
    }
    if (line.startsWith('> ')) {
      const buf = []
      while (i < lines.length && lines[i].startsWith('> ')) buf.push(lines[i++].slice(2))
      blocks.push({ t: 'quote', text: buf.join(' ') })
      continue
    }
    if (/^\s*[-*]\s+/.test(line)) {
      const list = []
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        const raw = lines[i].replace(/^\s*[-*]\s+/, '')
        const c = raw.match(/^\[( |x)\]\s+(.*)$/)
        list.push(c ? { idx: i, check: true, done: c[1] === 'x', text: c[2] } : { idx: i, text: raw })
        i++
      }
      blocks.push({ t: 'ul', list })
      continue
    }
    if (/^\d+\.\s+/.test(line)) {
      const list = []
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) list.push({ text: lines[i++].replace(/^\d+\.\s+/, '') })
      blocks.push({ t: 'ol', list })
      continue
    }
    blocks.push({ t: 'p', text: line })
    i++
  }

  const inline = (text) => <Inline text={text} notes={notes} onLink={onLink} />

  if (!blocks.length) return <p className="text-xs text-neutral-500">La nota está vacía.</p>

  return (
    <div className="space-y-2 text-sm leading-relaxed text-neutral-200">
      {blocks.map((b, k) => {
        if (b.t === 'h') {
          const cls = ['', 'text-2xl font-bold mt-4', 'text-xl font-semibold mt-3', 'text-lg font-semibold mt-2'][b.n]
          return (
            <div key={k} className={cls}>
              {inline(b.text)}
            </div>
          )
        }
        if (b.t === 'hr') return <hr key={k} className="my-3 border-neutral-800" />
        if (b.t === 'quote')
          return (
            <blockquote key={k} className="border-l-2 border-cyan-500 pl-3 text-neutral-400">
              {inline(b.text)}
            </blockquote>
          )
        if (b.t === 'code')
          return (
            <pre key={k} className="overflow-x-auto rounded-lg bg-neutral-900 p-3 text-xs text-cyan-200">
              {b.text}
            </pre>
          )
        if (b.t === 'ul')
          return (
            <ul key={k} className="space-y-1">
              {b.list.map((li) =>
                li.check ? (
                  <li key={li.idx} className="flex items-center gap-2">
                    <input type="checkbox" checked={li.done} onChange={() => onToggle && onToggle(li.idx)} />
                    <span className={li.done ? 'text-neutral-500 line-through' : ''}>{inline(li.text)}</span>
                  </li>
                ) : (
                  <li key={li.idx} className="ml-5 list-disc">
                    {inline(li.text)}
                  </li>
                )
              )}
            </ul>
          )
        if (b.t === 'ol')
          return (
            <ol key={k} className="space-y-1">
              {b.list.map((li, n) => (
                <li key={n} className="ml-5 list-decimal">
                  {inline(li.text)}
                </li>
              ))}
            </ol>
          )
        if (b.t === 'embed') {
          const item = items.find((x) => same(x.title, b.title))
          if (!item)
            return (
              <div key={k} className="rounded-lg border border-dashed border-neutral-700 p-3 text-xs text-neutral-500">
                No encontré “{b.title}” en tu portafolio.
              </div>
            )
          return (
            <figure key={k} className="my-3 rounded-lg border border-neutral-800 bg-neutral-900 p-3">
              <figcaption className="mb-2 text-xs uppercase tracking-wide text-neutral-400">{item.title}</figcaption>
              <ItemView item={item} />
            </figure>
          )
        }
        return <p key={k}>{inline(b.text)}</p>
      })}
    </div>
  )
}
