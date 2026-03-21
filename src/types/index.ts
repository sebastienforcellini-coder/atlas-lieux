export interface Lieu {
  id: number
  created_at: string
  updated_at: string
  name: string
  country: string
  city: string
  address: string | null
  description: string | null
  photos: string[]
  videos: string[]
  tags: string[]
  gps_lat: string | null
  gps_lng: string | null
  rating: number
  visit_date: string | null
  comments: Comment[]
}

export interface Comment {
  id: string
  text: string
  date: string
}

export type LieuInput = Omit<Lieu, 'id' | 'created_at' | 'updated_at'>

export type View = 'home' | 'all' | 'country' | 'city' | 'detail' | 'form'

export interface NavState {
  view: View
  country?: string
  city?: string
  lieuId?: number
  editLieu?: Partial<Lieu> | null
}
