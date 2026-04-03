import { NextRequest, NextResponse } from 'next/server'

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

// Fallback geocoding via Nominatim (OpenStreetMap, gratuit, pas de clé)
async function geocodeAddress(query: string): Promise<{ lat: string; lng: string } | null> {
  try {
    const encoded = encodeURIComponent(query)
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1`,
      {
        headers: { 'User-Agent': 'Atlas-Lieux/1.0' },
        signal: AbortSignal.timeout(5000),
      }
    )
    if (!res.ok) return null
    const data = await res.json()
    if (data?.[0]?.lat && data?.[0]?.lon) {
      return { lat: String(data[0].lat), lng: String(data[0].lon) }
    }
    return null
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  const { url, query } = await req.json()
  const gmapsMatch = url?.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
  const searchQuery = extractSearchQuery(url || '', query)

  const isWebsite = url && !url.includes('maps.google') && !url.includes('goo.gl') && url.startsWith('http')
  const pageContent = isWebsite ? await fetchPageContent(url) : ''

  const prompt = `Reponds UNIQUEMENT avec un objet JSON valide. Aucun texte avant ou après. Aucun markdown. Aucun backtick.

Lieu : "${searchQuery}"${url ? ` (URL: ${url})` : ''}
${gmapsMatch ? `GPS : lat=${gmapsMatch[1]}, lng=${gmapsMatch[2]}` : ''}
${pageContent ? `\nContenu du site web :\n${pageContent}` : ''}

Extrais toutes les informations disponibles et réponds avec ce JSON :
{"name":"nom exact","country":"pays en français","city":"ville","address":"adresse complète ou null","description":"2-3 phrases ou null","categorie":"restaurant|cafe|hotel|musee|nature|plage|shop|sport|monument|spa|autre","tags":["tag1","tag2"],"gps_lat":"latitude décimale en string ou null","gps_lng":"longitude décimale en string ou null","phone":"numéro tel avec indicatif ou null","whatsapp":"numéro WhatsApp avec indicatif ou null","website":"URL officielle avec https:// ou null"}`

  try {
  // ✅ gemini-2.5-flash : compte payant niveau 1 (254€ crédits)
    // après :
    const GEMINI_MODEL = 'gemini-2.5-flash'

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0, maxOutputTokens: 1024 },
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
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    // Log pour debug (visible dans Vercel logs)
    console.log('Gemini raw response:', text.slice(0, 500))

   // Parsing robuste
let lieu = null
// Nettoyer les backticks markdown en premier
const cleaned = text
  .replace(/```json\s*/gi, '')
  .replace(/```\s*/gi, '')
  .trim()
// Extraire le JSON
const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
if (jsonMatch) {
  try { lieu = JSON.parse(jsonMatch[0]) } catch {}
}
if (!lieu) {
  try { lieu = JSON.parse(cleaned) } catch {}
}
if (!lieu) throw new Error('Aucun JSON dans la réponse Gemini')

    // Fallback geocoding si toujours pas de GPS
    if (!lieu.gps_lat && (lieu.address || (lieu.name && lieu.city))) {
      const geocodeQuery = lieu.address
        ? `${lieu.address}, ${lieu.city || ''}, ${lieu.country || ''}`
        : `${lieu.name}, ${lieu.city}, ${lieu.country || ''}`
      const coords = await geocodeAddress(geocodeQuery)
      if (coords) {
        lieu.gps_lat = coords.lat
        lieu.gps_lng = coords.lng
        console.log('GPS récupéré via Nominatim:', coords)
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
