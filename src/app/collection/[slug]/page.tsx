import { supabase } from '@/lib/supabase'
import type { Lieu } from '@/types'
import { CATEGORIES } from '@/types'
import type { Metadata } from 'next'

interface Props {
  params: { slug: string }
  searchParams: { cat?: string }
}

async function getCollection(slug: string) {
  const { data } = await supabase.from('collections').select('*').eq('slug', slug).single()
  return data
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const col = await getCollection(params.slug)
  if (!col) return { title: 'Collection introuvable — Atlas' }
  const { data: lieuxData } = await supabase.from('lieux').select('photos').in('id', col.lieux_ids)
  const firstPhoto = (lieuxData || []).find((l: any) => l.photos?.[0])?.photos?.[0] || null
  return {
    title: col.title + ' — Atlas',
    description: col.description || col.title + ' · ' + col.lieux_ids.length + ' lieux',
    openGraph: { title: col.title + ' — Atlas', description: col.description || '', siteName: 'Atlas — Répertoire de lieux', ...(firstPhoto ? { images: [{ url: firstPhoto, width: 1200, height: 630, alt: col.title }] } : {}) },
  }
}

function starsStr(n: number) { return '★'.repeat(n) + '☆'.repeat(5 - n) }

export default async function CollectionPage({ params, searchParams }: Props) {
  const col = await getCollection(params.slug)
  if (!col) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F2ED', fontFamily: 'Georgia, serif' }}>
      <div style={{ textAlign: 'center', color: '#B0AA9E' }}><div style={{ fontSize: 40, marginBottom: 12 }}>📚</div><div>Collection introuvable</div></div>
    </div>
  )

  const { data: lieuxData } = await supabase.from('lieux').select('*').in('id', col.lieux_ids)
  const allLieux = (lieuxData || []) as Lieu[]
  const activeCat = searchParams.cat || 'all'
  const lieux = activeCat === 'all' ? allLieux : allLieux.filter(l => l.categorie === activeCat)
  const catsPresentes = CATEGORIES.filter(c => allLieux.some(l => l.categorie === c.id))
  const collectionUrl = `https://atlas-lieux.vercel.app/collection/${params.slug}`

  const btnStyle = (active: boolean) => ({
    padding: '6px 14px', borderRadius: 100 as const, border: `1px solid ${active ? '#8C5A28' : 'rgba(26,24,20,.2)'}`,
    background: active ? '#8C5A28' : '#fff', color: active ? '#fff' : '#6B6560',
    fontSize: 12, textDecoration: 'none', fontFamily: 'system-ui, sans-serif', display: 'inline-block',
  })

  return (
    <div style={{ minHeight: '100vh', background: '#F5F2ED', fontFamily: 'Georgia, serif' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '2rem 1.25rem 4rem' }}>

        <div style={{ textAlign: 'center', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(26,24,20,.1)' }}>
          <div style={{ fontSize: 9, letterSpacing: 2, color: '#B0AA9E', textTransform: 'uppercase', marginBottom: 10 }}>Atlas — Collection</div>
          <div style={{ fontSize: '2rem', fontStyle: 'italic', fontWeight: 300, lineHeight: 1.2, marginBottom: 8 }}>{col.title}</div>
          {col.description && <p style={{ fontSize: 14, color: '#6B6560', margin: '0 0 8px' }}>{col.description}</p>}
          <div style={{ fontSize: 11, color: '#B0AA9E' }}>{allLieux.length} lieu{allLieux.length !== 1 ? 'x' : ''}</div>
        </div>

        {/* Filtres par catégorie — liens URL côté serveur */}
        {catsPresentes.length > 1 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
            <a href={collectionUrl} style={btnStyle(activeCat === 'all')}>Tous</a>
            {catsPresentes.map(c => (
              <a key={c.id} href={`${collectionUrl}?cat=${c.id}`} style={btnStyle(activeCat === c.id)}>
                {c.icon} {c.label}
              </a>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {lieux.map((l: Lieu) => {
            const hasGps = !!(l.gps_lat && l.gps_lng)
            const phone = (l as any).phone
            const whatsapp = (l as any).whatsapp
            const cat = CATEGORIES.find(c => c.id === l.categorie)
            return (
              <div key={l.id} style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(26,24,20,.08)' }}>
                {l.photos?.[0] && <img src={l.photos[0]} alt={l.name} style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }} />}
                <div style={{ padding: '16px' }}>
                  <div style={{ fontStyle: 'italic', fontSize: 20, fontWeight: 300, marginBottom: 2 }}>{l.name}</div>
                  <div style={{ fontSize: 12, color: '#6B6560', marginBottom: 8 }}>{l.city} · {l.country}</div>
                  {cat && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', fontSize: 11, borderRadius: 100, background: '#FDF8F2', border: '1px solid rgba(140,90,40,.2)', color: '#8C5A28', marginBottom: 8, fontFamily: 'system-ui, sans-serif' }}>
                      {cat.icon} {cat.label}
                    </div>
                  )}
                  {l.rating > 0 && <div style={{ color: '#e0952a', fontSize: 13, letterSpacing: 1, marginBottom: 10 }}>{starsStr(l.rating)}</div>}
                  {l.address && (
                    <div style={{ fontSize: 12, color: '#6B6560', marginBottom: 10, display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                      <span>🏠</span><span>{l.address}</span>
                    </div>
                  )}
                  {l.description && <p style={{ fontSize: 13, lineHeight: 1.7, color: '#1A1814', margin: '0 0 12px' }}>{l.description}</p>}
                  {l.tags?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
                      {l.tags.map((t: string) => <span key={t} style={{ padding: '2px 10px', fontSize: 11, border: '1px solid rgba(26,24,20,.12)', borderRadius: 100, color: '#6B6560' }}>{t}</span>)}
                    </div>
                  )}
                  {hasGps && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 10, color: '#B0AA9E', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1.5 }}>Navigation</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {[
                          { label: '🗺 Maps', href: `https://maps.google.com/?q=${l.gps_lat},${l.gps_lng}` },
                          { label: '🍎 Plans', href: `https://maps.apple.com/?q=${l.gps_lat},${l.gps_lng}&ll=${l.gps_lat},${l.gps_lng}` },
                          { label: '🚗 Waze', href: `https://waze.com/ul?ll=${l.gps_lat},${l.gps_lng}&navigate=yes` },
                        ].map(({ label, href }) => (
                          <a key={label} href={href} target="_blank" rel="noopener"
                            style={{ padding: '6px 12px', fontSize: 12, border: '1px solid rgba(26,24,20,.15)', borderRadius: 8, color: '#1A1814', textDecoration: 'none', background: '#F5F2ED', fontFamily: 'system-ui, sans-serif' }}>
                            {label}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  {(phone || whatsapp) && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                      {phone && <a href={`tel:${phone}`} style={{ padding: '6px 12px', fontSize: 12, border: '1px solid rgba(26,24,20,.15)', borderRadius: 8, color: '#1A1814', textDecoration: 'none', background: '#F5F2ED', fontFamily: 'system-ui, sans-serif' }}>📞 {phone}</a>}
                      {whatsapp && <a href={`https://wa.me/${whatsapp.replace(/[^0-9]/g,'')}`} target="_blank" rel="noopener" style={{ padding: '6px 12px', fontSize: 12, border: '1px solid #25D366', borderRadius: 8, color: '#25D366', textDecoration: 'none', background: '#fff', fontFamily: 'system-ui, sans-serif' }}>💬 WhatsApp</a>}
                    </div>
                  )}
                  <a href={collectionUrl}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: 12, border: '1px solid rgba(140,90,40,.3)', borderRadius: 8, color: '#8C5A28', textDecoration: 'none', background: '#FDF8F2', fontFamily: 'system-ui, sans-serif', marginTop: 4 }}>
                    ← Retour à la collection
                  </a>
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ borderTop: '1px solid rgba(26,24,20,.1)', paddingTop: '1rem', marginTop: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 11, color: '#B0AA9E', fontStyle: 'italic' }}>Partagé depuis Atlas</div>
          <a href="https://atlas-lieux.vercel.app" style={{ fontSize: 11, color: '#8C5A28', textDecoration: 'none' }}>atlas-lieux.vercel.app →</a>
        </div>
      </div>
    </div>
  )
}
