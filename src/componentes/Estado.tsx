import type { ReactNode } from 'react'
import { Icono, type NombreDeIcono } from './Iconos.tsx'

/** What a status means, not what it is called: green is fine, amber needs attention, red is a problem, gray is inactive. */
export type Tono = 'ok' | 'aviso' | 'error' | 'neutro'

const ICONO: Record<Tono, NombreDeIcono> = { ok: 'bien', aviso: 'reloj', error: 'alerta', neutro: 'neutro' }

/** A colored status label. The color is never the only clue: it comes with an icon and the words. */
export function Estado({ tono, children }: { tono: Tono; children: ReactNode }) {
  return (
    <span className={`estado estado-${tono}`}>
      <Icono nombre={ICONO[tono]} tamano={14} />
      {children}
    </span>
  )
}
