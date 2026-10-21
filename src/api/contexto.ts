import { createContext, use } from 'react'
import { api, type Api } from './cliente.ts'

/** The API the screens talk to. Tests provide a fake one; the app uses the real client. */
export const ApiContext = createContext<Api>(api)

export function useApi(): Api {
  return use(ApiContext)
}
