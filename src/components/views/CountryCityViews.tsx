'use client'
import type { Lieu, View } from '@/types'
import { uniq, plural } from '@/components/UI'
import { LieuCard } from './Home'

interface CountryProps {
  country: string
  lieux: Lieu[]
  onNavigate: (v: View, opts?: Record<string, unknown>) => void
}

export function CountryView({ country, lieux, onNavigate }: CountryProps) {
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
}

export function CityView({ country, city, lieux, onNavigate }: CityProps) {
  const filtered = lieux.filter(l => l.country === country && l.city === city)

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
      </div>
      {filtered.length === 0
        ? <div className="empty-state"><div>Aucun lieu dans cette ville.</div></div>
        : <div className="grid-cards">
            {filtered.map(l => <LieuCard key={l.id} lieu={l} onClick={() => onNavigate('detail', { lieuId: l.id })} />)}
          </div>
      }
    </div>
  )
}
