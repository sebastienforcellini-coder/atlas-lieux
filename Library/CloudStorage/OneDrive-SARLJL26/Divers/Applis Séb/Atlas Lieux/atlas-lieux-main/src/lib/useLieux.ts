import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from './supabase'
import { toSlug } from './slug'
import type { Lieu, LieuInput } from '@/types'

const TABLE = 'lieux'

function titleCase(s: string): string {
  if (!s) return s
  return s.trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
}

function normalize(row: Record<string, unknown>): Lieu {
  return {
    ...row,
    photos:    Array.isArray(row.photos)    ? row.photos    : [],
    videos:    Array.isArray(row.videos)    ? row.videos    : [],
    tags:      Array.isArray(row.tags)      ? row.tags      : [],
    comments:  Array.isArray(row.comments)  ? row.comments  : [],
    rating:    typeof row.rating === 'number' ? row.rating : 0,
    categorie: typeof row.categorie === 'string' ? row.categorie : 'autre',
    favori:    typeof row.favori === 'boolean' ? row.favori : false,
    phone:     typeof row.phone === 'string' ? row.phone : null,
    whatsapp:  typeof row.whatsapp === 'string' ? row.whatsapp : null,
    email:     typeof row.email === 'string' ? row.email : null,
    website:   typeof row.website === 'string' ? row.website : null,
    instagram: typeof row.instagram === 'string' ? row.instagram : null,
    facebook:  typeof row.facebook === 'string' ? row.facebook : null,
  } as Lieu
}

export function useLieux() {
  const [lieux, setLieux] = useState<Lieu[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const fetchAll = useCallback(async () => {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('created_at', { ascending: false })
    if (error) { setError(error.message); setLoading(false); return }
    setLieux((data || []).map(normalize))
    setError(null)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAll()

    const channel = supabase
      .channel('lieux-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: TABLE },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setLieux(prev => [normalize(payload.new as Record<string, unknown>), ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setLieux(prev => prev.map(l =>
              l.id === (payload.new as { id: number }).id
                ? normalize(payload.new as Record<string, unknown>)
                : l
            ))
          } else if (payload.eventType === 'DELETE') {
            setLieux(prev => prev.filter(l => l.id !== (payload.old as { id: number }).id))
          }
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [fetchAll])

  const addLieu = useCallback(async (input: LieuInput): Promise<number | null> => {
    const slug = toSlug(input.name, input.city)
    const clean = {
      ...input,
      slug,
      country: titleCase(input.country),
      city: titleCase(input.city),
      visit_date: input.visit_date || null,
      address: input.address || null,
      description: input.description || null,
      gps_lat: input.gps_lat || null,
      gps_lng: input.gps_lng || null,
      categorie: input.categorie || 'autre',
      favori: input.favori ?? false,
      phone: (input as any).phone || null,
      whatsapp: (input as any).whatsapp || null,
      email: (input as any).email || null,
      website: (input as any).website || null,
      instagram: (input as any).instagram || null,
      facebook: (input as any).facebook || null,
    }

    const { data, error } = await supabase.from(TABLE).insert([clean]).select().single()
    if (error) {
      console.error('Supabase insert error:', error)
      setError(error.message)
      alert('Erreur Supabase : ' + error.message)
      return null
    }
    // Mise à jour locale immédiate sans attendre le realtime
    setLieux(prev => [normalize(data as Record<string, unknown>), ...prev])
    return data.id
  }, [])

  const updateLieu = useCallback(async (id: number, input: Partial<LieuInput>) => {
    const slug = input.name && input.city ? toSlug(input.name, input.city) : undefined
    const normalized: Record<string, unknown> = { ...input }
    if (input.country) normalized.country = titleCase(input.country)
    if (input.city) normalized.city = titleCase(input.city)
    if (input.visit_date === '') normalized.visit_date = null
    if (input.address === '') normalized.address = null
    if (input.gps_lat === '') normalized.gps_lat = null
    if (input.gps_lng === '') normalized.gps_lng = null
    normalized.categorie = (input as any).categorie || 'autre'
    normalized.email     = (input as any).email     || null
    normalized.website   = (input as any).website   || null
    normalized.instagram = (input as any).instagram || null
    normalized.facebook  = (input as any).facebook  || null
    normalized.phone     = (input as any).phone     || null
    normalized.whatsapp  = (input as any).whatsapp  || null

    const { error } = await supabase
      .from(TABLE)
      .update({ ...normalized, ...(slug ? { slug } : {}), updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) {
      console.error('Supabase update error:', error)
      setError(error.message)
    }
  }, [])

  const deleteLieu = useCallback(async (id: number) => {
    await supabase.from(TABLE).delete().eq('id', id)
  }, [])

  return { lieux, loading, error, addLieu, updateLieu, deleteLieu, refetch: fetchAll }
}
