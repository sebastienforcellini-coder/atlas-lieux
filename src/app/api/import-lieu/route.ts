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

  const prompt = `Tu es une base de données de lieux touristiques. Reponds UNIQUEMENT avec un objet JSON valide, sans aucun texte avant ou après, sans markdown, sans backticks.

Lieu recherché : "${searchQuery}"${url ? ` (URL: ${url})` : ''}
${gmapsMatch ? `Coordonnées GPS dans l'URL : lat=${gmapsMatch[1]}, lng=${gmapsMatch[2]}` : ''}

JSON requis (utilise null pour les champs inconnus) :
{"name":"nom exact du lieu","country":"pays en français","city":"ville","address":"adresse complète ou null","description":"2-3 phrases de description ou null","categorie":"restaurant|cafe|hotel|musee|nature|plage|shop|sport|monument|spa|autre","tags":["tag1","tag2"],"gps_lat":"latitude décimale ou null","gps_lng":"longitude décimale ou null","phone":"numéro de téléphone avec indicatif pays ou null","whatsapp":"numéro WhatsApp avec indicatif pays ou null","website":"URL complète avec https:// ou null"}`

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0,
            maxOutputTokens: 1024,
            responseMimeType: 'application/json',
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

    // Nettoyer website
    if (lieu.website) {
      if (!lieu.website.startsWith('http')) lieu.website = 'https://' + lieu.website
      try { new URL(lieu.website) } catch { lieu.website = null }
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
