import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Force l'exécution dynamique à chaque appel — jamais de cache
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data, error } = await supabase
    .from('lieux')
    .select('id')
    .limit(1)

  // Si la requête échoue, on renvoie une vraie erreur 500
  // → cron-job.org verra ROUGE et t'enverra une alerte
  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message, pinged: new Date().toISOString() },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    rows: data?.length ?? 0,
    pinged: new Date().toISOString(),
  })
}