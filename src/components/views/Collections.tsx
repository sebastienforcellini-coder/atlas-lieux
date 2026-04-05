'use client'
import { useState, useRef } from 'react'
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
  const [formSearch, setFormSearch] = useState('')
  const [showEmojiTitle, setShowEmojiTitle] = useState(false)
  const [showEmojiDesc, setShowEmojiDesc] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)
  const descRef = useRef<HTMLInputElement>(null)


  const EmojiPalette = ({ onPick }: { onPick: (e: string) => void }) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: 8, background: 'var(--bg)', border: '1px solid var(--line2)', borderRadius: 8, marginBottom: 6, maxHeight: 120, overflowY: 'auto' }}>
      {['⭐', '🌟', '💫', '✨', '🔥', '❤️', '💛', '💚', '💙', '💜', '🎉', '👍', '👌', '🙌', '💪', '😎', '🤩', '😍', '🥰', '😋', '🍽', '☕', '🍷', '🍸', '🥂', '🫖', '🍵', '🍊', '🍋', '🥘', '🧆', '🥙', '🌯', '🫕', '🌶', '🫒', '🌿', '🌺', '🌸', '🌴', '🌵', '🌾', '🏖', '🏔', '🏜', '🌅', '🌋', '🗺', '📍', '🚗', '🚶', '🏃', '🏄', '🤿', '🚴', '🧘', '🏊', '🐪', '🦁', '🐠', '🦋', '💆', '🛍', '🎨', '🎭', '🎪', '🎬', '🎥', '📸', '🎵', '🎶', '🎸', '🎺', '🥁', '🪘', '🎤', '🏛', '⛩', '🕌', '🕍', '💒', '🗿', '🪔', '🧿', '🪬', '🏠', '🏡', '🌙', '☀️', '🌈', '❄️', '🌊', '💰', '💎', '🔑', '📞', '💬', '📧', '🌐', '⏰', '📅', '🗓', '✅', '❌', '⚠️', '💡', '🔍', '📝', '🎁', '🏆', '🥇', '🎲', '♟', '🧩', '🪭', '🧣', '👒'].map((e: string) => (
        <button key={e} type="button" onClick={() => onPick(e)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, padding: 2, borderRadius: 4 }}>
          {e}
        </button>
      ))}
    </div>
  )

  const insertEmoji = (val: string, setter: (v: string) => void, ref: React.RefObject<HTMLInputElement>, emoji: string) => {
    const el = ref.current
    const pos = el ? (el.selectionStart ?? val.length) : val.length
    setter(val.slice(0, pos) + emoji + val.slice(pos))
    setTimeout(() => { if (el) { el.focus(); el.setSelectionRange(pos + emoji.length, pos + emoji.length) } }, 0)
  }

  const toggle = (id: number) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])

  // Lieux déjà sélectionnés en haut, puis les autres, filtrés par recherche
  const filtered = lieux.filter(l =>
    !formSearch ||
    l.name.toLowerCase().includes(formSearch.toLowerCase()) ||
    l.city.toLowerCase().includes(formSearch.toLowerCase())
  )
  const sortedLieux = [
    ...filtered.filter(l => selected.includes(l.id)),
    ...filtered.filter(l => !selected.includes(l.id)),
  ]

  return (
    <div style={{ background: 'var(--bg2)', borderRadius: 12, padding: 16, marginBottom: 16, border: '1px solid var(--line)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div className="label" style={{ marginBottom: 0 }}>Nom de la collection *</div>
        <button type="button" onClick={() => setShowEmojiTitle(s => !s)} style={{ background: 'none', border: '1px solid var(--line2)', borderRadius: 8, padding: '2px 7px', cursor: 'pointer', fontSize: 15 }}>😊</button>
      </div>
      {showEmojiTitle && <EmojiPalette onPick={e => insertEmoji(title, setTitle, titleRef, e)} />}
      <input ref={titleRef} className="field-input" value={title} onChange={e => setTitle(e.target.value)}
        placeholder="Nos adresses Marrakech, Restaurants Paris..." style={{ marginBottom: 10 }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div className="label" style={{ marginBottom: 0 }}>Description</div>
        <button type="button" onClick={() => setShowEmojiDesc(s => !s)} style={{ background: 'none', border: '1px solid var(--line2)', borderRadius: 8, padding: '2px 7px', cursor: 'pointer', fontSize: 15 }}>😊</button>
      </div>
      {showEmojiDesc && <EmojiPalette onPick={e => insertEmoji(desc, setDesc, descRef, e)} />}
      <input ref={descRef} className="field-input" value={desc} onChange={e => setDesc(e.target.value)}
        placeholder="Description courte..." style={{ marginBottom: 12 }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div className="label" style={{ marginBottom: 0 }}>
          Lieux à inclure ({selected.length} sélectionné{selected.length !== 1 ? 's' : ''})
        </div>
        <button type="button" className="btn btn-sm"
          onClick={() => setSelected(selected.length === lieux.length ? [] : lieux.map(l => l.id))}
          style={{ fontSize: 11 }}>
          {selected.length === lieux.length ? '☐ Tout désélectionner' : '☑ Tout sélectionner'}
        </button>
      </div>

      {/* Recherche dans le formulaire */}
      <input className="field-input" value={formSearch} onChange={e => setFormSearch(e.target.value)}
        placeholder="🔍 Rechercher un lieu..." style={{ marginBottom: 8 }} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 6, maxHeight: 280, overflowY: 'auto', marginBottom: 14 }}>
        {sortedLieux.map(l => (
          <div key={l.id} onClick={() => toggle(l.id)}
            style={{ padding: '8px 10px', borderRadius: 8, cursor: 'pointer', border: '2px solid', borderColor: selected.includes(l.id) ? 'var(--accent)' : 'var(--line)', background: selected.includes(l.id) ? 'var(--accent-bg)' : 'var(--bg)', transition: 'all .15s', position: 'relative' }}>
            {l.photos?.[0] && <img src={l.photos[0]} style={{ width: '100%', height: 60, objectFit: 'cover', borderRadius: 5, display: 'block', marginBottom: 5 }} alt="" />}
            {selected.includes(l.id) && (
              <div style={{ position: 'absolute', top: 6, right: 6, background: 'var(--accent)', borderRadius: 100, width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff' }}>✓</div>
            )}
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
            const colLieux = lieux.filter(l =>
              col.lieux_ids.includes(l.id) &&
              (!filterCat || l.categorie === filterCat) &&
              (!search || l.name.toLowerCase().includes(search.toLowerCase()) || l.city.toLowerCase().includes(search.toLowerCase()))
            )
            const isOpen = open === col.id

            // Grouper par catégorie
            const catGroups = CATEGORIES
              .map(c => ({ cat: c, items: colLieux.filter(l => l.categorie === c.id) }))
              .filter(g => g.items.length > 0)

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
                      ? <div style={{ fontSize: 13, color: 'var(--soft)' }}>Aucun lieu trouvé.</div>
                      : filterCat
                        // Si filtre actif → affichage plat
                        ? <div className="grid-cards">
                            {colLieux.map(l => <LieuCard key={l.id} lieu={l} onClick={() => onNavigate('detail', { lieuId: l.id })} onDelete={onDelete} />)}
                          </div>
                        // Par défaut → groupé par catégorie
                        : <div>
                            {catGroups.map(({ cat, items }) => (
                              <div key={cat.id} style={{ marginBottom: 20 }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--mid)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span>{cat.icon}</span>
                                  <span style={{ textTransform: 'uppercase', letterSpacing: 1 }}>{cat.label}</span>
                                  <span style={{ color: 'var(--soft)', fontWeight: 400 }}>({items.length})</span>
                                </div>
                                <div className="grid-cards">
                                  {items.map(l => <LieuCard key={l.id} lieu={l} onClick={() => onNavigate('detail', { lieuId: l.id })} onDelete={onDelete} />)}
                                </div>
                              </div>
                            ))}
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