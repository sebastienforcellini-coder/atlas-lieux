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

  const promptNoSearch = `Tu connais ce lieu : "${searchQuery}"${url ? ` (URL: ${url})` : ''}.
${gmapsMatch ? `GPS dans l URL : lat=${gmapsMatch[1]}, lng=${gmapsMatch[2]}` : ''}

Donne toutes les informations que tu connais sur ce lieu.
Reponds UNIQUEMENT avec un JSON valide (sans markdown ni backticks) :
${jsonSchema}`

  const promptWithSearch = `Recherche des informations sur ce lieu : "${searchQuery}"${url ? ` (site: ${url})` : ''}.
${gmapsMatch ? `GPS dans l URL : lat=${gmapsMatch[1]}, lng=${gmapsMatch[2]}` : ''}

Utilise web_search pour trouver nom, adresse, ville, pays, GPS, description.
Reponds UNIQUEMENT avec un JSON valide (sans markdown ni backticks) :
${jsonSchema}`

  const callClaude = async (withSearch: boolean) => {
    const body: Record<string, unknown> = {
      model: 'claude-sonnet-4-6',  // ✅ modèle actuel
      max_tokens: 1024,
      messages: [{ role: 'user', content: withSearch ? promptWithSearch : promptNoSearch }],
    }
    if (withSearch) {
      body.tools = [{ type: 'web_search_20250305', name: 'web_search' }]
    }
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    })
    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`API ${response.status}: ${errText}`)
    }
    return response.json()
  }

  // ✅ Parsing robuste : cherche le dernier bloc texte contenant du JSON
  const parseResponse = (data: Record<string, unknown>) => {
    const blocks = (data.content as Array<{ type: string; text?: string }>) || []
    const texts = blocks
      .filter(b => b.type === 'text' && b.text)
      .map(b => b.text!)

    // Essayer chaque bloc texte en partant de la fin
    for (let i = texts.length - 1; i >= 0; i--) {
      const clean = texts[i].replace(/```json|```/g, '').trim()
      // Extraire le JSON si entouré d'autre texte
      const jsonMatch = clean.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0])
        } catch {
          continue
        }
      }
    }
    throw new Error('Aucun JSON valide trouvé dans la réponse')
  }

  // Tentative sans web search (connaissance interne de Claude)
  try {
    const data = await callClaude(false)
    const lieu = parseResponse(data)
    const needsSearch = !lieu.name || !lieu.city || (!lieu.gps_lat && !gmapsMatch)

    if (!needsSearch) {
      if (gmapsMatch && !lieu.gps_lat) { lieu.gps_lat = gmapsMatch[1]; lieu.gps_lng = gmapsMatch[2] }
      lieu.photos = []
      return NextResponse.json({ lieu })
    }
  } catch (e) {
    console.log('Tentative sans recherche échouée:', e)
  }

  // Fallback avec web search
  await new Promise(r => setTimeout(r, 1000))
  try {
    const data = await callClaude(true)
    const lieu = parseResponse(data)
    if (gmapsMatch && !lieu.gps_lat) { lieu.gps_lat = gmapsMatch[1]; lieu.gps_lng = gmapsMatch[2] }
    lieu.photos = []
    return NextResponse.json({ lieu })
  } catch (e) {
    console.error('Tentative avec recherche échouée:', e)
    return NextResponse.json({
      error: 'Analyse impossible. Attendez 10 secondes et réessayez, ou utilisez le mode "Par nom" avec le nom complet + ville.'
    }, { status: 500 })
  }
}
