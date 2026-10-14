import fs from 'fs'
const file = 'src/app/page.js'
let s = fs.readFileSync(file, 'utf8')
if (s.includes('Mapas planos')) {
  console.log('Ya estaba aplicado.')
  process.exit(0)
}
const from = `              🌍 Abrir el globo
            </Link>`
if (s.split(from).length - 1 !== 1) {
  console.error('No encontré el bloque. No toqué nada. Podés entrar directo a /maps.')
  process.exit(1)
}
const to = `${from}
            <Link
              href="/maps"
              className="rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-xs hover:bg-neutral-700"
            >
              🗺️ Mapas planos
            </Link>`
s = s.replace(from, () => to)
fs.writeFileSync(file, s)
console.log('Listo: dashboard actualizado.')
