/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  skipWaiting: true,
  clientsClaim: true,
  runtimeCaching: [],  // Désactive le cache PWA pour laisser le middleware fonctionner
})

module.exports = withPWA({
  reactStrictMode: true,
  async headers() {
    return [
      {
        // Empêche Vercel de mettre en cache les pages protégées
        source: '/((?!partager|collection|_next|favicon|icon|manifest|sw.js|workbox).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate',
          },
        ],
      },
    ]
  },
})