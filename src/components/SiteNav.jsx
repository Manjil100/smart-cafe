import { NavLink } from 'react-router-dom'

// The café's main website. The brand and "Café website" links go back there.
const CAFE_SITE = 'https://cafe-n2mj.vercel.app'

// Top bar on every customer page: prototype note, café name and links.
// NavLink adds aria-current="page" when you're on that page.
function SiteNav() {
  return (
    <>
      <p className="proto-note">
        Student prototype for Hey Jude Cafe. Orders placed here don’t reach the
        café yet.
      </p>
      <header className="site-nav">
        <div className="site-nav-inner">
          <a href={CAFE_SITE} className="site-brand">
            Hey Jude
          </a>
          <nav aria-label="Main">
            <NavLink to="/menu" className="site-nav-link">
              Order online
            </NavLink>
            <a href={CAFE_SITE} className="site-nav-link">
              Café website
            </a>
          </nav>
        </div>
      </header>
    </>
  )
}

export default SiteNav
