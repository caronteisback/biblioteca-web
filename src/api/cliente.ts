import createClient from 'openapi-fetch'
import { API_URL } from '../config.ts'
import { cerrarSesion, obtenerSesion } from '../sesion/estado.ts'
import { ApiError, errorDeRespuesta } from './errores.ts'
import type { components, paths } from './schema.d.ts'

export type Libro = components['schemas']['LibroResponse']
export type LibroPedido = components['schemas']['LibroRequest']
export type Ejemplar = components['schemas']['EjemplarResponse']
export type Socio = components['schemas']['SocioResponse']
export type SocioResumen = components['schemas']['SocioResumen']
export type SocioPedido = components['schemas']['SocioRequest']
export type Alerta = components['schemas']['Alerta']
export type Usuario = components['schemas']['UsuarioResponse']
export type Rol = Usuario['rol']
export type Prestamo = components['schemas']['PrestamoResponse']
export type Multa = components['schemas']['MultaResponse']
export type EstadoMulta = Multa['estado']

/** One page of a list, as every list of the API answers it. */
export interface Pagina<T> {
  items: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface Consulta {
  q?: string
  page?: number
  size?: number
}

type Resultado<T> = { data?: T; error?: unknown; response: Response }

/**
 * The typed client: every path, parameter and body comes from the contract, so a call the contract does not
 * describe does not compile. `fetchImpl` exists so tests can answer without a network.
 */
export function crearCliente(baseUrl: string = API_URL, fetchImpl: typeof fetch = (...args) => fetch(...args)) {
  const cliente = createClient<paths>({ baseUrl, fetch: fetchImpl })
  const ENTRAR = '/api/v1/auth/login'
  cliente.use({
    /** Every call but the sign-in carries the token of the session, if there is one. */
    onRequest({ request, schemaPath }) {
      const sesion = obtenerSesion()
      if (sesion && schemaPath !== ENTRAR) request.headers.set('Authorization', `Bearer ${sesion.token}`)
      return request
    },
    /** A 401 on a call that carried a token means the token is not good any more: the session ends and the screen asks to sign in. */
    onResponse({ response, schemaPath }) {
      if (response.status === 401 && schemaPath !== ENTRAR && obtenerSesion()) cerrarSesion('rechazada')
    },
  })
  return cliente
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

/** Like {@link resolver}, for the answers that carry no body (204). */
export async function resolverVacio(llamada: Promise<Resultado<unknown>>): Promise<void> {
  let resultado: Resultado<unknown>
  try {
    resultado = await llamada
  } catch {
    throw new ApiError(0, null, null)
  }
  if (!resultado.response.ok) {
    throw errorDeRespuesta(resultado.response.status, resultado.error)
  }
}

/** The operations the screens use, as plain functions that return the data or throw an ApiError. */
export function crearApi(cliente = crearCliente()) {
  return {
    auth: {
      entrar: (email: string, password: string) => resolver(cliente.POST('/api/v1/auth/login', { body: { email, password } })),
    },
    cuenta: {
      yo: () => resolver(cliente.GET('/api/v1/me')),
      misPrestamos: (consulta: Omit<Consulta, 'q'> & { activo?: boolean } = {}) =>
        resolver(cliente.GET('/api/v1/me/prestamos', { params: { query: consulta } })),
      misMultas: (consulta: Omit<Consulta, 'q'> & { estado?: EstadoMulta } = {}) =>
        resolver(cliente.GET('/api/v1/me/multas', { params: { query: consulta } })),
    },
    libros: {
      listar: (consulta: Consulta = {}) => resolver(cliente.GET('/api/v1/libros', { params: { query: consulta } })),
      obtener: (id: number) => resolver(cliente.GET('/api/v1/libros/{id}', { params: { path: { id } } })),
      crear: (cuerpo: LibroPedido) => resolver(cliente.POST('/api/v1/libros', { body: cuerpo })),
      actualizar: (id: number, cuerpo: LibroPedido) =>
        resolver(cliente.PUT('/api/v1/libros/{id}', { params: { path: { id } }, body: cuerpo })),
      eliminar: (id: number) => resolverVacio(cliente.DELETE('/api/v1/libros/{id}', { params: { path: { id } } })),
    },
    ejemplares: {
      listarDeLibro: (libroId: number, consulta: Omit<Consulta, 'q'> = {}) =>
        resolver(
          cliente.GET('/api/v1/libros/{libroId}/ejemplares', { params: { path: { libroId }, query: consulta } }),
        ),
      crear: (libroId: number, codigo: string) =>
        resolver(cliente.POST('/api/v1/libros/{libroId}/ejemplares', { params: { path: { libroId } }, body: { codigo } })),
      obtener: (id: number) => resolver(cliente.GET('/api/v1/ejemplares/{id}', { params: { path: { id } } })),
      darDeBaja: (id: number) => resolver(cliente.POST('/api/v1/ejemplares/{id}/baja', { params: { path: { id } } })),
      reactivar: (id: number) => resolver(cliente.POST('/api/v1/ejemplares/{id}/alta', { params: { path: { id } } })),
      eliminar: (id: number) =>
        resolverVacio(cliente.DELETE('/api/v1/ejemplares/{id}', { params: { path: { id } } })),
    },
    socios: {
      listar: (consulta: Consulta = {}) =>
        resolver(cliente.GET('/api/v1/socios', { params: { query: consulta } })),
      obtener: (id: number) => resolver(cliente.GET('/api/v1/socios/{id}', { params: { path: { id } } })),
      crear: (cuerpo: SocioPedido) => resolver(cliente.POST('/api/v1/socios', { body: cuerpo })),
      actualizar: (id: number, cuerpo: SocioPedido) =>
        resolver(cliente.PUT('/api/v1/socios/{id}', { params: { path: { id } }, body: cuerpo })),
      desactivar: (id: number) =>
        resolver(cliente.POST('/api/v1/socios/{id}/desactivar', { params: { path: { id } } })),
      reactivar: (id: number) =>
        resolver(cliente.POST('/api/v1/socios/{id}/reactivar', { params: { path: { id } } })),
      eliminar: (id: number) => resolverVacio(cliente.DELETE('/api/v1/socios/{id}', { params: { path: { id } } })),
    },
    prestamos: {
      listar: (consulta: Omit<Consulta, 'q'> & { socioId?: number; activo?: boolean } = {}) =>
        resolver(cliente.GET('/api/v1/prestamos', { params: { query: consulta } })),
      obtener: (id: number) => resolver(cliente.GET('/api/v1/prestamos/{id}', { params: { path: { id } } })),
      crear: (socioId: number, ejemplarId: number) =>
        resolver(cliente.POST('/api/v1/prestamos', { body: { socioId, ejemplarId } })),
      renovar: (id: number) =>
        resolver(cliente.POST('/api/v1/prestamos/{id}/renovacion', { params: { path: { id } } })),
      devolver: (id: number) =>
        resolver(cliente.POST('/api/v1/prestamos/{id}/devolucion', { params: { path: { id } } })),
    },
    multas: {
      listar: (consulta: Omit<Consulta, 'q'> & { socioId?: number; estado?: EstadoMulta } = {}) =>
        resolver(cliente.GET('/api/v1/multas', { params: { query: consulta } })),
      pagar: (id: number) => resolver(cliente.POST('/api/v1/multas/{id}/pago', { params: { path: { id } } })),
    },
  }
}

export type Api = ReturnType<typeof crearApi>

export const api: Api = crearApi()
