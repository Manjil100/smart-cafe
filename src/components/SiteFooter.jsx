// Footer on every customer page: where the café is and a link back to its website.
function SiteFooter() {
  return (
    <footer className="site-footer">
      <p className="site-footer-name">Hey Jude</p>
      <p>2 Jude Place, Brookfield, Tauranga. Open every day, 7am to 3pm.</p>
      <p>
        <a href="https://cafe-n2mj.vercel.app">Back to the café website</a>
      </p>
      <p className="small">Student prototype, COMP.6207</p>
    </footer>
  )
}

export default SiteFooter
