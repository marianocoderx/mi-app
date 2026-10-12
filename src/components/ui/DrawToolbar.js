'use client'

export const DRAW_COLORS = ['#ef4444', '#f97316', '#facc15', '#22c55e', '#22d3ee', '#a855f7', '#ffffff']

const TOOLS = [
  ['paint', '🎨', 'Pintar país'],
  ['pin', '📍', 'Marcador'],
  ['text', '✏️', 'Nota de texto'],
  ['arrow', '➡️', 'Flecha'],
  ['pulse', '🔵', 'Pulso'],
  ['erase', '🧹', 'Borrar'],
]

export default function DrawToolbar({
  tool,
  onTool,
  color,
  onColor,
  text,
  onText,
  showNames,
  onToggleNames,
  draft,
  onClear,
  onExport,
}) {
  const hints = {
    paint: 'Click en un país para pintarlo. Click de nuevo con el mismo color lo despinta.',
    pin: 'Click en el globo para poner un marcador. Si escribís un texto, aparece al lado.',
    text: 'Escribí el texto y hacé click donde quieras ubicarlo.',
    arrow: draft ? 'Ahora hacé click en el destino.' : 'Click en el origen y después en el destino.',
    pulse: 'Click para dejar una marca pulsante que resalta una zona.',
    erase: 'Click sobre un marcador, nota, flecha o pulso para borrarlo. En un país, quita su color.',
  }

  const btn =
    'rounded-md bg-neutral-800 border border-neutral-700 px-3 py-1.5 text-xs hover:bg-neutral-700'

  return (
    <aside className="absolute top-4 right-4 z-10 w-72 max-h-[calc(100vh-2rem)] overflow-y-auto rounded-xl bg-neutral-900/90 p-4 text-sm text-neutral-100 backdrop-blur space-y-3">
      <h2 className="text-base font-semibold">Mapa mudo</h2>

      <div className="grid grid-cols-2 gap-1">
        {TOOLS.map(([id, icon, label]) => (
          <button
            key={id}
            onClick={() => onTool(id)}
            className={`rounded-md border px-2 py-1.5 text-left text-xs ${
              tool === id
                ? 'border-cyan-400 bg-cyan-900/40 text-cyan-200'
                : 'border-neutral-700 bg-neutral-800 hover:bg-neutral-700'
            }`}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      <div>
        <p className="mb-1 text-xs uppercase tracking-wide text-neutral-400">Color</p>
        <div className="flex gap-2">
          {DRAW_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => onColor(c)}
              className={`h-6 w-6 rounded-full border-2 ${
                color === c ? 'border-cyan-400' : 'border-neutral-700'
              }`}
              style={{ background: c }}
              aria-label={c}
            />
          ))}
        </div>
      </div>

      {(tool === 'text' || tool === 'pin') && (
        <input
          className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm outline-none focus:border-cyan-400"
          placeholder={tool === 'text' ? 'Texto de la nota' : 'Texto del marcador (opcional)'}
          value={text}
          onChange={(e) => onText(e.target.value)}
        />
      )}

      <p className="text-xs text-cyan-200">{hints[tool]}</p>

      <label className="flex items-center gap-2 text-xs text-neutral-300">
        <input type="checkbox" checked={showNames} onChange={onToggleNames} />
        Mostrar nombres al pasar el cursor
      </label>

      <div className="flex gap-2">
        <button className={btn} onClick={onExport}>
          Guardar imagen
        </button>
        <button className={`${btn} hover:border-red-400`} onClick={onClear}>
          Borrar todo
        </button>
      </div>
    </aside>
  )
}
