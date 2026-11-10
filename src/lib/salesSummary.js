// Works out the sales summary from a list of completed orders.
// (For this prototype we calculate in the browser from the loaded rows.)
export function summariseSales(orders) {
  const orderCount = orders.length
  const totalSales = orders.reduce((sum, order) => sum + Number(order.total), 0)
  const averageOrder = orderCount > 0 ? totalSales / orderCount : 0

  // Add up the quantity sold for each item name.
  const quantityByName = {}
  for (const order of orders) {
    for (const item of order.order_items) {
      const name = item.menu_items?.name ?? 'Unknown item'
      quantityByName[name] = (quantityByName[name] ?? 0) + item.quantity
    }
  }

  // Turn { "Flat White": 12, ... } into a list, biggest first, keep 5.
  const topItems = Object.entries(quantityByName)
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5)

  return { orderCount, totalSales, averageOrder, topItems }
}

// The start time for each period, or null for "All time".
export function periodStart(period) {
  const now = new Date()
  if (period === 'today') {
    // Midnight this morning, in the café's (browser's) local time.
    return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  }
  if (period === 'week') {
    return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  }
  return null
}
