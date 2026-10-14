'use client'

import { ChartItemView } from '@/components/workspace/ChartItem'
import { TimelineView } from '@/components/workspace/TimelineView'
import { GraphView } from '@/components/workspace/GraphView'

// Muestra cualquier item del portafolio (se usa en la vista previa y dentro de las notas)
export default function ItemView({ item }) {
  switch (item.type) {
    case 'chart':
      return <ChartItemView data={item.data} />
    case 'timeline':
      return <TimelineView data={item.data} />
    case 'mindmap':
      return <GraphView graph={item.data} />
    case 'diagram':
      return <GraphView graph={item.data} directed />
    case 'map':
      return (
        <figure>
          <img src={item.data.image} alt={item.title} className="w-full rounded-lg" />
          <figcaption className="mt-1 text-xs text-neutral-500">
            {item.data.dataset}
            {item.data.timeLabel && ` · ${item.data.timeLabel}`}
            {item.data.source && ` · ${item.data.source}`}
          </figcaption>
        </figure>
      )
    default:
      return null
  }
}
