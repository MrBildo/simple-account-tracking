import { addMonths, formatDistanceToNowStrict, isValid, parseISO } from 'date-fns'
import type { AccountRecord } from './types'

export function formatMoney(value: number): string {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value)
}

export function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`
}

export function openDateAgeLabel(openDate?: string): string | undefined {
  if (!openDate) return undefined
  const d = parseISO(openDate)
  if (!isValid(d)) return undefined
  return formatDistanceToNowStrict(d, { addSuffix: false })
}

export function estimateMinPayment(currentBalance: number): number {
  const est = currentBalance * 0.02
  return Math.max(25, Math.round(est * 100) / 100)
}

export type PayoffEstimate =
  | { kind: 'not_applicable' }
  | { kind: 'never'; reason: string }
  | { kind: 'estimate'; months: number; payoffDateIso: string; totalInterest: number }

export function payoffEstimate(params: {
  balance: number
  aprPercent?: number
  monthlyPayment: number
}): PayoffEstimate {
  const { balance, aprPercent, monthlyPayment } = params
  if (balance <= 0) return { kind: 'not_applicable' }

  const apr = (aprPercent ?? 0) / 100
  const r = apr / 12
  if (monthlyPayment <= 0) return { kind: 'never', reason: 'No payment set' }

  if (r <= 0) {
    const months = Math.ceil(balance / monthlyPayment)
    const payoffDate = addMonths(new Date(), months)
    return { kind: 'estimate', months, payoffDateIso: payoffDate.toISOString(), totalInterest: 0 }
  }

  const interestOnly = balance * r
  if (monthlyPayment <= interestOnly + 0.01) {
    return { kind: 'never', reason: 'Payment is too low (won’t reduce principal)' }
  }

  // Closed-form months for amortization:
  // n = -ln(1 - r*B/P) / ln(1+r)
  const n = -Math.log(1 - (r * balance) / monthlyPayment) / Math.log(1 + r)
  const months = Math.ceil(n)

  // Rough total interest by simulating (simple + stable).
  let remaining = balance
  let totalInterest = 0
  for (let i = 0; i < months && remaining > 0; i += 1) {
    const interest = remaining * r
    totalInterest += interest
    const principal = monthlyPayment - interest
    remaining = Math.max(0, remaining - principal)
  }

  const payoffDate = addMonths(new Date(), months)
  return {
    kind: 'estimate',
    months,
    payoffDateIso: payoffDate.toISOString(),
    totalInterest: Math.round(totalInterest * 100) / 100,
  }
}

export function effectiveMonthlyServiceFee(account: AccountRecord): number {
  if (!account.serviceFeeAmount || account.serviceFeeAmount <= 0) return 0
  const freq = account.serviceFeeFrequency ?? 'Monthly'
  return freq === 'Yearly' ? account.serviceFeeAmount / 12 : account.serviceFeeAmount
}

export function availableCredit(account: Pick<AccountRecord, 'creditLimit' | 'currentBalance'>): number | undefined {
  if (account.creditLimit == null) return undefined
  return account.creditLimit - (account.currentBalance || 0)
}

