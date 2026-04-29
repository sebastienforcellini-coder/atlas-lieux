import type { Metadata, Viewport } from 'next'
import { DM_Sans, Fraunces } from 'next/font/google'
import './globals.css'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm', display: 'swap' })
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces', style: ['normal', 'italic'], display: 'swap' })

export const metadata: Metadata = {
  title: 'Atlas — Répertoire de lieux',
  description: 'Répertoriez, classez et partagez vos lieux favoris',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.svg',
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Atlas',
    startupImage: '/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#F5F2ED',
}

// Chemins publics — pas de vérification PIN
const PUBLIC_PATHS = ['/partager', '/collection', '/login', '/api']

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const headersList = headers()
  const pathname = headersList.get('x-invoke-path') || headersList.get('x-pathname') || '/'

  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p))

  if (!isPublic) {
    const session = cookies().get('atlas_session')?.value
    if (session !== 'ok') {
      redirect(`/login?from=${encodeURIComponent(pathname)}`)
    }
  }

  return (
    <html lang="fr" className={`${dmSans.variable} ${fraunces.variable}`}>
      <body>{children}</body>
    </html>
  )
}