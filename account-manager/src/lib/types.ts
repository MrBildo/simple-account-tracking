export type AccountType =
  | 'Credit Card'
  | 'Service'
  | 'Streaming'
  | 'Loan'
  | 'Bank'
  | 'Investment'
  | 'Other'

export type ServiceFeeFrequency = 'Monthly' | 'Yearly'

export type EncryptedString = {
  alg: 'AES-GCM'
  kdf: 'PBKDF2'
  iterations: number
  saltB64: string
  ivB64: string
  cipherTextB64: string
}

export type AccountRecord = {
  id: string
  accountName: string
  type: AccountType
  accountNumber: string
  currentCardNumber?: string
  creditLimit?: number
  openDate?: string // ISO date (YYYY-MM-DD)
  interestRateApr?: number // percent (e.g. 24.99)
  serviceFeeAmount?: number
  serviceFeeFrequency?: ServiceFeeFrequency
  currentBalance: number
  actualLastMinPayment?: number
  loginUrl?: string
  username?: string
  passwordEnc?: EncryptedString
  notes?: string
  createdAt: string // ISO datetime
  updatedAt: string // ISO datetime
}

export type AccountsFileV1 = {
  version: 1
  exportedAt: string
  accounts: AccountRecord[]
}

