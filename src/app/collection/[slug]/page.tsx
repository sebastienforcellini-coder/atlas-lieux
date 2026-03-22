import { supabase } from '@/lib/supabase'
import type { Lieu } from '@/types'
import type { Metadata } from 'next'

interface Props { params: { slug: string } }

async function getCollection(slug: string) {
  const { data } = await supabase.from('collections').select('*').eq('slug', slug).single()
  return data
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const col = await getCollection(params.slug)
  if (!col) return { title: 'Collection introuvable — Atlas' }
  return {
    title: col.title + ' — Atlas',
    description: col.description || col.title + ' · ' + col.lieux_ids.length + ' lieux',
    openGraph: { title: col.title + ' — Atlas', description: col.description || '', siteName: 'Atlas — Répertoire de lieux' },
  }
}

function fd(d: string | null) { return d ? new Date(d).toLocaleDateString('fr-FR') : '' }

export default async function CollectionPage({ params }: Props) {
  const col = await getCollection(params.slug)
  if (!col) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F2ED', fontFamily: 'Georgia, serif' }}>
      <div style={{ textAlign: 'center', color: '#B0AA9E' }}><div style={{ fontSize: 40, marginBottom: 12 }}>📚</div><div>Collection introuvable</div></div>
    </div>
  )

  const { data: lieuxData } = await supabase.from('lieux').select('*').in('id', col.lieux_ids)
  const lieux = (lieuxData || []) as Lieu[]

  return (
    <div style={{ minHeight: '100vh', background: '#F5F2ED', fontFamily: 'Georgia, serif' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '2rem 1.25rem 4rem' }}>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: 9, letterSpacing: 2, color: '#B0AA9E', textTransform: 'uppercase', marginBottom: 8 }}>Atlas — Collection</div>
          <h1 style={{ fontSize: '2rem', fontStyle: 'italic', fontWeight: 300, lineHeight: 1.2, marginBottom: 8 }}>{col.title}</h1>
          {col.description && <p style={{ fontSize: 14, color: '#6B6560', marginBottom: 8 }}>{col.description}</p>}
          <div style={{ fontSize: 11, color: '#B0AA9E' }}>{lieux.length} lieu{lieux.length !== 1 ? 'x' : ''} · Créée le {fd(col.created_at)}</div>
          <div style={{ height: 1, background: '#8C5A28', opacity: .3, margin: '16px auto', width: 60 }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {lieux.map((l: Lieu) => {
            const gpsLink = l.gps_lat && l.gps_lng ? `https://maps.google.com/?q=${l.gps_lat},${l.gps_lng}` : null
            return (
              <div key={l.id} style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(26,24,20,.08)' }}>
                {l.photos?.[0] && <img src={l.photos[0]} alt={l.name} style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }} />}
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ fontStyle: 'italic', fontSize: 18, fontWeight: 300, marginBottom: 2 }}>{l.name}</div>
                  <div style={{ fontSize: 12, color: '#6B6560', marginBottom: 8 }}>{l.city} · {l.country}</div>
                  {l.rating > 0 && <div style={{ color: '#e0952a', fontSize: 13, marginBottom: 6 }}>{'★'.repeat(l.rating)}{'☆'.repeat(5 - l.rating)}</div>}
                  {l.description && <p style={{ fontSize: 13, lineHeight: 1.7, color: '#1A1814', marginBottom: 8 }}>{l.description}</p>}
                  {gpsLink && <a href={gpsLink} target="_blank" rel="noopener" style={{ fontSize: 11, color: '#8C5A28', textDecoration: 'none' }}>📍 Voir sur Google Maps →</a>}
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ borderTop: '1px solid rgba(26,24,20,.1)', paddingTop: '1rem', marginTop: '2rem', display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 11, color: '#B0AA9E' }}>Partagé depuis Atlas</div>
          <a href="https://atlas-lieux.vercel.app" style={{ fontSize: 11, color: '#8C5A28', textDecoration: 'none' }}>atlas-lieux.vercel.app →</a>
        </div>
      </div>
    </div>
  )
}
