import type { AccountRecord, AccountType, ServiceFeeFrequency } from './types'

export type AccountDraft = {
  accountName: string
  type: AccountType
  accountNumber: string
  currentCardNumber: string
  openDate: string
  interestRateApr: string
  serviceFeeAmount: string
  serviceFeeFrequency: ServiceFeeFrequency
  currentBalance: string
  actualLastMinPayment: string
  loginUrl: string
  username: string
  notes: string
}

export function buildDraftFromAccount(a: AccountRecord): AccountDraft {
  return {
    accountName: a.accountName ?? '',
    type: a.type ?? 'Credit Card',
    accountNumber: a.accountNumber ?? '',
    currentCardNumber: a.currentCardNumber ?? '',
    openDate: a.openDate ?? '',
    interestRateApr: a.interestRateApr?.toString() ?? '',
    serviceFeeAmount: a.serviceFeeAmount?.toString() ?? '',
    serviceFeeFrequency: a.serviceFeeFrequency ?? 'Monthly',
    currentBalance: (a.currentBalance ?? 0).toString(),
    actualLastMinPayment: a.actualLastMinPayment?.toString() ?? '',
    loginUrl: a.loginUrl ?? '',
    username: a.username ?? '',
    notes: a.notes ?? '',
  }
}

export function buildEmptyDraft(): AccountDraft {
  return {
    accountName: '',
    type: 'Credit Card',
    accountNumber: '',
    currentCardNumber: '',
    openDate: '',
    interestRateApr: '',
    serviceFeeAmount: '',
    serviceFeeFrequency: 'Monthly',
    currentBalance: '',
    actualLastMinPayment: '',
    loginUrl: '',
    username: '',
    notes: '',
  }
}

