import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { formatPrice } from '../lib/formatPrice'
import { useCart } from '../context/cartContext'
import CartBar from '../components/CartBar.jsx'

function MenuPage() {
  const { items: cartItems, addItem } = useCart()

  const [categories, setCategories] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [status, setStatus] = useState('loading') // 'loading' | 'error' | 'ready'

  // Load the menu once, when the page first appears.
  useEffect(() => {
    // If the user leaves the page before loading finishes, we skip updating state.
    let ignore = false

    async function loadMenu() {
      // Run both queries at the same time.
      const [categoriesResult, itemsResult] = await Promise.all([
        supabase
          .from('categories')
          .select('id, name')
          .order('sort_order'),
        supabase
          .from('menu_items')
          .select('id, category_id, name, description, price')
          .eq('is_available', true)
          .order('name'),
      ])

      if (ignore) return

      // Supabase returns an error object instead of throwing, so we check it.
      if (categoriesResult.error || itemsResult.error) {
        console.error(categoriesResult.error || itemsResult.error)
        setStatus('error')
        return
      }

      setCategories(categoriesResult.data)
      setMenuItems(itemsResult.data)
      setStatus('ready')
    }

    loadMenu()

    return () => {
      ignore = true
    }
  }, [])

  return (
    <main className="menu-page">
      <header className="menu-header">
        <h1>Smart Café</h1>
        <p>Browse our menu</p>
      </header>

      {status === 'loading' && <p className="message">Loading menu…</p>}

      {status === 'error' && (
        <p className="message error">
          Sorry, we couldn't load the menu right now. Please refresh the page or
          try again in a moment.
        </p>
      )}

      {status === 'ready' &&
        categories.map((category) => {
          // Pick out the items that belong to this category.
          const itemsInCategory = menuItems.filter(
            (item) => item.category_id === category.id
          )

          // Don't show a heading for a category with nothing available.
          if (itemsInCategory.length === 0) return null

          return (
            <section key={category.id} className="menu-category">
              <h2>{category.name}</h2>
              <ul className="menu-list">
                {itemsInCategory.map((item) => {
                  // How many of this item are already in the cart (0 if none).
                  const inCart =
                    cartItems.find((line) => line.id === item.id)?.quantity ?? 0

                  return (
                    <li key={item.id} className="menu-item">
                      <div className="menu-item-text">
                        <h3>{item.name}</h3>
                        {item.description && <p>{item.description}</p>}
                      </div>
                      <div className="menu-item-actions">
                        <span className="menu-item-price">
                          {formatPrice(item.price)}
                        </span>
                        <button
                          type="button"
                          className="button"
                          onClick={() => addItem(item)}
                          aria-label={`Add ${item.name} to cart`}
                        >
                          {inCart > 0 ? `Add (${inCart})` : 'Add'}
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })}

      {status === 'ready' && menuItems.length === 0 && (
        <p className="message">No menu items are available right now.</p>
      )}

      <CartBar />
    </main>
  )
}

export default MenuPage
