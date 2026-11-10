import { Link, NavLink } from 'react-router-dom'

// Top bar on every customer page: café name (links home) and a menu link.
// NavLink adds aria-current="page" when you're on that page.
function SiteNav() {
  return (
    <header className="site-nav">
      <div className="site-nav-inner">
        <Link to="/" className="site-brand">
          Mount <span>Brew</span> Café
        </Link>
        <nav aria-label="Main">
          <NavLink to="/menu" className="site-nav-link">
            Menu
          </NavLink>
        </nav>
      </div>
    </header>
  )
}

export default SiteNav
