import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { url, query } = await req.json()

  const gmapsMatch = url?.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)

  const prompt = query
    ? `Recherche ce lieu et extrait toutes ses informations : "${query}"

Cherche sur Google Maps, TripAdvisor, ou tout autre source pour trouver :
- Le nom exact
- L adresse complète
- La ville et le pays
- Les coordonnées GPS précises (OBLIGATOIRE)
- Une description
- La catégorie
- Des tags pertinents
- Des URLs de photos du lieu (images publiques depuis TripAdvisor, Google Maps, site officiel)`
    : `Extrait les informations de ce lieu depuis cette URL : ${url}
${gmapsMatch ? `COORDONNEES GPS dans l URL : lat=${gmapsMatch[1]}, lng=${gmapsMatch[2]}` : 'Cherche les coordonnées GPS du lieu.'}
Essaie aussi de trouver des photos publiques du lieu.`

  const fullPrompt = `${prompt}

Reponds UNIQUEMENT avec un JSON valide (sans markdown, sans backticks) :
{
  "name": "nom exact",
  "country": "pays en francais avec majuscule",
  "city": "ville avec majuscule",
  "address": "adresse complete ou null",
  "description": "2-3 phrases ou null",
  "categorie": "restaurant|cafe|hotel|musee|nature|plage|shop|sport|monument|autre",
  "tags": ["tag1", "tag2"],
  "gps_lat": "latitude decimale ou null",
  "gps_lng": "longitude decimale ou null",
  "photos": ["url_photo_1", "url_photo_2"]
}

IMPORTANT :
- Pour les coordonnees GPS, cherche sur Google Maps — OBLIGATOIRE
- Pour les photos : inclus uniquement des URLs directes vers des images (.jpg, .jpeg, .png, .webp) publiquement accessibles. Maximum 3 photos. Si tu n en trouves pas, mets un tableau vide [].`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{ role: 'user', content: fullPrompt }],
      }),
    })

    const data = await response.json()
    const text = data.content
      ?.filter((b: { type: string }) => b.type === 'text')
      ?.map((b: { text: string }) => b.text)
      ?.join('') ?? ''

    const clean = text.replace(/```json|```/g, '').trim()
    const lieu = JSON.parse(clean)

    if (gmapsMatch && !lieu.gps_lat) {
      lieu.gps_lat = gmapsMatch[1]
      lieu.gps_lng = gmapsMatch[2]
    }

    if (!Array.isArray(lieu.photos)) lieu.photos = []

    return NextResponse.json({ lieu })
  } catch (e) {
    console.error('Import error:', e)
    return NextResponse.json({ error: 'Impossible d analyser ce lieu' }, { status: 500 })
  }
}
