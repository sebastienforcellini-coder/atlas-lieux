'use client'
import { useState } from 'react'
import type { Lieu, View } from '@/types'
import { Stars, Lightbox, fd, ytEmbed, gid } from '@/components/UI'

interface Props {
  lieu: Lieu
  onNavigate: (v: View, opts?: Record<string, unknown>) => void
  onUpdate: (id: number, data: Partial<Lieu>) => Promise<void>
  onDelete: (id: number) => void
  onShare: (msg: string) => void
}

export default function Detail({ lieu, onNavigate, onUpdate, onDelete, onShare }: Props) {
  const [tab, setTab] = useState<'info' | 'media' | 'cmt'>('info')
  const [lb, setLb] = useState<number | null>(null)
  const [newComment, setNewComment] = useState('')
  const [saving, setSaving] = useState(false)

  const cmts = lieu.comments ?? []
  const gpsLink = lieu.gps_lat && lieu.gps_lng
    ? `https://maps.google.com/?q=${lieu.gps_lat},${lieu.gps_lng}` : null

  const handleAddComment = async () => {
    const text = newComment.trim()
    if (!text) return
    setSaving(true)
    const updated = [...cmts, { id: gid(), text, date: new Date().toISOString() }]
    await onUpdate(lieu.id, { comments: updated })
    setNewComment('')
    setSaving(false)
  }

  const handleDeleteComment = async (cid: string) => {
    await onUpdate(lieu.id, { comments: cmts.filter(c => c.id !== cid) })
  }

  const shareUrl = (typeof window !== 'undefined' ? window.location.origin : 'https://atlas-lieux.vercel.app') + '/partager/' + lieu.id

  const handleShare = () => {
    const url = shareUrl
    navigator.clipboard?.writeText(url)
    onShare('Lien de partage copié !')
  }

  const handleShareText = () => {
    const lines = [
      '📍 ' + lieu.name,
      lieu.city + ', ' + lieu.country,
      lieu.address ?? '',
      lieu.description ? lieu.description : '',
      gpsLink ? 'GPS : ' + lieu.gps_lat + ', ' + lieu.gps_lng : '',
      lieu.tags?.length ? 'Tags : ' + lieu.tags.join(', ') : '',
      '🔗 ' + shareUrl,
    ].filter(Boolean).join('
')
    navigator.clipboard?.writeText(lines)
    onShare('Fiche copiée dans le presse-papier !')
  }

  return (
    <div>
      {lb !== null && <Lightbox photos={lieu.photos} index={lb} onClose={() => setLb(null)} />}

      <nav className="bc">
        <span className="bc-link" onClick={() => onNavigate('home')}>Accueil</span>
        <span className="bc-sep">›</span>
        <span className="bc-link" onClick={() => onNavigate('country', { country: lieu.country })}>{lieu.country}</span>
        <span className="bc-sep">›</span>
        <span className="bc-link" onClick={() => onNavigate('city', { country: lieu.country, city: lieu.city })}>{lieu.city}</span>
        <span className="bc-sep">›</span>
        <span className="bc-cur">{lieu.name}</span>
      </nav>

      <div className="page-header">
        <div>
          <div className="serif" style={{ fontSize: 24, fontStyle: 'italic', fontWeight: 300, marginBottom: 4 }}>{lieu.name}</div>
          <div style={{ fontSize: 13, color: 'var(--mid)', marginBottom: 6 }}>{lieu.city} · {lieu.country}</div>
          {lieu.rating > 0 && <Stars value={lieu.rating} />}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
          <>
          <button className="btn btn-sm" onClick={handleShare}>🔗 Lien</button>
          <button className="btn btn-sm" onClick={handleShareText}>📋 Texte</button>
        </>
          <button className="btn btn-sm" onClick={() => onNavigate('form', { editLieu: lieu })}>Modifier</button>
          <button className="btn btn-sm btn-danger" onClick={() => onDelete(lieu.id)}>Supprimer</button>
        </div>
      </div>

      {lieu.photos?.length > 0 && (
        <div className="photo-grid">
          {lieu.photos.map((u, i) => (
            <img key={i} className="photo-th" src={u} alt="" onClick={() => setLb(i)}
              onError={e => (e.target as HTMLImageElement).style.opacity = '.15'} />
          ))}
        </div>
      )}

      <div className="tab-row">
        {([
          ['info', 'Infos'],
          ['media', 'Médias'],
          ['cmt', `Commentaires${cmts.length ? ` (${cmts.length})` : ''}`],
        ] as const).map(([k, l]) => (
          <button key={k} className={`tab${tab === k ? ' on' : ''}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === 'info' && (
        <div>
          {lieu.description && (
            <p style={{ fontSize: 13, lineHeight: 1.8, whiteSpace: 'pre-wrap', marginBottom: 16 }}>{lieu.description}</p>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {gpsLink && (
              <a className="pill" href={gpsLink} target="_blank" rel="noopener">
                📍 {parseFloat(lieu.gps_lat!).toFixed(5)}, {parseFloat(lieu.gps_lng!).toFixed(5)} → Maps
              </a>
            )}
            {lieu.visit_date && <span className="pill">🗓 Visité le {fd(lieu.visit_date)}</span>}
            {lieu.address && <span className="pill">🏠 {lieu.address}</span>}
          </div>
          {lieu.tags?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 16 }}>
              {lieu.tags.map(t => <span key={t} className="tag">{t}</span>)}
            </div>
          )}
          <div style={{ fontSize: 11, color: 'var(--soft)' }}>
            Créé le {fd(lieu.created_at)}{lieu.updated_at ? ` · Modifié le ${fd(lieu.updated_at)}` : ''}
          </div>
        </div>
      )}

      {tab === 'media' && (
        <div>
          {!lieu.videos?.length
            ? <div className="empty-state"><div>Aucune vidéo ajoutée</div></div>
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {lieu.videos.map((u, i) => {
                  const em = ytEmbed(u)
                  return em
                    ? <iframe key={i} width="100%" height="240" src={em} frameBorder="0" allowFullScreen
                        style={{ borderRadius: 8, border: '1px solid var(--line)' }} />
                    : <a key={i} className="pill" href={u} target="_blank" rel="noopener" style={{ display: 'inline-flex' }}>{u}</a>
                })}
              </div>
          }
        </div>
      )}

      {tab === 'cmt' && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <textarea
              className="field-input"
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="Ajouter un commentaire, une note…"
              rows={3}
              style={{ marginBottom: 8, resize: 'vertical' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary btn-sm" onClick={handleAddComment} disabled={saving}>
                {saving ? 'Enregistrement…' : 'Ajouter'}
              </button>
            </div>
          </div>
          {cmts.length === 0
            ? <div className="empty-state"><div>Aucun commentaire pour l'instant</div></div>
            : cmts.map(c => (
                <div key={c.id} className="comment-box">
                  <p className="comment-text">{c.text}</p>
                  <div className="comment-meta">
                    <span>{fd(c.date)}</span>
                    <button
                      onClick={() => handleDeleteComment(c.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--soft)' }}
                    >Supprimer</button>
                  </div>
                </div>
              ))
          }
        </div>
      )}
    </div>
  )
}
