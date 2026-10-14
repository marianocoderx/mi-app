'use client'

import { useEffect, useRef, useState } from 'react'

const W = 1000
const H = 600
const clamp = (v, a, b) => Math.min(b, Math.max(a, v))

// Dibuja formas ya proyectadas: [{ id, d, fill, label, interactive }]
export default function FlatMap({ shapes, ocean, border, onShapeClick, svgRef, resetKey }) {
  const [t, setT] = useState({ k: 1, x: 0, y: 0 })
  const [tip, setTip] = useState(null)
  const drag = useRef(null)
  const moved = useRef(false)

  useEffect(() => {
    setT({ k: 1, x: 0, y: 0 })
  }, [resetKey])

  const toSvg = (cx, cy) => {
    const svg = svgRef.current
    const pt = svg.createSVGPoint()
    pt.x = cx
    pt.y = cy
    const p = pt.matrixTransform(svg.getScreenCTM().inverse())
    return { x: p.x, y: p.y }
  }

  const zoomAt = (factor, p) =>
    setT((s) => {
      const k = clamp(s.k * factor, 1, 14)
      const f = k / s.k
      return { k, x: p.x - (p.x - s.x) * f, y: p.y - (p.y - s.y) * f }
    })

  const onDown = (e) => {
    moved.current = false
    drag.current = { sx: e.clientX, sy: e.clientY, tx: t.x, ty: t.y }
  }

  const onMove = (e) => {
    const d = drag.current
    if (!d) return
    const dx = e.clientX - d.sx
    const dy = e.clientY - d.sy
    if (Math.abs(dx) + Math.abs(dy) > 4) {
      moved.current = true
      setTip(null)
    }
    if (!moved.current) return
    const unit = 1 / svgRef.current.getScreenCTM().a
    setT((s) => ({ ...s, x: d.tx + dx * unit, y: d.ty + dy * unit }))
  }

  const end = () => (drag.current = null)

  return (
    <div className="absolute inset-0 bg-black">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="h-full w-full"
        style={{ touchAction: 'none', cursor: drag.current && moved.current ? 'grabbing' : 'grab' }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={end}
        onPointerLeave={end}
        onWheel={(e) => zoomAt(e.deltaY < 0 ? 1.2 : 1 / 1.2, toSvg(e.clientX, e.clientY))}
      >
        <rect x="-5000" y="-5000" width="11000" height="11000" fill={ocean} />
        <g transform={`translate(${t.x} ${t.y}) scale(${t.k})`}>
          {shapes.map((s) => (
            <path
              key={s.key}
              d={s.d}
              fill={tip && tip.key === s.key ? '#22d3ee' : s.fill}
              stroke={border}
              strokeWidth="0.7"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              style={{ pointerEvents: s.interactive ? 'auto' : 'none' }}
              onPointerMove={(e) => {
                if (drag.current && moved.current) return
                if (s.label) setTip({ key: s.key, x: e.clientX, y: e.clientY, text: s.label })
              }}
              onPointerLeave={() => setTip(null)}
              onClick={() => {
                if (!moved.current && s.interactive) onShapeClick(s)
              }}
            />
          ))}
        </g>
      </svg>

      <div className="absolute bottom-4 right-4 flex flex-col gap-1">
        {[
          ['+', () => zoomAt(1.5, { x: W / 2, y: H / 2 })],
          ['−', () => zoomAt(1 / 1.5, { x: W / 2, y: H / 2 })],
          ['⟲', () => setT({ k: 1, x: 0, y: 0 })],
        ].map(([label, fn]) => (
          <button
            key={label}
            onClick={fn}
            className="h-8 w-8 rounded-md border border-neutral-700 bg-neutral-900/85 text-neutral-100 backdrop-blur hover:bg-neutral-800"
          >
            {label}
          </button>
        ))}
      </div>

      {tip && (
        <div
          className="pointer-events-none fixed z-40 whitespace-pre-line rounded-md bg-black/85 px-2.5 py-1.5 text-xs text-white"
          style={{ left: tip.x + 14, top: tip.y + 14 }}
        >
          {tip.text}
        </div>
      )}
    </div>
  )
}
