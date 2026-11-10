import { Outlet } from 'react-router-dom'
import SiteNav from './SiteNav.jsx'

// Shared layout for customer pages: the top nav, then the current page.
// <Outlet /> is where React Router puts the matching child route.
function CustomerLayout() {
  return (
    <>
      <SiteNav />
      <Outlet />
    </>
  )
}

export default CustomerLayout
