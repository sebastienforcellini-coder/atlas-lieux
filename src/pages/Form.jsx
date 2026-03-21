import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { usePlaces } from '../hooks/usePlaces'
import { useToast } from '../hooks/useToast'
import { Breadcrumb, Stars, Loading, gid } from '../components/UI'

const EMPTY = {
  name: '', country: '', city: '', address: '', description: '',
  photos: [], videos: [], tags: [], gps: { lat: '', lng: '' },
  rating: 0, visitDate: '', comments: [],
}

function Section({ title }) {
  return (
    <div style={{ margin: '1.5rem 0 .75rem' }}>
      <hr className="divider" style={{ marginBottom: '.75rem' }} />
      <p style={{ fontSize: '.72rem', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--text3)', fontWeight: 600 }}>{title}</p>
    </div>
  )
}

export default function Form() {
  const { id } = useParams()
  const nav = useNavigate()
  const showToast = useToast()
  const { places, loading, addPlace, updatePlace } = usePlaces()
  const isEdit = id && id !== 'nouveau'

  const [form, setForm] = useState(EMPTY)
  const [newPhoto, setNewPhoto] = useState('')
  const [newVideo, setNewVideo] = useState('')
  const [newTag, setNewTag] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isEdit && !loading) {
      const p = places.find(x => x.id === id)
      if (p) setForm({ ...EMPTY, ...p })
    }
  }, [isEdit, id, places, loading])

  if (loading) return <Loading />

  const up = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const upGps = (k, v) => setForm(f => ({ ...f, gps: { ...f.gps, [k]: v } }))

  const addPhoto = () => {
    const v = newPhoto.trim()
    if (!v) return
    up('photos', [...form.photos, v])
    setNewPhoto('')
  }
  const removePhoto = i => up('photos', form.photos.filter((_, j) => j !== i))

  const addVideo = () => {
    const v = newVideo.trim()
    if (!v) return
    up('videos', [...form.videos, v])
    setNewVideo('')
  }
  const removeVideo = i => up('videos', form.videos.filter((_, j) => j !== i))

  const addTag = () => {
    const v = newTag.trim()
    if (!v || form.tags.includes(v)) return
    up('tags', [...form.tags, v])
    setNewTag('')
  }
  const removeTag = i => up('tags', form.tags.filter((_, j) => j !== i))

  const handleSave = async () => {
    if (!form.name?.trim() || !form.country?.trim() || !form.city?.trim()) {
      alert('Le nom, le pays et la ville sont obligatoires.')
      return
    }
    setSaving(true)
    try {
      if (isEdit) {
        await updatePlace(id, form)
        showToast('Lieu mis à jour !')
        nav(`/lieu/${id}`)
      } else {
        const newId = await addPlace(form)
        showToast('Lieu créé !')
        nav(`/lieu/${newId}`)
      }
    } catch (e) {
      alert('Erreur : ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (isEdit) nav(`/lieu/${id}`)
    else nav('/')
  }

  // Datalists from existing data
  const existingCountries = [...new Set(places.map(p => p.country))].sort()
  const existingCities = [...new Set(places.map(p => p.city))].sort()

  return (
    <div className="page" style={{ maxWidth: 760 }}>
      <Breadcrumb items={[
        { l: 'Accueil', to: '/' },
        ...(isEdit ? [{ l: places.find(p => p.id === id)?.name || 'Lieu', to: `/lieu/${id}` }] : []),
        { l: isEdit ? 'Modifier' : 'Nouveau lieu' },
      ]} />

      <h1 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.25rem' }}>
        {isEdit ? `Modifier — ${form.name}` : 'Nouveau lieu'}
      </h1>

      {/* Infos principales */}
      <div className="form-grid">
        <div className="fg full">
          <label className="label">Nom du lieu *</label>
          <input value={form.name} onChange={e => up('name', e.target.value)} placeholder="Restaurant, hôtel, musée, plage…" />
        </div>
        <div className="fg">
          <label className="label">Pays *</label>
          <input value={form.country} onChange={e => up('country', e.target.value)} placeholder="Maroc" list="cl-countries" />
          <datalist id="cl-countries">{existingCountries.map(c => <option key={c} value={c} />)}</datalist>
        </div>
        <div className="fg">
          <label className="label">Ville *</label>
          <input value={form.city} onChange={e => up('city', e.target.value)} placeholder="Marrakech" list="cl-cities" />
          <datalist id="cl-cities">{existingCities.map(c => <option key={c} value={c} />)}</datalist>
        </div>
        <div className="fg full">
          <label className="label">Adresse</label>
          <input value={form.address} onChange={e => up('address', e.target.value)} placeholder="12 derb Bab Doukkala" />
        </div>
        <div className="fg full">
          <label className="label">Description / Notes</label>
          <textarea value={form.description} onChange={e => up('description', e.target.value)} placeholder="Impressions, recommandations, horaires, prix…" rows={5} />
        </div>
      </div>

      {/* GPS & Visite */}
      <Section title="Localisation & visite" />
      <div className="form-grid">
        <div className="fg">
          <label className="label">Latitude GPS</label>
          <input value={form.gps.lat} onChange={e => upGps('lat', e.target.value)} placeholder="31.6295" />
        </div>
        <div className="fg">
          <label className="label">Longitude GPS</label>
          <input value={form.gps.lng} onChange={e => upGps('lng', e.target.value)} placeholder="-7.9811" />
        </div>
        <div className="fg">
          <label className="label">Date de visite</label>
          <input type="date" value={form.visitDate} onChange={e => up('visitDate', e.target.value)} />
        </div>
        <div className="fg">
          <label className="label">Note</label>
          <div style={{ paddingTop: 8 }}>
            <Stars value={form.rating} onChange={v => up('rating', v)} />
          </div>
        </div>
      </div>

      {/* Photos */}
      <Section title="Photos (URLs d'images)" />
      <div className="photo-input-row">
        <input value={newPhoto} onChange={e => setNewPhoto(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addPhoto())} placeholder="https://example.com/photo.jpg" />
        <button className="btn btn-sm" type="button" onClick={addPhoto}>Ajouter</button>
      </div>
      {form.photos.length > 0 && (
        <div className="photo-preview" style={{ marginTop: 8 }}>
          {form.photos.map((u, i) => (
            <div key={i} className="photo-prev-item">
              <img className="photo-prev-img" src={u} alt="" onError={e => e.target.style.opacity = '.15'} />
              <button className="photo-prev-del" type="button" onClick={() => removePhoto(i)}>✕</button>
            </div>
          ))}
        </div>
      )}

      {/* Vidéos */}
      <Section title="Vidéos YouTube" />
      <div className="photo-input-row">
        <input value={newVideo} onChange={e => setNewVideo(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addVideo())} placeholder="https://youtube.com/watch?v=…" />
        <button className="btn btn-sm" type="button" onClick={addVideo}>Ajouter</button>
      </div>
      {form.videos.length > 0 && (
        <div style={{ marginTop: 8 }}>
          {form.videos.map((u, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid var(--border)', fontSize: '.82rem', fontFamily: 'var(--font-sans)', color: 'var(--text2)' }}>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u}</span>
              <button onClick={() => removeVideo(i)} type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: '.8rem' }}>✕</button>
            </div>
          ))}
        </div>
      )}

      {/* Tags */}
      <Section title="Tags" />
      <div className="photo-input-row">
        <input value={newTag} onChange={e => setNewTag(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} placeholder="restaurant, plage, riad, incontournable…" />
        <button className="btn btn-sm" type="button" onClick={addTag}>Ajouter</button>
      </div>
      {form.tags.length > 0 && (
        <div className="tags-row" style={{ marginTop: 8 }}>
          {form.tags.map((t, i) => (
            <span key={t} className="tag">{t}<span className="tag-x" onClick={() => removeTag(i)}>✕</span></span>
          ))}
        </div>
      )}

      {/* Actions */}
      <hr className="divider" style={{ marginTop: '1.5rem' }} />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <button className="btn" type="button" onClick={handleCancel}>Annuler</button>
        <button className="btn btn-primary" type="button" onClick={handleSave} disabled={saving}>
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </div>
  )
}
