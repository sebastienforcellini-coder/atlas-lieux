'use client'
import { useState } from 'react'
import { useCategories } from '@/lib/useCategories'
import type { View } from '@/types'

const EMOJI_SUGGESTIONS = [
  // Visages & expressions
  '😎','🤩','😍','🥰','😋','🎉','👍','👌','🙌','💪',
  // Nourriture & boissons
  '🍽','☕','🍷','🍸','🥂','🫖','🍵','🍊','🍋','🥘','🧆','🥙','🌯','🫕','🌶','🫒','🍕','🍜','🍣','🥗','🧁','🍰','🎂',
  // Nature & paysages
  '🌿','🌺','🌸','🌴','🌵','🌾','🏖','🏔','🏜','🌅','🌋','🌊','🌙','☀️','🌈','❄️',
  // Lieux & bâtiments
  '🏛','⛩','🕌','🕍','💒','🗿','🛕','🏟','🎡','🎢','🏠','🏡',
  // Transport & voyage
  '🗺','📍','🚗','🚶','🏃','🏄','🤿','🚴','🧘','🏊','🏇','🪂','🧗','⛵',
  // Animaux
  '🐪','🦁','🐠','🦋',
  // Sport & loisirs
  '⚽','🎨','🎭','🎪','🎬','🎥','📸','🎵','🎶','🎸','🎺','🥁','🪘','🎤','🎻','🎹','🎠','🎯','🎳','🎰','🧩','♟','🎲',
  // Déco & ameublement
  '🛋','🪑','🛏','🚿','🛁','🪟','🚪','🧹','🧺','🧼','🪞','🖼','🕰','🪴','🏺','🧸','🪆','🎀','🛒',
  // Objets & divers
  '💰','💎','🔑','📞','💬','📧','🌐','⏰','📅','🗓','✅','❌','⚠️','💡','🔍','📝','🎁','🏆','🥇',
  '🪔','🧿','🪬','🪭','🧣','👒','🧋',
]

interface Props {
  onNavigate: (v: View, opts?: Record<string, unknown>) => void
}

export default function CategoriesView({ onNavigate }: Props) {
  const { categories, loading, addCategory, deleteCategory } = useCategories()
  const [newLabel, setNewLabel] = useState('')
  const [newIcon, setNewIcon] = useState('📍')
  const [newId, setNewId] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showEmojis, setShowEmojis] = useState(false)

  const handleAdd = async () => {
    setError('')
    const label = newLabel.trim()
    const toId = (s: string) => s
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // supprimer accents
      .replace(/[^a-z0-9]+/g, '_') // remplacer caractères spéciaux par _
      .replace(/^_+|_+$/g, '') // supprimer _ en début/fin
    const id = newId.trim() ? toId(newId.trim()) : toId(label)

    if (!label) { setError('Le nom est obligatoire.'); return }
    if (categories.find(c => c.id === id)) { setError('Un identifiant identique existe déjà.'); return }

    setSaving(true)
    const ok = await addCategory({ id, label, icon: newIcon })
    setSaving(false)
    if (ok) {
      setNewLabel(''); setNewIcon('📍'); setNewId(''); setShowEmojis(false)
    } else {
      setError('Erreur lors de la création.')
    }
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <div className="page-header">
        <div>
          <div className="serif" style={{ fontSize: 22, fontStyle: 'italic', fontWeight: 300 }}>
            Catégories
          </div>
          <div style={{ fontSize: 12, color: 'var(--soft)', marginTop: 3 }}>
            Gérez les catégories disponibles lors de la création d'un lieu
          </div>
        </div>
      </div>

      {/* Liste des catégories existantes */}
      <div style={{ marginBottom: 28 }}>
        {loading ? (
          <div style={{ fontSize: 13, color: 'var(--soft)' }}>Chargement…</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {categories.map(c => (
              <div key={c.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderRadius: 8,
                border: '1px solid var(--line2)', background: 'var(--bg)',
              }}>
                <span style={{ fontSize: 20 }}>{c.icon}</span>
                <span style={{ flex: 1, fontSize: 14, color: 'var(--text)' }}>{c.label}</span>
                <span style={{ fontSize: 11, color: 'var(--soft)', fontFamily: 'monospace' }}>{c.id}</span>
                {c.id !== 'autre' && (
                  <button
                    onClick={() => deleteCategory(c.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--soft)', fontSize: 16, padding: '2px 6px' }}
                    title="Supprimer"
                  >✕</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ajouter une catégorie */}
      <div style={{ borderTop: '1px solid var(--line)', paddingTop: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 14 }}>
          Ajouter une catégorie
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          {/* Icône */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowEmojis(v => !v)}
              style={{
                width: 44, height: 44, borderRadius: 8, fontSize: 22,
                border: '1px solid var(--line2)', background: 'var(--bg)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >{newIcon}</button>
            {showEmojis && (
              <div style={{
                position: 'absolute', top: 48, left: 0, zIndex: 100,
                background: 'var(--bg)', border: '1px solid var(--line2)',
                borderRadius: 10, padding: 10, width: 240,
                display: 'flex', flexWrap: 'wrap', gap: 4,
                boxShadow: '0 4px 20px rgba(0,0,0,.12)',
              }}>
                {EMOJI_SUGGESTIONS.map(e => (
                  <button key={e} type="button" onClick={() => { setNewIcon(e); setShowEmojis(false) }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, padding: 4, borderRadius: 6 }}>
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Nom */}
          <input
            className="field-input"
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
            placeholder="Nom de la catégorie (ex: Spa / Bien-être)"
            style={{ flex: 1 }}
          />
        </div>

        {error && <div style={{ fontSize: 12, color: '#C0392B', marginBottom: 8 }}>{error}</div>}

        <button
          className="btn btn-primary"
          onClick={handleAdd}
          disabled={saving || !newLabel.trim()}
          style={{ width: '100%' }}
        >
          {saving ? 'Ajout en cours…' : '＋ Ajouter la catégorie'}
        </button>
      </div>
    </div>
  )
}