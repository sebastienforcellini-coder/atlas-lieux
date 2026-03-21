'use client'
import { useState } from 'react'
import type { Lieu, View } from '@/types'
import { LieuCard } from './Home'

interface Props {
  lieux: Lieu[]
  onNavigate: (v: View, opts?: Record<string, unknown>) => void
}

export default function AllLieux({ lieux, onNavigate }: Props) {
  const [q, setQ] = useState('')

  const filtered = q
    ? lieux.filter(l =>
        [l.name, l.country, l.city, l.description ?? '', ...l.tags]
          .join(' ').toLowerCase().includes(q.toLowerCase())
      )
    : lieux

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="serif" style={{ fontSize: 22, fontStyle: 'italic', fontWeight: 300, marginBottom: 3 }}>Tous les lieux</div>
          <div style={{ fontSize: 12, color: 'var(--soft)' }}>{filtered.length} résultat{filtered.length !== 1 ? 's' : ''}</div>
        </div>
        <button className="btn btn-accent btn-sm" onClick={() => onNavigate('form', { editLieu: null })}>+ Nouveau</button>
      </div>

      <input
        className="field-input"
        type="search"
        placeholder="Rechercher nom, ville, pays, tag…"
        value={q}
        onChange={e => setQ(e.target.value)}
        style={{ marginBottom: 16, borderRadius: 100, paddingLeft: 14 }}
        autoFocus
      />

      {filtered.length === 0
        ? <div className="empty-state"><div>Aucun résultat pour « {q} »</div></div>
        : <div className="grid-cards">
            {filtered.map(l => <LieuCard key={l.id} lieu={l} onClick={() => onNavigate('detail', { lieuId: l.id })} />)}
          </div>
      }
    </div>
  )
}
