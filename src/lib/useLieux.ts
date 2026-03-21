import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'
import { toSlug } from './slug'

function capitalize(s: string): string {
  if (!s) return s
  return s.trim().charAt(0).toUpperCase() + s.trim().slice(1).toLowerCase()
}

function titleCase(s: string): string {
  if (!s) return s
  return s.trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
}
import type { Lieu, LieuInput } from '@/types'

const TABLE = 'lieux'

export function useLieux() {
  const [lieux, setLieux] = useState<Lieu[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('created_at', { ascending: false })
    if (error) { setError(error.message); setLoading(false); return }
    setLieux((data || []).map(normalize))
    setError(null)
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

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
    }
    const { data, error } = await supabase.from(TABLE).insert([clean]).select().single()
    if (error) {
      console.error('Supabase insert error:', error)
      setError(error.message)
      alert('Erreur Supabase : ' + error.message)
      return null
    }
    await fetchAll()
    return data.id
  }, [fetchAll])

  const updateLieu = useCallback(async (id: number, input: Partial<LieuInput>) => {
    const slug = input.name && input.city ? toSlug(input.name, input.city) : undefined
    const normalized: Partial<LieuInput> = { ...input }
    if (input.country) normalized.country = titleCase(input.country)
    if (input.city) normalized.city = titleCase(input.city)
    const { error } = await supabase
      .from(TABLE)
      .update({ ...normalized, ...(slug ? { slug } : {}), updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) { setError(error.message); return }
    await fetchAll()
  }, [fetchAll])

  const deleteLieu = useCallback(async (id: number) => {
    await supabase.from(TABLE).delete().eq('id', id)
    setLieux(prev => prev.filter(l => l.id !== id))
  }, [])

  return { lieux, loading, error, addLieu, updateLieu, deleteLieu, refetch: fetchAll }
}

function normalize(row: Record<string, unknown>): Lieu {
  return {
    ...row,
    photos:   Array.isArray(row.photos)   ? row.photos   : [],
    videos:   Array.isArray(row.videos)   ? row.videos   : [],
    tags:     Array.isArray(row.tags)     ? row.tags     : [],
    comments: Array.isArray(row.comments) ? row.comments : [],
    rating:   typeof row.rating === 'number' ? row.rating : 0,
  } as Lieu
}
