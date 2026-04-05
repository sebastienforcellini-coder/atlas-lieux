'use client'
import { useState } from 'react'
import type { Lieu, View } from '@/types'
import { useCollections, type Collection } from '@/lib/useCollections'
import { CATEGORIES } from '@/types'
import { LieuCard } from './Home'

interface Props {
  lieux: Lieu[]
  onNavigate: (v: View, opts?: Record<string, unknown>) => void
  onDelete: (id: number) => void
}

function CollectionForm({ lieux, initial, onSave, onCancel }: {
  lieux: Lieu[]
  initial?: Collection
  onSave: (title: string, desc: string, ids: number[]) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(initial?.title || '')
  const [desc, setDesc] = useState(initial?.description || '')
  const [selected, setSelected] = useState<number[]>(initial?.lieux_ids || [])

  const toggle = (id: number) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])

  return (
    <div style={{ background: 'var(--bg2)', borderRadius: 12, padding: 16, marginBottom: 16, border: '1px solid var(--line)' }}>
      <div className="label" style={{ marginBottom: 4 }}>Nom de la collection *</div>
      <input className="field-input" value={title} onChange={e => setTitle(e.target.value)}
        placeholder="Nos adresses Marrakech, Restaurants Paris..." style={{ marginBottom: 10 }} />

      <div className="label" style={{ marginBottom: 4 }}>Description</div>
      <input className="field-input" value={desc} onChange={e => setDesc(e.target.value)}
        placeholder="Description courte..." style={{ marginBottom: 12 }} />

      <div className="label" style={{ marginBottom: 8 }}>
        Lieux à inclure ({selected.length} sélectionné{selected.length !== 1 ? 's' : ''})
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 6, maxHeight: 280, overflowY: 'auto', marginBottom: 14 }}>
        {lieux.map(l => (
          <div key={l.id} onClick={() => toggle(l.id)}
            style={{ padding: '8px 10px', borderRadius: 8, cursor: 'pointer', border: '2px solid', borderColor: selected.includes(l.id) ? 'var(--accent)' : 'var(--line)', background: selected.includes(l.id) ? 'var(--accent-bg)' : 'var(--bg)', transition: 'all .15s' }}>
            {l.photos?.[0] && <img src={l.photos[0]} style={{ width: '100%', height: 60, objectFit: 'cover', borderRadius: 5, display: 'block', marginBottom: 5 }} alt="" />}
            <div style={{ fontSize: 12, fontWeight: 500, color: selected.includes(l.id) ? 'var(--accent)' : 'var(--text)', lineHeight: 1.2 }}>{l.name}</div>
            <div style={{ fontSize: 10, color: 'var(--soft)' }}>{l.city}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn" style={{ flex: 1 }} onClick={onCancel}>Annuler</button>
        <button className="btn btn-accent" style={{ flex: 2 }} onClick={() => title.trim() && onSave(title, desc, selected)} disabled={!title.trim() || selected.length === 0}>
          {initial ? 'Enregistrer' : 'Créer la collection'}
        </button>
      </div>
    </div>
  )
}

export default function Collections({ lieux, onNavigate, onDelete }: Props) {
  const { collections, addCollection, updateCollection, deleteCollection } = useCollections()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Collection | null>(null)
  const [open, setOpen] = useState<number | null>(null)
  const [copied, setCopied] = useState<number | null>(null)
  const [filterCat, setFilterCat] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const handleCreate = async (title: string, desc: string, ids: number[]) => {
    await addCollection(title, desc, ids)
    setShowForm(false)
  }

  const handleUpdate = async (title: string, desc: string, ids: number[]) => {
    if (!editing) return
    await updateCollection(editing.id, title, desc, ids)
    setEditing(null)
  }

  const handleShare = (col: Collection) => {
    const url = window.location.origin + '/collection/' + col.slug
    if (navigator.share) {
      navigator.share({ title: col.title, url })
    } else {
      navigator.clipboard?.writeText(url)
      setCopied(col.id)
      setTimeout(() => setCopied(null), 2000)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="serif" style={{ fontSize: 22, fontStyle: 'italic', fontWeight: 300, marginBottom: 3 }}>Collections</div>
          <div style={{ fontSize: 12, color: 'var(--soft)' }}>{collections.length} collection{collections.length !== 1 ? 's' : ''}</div>
        </div>
        <button className="btn btn-accent btn-sm" onClick={() => setShowForm(s => !s)}>+ Nouvelle</button>
      </div>

      {/* Barre de recherche */}
      <div style={{ marginBottom: 12 }}>
        <input className="field-input" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Rechercher un lieu dans les collections..." />
      </div>

      {showForm && <CollectionForm lieux={lieux} onSave={handleCreate} onCancel={() => setShowForm(false)} />}
      {editing && <CollectionForm lieux={lieux} initial={editing} onSave={handleUpdate} onCancel={() => setEditing(null)} />}

      {/* Filtre par catégorie */}
      {lieux.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
          <button onClick={() => setFilterCat(null)}
            style={{ padding: '4px 12px', borderRadius: 100, border: '1px solid', fontSize: 12, cursor: 'pointer', borderColor: !filterCat ? 'var(--accent)' : 'var(--line2)', background: !filterCat ? 'var(--accent-bg)' : 'var(--bg)', color: !filterCat ? 'var(--accent)' : 'var(--mid)' }}>
            Tous
          </button>
          {CATEGORIES.map(c => (
            <button key={c.id} onClick={() => setFilterCat(filterCat === c.id ? null : c.id)}
              style={{ padding: '4px 12px', borderRadius: 100, border: '1px solid', fontSize: 12, cursor: 'pointer', borderColor: filterCat === c.id ? 'var(--accent)' : 'var(--line2)', background: filterCat === c.id ? 'var(--accent-bg)' : 'var(--bg)', color: filterCat === c.id ? 'var(--accent)' : 'var(--mid)' }}>
              {c.icon} {c.label}
            </button>
          ))}
        </div>
      )}

      {collections.length === 0 && !showForm ? (
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Aucune collection</div>
          <div style={{ fontSize: 13, marginBottom: 16 }}>Regroupez vos lieux par voyage, thème ou destination</div>
          <button className="btn btn-accent btn-sm" onClick={() => setShowForm(true)}>+ Créer une collection</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {collections.map(col => {
            const colLieux = lieux.filter(l => col.lieux_ids.includes(l.id) && (!filterCat || l.categorie === filterCat) && (!search || l.name.toLowerCase().includes(search.toLowerCase()) || l.city.toLowerCase().includes(search.toLowerCase())))
            const isOpen = open === col.id
            return (
              <div key={col.id} style={{ border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', background: 'var(--bg2)' }} onClick={() => setOpen(isOpen ? null : col.id)}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 17, fontWeight: 300 }}>{col.title}</div>
                    {col.description && <div style={{ fontSize: 12, color: 'var(--soft)', marginTop: 2 }}>{col.description}</div>}
                    <div style={{ fontSize: 11, color: 'var(--soft)', marginTop: 3 }}>{colLieux.length} lieu{colLieux.length !== 1 ? 'x' : ''}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-sm" onClick={e => { e.stopPropagation(); handleShare(col) }} style={{ fontSize: 12 }}>
                      {copied === col.id ? '✓ Copié' : '🔗 Partager'}
                    </button>
                    <button className="btn btn-sm" onClick={e => { e.stopPropagation(); setEditing(col) }} style={{ fontSize: 12 }}>✏️</button>
                    <button className="btn btn-sm btn-danger" onClick={e => { e.stopPropagation(); if (confirm('Supprimer cette collection ?')) deleteCollection(col.id) }} style={{ fontSize: 12 }}>🗑</button>
                    <span style={{ fontSize: 12, color: 'var(--soft)', alignSelf: 'center' }}>{isOpen ? '▲' : '▼'}</span>
                  </div>
                </div>
                {isOpen && (
                  <div style={{ padding: '12px 16px' }}>
                    {colLieux.length === 0
                      ? <div style={{ fontSize: 13, color: 'var(--soft)' }}>Les lieux de cette collection ont été supprimés.</div>
                      : <div className="grid-cards">
                          {colLieux.map(l => <LieuCard key={l.id} lieu={l} onClick={() => onNavigate('detail', { lieuId: l.id })} onDelete={onDelete} />)}
                        </div>
                    }
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}