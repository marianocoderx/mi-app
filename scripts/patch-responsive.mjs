import fs from 'fs'

// Agrega clases al final del className de una línea
const extra = (from, cls) => [from, from.replace(/">$/, ' ' + cls + '">')]

const MENU_BTN = (state, setter) => `<button
        className="absolute left-2 top-2 z-20 rounded-md border border-neutral-700 bg-neutral-900/90 px-3 py-2 text-xs text-neutral-100 backdrop-blur md:hidden"
        onClick={() => ${setter}((o) => !o)}
      >
        {${state} ? '✕ Cerrar' : '☰ Menú'}
      </button>`

const FILES = [
  {
    file: 'src/components/ui/Sidebar.js',
    marker: 'max-md:',
    changes: [
      ["import { gradientCss } from '@/utils/colors'", "import { useState } from 'react'\nimport { gradientCss } from '@/utils/colors'"],
      ["const isCat = active.kind === 'category'", "const [open, setOpen] = useState(false)\n  const isCat = active.kind === 'category'"],
      [
        '<aside className="absolute top-4 left-4 z-10 w-72 max-h-[calc(100vh-2rem)] overflow-y-auto rounded-xl bg-neutral-900/85 p-4 text-sm text-neutral-100 backdrop-blur space-y-4">',
        `<>
      ${MENU_BTN('open', 'setOpen')}
      <aside className={(open ? '' : 'max-md:hidden ') + 'absolute top-4 left-4 z-10 w-72 max-h-[calc(100vh-2rem)] overflow-y-auto rounded-xl bg-neutral-900/85 p-4 text-sm text-neutral-100 backdrop-blur space-y-4 max-md:top-[4.75rem] max-md:left-2 max-md:right-2 max-md:z-20 max-md:w-auto max-md:max-h-[calc(100vh-6rem)]'}>`,
      ],
      ['</aside>', '</aside>\n    </>'],
    ],
  },
  {
    file: 'src/components/ui/ComparePanel.js',
    marker: 'max-md:',
    changes: [
      extra(
        '<aside className="absolute top-4 right-4 z-10 w-80 max-h-[calc(100vh-2rem)] overflow-y-auto rounded-xl bg-neutral-900/90 p-4 text-sm text-neutral-100 backdrop-blur space-y-4">',
        'max-md:top-[4.75rem] max-md:left-2 max-md:right-2 max-md:w-auto max-md:max-h-[45vh]'
      ),
    ],
  },
  {
    file: 'src/components/ui/DrawToolbar.js',
    marker: 'max-md:',
    changes: [
      extra(
        '<aside className="absolute top-4 right-4 z-10 w-72 max-h-[calc(100vh-2rem)] overflow-y-auto rounded-xl bg-neutral-900/90 p-4 text-sm text-neutral-100 backdrop-blur space-y-3">',
        'max-md:top-[4.75rem] max-md:left-2 max-md:right-2 max-md:w-auto max-md:max-h-[45vh]'
      ),
    ],
  },
  {
    file: 'src/components/ui/TimeBar.js',
    marker: 'max-md:',
    changes: [
      extra(
        '<div className="absolute bottom-4 left-1/2 z-10 w-[min(92vw,720px)] -translate-x-1/2 space-y-2 rounded-xl bg-neutral-900/90 p-3 text-sm text-neutral-100 backdrop-blur">',
        'max-md:bottom-2'
      ),
      ['<div className="flex items-center gap-2">', '<div className="flex flex-wrap items-center gap-2">'],
    ],
  },
  {
    file: 'src/app/globe/page.js',
    marker: 'max-md:',
    changes: [
      extra(
        '<div className="absolute left-1/2 top-4 z-20 flex -translate-x-1/2 gap-2 text-xs">',
        'max-md:left-auto max-md:right-2 max-md:top-2 max-md:translate-x-0 max-md:flex-col max-md:items-end'
      ),
    ],
  },
  {
    file: 'src/app/maps/page.js',
    marker: 'max-md:',
    changes: [
      ['const svgRef = useRef(null)', 'const svgRef = useRef(null)\n  const [menuOpen, setMenuOpen] = useState(false)'],
      [
        '<aside className="absolute left-4 top-4 z-10 max-h-[calc(100vh-2rem)] w-72 space-y-4 overflow-y-auto rounded-xl bg-neutral-900/85 p-4 backdrop-blur">',
        `${MENU_BTN('menuOpen', 'setMenuOpen')}
      <aside className={(menuOpen ? '' : 'max-md:hidden ') + 'absolute left-4 top-4 z-10 max-h-[calc(100vh-2rem)] w-72 space-y-4 overflow-y-auto rounded-xl bg-neutral-900/85 p-4 backdrop-blur max-md:left-2 max-md:right-2 max-md:top-14 max-md:z-20 max-md:w-auto max-md:max-h-[calc(100vh-4.5rem)]'}>`,
      ],
    ],
  },
  {
    file: 'src/app/workspace/page.js',
    marker: 'max-md:',
    changes: [
      [
        "const [warn, setWarn] = useState('')",
        "const [warn, setWarn] = useState('')\n  const [navOpen, setNavOpen] = useState(true)\n  useEffect(() => {\n    if (selItemId || selNoteId) setNavOpen(false)\n  }, [selItemId, selNoteId])",
      ],
      [
        '<div className="fixed inset-0 flex bg-neutral-950 text-sm text-neutral-100">',
        `<div className="fixed inset-0 flex bg-neutral-950 text-sm text-neutral-100">
      <button
        className="absolute left-2 top-2 z-40 rounded-md border border-neutral-700 bg-neutral-900/90 px-3 py-2 text-xs text-neutral-100 md:hidden"
        onClick={() => setNavOpen((o) => !o)}
      >
        {navOpen ? '✕ Cerrar' : '☰ Mi espacio'}
      </button>`,
      ],
      [
        '<aside className="flex w-72 shrink-0 flex-col gap-3 border-r border-neutral-800 p-3">',
        `<aside className={(navOpen ? '' : 'max-md:hidden ') + 'flex w-72 shrink-0 flex-col gap-3 border-r border-neutral-800 p-3 max-md:absolute max-md:inset-y-0 max-md:left-0 max-md:z-30 max-md:w-[85vw] max-md:max-w-xs max-md:bg-neutral-950 max-md:pt-14 max-md:shadow-2xl'}>`,
      ],
      extra('<main className="flex-1 overflow-y-auto p-6">', 'max-md:p-3 max-md:pt-14'),
    ],
  },
  {
    file: 'src/app/page.js',
    marker: 'max-sm:w-full',
    changes: [['<div className="flex gap-2">', '<div className="flex flex-wrap gap-2 max-sm:w-full">']],
  },
]

let failed = 0
for (const { file, marker, changes } of FILES) {
  if (!fs.existsSync(file)) {
    console.log('FALTA        ' + file)
    failed++
    continue
  }
  let s = fs.readFileSync(file, 'utf8')
  if (s.includes(marker)) {
    console.log('YA APLICADO  ' + file)
    continue
  }
  let ok = true
  for (const [from, to] of changes) {
    const n = s.split(from).length - 1
    if (n !== 1) {
      console.log('NO COINCIDE  ' + file + ' (' + n + ' veces): ' + from.slice(0, 70))
      ok = false
      break
    }
    s = s.replace(from, () => to)
  }
  if (ok) {
    fs.writeFileSync(file, s)
    console.log('OK           ' + file)
  } else failed++
}
console.log(failed ? '\n' + failed + ' archivo(s) sin cambiar. Pegame esta salida.' : '\nListo.')
