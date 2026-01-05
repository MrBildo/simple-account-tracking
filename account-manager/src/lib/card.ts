export type CardBrand =
  | 'Visa'
  | 'Mastercard'
  | 'American Express'
  | 'Discover'
  | 'JCB'
  | 'Diners Club'
  | 'UnionPay'

export function normalizeCardDigits(input: string): string {
  return input.replace(/\D/g, '')
}

function luhnCheck(digits: string): boolean {
  let sum = 0
  let doubleIt = false
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let d = digits.charCodeAt(i) - 48
    if (d < 0 || d > 9) return false
    if (doubleIt) {
      d *= 2
      if (d > 9) d -= 9
    }
    sum += d
    doubleIt = !doubleIt
  }
  return sum % 10 === 0
}

function inRange(n: number, min: number, max: number): boolean {
  return n >= min && n <= max
}

export function detectCardBrand(digits: string): CardBrand | undefined {
  if (!digits) return undefined

  // Visa: 4
  if (digits.startsWith('4')) return 'Visa'

  // American Express: 34, 37
  if (digits.startsWith('34') || digits.startsWith('37')) return 'American Express'

  // Mastercard: 51-55, 2221-2720
  const p2 = Number(digits.slice(0, 2))
  const p4 = Number(digits.slice(0, 4))
  if (Number.isFinite(p2) && inRange(p2, 51, 55)) return 'Mastercard'
  if (Number.isFinite(p4) && inRange(p4, 2221, 2720)) return 'Mastercard'

  // Discover: 6011, 65, 644-649, 622126-622925
  const p3 = Number(digits.slice(0, 3))
  const p6 = Number(digits.slice(0, 6))
  if (digits.startsWith('6011') || digits.startsWith('65')) return 'Discover'
  if (Number.isFinite(p3) && inRange(p3, 644, 649)) return 'Discover'
  if (Number.isFinite(p6) && inRange(p6, 622126, 622925)) return 'Discover'

  // JCB: 3528-3589
  if (Number.isFinite(p4) && inRange(p4, 3528, 3589)) return 'JCB'

  // Diners Club: 300-305, 36, 38-39
  if (Number.isFinite(p3) && inRange(p3, 300, 305)) return 'Diners Club'
  if (digits.startsWith('36')) return 'Diners Club'
  if (Number.isFinite(p2) && inRange(p2, 38, 39)) return 'Diners Club'

  // UnionPay (rough): 62
  if (digits.startsWith('62')) return 'UnionPay'

  return undefined
}

function isValidLength(brand: CardBrand, len: number): boolean {
  switch (brand) {
    case 'American Express':
      return len === 15
    case 'Diners Club':
      return len === 14
    case 'Mastercard':
      return len === 16
    case 'Visa':
      return len === 13 || len === 16 || len === 19
    case 'Discover':
      return len === 16 || len === 19
    case 'JCB':
      return len === 16
    case 'UnionPay':
      return len >= 16 && len <= 19
    default:
      return false
  }
}

function formatByBrand(brand: CardBrand, digits: string): string {
  if (brand === 'American Express') {
    return [digits.slice(0, 4), digits.slice(4, 10), digits.slice(10, 15)].filter(Boolean).join(' ')
  }
  if (brand === 'Diners Club') {
    return [digits.slice(0, 4), digits.slice(4, 10), digits.slice(10, 14)].filter(Boolean).join(' ')
  }
  // Default: groups of 4
  const groups: string[] = []
  for (let i = 0; i < digits.length; i += 4) groups.push(digits.slice(i, i + 4))
  return groups.join(' ')
}

export function parseCreditCardNumber(input: string):
  | { digits: string; brand: CardBrand; formatted: string }
  | null {
  const digits = normalizeCardDigits(input)
  const brand = detectCardBrand(digits)
  if (!brand) return null
  if (!isValidLength(brand, digits.length)) return null

  // UnionPay cards may not be Luhn-valid; still, the request prefers "invalid => plain text".
  if (brand !== 'UnionPay' && !luhnCheck(digits)) return null

  return { digits, brand, formatted: formatByBrand(brand, digits) }
}

