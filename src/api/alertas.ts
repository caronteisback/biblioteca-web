import type { Alerta } from './cliente.ts'

/** What each alert code says to the librarian. Like the error messages, the build fails if the contract adds a code. */
export const ALERTAS: Record<Alerta['code'], string> = {
  DUE_SOON: 'Un préstamo vence pronto.',
  OVERDUE: 'Tiene un préstamo vencido.',
  PENDING_FINE: 'Tiene una multa pendiente.',
  LOW_SCORE: 'Puntaje bajo: no puede pedir préstamos.',
}
