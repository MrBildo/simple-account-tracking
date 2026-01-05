import { createContext } from 'react'
import type { AccountRecord } from '../lib/types'

export type VaultState = {
  status: 'locked' | 'unlocked'
  error?: string
}

export type AppStore = {
  accounts: AccountRecord[]
  addAccount: (account: Omit<AccountRecord, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateAccount: (id: string, updates: Partial<Omit<AccountRecord, 'id' | 'createdAt'>>) => void
  deleteAccount: (id: string) => void
  replaceAllAccounts: (accounts: AccountRecord[]) => void

  vault: VaultState
  unlockVault: (password: string) => Promise<boolean>
  lockVault: () => void
  vaultPassword: string | null
}

export const AppStoreContext = createContext<AppStore | null>(null)

