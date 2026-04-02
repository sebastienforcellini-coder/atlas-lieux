'use client'
import type { View } from '@/types'

interface Props {
  current: View
  onNavigate: (v: View, opts?: Record<string, unknown>) => void
}

export function Logo() {
  return (
    <div className="sidebar-logo" style={{ padding: '16px 20px 14px', textAlign: 'center' }}>
      <img src="/favicon.svg" alt="Atlas" style={{ width: 48, height: 48, marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
      <div className="sidebar-logo-title serif">Atlas</div>
      <div className="sidebar-logo-line" />
      <div className="sidebar-logo-sub">RÉPERTOIRE DE LIEUX</div>
    </div>
  )
}

export default function Sidebar({ current, onNavigate }: Props) {
  return (
    <div className="sidebar" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Logo />

      <div className="nav-section">Navigation</div>
      <button className={`nav-item${current === 'home' ? ' on' : ''}`} onClick={() => onNavigate('home')}>
        <span className="nav-icon">🗺</span>Accueil
      </button>
      <button className={`nav-item${current === 'all' ? ' on' : ''}`} onClick={() => onNavigate('all')}>
        <span className="nav-icon">🔍</span>Tous les lieux
      </button>
      <button className={`nav-item${current === 'favoris' ? ' on' : ''}`} onClick={() => onNavigate('favoris' as View)}>
        <span className="nav-icon">★</span>Favoris
      </button>
      <button className={`nav-item${current === 'map' ? ' on' : ''}`} onClick={() => onNavigate('map')}>
        <span className="nav-icon">🗾</span>Carte
      </button>
      <button className={`nav-item${current === 'collections' ? ' on' : ''}`} onClick={() => onNavigate('collections' as View)}>
        <span className="nav-icon">📚</span>Collections
      </button>

      <div style={{ height: 1, background: 'var(--line)', margin: '12px 20px' }} />

      <div className="nav-section">Créer</div>
      <button
        className={`nav-item${current === 'form' ? ' on' : ''}`}
        onClick={() => onNavigate('form', { editLieu: null })}
        style={{ color: 'var(--accent)' }}
      >
        <span className="nav-icon">＋</span>Nouvelle fiche
      </button>
      <button
        className={`nav-item${current === 'geoform' ? ' on' : ''}`}
        onClick={() => onNavigate('geoform')}
      >
        <span className="nav-icon">📍</span>Depuis ma position
      </button>

      <div style={{ height: 1, background: 'var(--line)', margin: '12px 20px' }} />

      <div className="nav-section">Paramètres</div>
      <button
        className={`nav-item${current === 'categories' ? ' on' : ''}`}
        onClick={() => onNavigate('categories' as View)}
      >
        <span className="nav-icon">🏷</span>Catégories
      </button>

      <div style={{ flex: 1 }} />
    </div>
  )
}
