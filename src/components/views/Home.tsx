'use client'
import type { Lieu, View } from '@/types'
import { useState } from 'react'
import { uniq, plural, Stars, TagsDisplay } from '@/components/UI'
import { getCat, CATEGORIES } from '@/types'

interface Props {
  lieux: Lieu[]
  onNavigate: (v: View, opts?: Record<string, unknown>) => void
  onDelete: (id: number) => void
}

export default function Home({ lieux, onNavigate, onDelete }: Props) {
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
      {/* Hero logo — visible mobile et desktop */}
      <div style={{ textAlign: 'center', padding: '2rem 0 1.5rem', borderBottom: '1px solid var(--line)', marginBottom: '1.5rem' }}>
        <img src="/favicon.svg" alt="Atlas" style={{ width: 72, height: 72, margin: '0 auto 12px', display: 'block' }} />
        <div className="serif" style={{ fontSize: 32, fontStyle: 'italic', fontWeight: 300, color: 'var(--text)', lineHeight: 1 }}>Atlas</div>
        <div style={{ height: 1, background: 'var(--accent)', opacity: 0.4, margin: '6px auto', width: 40 }} />
        <div style={{ fontSize: 9, color: 'var(--soft)', letterSpacing: 3, fontFamily: 'Georgia, serif' }}>RÉPERTOIRE DE LIEUX</div>
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

export function LieuCard({ lieu, onClick, onDelete }: { lieu: Lieu; onClick: () => void; onDelete?: (id: number) => void }) {
  const cat = getCat(lieu.categorie)
  return (
    <div className="place-card" onClick={onClick}>
      <div style={{ position: 'relative' }}>
        {lieu.photos?.[0]
          ? <img className="card-img" src={lieu.photos[0]} alt="" onError={e => (e.target as HTMLImageElement).style.opacity='.15'} />
          : <div className="card-img-ph">{cat.icon}</div>}
        <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(253,252,250,.92)', borderRadius: 100, padding: '2px 8px', fontSize: 11, color: 'var(--mid)', display: 'flex', alignItems: 'center', gap: 3 }}>
          {cat.icon} {cat.label}
        </div>
        {lieu.favori && (
          <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(253,252,250,.92)', borderRadius: 100, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#E0952A' }}>
            ★
          </div>
        )}
        {onDelete && (
          <button
            onClick={e => { e.stopPropagation(); if (confirm('Supprimer "' + lieu.name + '" ?')) onDelete(lieu.id) }}
            style={{
              position: 'absolute', bottom: 8, right: 8,
              background: 'rgba(253,252,250,.92)', border: 'none',
              borderRadius: 100, width: 26, height: 26,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, color: '#C0392B', cursor: 'pointer',
              fontWeight: 600, lineHeight: 1,
            }}
            title="Supprimer"
          >✕</button>
        )}
      </div>
      <div className="card-body">
        <div className="card-name">{lieu.name}</div>
        <div className="card-sub">{lieu.city} · {lieu.country}</div>
        {lieu.rating > 0 && <Stars value={lieu.rating} />}
        <TagsDisplay tags={lieu.tags} />
      </div>
    </div>
  )
}
