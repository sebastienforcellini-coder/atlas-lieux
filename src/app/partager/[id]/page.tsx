import { supabase } from '@/lib/supabase'
import type { Lieu } from '@/types'

interface Props { params: { id: string } }

function starsStr(n: number) { return '★'.repeat(n) + '☆'.repeat(5-n) }
function fd(d: string | null) { return d ? new Date(d).toLocaleDateString('fr-FR') : '' }

export default async function SharePage({ params }: Props) {
  const { id } = params

  // Try slug first, then numeric id
  const isNumeric = /^\d+$/.test(id)
  const { data } = isNumeric
    ? await supabase.from('lieux').select('*').eq('id', id).single()
    : await supabase.from('lieux').select('*').eq('slug', id).single()

  const lieu = data as Lieu | null

  if (!lieu) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F2ED', fontFamily: 'Georgia, serif' }}>
      <div style={{ textAlign: 'center', color: '#B0AA9E' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🗺</div>
        <div>Lieu introuvable</div>
      </div>
    </div>
  )

  const gpsLink = lieu.gps_lat && lieu.gps_lng ? 'https://maps.google.com/?q=' + lieu.gps_lat + ',' + lieu.gps_lng : null

  return (
    <div style={{ minHeight: '100vh', background: '#F5F2ED', fontFamily: 'Georgia, serif' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '2rem 1.25rem 4rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: 9, letterSpacing: 2, color: '#B0AA9E', textTransform: 'uppercase', marginBottom: 8 }}>Atlas — Répertoire de lieux</div>
          <h1 style={{ fontSize: '1.8rem', fontStyle: 'italic', fontWeight: 300, lineHeight: 1.2, marginBottom: 6 }}>{lieu.name}</h1>
          <div style={{ fontSize: 13, color: '#6B6560', marginBottom: 8 }}>{lieu.city} · {lieu.country}</div>
          {lieu.rating > 0 && <div style={{ color: '#e0952a', fontSize: 14, letterSpacing: 1 }}>{starsStr(lieu.rating)}</div>}
        </div>

        {lieu.photos?.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: lieu.photos.length === 1 ? '1fr' : 'repeat(auto-fill,minmax(180px,1fr))', gap: 6, marginBottom: '1.5rem' }}>
            {lieu.photos.map((u: string, i: number) => (
              <img key={i} src={u} alt="" style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 8, display: 'block' }} />
            ))}
          </div>
        )}

        {lieu.description && (
          <p style={{ fontSize: 14, lineHeight: 1.8, whiteSpace: 'pre-wrap', marginBottom: '1.25rem', color: '#1A1814' }}>{lieu.description}</p>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: '1rem' }}>
          {gpsLink && (
            <a href={gpsLink} target="_blank" rel="noopener"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', fontSize: 11, border: '1px solid rgba(26,24,20,.18)', borderRadius: 100, color: '#6B6560', textDecoration: 'none', background: '#fff' }}>
              📍 {parseFloat(lieu.gps_lat!).toFixed(5)}°, {parseFloat(lieu.gps_lng!).toFixed(5)}° → Maps
            </a>
          )}
          {lieu.visit_date && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', fontSize: 11, border: '1px solid rgba(26,24,20,.18)', borderRadius: 100, color: '#6B6560', background: '#fff' }}>
              🗓 Visité le {fd(lieu.visit_date)}
            </span>
          )}
          {lieu.address && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', fontSize: 11, border: '1px solid rgba(26,24,20,.18)', borderRadius: 100, color: '#6B6560', background: '#fff' }}>
              🏠 {lieu.address}
            </span>
          )}
        </div>

        {lieu.tags?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: '1.25rem' }}>
            {lieu.tags.map((t: string) => (
              <span key={t} style={{ display: 'inline-flex', padding: '2px 9px', fontSize: 11, border: '1px solid rgba(26,24,20,.18)', borderRadius: 100, color: '#6B6560', background: '#F5F2ED' }}>{t}</span>
            ))}
          </div>
        )}

        {lieu.videos?.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: '1.25rem' }}>
            {lieu.videos.map((u: string, i: number) => {
              const m = u.match(/(?:v=|youtu\.be\/)([^&?]+)/)
              return m ? (
                <iframe key={i} width="100%" height="240" src={'https://www.youtube.com/embed/' + m[1]}
                  frameBorder="0" allowFullScreen style={{ borderRadius: 8, border: '1px solid rgba(26,24,20,.1)' }} />
              ) : null
            })}
          </div>
        )}

        <div style={{ borderTop: '1px solid rgba(26,24,20,.1)', paddingTop: '1rem', marginTop: '1.5rem', fontSize: 11, color: '#B0AA9E' }}>
          Partagé depuis Atlas — atlas-lieux.vercel.app
        </div>
      </div>
    </div>
  )
}
