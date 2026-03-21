import { useParams } from 'react-router-dom'
import { usePlaces } from '../hooks/usePlaces'
import { Breadcrumb, CatCard, Loading, uniq, plural } from '../components/UI'

export default function Country() {
  const { country } = useParams()
  const { places, loading } = usePlaces()
  const decoded = decodeURIComponent(country)

  if (loading) return <Loading />

  const cities = uniq(places.filter(p => p.country === decoded).map(p => p.city)).sort()

  return (
    <div className="page">
      <Breadcrumb items={[{ l: 'Accueil', to: '/' }, { l: decoded }]} />
      <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.25rem' }}>{decoded}</h1>
      <div className="grid-cats">
        {cities.map(c => {
          const cnt = places.filter(p => p.country === decoded && p.city === c).length
          return (
            <CatCard
              key={c}
              title={c}
              sub={plural(cnt, 'lieu', 'lieux')}
              to={`/pays/${encodeURIComponent(decoded)}/ville/${encodeURIComponent(c)}`}
            />
          )
        })}
      </div>
    </div>
  )
}
