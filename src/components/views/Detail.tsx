'use client'
import { useState } from 'react'
import type { Lieu, View } from '@/types'
import { Stars, Lightbox, fd, ytEmbed, gid } from '@/components/UI'
import { getCat } from '@/types'

interface Props {
  lieu: Lieu
  onNavigate: (v: View, opts?: Record<string, unknown>) => void
  onUpdate: (id: number, data: Partial<Lieu>) => Promise<void>
  onDelete: (id: number) => void
  onShare: (msg: string) => void
}

function GpsMenu({ lat, lng, onClose }: { lat: string; lng: string; onClose: () => void }) {
  const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent)
  const isAndroid = typeof navigator !== 'undefined' && /Android/.test(navigator.userAgent)

  const apps = [
    { name: 'Google Maps', icon: '🗺', url: `https://maps.google.com/?q=${lat},${lng}`, platforms: ['ios', 'android', 'desktop'] },
    { name: 'Plans', icon: '🍎', url: `https://maps.apple.com/?q=${lat},${lng}&ll=${lat},${lng}`, platforms: ['ios', 'desktop'] },
    { name: 'Waze', icon: '🚗', url: `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`, platforms: ['ios', 'android'] },
    { name: 'Maps.me', icon: '🌍', url: `https://maps.me/?ll=${lat},${lng}&z=16`, platforms: ['android'] },
  ]

  const platform = isIOS ? 'ios' : isAndroid ? 'android' : 'desktop'
  const filtered = apps.filter(a => a.platforms.includes(platform))
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,24,20,.5)', zIndex: 500, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: 'var(--white)', borderRadius: '16px 16px 0 0', padding: '16px 16px 32px', width: '100%', maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div style={{ width: 36, height: 4, background: 'var(--line2)', borderRadius: 2, margin: '0 auto 16px' }} />
        <div style={{ fontSize: 12, color: 'var(--soft)', textAlign: 'center', marginBottom: 12, letterSpacing: 1, textTransform: 'uppercase' }}>Ouvrir avec</div>
        {filtered.map(app => (
          <a key={app.name} href={app.url} target="_blank" rel="noopener" onClick={onClose}
            style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 10, textDecoration: 'none', color: 'var(--text)', border: '1px solid var(--line)', marginBottom: 8, background: 'var(--bg)', fontSize: 15 }}>
            <span style={{ fontSize: 24 }}>{app.icon}</span>
            <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontWeight: 300 }}>{app.name}</span>
            <span style={{ marginLeft: 'auto', color: 'var(--soft)', fontSize: 12 }}>→</span>
          </a>
        ))}
        <button onClick={onClose} style={{ width: '100%', padding: '12px', border: '1px solid var(--line2)', borderRadius: 10, background: 'var(--bg)', color: 'var(--mid)', cursor: 'pointer', fontSize: 14, marginTop: 4 }}>Annuler</button>
      </div>
    </div>
  )
}

export default function Detail({ lieu, onNavigate, onUpdate, onDelete, onShare }: Props) {
  const [tab, setTab] = useState<'info' | 'media' | 'cmt'>('info')
  const [showGpsMenu, setShowGpsMenu] = useState(false)
  const [lb, setLb] = useState<number | null>(null)
  const [newComment, setNewComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingLink, setEditingLink] = useState<{index: number, value: string} | null>(null)

  const cmts = lieu.comments ?? []
  const gpsLink = lieu.gps_lat && lieu.gps_lng ? 'https://maps.google.com/?q=' + lieu.gps_lat + ',' + lieu.gps_lng : null
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://atlas-lieux.vercel.app'
  const shareUrl = origin + '/partager/' + (lieu.slug || lieu.id)

  const buildShareText = () => {
    const parts: string[] = []
    parts.push(lieu.name)
    parts.push(lieu.city + ', ' + lieu.country)
    if (lieu.address) parts.push(lieu.address)
    if (lieu.description) parts.push(lieu.description.slice(0, 200))
    if (lieu.tags?.length) parts.push(lieu.tags.join(' · '))
    return parts.filter(Boolean).join('\n')
  }

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: lieu.name, text: buildShareText(), url: shareUrl }) } catch {}
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

  const handleToggleFavori = async () => {
    await onUpdate(lieu.id, { favori: !lieu.favori })
  }

  const cat = getCat(lieu.categorie)

  return (
    <div>
      {showGpsMenu && lieu.gps_lat && lieu.gps_lng && (
        <GpsMenu lat={lieu.gps_lat} lng={lieu.gps_lng} onClose={() => setShowGpsMenu(false)} />
      )}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ background: 'var(--accent-bg)', color: 'var(--accent)', padding: '2px 10px', borderRadius: 100, fontSize: 11 }}>
              {cat.icon} {cat.label}
            </span>
          </div>
          <div className="serif" style={{ fontSize: 24, fontStyle: 'italic', fontWeight: 300, marginBottom: 4 }}>{lieu.name}</div>
          <p style={{ fontSize: 13, color: 'var(--mid)', marginBottom: 6 }}>{lieu.city} · {lieu.country}</p>
          {lieu.rating > 0 && <Stars value={lieu.rating} />}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
          <button
            className="btn btn-sm"
            onClick={() => onNavigate('form', { editLieu: { country: lieu.country, city: lieu.city } })}
            style={{ color: 'var(--accent)', borderColor: 'var(--accent)' }}
          >
            ＋ Nouvelle fiche
          </button>
          <button className="btn btn-sm" onClick={handleToggleFavori} style={{ color: lieu.favori ? '#E0952A' : 'var(--mid)', borderColor: lieu.favori ? '#E0952A' : undefined }}>
            {lieu.favori ? '★ Favori' : '☆ Favori'}
          </button>
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
          ['media', 'Liens'],
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
              <button className="pill" onClick={() => setShowGpsMenu(true)} style={{ cursor: 'pointer', border: '1px solid var(--line2)', background: 'var(--white)' }}>
                📍 {parseFloat(lieu.gps_lat!).toFixed(5)}, {parseFloat(lieu.gps_lng!).toFixed(5)} → Navigation
              </button>
            )}
            {lieu.visit_date && <span className="pill">🗓 Visite le {fd(lieu.visit_date)}</span>}
            {lieu.address && <span className="pill">🏠 {lieu.address}</span>}
            {(lieu as any).phone && (
              <a href={`tel:${(lieu as any).phone}`} className="pill" style={{ textDecoration: 'none', color: 'var(--text)' }}>
                📞 {(lieu as any).phone}
              </a>
            )}
            {(lieu as any).whatsapp && (
              <a href={`https://wa.me/${(lieu as any).whatsapp.replace(/[^0-9]/g,'')}`} target="_blank" rel="noopener" className="pill" style={{ textDecoration: 'none', color: '#25D366' }}>
                💬 WhatsApp
              </a>
            )}
            {(lieu as any).email && (
              <a href={`mailto:${(lieu as any).email}`} className="pill" style={{ textDecoration: 'none', color: 'var(--text)' }}>
                ✉️ {(lieu as any).email}
              </a>
            )}
            {(lieu as any).website && (
              <a href={(lieu as any).website} target="_blank" rel="noopener" className="pill" style={{ textDecoration: 'none', color: 'var(--accent)' }}>
                🌐 {(lieu as any).website}
              </a>
            )}
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
            ? <div className="empty-state"><div>Aucun lien ajouté</div></div>
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {lieu.videos.map((u, i) => {
                  const em = ytEmbed(u)
                  const isUrl = u.startsWith('http') || u.startsWith('www.')
                  const fullUrl = isUrl ? (u.startsWith('http') ? u : 'https://' + u) : `https://www.google.com/search?q=${encodeURIComponent(u)}`
                  const domain = (() => { try { return new URL(fullUrl).hostname.replace('www.', '') } catch { return u } })()
                  if (editingLink?.index === i) {
                    return (
                      <div key={i} style={{ display: 'flex', gap: 8 }}>
                        <input className="field-input" value={editingLink.value} onChange={e => setEditingLink({ index: i, value: e.target.value })} style={{ flex: 1 }} autoFocus />
                        <button className="btn btn-sm btn-accent" onClick={async () => {
                          const updated = lieu.videos.map((v, j) => j === i ? editingLink.value : v)
                          await onUpdate(lieu.id, { videos: updated })
                          setEditingLink(null)
                        }}>✓</button>
                        <button className="btn btn-sm" onClick={() => setEditingLink(null)}>✕</button>
                      </div>
                    )
                  }
                  return em
                    ? (
                      <div key={i} style={{ position: 'relative' }}>
                        <iframe width="100%" height="240" src={em} frameBorder="0" allowFullScreen style={{ borderRadius: 8, border: '1px solid var(--line)', display: 'block' }} />
                        <div style={{ display: 'flex', gap: 6, marginTop: 6, justifyContent: 'flex-end' }}>
                          <button className="btn btn-sm" onClick={() => setEditingLink({ index: i, value: u })} style={{ fontSize: 11 }}>✏️ Modifier</button>
                          <button className="btn btn-sm btn-danger" onClick={async () => { await onUpdate(lieu.id, { videos: lieu.videos.filter((_, j) => j !== i) }) }} style={{ fontSize: 11 }}>🗑 Supprimer</button>
                        </div>
                      </div>
                    )
                    : (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'var(--bg2)', borderRadius: 10, border: '1px solid var(--line)' }}>
                        <span style={{ fontSize: 20 }}>🔗</span>
                        <a href={fullUrl} target="_blank" rel="noopener" style={{ flex: 1, textDecoration: 'none', color: 'var(--text)', minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--accent)' }}>{domain}</div>
                          <div style={{ fontSize: 11, color: 'var(--soft)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u}</div>
                        </a>
                        <button className="btn btn-sm" onClick={() => setEditingLink({ index: i, value: u })} style={{ fontSize: 11, flexShrink: 0 }}>✏️</button>
                        <button className="btn btn-sm btn-danger" onClick={async () => { await onUpdate(lieu.id, { videos: lieu.videos.filter((_, j) => j !== i) }) }} style={{ fontSize: 11, flexShrink: 0 }}>🗑</button>
                      </div>
                    )
                })}
              </div>
          }
        </div>
      )}

      {tab === 'cmt' && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <textarea className="field-input" value={newComment} onChange={e => setNewComment(e.target.value)}
              placeholder="Ajouter un commentaire, une note..." rows={3} style={{ marginBottom: 8, resize: 'vertical' }} />
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
                    <button onClick={() => handleDeleteComment(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--soft)' }}>Supprimer</button>
                  </div>
                </div>
              ))
          }
        </div>
      )}
    </div>
  )
}