import { NextRequest, NextResponse } from 'next/server'

function extractSearchQuery(url: string, query: string | undefined): string {
  if (query) return query
  try {
    const hostname = new URL(url).hostname.replace('www.', '').split('.')[0]
    return hostname
  } catch { return url }
}

export async function POST(req: NextRequest) {
  const { url, query } = await req.json()
  const gmapsMatch = url?.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
  const searchQuery = extractSearchQuery(url || '', query)

  const jsonSchema = `{
  "name": "nom exact",
  "country": "pays en francais majuscule",
  "city": "ville majuscule",
  "address": "adresse ou null",
  "description": "2-3 phrases ou null",
  "categorie": "restaurant|cafe|hotel|musee|nature|plage|shop|sport|monument|autre",
  "tags": ["tag1", "tag2"],
  "gps_lat": "latitude decimale ou null",
  "gps_lng": "longitude decimale ou null"
}`

  const prompt = `Tu es un expert en lieux touristiques. Donne toutes les informations que tu connais sur ce lieu : "${searchQuery}"${url ? ` (URL: ${url})` : ''}.
${gmapsMatch ? `GPS dans l'URL : lat=${gmapsMatch[1]}, lng=${gmapsMatch[2]}` : ''}

Reponds UNIQUEMENT avec un JSON valide (sans markdown ni backticks) :
${jsonSchema}`

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1024,
          },
        }),
      }
    )

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Gemini API ${response.status}: ${errText}`)
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    // Extraire le JSON même s'il est entouré de texte
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Aucun JSON dans la réponse')

    const lieu = JSON.parse(jsonMatch[0])
    if (gmapsMatch && !lieu.gps_lat) {
      lieu.gps_lat = gmapsMatch[1]
      lieu.gps_lng = gmapsMatch[2]
    }
    lieu.photos = []

    return NextResponse.json({ lieu })

  } catch (e) {
    console.error('Gemini API error:', e)
    return NextResponse.json({
      error: 'Analyse impossible. Attendez 10 secondes et réessayez, ou utilisez le mode "Par nom" avec le nom complet + ville.'
    }, { status: 500 })
  }
}
