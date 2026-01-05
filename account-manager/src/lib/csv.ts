import type { AccountRecord } from './types'

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

export function accountsToCsv(params: {
  accounts: AccountRecord[]
  decryptedPasswordsById?: Record<string, string | undefined>
}): string {
  const { accounts, decryptedPasswordsById } = params

  const headers = [
    'Account Name',
    'Type',
    'Account Number',
    'Current Card Number',
    'Account Open Date',
    'Interest Rate (APR %)',
    'Service Fee Amount',
    'Service Fee Frequency',
    'Current Balance',
    'Actual Last Min Payment',
    'Login URL',
    'Username',
    'Password',
    'Notes',
    'Created At',
    'Updated At',
  ]

  const lines: string[] = []
  lines.push(headers.map(csvEscape).join(','))

  for (const a of accounts) {
    const row = [
      a.accountName,
      a.type,
      a.accountNumber,
      a.currentCardNumber ?? '',
      a.openDate ?? '',
      a.interestRateApr?.toString() ?? '',
      a.serviceFeeAmount?.toString() ?? '',
      a.serviceFeeFrequency ?? '',
      a.currentBalance.toString(),
      a.actualLastMinPayment?.toString() ?? '',
      a.loginUrl ?? '',
      a.username ?? '',
      (decryptedPasswordsById?.[a.id] ?? '') || '',
      a.notes ?? '',
      a.createdAt,
      a.updatedAt,
    ]
    lines.push(row.map(csvEscape).join(','))
  }

  return lines.join('\n')
}

export function downloadTextFile(params: { contents: string; filename: string; mime: string }) {
  const blob = new Blob([params.contents], { type: params.mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = params.filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

