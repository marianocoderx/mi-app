import fs from 'fs'

const file = 'src/app/page.js'
let s = fs.readFileSync(file, 'utf8')

if (s.includes('showFormat')) {
  console.log('Ya estaba aplicado.')
  process.exit(0)
}

function rep(from, to) {
  const n = s.split(from).length - 1
  if (n !== 1) {
    console.error('No pude aplicar un cambio (' + n + ' coincidencias) para: ' + from.slice(0, 70))
    process.exit(1)
  }
  s = s.replace(from, () => to)
}

rep(
  "import { fetchIndicator } from '@/utils/worldbank'",
  "import { fetchIndicator } from '@/utils/worldbank'\nimport FormatPicker from '@/components/ui/FormatPicker'\nimport { addItem, makeItem } from '@/utils/store'"
)

rep(
  'const [showNew, setShowNew] = useState(false)',
  "const [showNew, setShowNew] = useState(false)\n  const [showFormat, setShowFormat] = useState(false)\n  const [savedMsg, setSavedMsg] = useState('')"
)

rep('onNew={() => setShowNew(true)}', 'onNew={() => setShowFormat(true)}')

rep(
  '  const handleExport = () => {',
  `  const handleSaveMap = () => {
    const g = globeRef.current
    if (!g) return
    let ok = false
    try {
      const src = g.renderer().domElement
      const w = Math.min(900, src.width)
      const h = Math.round((src.height * w) / src.width)
      const c = document.createElement('canvas')
      c.width = w
      c.height = h
      c.getContext('2d').drawImage(src, 0, 0, w, h)
      const item = makeItem('map')
      item.title = active.name + (timeLabel ? ' · ' + timeLabel : '')
      item.data = {
        image: c.toDataURL('image/jpeg', 0.82),
        dataset: active.name,
        unit: active.unit || '',
        timeLabel: timeLabel || '',
        source: active.wb ? 'Banco Mundial (' + active.wb + ')' : '',
      }
      ok = addItem(item)
    } catch (e) {
      ok = false
    }
    setSavedMsg(ok ? 'Guardado en tu portafolio ✓' : 'No se pudo guardar (almacenamiento lleno).')
    setTimeout(() => setSavedMsg(''), 2500)
  }

  const handleExport = () => {`
)

rep(
  '{showNew && (',
  `<div className="absolute left-1/2 top-4 z-20 flex -translate-x-1/2 gap-2 text-xs">
        <button
          className="rounded-md border border-neutral-700 bg-neutral-900/85 px-3 py-1.5 text-neutral-100 backdrop-blur hover:bg-neutral-800"
          onClick={handleSaveMap}
        >
          📸 Guardar vista en portafolio
        </button>
        <a
          href="/workspace"
          className="rounded-md border border-neutral-700 bg-neutral-900/85 px-3 py-1.5 text-neutral-100 backdrop-blur hover:bg-neutral-800"
        >
          📁 Portafolio y notas
        </a>
      </div>

      {savedMsg && (
        <div className="absolute left-1/2 top-16 z-20 -translate-x-1/2 rounded-md bg-cyan-700 px-3 py-1.5 text-xs text-white">
          {savedMsg}
        </div>
      )}

      {showFormat && (
        <FormatPicker
          onClose={() => setShowFormat(false)}
          onPick={(id) => {
            setShowFormat(false)
            if (id === 'map') setShowNew(true)
            else window.location.href = '/workspace?new=' + id
          }}
        />
      )}

      {showNew && (`
)

fs.writeFileSync(file, s)
console.log('Listo: page.js actualizado.')
