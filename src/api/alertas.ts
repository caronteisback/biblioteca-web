import type { Alerta } from './cliente.ts'

/** What each alert code says to the librarian. Like the error messages, the build fails if the contract adds a code. */
export const ALERTAS: Record<Alerta['code'], string> = {
  DUE_SOON: 'Un préstamo vence pronto.',
  OVERDUE: 'Tiene un préstamo vencido.',
  PENDING_FINE: 'Tiene una multa pendiente.',
  LOW_SCORE: 'Puntaje bajo: no puede pedir préstamos.',
}

/** The same alerts told to the member about themselves, in the second person. */
export const ALERTAS_PROPIAS: Record<Alerta['code'], string> = {
  DUE_SOON: 'Un préstamo tuyo vence pronto.',
  OVERDUE: 'Tienes un préstamo vencido: devuélvelo cuanto antes.',
  PENDING_FINE: 'Tienes una multa pendiente. No podrás pedir libros hasta pagarla en el mostrador.',
  LOW_SCORE: 'Tu puntaje es bajo: no puedes pedir libros por ahora.',
}
