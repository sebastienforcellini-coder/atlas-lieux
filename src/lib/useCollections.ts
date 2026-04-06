import { useState, useEffect, useCallback } from 'react'
import { supabase, uploadPhoto } from './supabase'
import { compressImage } from './imageUtils'

export interface Collection {
  id: number
  title: string
  description: string | null
  slug: string
  lieux_ids: number[]
  created_at: string
  cover_url: string | null
}

const TABLE = 'collections'

function toSlugCol(title: string): string {
  return title.toLowerCase().trim()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    + '-' + Math.random().toString(36).slice(2, 6)
}

export function useCollections() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    const { data } = await supabase.from(TABLE).select('*').order('created_at', { ascending: false })
    setCollections((data || []) as Collection[])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAll()
    const channel = supabase.channel('collections-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, fetchAll)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchAll])

  const addCollection = useCallback(async (title: string, description: string, lieux_ids: number[], cover_url?: string | null): Promise<string | null> => {
    const slug = toSlugCol(title)
    const { data, error } = await supabase.from(TABLE).insert([{ title, description: description || null, slug, lieux_ids, cover_url: cover_url || null }]).select().single()
    if (error) { alert('Erreur : ' + error.message); return null }
    return (data as Collection).slug
  }, [])

  const updateCollection = useCallback(async (id: number, title: string, description: string, lieux_ids: number[], cover_url?: string | null) => {
    await supabase.from(TABLE).update({ title, description: description || null, lieux_ids, cover_url: cover_url !== undefined ? cover_url : undefined, updated_at: new Date().toISOString() }).eq('id', id)
  }, [])

  const deleteCollection = useCallback(async (id: number) => {
    await supabase.from(TABLE).delete().eq('id', id)
  }, [])

  return { collections, loading, addCollection, updateCollection, deleteCollection, refetch: fetchAll }
}