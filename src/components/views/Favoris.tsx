'use client'
import type { Lieu, View } from '@/types'
import { LieuCard } from './Home'

interface Props {
  lieux: Lieu[]
  onNavigate: (v: View, opts?: Record<string, unknown>) => void
  onDelete: (id: number) => void
}

export default function Favoris({ lieux, onNavigate, onDelete }: Props) {
  const favoris = lieux.filter(l => l.favori)

  return (
    <div>
      <div style={{ textAlign: 'center', padding: '2rem 0 1.5rem', borderBottom: '1px solid var(--line)', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>★</div>
        <div className="serif" style={{ fontSize: 26, fontStyle: 'italic', fontWeight: 300, color: 'var(--text)' }}>Favoris</div>
        <div style={{ fontSize: 12, color: 'var(--soft)', marginTop: 4 }}>{favoris.length} lieu{favoris.length !== 1 ? 'x' : ''} favori{favoris.length !== 1 ? 's' : ''}</div>
      </div>

      {favoris.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">☆</div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Aucun favori</div>
          <div style={{ fontSize: 13 }}>Marquez des lieux comme favoris depuis leur fiche</div>
        </div>
      ) : (
        <div className="grid-cards">
          {favoris.map(l => <LieuCard key={l.id} lieu={l} onClick={() => onNavigate('detail', { lieuId: l.id })} onDelete={onDelete} />)}
        </div>
      )}
    </div>
  )
}
