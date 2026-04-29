import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const PIN = '2266'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { from?: string; error?: string }
}) {
  const from = searchParams.from || '/'
  const error = searchParams.error === '1'

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
        {/* Logo */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 36 }}>🧭</div>
        </div>
        <div style={{
          fontStyle: 'italic',
          fontSize: 26,
          fontWeight: 300,
          color: '#1A1814',
          marginBottom: 4,
        }}>
          Atlas
        </div>
        <div style={{
          fontSize: 11,
          letterSpacing: 3,
          color: '#B0AA9E',
          textTransform: 'uppercase',
          fontFamily: 'system-ui, sans-serif',
          marginBottom: 32,
        }}>
          Répertoire de lieux
        </div>

        {/* Formulaire PIN */}
        <form action={async (formData: FormData) => {
          'use server'
          const pin = formData.get('pin') as string
          const from = formData.get('from') as string

          if (pin === PIN) {
            cookies().set('atlas_session', 'ok', {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              maxAge: 60 * 60 * 24 * 30, // 30 jours
              path: '/',
            })
            redirect(from || '/')
          } else {
            redirect(`/login?from=${encodeURIComponent(from)}&error=1`)
          }
        }}>
          <input type="hidden" name="from" value={from} />

          <div style={{ marginBottom: 16 }}>
            <label style={{
              display: 'block',
              fontSize: 12,
              color: '#8C7A6B',
              fontFamily: 'system-ui, sans-serif',
              letterSpacing: 1,
              textTransform: 'uppercase',
              marginBottom: 10,
            }}>
              Code d'accès
            </label>
            <input
              type="password"
              name="pin"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              autoFocus
              placeholder="••••"
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: 12,
                border: error
                  ? '2px solid #e05a5a'
                  : '1px solid rgba(26,24,20,.15)',
                fontSize: 24,
                textAlign: 'center',
                letterSpacing: 8,
                fontFamily: 'system-ui, sans-serif',
                outline: 'none',
                background: '#FDFCFA',
                boxSizing: 'border-box',
                color: '#1A1814',
              }}
            />
            {error && (
              <div style={{
                fontSize: 12,
                color: '#e05a5a',
                marginTop: 8,
                fontFamily: 'system-ui, sans-serif',
              }}>
                Code incorrect, réessaie.
              </div>
            )}
          </div>

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
            }}
          >
            Accéder →
          </button>
        </form>

        <div style={{
          marginTop: 24,
          fontSize: 11,
          color: '#D0C8BE',
          fontFamily: 'system-ui, sans-serif',
        }}>
          Accès privé
        </div>
      </div>
    </div>
  )
}