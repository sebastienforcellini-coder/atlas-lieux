'use client'
import { useState } from 'react'
import type { Lieu, View } from '@/types'
import { CATEGORIES } from '@/types'
import { LieuCard } from './Home'

interface Props {
  lieux: Lieu[]
  onNavigate: (v: View, opts?: Record<string, unknown>) => void
}

export default function AllLieux({ lieux, onNavigate }: Props) {
  const [q, setQ] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [favoriOnly, setFavoriOnly] = useState(false)

  const filtered = lieux
    .filter(l => !catFilter || l.categorie === catFilter)
    .filter(l => !favoriOnly || l.favori)
    .filter(l => !q || [l.name, l.country, l.city, l.description ?? '', ...l.tags]
      .join(' ').toLowerCase().includes(q.toLowerCase()))

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="serif" style={{ fontSize: 22, fontStyle: 'italic', fontWeight: 300, marginBottom: 3 }}>Tous les lieux</div>
          <div style={{ fontSize: 12, color: 'var(--soft)' }}>{filtered.length} résultat{filtered.length !== 1 ? 's' : ''}</div>
        </div>
        <button
          className="btn btn-sm"
          onClick={() => setFavoriOnly(f => !f)}
          style={{ color: favoriOnly ? '#E0952A' : 'var(--mid)', borderColor: favoriOnly ? '#E0952A' : undefined }}
        >
          {favoriOnly ? '★ Favoris' : '☆ Favoris'}
        </button>
      </div>

      <input
        className="field-input"
        type="search"
        placeholder="Rechercher nom, ville, pays, tag…"
        value={q}
        onChange={e => setQ(e.target.value)}
        style={{ marginBottom: 10, borderRadius: 100, paddingLeft: 14 }}
        autoFocus
      />

      {/* Filtres catégories */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
        <button
          onClick={() => setCatFilter('')}
          style={{
            padding: '4px 12px', borderRadius: 100, fontSize: 11, cursor: 'pointer',
            border: '1px solid', borderColor: !catFilter ? 'var(--accent)' : 'var(--line2)',
            background: !catFilter ? 'var(--accent-bg)' : 'var(--bg)',
            color: !catFilter ? 'var(--accent)' : 'var(--mid)',
          }}
        >Tous</button>
        {CATEGORIES.map(c => (
          <button
            key={c.id}
            onClick={() => setCatFilter(catFilter === c.id ? '' : c.id)}
            style={{
              padding: '4px 12px', borderRadius: 100, fontSize: 11, cursor: 'pointer',
              border: '1px solid', borderColor: catFilter === c.id ? 'var(--accent)' : 'var(--line2)',
              background: catFilter === c.id ? 'var(--accent-bg)' : 'var(--bg)',
              color: catFilter === c.id ? 'var(--accent)' : 'var(--mid)',
              display: 'flex', alignItems: 'center', gap: 3,
            }}
          >{c.icon} {c.label}</button>
        ))}
      </div>

      {filtered.length === 0
        ? <div className="empty-state"><div>Aucun résultat{q ? ` pour "${q}"` : ''}</div></div>
        : <div className="grid-cards">
            {filtered.map(l => <LieuCard key={l.id} lieu={l} onClick={() => onNavigate('detail', { lieuId: l.id })} />)}
          </div>
      }
    </div>
  )
}
