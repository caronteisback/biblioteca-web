import type { Usuario } from '../api/cliente.ts'

/** The lending rules as the API sends them in `/me`, with the values of its default configuration. */
export const REGLAS: Usuario['reglas'] = { maxPrestamosActivos: 5, puntajeMinimo: 50, maxRenovaciones: 3, diasPlazo: 14 }
