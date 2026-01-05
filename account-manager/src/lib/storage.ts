import type { AccountRecord, AccountsFileV1 } from './types'

const STORAGE_KEY = 'pam.accounts.v1'

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function sanitizeAccount(raw: unknown): AccountRecord | null {
  if (!isObject(raw)) return null
  const id = asString(raw.id)
  const accountName = asString(raw.accountName)
  const type = asString(raw.type)
  const accountNumber = asString(raw.accountNumber)
  const createdAt = asString(raw.createdAt)
  const updatedAt = asString(raw.updatedAt)
  const currentBalance = asNumber(raw.currentBalance)

  if (!id || !accountName || !type || !accountNumber || !createdAt || !updatedAt) return null
  if (currentBalance === undefined) return null

  return {
    id,
    accountName,
    type: type as AccountRecord['type'],
    accountNumber,
    currentBalance,
    currentCardNumber: asString(raw.currentCardNumber),
    creditLimit: asNumber(raw.creditLimit),
    openDate: asString(raw.openDate),
    interestRateApr: asNumber(raw.interestRateApr),
    serviceFeeAmount: asNumber(raw.serviceFeeAmount),
    serviceFeeFrequency: asString(raw.serviceFeeFrequency) as AccountRecord['serviceFeeFrequency'],
    actualLastMinPayment: asNumber(raw.actualLastMinPayment),
    loginUrl: asString(raw.loginUrl),
    username: asString(raw.username),
    passwordEnc: isObject(raw.passwordEnc) ? (raw.passwordEnc as AccountRecord['passwordEnc']) : undefined,
    notes: asString(raw.notes),
    createdAt,
    updatedAt,
  }
}

export function loadAccounts(): AccountRecord[] {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.map(sanitizeAccount).filter((x): x is AccountRecord => Boolean(x))
  } catch {
    return []
  }
}

export function saveAccounts(accounts: AccountRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts))
}

export function buildExportFile(accounts: AccountRecord[]): AccountsFileV1 {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    accounts,
  }
}

export function parseImportedFile(jsonText: string): AccountRecord[] {
  const parsed = JSON.parse(jsonText) as unknown

  // Accept either a raw array (legacy) or a versioned file object.
  if (Array.isArray(parsed)) {
    return parsed.map(sanitizeAccount).filter((x): x is AccountRecord => Boolean(x))
  }

  if (isObject(parsed) && parsed.version === 1 && Array.isArray(parsed.accounts)) {
    return parsed.accounts.map(sanitizeAccount).filter((x): x is AccountRecord => Boolean(x))
  }

  throw new Error('Invalid import file format.')
}

