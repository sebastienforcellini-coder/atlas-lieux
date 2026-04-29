import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Pages publiques — accessibles sans PIN
const PUBLIC_PATHS = [
  '/partager',
  '/collection',
  '/login',
  '/_next',
  '/favicon',
  '/icon',
  '/apple-touch-icon',
  '/manifest',
  '/og-logo',
  '/sw.js',
  '/workbox',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Laisser passer les chemins publics
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Vérifier le cookie de session
  const session = request.cookies.get('atlas_session')?.value
  if (session === 'ok') {
    return NextResponse.next()
  }

  // Rediriger vers la page login
  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('from', pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}