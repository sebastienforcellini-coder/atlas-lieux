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

  const prompt = `Reponds UNIQUEMENT avec un objet JSON valide. Aucun texte avant ou après. Aucun markdown. Aucun backtick.

Lieu : "${searchQuery}"${url ? ` (URL: ${url})` : ''}
${gmapsMatch ? `GPS : lat=${gmapsMatch[1]}, lng=${gmapsMatch[2]}` : ''}

{"name":"nom exact","country":"pays en français","city":"ville","address":"adresse ou null","description":"2-3 phrases ou null","categorie":"restaurant|cafe|hotel|musee|nature|plage|shop|sport|monument|spa|autre","tags":["tag1","tag2"],"gps_lat":"latitude ou null","gps_lng":"longitude ou null","phone":"tel avec indicatif ou null","whatsapp":"whatsapp avec indicatif ou null","website":"URL https:// ou null"}`

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0, maxOutputTokens: 1024 },
        }),
      }
    )

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Gemini API ${response.status}: ${errText}`)
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    // Parsing robuste - cherche le JSON dans la réponse
    let lieu = null
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try { lieu = JSON.parse(jsonMatch[0]) } catch {}
    }
    // Fallback: tenter de parser le texte entier nettoyé
    if (!lieu) {
      const clean = text.replace(/```json|```/g, '').trim()
      try { lieu = JSON.parse(clean) } catch {}
    }
    if (!lieu) throw new Error('Aucun JSON dans la réponse')

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
