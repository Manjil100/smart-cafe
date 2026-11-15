import { Outlet } from 'react-router-dom'
import SiteNav from './SiteNav.jsx'
import SiteFooter from './SiteFooter.jsx'

// Shared layout for customer pages: the top nav, the current page, then the footer.
// <Outlet /> is where React Router puts the matching child route.
function CustomerLayout() {
  return (
    <>
      <SiteNav />
      <Outlet />
      <SiteFooter />
    </>
  )
}

export default CustomerLayout
