import { createClient } from '@supabase/supabase-js';
import type { Metadata } from 'next';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getClient() {
  return createClient(supabaseUrl, supabaseAnon);
}

async function getTrouvaille(slug: string) {
  const supabase = getClient();
  const { data } = await supabase
    .from('trouvailles')
    .select('*, fournisseur:fournisseurs(*)')
    .eq('slug', slug)
    .single();
  return data;
}

const CREME = '#FDFCFA';
const BEIGE = '#F5F2ED';
const BRUN = '#8C5A28';

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const t = await getTrouvaille(params.slug);
  if (!t) return { title: 'Idee deco - Atlas' };
  return {
    title: `${t.description || 'Idee deco'} - Atlas`,
    openGraph: {
      title: t.description || 'Idee deco',
      images: t.photo_url ? [t.photo_url] : [],
    },
  };
}

export default async function IdeePage(
  { params, searchParams }: { params: { slug: string }; searchParams: { n?: string; prix?: string } }
) {
  const t = await getTrouvaille(params.slug);
  // niveau : 'image' (defaut) | 'prix' | 'tout'
  // retro-compat : ancien ?prix=1 => niveau 'prix'
  let niveau = searchParams?.n || (searchParams?.prix === '1' ? 'prix' : 'image');
  if (!['image', 'prix', 'tout'].includes(niveau)) niveau = 'image';

  const showPrice = niveau === 'prix' || niveau === 'tout';
  const showContact = niveau === 'tout';

  if (!t) {
    return (
      <main style={{ fontFamily: 'Georgia, serif', textAlign: 'center', padding: 60, color: '#999' }}>
        Idee introuvable.
      </main>
    );
  }

  const f = t.fournisseur || null;
  const prixTxt =
    t.prix != null
      ? `${Math.round(t.prix)} ${t.devise || 'MAD'}${t.unite && t.unite !== 'forfait' ? ' ' + t.unite : t.unite === 'forfait' ? ' (forfait)' : ''}`
      : null;
  const waNum = f && f.whatsapp ? f.whatsapp.replace(/[^0-9]/g, '') : '';

  return (
    <main style={{ fontFamily: 'Georgia, serif', background: BEIGE, minHeight: '100vh', margin: 0 }}>
      <div style={{ maxWidth: 560, margin: '0 auto', background: CREME, minHeight: '100vh' }}>
        {t.photo_url && (
          <img src={t.photo_url} alt={t.description || ''} style={{ width: '100%', maxHeight: 520, objectFit: 'cover', display: 'block' }} />
        )}
        <div style={{ padding: 24 }}>
          {t.categorie && (
            <p style={{ margin: '0 0 6px', fontSize: 13, color: BRUN, textTransform: 'uppercase', letterSpacing: 1 }}>{t.categorie}</p>
          )}
          <h1 style={{ fontStyle: 'italic', fontSize: 26, margin: '0 0 12px', color: '#333' }}>
            {t.description || 'Idee deco'}
          </h1>

          {showPrice && prixTxt && (
            <p style={{ fontSize: 22, fontWeight: 'bold', color: BRUN, margin: '0 0 16px' }}>{prixTxt}</p>
          )}

          {showContact && f && (
            <div style={{ borderTop: '1px solid #ece6db', paddingTop: 16, marginTop: 8 }}>
              <p style={{ fontSize: 13, color: '#999', margin: '0 0 4px', fontStyle: 'italic' }}>Fournisseur</p>
              <p style={{ fontSize: 18, margin: '0 0 4px', color: '#333' }}>{f.name}</p>
              {(f.specialite || f.city) && (
                <p style={{ fontSize: 14, color: '#888', margin: '0 0 12px' }}>
                  {f.specialite}{f.specialite && f.city ? ' - ' : ''}{f.city}
                </p>
              )}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {waNum && <a href={`https://wa.me/${waNum}`} style={{ textDecoration: 'none', background: '#e1f5ee', color: '#0f6e56', fontSize: 13, padding: '9px 16px', borderRadius: 8 }}>WhatsApp</a>}
                {f.phone && <a href={`tel:${f.phone}`} style={{ textDecoration: 'none', background: BEIGE, color: '#333', fontSize: 13, padding: '9px 16px', borderRadius: 8 }}>Appeler</a>}
                {f.email && <a href={`mailto:${f.email}`} style={{ textDecoration: 'none', background: BEIGE, color: '#333', fontSize: 13, padding: '9px 16px', borderRadius: 8 }}>Email</a>}
                {f.instagram && <a href={`https://instagram.com/${f.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', background: BEIGE, color: '#333', fontSize: 13, padding: '9px 16px', borderRadius: 8 }}>Instagram</a>}
              </div>
            </div>
          )}

          <p style={{ fontSize: 13, color: '#bbb', marginTop: 30 }}>Partage via Atlas</p>
        </div>
      </div>
    </main>
  );
}
