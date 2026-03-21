'use client'
import type { View } from '@/types'

interface Props {
  current: View
  onNavigate: (v: View, opts?: Record<string, unknown>) => void
}

export function Logo() {
  return (
    <div className="sidebar-logo">
      <div className="sidebar-logo-title serif">Atlas</div>
      <div className="sidebar-logo-line" />
      <div className="sidebar-logo-sub">RÉPERTOIRE DE LIEUX</div>
    </div>
  )
}

export default function Sidebar({ current, onNavigate }: Props) {
  return (
    <div className="sidebar">
      <Logo />
      <div className="nav-section">Navigation</div>
      <button className={`nav-item${current === 'home' ? ' on' : ''}`} onClick={() => onNavigate('home')}>
        <span className="nav-icon">🗺</span>Accueil
      </button>
      <button className={`nav-item${current === 'all' ? ' on' : ''}`} onClick={() => onNavigate('all')}>
        <span className="nav-icon">🔍</span>Tous les lieux
      </button>
      <button className={`nav-item${current === 'map' ? ' on' : ''}`} onClick={() => onNavigate('map')}>
        <span className="nav-icon">🗾</span>Carte
      </button>

      <div className="nav-section" style={{ marginTop: 'auto', paddingTop: 16 }}>Ajouter</div>
      <button className="nav-item" onClick={() => onNavigate('form', { editLieu: null })}>
        <span className="nav-icon">✏️</span>Nouveau lieu
      </button>
      <button className="nav-item" onClick={() => onNavigate('geoform')}>
        <span className="nav-icon">📍</span>Depuis ma position
      </button>
    </div>
  )
}
