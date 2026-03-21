import { useState } from 'react'
import { usePlaces } from '../hooks/usePlaces'
import { PlaceCard, Loading } from '../components/UI'

export default function AllPlaces() {
  const { places, loading } = usePlaces()
  const [q, setQ] = useState('')

  if (loading) return <Loading />

  const filtered = q
    ? places.filter(p => [p.name, p.country, p.city, p.description || '', ...(p.tags || [])].join(' ').toLowerCase().includes(q.toLowerCase()))
    : places

  return (
    <div className="page">
      <input
        className="search-bar"
        type="search"
        placeholder="Rechercher nom, ville, pays, tag…"
        value={q}
        onChange={e => setQ(e.target.value)}
        autoFocus
      />
      <p style={{ fontSize: '.82rem', fontFamily: 'var(--font-sans)', color: 'var(--text3)', marginBottom: '1rem' }}>
        {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
      </p>
      {filtered.length === 0
        ? <div className="empty-state"><div className="empty-sub">Aucun résultat pour "{q}"</div></div>
        : <div className="grid-cards">{filtered.map(p => <PlaceCard key={p.id} place={p} />)}</div>}
    </div>
  )
}
