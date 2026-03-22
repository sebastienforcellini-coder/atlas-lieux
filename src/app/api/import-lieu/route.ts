import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { url } = await req.json()
  if (!url) return NextResponse.json({ error: 'URL manquante' }, { status: 400 })

  const prompt = `Tu dois extraire les informations d'un lieu depuis cette URL : ${url}

INSTRUCTIONS :
1. Visite la page web via web_search ou en analysant l'URL
2. Pour les coordonnées GPS : cherche dans l'URL elle-meme (Google Maps contient souvent @lat,lng), dans les meta tags, ou cherche le nom du lieu sur Google Maps pour trouver les coordonnées exactes
3. Pour un lien Google Maps comme "maps.google.com/.../@43.2965,5.3698..." extrais directement lat/lng de l'URL
4. Pour TripAdvisor, cherche le nom + ville sur Google Maps pour obtenir les coordonnées

Reponds UNIQUEMENT avec un JSON valide (sans markdown, sans backticks) :
{
  "name": "nom exact du lieu",
  "country": "pays en francais avec majuscule",
  "city": "ville avec majuscule",
  "address": "adresse complete ou null",
  "description": "description 2-3 phrases ou null",
  "categorie": "restaurant|cafe|hotel|musee|nature|plage|shop|sport|monument|autre",
  "tags": ["tag1", "tag2"],
  "gps_lat": "latitude en decimal ex: 43.296482 ou null",
  "gps_lng": "longitude en decimal ex: 5.381001 ou null"
}

IMPORTANT : Fais tout ton possible pour trouver les coordonnées GPS. Si le lien est Google Maps, elles sont dans l URL. Sinon cherche le lieu par son nom et ville.`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'interleaved-thinking-2025-05-14',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        thinking: { type: 'enabled', budget_tokens: 512 },
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await response.json()
    console.log('API response:', JSON.stringify(data).slice(0, 500))

    const text = data.content
      ?.filter((b: { type: string }) => b.type === 'text')
      ?.map((b: { text: string }) => b.text)
      ?.join('') ?? ''

    const clean = text.replace(/```json|```/g, '').trim()
    const lieu = JSON.parse(clean)
    return NextResponse.json({ lieu })
  } catch (e) {
    console.error('Import error:', e)
    return NextResponse.json({ error: 'Impossible d analyser ce lien' }, { status: 500 })
  }
}
