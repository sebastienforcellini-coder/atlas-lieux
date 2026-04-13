import { supabase } from '@/lib/supabase'
import type { Lieu } from '@/types'
import type { Metadata } from 'next'

interface Props {
  params: { slug: string }
  searchParams: { cat?: string }
}

async function getCollection(slug: string) {
  const { data } = await supabase.from('collections').select('*').eq('slug', slug).single()
  return data
}

async function getCategories() {
  const { data } = await supabase.from('categories').select('*').order('position', { ascending: true })
  return (data || []) as { id: string; label: string; icon: string }[]
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const col = await getCollection(params.slug)
  if (!col) return { title: 'Collection introuvable — Atlas' }
  return {
    title: col.title + ' — Atlas',
    description: col.description || col.title + ' · ' + col.lieux_ids.length + ' lieux',
    openGraph: {
      title: col.title + ' — Atlas',
      description: col.description || col.title + ' · ' + col.lieux_ids.length + ' lieux',
      siteName: 'Atlas — Répertoire de lieux',
      images: [{ url: 'https://atlas-lieux.vercel.app/og-logo.png', width: 512, height: 512, alt: 'Atlas' }],
    },
  }
}

function starsStr(n: number) { return '★'.repeat(n) + '☆'.repeat(5 - n) }

function LieuCard({ l, slug, cat }: { l: Lieu; slug: string; cat?: { id: string; label: string; icon: string } | null }) {
  const hasGps = !!(l.gps_lat && l.gps_lng)
  const phone = (l as any).phone
  const whatsapp = (l as any).whatsapp
  const email = (l as any).email
  const website = (l as any).website
  const instagram = (l as any).instagram
  const facebook = (l as any).facebook

  const btn = (extra?: React.CSSProperties): React.CSSProperties => ({
    padding: '6px 12px', fontSize: 12, border: '1px solid rgba(26,24,20,.15)',
    borderRadius: 8, color: '#1A1814', textDecoration: 'none',
    background: '#F5F2ED', fontFamily: 'system-ui, sans-serif', ...extra,
  })

  return (
    <div data-name={l.name} data-city={l.city} style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(26,24,20,.08)', boxShadow: '0 1px 8px rgba(26,24,20,.04)' }}>
      {l.photos?.[0] && <img src={l.photos[0]} alt={l.name} style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }} />}
      <div style={{ padding: '16px' }}>
        <div style={{ fontStyle: 'italic', fontSize: 20, fontWeight: 300, color: '#1A1814', marginBottom: 2 }}>{l.name}</div>
        <div style={{ fontSize: 12, color: '#B0AA9E', marginBottom: 8, letterSpacing: 0.5, fontFamily: 'system-ui, sans-serif' }}>{l.city} · {l.country}</div>

        {cat && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', fontSize: 11, borderRadius: 100, background: '#FDF8F2', border: '1px solid rgba(140,90,40,.2)', color: '#8C5A28', marginBottom: 8, fontFamily: 'system-ui, sans-serif' }}>
            {cat.icon} {cat.label}
          </div>
        )}

        {l.rating > 0 && <div style={{ color: '#e0952a', fontSize: 13, letterSpacing: 1, marginBottom: 10 }}>{starsStr(l.rating)}</div>}

        {l.address && (
          <div style={{ fontSize: 12, color: '#6B6560', marginBottom: 10, display: 'flex', gap: 6, alignItems: 'flex-start', fontFamily: 'system-ui, sans-serif' }}>
            <span>🏠</span><span>{l.address}</span>
          </div>
        )}

        {l.description && (
          <p style={{ fontSize: 13, lineHeight: 1.7, color: '#4A4540', margin: '0 0 12px' }}>{l.description}</p>
        )}

        {l.tags?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
            {l.tags.map((t: string) => <span key={t} style={{ padding: '2px 10px', fontSize: 11, border: '1px solid rgba(26,24,20,.1)', borderRadius: 100, color: '#8C7A6B', fontFamily: 'system-ui, sans-serif' }}>{t}</span>)}
          </div>
        )}

        {hasGps && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 9, color: '#B0AA9E', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1.5, fontFamily: 'system-ui, sans-serif' }}>Navigation</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
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

        {(phone || whatsapp || email || website || instagram || facebook) && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {phone && <a href={`tel:${phone}`} style={btn()}>📞 {phone}</a>}
            {whatsapp && <a href={`https://wa.me/${whatsapp.replace(/[^0-9]/g,'')}`} target="_blank" rel="noopener" style={btn({ border: '1px solid #25D366', color: '#25D366', background: '#fff' })}>💬 WhatsApp</a>}
            {email && <a href={`mailto:${email}`} style={btn()}>✉️ {email}</a>}
            {website && <a href={website} target="_blank" rel="noopener" style={btn({ color: '#8C5A28', background: '#FDF8F2', border: '1px solid rgba(140,90,40,.2)' })}>🌐 Site web</a>}
            {instagram && <a href={instagram.startsWith('http') ? instagram : `https://instagram.com/${instagram.replace('@','')}`} target="_blank" rel="noopener" style={btn({ border: '1px solid rgba(193,53,132,.3)', color: '#C13584', background: '#fff8fc' })}>📸 Instagram</a>}
            {facebook && <a href={facebook.startsWith('http') ? facebook : `https://facebook.com/${facebook}`} target="_blank" rel="noopener" style={btn({ border: '1px solid rgba(24,119,242,.3)', color: '#1877F2', background: '#f0f6ff' })}>👥 Facebook</a>}
          </div>
        )}

        <a href={`https://atlas-lieux.vercel.app/partager/${l.slug || l.id}?from=${slug}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: 12, border: '1px solid rgba(140,90,40,.3)', borderRadius: 8, color: '#8C5A28', textDecoration: 'none', background: '#FDF8F2', fontFamily: 'system-ui, sans-serif', marginTop: 4 }}>
          Voir la fiche complète →
        </a>
      </div>
    </div>
  )
}

export default async function CollectionPage({ params, searchParams }: Props) {
  const [col, categories] = await Promise.all([
    getCollection(params.slug),
    getCategories(),
  ])

  if (!col) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F2ED', fontFamily: 'Georgia, serif' }}>
      <div style={{ textAlign: 'center', color: '#B0AA9E' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
        <div>Collection introuvable</div>
      </div>
    </div>
  )

  const { data: lieuxData } = await supabase.from('lieux').select('*').in('id', col.lieux_ids)
  const allLieux = (lieuxData || []) as Lieu[]
  const activeCat = searchParams.cat || 'all'
  const lieux = activeCat === 'all' ? allLieux : allLieux.filter(l => l.categorie === activeCat)
  const catsPresentes = categories.filter(c => allLieux.some(l => l.categorie === c.id))
  const collectionUrl = `https://atlas-lieux.vercel.app/collection/${params.slug}`

  const catGroups = categories
    .map(c => ({ cat: c, items: lieux.filter(l => l.categorie === c.id) }))
    .filter(g => g.items.length > 0)

  const btnStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 14px', borderRadius: 100, border: `1px solid ${active ? '#8C5A28' : 'rgba(26,24,20,.2)'}`,
    background: active ? '#8C5A28' : '#fff', color: active ? '#fff' : '#6B6560',
    fontSize: 12, textDecoration: 'none', fontFamily: 'system-ui, sans-serif', display: 'inline-block',
  })

  return (
    <div style={{ minHeight: '100vh', background: '#F5F2ED', fontFamily: 'Georgia, serif' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '2rem 1.25rem 4rem' }}>

        {/* Header */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid rgba(26,24,20,.08)', boxShadow: '0 2px 16px rgba(26,24,20,.06)', overflow: 'hidden', marginBottom: 24 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(26,24,20,.08)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 15, color: '#1A1814', fontWeight: 300 }}>Atlas</span>
            <div style={{ width: 1, height: 14, background: 'rgba(26,24,20,.15)' }} />
            <span style={{ fontSize: 11, color: '#B0AA9E', fontFamily: 'system-ui, sans-serif', letterSpacing: 1 }}>Collection</span>
          </div>
          <div style={{ padding: '24px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 30, fontStyle: 'italic', fontWeight: 300, lineHeight: 1.2, color: '#1A1814', marginBottom: 8 }}>{col.title}</div>
            {col.description && <p style={{ fontSize: 14, color: '#6B6560', margin: '0 0 10px', lineHeight: 1.6 }}>{col.description}</p>}
            <div style={{ fontSize: 11, color: '#B0AA9E', fontFamily: 'system-ui, sans-serif' }}>{allLieux.length} lieu{allLieux.length !== 1 ? 'x' : ''}</div>
          </div>
        </div>

        {/* Filtres */}
        {catsPresentes.length > 1 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
            <a href={collectionUrl} style={btnStyle(activeCat === 'all')}>Tous</a>
            {catsPresentes.map(c => (
              <a key={c.id} href={`${collectionUrl}?cat=${c.id}`} style={btnStyle(activeCat === c.id)}>
                {c.icon} {c.label}
              </a>
            ))}
          </div>
        )}

        {/* Barre de recherche */}
        <div style={{ marginBottom: 20 }}>
          <input id="search-col" type="text" placeholder="🔍 Rechercher un lieu..."
            style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(26,24,20,.15)', fontSize: 14, fontFamily: 'system-ui, sans-serif', background: '#fff', boxSizing: 'border-box' }} />
          <script dangerouslySetInnerHTML={{ __html: `
            document.addEventListener('DOMContentLoaded', function() {
              var inp = document.getElementById('search-col');
              inp.addEventListener('input', function() {
                var q = inp.value.toLowerCase();
                document.querySelectorAll('[data-name]').forEach(function(card) {
                  var name = card.getAttribute('data-name').toLowerCase();
                  var city = card.getAttribute('data-city').toLowerCase();
                  card.style.display = (!q || name.includes(q) || city.includes(q)) ? 'block' : 'none';
                });
                document.querySelectorAll('[data-section]').forEach(function(section) {
                  var visible = Array.from(section.querySelectorAll('[data-name]')).some(function(c) { return c.style.display !== 'none'; });
                  section.style.display = visible ? 'block' : 'none';
                });
              });
            });
          `}} />
        </div>

        {/* Lieux */}
        {activeCat === 'all' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {catGroups.map(({ cat, items }) => (
              <div key={cat.id} data-section={cat.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid rgba(26,24,20,.1)' }}>
                  <span style={{ fontSize: 18 }}>{cat.icon}</span>
                  <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 18, fontWeight: 300, color: '#1A1814' }}>{cat.label}</span>
                  <span style={{ fontSize: 12, color: '#B0AA9E', fontFamily: 'system-ui, sans-serif' }}>({items.length})</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {items.map(l => {
                    const cat2 = categories.find(c => c.id === l.categorie) || null
                    return <LieuCard key={l.id} l={l} slug={params.slug} cat={cat2} />
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {lieux.map(l => {
              const cat2 = categories.find(c => c.id === l.categorie) || null
              return <LieuCard key={l.id} l={l} slug={params.slug} cat={cat2} />
            })}
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 13, color: '#B0AA9E', fontWeight: 300 }}>Partagé depuis Atlas</div>
        </div>
      </div>
    </div>
  )
}