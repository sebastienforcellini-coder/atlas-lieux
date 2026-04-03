'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Stars } from '@/components/UI'
import { getCat } from '@/types'
import type { Lieu } from '@/types'

interface Collection {
  id: number
  title: string
  description: string | null
  slug: string
  lieux_ids: number[]
  created_at: string
}

export default function CollectionPage({ params }: { params: { slug: string } }) {
  const [collection, setCollection] = useState<Collection | null>(null)
  const [lieux, setLieux] = useState<Lieu[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: col } = await supabase
        .from('collections')
        .select('*')
        .eq('slug', params.slug)
        .single()

      if (!col) { setLoading(false); return }
      setCollection(col)

      if (col.lieux_ids?.length > 0) {
        const { data: lieuxData } = await supabase
          .from('lieux')
          .select('*')
          .in('id', col.lieux_ids)
        setLieux(lieuxData || [])
      }
      setLoading(false)
    }
    load()
  }, [params.slug])

  const handleShare = () => {
    const url = window.location.href
    if (navigator.share) {
      navigator.share({ title: collection?.title, url })
    } else {
      navigator.clipboard?.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontSize: 14, color: '#9a9087' }}>
      Chargement...
    </div>
  )

  if (!collection) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 12 }}>
      <div style={{ fontSize: 40 }}>🗺</div>
      <div style={{ fontSize: 16, fontWeight: 600 }}>Collection introuvable</div>
      <a href="https://atlas-lieux.vercel.app" style={{ color: '#8b7355', fontSize: 13 }}>← Retour à Atlas</a>
    </div>
  )

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 20px', fontFamily: 'system-ui, sans-serif', color: '#2a2520' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid #e8e2da' }}>
        <a href="https://atlas-lieux.vercel.app" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#9a9087', textDecoration: 'none', marginBottom: 20 }}>
          <img src="https://atlas-lieux.vercel.app/favicon.svg" alt="Atlas" style={{ width: 20, height: 20 }} />
          Atlas — Répertoire de lieux
        </a>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: 28, fontStyle: 'italic', fontWeight: 300, marginBottom: 8 }}>
          {collection.title}
        </div>
        {collection.description && (
          <div style={{ fontSize: 14, color: '#6b6056', marginBottom: 12 }}>{collection.description}</div>
        )}
        <div style={{ fontSize: 12, color: '#9a9087', marginBottom: 16 }}>
          {lieux.length} lieu{lieux.length !== 1 ? 'x' : ''}
        </div>
        <button
          onClick={handleShare}
          style={{ padding: '8px 20px', borderRadius: 100, border: '1px solid #c4b89a', background: '#fdfcfa', color: '#8b7355', fontSize: 13, cursor: 'pointer' }}
        >
          {copied ? '✓ Lien copié' : '🔗 Partager cette collection'}
        </button>
      </div>

      {/* Lieux */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {lieux.map(l => {
          const cat = getCat(l.categorie)
          const gpsUrl = l.gps_lat && l.gps_lng ? `https://maps.google.com/?q=${l.gps_lat},${l.gps_lng}` : null
          return (
            <div key={l.id} style={{ border: '1px solid #e8e2da', borderRadius: 12, overflow: 'hidden', background: '#fdfcfa' }}>
              {l.photos?.[0] && (
                <img src={l.photos[0]} alt="" style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }} />
              )}
              <div style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#f5f0e8', borderRadius: 100, padding: '2px 8px', fontSize: 11, color: '#8b7355', marginBottom: 4 }}>
                      {cat.icon} {cat.label}
                    </div>
                    <div style={{ fontFamily: 'Georgia, serif', fontSize: 18, fontStyle: 'italic', fontWeight: 300 }}>{l.name}</div>
                    <div style={{ fontSize: 13, color: '#6b6056' }}>{l.city} · {l.country}</div>
                    {l.rating > 0 && <Stars value={l.rating} />}
                  </div>
                </div>
                {l.description && (
                  <p style={{ fontSize: 13, lineHeight: 1.7, color: '#4a4540', marginBottom: 10 }}>{l.description}</p>
                )}
                {l.address && (
                  <div style={{ fontSize: 12, color: '#9a9087', marginBottom: 8 }}>🏠 {l.address}</div>
                )}
                {l.tags?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                    {l.tags.map(t => (
                      <span key={t} style={{ padding: '2px 8px', background: '#f0ebe2', borderRadius: 100, fontSize: 11, color: '#6b6056' }}>{t}</span>
                    ))}
                  </div>
                )}
                {gpsUrl && (
                  <a href={gpsUrl} target="_blank" rel="noopener"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#8b7355', textDecoration: 'none', padding: '6px 12px', border: '1px solid #c4b89a', borderRadius: 8 }}>
                    📍 Voir sur Maps
                  </a>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ textAlign: 'center', marginTop: 40, paddingTop: 24, borderTop: '1px solid #e8e2da' }}>
        <a href="https://atlas-lieux.vercel.app" style={{ fontSize: 12, color: '#9a9087', textDecoration: 'none' }}>
          Créer votre propre atlas sur atlas-lieux.vercel.app →
        </a>
      </div>
    </div>
  )
}
