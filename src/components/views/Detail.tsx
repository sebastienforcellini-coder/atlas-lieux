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
    ? 'https://maps.google.com/?q=' + lieu.gps_lat + ',' + lieu.gps_lng : null

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://atlas-lieux.vercel.app'
  const shareUrl = origin + '/partager/' + lieu.id

  const buildShareText = () => {
    const parts: string[] = []
    parts.push(lieu.name)
    parts.push(lieu.city + ', ' + lieu.country)
    if (lieu.address) parts.push(lieu.address)
    if (lieu.description) parts.push(lieu.description)
    if (gpsLink) parts.push('GPS : ' + lieu.gps_lat + ', ' + lieu.gps_lng)
    if (lieu.tags?.length) parts.push('Tags : ' + lieu.tags.join(', '))
    return parts.join('\n')
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: lieu.name,
          text: buildShareText(),
          url: shareUrl,
        })
      } catch {
        // user cancelled, do nothing
      }
    } else {
      navigator.clipboard?.writeText(shareUrl)
      onShare('Lien copie dans le presse-papier !')
    }
  }

  const handleShareLink = () => {
    navigator.clipboard?.writeText(shareUrl)
    onShare('Lien copie dans le presse-papier !')
  }

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
          <p style={{ fontSize: 13, color: 'var(--mid)', marginBottom: 6 }}>{lieu.city} · {lieu.country}</p>
          {lieu.rating > 0 && <Stars value={lieu.rating} />}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
          <button className="btn btn-sm btn-accent" onClick={handleShare}>Partager</button>
          <button className="btn btn-sm" onClick={() => onNavigate('form', { editLieu: lieu })}>Modifier</button>
          <button className="btn btn-sm btn-danger" onClick={() => onDelete(lieu.id)}>Supprimer</button>
        </div>
      </div>

      {lieu.photos?.length > 0 && (
        <div className="photo-grid" style={{ marginBottom: '1.25rem' }}>
          {lieu.photos.map((u, i) => (
            <img key={i} className="photo-th" src={u} alt="" onClick={() => setLb(i)}
              onError={e => (e.target as HTMLImageElement).style.opacity = '.15'} />
          ))}
        </div>
      )}

      <div className="tab-row">
        {([
          ['info', 'Infos'],
          ['media', 'Medias'],
          ['cmt', 'Commentaires' + (cmts.length ? ' (' + cmts.length + ')' : '')],
        ] as const).map(([k, l]) => (
          <button key={k} className={'tab' + (tab === k ? ' on' : '')} onClick={() => setTab(k)}>{l}</button>
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
            {lieu.visit_date && <span className="pill">🗓 Visite le {fd(lieu.visit_date)}</span>}
            {lieu.address && <span className="pill">🏠 {lieu.address}</span>}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
            {lieu.tags?.map(t => <span key={t} className="tag">{t}</span>)}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '10px 12px', background: 'var(--bg2)', borderRadius: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 11, color: 'var(--soft)', flex: 1 }}>Lien de partage</span>
            <code style={{ fontSize: 10, color: 'var(--mid)', flex: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shareUrl}</code>
            <button className="btn btn-sm" onClick={handleShareLink}>Copier</button>
          </div>
          <p style={{ fontSize: 11, color: 'var(--soft)' }}>
            Cree le {fd(lieu.created_at)}{lieu.updated_at ? ' · Modifie le ' + fd(lieu.updated_at) : ''}
          </p>
        </div>
      )}

      {tab === 'media' && (
        <div>
          {!lieu.videos?.length
            ? <div className="empty-state"><div>Aucune video ajoutee</div></div>
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
              placeholder="Ajouter un commentaire, une note..."
              rows={3}
              style={{ marginBottom: 8, resize: 'vertical' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary btn-sm" onClick={handleAddComment} disabled={saving}>
                {saving ? 'Enregistrement...' : 'Ajouter'}
              </button>
            </div>
          </div>
          {cmts.length === 0
            ? <div className="empty-state"><div>Aucun commentaire pour l instant</div></div>
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
