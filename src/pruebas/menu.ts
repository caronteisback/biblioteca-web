import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

/** Opens the panel under the user's name, at the top right. */
export async function abrirMenuDeUsuario() {
  await userEvent.click(await screen.findByRole('button', { name: /^Cuenta de / }))
}

/** Signs out the way a person does: open the user's menu and choose "Salir". */
export async function salirDelPanel() {
  await abrirMenuDeUsuario()
  await userEvent.click(screen.getByRole('button', { name: 'Salir' }))
}
