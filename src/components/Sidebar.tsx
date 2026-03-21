'use client'
import type { View } from '@/types'

interface Props {
  current: View
  onNavigate: (v: View, opts?: Record<string, unknown>) => void
  country?: string
  city?: string
}

const NAV = [
  { view: 'home'   as View, icon: '🗺', label: 'Accueil' },
  { view: 'all'    as View, icon: '🔍', label: 'Tous les lieux' },
]

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
      {NAV.map(({ view, icon, label }) => (
        <button
          key={view}
          className={`nav-item${current === view ? ' on' : ''}`}
          onClick={() => onNavigate(view)}
        >
          <span className="nav-icon">{icon}</span>
          {label}
        </button>
      ))}
      <div className="nav-section" style={{ marginTop: 'auto', paddingTop: 16 }}>Actions</div>
      <button
        className="nav-item"
        onClick={() => onNavigate('form', { editLieu: null })}
      >
        <span className="nav-icon">＋</span>
        Nouveau lieu
      </button>
    </div>
  )
}
