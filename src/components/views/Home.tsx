'use client'
import type { Lieu, View } from '@/types'
import { useState } from 'react'
import { uniq, plural, Stars, TagsDisplay } from '@/components/UI'

interface Props {
  lieux: Lieu[]
  onNavigate: (v: View, opts?: Record<string, unknown>) => void
}

export default function Home({ lieux, onNavigate }: Props) {
  const [tab, setTab] = useState<'pays' | 'villes' | 'recent'>('pays')

  const countries = uniq(lieux.map(l => l.country)).sort()
  const cityCount  = uniq(lieux.map(l => l.city)).length
  const recent     = lieux.slice(0, 12)

  const allCities = uniq(lieux.map(l => l.city + '||' + l.country)).sort().map(s => {
    const [city, country] = s.split('||')
    return { city, country, count: lieux.filter(l => l.city === city && l.country === country).length }
  })

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="serif" style={{ fontSize: 22, fontStyle: 'italic', fontWeight: 300, marginBottom: 3 }}>Votre Atlas</div>
          <div style={{ fontSize: 12, color: 'var(--soft)' }}>Répertoire personnel de lieux</div>
        </div>
        <button className="btn btn-accent btn-sm" onClick={() => onNavigate('form', { editLieu: null })}>
          + Nouveau lieu
        </button>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card"><div className="stat-n">{lieux.length}</div><div className="stat-l">Lieux</div></div>
        <div className="stat-card"><div className="stat-n">{countries.length}</div><div className="stat-l">Pays</div></div>
        <div className="stat-card"><div className="stat-n">{cityCount}</div><div className="stat-l">Villes</div></div>
      </div>

      {lieux.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🌍</div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Votre atlas est vide</div>
          <div>Créez votre premier lieu pour commencer</div>
          <button className="btn btn-accent btn-sm" style={{ marginTop: 16 }} onClick={() => onNavigate('form', { editLieu: null })}>
            + Créer un lieu
          </button>
        </div>
      ) : (
        <>
          <div className="tab-row">
            {([['pays','Pays'],['villes','Villes'],['recent','Récents']] as const).map(([k,l]) => (
              <button key={k} className={`tab${tab === k ? ' on' : ''}`} onClick={() => setTab(k)}>{l}</button>
            ))}
          </div>

          {tab === 'pays' && (
            <div className="grid-cats">
              {countries.map(c => {
                const cnt = lieux.filter(l => l.country === c).length
                const vl  = uniq(lieux.filter(l => l.country === c).map(l => l.city)).length
                return (
                  <div key={c} className="cat-card" onClick={() => onNavigate('country', { country: c })}>
                    <div className="cat-name">{c}</div>
                    <div className="cat-sub">{plural(cnt,'lieu','lieux')} · {plural(vl,'ville')}</div>
                  </div>
                )
              })}
            </div>
          )}

          {tab === 'villes' && (
            <div className="grid-cats">
              {allCities.map(({ city, country, count }) => (
                <div key={city+country} className="cat-card" onClick={() => onNavigate('city', { country, city })}>
                  <div className="cat-name">{city}</div>
                  <div className="cat-sub">{country} · {plural(count,'lieu','lieux')}</div>
                </div>
              ))}
            </div>
          )}

          {tab === 'recent' && (
            <div className="grid-cards">
              {recent.map(l => <LieuCard key={l.id} lieu={l} onClick={() => onNavigate('detail', { lieuId: l.id })} />)}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export function LieuCard({ lieu, onClick }: { lieu: Lieu; onClick: () => void }) {
  return (
    <div className="place-card" onClick={onClick}>
      {lieu.photos?.[0]
        ? <img className="card-img" src={lieu.photos[0]} alt="" onError={e => (e.target as HTMLImageElement).style.opacity='.15'} />
        : <div className="card-img-ph">Pas de photo</div>}
      <div className="card-body">
        <div className="card-name">{lieu.name}</div>
        <div className="card-sub">{lieu.city} · {lieu.country}</div>
        {lieu.rating > 0 && <Stars value={lieu.rating} />}
        <TagsDisplay tags={lieu.tags} />
      </div>
    </div>
  )
}
