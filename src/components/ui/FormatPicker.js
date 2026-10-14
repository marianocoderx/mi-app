'use client'

import { FORMATS } from '@/data/formats'

export default function FormatPicker({ onPick, onClose }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="w-full max-w-xl rounded-xl bg-neutral-900 p-5 text-sm text-neutral-100 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">¿Qué querés crear?</h2>
          <button className="text-neutral-400 hover:text-white" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {FORMATS.map((f) => (
            <button
              key={f.id}
              onClick={() => onPick(f.id)}
              className="rounded-lg border border-neutral-700 bg-neutral-800 p-3 text-left hover:border-cyan-400 hover:bg-neutral-700"
            >
              <div className="text-base">
                {f.icon} {f.name}
              </div>
              <div className="mt-1 text-xs text-neutral-400">{f.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
