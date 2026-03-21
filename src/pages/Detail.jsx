import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { usePlaces } from '../hooks/usePlaces'
import { useToast } from '../hooks/useToast'
import { Breadcrumb, Stars, Loading, Lightbox, fd, ytEmbed, gid } from '../components/UI'

export default function Detail() {
  const { id } = useParams()
  const nav = useNavigate()
  const { places, loading, updatePlace, deletePlace } = usePlaces()
  const showToast = useToast()
  const [tab, setTab] = useState('info')
  const [lb, setLb] = useState(null)
  const [newComment, setNewComment] = useState('')
  const [saving, setSaving] = useState(false)

  if (loading) return <Loading />

  const place = places.find(p => p.id === id)
  if (!place) return (
    <div className="page">
      <div className="empty-state">
        <div className="empty-icon">🗺</div>
        <div className="empty-title">Lieu introuvable</div>
        <Link className="btn" to="/" style={{ marginTop: '1rem' }}>Retour à l'accueil</Link>
      </div>
    </div>
  )

  const cmts = place.comments || []
  const gpsLink = place.gps?.lat && place.gps?.lng
    ? `https://maps.google.com/?q=${place.gps.lat},${place.gps.lng}` : null

  const handleDelete = async () => {
    if (!confirm('Supprimer ce lieu définitivement ?')) return
    await deletePlace(place.id)
    nav('/')
  }

  const handleAddComment = async () => {
    const text = newComment.trim()
    if (!text) return
    setSaving(true)
    const updated = [...cmts, { id: gid(), text, date: new Date().toISOString() }]
    await updatePlace(place.id, { ...place, comments: updated })
    setNewComment('')
    setSaving(false)
  }

  const handleDeleteComment = async (cid) => {
    const updated = cmts.filter(c => c.id !== cid)
    await updatePlace(place.id, { ...place, comments: updated })
  }

  const handleShare = () => {
    const lines = [
      `📍 ${place.name}`,
      `${place.city}, ${place.country}`,
      place.address ? place.address : '',
      place.description ? `\n${place.description}` : '',
      gpsLink ? `\nGPS: ${place.gps.lat}, ${place.gps.lng}\n${gpsLink}` : '',
      place.tags?.length ? `\nTags : ${place.tags.join(', ')}` : '',
    ].filter(Boolean).join('\n')
    navigator.clipboard?.writeText(lines)
    showToast('Fiche copiée dans le presse-papier !')
  }

  return (
    <div className="page">
      {lb !== null && <Lightbox photos={place.photos} index={lb} onClose={() => setLb(null)} />}

      <Breadcrumb items={[
        { l: 'Accueil', to: '/' },
        { l: place.country, to: `/pays/${encodeURIComponent(place.country)}` },
        { l: place.city, to: `/pays/${encodeURIComponent(place.country)}/ville/${encodeURIComponent(place.city)}` },
        { l: place.name },
      ]} />

      <div className="detail-header">
        <div>
          <h1 className="detail-title">{place.name}</h1>
          <p className="detail-loc">{place.city} · {place.country}</p>
          {place.rating > 0 && <Stars value={place.rating} />}
        </div>
        <div className="detail-actions">
          <button className="btn btn-sm" onClick={handleShare}>Partager</button>
          <Link className="btn btn-sm" to={`/lieu/${place.id}/modifier`}>Modifier</Link>
          <button className="btn btn-sm btn-danger" onClick={handleDelete}>Supprimer</button>
        </div>
      </div>

      {place.photos?.length > 0 && (
        <div className="photo-grid" style={{ marginBottom: '1.25rem' }}>
          {place.photos.map((u, i) => (
            <img key={i} className="photo-th" src={u} alt="" onClick={() => setLb(i)} onError={e => e.target.style.opacity = '.15'} />
          ))}
        </div>
      )}

      <div className="tab-row">
        {[['info', 'Infos'], ['media', 'Médias'], ['cmt', `Commentaires${cmts.length ? ` (${cmts.length})` : ''}`]].map(([k, l]) => (
          <button key={k} className={`tab${tab === k ? ' on' : ''}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === 'info' && (
        <div>
          {place.description && (
            <p style={{ fontSize: '.95rem', lineHeight: 1.8, whiteSpace: 'pre-wrap', marginBottom: '1.25rem' }}>{place.description}</p>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: '1rem' }}>
            {gpsLink && (
              <a className="pill" href={gpsLink} target="_blank" rel="noopener">
                📍 {parseFloat(place.gps.lat).toFixed(5)}, {parseFloat(place.gps.lng).toFixed(5)} → Maps
              </a>
            )}
            {place.visitDate && <span className="pill">🗓 Visité le {fd(place.visitDate)}</span>}
            {place.address && <span className="pill">🏠 {place.address}</span>}
          </div>
          {place.tags?.length > 0 && (
            <div className="tags-row" style={{ marginBottom: '1.25rem' }}>
              {place.tags.map(t => <span key={t} className="tag">{t}</span>)}
            </div>
          )}
          <p style={{ fontSize: '.75rem', color: 'var(--text3)', fontFamily: 'var(--font-sans)' }}>
            Créé le {fd(place.createdAt)}{place.updatedAt ? ` · Modifié le ${fd(place.updatedAt)}` : ''}
          </p>
        </div>
      )}

      {tab === 'media' && (
        <div>
          {!place.videos?.length
            ? <div className="empty-state"><div className="empty-sub">Aucune vidéo ajoutée</div></div>
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {place.videos.map((u, i) => {
                  const em = ytEmbed(u)
                  return em
                    ? <iframe key={i} width="100%" height="240" src={em} frameBorder="0" allowFullScreen style={{ borderRadius: 'var(--radius)', border: '1px solid var(--border)' }} />
                    : <a key={i} className="pill" href={u} target="_blank" rel="noopener" style={{ display: 'inline-flex', marginBottom: 4 }}>{u}</a>
                })}
              </div>}
        </div>
      )}

      {tab === 'cmt' && (
        <div>
          <div style={{ marginBottom: '1.25rem' }}>
            <textarea
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="Ajouter un commentaire, une note…"
              rows={3}
              style={{ marginBottom: 6 }}
              onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) handleAddComment() }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary btn-sm" onClick={handleAddComment} disabled={saving}>
                {saving ? 'Enregistrement…' : 'Ajouter'}
              </button>
            </div>
          </div>
          {cmts.length === 0
            ? <div className="empty-state"><div className="empty-sub">Aucun commentaire pour l'instant</div></div>
            : cmts.map(c => (
                <div key={c.id} className="comment-box">
                  <p className="comment-text">{c.text}</p>
                  <div className="comment-meta">
                    <span>{fd(c.date)}</span>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '.75rem', color: 'var(--text3)', fontFamily: 'var(--font-sans)' }} onClick={() => handleDeleteComment(c.id)}>
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
        </div>
      )}
    </div>
  )
}
