import { supabase } from '@/lib/supabase'
import type { Lieu } from '@/types'
import { CATEGORIES } from '@/types'
import type { Metadata } from 'next'

interface Props {
  params: { id: string }
  searchParams: { from?: string }
}

async function getLieu(id: string) {
  const { data } = await supabase.from('lieux').select('*').eq('id', id).single()
  return data as Lieu | null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const l = await getLieu(params.id)
  if (!l) return { title: 'Lieu introuvable — Atlas' }
  return {
    title: l.name + ' — Atlas',
    description: l.description || l.name + ' · ' + l.city,
    openGraph: {
      title: l.name + ' — Atlas',
      description: l.description || l.name + ' · ' + l.city,
      siteName: 'Atlas — Répertoire de lieux',
      images: l.photos?.[0]
        ? [{ url: l.photos[0], width: 1200, height: 630, alt: l.name }]
        : [{ url: 'https://atlas-lieux.vercel.app/og-logo.png', width: 512, height: 512, alt: 'Atlas' }],
    },
  }
}

function starsStr(n: number) { return '★'.repeat(n) + '☆'.repeat(5 - n) }

export default async function PartagerPage({ params, searchParams }: Props) {
  const l = await getLieu(params.id)
  const fromSlug = searchParams.from

  if (!l) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F2ED', fontFamily: 'Georgia, serif' }}>
      <div style={{ textAlign: 'center', color: '#B0AA9E' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📍</div>
        <div>Lieu introuvable</div>
      </div>
    </div>
  )

  const hasGps = !!(l.gps_lat && l.gps_lng)
  const phone = (l as any).phone
  const whatsapp = (l as any).whatsapp
  const email = (l as any).email
  const website = (l as any).website
  const instagram = (l as any).instagram
  const facebook = (l as any).facebook
  const cat = CATEGORIES.find(c => c.id === l.categorie)

  return (
    <div style={{ minHeight: '100vh', background: '#F5F2ED', fontFamily: 'Georgia, serif' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '2rem 1.25rem 4rem' }}>

        {/* Bouton retour collection */}
        {fromSlug && (
          <a href={`https://atlas-lieux.vercel.app/collection/${fromSlug}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: 12, border: '1px solid rgba(26,24,20,.2)', borderRadius: 8, color: '#6B6560', textDecoration: 'none', background: '#fff', fontFamily: 'system-ui, sans-serif', marginBottom: 20 }}>
            ← Retour à la collection
          </a>
        )}

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(26,24,20,.1)' }}>
          <div style={{ fontSize: 9, letterSpacing: 2, color: '#B0AA9E', textTransform: 'uppercase', marginBottom: 10 }}>Atlas — Fiche lieu</div>
        </div>

        {/* Carte lieu */}
        <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(26,24,20,.08)' }}>
          {l.photos?.[0] && (
            <img src={l.photos[0]} alt={l.name} style={{ width: '100%', height: 260, objectFit: 'cover', display: 'block' }} />
          )}
          <div style={{ padding: '20px' }}>
            <div style={{ fontStyle: 'italic', fontSize: 24, fontWeight: 300, marginBottom: 4 }}>{l.name}</div>
            <div style={{ fontSize: 13, color: '#6B6560', marginBottom: 12 }}>{l.city} · {l.country}</div>

            {cat && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', fontSize: 11, borderRadius: 100, background: '#FDF8F2', border: '1px solid rgba(140,90,40,.2)', color: '#8C5A28', marginBottom: 12, fontFamily: 'system-ui, sans-serif' }}>
                {cat.icon} {cat.label}
              </div>
            )}

            {l.rating > 0 && (
              <div style={{ color: '#e0952a', fontSize: 14, letterSpacing: 1, marginBottom: 12 }}>{starsStr(l.rating)}</div>
            )}

            {l.address && (
              <div style={{ fontSize: 13, color: '#6B6560', marginBottom: 14, display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                <span>🏠</span><span>{l.address}</span>
              </div>
            )}

            {l.description && (
              <p style={{ fontSize: 14, lineHeight: 1.7, color: '#1A1814', margin: '0 0 16px' }}>{l.description}</p>
            )}

            {l.tags?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 16 }}>
                {l.tags.map((t: string) => (
                  <span key={t} style={{ padding: '2px 10px', fontSize: 11, border: '1px solid rgba(26,24,20,.12)', borderRadius: 100, color: '#6B6560', fontFamily: 'system-ui, sans-serif' }}>{t}</span>
                ))}
              </div>
            )}

            {/* Navigation GPS */}
            {hasGps && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, color: '#B0AA9E', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1.5, fontFamily: 'system-ui, sans-serif' }}>Navigation</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {[
                    { label: '🗺 Maps', href: `https://maps.google.com/?q=${l.gps_lat},${l.gps_lng}` },
                    { label: '🍎 Plans', href: `https://maps.apple.com/?q=${l.gps_lat},${l.gps_lng}&ll=${l.gps_lat},${l.gps_lng}` },
                    { label: '🚗 Waze', href: `https://waze.com/ul?ll=${l.gps_lat},${l.gps_lng}&navigate=yes` },
                  ].map(({ label, href }) => (
                    <a key={label} href={href} target="_blank" rel="noopener"
                      style={{ padding: '8px 14px', fontSize: 13, border: '1px solid rgba(26,24,20,.15)', borderRadius: 8, color: '#1A1814', textDecoration: 'none', background: '#F5F2ED', fontFamily: 'system-ui, sans-serif' }}>
                      {label}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Contact */}
            {(phone || whatsapp || email || website || instagram || facebook) && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, color: '#B0AA9E', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1.5, fontFamily: 'system-ui, sans-serif' }}>Contact</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {phone && (
                    <a href={`tel:${phone}`} style={{ padding: '8px 14px', fontSize: 13, border: '1px solid rgba(26,24,20,.15)', borderRadius: 8, color: '#1A1814', textDecoration: 'none', background: '#F5F2ED', fontFamily: 'system-ui, sans-serif' }}>📞 {phone}</a>
                  )}
                  {whatsapp && (
                    <a href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener"
                      style={{ padding: '8px 14px', fontSize: 13, border: '1px solid #25D366', borderRadius: 8, color: '#25D366', textDecoration: 'none', background: '#fff', fontFamily: 'system-ui, sans-serif' }}>💬 WhatsApp</a>
                  )}
                  {email && (
                    <a href={`mailto:${email}`} style={{ padding: '8px 14px', fontSize: 13, border: '1px solid rgba(26,24,20,.15)', borderRadius: 8, color: '#1A1814', textDecoration: 'none', background: '#F5F2ED', fontFamily: 'system-ui, sans-serif' }}>✉️ {email}</a>
                  )}
                  {website && (
                    <a href={website} target="_blank" rel="noopener"
                      style={{ padding: '8px 14px', fontSize: 13, border: '1px solid rgba(26,24,20,.15)', borderRadius: 8, color: '#8C5A28', textDecoration: 'none', background: '#FDF8F2', fontFamily: 'system-ui, sans-serif' }}>🌐 Site web</a>
                  )}
                  {instagram && (
                    <a href={instagram.startsWith('http') ? instagram : `https://instagram.com/${instagram.replace('@', '')}`} target="_blank" rel="noopener"
                      style={{ padding: '8px 14px', fontSize: 13, border: '1px solid rgba(193,53,132,.3)', borderRadius: 8, color: '#C13584', textDecoration: 'none', background: '#fff8fc', fontFamily: 'system-ui, sans-serif' }}>📸 Instagram</a>
                  )}
                  {facebook && (
                    <a href={facebook.startsWith('http') ? facebook : `https://facebook.com/${facebook}`} target="_blank" rel="noopener"
                      style={{ padding: '8px 14px', fontSize: 13, border: '1px solid rgba(24,119,242,.3)', borderRadius: 8, color: '#1877F2', textDecoration: 'none', background: '#f0f6ff', fontFamily: 'system-ui, sans-serif' }}>👥 Facebook</a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(26,24,20,.1)', paddingTop: '1rem', marginTop: '2rem' }}>
          <div style={{ fontSize: 11, color: '#B0AA9E', fontStyle: 'italic' }}>Partagé depuis Atlas</div>
        </div>
      </div>
    </div>
  )
}