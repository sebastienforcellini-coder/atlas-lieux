import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const runtime = 'experimental-edge'

const PUBLIC_PATHS = [
  '/partager',
  '/collection',
  '/login',
  '/api',
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

  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const session = request.cookies.get('atlas_session')?.value
  if (session === 'ok') {
    return NextResponse.next()
  }

  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('from', pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sw.js|workbox.*).*)'],
}