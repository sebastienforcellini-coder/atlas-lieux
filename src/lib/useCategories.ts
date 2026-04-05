import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'

export interface Category {
  id: string
  label: string
  icon: string
  position: number
}

const TABLE = 'categories'

const normalizeId = (s: string) => s
  .toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '_')
  .replace(/^_+|_+$/g, '')

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    const { data } = await supabase
      .from(TABLE)
      .select('*')
      .order('position', { ascending: true })
    setCategories((data || []).map(c => ({ ...c, id: normalizeId(c.id) })))
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const addCategory = useCallback(async (cat: Omit<Category, 'position'>) => {
    const maxPos = categories.length > 0
      ? Math.max(...categories.map(c => c.position))
      : 0
    const { error } = await supabase
      .from(TABLE)
      .insert([{ ...cat, position: maxPos + 1 }])
    if (!error) fetchAll()
    return !error
  }, [categories, fetchAll])

  const deleteCategory = useCallback(async (id: string) => {
    await supabase.from(TABLE).delete().eq('id', id)
    fetchAll()
  }, [fetchAll])

  const getCat = useCallback((id: string) => {
    return categories.find(c => c.id === id) ?? { id: 'autre', label: 'Autre', icon: '📍', position: 99 }
  }, [categories])

  return { categories, loading, addCategory, deleteCategory, getCat, refetch: fetchAll }
}