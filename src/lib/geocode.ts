export interface GeoResult {
  lat: string
  lng: string
  city: string
  country: string
  address: string
}

export async function reverseGeocode(lat: number, lng: number): Promise<Partial<GeoResult>> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=fr`,
      { headers: { 'User-Agent': 'atlas-lieux-app/1.0' } }
    )
    const data = await res.json()
    const a = data.address || {}
    return {
      lat: lat.toFixed(6),
      lng: lng.toFixed(6),
      city: a.city || a.town || a.village || a.municipality || '',
      country: a.country || '',
      address: [a.road, a.house_number].filter(Boolean).join(' '),
    }
  } catch {
    return { lat: lat.toFixed(6), lng: lng.toFixed(6) }
  }
}
