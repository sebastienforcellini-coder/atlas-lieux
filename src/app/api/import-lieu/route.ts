import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { url, query } = await req.json()

  // Extract GPS from Google Maps URL if present
  const gmapsMatch = url?.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)

  const prompt = query
    ? `Recherche ce lieu et extrait toutes ses informations : "${query}"

Cherche sur Google Maps, TripAdvisor, ou tout autre source pour trouver :
- Le nom exact
- L'adresse complète
- La ville et le pays
- Les coordonnées GPS précises (OBLIGATOIRE — cherche sur Google Maps)
- Une description
- La catégorie (restaurant/cafe/hotel/musee/nature/plage/shop/sport/monument/autre)
- Des tags pertinents`
    : `Extrait les informations de ce lieu depuis cette URL : ${url}
${gmapsMatch ? `COORDONNEES GPS dans l URL : lat=${gmapsMatch[1]}, lng=${gmapsMatch[2]}` : 'Cherche les coordonnées GPS du lieu sur Google Maps.'}`

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
  "gps_lat": "latitude decimale ex: 31.629490 ou null",
  "gps_lng": "longitude decimale ex: -7.981710 ou null"
}

IMPORTANT : Pour les coordonnees GPS, fais une recherche Google Maps du lieu pour les obtenir. C est obligatoire.`

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

    return NextResponse.json({ lieu })
  } catch (e) {
    console.error('Import error:', e)
    return NextResponse.json({ error: 'Impossible d analyser ce lieu' }, { status: 500 })
  }
}
