// Timezone-safe date utilities.
// Supabase returns DATE columns as 'YYYY-MM-DD' strings. Passing them to
// `new Date(str)` parses as UTC midnight, which can shift to the previous day
// in negative-UTC timezones — breaking month/year filters at month boundaries.
// `parseLocalDate` constructs the date in the user's local timezone instead.

export function parseLocalDate(value) {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value !== 'string') return null
  const [datePart] = value.split('T')
  const [y, m, d] = datePart.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

export function getLocalYear(value) {
  const d = parseLocalDate(value)
  return d ? d.getFullYear() : null
}

export function getLocalMonth(value) {
  // 1-indexed month (1 = January)
  const d = parseLocalDate(value)
  return d ? d.getMonth() + 1 : null
}

export function formatAz(value, opts = { day: 'numeric', month: 'short', year: 'numeric' }) {
  const d = parseLocalDate(value)
  return d ? d.toLocaleDateString('az-AZ', opts) : ''
}

// Days between two YYYY-MM-DD strings, ignoring time
export function daysBetween(fromValue, toValue) {
  const a = parseLocalDate(fromValue)
  const b = parseLocalDate(toValue)
  if (!a || !b) return null
  const ms = b.setHours(0,0,0,0) - a.setHours(0,0,0,0)
  return Math.round(ms / 86400000)
}
