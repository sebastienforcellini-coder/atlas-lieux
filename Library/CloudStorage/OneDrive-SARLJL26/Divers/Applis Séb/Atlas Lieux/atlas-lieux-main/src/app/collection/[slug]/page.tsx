import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import React from 'react'
import type { Lieu } from '@/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Collection {
  id: string
  title: string
  description?: string
  slug: string
  lieux_ids: string[]
  cover_url?: string | null
}

interface Props { params: { slug: string } }

async function getCollection(slug: string): Promise<Collection | null> {
  const { data } = await supabase.from('collections').select('*').eq('slug', slug).single()
  return data ?? null
}

async function getLieux(ids: string[]): Promise<Lieu[]> {
  if (!ids.length) return []
  const { data } = await supabase.from('lieux').select('*').in('id', ids)
  return (data ?? []).sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id))
}

async function getCategories() {
  const { data } = await supabase.from('catégories').select('identifiant, étiquette, icône')
  return (data ?? []).map((c: any) => ({
    id: c.identifiant as string,
    label: c['étiquette'] as string,
    icon: c['icône'] as string,
  }))
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
      images: col.cover_url
        ? [{ url: col.cover_url, width: 1200, height: 630, alt: col.title }]
        : [{ url: 'https://atlas-lieux.vercel.app/og-logo.png', width: 512, height: 512, alt: 'Atlas' }],
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

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
          {hasGps && (
            <a href={`https://www.google.com/maps?q=${l.gps_lat},${l.gps_lng}`} target="_blank" rel="noopener noreferrer" style={btn()}>📍 GPS</a>
          )}
          {phone && <a href={`tel:${phone}`} style={btn()}>📞 Appeler</a>}
          {whatsapp && <a href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" style={btn({ background: '#25D366', color: '#fff', border: 'none' })}>💬 WhatsApp</a>}
          {email && <a href={`mailto:${email}`} style={btn()}>✉️ Email</a>}
          {website && <a href={website} target="_blank" rel="noopener noreferrer" style={btn()}>🌐 Site web</a>}
          {instagram && <a href={instagram} target="_blank" rel="noopener noreferrer" style={btn()}>📷 Instagram</a>}
          {facebook && <a href={facebook} target="_blank" rel="noopener noreferrer" style={btn()}>👤 Facebook</a>}
          <a href={`/partager/${l.slug || l.id}`} style={btn({ background: '#1A1814', color: '#fff', border: 'none' })}>Voir la fiche →</a>
        </div>
      </div>
    </div>
  )
}

export default async function CollectionPage({ params, searchParams }: Props & { searchParams: { cat?: string } }) {
  const col = await getCollection(params.slug)
  if (!col) notFound()

  const allLieux = await getLieux(col.lieux_ids ?? [])
  const categories = await getCategories()

  const activeCat = searchParams.cat || 'all'
  const lieux = activeCat === 'all' ? allLieux : allLieux.filter(l => l.categorie === activeCat)

  const collectionUrl = `/collection/${params.slug}`

  const catsPresentes = categories.filter(c => allLieux.some(l => l.categorie === c.id))

  const catGroups = categories
    .map(c => ({ cat: c, items: lieux.filter(l => l.categorie === c.id) }))
    .filter(g => g.items.length > 0)

  const btnStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 14px', borderRadius: 100, border: `1px solid ${active ? '#8C5A28' : 'rgba(26,24,20,.2)'}`,
    background: active ? '#8C5A28' : '#fff', color: active ? '#fff' : '#6B6560',
    fontSize: 12, textDecoration: 'none', fontFamily: 'system-ui, sans-serif', display: 'inline-block',
  })

  const hasCover = !!col.cover_url

  return (
    <div style={{ minHeight: '100vh', background: '#F5F2ED', fontFamily: 'Georgia, serif' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '2rem 1.25rem 4rem' }}>

        {/* ── HEADER avec photo de couverture ── */}
        <div style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 24, position: 'relative', boxShadow: '0 2px 16px rgba(26,24,20,.1)' }}>

          {/* Photo de fond */}
          {hasCover && (
            <img
              src={col.cover_url!}
              alt={col.title}
              style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%',
                objectFit: 'cover', objectPosition: 'center',
              }}
            />
          )}

          {/* Overlay */}
          <div style={{
            position: 'relative', zIndex: 1,
            background: hasCover
              ? 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.65) 100%)'
              : '#fff',
            border: hasCover ? 'none' : '1px solid rgba(26,24,20,.08)',
            minHeight: hasCover ? 220 : 'auto',
            display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          }}>

            {/* Barre Atlas | Collection */}
            <div style={{
              padding: '14px 20px',
              borderBottom: `1px solid ${hasCover ? 'rgba(255,255,255,.2)' : 'rgba(26,24,20,.08)'}`,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 15, color: hasCover ? '#fff' : '#1A1814', fontWeight: 300 }}>Atlas</span>
              <div style={{ width: 1, height: 14, background: hasCover ? 'rgba(255,255,255,.4)' : 'rgba(26,24,20,.15)' }} />
              <span style={{ fontSize: 11, color: hasCover ? 'rgba(255,255,255,.7)' : '#B0AA9E', fontFamily: 'system-ui, sans-serif', letterSpacing: 1 }}>Collection</span>
            </div>

            {/* Titre + description + nb lieux */}
            <div style={{ padding: '24px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 30, fontStyle: 'italic', fontWeight: 300, lineHeight: 1.2, color: hasCover ? '#fff' : '#1A1814', marginBottom: 8, textShadow: hasCover ? '0 2px 8px rgba(0,0,0,0.4)' : 'none' }}>
                {col.title}
              </div>
              {col.description && (
                <p style={{ fontSize: 14, color: hasCover ? 'rgba(255,255,255,.85)' : '#6B6560', margin: '0 0 10px', lineHeight: 1.6 }}>
                  {col.description}
                </p>
              )}
              <div style={{ fontSize: 11, color: hasCover ? 'rgba(255,255,255,.6)' : '#B0AA9E', fontFamily: 'system-ui, sans-serif' }}>
                {allLieux.length} lieu{allLieux.length !== 1 ? 'x' : ''}
              </div>
            </div>

          </div>
        </div>

        {/* Filtres catégories */}
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
