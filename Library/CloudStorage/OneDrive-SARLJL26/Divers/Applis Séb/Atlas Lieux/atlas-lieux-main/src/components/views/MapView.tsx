'use client'
import { useEffect, useRef, useState } from 'react'
import type { Lieu, View } from '@/types'
import { getCat } from '@/types'

interface Props {
  lieux: Lieu[]
  onNavigate: (v: View, opts?: Record<string, unknown>) => void
}

export default function MapView({ lieux, onNavigate }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<unknown>(null)
  const [loaded, setLoaded] = useState(false)

  const withGps = lieux.filter(l => l.gps_lat && l.gps_lng)

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return

    // Load Leaflet CSS
    const addCss = (href: string) => {
      if (document.querySelector(`link[href="${href}"]`)) return
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = href
      document.head.appendChild(link)
    }
    addCss('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css')
    addCss('https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css')
    addCss('https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css')

    const loadScript = (src: string): Promise<void> =>
      new Promise(resolve => {
        if (document.querySelector(`script[src="${src}"]`)) { resolve(); return }
        const s = document.createElement('script')
        s.src = src
        s.onload = () => resolve()
        document.head.appendChild(s)
      })

    const init = async () => {
      await loadScript('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js')
      await loadScript('https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js')

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const L = (window as any).L
      if (!mapRef.current || mapInstance.current) return

      const defaultCenter: [number, number] = withGps.length > 0
        ? [parseFloat(withGps[0].gps_lat!), parseFloat(withGps[0].gps_lng!)]
        : [20, 0]

      const map = L.map(mapRef.current, { zoomControl: true })
        .setView(defaultCenter, withGps.length > 0 ? 5 : 2)
      mapInstance.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map)

      // Cluster group
      const markers = L.markerClusterGroup({
        showCoverageOnHover: false,
        maxClusterRadius: 50,
        iconCreateFunction: (cluster: { getChildCount: () => number }) => {
          const count = cluster.getChildCount()
          return L.divIcon({
            html: `<div style="background:#8C5A28;color:white;width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:Georgia,serif;font-size:13px;font-weight:600;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.25)">${count}</div>`,
            className: '',
            iconSize: [38, 38],
          })
        },
      })

      withGps.forEach(l => {
        const lat = parseFloat(l.gps_lat!)
        const lng = parseFloat(l.gps_lng!)
        const cat = getCat(l.categorie)
        const stars = l.rating > 0 ? '★'.repeat(l.rating) + '☆'.repeat(5 - l.rating) : ''

        const icon = L.divIcon({
          html: `<div style="background:#8C5A28;width:32px;height:32px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center">
            <span style="transform:rotate(45deg);font-size:13px">${cat.icon}</span>
          </div>`,
          className: '',
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -36],
        })

        const popup = `
          <div style="font-family:Georgia,serif;min-width:180px;max-width:220px">
            ${l.photos?.[0] ? `<img src="${l.photos[0]}" style="width:100%;height:100px;object-fit:cover;border-radius:6px;margin-bottom:8px;display:block" />` : ''}
            <div style="display:flex;align-items:center;gap:5px;margin-bottom:2px">
              <span style="font-size:12px">${cat.icon}</span>
              <span style="font-size:10px;color:#B0AA9E;text-transform:uppercase;letter-spacing:1px">${cat.label}</span>
              ${l.favori ? '<span style="color:#E0952A;font-size:12px">★</span>' : ''}
            </div>
            <div style="font-style:italic;font-size:15px;font-weight:300;margin-bottom:2px">${l.name}</div>
            <div style="font-size:11px;color:#6b6560;margin-bottom:4px">${l.city} · ${l.country}</div>
            ${stars ? `<div style="color:#e0952a;font-size:11px;margin-bottom:6px">${stars}</div>` : ''}
            <button onclick="window._atlasNavigate(${l.id})" style="background:#8C5A28;color:white;border:none;padding:6px 10px;border-radius:6px;cursor:pointer;font-size:11px;width:100%;font-family:Georgia,serif;font-style:italic">Voir la fiche →</button>
          </div>`

        const marker = L.marker([lat, lng], { icon }).bindPopup(popup, { maxWidth: 240 })
        markers.addLayer(marker)
      })

      map.addLayer(markers)

      // Fit bounds
      if (withGps.length > 1) {
        const bounds = L.latLngBounds(withGps.map(l => [parseFloat(l.gps_lat!), parseFloat(l.gps_lng!)]))
        map.fitBounds(bounds, { padding: [40, 40] })
      }

      setLoaded(true)
    }

    init()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any)._atlasNavigate = (id: number) => onNavigate('detail', { lieuId: id })

    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(window as any)._atlasNavigate = undefined
    }
  }, [])

  // Update markers when lieux change
  useEffect(() => {
    if (!loaded) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any)._atlasNavigate = (id: number) => onNavigate('detail', { lieuId: id })
  }, [lieux, loaded, onNavigate])

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="serif" style={{ fontSize: 22, fontStyle: 'italic', fontWeight: 300, marginBottom: 3 }}>Carte</div>
          <div style={{ fontSize: 12, color: 'var(--soft)' }}>{withGps.length} lieu{withGps.length !== 1 ? 'x' : ''} géolocalisé{withGps.length !== 1 ? 's' : ''} sur {lieux.length}</div>
        </div>
        <button className="btn btn-sm" onClick={() => onNavigate('home')}>✕ Fermer</button>
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
          style={{ width: '100%', height: 'calc(100vh - 160px)', minHeight: 400, borderRadius: 10, border: '1px solid var(--line)', overflow: 'hidden', touchAction: 'pan-x pan-y' }}
        />
      )}
    </div>
  )
}
