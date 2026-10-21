import { describe, expect, it } from 'vitest'
import { crearApi, crearCliente } from './cliente.ts'
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
