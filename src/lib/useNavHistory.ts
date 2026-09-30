'use client'
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import type { NavState, View } from '@/types'

/*
 * Navigation interne synchronisée avec l'historique du navigateur.
 * Chaque changement de vue crée une entrée d'historique (même URL "/"),
 * donc le bouton Retour de l'app, le bouton du navigateur et le geste
 * retour Android/PWA ramènent tous à la vue précédente, avec son scroll
 * et ses filtres (via useHistoryState).
 */

type Scroll = { win: number; main: number }
interface AtlasEntry {
  atlas: 1
  nav: NavState
  depth: number
  scroll?: Scroll
  ui?: Record<string, unknown>
}

export const HOME: NavState = { view: 'home' }

function readEntry(): AtlasEntry | null {
  if (typeof window === 'undefined') return null
  const s = window.history.state
  return s && s.atlas === 1 ? (s as AtlasEntry) : null
}

// Conserve les clés internes du routeur Next.js (sinon il recharge la page au retour)
function nextInternals(): Record<string, unknown> {
  const s = window.history.state || {}
  const out: Record<string, unknown> = {}
  for (const k of ['__NA', '__PRIVATE_NEXTJS_INTERNALS_TREE']) if (k in s) out[k] = s[k]
  return out
}

function patchCurrent(patch: Partial<AtlasEntry>) {
  window.history.replaceState({ ...(window.history.state || {}), ...patch }, '')
}

const sameNav = (a: NavState, b: NavState) => JSON.stringify(a) === JSON.stringify(b)

export function useNavHistory(mainRef: RefObject<HTMLElement>, ready: boolean) {
  const [nav, setNav] = useState<NavState>(HOME)
  const [depth, setDepth] = useState(0)
  const pendingScroll = useRef<Scroll | null>(null)

  useEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual'
    const e = readEntry()
    if (e) {
      // Rechargement de page : on reprend là où on était
      setNav(e.nav)
      setDepth(e.depth)
      pendingScroll.current = e.scroll ?? null
    } else {
      patchCurrent({ atlas: 1, nav: HOME, depth: 0 })
    }
    const onPop = (ev: PopStateEvent) => {
      const s = ev.state as AtlasEntry | null
      if (!s || s.atlas !== 1) return
      pendingScroll.current = s.scroll ?? { win: 0, main: 0 }
      setNav(s.nav)
      setDepth(s.depth)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  // Restaure le scroll une fois la vue affichée. Certaines vues chargent
  // leurs données après le montage (catégories, trouvailles...) : on attend
  // que la page soit assez haute, au plus ~1,5 s, et on abandonne si
  // l'utilisateur fait défiler entre-temps.
  useEffect(() => {
    if (!ready || !pendingScroll.current) return
    const s = pendingScroll.current
    pendingScroll.current = null
    let frame = 0
    let raf = 0
    let cancelled = false
    const stop = () => { cancelled = true }
    window.addEventListener('wheel', stop, { passive: true, once: true })
    window.addEventListener('touchstart', stop, { passive: true, once: true })
    const tick = () => {
      if (cancelled) return
      const doc = document.documentElement
      const main = mainRef.current
      const winOk = doc.scrollHeight - window.innerHeight >= s.win
      const mainOk = !main || main.scrollHeight - main.clientHeight >= s.main
      if ((winOk && mainOk) || frame++ > 90) {
        window.scrollTo(0, s.win)
        if (main) main.scrollTop = s.main
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      window.removeEventListener('wheel', stop)
      window.removeEventListener('touchstart', stop)
    }
  }, [nav, ready, mainRef])

  const navigate = useCallback(
    (view: View, opts?: Record<string, unknown>, mode: 'push' | 'replace' = 'push') => {
      const next = { view, ...opts } as NavState
      const cur = readEntry()
      const curDepth = cur?.depth ?? 0
      if (mode === 'push') {
        if (cur && sameNav(cur.nav, next)) return
        // Mémorise le scroll de la vue qu'on quitte
        patchCurrent({ scroll: { win: window.scrollY, main: mainRef.current?.scrollTop ?? 0 } })
        window.history.pushState({ ...nextInternals(), atlas: 1, nav: next, depth: curDepth + 1 }, '')
        setDepth(curDepth + 1)
      } else {
        window.history.replaceState({ ...nextInternals(), atlas: 1, nav: next, depth: curDepth }, '')
      }
      pendingScroll.current = { win: 0, main: 0 }
      setNav(next)
    },
    [mainRef]
  )

  /** Revient à la vue précédente ; si l'historique est vide (lien direct, rechargement), va sur `fallback`. */
  const goBack = useCallback(
    (fallback: NavState = HOME) => {
      const cur = readEntry()
      if (cur && cur.depth > 0) window.history.back()
      else {
        const { view, ...opts } = fallback
        navigate(view, opts, 'replace')
      }
    },
    [navigate]
  )

  return { nav, depth, navigate, goBack }
}

/**
 * useState dont la valeur est mémorisée dans l'entrée d'historique courante :
 * filtres, onglets, recherche, collection ouverte... sont retrouvés au retour.
 * `key` doit être unique par vue (ex. 'all.q', 'col.open').
 */
export function useHistoryState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    const e = readEntry()
    return e?.ui && key in e.ui ? (e.ui[key] as T) : initial
  })
  const ref = useRef(value)
  ref.current = value

  const set = useCallback(
    (u: T | ((prev: T) => T)) => {
      const nv = typeof u === 'function' ? (u as (p: T) => T)(ref.current) : u
      ref.current = nv
      setValue(nv)
      const s = window.history.state || {}
      patchCurrent({ ui: { ...(s.ui || {}), [key]: nv } })
    },
    [key]
  )
  return [value, set] as const
}
