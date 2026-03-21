import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'
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
    const { data, error } = await supabase.from(TABLE).insert([input]).select().single()
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
    const { error } = await supabase
      .from(TABLE)
      .update({ ...input, updated_at: new Date().toISOString() })
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
