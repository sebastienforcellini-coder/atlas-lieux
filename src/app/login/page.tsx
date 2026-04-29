'use client'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function LoginForm() {
  const searchParams = useSearchParams()
  const from = searchParams.get('from') || '/'
  const error = searchParams.get('error') === '1'

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#F5F2ED',
      fontFamily: 'Georgia, serif',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 20,
        padding: '40px 32px',
        width: '100%',
        maxWidth: 340,
        boxShadow: '0 4px 32px rgba(26,24,20,.1)',
        border: '1px solid rgba(26,24,20,.08)',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>🧭</div>
        <div style={{ fontStyle: 'italic', fontSize: 26, fontWeight: 300, color: '#1A1814', marginBottom: 4 }}>
          Atlas
        </div>
        <div style={{
          fontSize: 11, letterSpacing: 3, color: '#B0AA9E',
          textTransform: 'uppercase', fontFamily: 'system-ui, sans-serif', marginBottom: 32,
        }}>
          Répertoire de lieux
        </div>

        <form method="POST" action="/api/auth">
          <input type="hidden" name="from" value={from} />

          <label style={{
            display: 'block', fontSize: 12, color: '#8C7A6B',
            fontFamily: 'system-ui, sans-serif', letterSpacing: 1,
            textTransform: 'uppercase', marginBottom: 10,
          }}>
            Code d'accès
          </label>

          <input
            type="password"
            name="pin"
            inputMode="numeric"
            maxLength={6}
            autoFocus
            placeholder="••••"
            style={{
              width: '100%',
              padding: '14px 16px',
              borderRadius: 12,
              border: error ? '2px solid #e05a5a' : '1px solid rgba(26,24,20,.15)',
              fontSize: 24,
              textAlign: 'center',
              letterSpacing: 8,
              fontFamily: 'system-ui, sans-serif',
              outline: 'none',
              background: '#FDFCFA',
              boxSizing: 'border-box',
              color: '#1A1814',
              marginBottom: 8,
            }}
          />

          {error && (
            <div style={{ fontSize: 12, color: '#e05a5a', marginBottom: 12, fontFamily: 'system-ui, sans-serif' }}>
              Code incorrect, réessaie.
            </div>
          )}

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 12,
              border: 'none',
              background: '#8C5A28',
              color: '#fff',
              fontSize: 15,
              fontFamily: 'Georgia, serif',
              fontStyle: 'italic',
              cursor: 'pointer',
              fontWeight: 300,
              marginTop: 8,
            }}
          >
            Accéder →
          </button>
        </form>

        <div style={{ marginTop: 24, fontSize: 11, color: '#D0C8BE', fontFamily: 'system-ui, sans-serif' }}>
          Accès privé
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}