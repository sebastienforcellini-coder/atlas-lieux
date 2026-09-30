'use client'
import { useState, useEffect, useRef } from 'react'
import { useNavHistory, HOME } from '@/lib/useNavHistory'
import { useLieux } from '@/lib/useLieux'
import Sidebar, { Logo } from '@/components/Sidebar'
import Home from '@/components/views/Home'
import AllLieux from '@/components/views/AllLieux'
import { CountryView, CityView } from '@/components/views/CountryCityViews'
import Detail from '@/components/views/Detail'
import LieuForm from '@/components/views/LieuForm'
import GeoForm from '@/components/views/GeoForm'
import Favoris from '@/components/views/Favoris'
import Collections from '@/components/views/Collections'
import CategoriesView from '@/components/views/Categories'
import MapView from '@/components/views/MapView'
import Sourcing from '@/components/views/Sourcing'
import FournisseurDetail from '@/components/views/FournisseurDetail'
import { ConfirmModal, Toast } from '@/components/UI'
import type { Lieu, LieuInput, View } from '@/types'

const PIN = '2266'

const VIEW_LABELS: Record<View, string> = {
  home: 'Accueil', all: 'Tous les lieux',
  country: 'Pays', city: 'Ville',
  detail: 'Fiche lieu', form: 'Nouveau lieu',
  map: 'Carte', geoform: 'Ma position',
  favoris: 'Favoris', collections: 'Collections', categories: 'Catégories',
  sourcing: 'Sourcing', fournisseur: 'Fournisseur',

}

function PinScreen({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)

  const handleSubmit = () => {
    if (pin === PIN) {
      localStorage.setItem('atlas_pin', 'ok')
      onUnlock()
    } else {
      setError(true)
      setPin('')
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#F5F2ED', fontFamily: 'Georgia, serif',
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, padding: '40px 32px',
        width: '100%', maxWidth: 340,
        boxShadow: '0 4px 32px rgba(26,24,20,.1)',
        border: '1px solid rgba(26,24,20,.08)', textAlign: 'center',
      }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>🧭</div>
        <div style={{ fontStyle: 'italic', fontSize: 26, fontWeight: 300, color: '#1A1814', marginBottom: 4 }}>
          Atlas
        </div>
        <div style={{
          fontSize: 11, letterSpacing: 3, color: '#B0AA9E',
          textTransform: 'uppercase', fontFamily: 'system-ui, sans-serif', marginBottom: 32,
        }}>
          Répertoire de lieux
        </div>

        <label style={{
          display: 'block', fontSize: 12, color: '#8C7A6B',
          fontFamily: 'system-ui, sans-serif', letterSpacing: 1,
          textTransform: 'uppercase', marginBottom: 10,
        }}>
          Code d'accès
        </label>

        <input
          type="password"
          inputMode="numeric"
          maxLength={6}
          value={pin}
          onChange={e => { setPin(e.target.value); setError(false) }}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          autoFocus
          placeholder="••••"
          style={{
            width: '100%', padding: '14px 16px', borderRadius: 12,
            border: error ? '2px solid #e05a5a' : '1px solid rgba(26,24,20,.15)',
            fontSize: 24, textAlign: 'center', letterSpacing: 8,
            fontFamily: 'system-ui, sans-serif', outline: 'none',
            background: '#FDFCFA', boxSizing: 'border-box', color: '#1A1814', marginBottom: 8,
          }}
        />

        {error && (
          <div style={{ fontSize: 12, color: '#e05a5a', marginBottom: 12, fontFamily: 'system-ui, sans-serif' }}>
            Code incorrect, réessaie.
          </div>
        )}

        <button
          onClick={handleSubmit}
          style={{
            width: '100%', padding: '14px', borderRadius: 12, border: 'none',
            background: '#8C5A28', color: '#fff', fontSize: 15,
            fontFamily: 'Georgia, serif', fontStyle: 'italic',
            cursor: 'pointer', fontWeight: 300, marginTop: 8,
          }}
        >
          Accéder →
        </button>

        <div style={{ marginTop: 24, fontSize: 11, color: '#D0C8BE', fontFamily: 'system-ui, sans-serif' }}>
          Accès privé
        </div>
      </div>
    </div>
  )
}

export default function AtlasPage() {
  const { lieux, loading, addLieu, updateLieu, deleteLieu } = useLieux()
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [unlocked, setUnlocked] = useState<boolean | null>(null)
  const mainRef = useRef<HTMLElement>(null)
  const { nav, depth, navigate: navTo, goBack } = useNavHistory(mainRef, !!unlocked && !loading)

  useEffect(() => {
    const ok = localStorage.getItem('atlas_pin') === 'ok'
    setUnlocked(ok)
  }, [])

  useEffect(() => {
    if (toast) { const t = setTimeout(() => setToast(null), 2200); return () => clearTimeout(t) }
  }, [toast])

  const navigate = (view: View, opts?: Record<string, unknown>) => {
    navTo(view, opts)
    setMenuOpen(false)
  }

  // Le menu mobile se referme aussi quand on revient en arrière
  useEffect(() => { setMenuOpen(false) }, [nav])

  const canGoBack = depth > 0 && nav.view !== 'home'

  const showToast = (msg: string) => setToast(msg)

  const handleSave = async (data: LieuInput, id?: number) => {
    if (id) {
      await updateLieu(id, data)
      showToast('Lieu mis à jour !')
      // Retour à la fiche d'où vient la modification (sans empiler le formulaire)
      goBack({ view: 'detail', lieuId: id })
    } else {
      const newId = await addLieu(data)
      showToast('Lieu créé !')
      // Le formulaire est remplacé par la fiche : "Retour" ramène là où on a cliqué "Ajouter"
      if (newId) navTo('detail', { lieuId: newId }, 'replace')
      else goBack()
    }
  }

  const handleDelete = (id: number) => setConfirmDelete(id)

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return
    await deleteLieu(confirmDelete)
    setConfirmDelete(null)
    showToast('Lieu supprimé.')
    if (nav.view === 'detail' && nav.lieuId === confirmDelete) goBack()
  }

  const currentLieu = nav.lieuId ? lieux.find(l => l.id === nav.lieuId) : null
  const navKey = JSON.stringify(nav)

  // Chargement initial
  if (unlocked === null) return <div className="loading-screen">CHARGEMENT...</div>

  // Ecran PIN
  if (!unlocked) return <PinScreen onUnlock={() => setUnlocked(true)} />

  if (loading) return <div className="loading-screen">CHARGEMENT...</div>

  return (
    <>
      {toast && <Toast msg={toast} />}

      {confirmDelete && (
        <ConfirmModal
          title="Supprimer ce lieu ?"
          sub="Cette action est irréversible."
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      <div className="mobile-topbar">
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
          <button onClick={() => setMenuOpen(true)} aria-label="Menu"
            style={{ background: 'none', border: '1px solid var(--line)', borderRadius: 8, color: 'var(--mid)', padding: '8px 12px', cursor: 'pointer', fontSize: 18, lineHeight: 1, minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>☰</button>
          {canGoBack && (
            <button onClick={() => goBack()} aria-label="Retour" title="Retour"
              style={{ background: 'none', border: '1px solid var(--line)', borderRadius: 8, color: 'var(--accent)', cursor: 'pointer', fontSize: 22, lineHeight: 1, minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: 3 }}>‹</button>
          )}
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 15, fontStyle: 'italic', color: 'var(--text)', lineHeight: 1.1 }}>Atlas</div>
          <div style={{ height: '0.5px', background: 'var(--accent)', margin: '2px 6px', opacity: 0.7 }} />
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 7, color: 'var(--accent)', letterSpacing: 2 }}>RÉPERTOIRE DE LIEUX</div>
        </div>
        <div style={{ flex: 1, textAlign: 'right', fontSize: 11, color: 'var(--soft)' }}>{VIEW_LABELS[nav.view]}</div>
      </div>

      <div className={`mobile-nav-overlay${menuOpen ? ' open' : ''}`} onClick={() => setMenuOpen(false)} />
      <div className={`mobile-nav-drawer${menuOpen ? ' open' : ''}`}>
        <Sidebar current={nav.view} onNavigate={navigate} />
      </div>

      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <div className="desktop-sidebar">
          <Sidebar current={nav.view} onNavigate={navigate} />
        </div>

        <main ref={mainRef} style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
          {canGoBack && (
            <button className="back-link desktop-only" onClick={() => goBack()}>‹ Retour</button>
          )}
          <div key={navKey}>
          {nav.view === 'home' && <Home lieux={lieux} onNavigate={navigate} onDelete={handleDelete} />}
          {nav.view === 'all' && <AllLieux lieux={lieux} onNavigate={navigate} onDelete={handleDelete} />}
          {nav.view === 'map' && <MapView lieux={lieux} onNavigate={navigate} />}
          {nav.view === 'favoris' && <Favoris lieux={lieux} onNavigate={navigate} onDelete={handleDelete} />}
          {nav.view === 'collections' && <Collections lieux={lieux} onNavigate={navigate} onDelete={handleDelete} />}
          {nav.view === 'sourcing' && (
            <Sourcing onOpenFournisseur={(f) => navigate('fournisseur', { fournisseur: f })} />
          )}
          {nav.view === 'fournisseur' && nav.fournisseur && (
            <FournisseurDetail fournisseur={nav.fournisseur} onBack={() => goBack({ view: 'sourcing' })} />
          )}
          {nav.view === 'geoform' && <GeoForm onNavigate={navigate} />}
          {nav.view === 'country' && nav.country && (
            <CountryView country={nav.country} lieux={lieux} onNavigate={navigate} onDelete={handleDelete} />
          )}
          {nav.view === 'city' && nav.country && nav.city && (
            <CityView country={nav.country} city={nav.city} lieux={lieux} onNavigate={navigate} onDelete={handleDelete} />
          )}
          {nav.view === 'detail' && currentLieu && (
            <Detail lieu={currentLieu} onNavigate={navigate}
              onUpdate={async (id, data) => { await updateLieu(id, data as LieuInput) }}
              onDelete={handleDelete} onShare={showToast} />
          )}
          {nav.view === 'detail' && !currentLieu && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--soft)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
              Ce lieu n&apos;existe plus.
              <div style={{ marginTop: 16 }}><button className="btn" onClick={() => goBack()}>‹ Retour</button></div>
            </div>
          )}
          {nav.view === 'categories' && <CategoriesView onNavigate={navigate} />}
          {nav.view === 'form' && (
            <LieuForm initial={nav.editLieu ?? null} allLieux={lieux} onSave={handleSave}
              onCancel={() => goBack(nav.editLieu && 'id' in nav.editLieu
                ? { view: 'detail', lieuId: (nav.editLieu as Lieu).id }
                : HOME)} />
          )}
          </div>
        </main>
      </div>
    </>
  )
}

export const dynamic = 'force-dynamic'