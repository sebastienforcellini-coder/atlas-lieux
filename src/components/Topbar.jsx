import { Link, useLocation, useNavigate } from 'react-router-dom'

export default function Topbar() {
  const loc = useLocation()
  const nav = useNavigate()
  const is = p => loc.pathname === p ? ' on' : ''

  return (
    <header className="topbar">
      <Link className="logo" to="/">
        <span className="logo-dot" />
        Atlas
      </Link>
      <nav className="topnav">
        <button className={`tnav-btn${is('/')}`} onClick={() => nav('/')}>Accueil</button>
        <button className={`tnav-btn${is('/lieux')}`} onClick={() => nav('/lieux')}>Tous les lieux</button>
      </nav>
      <Link className="btn btn-accent" to="/lieu/nouveau">+ Nouveau lieu</Link>
    </header>
  )
}
