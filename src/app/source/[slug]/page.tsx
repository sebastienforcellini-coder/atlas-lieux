import { createClient } from '@supabase/supabase-js';
import type { Metadata } from 'next';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getClient() {
  return createClient(supabaseUrl, supabaseAnon);
}

async function getFournisseur(slug: string) {
  const supabase = getClient();
  const { data: f } = await supabase
    .from('fournisseurs')
    .select('*')
    .eq('slug', slug)
    .single();
  if (!f) return { fournisseur: null, trouvailles: [] as any[] };
  const { data: tr } = await supabase
    .from('trouvailles')
    .select('*')
    .eq('fournisseur_id', f.id)
    .order('categorie', { ascending: true });
  return { fournisseur: f, trouvailles: tr || [] };
}

const CREME = '#FDFCFA';
const BEIGE = '#F5F2ED';
const BRUN = '#8C5A28';

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const { fournisseur } = await getFournisseur(params.slug);
  if (!fournisseur) return { title: 'Fournisseur — Atlas' };
  return {
    title: `${fournisseur.name} — Atlas`,
    openGraph: {
      title: fournisseur.name,
      images: fournisseur.carte_visite_url ? [fournisseur.carte_visite_url] : [],
    },
  };
}

export default async function SourcePage(
  { params, searchParams }: { params: { slug: string }; searchParams: { prix?: string } }
) {
  const { fournisseur, trouvailles } = await getFournisseur(params.slug);
  const showPrice = searchParams?.prix === '1';

  if (!fournisseur) {
    return (
      <main style={{ fontFamily: 'Georgia, serif', textAlign: 'center', padding: 60, color: '#999' }}>
        Fournisseur introuvable.
      </main>
    );
  }

  return (
    <main style={{ fontFamily: 'Georgia, serif', background: BEIGE, minHeight: '100vh', margin: 0 }}>
      <div style={{ maxWidth: 640, margin: '0 auto', background: CREME, minHeight: '100vh', padding: 24 }}>
        <h1 style={{ fontStyle: 'italic', fontSize: 28, margin: '0 0 4px', color: '#333' }}>{fournisseur.name}</h1>
        <p style={{ margin: '0 0 20px', color: '#888', fontSize: 14 }}>
          {fournisseur.specialite}{fournisseur.specialite && fournisseur.city ? ' · ' : ''}{fournisseur.city}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {trouvailles.map((t: any) => {
            const prixTxt =
              t.prix != null
                ? `${Math.round(t.prix)} ${t.devise || 'MAD'}${t.unite && t.unite !== 'forfait' ? ' ' + t.unite : ''}`
                : null;
            return (
              <div key={t.id} style={{ border: '1px solid #ece6db', borderRadius: 12, overflow: 'hidden', background: CREME }}>
                <div style={{ height: 130, background: BEIGE }}>
                  {t.photo_url && <img src={t.photo_url} alt={t.description || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                </div>
                <div style={{ padding: '8px 10px' }}>
                  {showPrice && prixTxt && (
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 'bold', color: BRUN }}>{prixTxt}</p>
                  )}
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: '#999' }}>{t.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        <p style={{ fontSize: 13, color: '#bbb', marginTop: 30 }}>Partagé via Atlas</p>
      </div>
    </main>
  );
}
