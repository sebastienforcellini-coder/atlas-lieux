'use client'
import { useState, useEffect } from 'react'
import { reverseGeocode } from '@/lib/geocode'
import type { LieuInput, View } from '@/types'
import { Loading } from '@/components/UI'

interface Props {
  onNavigate: (v: View, opts?: Record<string, unknown>) => void
}

export default function GeoForm({ onNavigate }: Props) {
  const [status, setStatus] = useState<'locating' | 'found' | 'error'>('locating')
  const [msg, setMsg] = useState('Récupération de votre position…')
  const [geo, setGeo] = useState<Partial<LieuInput> | null>(null)

  useEffect(() => {
    if (!navigator.geolocation) {
      setStatus('error')
      setMsg('Géolocalisation non supportée par ce navigateur.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setMsg('Position trouvée, identification du lieu…')
        const { lat, lng, city, country, address } = await reverseGeocode(
          pos.coords.latitude,
          pos.coords.longitude
        )
        setGeo({
          gps_lat: lat,
          gps_lng: lng,
          city: city || '',
          country: country || '',
          address: address || '',
          name: '',
          description: '',
          photos: [], videos: [], tags: [],
          rating: 0, visit_date: new Date().toISOString().split('T')[0], comments: [],
        })
        setStatus('found')
      },
      (err) => {
        setStatus('error')
        setMsg('Impossible de récupérer la position : ' + err.message)
      },
      { enableHighAccuracy: true, timeout: 15000 }
    )
  }, [])

  if (status === 'locating') return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 16 }}>
      <div style={{ fontSize: 40 }}>📍</div>
      <div style={{ fontSize: 13, color: 'var(--mid)' }}>{msg}</div>
      <div className="spinner" style={{ width: 20, height: 20, border: '2px solid var(--line2)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin .6s linear infinite' }} />
    </div>
  )

  if (status === 'error') return (
    <div style={{ textAlign: 'center', padding: '3rem' }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
      <div style={{ fontSize: 13, color: 'var(--mid)', marginBottom: 20 }}>{msg}</div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        <button className="btn" onClick={() => onNavigate('home')}>Retour</button>
        <button className="btn btn-primary" onClick={() => onNavigate('form', { editLieu: null })}>Saisie manuelle</button>
      </div>
    </div>
  )

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="serif" style={{ fontSize: 22, fontStyle: 'italic', fontWeight: 300, marginBottom: 3 }}>📍 Position détectée</div>
          <div style={{ fontSize: 12, color: 'var(--soft)' }}>Vérifiez et complétez les informations</div>
        </div>
      </div>

      <div style={{ background: 'var(--accent-bg)', border: '1px solid var(--accent)', borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 13 }}>
          <div><span style={{ color: 'var(--soft)', fontSize: 11 }}>GPS</span><br /><strong>{parseFloat(geo!.gps_lat!).toFixed(5)}°, {parseFloat(geo!.gps_lng!).toFixed(5)}°</strong></div>
          {geo?.city && <div><span style={{ color: 'var(--soft)', fontSize: 11 }}>Ville détectée</span><br /><strong>{geo.city}</strong></div>}
          {geo?.country && <div><span style={{ color: 'var(--soft)', fontSize: 11 }}>Pays</span><br /><strong>{geo.country}</strong></div>}
          {geo?.address && <div><span style={{ color: 'var(--soft)', fontSize: 11 }}>Adresse</span><br /><strong>{geo.address}</strong></div>}
        </div>
        <a
          href={`https://maps.google.com/?q=${geo!.gps_lat},${geo!.gps_lng}`}
          target="_blank" rel="noopener"
          style={{ fontSize: 11, color: 'var(--accent)', marginTop: 8, display: 'inline-block' }}
        >
          Vérifier sur Google Maps →
        </a>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn" onClick={() => onNavigate('home')}>Annuler</button>
        <button
          className="btn btn-primary"
          onClick={() => onNavigate('form', { editLieu: geo })}
        >
          Continuer et compléter la fiche →
        </button>
      </div>
    </div>
  )
}
