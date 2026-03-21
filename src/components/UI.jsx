import { useState } from 'react'
import { Link } from 'react-router-dom'

// ---- Helpers ----
export const fd = d => d ? new Date(d).toLocaleDateString('fr-FR') : ''
export const starsStr = n => '★'.repeat(n) + '☆'.repeat(5 - n)
export const ytEmbed = u => {
  const m = String(u || '').match(/(?:v=|youtu\.be\/)([^&?]+)/)
  return m ? `https://www.youtube.com/embed/${m[1]}` : null
}
export const gid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5)
export const uniq = arr => [...new Set(arr)]
export const plural = (n, s, p) => `${n} ${n > 1 ? (p || s + 's') : s}`

// ---- Breadcrumb ----
export function Breadcrumb({ items }) {
  return (
    <nav className="bc">
      {items.map((it, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {i > 0 && <span className="bc-sep">›</span>}
          {it.to
            ? <Link className="bc-link" to={it.to}>{it.l}</Link>
            : <span className="bc-cur">{it.l}</span>}
        </span>
      ))}
    </nav>
  )
}

// ---- Stars ----
export function Stars({ value, onChange }) {
  const [hover, setHover] = useState(0)
  if (!onChange) return (
    <span className="stars-display" title={`${value}/5`}>{starsStr(value)}</span>
  )
  return (
    <div className="stars">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n} type="button"
          className={`star${(hover || value) >= n ? ' on' : ''}`}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
        >★</button>
      ))}
    </div>
  )
}

// ---- Tags display ----
export function TagsDisplay({ tags, max = 4 }) {
  if (!tags?.length) return null
  return (
    <div className="tags-row" style={{ marginTop: 6 }}>
      {tags.slice(0, max).map(t => <span key={t} className="tag">{t}</span>)}
    </div>
  )
}

// ---- Place Card ----
export function PlaceCard({ place }) {
  return (
    <Link className="place-card" to={`/lieu/${place.id}`}>
      {place.photos?.[0]
        ? <img className="card-img" src={place.photos[0]} alt="" onError={e => e.target.style.opacity = '.15'} />
        : <div className="card-img-ph">Pas de photo</div>}
      <div className="card-body">
        <div className="card-name">{place.name}</div>
        <div className="card-sub">{place.city} · {place.country}</div>
        {place.rating > 0 && <Stars value={place.rating} />}
        <TagsDisplay tags={place.tags} />
      </div>
    </Link>
  )
}

// ---- Cat Card ----
export function CatCard({ title, sub, to, onClick }) {
  if (to) return (
    <Link className="cat-card" to={to}>
      <div className="cat-name">{title}</div>
      <div className="cat-sub">{sub}</div>
    </Link>
  )
  return (
    <div className="cat-card" onClick={onClick}>
      <div className="cat-name">{title}</div>
      <div className="cat-sub">{sub}</div>
    </div>
  )
}

// ---- Loading ----
export function Loading() {
  return (
    <div className="loading">
      <div className="spinner" />
      Chargement…
    </div>
  )
}

// ---- Lightbox ----
export function Lightbox({ photos, index, onClose }) {
  const [idx, setIdx] = useState(index)
  const prev = e => { e.stopPropagation(); setIdx(i => (i - 1 + photos.length) % photos.length) }
  const next = e => { e.stopPropagation(); setIdx(i => (i + 1) % photos.length) }

  return (
    <div className="lightbox" onClick={onClose}>
      <button className="lb-close" onClick={onClose}>✕</button>
      {photos.length > 1 && <button className="lb-nav lb-prev" onClick={prev}>‹</button>}
      <img className="lb-img" src={photos[idx]} alt="" onClick={e => e.stopPropagation()} onError={e => e.target.style.opacity = '.15'} />
      {photos.length > 1 && <button className="lb-nav lb-next" onClick={next}>›</button>}
    </div>
  )
}
