// Formats a number as New Zealand dollars, e.g. 4.5 -> "$4.50"
const priceFormatter = new Intl.NumberFormat('en-NZ', {
  style: 'currency',
  currency: 'NZD',
  minimumFractionDigits: 2,
})

export function formatPrice(amount) {
  return priceFormatter.format(amount)
}
