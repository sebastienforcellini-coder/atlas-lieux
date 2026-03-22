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
  slug: string | null
  categorie: string
  favori: boolean
}

export const CATEGORIES: { id: string; label: string; icon: string }[] = [
  { id: 'restaurant', label: 'Restaurant',  icon: '🍽' },
  { id: 'cafe',       label: 'Café / Bar',  icon: '☕' },
  { id: 'hotel',      label: 'Hôtel / Riad',icon: '🏨' },
  { id: 'musee',      label: 'Musée / Art',  icon: '🏛' },
  { id: 'nature',     label: 'Nature',       icon: '🌿' },
  { id: 'plage',      label: 'Plage',        icon: '🏖' },
  { id: 'shop',       label: 'Shopping',     icon: '🛍' },
  { id: 'sport',      label: 'Sport',        icon: '⚽' },
  { id: 'monument',   label: 'Monument',     icon: '🏛' },
  { id: 'autre',      label: 'Autre',        icon: '📍' },
]

export function getCat(id: string) {
  return CATEGORIES.find(c => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1]
}

export interface Comment {
  id: string
  text: string
  date: string
}

export type LieuInput = Omit<Lieu, 'id' | 'created_at' | 'updated_at'>

export type View = 'home' | 'all' | 'country' | 'city' | 'detail' | 'form' | 'map' | 'geoform' | 'favoris' | 'collections'

export interface NavState {
  view: View
  country?: string
  city?: string
  lieuId?: number
  editLieu?: Partial<Lieu> | null
}
