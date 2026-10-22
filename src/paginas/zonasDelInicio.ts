import type { Zona } from '../componentes/zonas.ts'

/** From this score up a member is in good standing. It is a way of showing the score, not a rule of the API. */
export const PUNTAJE_BUENO = 80

/**
 * The score from 0 to 100: red below the minimum to borrow (the member is blocked), amber up to "good", green above.
 * The minimum comes from the API, so a change of its configuration moves the red zone without touching the panel.
 */
export function zonasDelPuntaje(puntajeMinimo: number): Zona[] {
  const bueno = Math.max(puntajeMinimo, PUNTAJE_BUENO)
  const zonas: Zona[] = [{ desde: 0, tono: 'error', etiqueta: 'Bloqueado' }]
  if (bueno > puntajeMinimo) zonas.push({ desde: puntajeMinimo, tono: 'aviso', etiqueta: 'En riesgo' })
  zonas.push({ desde: bueno, tono: 'ok', etiqueta: 'Bueno' })
  return puntajeMinimo === 0 ? zonas.slice(1) : zonas
}

/**
 * Active loans against the limit: green up to half of it, amber while there is room (the label says how many are left)
 * and red when the limit is reached. Each whole number is a slot of the scale, so the red zone is the last slot.
 */
export function zonasDeLosLibros(maximo: number, usados: number): Zona[] {
  const mitad = Math.floor(maximo / 2)
  const restantes = Math.max(maximo - usados, 0)
  const zonas: Zona[] = [{ desde: 0, tono: 'ok', etiqueta: 'Puedes pedir más' }]
  if (mitad + 1 < maximo) zonas.push({ desde: mitad + 1, tono: 'aviso', etiqueta: restantes === 1 ? 'Te queda 1' : `Te quedan ${restantes}` })
  zonas.push({ desde: maximo, tono: 'error', etiqueta: 'Límite alcanzado' })
  return zonas
}
