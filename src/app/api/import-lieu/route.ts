import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { url } = await req.json()
  if (!url) return NextResponse.json({ error: 'URL manquante' }, { status: 400 })

  // Try to extract GPS from Google Maps URL directly
  const gmapsMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)

  const prompt = `Extrait les informations de ce lieu depuis cette URL : ${url}

${gmapsMatch ? `COORDONNEES GPS TROUVEES DANS L URL : lat=${gmapsMatch[1]}, lng=${gmapsMatch[2]} — utilise-les directement.` : `Pour les coordonnees GPS : cherche le nom du lieu + ville sur Google Maps ou dans les donnees de la page.`}

Reponds UNIQUEMENT avec un JSON valide (sans markdown, sans backticks) :
{
  "name": "nom exact du lieu",
  "country": "pays en francais avec majuscule",
  "city": "ville avec majuscule",
  "address": "adresse complete ou null",
  "description": "description 2-3 phrases ou null",
  "categorie": "restaurant|cafe|hotel|musee|nature|plage|shop|sport|monument|autre",
  "tags": ["tag1", "tag2"],
  "gps_lat": "${gmapsMatch ? gmapsMatch[1] : 'latitude decimale ou null'}",
  "gps_lng": "${gmapsMatch ? gmapsMatch[2] : 'longitude decimale ou null'}"
}`

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
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await response.json()

    const text = data.content
      ?.filter((b: { type: string }) => b.type === 'text')
      ?.map((b: { text: string }) => b.text)
      ?.join('') ?? ''

    const clean = text.replace(/```json|```/g, '').trim()
    const lieu = JSON.parse(clean)

    // Inject GPS from URL if Claude missed it
    if (gmapsMatch && !lieu.gps_lat) {
      lieu.gps_lat = gmapsMatch[1]
      lieu.gps_lng = gmapsMatch[2]
    }

    return NextResponse.json({ lieu })
  } catch (e) {
    console.error('Import error:', e)
    return NextResponse.json({ error: 'Impossible d analyser ce lien' }, { status: 500 })
  }
}
