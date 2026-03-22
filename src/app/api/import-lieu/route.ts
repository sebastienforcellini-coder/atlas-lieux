import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { url } = await req.json()
  if (!url) return NextResponse.json({ error: 'URL manquante' }, { status: 400 })

  const prompt = `Analyse cette page web et extrait les informations sur ce lieu.
URL : ${url}

Reponds UNIQUEMENT avec un JSON valide (sans markdown, sans backticks) avec ces champs :
{
  "name": "nom du lieu",
  "country": "pays en francais",
  "city": "ville",
  "address": "adresse complete ou null",
  "description": "description courte 2-3 phrases max ou null",
  "categorie": "restaurant|cafe|hotel|musee|nature|plage|shop|sport|monument|autre",
  "tags": ["tag1", "tag2"],
  "gps_lat": "latitude decimale ou null",
  "gps_lng": "longitude decimale ou null"
}

Si tu ne trouves pas une info, mets null. Pays et ville toujours en francais avec premiere lettre majuscule.`

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
    return NextResponse.json({ lieu })
  } catch (e) {
    console.error('Import error:', e)
    return NextResponse.json({ error: 'Impossible d analyser ce lien' }, { status: 500 })
  }
}
