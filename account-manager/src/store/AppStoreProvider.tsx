import React, { useCallback, useEffect, useMemo, useState } from 'react'
import type { AccountRecord, EncryptedString } from '../lib/types'
import { decryptString, encryptString } from '../lib/crypto'
import { loadAccounts, saveAccounts } from '../lib/storage'
import { AppStoreContext, type AppStore } from './appStoreContext'

const VAULT_CHECK_KEY = 'pam.vault.check.v1'
const VAULT_CHECK_PLAINTEXT = 'pam-vault-ok'

function readVaultCheck(): EncryptedString | null {
  const raw = localStorage.getItem(VAULT_CHECK_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as EncryptedString
  } catch {
    return null
  }
}

function writeVaultCheck(payload: EncryptedString) {
  localStorage.setItem(VAULT_CHECK_KEY, JSON.stringify(payload))
}

export function AppStoreProvider(props: { children: React.ReactNode }) {
  const [accounts, setAccounts] = useState(() => loadAccounts())
  const [vaultPassword, setVaultPassword] = useState<string | null>(null)
  const [vault, setVault] = useState<AppStore['vault']>({ status: 'locked' })

  useEffect(() => {
    saveAccounts(accounts)
  }, [accounts])

  const addAccount = useCallback<AppStore['addAccount']>((account) => {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    const record = { ...account, id, createdAt: now, updatedAt: now }
    setAccounts((prev) => [record, ...prev])
    return id
  }, [])

  const updateAccount = useCallback<AppStore['updateAccount']>((id, updates) => {
    const now = new Date().toISOString()
    setAccounts((prev) =>
      prev.map((a) => (a.id === id ? ({ ...a, ...updates, updatedAt: now } as AccountRecord) : a)),
    )
  }, [])

  const deleteAccount = useCallback<AppStore['deleteAccount']>((id) => {
    setAccounts((prev) => prev.filter((a) => a.id !== id))
  }, [])

  const replaceAllAccounts = useCallback<AppStore['replaceAllAccounts']>((next) => {
    setAccounts(next)
  }, [])

  const unlockVault = useCallback<AppStore['unlockVault']>(async (password) => {
    setVault({ status: 'locked' })

    const check = readVaultCheck()
    if (!check) {
      const created = await encryptString(VAULT_CHECK_PLAINTEXT, password)
      writeVaultCheck(created)
      setVaultPassword(password)
      setVault({ status: 'unlocked' })
      return true
    }

    try {
      const plain = await decryptString(check, password)
      if (plain !== VAULT_CHECK_PLAINTEXT) throw new Error('Vault check mismatch')
      setVaultPassword(password)
      setVault({ status: 'unlocked' })
      return true
    } catch {
      setVaultPassword(null)
      setVault({ status: 'locked', error: 'Incorrect vault password.' })
      return false
    }
  }, [])

  const lockVault = useCallback<AppStore['lockVault']>(() => {
    setVaultPassword(null)
    setVault({ status: 'locked' })
  }, [])

  const value = useMemo<AppStore>(
    () => ({
      accounts,
      addAccount,
      updateAccount,
      deleteAccount,
      replaceAllAccounts,
      vault,
      unlockVault,
      lockVault,
      vaultPassword,
    }),
    [accounts, addAccount, updateAccount, deleteAccount, replaceAllAccounts, vault, unlockVault, lockVault, vaultPassword],
  )

  return <AppStoreContext.Provider value={value}>{props.children}</AppStoreContext.Provider>
}

