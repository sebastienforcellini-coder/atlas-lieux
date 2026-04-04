import { supabase } from '@/lib/supabase'
import type { Lieu } from '@/types'
import { CATEGORIES } from '@/types'
import type { Metadata } from 'next'

interface Props { params: { id: string } }

async function getLieu(id: string): Promise<Lieu | null> {
  const isNumeric = /^\d+$/.test(id)
  const { data } = isNumeric
    ? await supabase.from('lieux').select('*').eq('id', id).single()
    : await supabase.from('lieux').select('*').eq('slug', id).single()
  return data as Lieu | null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lieu = await getLieu(params.id)
  if (!lieu) return { title: 'Lieu introuvable — Atlas' }

  const title = lieu.name + ' — ' + lieu.city + ', ' + lieu.country
  const description = lieu.description
    ? lieu.description.slice(0, 160)
    : lieu.city + ', ' + lieu.country + (lieu.address ? ' · ' + lieu.address : '')
  const image = lieu.photos?.[0] || null

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: 'https://atlas-lieux.vercel.app/partager/' + (lieu.slug || lieu.id),
      siteName: 'Atlas — Répertoire de lieux',
      type: 'article',
      ...(image ? { images: [{ url: image, width: 1200, height: 630, alt: lieu.name }] } : {}),
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  }
}

function starsStr(n: number) { return '★'.repeat(n) + '☆'.repeat(5 - n) }
function fd(d: string | null) { return d ? new Date(d).toLocaleDateString('fr-FR') : '' }

export default async function SharePage({ params }: Props) {
  const lieu = await getLieu(params.id)

  if (!lieu) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F2ED', fontFamily: 'Georgia, serif' }}>
      <div style={{ textAlign: 'center', color: '#B0AA9E' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🗺</div>
        <div>Lieu introuvable</div>
      </div>
    </div>
  )

  const hasGps = !!(lieu.gps_lat && lieu.gps_lng)
  const phone = (lieu as any).phone
  const whatsapp = (lieu as any).whatsapp
  const website = (lieu as any).website
  const cat = CATEGORIES.find(c => c.id === lieu.categorie)

  return (
    <div style={{ minHeight: '100vh', background: '#F5F2ED', fontFamily: 'Georgia, serif' }}>

      {/* Bouton retour */}
      <div style={{ position: 'fixed', top: 12, left: 12, zIndex: 100 }}>
        <button onClick={() => window.history.back()}
          style={{ display: 'none' }} id="back-btn" />
        <script dangerouslySetInnerHTML={{ __html: `
          var btn = document.getElementById('back-btn');
          if (document.referrer) {
            btn.style.display = 'flex';
            btn.style.alignItems = 'center';
            btn.style.gap = '6px';
            btn.style.padding = '8px 14px';
            btn.style.background = 'rgba(255,255,255,0.9)';
            btn.style.border = '1px solid rgba(26,24,20,0.15)';
            btn.style.borderRadius = '20px';
            btn.style.fontSize = '13px';
            btn.style.cursor = 'pointer';
            btn.style.fontFamily = 'system-ui, sans-serif';
            btn.style.color = '#1A1814';
            btn.style.backdropFilter = 'blur(8px)';
            btn.innerHTML = '← Retour';
          }
        `}} />
      </div>

      {/* Photo header */}
      {lieu.photos?.length > 0 && (
        <div style={{ width: '100%', height: 280, overflow: 'hidden', position: 'relative' }}>
          <img src={lieu.photos[0]} alt={lieu.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(26,24,20,.7))' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px 20px' }}>
            <div style={{ fontSize: 9, letterSpacing: 2, color: 'rgba(255,255,255,.7)', textTransform: 'uppercase', marginBottom: 4 }}>Atlas — Répertoire de lieux</div>
            <div style={{ fontSize: '1.6rem', fontStyle: 'italic', fontWeight: 300, color: '#fff', lineHeight: 1.2 }}>{lieu.name}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.8)', marginTop: 4 }}>{lieu.city} · {lieu.country}</div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '1.5rem 1.25rem 4rem' }}>

        {/* Titre si pas de photo */}
        {!lieu.photos?.length && (
          <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(26,24,20,.1)' }}>
            <div style={{ fontSize: 9, letterSpacing: 2, color: '#B0AA9E', textTransform: 'uppercase', marginBottom: 8 }}>Atlas — Répertoire de lieux</div>
            <div style={{ fontSize: '1.8rem', fontStyle: 'italic', fontWeight: 300, lineHeight: 1.2, marginBottom: 4 }}>{lieu.name}</div>
            <div style={{ fontSize: 13, color: '#6B6560' }}>{lieu.city} · {lieu.country}</div>
          </div>
        )}

        {/* Badge catégorie */}
        {cat && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', fontSize: 12, borderRadius: 100, background: '#FDF8F2', border: '1px solid rgba(140,90,40,.2)', color: '#8C5A28', marginBottom: '1rem', fontFamily: 'system-ui, sans-serif' }}>
            {cat.icon} {cat.label}
          </div>
        )}

        {/* Note */}
        {lieu.rating > 0 && (
          <div style={{ color: '#e0952a', fontSize: 16, letterSpacing: 2, marginBottom: '1rem' }}>{starsStr(lieu.rating)}</div>
        )}

        {/* Infos clés */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', marginBottom: '1rem', border: '1px solid rgba(26,24,20,.08)' }}>
          {lieu.address && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', paddingBottom: 10, marginBottom: 10, borderBottom: '1px solid rgba(26,24,20,.06)' }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>🏠</span>
              <span style={{ fontSize: 13, color: '#1A1814', lineHeight: 1.5 }}>{lieu.address}</span>
            </div>
          )}
          {hasGps && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>📍</span>
              <span style={{ fontSize: 12, color: '#6B6560', fontFamily: 'monospace' }}>
                {parseFloat(lieu.gps_lat!).toFixed(5)}°, {parseFloat(lieu.gps_lng!).toFixed(5)}°
              </span>
            </div>
          )}
          {lieu.visit_date && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', paddingTop: 10, marginTop: 10, borderTop: '1px solid rgba(26,24,20,.06)' }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>🗓</span>
              <span style={{ fontSize: 13, color: '#6B6560' }}>Visité le {fd(lieu.visit_date)}</span>
            </div>
          )}
        </div>

        {/* Navigation GPS */}
        {hasGps && (
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontSize: 10, color: '#B0AA9E', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1.5 }}>Navigation</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { label: '🗺 Google Maps', href: `https://maps.google.com/?q=${lieu.gps_lat},${lieu.gps_lng}` },
                { label: '🍎 Plans', href: `https://maps.apple.com/?q=${lieu.gps_lat},${lieu.gps_lng}&ll=${lieu.gps_lat},${lieu.gps_lng}` },
                { label: '🚗 Waze', href: `https://waze.com/ul?ll=${lieu.gps_lat},${lieu.gps_lng}&navigate=yes` },
              ].map(({ label, href }) => (
                <a key={label} href={href} target="_blank" rel="noopener"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 16px', fontSize: 13, border: '1px solid rgba(26,24,20,.15)', borderRadius: 10, color: '#1A1814', textDecoration: 'none', background: '#fff', fontFamily: 'system-ui, sans-serif', fontWeight: 500 }}>
                  {label}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Contact */}
        {(phone || whatsapp || website) && (
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontSize: 10, color: '#B0AA9E', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1.5 }}>Contact</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {phone && (
                <a href={`tel:${phone}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 16px', fontSize: 13, border: '1px solid rgba(26,24,20,.15)', borderRadius: 10, color: '#1A1814', textDecoration: 'none', background: '#fff', fontFamily: 'system-ui, sans-serif' }}>
                  📞 {phone}
                </a>
              )}
              {whatsapp && (
                <a href={`https://wa.me/${whatsapp.replace(/[^0-9]/g,'')}`} target="_blank" rel="noopener"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 16px', fontSize: 13, border: '1px solid #25D366', borderRadius: 10, color: '#25D366', textDecoration: 'none', background: '#fff', fontFamily: 'system-ui, sans-serif' }}>
                  💬 WhatsApp
                </a>
              )}
              {website && (
                <a href={website} target="_blank" rel="noopener"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 16px', fontSize: 13, border: '1px solid rgba(26,24,20,.15)', borderRadius: 10, color: '#8C5A28', textDecoration: 'none', background: '#fff', fontFamily: 'system-ui, sans-serif' }}>
                  🌐 Site web
                </a>
              )}
            </div>
          </div>
        )}

        {/* Description */}
        {lieu.description && (
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontSize: 10, color: '#B0AA9E', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1.5 }}>À propos</div>
            <p style={{ fontSize: 14, lineHeight: 1.8, whiteSpace: 'pre-wrap', color: '#1A1814', margin: 0 }}>{lieu.description}</p>
          </div>
        )}

        {/* Tags */}
        {lieu.tags?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: '1.25rem' }}>
            {lieu.tags.map((t: string) => (
              <span key={t} style={{ padding: '4px 12px', fontSize: 11, border: '1px solid rgba(26,24,20,.15)', borderRadius: 100, color: '#6B6560', background: '#fff' }}>{t}</span>
            ))}
          </div>
        )}

        {/* Autres photos */}
        {lieu.photos?.length > 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 6, marginBottom: '1.25rem' }}>
            {lieu.photos.slice(1).map((u: string, i: number) => (
              <img key={i} src={u} alt={lieu.name} style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 8, display: 'block' }} />
            ))}
          </div>
        )}

        {/* Vidéos YouTube */}
        {lieu.videos?.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: '1.25rem' }}>
            {lieu.videos.map((u: string, i: number) => {
              const m = u.match(/(?:v=|youtu\.be\/)([^&?]+)/)
              return m ? (
                <iframe key={i} width="100%" height="220"
                  src={`https://www.youtube.com/embed/${m[1]}`}
                  frameBorder="0" allowFullScreen
                  style={{ borderRadius: 8, border: '1px solid rgba(26,24,20,.1)' }} />
              ) : null
            })}
          </div>
        )}

        {/* Footer */}
        <div style={{ borderTop: '1px solid rgba(26,24,20,.1)', paddingTop: '1rem', marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 11, color: '#B0AA9E', fontStyle: 'italic' }}>Partagé depuis Atlas</div>
          <a href="https://atlas-lieux.vercel.app" style={{ fontSize: 11, color: '#8C5A28', textDecoration: 'none' }}>atlas-lieux.vercel.app →</a>
        </div>

      </div>
    </div>
  )
}
