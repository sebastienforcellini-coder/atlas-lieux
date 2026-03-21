'use client'
import { useState, useEffect } from 'react'
import type { Lieu, LieuInput, View } from '@/types'
import { Stars } from '@/components/UI'

const EMPTY: LieuInput = {
  name: '', country: '', city: '', address: '', description: '',
  photos: [], videos: [], tags: [], gps_lat: '', gps_lng: '',
  rating: 0, visit_date: '', comments: [],
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

export default function LieuForm({ initial, allLieux, onSave, onCancel }: Props) {
  const isEdit = !!(initial && 'id' in initial && initial.id)
  const [form, setForm] = useState<LieuInput>({ ...EMPTY })
  const [newPhoto, setNewPhoto] = useState('')
  const [newVideo, setNewVideo] = useState('')
  const [newTag, setNewTag] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (initial) setForm({ ...EMPTY, ...initial })
    else setForm({ ...EMPTY })
  }, [initial])

  const up = <K extends keyof LieuInput>(k: K, v: LieuInput[K]) =>
    setForm(f => ({ ...f, [k]: v }))

  const addPhoto = () => {
    const v = newPhoto.trim(); if (!v) return
    up('photos', [...form.photos, v]); setNewPhoto('')
  }
  const addVideo = () => {
    const v = newVideo.trim(); if (!v) return
    up('videos', [...form.videos, v]); setNewVideo('')
  }
  const addTag = () => {
    const v = newTag.trim(); if (!v || form.tags.includes(v)) return
    up('tags', [...form.tags, v]); setNewTag('')
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.country.trim() || !form.city.trim()) {
      alert('Le nom, le pays et la ville sont obligatoires.')
      return
    }
    setSaving(true)
    await onSave(form, isEdit ? (initial as Lieu).id : undefined)
    setSaving(false)
  }

  const existingCountries = Array.from(new Set(allLieux.map(l => l.country).sort())
  const existingCities    = Array.from(new Set(allLieux.map(l => l.city).sort())

  return (
    <div style={{ maxWidth: 700 }}>
      <div className="page-header">
        <div className="serif" style={{ fontSize: 22, fontStyle: 'italic', fontWeight: 300 }}>
          {isEdit ? `Modifier — ${form.name}` : 'Nouveau lieu'}
        </div>
      </div>

      {/* Infos */}
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

      <Section title="Localisation & visite" />
      <div className="grid-2col" style={{ gap: 12 }}>
        <div>
          <div className="label">Latitude GPS</div>
          <input className="field-input" value={form.gps_lat ?? ''} onChange={e => up('gps_lat', e.target.value)} placeholder="31.6295" />
        </div>
        <div>
          <div className="label">Longitude GPS</div>
          <input className="field-input" value={form.gps_lng ?? ''} onChange={e => up('gps_lng', e.target.value)} placeholder="-7.9811" />
        </div>
        <div>
          <div className="label">Date de visite</div>
          <input className="field-input" type="date" value={form.visit_date ?? ''} onChange={e => up('visit_date', e.target.value)} />
        </div>
        <div>
          <div className="label">Note</div>
          <div style={{ paddingTop: 8 }}>
            <Stars value={form.rating} onChange={v => up('rating', v)} />
          </div>
        </div>
      </div>

      <Section title="Photos (URLs)" />
      <div className="photo-input-row">
        <input className="field-input" value={newPhoto} onChange={e => setNewPhoto(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addPhoto())}
          placeholder="https://example.com/photo.jpg" />
        <button className="btn btn-sm" type="button" onClick={addPhoto}>Ajouter</button>
      </div>
      {form.photos.length > 0 && (
        <div className="photo-preview" style={{ marginTop: 8 }}>
          {form.photos.map((u, i) => (
            <div key={i} className="photo-prev-item">
              <img className="photo-prev-img" src={u} alt="" onError={e => (e.target as HTMLImageElement).style.opacity='.15'} />
              <button className="photo-prev-del" type="button" onClick={() => up('photos', form.photos.filter((_,j)=>j!==i))}>✕</button>
            </div>
          ))}
        </div>
      )}

      <Section title="Vidéos YouTube" />
      <div className="photo-input-row">
        <input className="field-input" value={newVideo} onChange={e => setNewVideo(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addVideo())}
          placeholder="https://youtube.com/watch?v=…" />
        <button className="btn btn-sm" type="button" onClick={addVideo}>Ajouter</button>
      </div>
      {form.videos.map((u, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid var(--line)', fontSize: 12, color: 'var(--mid)' }}>
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u}</span>
          <button onClick={() => up('videos', form.videos.filter((_,j)=>j!==i))} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--soft)',fontSize:11 }}>✕</button>
        </div>
      ))}

      <Section title="Tags" />
      <div className="photo-input-row">
        <input className="field-input" value={newTag} onChange={e => setNewTag(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
          placeholder="restaurant, plage, riad, incontournable…" />
        <button className="btn btn-sm" type="button" onClick={addTag}>Ajouter</button>
      </div>
      {form.tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
          {form.tags.map((t, i) => (
            <span key={t} className="tag">
              {t}
              <span onClick={() => up('tags', form.tags.filter((_,j)=>j!==i))}
                style={{ cursor: 'pointer', opacity: .5, fontSize: 10, marginLeft: 3 }}>✕</span>
            </span>
          ))}
        </div>
      )}

      <div className="divider" />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <button className="btn" onClick={onCancel}>Annuler</button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </div>
  )
}
