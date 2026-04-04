'use client'
import { useState } from 'react'

export const fd = (d: string | null) => d ? new Date(d).toLocaleDateString('fr-FR') : ''
export const starsStr = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n)
export const ytEmbed = (u: string) => {
  const m = u.match(/(?:v=|youtu\.be\/)([^&?]+)/)
  return m ? `https://www.youtube.com/embed/${m[1]}` : null
}
export const uniq = <T,>(arr: T[]): T[] => Array.from(new Set(arr))
export const plural = (n: number, s: string, p?: string) => `${n} ${n > 1 ? (p ?? s + 's') : s}`
export const gid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5)

/* Stars */
export function Stars({ value, onChange }: { value: number; onChange?: (n: number) => void }) {
  const [hover, setHover] = useState(0)
  if (!onChange) return <span className="stars-display">{starsStr(value)}</span>
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1,2,3,4,5].map(n => (
        <button
          key={n} type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 16, color: (hover || value) >= n ? 'var(--accent)' : 'var(--line2)',
            padding: 0, lineHeight: 1, transition: 'color .1s',
          }}
        >★</button>
      ))}
    </div>
  )
}

/* Tags display */
export function TagsDisplay({ tags, max = 3 }: { tags: string[]; max?: number }) {
  if (!tags?.length) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
      {tags.slice(0, max).map(t => <span key={t} className="tag">{t}</span>)}
    </div>
  )
}

/* Loading */
export function Loading() {
  return <div className="loading-screen">CHARGEMENT...</div>
}

/* Toast */
export function Toast({ msg }: { msg: string }) {
  return <div className="toast">{msg}</div>
}

/* Lightbox */
export function Lightbox({ photos, index, onClose }: { photos: string[]; index: number; onClose: () => void }) {
  const [idx, setIdx] = useState(index)
  const prev = (e: React.MouseEvent) => { e.stopPropagation(); setIdx(i => (i - 1 + photos.length) % photos.length) }
  const next = (e: React.MouseEvent) => { e.stopPropagation(); setIdx(i => (i + 1) % photos.length) }
  return (
    <div className="lightbox" onClick={onClose}>
      <button className="lb-close" onClick={onClose}>✕</button>
      {photos.length > 1 && <button className="lb-nav lb-prev" onClick={prev}>‹</button>}
      <img className="lb-img" src={photos[idx]} alt="" onClick={e => e.stopPropagation()} onError={e => (e.target as HTMLImageElement).style.opacity = '.2'} />
      {photos.length > 1 && <button className="lb-nav lb-next" onClick={next}>›</button>}
    </div>
  )
}

/* Confirm modal */
export function ConfirmModal({ title, sub, onConfirm, onCancel }: {
  title: string; sub: string; onConfirm: () => void; onCancel: () => void
}) {
  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="serif" style={{ fontSize: 20, fontStyle: 'italic', fontWeight: 300, marginBottom: 10 }}>{title}</div>
        <div style={{ fontSize: 13, color: 'var(--mid)', marginBottom: 24 }}>{sub}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onCancel} className="btn" style={{ flex: 1 }}>Annuler</button>
          <button onClick={onConfirm} className="btn btn-danger" style={{ flex: 1 }}>Supprimer</button>
        </div>
      </div>
    </div>
  )
}
