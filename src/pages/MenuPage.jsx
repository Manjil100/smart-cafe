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
        supabase.from('categories').select('id, name').order('sort_order'),
        supabase
          .from('menu_items')
          .select('id, category_id, name, description, price, prep_time_minutes')
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

  // Pair each category with its items, and drop categories with nothing
  // available. Both the category links and the menu use this list,
  // so a link never points to a missing section.
  const sections = categories
    .map((category) => ({
      ...category,
      items: menuItems.filter((item) => item.category_id === category.id),
    }))
    .filter((section) => section.items.length > 0)

  return (
    <>
      <header className="site-header">
        <h1 className="site-name">Our menu</h1>
        <p className="site-tagline">Order here, we'll bring it out when it's ready</p>
      </header>

      {/* Sticky row of links that jump to each category */}
      {status === 'ready' && sections.length > 0 && (
        <nav className="category-nav" aria-label="Menu categories">
          <ul>
            {sections.map((section) => (
              <li key={section.id}>
                <a href={`#category-${section.id}`}>{section.name}</a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <main className="page menu-page">
        {status === 'loading' && <p className="message">Loading menu…</p>}

        {status === 'error' && (
          <p className="message error" role="alert">
            Sorry, we couldn't load the menu right now. Please refresh the page
            or try again in a moment.
          </p>
        )}

        {status === 'ready' && sections.length === 0 && (
          <p className="message">No menu items are available right now.</p>
        )}

        {status === 'ready' &&
          sections.map((section) => (
            <section
              key={section.id}
              id={`category-${section.id}`}
              className="menu-category"
              aria-labelledby={`category-heading-${section.id}`}
            >
              <h2 id={`category-heading-${section.id}`}>{section.name}</h2>

              <ul className="menu-list">
                {section.items.map((item) => {
                  // How many of this item are already in the cart (0 if none).
                  const inCart =
                    cartItems.find((line) => line.id === item.id)?.quantity ?? 0

                  return (
                    <li key={item.id} className="menu-item">
                      <div>
                        <h3>{item.name}</h3>
                        {item.description && (
                          <p className="menu-item-description">{item.description}</p>
                        )}
                        {item.prep_time_minutes != null && (
                          <p className="prep-time">
                            ≈ {item.prep_time_minutes} min
                          </p>
                        )}
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
          ))}

        <CartBar />
      </main>
    </>
  )
}

export default MenuPage
