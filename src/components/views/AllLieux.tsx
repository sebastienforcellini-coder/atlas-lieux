'use client'
import { useState, useMemo } from 'react'
import type { Lieu, View } from '@/types'
import { CATEGORIES } from '@/types'
import { uniq } from '@/components/UI'
import { LieuCard } from './Home'

interface Props {
  lieux: Lieu[]
  onNavigate: (v: View, opts?: Record<string, unknown>) => void
  onDelete: (id: number) => void
}

export default function AllLieux({ lieux, onNavigate, onDelete }: Props) {
  const [q, setQ] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [favoriOnly, setFavoriOnly] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [minRating, setMinRating] = useState(0)
  const [tagFilter, setTagFilter] = useState('')
  const [countryFilter, setCountryFilter] = useState('')

  const allTags = useMemo(() => {
    const tags = lieux.flatMap(l => l.tags || [])
    return uniq(tags).sort()
  }, [lieux])

  const allCountries = useMemo(() => uniq(lieux.map(l => l.country)).sort(), [lieux])

  const activeFilterCount = [catFilter, favoriOnly, minRating > 0, tagFilter, countryFilter].filter(Boolean).length

  const filtered = lieux
    .filter(l => !catFilter || l.categorie === catFilter)
    .filter(l => !favoriOnly || l.favori)
    .filter(l => !minRating || (l.rating ?? 0) >= minRating)
    .filter(l => !tagFilter || l.tags?.includes(tagFilter))
    .filter(l => !countryFilter || l.country === countryFilter)
    .filter(l => !q || [l.name, l.country, l.city, l.description ?? '', ...l.tags]
      .join(' ').toLowerCase().includes(q.toLowerCase()))

  const resetFilters = () => {
    setCatFilter(''); setFavoriOnly(false); setMinRating(0); setTagFilter(''); setCountryFilter('')
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="serif" style={{ fontSize: 22, fontStyle: 'italic', fontWeight: 300, marginBottom: 3 }}>Tous les lieux</div>
          <div style={{ fontSize: 12, color: 'var(--soft)' }}>{filtered.length} résultat{filtered.length !== 1 ? 's' : ''}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-sm btn-accent" onClick={() => onNavigate('form', { editLieu: null })}>+ Nouvelle fiche</button>
          <button
            className="btn btn-sm"
            onClick={() => setFavoriOnly(f => !f)}
            style={{ color: favoriOnly ? '#E0952A' : 'var(--mid)', borderColor: favoriOnly ? '#E0952A' : undefined }}
          >
            {favoriOnly ? '★' : '☆'} Favoris
          </button>
          <button
            className="btn btn-sm"
            onClick={() => setShowFilters(f => !f)}
            style={{ color: activeFilterCount > 0 ? 'var(--accent)' : 'var(--mid)', borderColor: activeFilterCount > 0 ? 'var(--accent)' : undefined }}
          >
            ⚙ Filtres{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </button>
        </div>
      </div>

      <input
        className="field-input"
        type="search"
        placeholder="Rechercher nom, ville, pays, tag…"
        value={q}
        onChange={e => setQ(e.target.value)}
        style={{ marginBottom: 10, borderRadius: 100, paddingLeft: 14 }}
      />

      {/* Filtres catégories */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: showFilters ? 12 : 16 }}>
        <button onClick={() => setCatFilter('')} style={{ padding: '4px 12px', borderRadius: 100, fontSize: 11, cursor: 'pointer', border: '1px solid', borderColor: !catFilter ? 'var(--accent)' : 'var(--line2)', background: !catFilter ? 'var(--accent-bg)' : 'var(--bg)', color: !catFilter ? 'var(--accent)' : 'var(--mid)' }}>Tous</button>
        {CATEGORIES.map(c => (
          <button key={c.id} onClick={() => setCatFilter(catFilter === c.id ? '' : c.id)} style={{ padding: '4px 12px', borderRadius: 100, fontSize: 11, cursor: 'pointer', border: '1px solid', borderColor: catFilter === c.id ? 'var(--accent)' : 'var(--line2)', background: catFilter === c.id ? 'var(--accent-bg)' : 'var(--bg)', color: catFilter === c.id ? 'var(--accent)' : 'var(--mid)', display: 'flex', alignItems: 'center', gap: 3 }}>
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      {/* Filtres avancés */}
      {showFilters && (
        <div style={{ background: 'var(--bg2)', borderRadius: 10, padding: '14px 16px', marginBottom: 16, border: '1px solid var(--line)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

            {/* Note minimum */}
            <div>
              <div className="label">Note minimum</div>
              <div style={{ display: 'flex', gap: 4, paddingTop: 6 }}>
                {[0,1,2,3,4,5].map(n => (
                  <button key={n} type="button" onClick={() => setMinRating(n)}
                    style={{ padding: '4px 8px', borderRadius: 6, fontSize: 11, cursor: 'pointer', border: '1px solid', borderColor: minRating === n ? 'var(--accent)' : 'var(--line2)', background: minRating === n ? 'var(--accent-bg)' : 'var(--bg)', color: minRating === n ? 'var(--accent)' : 'var(--mid)' }}>
                    {n === 0 ? 'Tous' : '★'.repeat(n)}
                  </button>
                ))}
              </div>
            </div>

            {/* Pays */}
            <div>
              <div className="label">Pays</div>
              <select
                className="field-input"
                value={countryFilter}
                onChange={e => setCountryFilter(e.target.value)}
                style={{ marginTop: 4 }}
              >
                <option value="">Tous les pays</option>
                {allCountries.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Tags */}
            <div style={{ gridColumn: '1/-1' }}>
              <div className="label">Tag</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, paddingTop: 6 }}>
                <button onClick={() => setTagFilter('')} style={{ padding: '3px 10px', borderRadius: 100, fontSize: 11, cursor: 'pointer', border: '1px solid', borderColor: !tagFilter ? 'var(--accent)' : 'var(--line2)', background: !tagFilter ? 'var(--accent-bg)' : 'var(--bg)', color: !tagFilter ? 'var(--accent)' : 'var(--mid)' }}>Tous</button>
                {allTags.map(t => (
                  <button key={t} onClick={() => setTagFilter(tagFilter === t ? '' : t)} style={{ padding: '3px 10px', borderRadius: 100, fontSize: 11, cursor: 'pointer', border: '1px solid', borderColor: tagFilter === t ? 'var(--accent)' : 'var(--line2)', background: tagFilter === t ? 'var(--accent-bg)' : 'var(--bg)', color: tagFilter === t ? 'var(--accent)' : 'var(--mid)' }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {activeFilterCount > 0 && (
            <button onClick={resetFilters} style={{ marginTop: 12, fontSize: 11, color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}>
              ✕ Réinitialiser les filtres
            </button>
          )}
        </div>
      )}

      {filtered.length === 0
        ? <div className="empty-state"><div>Aucun résultat{q ? ` pour "${q}"` : ''}</div></div>
        : <div className="grid-cards">
            {filtered.map(l => <LieuCard key={l.id} lieu={l} onClick={() => onNavigate('detail', { lieuId: l.id })} onDelete={onDelete} />)}
          </div>
      }
    </div>
  )
}
