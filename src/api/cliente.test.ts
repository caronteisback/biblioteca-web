import { afterEach, describe, expect, it } from 'vitest'
import { crearApi, crearCliente } from './cliente.ts'
import { avisoDeCierre, iniciarSesion, obtenerSesion, reiniciarSesionParaPruebas } from '../sesion/estado.ts'
import { ApiError } from './errores.ts'

const json = (cuerpo: unknown, estado = 200) =>
  new Response(JSON.stringify(cuerpo), { status: estado, headers: { 'Content-Type': 'application/json' } })

function apiCon(responder: (peticion: Request) => Response | Promise<Response>) {
  const peticiones: Request[] = []
  const falso = async (entrada: Request | string | URL, init?: RequestInit) => {
    const peticion = new Request(entrada, init)
    peticiones.push(peticion)
    return responder(peticion)
  }
  return { api: crearApi(crearCliente('http://api.test', falso as typeof fetch)), peticiones }
}

describe('api.libros.listar', () => {
  it('asks the catalog with the filters it was given and returns the page', async () => {
    const pagina = { items: [], page: 0, size: 5, totalElements: 0, totalPages: 0 }
    const { api, peticiones } = apiCon(() => json(pagina))

    const resultado = await api.libros.listar({ q: 'faro', size: 5 })

    expect(resultado.totalElements).toBe(0)
    expect(peticiones[0].method).toBe('GET')
    expect(peticiones[0].url).toBe('http://api.test/api/v1/libros?q=faro&size=5')
  })

  it('turns an error answer into an ApiError with the code of the contract', async () => {
    const { api } = apiCon(() => json({ code: 'VALIDATION_ERROR', message: 'size: must be at most 100' }, 400))

    await expect(api.libros.listar({ size: 500 })).rejects.toMatchObject({
      name: 'ApiError',
      estado: 400,
      codigo: 'VALIDATION_ERROR',
      detalleServidor: 'size: must be at most 100',
    })
  })

  it('turns a network failure into an ApiError with status 0', async () => {
    const { api } = apiCon(() => {
      throw new TypeError('Failed to fetch')
    })

    const error = await api.libros.listar().catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ estado: 0, codigo: null })
  })
})

describe('the session in the client', () => {
  const sesion = {
    token: 'el-token-de-la-sesion',
    expiraEn: new Date(Date.now() + 3_600_000).toISOString(),
    usuario: { id: 1, email: 'bibliotecaria@example.org', rol: 'LIBRARIAN' as const, socio: null },
  }
  const pagina = { items: [], page: 0, size: 20, totalElements: 0, totalPages: 0 }

  afterEach(() => reiniciarSesionParaPruebas())

  it('sends the token of the session with every call', async () => {
    iniciarSesion(sesion)
    const { api, peticiones } = apiCon(() => json(pagina))

    await api.libros.listar()

    expect(peticiones[0].headers.get('Authorization')).toBe('Bearer el-token-de-la-sesion')
  })

  it('sends no Authorization header when nobody is signed in', async () => {
    const { api, peticiones } = apiCon(() => json(pagina))

    await api.libros.listar()

    expect(peticiones[0].headers.has('Authorization')).toBe(false)
  })

  it('never sends the token to the sign-in itself', async () => {
    iniciarSesion(sesion)
    const { api, peticiones } = apiCon(() => json({ token: 'otro', tipo: 'Bearer', expiraEn: sesion.expiraEn, usuario: sesion.usuario }))

    await api.auth.entrar('bibliotecaria@example.org', 'una-contrasena-larga')

    expect(peticiones[0].headers.has('Authorization')).toBe(false)
    expect(JSON.parse(await peticiones[0].text())).toEqual({ email: 'bibliotecaria@example.org', password: 'una-contrasena-larga' })
  })

  it('ends the session when the API refuses the token, and says so', async () => {
    iniciarSesion(sesion)
    const { api } = apiCon(() => json({ code: 'UNAUTHENTICATED', message: 'You must sign in to use this operation.' }, 401))

    await expect(api.libros.listar()).rejects.toMatchObject({ codigo: 'UNAUTHENTICATED', estado: 401 })

    expect(obtenerSesion()).toBeNull()
    expect(avisoDeCierre()).toBe('Tu sesión ya no es válida. Entra de nuevo.')
  })

  it('keeps the session when a wrong password is refused at the sign-in', async () => {
    iniciarSesion(sesion)
    const { api } = apiCon(() => json({ code: 'INVALID_CREDENTIALS', message: 'The email or the password is not correct.' }, 401))

    await expect(api.auth.entrar('x@example.org', 'mala-contrasena-123')).rejects.toMatchObject({ codigo: 'INVALID_CREDENTIALS' })

    expect(obtenerSesion()).not.toBeNull()
  })

  it('keeps the session when only the role is refused (403)', async () => {
    iniciarSesion(sesion)
    const { api } = apiCon(() => json({ code: 'FORBIDDEN', message: 'Your role is not allowed to use this operation.' }, 403))

    await expect(api.cuenta.misPrestamos()).rejects.toMatchObject({ codigo: 'FORBIDDEN' })

    expect(obtenerSesion()).not.toBeNull()
  })
})
