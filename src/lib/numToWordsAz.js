// Azerbaijani number-to-words converter for invoice "Məbləğ söz ilə" line.
// Supports up to 999,999,999.99 — sufficient for invoicing.

const ONES = ['', 'bir', 'iki', 'üç', 'dörd', 'beş', 'altı', 'yeddi', 'səkkiz', 'doqquz']
const TENS = ['', 'on', 'iyirmi', 'otuz', 'qırx', 'əlli', 'altmış', 'yetmiş', 'səksən', 'doxsan']

function below1000(n) {
  if (n === 0) return ''
  const h = Math.floor(n / 100)
  const t = Math.floor((n % 100) / 10)
  const o = n % 10
  const parts = []
  if (h > 0) parts.push((h === 1 ? '' : ONES[h] + ' ') + 'yüz')
  if (t > 0) parts.push(TENS[t])
  if (o > 0) parts.push(ONES[o])
  return parts.join(' ').trim()
}

function intToWords(n) {
  if (n === 0) return 'sıfır'
  const billions = Math.floor(n / 1_000_000_000)
  const millions = Math.floor((n % 1_000_000_000) / 1_000_000)
  const thousands = Math.floor((n % 1_000_000) / 1000)
  const rest = n % 1000
  const parts = []
  if (billions > 0) parts.push(below1000(billions) + ' milyard')
  if (millions > 0) parts.push(below1000(millions) + ' milyon')
  if (thousands > 0) {
    // "min" — special case: "bir min" → just "min"
    parts.push(thousands === 1 ? 'min' : below1000(thousands) + ' min')
  }
  if (rest > 0) parts.push(below1000(rest))
  return parts.join(' ').trim()
}

export function amountToWordsAz(amount) {
  const n = Number(amount) || 0
  const manats = Math.floor(n)
  const qepiks = Math.round((n - manats) * 100)
  const manatPart = intToWords(manats) + ' manat'
  const qepikPart = qepiks > 0 ? ' ' + intToWords(qepiks) + ' qəpik' : ' 00 qəpik'
  // Capitalize first letter
  const full = manatPart + qepikPart
  return full.charAt(0).toUpperCase() + full.slice(1)
}
