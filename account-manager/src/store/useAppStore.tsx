import { useContext } from 'react'
import { AppStoreContext, type AppStore } from './appStoreContext'

export function useAppStore(): AppStore {
  const ctx = useContext(AppStoreContext)
  if (!ctx) throw new Error('useAppStore must be used within AppStoreProvider')
  return ctx
}

