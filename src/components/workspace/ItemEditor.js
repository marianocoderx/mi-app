'use client'

import { FORMAT_BY_ID } from '@/data/formats'
import { ChartItemEditor } from '@/components/workspace/ChartItem'
import { TimelineView, TimelineEditor } from '@/components/workspace/TimelineView'
import { GraphEditor } from '@/components/workspace/GraphView'
import ItemView from '@/components/workspace/ItemView'

export default function ItemEditor({ item, onChange, onDelete, countryList }) {
  const f = FORMAT_BY_ID[item.type] || { icon: '📄', name: item.type }
  const setData = (data) => onChange({ ...item, data })

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{f.icon}</span>
        <input
          className="flex-1 border-b border-transparent bg-transparent text-xl font-semibold outline-none focus:border-neutral-700"
          value={item.title}
          onChange={(e) => onChange({ ...item, title: e.target.value })}
        />
        <button className="text-xs text-neutral-400 hover:text-red-400" onClick={onDelete}>
          Eliminar
        </button>
      </div>
      <p className="text-xs text-neutral-500">
        {f.name} · se guarda solo. Para usarlo en una nota escribí{' '}
        <code className="rounded bg-neutral-800 px-1">![[{item.title}]]</code>
      </p>

      {item.type === 'chart' && <ChartItemEditor data={item.data} onChange={setData} countryList={countryList} />}

      {item.type === 'timeline' && (
        <>
          <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
            <TimelineView data={item.data} />
          </div>
          <TimelineEditor data={item.data} onChange={setData} />
        </>
      )}

      {item.type === 'mindmap' && <GraphEditor data={item.data} onChange={setData} />}
      {item.type === 'diagram' && <GraphEditor data={item.data} onChange={setData} directed />}

      {item.type === 'map' && (
        <div className="space-y-3">
          <ItemView item={item} />
          <p className="text-xs text-neutral-500">
            Esto es una captura del globo. Para cambiarla, abrí el globo, armá la vista y volvé a guardarla.{' '}
            <a href="/globe" className="text-cyan-300 underline">
              Ir al globo
            </a>
          </p>
        </div>
      )}
    </div>
  )
}
