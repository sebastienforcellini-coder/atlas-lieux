'use client'
import { useState, useEffect } from 'react'
import { useLieux } from '@/lib/useLieux'
import Sidebar, { Logo } from '@/components/Sidebar'
import Home from '@/components/views/Home'
import AllLieux from '@/components/views/AllLieux'
import { CountryView, CityView } from '@/components/views/CountryCityViews'
import Detail from '@/components/views/Detail'
import LieuForm from '@/components/views/LieuForm'
import GeoForm from '@/components/views/GeoForm'
import MapView from '@/components/views/MapView'
import { ConfirmModal, Loading, Toast } from '@/components/UI'
import type { Lieu, LieuInput, View, NavState } from '@/types'

const VIEW_LABELS: Record<View, string> = {
  home: 'Accueil', all: 'Tous les lieux',
  country: 'Pays', city: 'Ville',
  detail: 'Fiche lieu', form: 'Nouveau lieu',
  map: 'Carte', geoform: 'Ma position',
}

export default function AtlasPage() {
  const { lieux, loading, addLieu, updateLieu, deleteLieu } = useLieux()
  const [nav, setNav] = useState<NavState>({ view: 'home' })
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (toast) { const t = setTimeout(() => setToast(null), 2200); return () => clearTimeout(t) }
  }, [toast])

  const navigate = (view: View, opts?: Record<string, unknown>) => {
    setNav({ view, ...opts } as NavState)
    setMenuOpen(false)
  }

  const showToast = (msg: string) => setToast(msg)

  const handleSave = async (data: LieuInput, id?: number) => {
    if (id) {
      await updateLieu(id, data)
      showToast('Lieu mis à jour !')
      navigate('detail', { lieuId: id })
    } else {
      const newId = await addLieu(data)
      showToast('Lieu créé !')
      if (newId) navigate('detail', { lieuId: newId })
      else navigate('home')
    }
  }

  const handleDelete = (id: number) => setConfirmDelete(id)

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return
    await deleteLieu(confirmDelete)
    setConfirmDelete(null)
    showToast('Lieu supprimé.')
    navigate('home')
  }

  const currentLieu = nav.lieuId ? lieux.find(l => l.id === nav.lieuId) : null

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

      {/* Mobile topbar */}
      <div className="mobile-topbar">
        <button
          onClick={() => setMenuOpen(true)}
          style={{ background: 'none', border: '1px solid var(--line)', borderRadius: 4, color: 'var(--mid)', padding: '6px 10px', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}
        >☰</button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 15, fontStyle: 'italic', color: 'var(--text)', lineHeight: 1.1 }}>Atlas</div>
          <div style={{ height: '0.5px', background: 'var(--accent)', margin: '2px 6px', opacity: 0.7 }} />
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 7, color: 'var(--accent)', letterSpacing: 2 }}>RÉPERTOIRE DE LIEUX</div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--soft)' }}>{VIEW_LABELS[nav.view]}</div>
      </div>

      {/* Mobile drawer */}
      <div className={`mobile-nav-overlay${menuOpen ? ' open' : ''}`} onClick={() => setMenuOpen(false)} />
      <div className={`mobile-nav-drawer${menuOpen ? ' open' : ''}`}>
        <Sidebar current={nav.view} onNavigate={navigate} />
      </div>

      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <div className="desktop-sidebar">
          <Sidebar current={nav.view} onNavigate={navigate} />
        </div>

        <main style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
          {nav.view === 'home' && <Home lieux={lieux} onNavigate={navigate} />}
          {nav.view === 'all' && <AllLieux lieux={lieux} onNavigate={navigate} />}
          {nav.view === 'map' && <MapView lieux={lieux} onNavigate={navigate} />}
          {nav.view === 'geoform' && <GeoForm onNavigate={navigate} />}
          {nav.view === 'country' && nav.country && (
            <CountryView country={nav.country} lieux={lieux} onNavigate={navigate} />
          )}
          {nav.view === 'city' && nav.country && nav.city && (
            <CityView country={nav.country} city={nav.city} lieux={lieux} onNavigate={navigate} />
          )}
          {nav.view === 'detail' && currentLieu && (
            <Detail
              lieu={currentLieu}
              onNavigate={navigate}
              onUpdate={async (id, data) => { await updateLieu(id, data as LieuInput) }}
              onDelete={handleDelete}
              onShare={showToast}
            />
          )}
          {nav.view === 'form' && (
            <LieuForm
              initial={nav.editLieu ?? null}
              allLieux={lieux}
              onSave={handleSave}
              onCancel={() => nav.editLieu && 'id' in nav.editLieu
                ? navigate('detail', { lieuId: (nav.editLieu as Lieu).id })
                : navigate('home')
              }
            />
          )}
        </main>
      </div>
    </>
  )
}

export const dynamic = 'force-dynamic'
