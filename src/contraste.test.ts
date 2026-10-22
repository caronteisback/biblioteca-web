/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/**
 * axe cannot judge colour in jsdom, so the palette is checked here instead: every pair of colours that the styles put
 * one over the other must be readable (4.5:1 for text, 3:1 for the border of a field) in the light and in the dark theme.
 */
const css = readFileSync(new URL('./index.css', import.meta.url), 'utf8')

function tokens(selector: string): Record<string, string> {
  const inicio = css.indexOf(selector)
  const bloque = css.slice(inicio, css.indexOf('}', inicio))
  return Object.fromEntries([...bloque.matchAll(/--([a-z-]+):\s*(#[0-9a-f]{6});/g)].map((m) => [m[1], m[2]]))
}

function luminancia(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contraste(a: string, b: string): number {
  const [claro, oscuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x)
  return (claro + 0.05) / (oscuro + 0.05)
}

const TEXTO: [string, string][] = [
  ['texto', 'fondo'],
  ['texto', 'superficie'],
  ['suave', 'fondo'],
  ['suave', 'superficie'],
  ['acento', 'superficie'],
  ['acento', 'acento-suave'],
  ['acento-texto', 'acento'],
  ['ok', 'ok-fondo'],
  ['aviso', 'aviso-fondo'],
  ['error', 'error-fondo'],
  ['error', 'superficie'],
  ['neutro', 'neutro-fondo'],
]
const BORDES: [string, string][] = [
  ['borde-campo', 'superficie'],
  ['acento', 'superficie'],
]

describe.each([
  ['light', ':root {'],
  ['dark', ":root[data-tema='oscuro'] {"],
])('the %s theme', (_nombre, selector) => {
  const paleta = tokens(selector)

  it('defines every colour the pairs below use', () => {
    for (const nombre of new Set([...TEXTO, ...BORDES].flat())) expect(paleta[nombre], nombre).toMatch(/^#/)
  })

  it.each(TEXTO)('%s on %s reads at 4.5:1 or better', (primer, fondo) => {
    expect(contraste(paleta[primer], paleta[fondo])).toBeGreaterThanOrEqual(4.5)
  })

  it.each(BORDES)('%s against %s shows at 3:1 or better', (borde, fondo) => {
    expect(contraste(paleta[borde], paleta[fondo])).toBeGreaterThanOrEqual(3)
  })
})
