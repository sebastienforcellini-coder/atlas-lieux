import { useParams } from 'react-router-dom'
import { usePlaces } from '../hooks/usePlaces'
import { Breadcrumb, PlaceCard, Loading } from '../components/UI'

export default function City() {
  const { country, city } = useParams()
  const { places, loading } = usePlaces()
  const dc = decodeURIComponent(country)
  const dv = decodeURIComponent(city)

  if (loading) return <Loading />

  const filtered = places.filter(p => p.country === dc && p.city === dv)

  return (
    <div className="page">
      <Breadcrumb items={[
        { l: 'Accueil', to: '/' },
        { l: dc, to: `/pays/${encodeURIComponent(dc)}` },
        { l: dv },
      ]} />
      <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.25rem' }}>{dv}</h1>
      {filtered.length === 0
        ? <div className="empty-state"><div className="empty-sub">Aucun lieu dans cette ville.</div></div>
        : <div className="grid-cards">{filtered.map(p => <PlaceCard key={p.id} place={p} />)}</div>}
    </div>
  )
}
