'use client'

import { useRef, useState } from 'react'
import { newId } from '@/utils/store'

export const NODE_COLORS = ['#22d3ee', '#facc15', '#f472b6', '#a3e635', '#c084fc', '#fb923c', '#f87171', '#e5e5e5']
const SHAPES = [
  ['pill', 'Píldora'],
  ['rect', 'Rectángulo'],
  ['oval', 'Óvalo'],
  ['diamond', 'Rombo'],
]

const clamp = (v, a, b) => Math.min(b, Math.max(a, v))

export function nodeSize(n) {
  const w = Math.max(70, (n.text || '').length * 7.5 + 28)
  if (n.shape === 'diamond') return { w: w * 1.35, h: 64 }
  if (n.shape === 'oval') return { w: w * 1.1, h: 44 }
  return { w, h: 38 }
}

// Punto donde la línea que va de n hacia "toward" sale del borde del nodo
function edgePoint(n, toward) {
  const { w, h } = nodeSize(n)
  const hw = w / 2
  const hh = h / 2
  const dx = toward.x - n.x
  const dy = toward.y - n.y
  if (!dx && !dy) return { x: n.x, y: n.y }
  let t
  if (n.shape === 'diamond') t = 1 / (Math.abs(dx) / hw + Math.abs(dy) / hh)
  else if (n.shape === 'oval') t = 1 / Math.sqrt((dx / hw) ** 2 + (dy / hh) ** 2)
  else t = Math.min(hw / (Math.abs(dx) || 1e-9), hh / (Math.abs(dy) || 1e-9))
  return { x: n.x + dx * t, y: n.y + dy * t }
}

function Defs() {
  return (
    <defs>
      <marker id="gv-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto">
        <path d="M0,0 L10,5 L0,10 z" fill="#a3a3a3" />
      </marker>
    </defs>
  )
}

function Edges({ nodes, edges, directed, selected, onPick }) {
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]))
  return (
    <>
      {edges.map((e) => {
        const a = byId[e.from]
        const b = byId[e.to]
        if (!a || !b) return null
        const p1 = edgePoint(a, b)
        const p2 = edgePoint(b, a)
        const sel = selected === e.id
        return (
          <g key={e.id}>
            <line
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke={sel ? '#22d3ee' : '#737373'}
              strokeWidth={sel ? 2.6 : 1.6}
              markerEnd={directed ? 'url(#gv-arrow)' : undefined}
            />
            {onPick && (
              <line
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke="transparent"
                strokeWidth="14"
                style={{ cursor: 'pointer' }}
                onPointerDown={(ev) => {
                  ev.stopPropagation()
                  onPick(e.id)
                }}
              />
            )}
            {e.label && (
              <text x={(p1.x + p2.x) / 2} y={(p1.y + p2.y) / 2 - 6} textAnchor="middle" fontSize="11" fill="#a3a3a3">
                {e.label}
              </text>
            )}
          </g>
        )
      })}
    </>
  )
}

function NodeShape({ n, selected, linking, onDown, onClick }) {
  const { w, h } = nodeSize(n)
  const props = {
    fill: n.color,
    fillOpacity: 0.2,
    stroke: selected ? '#ffffff' : n.color,
    strokeWidth: selected || linking ? 3 : 1.5,
  }
  let shape
  if (n.shape === 'diamond') {
    shape = (
      <polygon
        points={`${n.x},${n.y - h / 2} ${n.x + w / 2},${n.y} ${n.x},${n.y + h / 2} ${n.x - w / 2},${n.y}`}
        {...props}
      />
    )
  } else if (n.shape === 'oval') {
    shape = <ellipse cx={n.x} cy={n.y} rx={w / 2} ry={h / 2} {...props} />
  } else {
    shape = (
      <rect x={n.x - w / 2} y={n.y - h / 2} width={w} height={h} rx={n.shape === 'rect' ? 4 : h / 2} {...props} />
    )
  }
  return (
    <g onPointerDown={onDown} onClick={onClick} style={{ cursor: onDown ? 'grab' : onClick ? 'pointer' : 'default' }}>
      {shape}
      <text x={n.x} y={n.y} textAnchor="middle" dominantBaseline="central" fontSize="13" fill="#f5f5f5">
        {n.text}
      </text>
    </g>
  )
}

// Solo lectura (se usa en el portafolio, en las notas y en el grafo)
export function GraphView({ graph, directed = false, onNodeClick, maxHeight = 520 }) {
  const nodes = graph.nodes || []
  const edges = graph.edges || []
  if (!nodes.length) return <p className="text-xs text-neutral-500">Todavía no hay nodos.</p>

  let x0 = Infinity
  let y0 = Infinity
  let x1 = -Infinity
  let y1 = -Infinity
  nodes.forEach((n) => {
    const { w, h } = nodeSize(n)
    x0 = Math.min(x0, n.x - w / 2)
    x1 = Math.max(x1, n.x + w / 2)
    y0 = Math.min(y0, n.y - h / 2)
    y1 = Math.max(y1, n.y + h / 2)
  })
  const pad = 30
  const vb = `${x0 - pad} ${y0 - pad} ${Math.max(x1 - x0 + pad * 2, 260)} ${Math.max(y1 - y0 + pad * 2, 120)}`

  return (
    <svg viewBox={vb} className="w-full" style={{ maxHeight }}>
      <Defs />
      <Edges nodes={nodes} edges={edges} directed={directed} />
      {nodes.map((n) => (
        <NodeShape key={n.id} n={n} onClick={onNodeClick ? () => onNodeClick(n) : undefined} />
      ))}
    </svg>
  )
}

// Editor interactivo: arrastrar, conectar, renombrar, colorear
export function GraphEditor({ data, onChange, directed = false }) {
  const svgRef = useRef(null)
  const drag = useRef(null)
  const [sel, setSel] = useState(null) // { kind: 'node' | 'edge', id }
  const [connect, setConnect] = useState(false)
  const [from, setFrom] = useState(null)

  const nodes = data.nodes || []
  const edges = data.edges || []
  const selNode = sel && sel.kind === 'node' ? nodes.find((n) => n.id === sel.id) : null
  const selEdge = sel && sel.kind === 'edge' ? edges.find((e) => e.id === sel.id) : null

  const set = (patch) => onChange({ ...data, ...patch })
  const patchNode = (id, patch) => set({ nodes: nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)) })
  const patchEdge = (id, patch) => set({ edges: edges.map((e) => (e.id === id ? { ...e, ...patch } : e)) })

  const point = (e) => {
    const svg = svgRef.current
    const pt = svg.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const p = pt.matrixTransform(svg.getScreenCTM().inverse())
    return { x: p.x, y: p.y }
  }

  const addNode = (parent) => {
    const id = newId()
    const node = {
      id,
      x: 120 + Math.random() * 760,
      y: 80 + Math.random() * 440,
      text: 'Nuevo',
      color: parent ? parent.color : NODE_COLORS[nodes.length % NODE_COLORS.length],
      shape: parent ? parent.shape : directed ? 'rect' : 'pill',
    }
    if (parent) {
      const count = edges.filter((e) => e.from === parent.id).length
      if (directed) {
        node.x = clamp(parent.x + count * 170, 60, 940)
        node.y = clamp(parent.y + 110, 40, 560)
      } else {
        const a = count * 1.1 - 0.6
        node.x = clamp(parent.x + 190 * Math.cos(a), 60, 940)
        node.y = clamp(parent.y + 130 * Math.sin(a), 40, 560)
      }
      set({
        nodes: [...nodes, node],
        edges: [...edges, { id: newId(), from: parent.id, to: id, label: '' }],
      })
    } else {
      set({ nodes: [...nodes, node] })
    }
    setSel({ kind: 'node', id })
  }

  const removeSel = () => {
    if (selNode) {
      set({
        nodes: nodes.filter((n) => n.id !== selNode.id),
        edges: edges.filter((e) => e.from !== selNode.id && e.to !== selNode.id),
      })
    } else if (selEdge) {
      set({ edges: edges.filter((e) => e.id !== selEdge.id) })
    }
    setSel(null)
  }

  const onNodeDown = (e, n) => {
    e.stopPropagation()
    if (connect) {
      if (!from) {
        setFrom(n.id)
        return
      }
      if (from !== n.id && !edges.some((x) => x.from === from && x.to === n.id)) {
        const id = newId()
        set({ edges: [...edges, { id, from, to: n.id, label: '' }] })
        setSel({ kind: 'edge', id })
      }
      setFrom(null)
      return
    }
    setSel({ kind: 'node', id: n.id })
    const p = point(e)
    drag.current = { id: n.id, ox: p.x - n.x, oy: p.y - n.y }
    svgRef.current.setPointerCapture(e.pointerId)
  }

  const onMove = (e) => {
    const d = drag.current
    if (!d) return
    const p = point(e)
    patchNode(d.id, { x: clamp(p.x - d.ox, 40, 960), y: clamp(p.y - d.oy, 30, 570) })
  }

  const btn =
    'rounded-md border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs hover:bg-neutral-700 disabled:opacity-40'
  const input =
    'w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm outline-none focus:border-cyan-400'

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button className={btn} onClick={() => addNode(null)}>
          + Nodo
        </button>
        <button className={btn} disabled={!selNode} onClick={() => addNode(selNode)}>
          + Hijo del seleccionado
        </button>
        <button
          className={`${btn} ${connect ? 'border-yellow-400 text-yellow-300' : ''}`}
          onClick={() => {
            setConnect((c) => !c)
            setFrom(null)
          }}
        >
          {connect ? (from ? 'Elegí el destino…' : 'Elegí el origen…') : '🔗 Conectar'}
        </button>
        <button className={btn} disabled={!sel} onClick={removeSel}>
          🗑 Borrar selección
        </button>
      </div>

      <svg
        ref={svgRef}
        viewBox="0 0 1000 600"
        className="w-full rounded-lg border border-neutral-800 bg-neutral-950"
        style={{ aspectRatio: '1000 / 600', touchAction: 'none' }}
        onPointerMove={onMove}
        onPointerUp={() => (drag.current = null)}
        onPointerDown={() => {
          setSel(null)
          setFrom(null)
        }}
      >
        <Defs />
        <Edges
          nodes={nodes}
          edges={edges}
          directed={directed}
          selected={selEdge ? selEdge.id : null}
          onPick={(id) => setSel({ kind: 'edge', id })}
        />
        {nodes.map((n) => (
          <NodeShape
            key={n.id}
            n={n}
            selected={selNode && selNode.id === n.id}
            linking={from === n.id}
            onDown={(e) => onNodeDown(e, n)}
          />
        ))}
      </svg>

      {selNode && (
        <div className="space-y-2 rounded-lg border border-neutral-800 p-3">
          <input
            className={input}
            value={selNode.text}
            onChange={(e) => patchNode(selNode.id, { text: e.target.value })}
            placeholder="Texto del nodo"
          />
          <div className="flex flex-wrap items-center gap-2">
            {NODE_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => patchNode(selNode.id, { color: c })}
                className={`h-6 w-6 rounded-full border-2 ${selNode.color === c ? 'border-white' : 'border-neutral-700'}`}
                style={{ background: c }}
                aria-label={c}
              />
            ))}
            <select
              className="rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1 text-xs"
              value={selNode.shape || 'pill'}
              onChange={(e) => patchNode(selNode.id, { shape: e.target.value })}
            >
              {SHAPES.map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {selEdge && (
        <div className="flex gap-2 rounded-lg border border-neutral-800 p-3">
          <input
            className={input}
            value={selEdge.label || ''}
            onChange={(e) => patchEdge(selEdge.id, { label: e.target.value })}
            placeholder="Texto sobre la conexión (opcional)"
          />
          {directed && (
            <button className={btn} onClick={() => patchEdge(selEdge.id, { from: selEdge.to, to: selEdge.from })}>
              ⇄ Invertir
            </button>
          )}
        </div>
      )}

      <p className="text-xs text-neutral-500">
        Arrastrá los nodos para moverlos. Click en un nodo o en una línea para editarlo. Para unir dos nodos
        usá “Conectar” y tocá origen y destino.
      </p>
    </div>
  )
}
