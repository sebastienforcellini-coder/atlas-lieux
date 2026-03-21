'use client'
import { useState, useEffect, useRef } from 'react'
import type { Lieu, LieuInput } from '@/types'
import { Stars } from '@/components/UI'
import { CATEGORIES } from '@/types'
import { uploadPhoto } from '@/lib/supabase'
import { compressImage } from '@/lib/imageUtils'
import { reverseGeocode } from '@/lib/geocode'

const EMPTY: LieuInput = {
  name: '', country: '', city: '', address: '', description: '',
  photos: [], videos: [], tags: [], gps_lat: '', gps_lng: '',
  rating: 0, visit_date: '', comments: [], slug: null, categorie: 'autre', favori: false,
}

interface Props {
  initial: Partial<Lieu> | null
  allLieux: Lieu[]
  onSave: (data: LieuInput, id?: number) => Promise<void>
  onCancel: () => void
}

function Section({ title }: { title: string }) {
  return (
    <div className="form-section">
      <div className="form-section-title">{title}</div>
    </div>
  )
}

function parseGpsString(input: string): { lat: string; lng: string } | null {
  const s = input.trim()
  const dmsRegex = /(\d+[,.]?\d*)\s*[°]?\s*([NSns])[,\s]+(\d+[,.]?\d*)\s*[°]?\s*([EOWeowest])/i
  const dmsMatch = s.match(dmsRegex)
  if (dmsMatch) {
    let lat = parseFloat(dmsMatch[1].replace(',', '.'))
    let lng = parseFloat(dmsMatch[3].replace(',', '.'))
    if (/[Ss]/.test(dmsMatch[2])) lat = -lat
    if (/[OoWw]/.test(dmsMatch[4])) lng = -lng
    return { lat: lat.toString(), lng: lng.toString() }
  }
  const decRegex = /^(-?\d+[,.]?\d*)\s*[,;\s]\s*(-?\d+[,.]?\d*)$/
  const decMatch = s.match(decRegex)
  if (decMatch) {
    return { lat: decMatch[1].replace(',', '.'), lng: decMatch[2].replace(',', '.') }
  }
  return null
}

export default function LieuForm({ initial, allLieux, onSave, onCancel }: Props) {
  const isEdit = !!(initial && 'id' in initial && initial.id)
  const [form, setForm] = useState<LieuInput>({ ...EMPTY })
  const [newPhoto, setNewPhoto] = useState('')
  const [newVideo, setNewVideo] = useState('')
  const [newTag, setNewTag] = useState('')
  const [saving, setSaving] = useState(false)
  const [gpsInput, setGpsInput] = useState('')
  const [gpsLocating, setGpsLocating] = useState(false)
  const [gpsError, setGpsError] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (initial) {
      setForm({ ...EMPTY, ...initial })
      if (initial.gps_lat && initial.gps_lng) setGpsInput(initial.gps_lat + ', ' + initial.gps_lng)
    } else {
      setForm({ ...EMPTY })
      setGpsInput('')
    }
  }, [initial])

  const up = <K extends keyof LieuInput>(k: K, v: LieuInput[K]) => setForm(f => ({ ...f, [k]: v }))

  const handleGpsInput = (val: string) => {
    setGpsInput(val)
    setGpsError('')
    const parsed = parseGpsString(val)
    if (parsed) setForm(f => ({ ...f, gps_lat: parsed.lat, gps_lng: parsed.lng }))
    else if (val.trim()) setForm(f => ({ ...f, gps_lat: '', gps_lng: '' }))
  }

  const handleGeolocate = () => {
    if (!navigator.geolocation) { setGpsError('Géolocalisation non supportée'); return }
    setGpsLocating(true); setGpsError('')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6)
        const lng = pos.coords.longitude.toFixed(6)
        setForm(f => ({ ...f, gps_lat: lat, gps_lng: lng }))
        setGpsInput(lat + ', ' + lng)
        setGpsLocating(false)
      },
      (err) => { setGpsError('Position indisponible : ' + err.message); setGpsLocating(false) },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    const urls: string[] = []

    for (const file of Array.from(files)) {
      // Read EXIF GPS from first photo if GPS not already set
      if (urls.length === 0 && !form.gps_lat) {
        try {
          const exifr = (await import('exifr')).default
          const gps = await exifr.gps(file)
          if (gps?.latitude && gps?.longitude) {
            const lat = gps.latitude.toFixed(6)
            const lng = gps.longitude.toFixed(6)
            setGpsInput(lat + ', ' + lng)
            setForm(f => ({ ...f, gps_lat: lat, gps_lng: lng }))

            // Reverse geocode to fill city/country if empty
            if (!form.city || !form.country) {
              const geo = await reverseGeocode(gps.latitude, gps.longitude)
              setForm(f => ({
                ...f,
                gps_lat: lat,
                gps_lng: lng,
                city: f.city || geo.city || '',
                country: f.country || geo.country || '',
                address: f.address || geo.address || '',
              }))
            }
          }
        } catch {
          // EXIF not available, ignore
        }
      }

      const compressed = await compressImage(file)
      const url = await uploadPhoto(compressed)
      if (url) urls.push(url)
    }

    if (urls.length > 0) up('photos', [...form.photos, ...urls])
    setUploading(false)
  }

  const addPhoto = () => { const v = newPhoto.trim(); if (!v) return; up('photos', [...form.photos, v]); setNewPhoto('') }
  const addVideo = () => { const v = newVideo.trim(); if (!v) return; up('videos', [...form.videos, v]); setNewVideo('') }
  const addTag = () => { const v = newTag.trim(); if (!v || form.tags.includes(v)) return; up('tags', [...form.tags, v]); setNewTag('') }

  const handleSave = async () => {
    if (!form.name.trim() || !form.country.trim() || !form.city.trim()) {
      alert('Le nom, le pays et la ville sont obligatoires.')
      return
    }
    setSaving(true)
    await onSave(form, isEdit ? (initial as Lieu).id : undefined)
    setSaving(false)
  }

  const existingCountries = Array.from(new Set(allLieux.map(l => l.country))).sort()
  const existingCities = Array.from(new Set(allLieux.map(l => l.city))).sort()
  const gpsValid = form.gps_lat && form.gps_lng

  return (
    <div style={{ maxWidth: 700 }}>
      <div className="page-header">
        <div className="serif" style={{ fontSize: 22, fontStyle: 'italic', fontWeight: 300 }}>
          {isEdit ? 'Modifier — ' + form.name : 'Nouveau lieu'}
        </div>
      </div>

      <div className="grid-2col" style={{ gap: 12 }}>
        <div style={{ gridColumn: '1/-1' }}>
          <div className="label">Nom du lieu *</div>
          <input className="field-input" value={form.name} onChange={e => up('name', e.target.value)} placeholder="Restaurant, hôtel, musée, plage…" />
        </div>
        <div>
          <div className="label">Pays *</div>
          <input className="field-input" value={form.country} onChange={e => up('country', e.target.value)} placeholder="Maroc" list="cl-countries" />
          <datalist id="cl-countries">{existingCountries.map(c => <option key={c} value={c} />)}</datalist>
        </div>
        <div>
          <div className="label">Ville *</div>
          <input className="field-input" value={form.city} onChange={e => up('city', e.target.value)} placeholder="Marrakech" list="cl-cities" />
          <datalist id="cl-cities">{existingCities.map(c => <option key={c} value={c} />)}</datalist>
        </div>
        <div style={{ gridColumn: '1/-1' }}>
          <div className="label">Adresse</div>
          <input className="field-input" value={form.address ?? ''} onChange={e => up('address', e.target.value)} placeholder="12 derb Bab Doukkala" />
        </div>
        <div style={{ gridColumn: '1/-1' }}>
          <div className="label">Description / Notes</div>
          <textarea className="field-input" value={form.description ?? ''} onChange={e => up('description', e.target.value)}
            placeholder="Impressions, recommandations, horaires, prix…" rows={5} style={{ resize: 'vertical' }} />
        </div>
      </div>

      <Section title="Type de lieu & favori" />
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div className="label">Catégorie</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
            {CATEGORIES.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => up('categorie', c.id)}
                style={{
                  padding: '5px 10px',
                  borderRadius: 100,
                  border: '1px solid',
                  borderColor: form.categorie === c.id ? 'var(--accent)' : 'var(--line2)',
                  background: form.categorie === c.id ? 'var(--accent-bg)' : 'var(--bg)',
                  color: form.categorie === c.id ? 'var(--accent)' : 'var(--mid)',
                  fontSize: 12,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  transition: 'all .15s',
                }}
              >
                {c.icon} {c.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="label">Favori</div>
          <button
            type="button"
            onClick={() => up('favori', !form.favori)}
            style={{
              marginTop: 4,
              padding: '6px 14px',
              borderRadius: 100,
              border: '1px solid',
              borderColor: form.favori ? '#E0952A' : 'var(--line2)',
              background: form.favori ? '#FFF8EC' : 'var(--bg)',
              color: form.favori ? '#E0952A' : 'var(--mid)',
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all .15s',
            }}
          >
            {form.favori ? '★ Favori' : '☆ Ajouter aux favoris'}
          </button>
        </div>
      </div>

      <Section title="Localisation & visite" />
      <div style={{ marginBottom: 12 }}>
        <div className="label">Point GPS</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
          <input
            className="field-input"
            value={gpsInput}
            onChange={e => handleGpsInput(e.target.value)}
            placeholder="31,62504° N, 7,98763° O  —  ou  —  31.625, -7.987"
            style={{ flex: 1 }}
          />
          <button className="btn btn-sm" type="button" onClick={handleGeolocate} disabled={gpsLocating} style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
            {gpsLocating ? '⏳' : '📍 Ma position'}
          </button>
        </div>
        {gpsError && <div style={{ fontSize: 11, color: '#C0392B', marginTop: 3 }}>{gpsError}</div>}
        {gpsValid && (
          <div style={{ fontSize: 11, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
            ✓ {parseFloat(form.gps_lat!).toFixed(5)}°, {parseFloat(form.gps_lng!).toFixed(5)}°
            <a href={'https://maps.google.com/?q=' + form.gps_lat + ',' + form.gps_lng} target="_blank" rel="noopener" style={{ color: 'var(--accent)', fontSize: 11 }}>
              Vérifier sur Maps →
            </a>
          </div>
        )}
        {gpsInput && !gpsValid && (
          <div style={{ fontSize: 11, color: 'var(--soft)', marginTop: 3 }}>
            Formats acceptés : 31,62504° N, 7,98763° O  ou  31.62504, -7.98763
          </div>
        )}
      </div>

      <div className="grid-2col" style={{ gap: 12 }}>
        <div>
          <div className="label">Date de visite</div>
          <input className="field-input" type="date" value={form.visit_date ?? ''} onChange={e => up('visit_date', e.target.value)} />
        </div>
        <div>
          <div className="label">Note</div>
          <div style={{ paddingTop: 8 }}><Stars value={form.rating} onChange={v => up('rating', v)} /></div>
        </div>
      </div>

      <Section title="Photos" />
      {/* Upload */}
      <div
        onClick={() => fileRef.current?.click()}
        className="photo-upload-zone"
        style={{
          border: '2px dashed var(--line2)', borderRadius: 8, padding: '20px 16px', textAlign: 'center',
          cursor: 'pointer', marginBottom: 10, transition: 'border-color .15s', background: 'var(--bg)',
        }}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); handleFileUpload(e.dataTransfer.files) }}
      >
        <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => handleFileUpload(e.target.files)} />
        {uploading
          ? <div style={{ fontSize: 14, color: 'var(--mid)' }}>⏳ Compression et upload en cours...</div>
          : <div style={{ fontSize: 14, color: 'var(--mid)' }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>📷</div>
              <div><span style={{ color: 'var(--accent)', fontWeight: 500 }}>Choisir des photos</span></div>
              <div style={{ fontSize: 11, marginTop: 4, color: 'var(--soft)' }}>Depuis la galerie ou appareil photo · Compression automatique</div>
            </div>
        }
      </div>
      {/* URL */}
      <div className="photo-input-row">
        <input className="field-input" value={newPhoto} onChange={e => setNewPhoto(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addPhoto())} placeholder="ou coller une URL : https://example.com/photo.jpg" />
        <button className="btn btn-sm" type="button" onClick={addPhoto}>Ajouter</button>
      </div>
      {form.photos.length > 0 && (
        <div className="photo-preview" style={{ marginTop: 8 }}>
          {form.photos.map((u, i) => (
            <div key={i} className="photo-prev-item">
              <img className="photo-prev-img" src={u} alt="" onError={e => (e.target as HTMLImageElement).style.opacity = '.15'} />
              <button className="photo-prev-del" type="button" onClick={() => up('photos', form.photos.filter((_, j) => j !== i))}>✕</button>
            </div>
          ))}
        </div>
      )}

      <Section title="Vidéos YouTube" />
      <div className="photo-input-row">
        <input className="field-input" value={newVideo} onChange={e => setNewVideo(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addVideo())} placeholder="https://youtube.com/watch?v=…" />
        <button className="btn btn-sm" type="button" onClick={addVideo}>Ajouter</button>
      </div>
      {form.videos.map((u, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid var(--line)', fontSize: 12, color: 'var(--mid)' }}>
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u}</span>
          <button onClick={() => up('videos', form.videos.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--soft)', fontSize: 11 }}>✕</button>
        </div>
      ))}

      <Section title="Tags" />
      <div className="photo-input-row">
        <input className="field-input" value={newTag} onChange={e => setNewTag(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} placeholder="restaurant, plage, riad, incontournable…" />
        <button className="btn btn-sm" type="button" onClick={addTag}>Ajouter</button>
      </div>
      {form.tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
          {form.tags.map((t, i) => (
            <span key={t} className="tag">{t}
              <span onClick={() => up('tags', form.tags.filter((_, j) => j !== i))}
                style={{ cursor: 'pointer', opacity: .5, fontSize: 10, marginLeft: 3 }}>✕</span>
            </span>
          ))}
        </div>
      )}

      <div className="divider" />
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn" onClick={onCancel} style={{ flex: 1 }}>Annuler</button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ flex: 2 }}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
      </div>
    </div>
  )
}
