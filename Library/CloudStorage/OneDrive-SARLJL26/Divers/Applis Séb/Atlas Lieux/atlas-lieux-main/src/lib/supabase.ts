import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(url, key)

export async function uploadPhoto(file: File): Promise<string | null> {
  const ext = file.name.split('.').pop()
  const path = `photos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage.from('atlas').upload(path, file, { upsert: false })
  if (error) { console.error('Upload error:', error); return null }
  const { data } = supabase.storage.from('atlas').getPublicUrl(path)
  return data.publicUrl
}
