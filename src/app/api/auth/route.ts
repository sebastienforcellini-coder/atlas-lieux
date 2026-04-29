import { NextRequest, NextResponse } from 'next/server'

const PIN = '2266'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const pin = formData.get('pin') as string
  const from = formData.get('from') as string || '/'

  if (pin === PIN) {
    const response = NextResponse.redirect(new URL(from, request.url))
    response.cookies.set('atlas_session', 'ok', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 jours
      path: '/',
    })
    return response
  }

  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('from', from)
  loginUrl.searchParams.set('error', '1')
  return NextResponse.redirect(loginUrl)
}