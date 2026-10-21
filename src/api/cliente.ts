import createClient from 'openapi-fetch'
import { API_URL } from '../config.ts'
import { ApiError, errorDeRespuesta } from './errores.ts'
import type { components, paths } from './schema.d.ts'

export type Libro = components['schemas']['LibroResponse']
export type PaginaDeLibros = components['schemas']['PaginaDtoLibroResponse']

type Resultado<T> = { data?: T; error?: unknown; response: Response }

/**
 * The typed client: every path, parameter and body comes from the contract, so a call the contract does not
 * describe does not compile. `fetchImpl` exists so tests can answer without a network.
 */
export function crearCliente(baseUrl: string = API_URL, fetchImpl: typeof fetch = (...args) => fetch(...args)) {
  return createClient<paths>({ baseUrl, fetch: fetchImpl })
}

/**
 * Turns the client's `{ data, error }` into "the data, or an ApiError". Network failures become an ApiError
 * with status 0, so screens handle a single kind of failure.
 */
export async function resolver<T>(llamada: Promise<Resultado<T>>): Promise<T> {
  let resultado: Resultado<T>
  try {
    resultado = await llamada
  } catch {
    throw new ApiError(0, null, null)
  }
  if (!resultado.response.ok) {
    throw errorDeRespuesta(resultado.response.status, resultado.error)
  }
  return resultado.data as T
}

/** The operations the screens use, as plain functions that return the data or throw an ApiError. */
export function crearApi(cliente = crearCliente()) {
  return {
    libros: {
      listar: (consulta: { q?: string; page?: number; size?: number } = {}) =>
        resolver(cliente.GET('/api/v1/libros', { params: { query: consulta } })),
    },
  }
}

export const api = crearApi()
