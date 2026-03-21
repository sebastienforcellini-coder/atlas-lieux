'use client'
import { useEffect, useRef } from 'react'
import type { Lieu, View } from '@/types'

interface Props {
  lieux: Lieu[]
  onNavigate: (v: View, opts?: Record<string, unknown>) => void
}

export default function MapView({ lieux, onNavigate }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<unknown>(null)

  const withGps = lieux.filter(l => l.gps_lat && l.gps_lng)

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return

    // Load Leaflet dynamically
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)

    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const L = (window as any).L
      if (!mapRef.current) return

      const defaultCenter: [number, number] = withGps.length > 0
        ? [parseFloat(withGps[0].gps_lat!), parseFloat(withGps[0].gps_lng!)]
        : [20, 0]

      const map = L.map(mapRef.current, { zoomControl: true }).setView(defaultCenter, withGps.length > 0 ? 8 : 2)
      mapInstance.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map)

      // Custom marker icon
      const icon = L.divIcon({
        html: `<div style="background:var(--accent,#8C5A28);width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.3)"></div>`,
        className: '',
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -32],
      })

      withGps.forEach(l => {
        const lat = parseFloat(l.gps_lat!)
        const lng = parseFloat(l.gps_lng!)
        const stars = l.rating > 0 ? '★'.repeat(l.rating) : ''
        const popup = `
          <div style="font-family:Georgia,serif;min-width:160px">
            <div style="font-weight:700;font-size:14px;margin-bottom:3px">${l.name}</div>
            <div style="font-size:11px;color:#6b6560;margin-bottom:4px">${l.city} · ${l.country}</div>
            ${stars ? `<div style="color:#e0952a;font-size:12px;margin-bottom:6px">${stars}</div>` : ''}
            ${l.photos?.[0] ? `<img src="${l.photos[0]}" style="width:100%;height:80px;object-fit:cover;border-radius:4px;margin-bottom:6px" />` : ''}
            <button onclick="window._atlasNavigate(${l.id})" style="background:#8C5A28;color:white;border:none;padding:5px 10px;border-radius:4px;cursor:pointer;font-size:11px;width:100%">Voir la fiche →</button>
          </div>
        `
        L.marker([lat, lng], { icon }).addTo(map).bindPopup(popup)
      })

      // Fit bounds if multiple markers
      if (withGps.length > 1) {
        const bounds = L.latLngBounds(withGps.map(l => [parseFloat(l.gps_lat!), parseFloat(l.gps_lng!)]))
        map.fitBounds(bounds, { padding: [40, 40] })
      }
    }
    document.head.appendChild(script)

    // Global callback for popup button
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any)._atlasNavigate = (id: number) => onNavigate('detail', { lieuId: id })

    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(window as any)._atlasNavigate = undefined
    }
  }, [])

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="serif" style={{ fontSize: 22, fontStyle: 'italic', fontWeight: 300, marginBottom: 3 }}>Carte</div>
          <div style={{ fontSize: 12, color: 'var(--soft)' }}>{withGps.length} lieu{withGps.length !== 1 ? 'x' : ''} géolocalisé{withGps.length !== 1 ? 's' : ''} sur {lieux.length}</div>
        </div>
      </div>

      {withGps.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🗾</div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Aucun lieu géolocalisé</div>
          <div style={{ fontSize: 13, marginBottom: 16 }}>Ajoutez des coordonnées GPS à vos lieux pour les voir sur la carte</div>
          <button className="btn btn-accent btn-sm" onClick={() => onNavigate('geoform')}>📍 Créer depuis ma position</button>
        </div>
      ) : (
        <div
          ref={mapRef}
          style={{ width: '100%', height: 'calc(100vh - 180px)', minHeight: 400, borderRadius: 10, border: '1px solid var(--line)', overflow: 'hidden' }}
        />
      )}
    </div>
  )
}
