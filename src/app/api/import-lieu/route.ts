import { NextRequest, NextResponse } from 'next/server'
import { parseLlmJson } from '@/lib/parseLlmJson'

// Gemini + recherche web + géocodage peuvent dépasser 10 s
export const maxDuration = 60

function extractSearchQuery(url: string, query: string | undefined): string {
  if (query) return query
  try {
    const hostname = new URL(url).hostname.replace('www.', '').split('.')[0]
    return hostname
  } catch { return url }
}

async function fetchPageContent(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Atlas-Bot/1.0)' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return ''
    const html = await res.text()
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 4000)
    return text
  } catch {
    return ''
  }
}

// GPS précis via Google Places API (New)
async function getPlacesGps(query: string): Promise<{ lat: string; lng: string } | null> {
  try {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY
    if (!apiKey) return null

    const res = await fetch(
      `https://places.googleapis.com/v1/places:searchText`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'places.location,places.displayName',
        },
        body: JSON.stringify({ textQuery: query }),
        signal: AbortSignal.timeout(5000),
      }
    )
    if (!res.ok) {
      console.error('Places API error:', res.status, await res.text())
      return null
    }
    const data = await res.json()
    const place = data.places?.[0]
    if (place?.location?.latitude) {
      console.log('GPS via Google Places:', place.location)
      return {
        lat: String(place.location.latitude),
        lng: String(place.location.longitude),
      }
    }
    return null
  } catch (e) {
    console.error('Places API exception:', e)
    return null
  }
}

// Fallback geocoding via Nominatim (OpenStreetMap, gratuit, pas de clé).
// OSM connaît rarement les commerces marocains par leur nom, mais trouve bien
// les rues : on tente d'abord le nom, puis chaque morceau de l'adresse.
// Politique Nominatim : 1 requête/s max et un User-Agent identifiable.
type Geo = { lat: string; lng: string; precision: 'lieu' | 'rue' }

async function geocodeAddress(name: string, city: string, address: string): Promise<Geo | null> {
  const shortName = name.split(/\s[-|–·:]\s/)[0].trim()
  const cleanAddr = address.replace(/\b\d{5}\b/g, '').replace(/\s+,/g, ',').trim()
  const segments = cleanAddr
    .split(',')
    .map(s => s.trim())
    .filter(s => s && s.toLowerCase() !== city.toLowerCase())

  const candidates: { q: string; precision: Geo['precision'] }[] = []
  if (shortName && city) candidates.push({ q: `${shortName}, ${city}`, precision: 'lieu' })
  if (cleanAddr && city) candidates.push({ q: `${cleanAddr}, ${city}`, precision: 'rue' })
  for (const seg of segments) if (city) candidates.push({ q: `${seg}, ${city}`, precision: 'rue' })

  const seen = new Set<string>()
  const queue = candidates.filter(c => !seen.has(c.q.toLowerCase()) && seen.add(c.q.toLowerCase())).slice(0, 5)

  for (let i = 0; i < queue.length; i++) {
    if (i > 0) await new Promise(r => setTimeout(r, 1100))
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(queue[i].q)}&format=json&limit=1`,
        {
          headers: { 'User-Agent': 'Atlas-Lieux/1.0 (+https://atlas-lieux.vercel.app)', 'Accept-Language': 'fr' },
          signal: AbortSignal.timeout(4000),
        }
      )
      if (!res.ok) { console.warn('Nominatim', res.status, queue[i].q); continue }
      const data = await res.json()
      if (data?.[0]?.lat) {
        console.log('GPS via Nominatim:', queue[i].q, '→', data[0].lat, data[0].lon)
        return { lat: String(data[0].lat), lng: String(data[0].lon), precision: queue[i].precision }
      }
    } catch { continue }
  }
  console.warn('Nominatim : aucun résultat pour', queue.map(c => c.q))
  return null
}

export async function POST(req: NextRequest) {
  const { url, query } = await req.json()
  const gmapsMatch = url?.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
  const searchQuery = extractSearchQuery(url || '', query)

  const isWebsite = url && !url.includes('maps.google') && !url.includes('goo.gl') && url.startsWith('http')
  const pageContent = isWebsite ? await fetchPageContent(url) : ''

  const prompt = `Reponds UNIQUEMENT avec un objet JSON valide. Aucun texte avant ou après. Aucun markdown. Aucun backtick.
N'utilise JAMAIS de guillemets doubles à l'intérieur d'une valeur texte : pour citer un nom ou une expression, utilise les guillemets français « ».

Lieu : "${searchQuery}"
Recherche activement le numéro de téléphone, WhatsApp et le site web officiel de ce lieu.${gmapsMatch ? `GPS : lat=${gmapsMatch[1]}, lng=${gmapsMatch[2]}` : ''}
${pageContent ? `\nContenu du site web :\n${pageContent}` : ''}

Extrais toutes les informations disponibles et réponds avec ce JSON :
{"name":"nom exact","country":"pays en français","city":"ville","address":"adresse complète ou null","description":"2-3 phrases ou null","categorie":"restaurant|cafe|hotel|musee|nature|plage|shop|sport|monument|spa|autre","tags":["tag1","tag2"],"gps_lat":null,"gps_lng":null,"phone":"numéro tel avec indicatif ou null","whatsapp":"numéro WhatsApp avec indicatif ou null","website":"URL officielle avec https:// ou null"}`

  try {
    // ✅ gemini-2.5-flash : compte payant niveau 1 (254€ crédits)
    const GEMINI_MODEL = 'gemini-2.5-flash'

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0, maxOutputTokens: 2048 },
          tools: [{ google_search: {} }],
        }),
      }
    )

    if (!response.ok) {
      const errText = await response.text()
      console.error(`Gemini API ${response.status}:`, errText)
      throw new Error(`Gemini API ${response.status}: ${errText}`)
    }

    const data = await response.json()
    const parts = data.candidates?.[0]?.content?.parts || []
    const text = parts.map((p: { text?: string }) => p.text || '').join('\n')

    console.log('Gemini raw response:', text.slice(0, 1500))

    // Parsing tolérant (guillemets non échappés, texte autour, virgule en trop)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lieu = parseLlmJson<any>(text)
    if (!lieu) {
      const reason = data.candidates?.[0]?.finishReason
      throw new Error(`JSON Gemini illisible (finishReason=${reason}) : ${text.slice(0, 300)}`)
    }

    // GPS depuis l'URL Google Maps (prioritaire absolu)
    lieu.gps_precision = null
    if (gmapsMatch) {
      lieu.gps_lat = gmapsMatch[1]
      lieu.gps_lng = gmapsMatch[2]
      lieu.gps_precision = 'exact'
    } else {
      // On ignore le GPS de Gemini (pas fiable) et on utilise Google Places
      lieu.gps_lat = null
      lieu.gps_lng = null
    }

    // GPS précis via Google Places API
    if (!lieu.gps_lat && lieu.name) {
      const placesQuery = `${lieu.name} ${lieu.city || ''} ${lieu.country || ''}`.trim()
      const coords = await getPlacesGps(placesQuery)
      if (coords) {
        lieu.gps_lat = coords.lat
        lieu.gps_lng = coords.lng
        lieu.gps_precision = 'exact'
      }
    }

    // Fallback Nominatim si Places API n'a rien trouvé
    if (!lieu.gps_lat && (lieu.address || (lieu.name && lieu.city))) {
      const coords = await geocodeAddress(lieu.name || '', lieu.city || '', lieu.address || '')
      if (coords) {
        lieu.gps_lat = coords.lat
        lieu.gps_lng = coords.lng
        lieu.gps_precision = coords.precision
      }
    }

    // Nettoyer website
    if (lieu.website) {
      if (!lieu.website.startsWith('http')) lieu.website = 'https://' + lieu.website
      try { new URL(lieu.website) } catch { lieu.website = null }
    }

    lieu.photos = []
    return NextResponse.json({ lieu })

  } catch (e) {
    console.error('Import IA error:', e)
    return NextResponse.json({
      error: 'Analyse impossible. Attendez 10 secondes et réessayez, ou utilisez le mode "Par nom" avec le nom complet + ville.'
    }, { status: 500 })
  }
}
