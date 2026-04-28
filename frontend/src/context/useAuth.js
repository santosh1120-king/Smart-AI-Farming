import { useContext } from 'react'
import { AuthContext } from './authContextValue'

export function useAuth() {
  const contextValue = useContext(AuthContext)

  if (!contextValue) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return contextValue
}
