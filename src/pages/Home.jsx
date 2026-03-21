import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePlaces } from '../hooks/usePlaces'
import { PlaceCard, CatCard, Loading, uniq, plural } from '../components/UI'

export default function Home() {
  const { places, loading } = usePlaces()
  const [tab, setTab] = useState('pays')

  if (loading) return <Loading />

  const countries = uniq(places.map(p => p.country)).sort()
  const cities = uniq(places.map(p => p.city)).length
  const recent = [...places].slice(0, 12)

  const allCities = uniq(places.map(p => p.city + '||' + p.country)).sort().map(s => {
    const [city, country] = s.split('||')
    return { city, country, count: places.filter(p => p.city === city && p.country === country).length }
  })

  return (
    <div className="page">
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-n">{places.length}</div>
          <div className="stat-l">Lieux</div>
        </div>
        <div className="stat-card">
          <div className="stat-n">{countries.length}</div>
          <div className="stat-l">Pays</div>
        </div>
        <div className="stat-card">
          <div className="stat-n">{cities}</div>
          <div className="stat-l">Villes</div>
        </div>
      </div>

      {places.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🌍</div>
          <div className="empty-title">Votre atlas est vide</div>
          <div className="empty-sub">
            <Link to="/lieu/nouveau" className="btn btn-accent" style={{ marginTop: '1rem' }}>
              + Créer votre premier lieu
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="tab-row">
            {[['pays', 'Pays'], ['villes', 'Villes'], ['recent', 'Récents']].map(([k, l]) => (
              <button key={k} className={`tab${tab === k ? ' on' : ''}`} onClick={() => setTab(k)}>{l}</button>
            ))}
          </div>

          {tab === 'pays' && (
            <div className="grid-cats">
              {countries.map(c => {
                const cnt = places.filter(p => p.country === c).length
                const vl = uniq(places.filter(p => p.country === c).map(p => p.city)).length
                return <CatCard key={c} title={c} sub={`${plural(cnt, 'lieu', 'lieux')} · ${plural(vl, 'ville')}`} to={`/pays/${encodeURIComponent(c)}`} />
              })}
            </div>
          )}

          {tab === 'villes' && (
            <div className="grid-cats">
              {allCities.map(({ city, country, count }) => (
                <CatCard key={city + country} title={city} sub={`${country} · ${plural(count, 'lieu', 'lieux')}`} to={`/pays/${encodeURIComponent(country)}/ville/${encodeURIComponent(city)}`} />
              ))}
            </div>
          )}

          {tab === 'recent' && (
            <div className="grid-cards">
              {recent.map(p => <PlaceCard key={p.id} place={p} />)}
            </div>
          )}
        </>
      )}
    </div>
  )
}
