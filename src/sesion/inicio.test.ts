import { describe, expect, it } from 'vitest'
import { destinoTrasEntrar, inicioDe } from './inicio.ts'

describe('inicioDe', () => {
  it('starts each role where it works, and nobody at the sign-in', () => {
    expect(inicioDe('LIBRARIAN')).toBe('/libros')
    expect(inicioDe('MEMBER')).toBe('/inicio')
    expect(inicioDe(null)).toBe('/login')
  })
})

describe('destinoTrasEntrar', () => {
  it('starts at the home of the role when nobody asked for a screen', () => {
    expect(destinoTrasEntrar('LIBRARIAN', null)).toBe('/libros')
    expect(destinoTrasEntrar('MEMBER', null)).toBe('/inicio')
  })

  it('takes a librarian back to any screen they asked for, search included', () => {
    expect(destinoTrasEntrar('LIBRARIAN', '/prestamos?estado=activos')).toBe('/prestamos?estado=activos')
    expect(destinoTrasEntrar('LIBRARIAN', '/socios/5')).toBe('/socios/5')
  })

  it('does not take a librarian to "my account", which is not theirs', () => {
    expect(destinoTrasEntrar('LIBRARIAN', '/cuenta')).toBe('/libros')
  })

  it('takes a member back to their home or their account when they asked for those', () => {
    expect(destinoTrasEntrar('MEMBER', '/inicio')).toBe('/inicio')
    expect(destinoTrasEntrar('MEMBER', '/cuenta')).toBe('/cuenta')
  })

  it('takes a member back to the catalog they asked for', () => {
    expect(destinoTrasEntrar('MEMBER', '/libros')).toBe('/libros')
    expect(destinoTrasEntrar('MEMBER', '/libros?q=faro&page=1')).toBe('/libros?q=faro&page=1')
    expect(destinoTrasEntrar('MEMBER', '/libros/7')).toBe('/libros/7')
  })

  it.each(['/socios', '/socios/5', '/prestamos', '/multas', '/libros/nuevo', '/libros/7/editar', '/algo-que-no-existe'])(
    'takes a member to their home instead of a refusal when they asked for %s',
    (pedido) => {
      expect(destinoTrasEntrar('MEMBER', pedido)).toBe('/inicio')
    },
  )
})
