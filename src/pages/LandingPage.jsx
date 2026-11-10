import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { formatPrice } from '../lib/formatPrice'
import { useCart } from '../context/cartContext'
import CartBar from '../components/CartBar.jsx'
import SiteFooter from '../components/SiteFooter.jsx'
import KitchenWait from '../components/KitchenWait.jsx'

// Gallery images (converted to WebP, max 1200px wide, under 200 KB).
// Importing them lets Vite add them to the build and fail if one is missing.
import coffeeImg from '../assets/gallery/coffee.webp'
import pastriesImg from '../assets/gallery/croll.webp'
import lambImg from '../assets/gallery/lamb.webp'
import espressoImg from '../assets/gallery/cupma.webp'
import booksImg from '../assets/gallery/book.webp'

// width/height are the real image sizes, so the browser can reserve space
// before the image loads (stops the page jumping around).
const GALLERY = [
  {
    src: coffeeImg,
    width: 1122,
    height: 1402,
    alt: 'A steaming latte in a ceramic mug, topped with a toasted marshmallow',
  },
  {
    src: pastriesImg,
    width: 1200,
    height: 898,
    alt: 'Iced pastries dusted with icing sugar and edible flowers, next to a latte',
  },
  {
    src: lambImg,
    width: 1200,
    height: 1237,
    alt: 'Sliced seared lamb with rocket, feta and tomato relish on a grey plate',
  },
  {
    src: espressoImg,
    width: 1190,
    height: 1500,
    alt: 'Espresso pouring from the coffee machine into a cup',
  },
  {
    src: booksImg,
    width: 1200,
    height: 1249,
    alt: 'A wooden bookshelf with a book swap sign, beside a framed painting',
  },
]

const PICKS_PER_DAY = 3

// Choose a few items for today. The choice depends only on the date,
// so everyone sees the same picks and they change each day.
function pickForToday(items, count) {
  if (items.length <= count) return items
  const dayNumber = Math.floor(Date.now() / 86400000) // days since 1 Jan 1970
  const start = (dayNumber * count) % items.length
  return Array.from({ length: count }, (_, i) => items[(start + i) % items.length])
}

function LandingPage() {
  const { items: cartItems, addItem } = useCart()
  const [picks, setPicks] = useState([])
  const [picksStatus, setPicksStatus] = useState('loading') // 'loading' | 'error' | 'ready'

  // Load available items once, then keep today's three.
  useEffect(() => {
    let ignore = false

    async function loadPicks() {
      const { data, error } = await supabase
        .from('menu_items')
        .select('id, name, description, price')
        .eq('is_available', true)
        .order('id') // fixed order, so the daily pick is stable

      if (ignore) return
      if (error) {
        console.error(error)
        setPicksStatus('error')
        return
      }
      setPicks(pickForToday(data, PICKS_PER_DAY))
      setPicksStatus('ready')
    }

    loadPicks()
    return () => {
      ignore = true
    }
  }, [])

  return (
    <div className="landing">
      {/* Hero */}
      <section className="hero" aria-labelledby="hero-title">
        <h1 id="hero-title" className="hero-title">
          Mount <em>Brew</em> Café
        </h1>
        <p className="hero-line">
          Small-batch coffee and fresh, simple food at the foot of Mauao.
        </p>
        <div className="hero-buttons">
          <Link to="/menu" className="button button-large-inline">
            Order now
          </Link>
          <a href="#todays-picks" className="button button-secondary button-large-inline">
            See today's picks
          </a>
        </div>
        <KitchenWait />
      </section>

      {/* Our story */}
      <section className="landing-section" aria-labelledby="story-title">
        <h2 id="story-title" className="landing-heading">
          Our story
        </h2>
        <p className="landing-text">
          Mount Brew is a small, fictional café on Marine Parade, a few steps
          from Main Beach. We open early for the walkers coming down from Mauao
          and the swimmers heading home, with coffee made slowly and carefully,
          and food baked fresh each morning. The menu is short on purpose: a
          handful of things we make well, ordered from your phone and brought
          to you when it's ready.
        </p>
      </section>

      {/* Today's picks */}
      <section
        id="todays-picks"
        className="landing-section"
        aria-labelledby="picks-title"
      >
        <h2 id="picks-title" className="landing-heading">
          Today's picks
        </h2>

        {picksStatus === 'loading' && <p className="message">Loading today's picks…</p>}
        {picksStatus === 'error' && (
          <p className="message error" role="alert">
            Sorry, we couldn't load today's picks. The full menu may still work.
          </p>
        )}

        {picksStatus === 'ready' && (
          <ul className="picks">
            {picks.map((item) => {
              const inCart = cartItems.find((line) => line.id === item.id)?.quantity ?? 0
              return (
                <li key={item.id} className="pick-card">
                  <h3>{item.name}</h3>
                  {item.description && <p className="muted">{item.description}</p>}
                  <div className="pick-card-bottom">
                    <span className="pick-price">{formatPrice(item.price)}</span>
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
        )}

        <p className="center">
          <Link to="/menu" className="button button-secondary">
            See the full menu
          </Link>
        </p>
      </section>

      {/* Gallery */}
      <section className="landing-section" aria-labelledby="gallery-title">
        <h2 id="gallery-title" className="landing-heading">
          A look inside
        </h2>
        <ul className="gallery">
          {GALLERY.map((image) => (
            <li key={image.src}>
              <img
                src={image.src}
                alt={image.alt}
                width={image.width}
                height={image.height}
                loading="lazy"
                decoding="async"
              />
            </li>
          ))}
        </ul>
      </section>

      {/* Visit us */}
      <section className="landing-section" aria-labelledby="visit-title">
        <h2 id="visit-title" className="landing-heading">
          Visit us
        </h2>
        <div className="visit">
          <div>
            <h3>Where</h3>
            <address>
              88 Marine Parade
              <br />
              Mount Maunganui, Tauranga
            </address>
            <p className="muted small-text">Fictional address for this student prototype.</p>
          </div>
          <div>
            <h3>When</h3>
            <p>Open every day, 7am to 3pm</p>
          </div>
        </div>
      </section>

      <SiteFooter />
      <CartBar />
    </div>
  )
}

export default LandingPage
