'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useTrouvailles } from '@/lib/useTrouvailles';
import { useFournisseurs } from '@/lib/useFournisseurs';
import { supabase } from '@/lib/supabase';
import {
  ideeUrl, whatsappLink, mailtoLink, formatPrix,
} from '@/lib/sourcingShare';
import type { Fournisseur, Trouvaille } from '@/types';

const CREME = '#FDFCFA';
const BEIGE = '#F5F2ED';
const BRUN = '#8C5A28';

interface Props {
  fournisseur: Fournisseur;
  onBack?: () => void;
}

// champs editables de la fiche
const FIELDS: { key: keyof Fournisseur; label: string; placeholder: string }[] = [
  { key: 'specialite', label: 'Spécialité', placeholder: 'ferronnier, menuisier...' },
  { key: 'city', label: 'Ville', placeholder: 'ville' },
  { key: 'address', label: 'Adresse', placeholder: 'adresse' },
  { key: 'phone', label: 'Téléphone', placeholder: 'téléphone' },
  { key: 'whatsapp', label: 'WhatsApp', placeholder: 'ex. 2126...' },
  { key: 'email', label: 'Email', placeholder: 'email' },
  { key: 'website', label: 'Site web', placeholder: 'site' },
  { key: 'instagram', label: 'Instagram', placeholder: '@compte' },
];

export default function FournisseurDetail({ fournisseur: initial, onBack }: Props) {
  const { trouvailles } = useTrouvailles();
  const { updateFournisseur } = useFournisseurs();

  const [draft, setDraft] = useState<Fournisseur>(initial);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [shareTrouvaille, setShareTrouvaille] = useState<Trouvaille | null>(null);
  const [uploadingCarte, setUploadingCarte] = useState(false);
  const carteRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setDraft(initial); setDirty(false); }, [initial]);

  const mesTrouvailles = useMemo(
    () => trouvailles.filter((t) => t.fournisseur_id === draft.id),
    [trouvailles, draft.id]
  );

  function set<K extends keyof Fournisseur>(key: K, val: Fournisseur[K]) {
    setDraft((d) => ({ ...d, [key]: val }));
    setDirty(true);
  }

  async function handleCarte(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCarte(true);
    const ext = file.name.split('.').pop();
    const path = `sourcing/carte-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from('atlas').upload(path, file, { upsert: false });
    if (error) { console.error('upload carte:', error); setUploadingCarte(false); return; }
    const { data } = supabase.storage.from('atlas').getPublicUrl(path);
    set('carte_visite_url', data.publicUrl);
    setUploadingCarte(false);
  }

  async function save() {
    setSaving(true);
    const patch: any = { name: draft.name };
    for (const f of FIELDS) patch[f.key] = (draft as any)[f.key] || null;
    patch.carte_visite_url = draft.carte_visite_url || null;
    const updated = await updateFournisseur(draft.id, patch);
    if (updated) { setDraft(updated); setDirty(false); }
    setSaving(false);
  }

  const waNum = draft.whatsapp ? draft.whatsapp.replace(/[^0-9]/g, '') : '';

  return (
    <div style={{ padding: '8px 4px 100px', fontFamily: 'Georgia, serif', maxWidth: 640, margin: '0 auto' }}>
      {onBack && (
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: BRUN, fontSize: 14, cursor: 'pointer', marginBottom: 8, fontFamily: 'Georgia, serif' }}>
          {'< Retour'}
        </button>
      )}

      {/* Nom editable */}
      <input
        value={draft.name}
        onChange={(e) => set('name', e.target.value)}
        style={{ fontStyle: 'italic', fontSize: 26, color: '#333', border: 'none', borderBottom: '1px solid transparent', background: 'transparent', fontFamily: 'Georgia, serif', width: '100%', padding: '0 0 4px', outline: 'none' }}
        onFocus={(e) => (e.target.style.borderBottom = '1px solid #d8cfc0')}
        onBlur={(e) => (e.target.style.borderBottom = '1px solid transparent')}
      />

      {/* Boutons de contact rapides (si renseignes) */}
      <div style={{ display: 'flex', gap: 8, margin: '12px 0', flexWrap: 'wrap' }}>
        {waNum && <a href={`https://wa.me/${waNum}`} style={contactBtn('#e1f5ee', '#0f6e56')}>WhatsApp</a>}
        {draft.phone && <a href={`tel:${draft.phone}`} style={contactBtn(BEIGE, '#333')}>Appeler</a>}
        {draft.email && <a href={`mailto:${draft.email}`} style={contactBtn(BEIGE, '#333')}>Email</a>}
        {draft.website && <a href={draft.website} target="_blank" rel="noopener noreferrer" style={contactBtn(BEIGE, '#333')}>Site</a>}
        {draft.instagram && <a href={`https://instagram.com/${draft.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" style={contactBtn(BEIGE, '#333')}>Instagram</a>}
      </div>

      {/* Champs editables */}
      <div style={{ background: CREME, border: '1px solid #ece6db', borderRadius: 12, padding: '4px 14px', marginBottom: 16 }}>
        {FIELDS.map((f) => (
          <div key={String(f.key)} style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #f0ebe1', padding: '8px 0' }}>
            <span style={{ fontSize: 12, color: '#8C7A6B', width: 110, flexShrink: 0 }}>{f.label}</span>
            <input
              value={(draft as any)[f.key] || ''}
              placeholder={f.placeholder}
              onChange={(e) => set(f.key, e.target.value as any)}
              style={{ flex: 1, border: 'none', background: 'transparent', fontFamily: 'Georgia, serif', fontSize: 14, color: '#333', outline: 'none', padding: '2px 0' }}
            />
          </div>
        ))}
      </div>

      {/* Carte de visite */}
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 13, color: '#999', margin: '0 0 6px', fontStyle: 'italic' }}>Carte de visite</p>
        <div
          onClick={() => carteRef.current?.click()}
          style={{ height: draft.carte_visite_url ? 180 : 90, maxWidth: 320, border: '2px dashed #d8cfc0', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: draft.carte_visite_url ? `center/cover url(${draft.carte_visite_url})` : BEIGE, color: '#999', fontSize: 13 }}
        >
          {!draft.carte_visite_url && (uploadingCarte ? 'Envoi...' : 'Ajouter une photo de la carte')}
        </div>
        <input ref={carteRef} type="file" accept="image/*" capture="environment" onChange={handleCarte} style={{ display: 'none' }} />
      </div>

      {/* Trouvailles */}
      <p style={{ fontSize: 14, color: '#888', margin: '0 0 8px', fontStyle: 'italic' }}>
        Trouvailles - {mesTrouvailles.length}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {mesTrouvailles.map((t) => (
          <div key={t.id} style={{ border: '1px solid #ece6db', borderRadius: 12, overflow: 'hidden', background: CREME }}>
            <div style={{ width: '100%', aspectRatio: '1 / 1', background: BEIGE }}>
              {t.photo_url && <img src={t.photo_url} alt={t.description || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
            </div>
            <div style={{ padding: '6px 8px' }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 'bold', color: BRUN }}>{formatPrix(t.prix, t.devise, t.unite)}</p>
              <p style={{ margin: '2px 0 6px', fontSize: 11, color: '#999' }}>{t.description}</p>
              <button
                onClick={() => setShareTrouvaille(t)}
                style={{ background: 'none', border: '1px solid #e5ded3', borderRadius: 8, padding: '3px 8px', fontSize: 11, cursor: 'pointer', color: BRUN, fontFamily: 'Georgia, serif' }}
              >
                Partager
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Barre Sauvegarder (apparait si modif) */}
      {dirty && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: CREME, borderTop: '1px solid #ece6db', padding: 14, display: 'flex', justifyContent: 'center', zIndex: 500 }}>
          <button
            onClick={save}
            disabled={saving}
            style={{ background: BRUN, color: CREME, border: 'none', borderRadius: 10, padding: '12px 32px', fontSize: 16, cursor: 'pointer', fontFamily: 'Georgia, serif', opacity: saving ? 0.6 : 1 }}
          >
            {saving ? 'Enregistrement...' : 'Sauvegarder'}
          </button>
        </div>
      )}

      {shareTrouvaille && (
        <SharePanel trouvaille={shareTrouvaille} onClose={() => setShareTrouvaille(null)} />
      )}
    </div>
  );
}

function SharePanel({ trouvaille, onClose }: { trouvaille: Trouvaille; onClose: () => void }) {
  const [niveau, setNiveau] = useState<'image' | 'prix' | 'tout'>('image');
  const slug = trouvaille.slug ?? '';
  const url = ideeUrl(slug, niveau);
  const titre = trouvaille.description || 'Une idee deco';
  const texte = `${titre} - ${url}`;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 2000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ background: CREME, width: '100%', maxWidth: 480, borderRadius: '16px 16px 0 0', padding: 20, fontFamily: 'Georgia, serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontStyle: 'italic', fontSize: 20, margin: 0 }}>Partager</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#999' }}>x</button>
        </div>
        <p style={{ fontSize: 13, color: '#8C7A6B', margin: '0 0 8px' }}>Que veux-tu partager ?</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          <NiveauBtn label="Image seule" active={niveau === 'image'} onClick={() => setNiveau('image')} />
          <NiveauBtn label="Image + prix" active={niveau === 'prix'} onClick={() => setNiveau('prix')} />
          <NiveauBtn label="Tout (image + prix + contact fournisseur)" active={niveau === 'tout'} onClick={() => setNiveau('tout')} />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <a href={whatsappLink(texte)} target="_blank" rel="noopener noreferrer" style={{ ...shareBtn('#25D366'), flex: 1 }}>WhatsApp</a>
          <a href={mailtoLink('Idee deco', texte)} style={{ ...shareBtn(BRUN), flex: 1 }}>Email</a>
        </div>
        <p style={{ fontSize: 12, color: '#aaa', marginTop: 14, wordBreak: 'break-all' }}>{url}</p>
      </div>
    </div>
  );
}

function NiveauBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{ textAlign: 'left', padding: '10px 14px', borderRadius: 8, fontSize: 14, cursor: 'pointer', fontFamily: 'Georgia, serif', background: active ? '#f3ebdf' : '#fff', border: active ? `1.5px solid ${BRUN}` : '1px solid #ddd4c6', color: active ? BRUN : '#555' }}
    >
      {active ? '\u2713 ' : ''}{label}
    </button>
  );
}

function contactBtn(bg: string, color: string): React.CSSProperties {
  return { textDecoration: 'none', background: bg, color, fontSize: 13, padding: '9px 16px', borderRadius: 8, fontFamily: 'Georgia, serif' };
}
function shareBtn(bg: string): React.CSSProperties {
  return { textDecoration: 'none', background: bg, color: '#fff', textAlign: 'center', padding: 14, borderRadius: 10, fontSize: 15, fontFamily: 'Georgia, serif' };
}
