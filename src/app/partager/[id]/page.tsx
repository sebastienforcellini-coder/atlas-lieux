import { supabase } from '@/lib/supabase'
import type { Lieu } from '@/types'
import type { Metadata } from 'next'

export const revalidate = 0

interface Props {
  params: { id: string }
  searchParams: { from?: string; v?: string }
}

async function getLieu(id: string) {
  const { data: bySlug } = await supabase.from('lieux').select('*').eq('slug', id).single()
  if (bySlug) return bySlug as Lieu
  const { data: byId } = await supabase.from('lieux').select('*').eq('id', id).single()
  return byId as Lieu | null
}

async function getCategorie(identifiant: string) {
  const { data } = await supabase
    .from('catégories')
    .select('*')
    .eq('identifiant', identifiant)
    .single()
  if (!data) return null
  return { id: data.identifiant, label: data['étiquette'], icon: data['icône'] }
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

const btn = (extra?: React.CSSProperties): React.CSSProperties => ({
  padding: '8px 14px', fontSize: 13, border: '1px solid rgba(26,24,20,.15)',
  borderRadius: 8, color: '#1A1814', textDecoration: 'none',
  background: '#F5F2ED', fontFamily: 'system-ui, sans-serif', display: 'inline-block', ...extra,
})

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
  const cat = l.categorie ? await getCategorie(l.categorie) : null
  const photos = l.photos ?? []
  const hasMultiplePhotos = photos.length > 1

  return (
    <div style={{ minHeight: '100vh', background: '#F5F2ED', fontFamily: 'Georgia, serif' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '2rem 1.25rem 4rem' }}>

        <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(26,24,20,.08)', boxShadow: '0 2px 16px rgba(26,24,20,.06)' }}>

          {/* Header Atlas | Catégorie */}
          <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(26,24,20,.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 15, color: '#1A1814', fontWeight: 300 }}>Atlas</span>
              <div style={{ width: 1, height: 14, background: 'rgba(26,24,20,.15)' }} />
              {cat ? (
                <span style={{ fontSize: 11, color: '#8C5A28', background: '#FDF8F2', padding: '2px 10px', borderRadius: 100, border: '1px solid rgba(140,90,40,.2)', fontFamily: 'system-ui, sans-serif' }}>
                  {cat.icon} {cat.label}
                </span>
              ) : (
                <span style={{ fontSize: 11, color: '#B0AA9E', fontFamily: 'system-ui, sans-serif', letterSpacing: 1 }}>Lieu</span>
              )}
            </div>
            {fromSlug && (
              <a href={`https://atlas-lieux.vercel.app/collection/${fromSlug}`}
                style={{ fontSize: 11, color: '#6B6560', textDecoration: 'none', fontFamily: 'system-ui, sans-serif' }}>
                ← Collection
              </a>
            )}
          </div>

          {/* Photo principale */}
          {photos[0] && (
            <img src={photos[0]} alt={l.name} style={{ width: '100%', height: 240, objectFit: 'cover', display: 'block' }} />
          )}

          {/* Galerie photos supplémentaires */}
          {hasMultiplePhotos && (
            <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(26,24,20,.06)', background: '#FDFCFA' }}>
              <div style={{ fontSize: 9, letterSpacing: 2, color: '#B0AA9E', textTransform: 'uppercase', marginBottom: 8, fontFamily: 'system-ui, sans-serif' }}>
                Photos ({photos.length})
              </div>
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                {photos.slice(1).map((p: string, i: number) => (
                  <img
                    key={i}
                    src={p}
                    alt={`${l.name} ${i + 2}`}
                    style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 8, flexShrink: 0, display: 'block', border: '1px solid rgba(26,24,20,.08)' }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Infos principales */}
          <div style={{ padding: '20px 20px 0' }}>
            <div style={{ fontStyle: 'italic', fontSize: 26, fontWeight: 300, color: '#1A1814', lineHeight: 1.2, marginBottom: 4 }}>{l.name}</div>
            <div style={{ fontSize: 12, color: '#B0AA9E', letterSpacing: 0.5, marginBottom: l.rating > 0 ? 8 : 16, fontFamily: 'system-ui, sans-serif' }}>
              {l.city} · {l.country}
            </div>
            {l.rating > 0 && (
              <div style={{ color: '#e0952a', fontSize: 14, letterSpacing: 2, marginBottom: 16 }}>{starsStr(l.rating)}</div>
            )}
          </div>

          {/* Description */}
          {l.description && (
            <div style={{ padding: '0 20px 16px' }}>
              <p style={{ fontSize: 13, lineHeight: 1.75, color: '#4A4540', margin: 0 }}>{l.description}</p>
            </div>
          )}

          {/* Adresse */}
          {l.address && (
            <div style={{ padding: '12px 20px', background: '#FDFCFA', borderTop: '1px solid rgba(26,24,20,.06)', borderBottom: '1px solid rgba(26,24,20,.06)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 14 }}>🏠</span>
              <span style={{ fontSize: 12, color: '#6B6560', lineHeight: 1.5, fontFamily: 'system-ui, sans-serif' }}>{l.address}</span>
            </div>
          )}

          {/* Date de visite */}
          {l.visit_date && (
            <div style={{ padding: '12px 20px', background: '#FDFCFA', borderBottom: '1px solid rgba(26,24,20,.06)', display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 14 }}>📅</span>
              <span style={{ fontSize: 12, color: '#6B6560', fontFamily: 'system-ui, sans-serif' }}>
                Visité le {new Date(l.visit_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
          )}

          {/* Tags */}
          {l.tags?.length > 0 && (
            <div style={{ padding: '12px 20px', display: 'flex', flexWrap: 'wrap', gap: 5, borderBottom: '1px solid rgba(26,24,20,.06)' }}>
              {l.tags.map((t: string) => (
                <span key={t} style={{ padding: '3px 10px', fontSize: 11, border: '1px solid rgba(26,24,20,.1)', borderRadius: 100, color: '#8C7A6B', fontFamily: 'system-ui, sans-serif' }}>{t}</span>
              ))}
            </div>
          )}

          {/* Commentaires / Notes */}
          {l.comments && l.comments.length > 0 && (
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(26,24,20,.06)' }}>
              <div style={{ fontSize: 9, letterSpacing: 2, color: '#B0AA9E', textTransform: 'uppercase', marginBottom: 10, fontFamily: 'system-ui, sans-serif' }}>Notes</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {l.comments.map((c: any, i: number) => (
                  <div key={i} style={{ background: '#FDFCFA', borderRadius: 8, padding: '10px 12px', border: '1px solid rgba(26,24,20,.06)' }}>
                    <p style={{ fontSize: 13, color: '#4A4540', lineHeight: 1.6, margin: '0 0 4px' }}>{c.text}</p>
                    {c.date && <div style={{ fontSize: 10, color: '#B0AA9E', fontFamily: 'system-ui, sans-serif' }}>{new Date(c.date).toLocaleDateString('fr-FR')}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation GPS */}
          {hasGps && (
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(26,24,20,.06)' }}>
              <div style={{ fontSize: 9, letterSpacing: 2, color: '#B0AA9E', textTransform: 'uppercase', marginBottom: 10, fontFamily: 'system-ui, sans-serif' }}>Navigation</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  { label: '🗺 Maps', href: `https://maps.google.com/?q=${l.gps_lat},${l.gps_lng}` },
                  { label: '🍎 Plans', href: `https://maps.apple.com/?q=${l.gps_lat},${l.gps_lng}&ll=${l.gps_lat},${l.gps_lng}` },
                  { label: '🚗 Waze', href: `https://waze.com/ul?ll=${l.gps_lat},${l.gps_lng}&navigate=yes` },
                ].map(({ label, href }) => (
                  <a key={label} href={href} target="_blank" rel="noopener" style={btn()}>{label}</a>
                ))}
              </div>
            </div>
          )}

          {/* Contact */}
          {(phone || whatsapp || email || website || instagram || facebook) && (
            <div style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: 9, letterSpacing: 2, color: '#B0AA9E', textTransform: 'uppercase', marginBottom: 10, fontFamily: 'system-ui, sans-serif' }}>Contact</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {phone && <a href={`tel:${phone}`} style={btn()}>📞 {phone}</a>}
                {whatsapp && <a href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener" style={btn({ border: '1px solid #25D366', color: '#25D366', background: '#fff' })}>💬 WhatsApp</a>}
                {email && <a href={`mailto:${email}`} style={btn()}>✉️ {email}</a>}
                {website && <a href={website} target="_blank" rel="noopener" style={btn({ color: '#8C5A28', background: '#FDF8F2', border: '1px solid rgba(140,90,40,.2)' })}>🌐 Site web</a>}
                {instagram && <a href={instagram.startsWith('http') ? instagram : `https://instagram.com/${instagram.replace('@', '')}`} target="_blank" rel="noopener" style={btn({ border: '1px solid rgba(193,53,132,.3)', color: '#C13584', background: '#fff8fc' })}>📸 Instagram</a>}
                {facebook && <a href={facebook.startsWith('http') ? facebook : `https://facebook.com/${facebook}`} target="_blank" rel="noopener" style={btn({ border: '1px solid rgba(24,119,242,.3)', color: '#1877F2', background: '#f0f6ff' })}>👥 Facebook</a>}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 13, color: '#B0AA9E', fontWeight: 300 }}>Partagé depuis Atlas</div>
        </div>

      </div>
    </div>
  )
}
