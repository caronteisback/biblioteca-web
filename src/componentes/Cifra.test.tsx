// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { Cifra } from './Cifra.tsx'

afterEach(cleanup)

const dibujar = (ui: React.ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>)

describe('Cifra', () => {
  it('is a link to the list it counts and says its title, number and note', () => {
    dibujar(<Cifra titulo="Préstamos activos" valor={18} nota="de 20 ejemplares" enlace="/prestamos?estado=activos" />)

    const enlace = screen.getByRole('link', { name: /Préstamos activos/ })
    expect(enlace.getAttribute('href')).toBe('/prestamos?estado=activos')
    expect(enlace.textContent).toContain('18')
    expect(enlace.textContent).toContain('de 20 ejemplares')
  })

  it('says how it is doing in words, with the tone of the status', () => {
    const { container } = dibujar(<Cifra titulo="Vencidos" valor={3} enlace="/prestamos" estado={{ tono: 'error', texto: 'Atender' }} />)

    expect(screen.getByText('Atender').closest('.estado')?.classList.contains('estado-error')).toBe(true)
    expect(container.querySelectorAll('.estado')).toHaveLength(1)
  })

  it('shows a zero as a number, not as nothing', () => {
    dibujar(<Cifra titulo="Vencidos" valor={0} enlace="/prestamos" />)

    expect(screen.getByRole('link').textContent).toContain('0')
  })

  it('has no status and no note unless it is given one', () => {
    const { container } = dibujar(<Cifra titulo="Vencidos" valor={0} enlace="/prestamos" />)

    expect(container.querySelector('.estado')).toBeNull()
    expect(container.querySelector('.cifra-nota')).toBeNull()
  })
})
