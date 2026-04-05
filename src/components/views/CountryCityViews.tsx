'use client'
import { useState } from 'react'
import type { Lieu, View } from '@/types'
import { CATEGORIES } from '@/types'
import { uniq, plural } from '@/components/UI'
import { LieuCard } from './Home'

interface CountryProps {
  country: string
  lieux: Lieu[]
  onNavigate: (v: View, opts?: Record<string, unknown>) => void
  onDelete: (id: number) => void
}

export function CountryView({ country, lieux, onNavigate, onDelete }: CountryProps) {
  const cities = uniq(lieux.filter(l => l.country === country).map(l => l.city)).sort()

  return (
    <div>
      <nav className="bc">
        <span className="bc-link" onClick={() => onNavigate('home')}>Accueil</span>
        <span className="bc-sep">›</span>
        <span className="bc-cur">{country}</span>
      </nav>
      <div className="page-header">
        <div className="serif" style={{ fontSize: 22, fontStyle: 'italic', fontWeight: 300 }}>{country}</div>
        <button
          className="btn btn-sm"
          onClick={() => onNavigate('form', { editLieu: { country } })}
          style={{ color: 'var(--accent)', borderColor: 'var(--accent)', flexShrink: 0 }}
        >
          ＋ Nouvelle fiche
        </button>
      </div>
      <div className="grid-cats">
        {cities.map(c => {
          const cnt = lieux.filter(l => l.country === country && l.city === c).length
          return (
            <div key={c} className="cat-card" onClick={() => onNavigate('city', { country, city: c })}>
              <div className="cat-name">{c}</div>
              <div className="cat-sub">{plural(cnt,'lieu','lieux')}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface CityProps {
  country: string
  city: string
  lieux: Lieu[]
  onNavigate: (v: View, opts?: Record<string, unknown>) => void
  onDelete: (id: number) => void
}

export function CityView({ country, city, lieux, onNavigate, onDelete }: CityProps) {
  const filtered = lieux.filter(l => l.country === country && l.city === city)
  const [activeCat, setActiveCat] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  // Catégories présentes dans cette ville uniquement
  const catsPresentes = CATEGORIES.filter(c => filtered.some(l => l.categorie === c.id))
  const displayed = filtered.filter(l => (!activeCat || l.categorie === activeCat) && (!search || l.name.toLowerCase().includes(search.toLowerCase()) || l.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()))))

  return (
    <div>
      <nav className="bc">
        <span className="bc-link" onClick={() => onNavigate('home')}>Accueil</span>
        <span className="bc-sep">›</span>
        <span className="bc-link" onClick={() => onNavigate('country', { country })}>{country}</span>
        <span className="bc-sep">›</span>
        <span className="bc-cur">{city}</span>
      </nav>
      <div className="page-header">
        <div className="serif" style={{ fontSize: 22, fontStyle: 'italic', fontWeight: 300 }}>{city}</div>
        <button
          className="btn btn-sm"
          onClick={() => onNavigate('form', { editLieu: { country, city } })}
          style={{ color: 'var(--accent)', borderColor: 'var(--accent)', flexShrink: 0 }}
        >
          ＋ Nouvelle fiche
        </button>
      </div>

      {/* Barre de recherche */}
      <div style={{ marginBottom: 12 }}>
        <input className="field-input" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Rechercher un lieu, un tag..." />
      </div>

      {/* Filtres par catégorie */}
      {catsPresentes.length > 1 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
          <button
            onClick={() => setActiveCat(null)}
            style={{ padding: '5px 12px', borderRadius: 100, border: '1px solid', fontSize: 12, cursor: 'pointer', borderColor: !activeCat ? 'var(--accent)' : 'var(--line2)', background: !activeCat ? 'var(--accent-bg)' : 'var(--bg)', color: !activeCat ? 'var(--accent)' : 'var(--mid)' }}>
            Tous
          </button>
          {catsPresentes.map(c => (
            <button key={c.id}
              onClick={() => setActiveCat(activeCat === c.id ? null : c.id)}
              style={{ padding: '5px 12px', borderRadius: 100, border: '1px solid', fontSize: 12, cursor: 'pointer', borderColor: activeCat === c.id ? 'var(--accent)' : 'var(--line2)', background: activeCat === c.id ? 'var(--accent-bg)' : 'var(--bg)', color: activeCat === c.id ? 'var(--accent)' : 'var(--mid)' }}>
              {c.icon} {c.label}
            </button>
          ))}
        </div>
      )}

      {displayed.length === 0
        ? <div className="empty-state"><div>Aucun lieu dans cette catégorie.</div></div>
        : <div className="grid-cards">
            {displayed.map(l => <LieuCard key={l.id} lieu={l} onClick={() => onNavigate('detail', { lieuId: l.id })} onDelete={onDelete} />)}
          </div>
      }
    </div>
  )
}