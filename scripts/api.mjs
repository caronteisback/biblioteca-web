// Generates src/api/schema.d.ts from the pinned copy of the contract, or checks that it is up to date.
//   node scripts/api.mjs generate   writes the types
//   node scripts/api.mjs check      fails if the contract copy was edited or the types are stale
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const CONTRATO = 'contract/openapi.yaml'
const PROPIEDADES = 'contract/contract.properties'
const TIPOS = 'src/api/schema.d.ts'
const CLI = 'node_modules/openapi-typescript/bin/cli.js'

const salto = (texto) => texto.replace(/\r\n/g, '\n')

function propiedades() {
  const valores = {}
  for (const linea of readFileSync(PROPIEDADES, 'utf8').split(/\r?\n/)) {
    const texto = linea.trim()
    if (!texto || texto.startsWith('#')) continue
    const corte = texto.indexOf('=')
    valores[texto.slice(0, corte)] = texto.slice(corte + 1)
  }
  return valores
}

function verificarCopia() {
  const esperado = propiedades().sha256
  const real = createHash('sha256').update(salto(readFileSync(CONTRATO, 'utf8'))).digest('hex')
  if (real !== esperado) {
    fallar(`${CONTRATO} no coincide con ${PROPIEDADES}: copia una versión etiquetada de biblioteca-contrato y actualiza las tres líneas.`)
  }
}

function generar(destino) {
  execFileSync(process.execPath, [CLI, CONTRATO, '-o', destino], { stdio: 'pipe' })
}

function fallar(mensaje) {
  console.error(mensaje)
  process.exit(1)
}

const orden = process.argv[2]
verificarCopia()
if (orden === 'generate') {
  generar(TIPOS)
  console.log(`Tipos generados desde el contrato ${propiedades().tag} en ${TIPOS}`)
} else if (orden === 'check') {
  const temporal = join(mkdtempSync(join(tmpdir(), 'api-')), 'schema.d.ts')
  generar(temporal)
  if (salto(readFileSync(temporal, 'utf8')) !== salto(readFileSync(TIPOS, 'utf8'))) {
    fallar(`${TIPOS} está desactualizado: ejecuta "npm run api:generate" y súbelo.`)
  }
  console.log(`Contrato ${propiedades().tag}: copia fiel y tipos al día`)
} else {
  fallar('Uso: node scripts/api.mjs generate | check')
}
