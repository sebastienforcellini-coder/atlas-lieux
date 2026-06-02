'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useTrouvailles } from '@/lib/useTrouvailles';
import { useFournisseurs } from '@/lib/useFournisseurs';
import { supabase } from '@/lib/supabase';
import { ideeUrl, whatsappLink, mailtoLink, formatPrix } from '@/lib/sourcingShare';
import { reverseGeocode } from '@/lib/geocode';
import type { Fournisseur, Trouvaille } from '@/types';

const CREME = '#FDFCFA';
const BEIGE = '#F5F2ED';
const BRUN = '#8C5A28';

interface Props {
  fournisseur: Fournisseur;
  onBack?: () => void;
}

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

// Etiquettes groupees (affichage), stockees a plat dans tags[]
const TAG_GROUPS: { groupe: string; tags: string[] }[] = [
  { groupe: 'Prix', tags: ['Prix canon', 'Correct', 'Trop cher', 'Négociable'] },
  { groupe: 'Contact', tags: ['Parle français', 'Anglais OK', 'Arabe/darija seulement', 'Réactif WhatsApp'] },
  { groupe: 'Relationnel', tags: ['Super sympa', 'Pro', 'Difficile'] },
  { groupe: 'Qualité / logistique', tags: ['Belle qualité', 'Qualité moyenne', 'Livre', 'Sur commande', 'Délais longs'] },
];

export default function FournisseurDetail({ fournisseur: initial, onBack }: Props) {
  const { trouvailles, deleteTrouvaille } = useTrouvailles();
  const { updateFournisseur, deleteFournisseur } = useFournisseurs();

  const [draft, setDraft] = useState<Fournisseur>(initial);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [shareTrouvaille, setShareTrouvaille] = useState<Trouvaille | null>(null);
  const [confirmDelTrouvaille, setConfirmDelTrouvaille] = useState<number | null>(null);
  const [confirmDelFournisseur, setConfirmDelFournisseur] = useState(false);
  const [uploadingCarte, setUploadingCarte] = useState(false);
  const [locating, setLocating] = useState(false);
  const [showGpsMenu, setShowGpsMenu] = useState(false);
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

  function toggleTag(tag: string) {
    const current = draft.tags || [];
    const next = current.includes(tag) ? current.filter((x) => x !== tag) : [...current, tag];
    set('tags', next as any);
  }

  function captureGPS() {
    if (!navigator.geolocation) { alert('Géolocalisation non disponible.'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setDraft((d) => ({ ...d, gps_lat: lat, gps_lng: lng }));
        setDirty(true);
        // remplir ville/adresse si vides, via reverseGeocode
        const geo = await reverseGeocode(lat, lng);
        setDraft((d) => ({
          ...d,
          gps_lat: lat,
          gps_lng: lng,
          city: d.city || geo.city || null,
          address: d.address || geo.address || null,
        }));
        setLocating(false);
      },
      (err) => { console.error('geoloc:', err); alert('Position non récupérée. Autorise la localisation.'); setLocating(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
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
    patch.notes = draft.notes || null;
    patch.tags = draft.tags || [];
    patch.gps_lat = draft.gps_lat ?? null;
    patch.gps_lng = draft.gps_lng ?? null;
    const updated = await updateFournisseur(draft.id, patch);
    if (updated) { setDraft(updated); setDirty(false); }
    setSaving(false);
  }

  async function doDeleteTrouvaille(id: number) {
    await deleteTrouvaille(id);
    setConfirmDelTrouvaille(null);
  }

  async function doDeleteFournisseur() {
    const ok = await deleteFournisseur(draft.id);
    setConfirmDelFournisseur(false);
    if (ok && onBack) onBack();
  }

  const waNum = draft.whatsapp ? draft.whatsapp.replace(/[^0-9]/g, '') : '';

  return (
    <div style={{ padding: '8px 4px 100px', fontFamily: 'Georgia, serif', maxWidth: 640, margin: '0 auto' }}>
      {onBack && (
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: BRUN, fontSize: 14, cursor: 'pointer', marginBottom: 8, fontFamily: 'Georgia, serif' }}>
          {'< Retour'}
        </button>
      )}

      <input
        value={draft.name}
        onChange={(e) => set('name', e.target.value)}
        style={{ fontStyle: 'italic', fontSize: 26, color: '#333', border: 'none', borderBottom: '1px solid transparent', background: 'transparent', fontFamily: 'Georgia, serif', width: '100%', padding: '0 0 4px', outline: 'none' }}
        onFocus={(e) => (e.target.style.borderBottom = '1px solid #d8cfc0')}
        onBlur={(e) => (e.target.style.borderBottom = '1px solid transparent')}
      />

      <div style={{ display: 'flex', gap: 8, margin: '12px 0', flexWrap: 'wrap' }}>
        {waNum && <a href={`https://wa.me/${waNum}`} style={contactBtn('#e1f5ee', '#0f6e56')}>WhatsApp</a>}
        {draft.phone && <a href={`tel:${draft.phone}`} style={contactBtn(BEIGE, '#333')}>Appeler</a>}
        {draft.email && <a href={`mailto:${draft.email}`} style={contactBtn(BEIGE, '#333')}>Email</a>}
        {draft.website && <a href={draft.website} target="_blank" rel="noopener noreferrer" style={contactBtn(BEIGE, '#333')}>Site</a>}
        {draft.instagram && <a href={`https://instagram.com/${draft.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" style={contactBtn(BEIGE, '#333')}>Instagram</a>}
      </div>

      {/* Geolocalisation */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button
          onClick={captureGPS}
          disabled={locating}
          style={{ background: BEIGE, color: '#333', border: '1px solid #ddd4c6', borderRadius: 8, padding: '9px 16px', fontSize: 13, cursor: 'pointer', fontFamily: 'Georgia, serif', opacity: locating ? 0.6 : 1 }}
        >
          {locating ? 'Localisation...' : (draft.gps_lat ? 'Mettre à jour ma position' : 'Ma position')}
        </button>
        {draft.gps_lat && draft.gps_lng && (
          <button
            onClick={() => setShowGpsMenu(true)}
            style={{ background: '#e1f5ee', color: '#0f6e56', border: 'none', borderRadius: 8, padding: '9px 16px', fontSize: 13, cursor: 'pointer', fontFamily: 'Georgia, serif' }}
          >
            📍 {Number(draft.gps_lat).toFixed(5)}, {Number(draft.gps_lng).toFixed(5)} → Navigation
          </button>
        )}
      </div>

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

      {/* Etiquettes */}
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 13, color: '#999', margin: '0 0 8px', fontStyle: 'italic' }}>Étiquettes</p>
        {TAG_GROUPS.map((g) => (
          <div key={g.groupe} style={{ marginBottom: 10 }}>
            <p style={{ fontSize: 11, color: '#b0a99b', margin: '0 0 4px' }}>{g.groupe}</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {g.tags.map((tag) => {
                const on = (draft.tags || []).includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    style={{ padding: '5px 12px', borderRadius: 999, fontSize: 12, cursor: 'pointer', fontFamily: 'Georgia, serif', background: on ? BRUN : '#fff', color: on ? CREME : '#777', border: on ? 'none' : '1px solid #ddd4c6' }}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Note libre */}
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 13, color: '#999', margin: '0 0 6px', fontStyle: 'italic' }}>Note</p>
        <textarea
          value={draft.notes || ''}
          placeholder="Remarques libres (ex. demander Youssef, ouvert le dimanche...)"
          onChange={(e) => set('notes', e.target.value)}
          rows={3}
          style={{ width: '100%', border: '1px solid #ddd4c6', borderRadius: 10, background: '#fff', fontFamily: 'Georgia, serif', fontSize: 14, color: '#333', padding: 10, boxSizing: 'border-box', resize: 'vertical' }}
        />
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
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => setShareTrouvaille(t)}
                  style={{ background: 'none', border: '1px solid #e5ded3', borderRadius: 8, padding: '3px 8px', fontSize: 11, cursor: 'pointer', color: BRUN, fontFamily: 'Georgia, serif' }}
                >
                  Partager
                </button>
                <button
                  onClick={() => setConfirmDelTrouvaille(t.id)}
                  style={{ background: 'none', border: '1px solid #f0d0d0', borderRadius: 8, padding: '3px 8px', fontSize: 11, cursor: 'pointer', color: '#b04444', fontFamily: 'Georgia, serif' }}
                >
                  Suppr.
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Supprimer le fournisseur — seulement si 0 trouvaille */}
      {mesTrouvailles.length === 0 && (
        <button
          onClick={() => setConfirmDelFournisseur(true)}
          style={{ marginTop: 24, background: 'none', border: '1px solid #f0d0d0', borderRadius: 10, padding: '8px 16px', fontSize: 13, cursor: 'pointer', color: '#b04444', fontFamily: 'Georgia, serif' }}
        >
          Supprimer ce fournisseur
        </button>
      )}

      {/* Barre Sauvegarder */}
      {dirty && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: CREME, borderTop: '1px solid #ece6db', padding: 14, display: 'flex', justifyContent: 'center', zIndex: 500 }}>
          <button onClick={save} disabled={saving} style={{ background: BRUN, color: CREME, border: 'none', borderRadius: 10, padding: '12px 32px', fontSize: 16, cursor: 'pointer', fontFamily: 'Georgia, serif', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Enregistrement...' : 'Sauvegarder'}
          </button>
        </div>
      )}

      {shareTrouvaille && <SharePanel trouvaille={shareTrouvaille} onClose={() => setShareTrouvaille(null)} />}

      {showGpsMenu && draft.gps_lat && draft.gps_lng && (
        <GpsMenu lat={draft.gps_lat} lng={draft.gps_lng} onClose={() => setShowGpsMenu(false)} />
      )}

      {confirmDelTrouvaille !== null && (
        <ConfirmModal
          title="Supprimer cette trouvaille ?"
          sub="La photo et son tarif seront définitivement supprimés."
          onConfirm={() => doDeleteTrouvaille(confirmDelTrouvaille)}
          onCancel={() => setConfirmDelTrouvaille(null)}
        />
      )}
      {confirmDelFournisseur && (
        <ConfirmModal
          title="Supprimer ce fournisseur ?"
          sub="Cette action est définitive."
          onConfirm={doDeleteFournisseur}
          onCancel={() => setConfirmDelFournisseur(false)}
        />
      )}
    </div>
  );
}

function ConfirmModal({ title, sub, onConfirm, onCancel }: { title: string; sub: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 2100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: CREME, borderRadius: 16, padding: 24, maxWidth: 360, fontFamily: 'Georgia, serif', textAlign: 'center' }}>
        <h2 style={{ fontStyle: 'italic', fontSize: 20, margin: '0 0 8px', color: '#333' }}>{title}</h2>
        <p style={{ fontSize: 14, color: '#888', margin: '0 0 20px' }}>{sub}</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, background: '#fff', border: '1px solid #ddd4c6', borderRadius: 10, padding: 12, fontSize: 15, cursor: 'pointer', color: '#555', fontFamily: 'Georgia, serif' }}>Annuler</button>
          <button onClick={onConfirm} style={{ flex: 1, background: '#b04444', color: '#fff', border: 'none', borderRadius: 10, padding: 12, fontSize: 15, cursor: 'pointer', fontFamily: 'Georgia, serif' }}>Supprimer</button>
        </div>
      </div>
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
    <button onClick={onClick} style={{ textAlign: 'left', padding: '10px 14px', borderRadius: 8, fontSize: 14, cursor: 'pointer', fontFamily: 'Georgia, serif', background: active ? '#f3ebdf' : '#fff', border: active ? `1.5px solid ${BRUN}` : '1px solid #ddd4c6', color: active ? BRUN : '#555' }}>
      {active ? '\u2713 ' : ''}{label}
    </button>
  );
}

function GpsMenu({ lat, lng, onClose }: { lat: number; lng: number; onClose: () => void }) {
  const apps = [
    { name: 'Google Maps', url: `https://maps.google.com/?q=${lat},${lng}` },
    { name: 'Plans (Apple)', url: `https://maps.apple.com/?q=${lat},${lng}&ll=${lat},${lng}` },
    { name: 'Waze', url: `https://waze.com/ul?ll=${lat},${lng}&navigate=yes` },
  ];
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 2000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: CREME, width: '100%', maxWidth: 480, borderRadius: '16px 16px 0 0', padding: 20, fontFamily: 'Georgia, serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontStyle: 'italic', fontSize: 20, margin: 0 }}>Y aller</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#999' }}>x</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {apps.map((a) => (
            <a key={a.name} href={a.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', textAlign: 'center', background: '#fff', border: '1px solid #ddd4c6', borderRadius: 10, padding: 14, fontSize: 15, color: '#333', fontFamily: 'Georgia, serif' }}>
              {a.name}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function contactBtn(bg: string, color: string): React.CSSProperties {
  return { textDecoration: 'none', background: bg, color, fontSize: 13, padding: '9px 16px', borderRadius: 8, fontFamily: 'Georgia, serif' };
}
function shareBtn(bg: string): React.CSSProperties {
  return { textDecoration: 'none', background: bg, color: '#fff', textAlign: 'center', padding: 14, borderRadius: 10, fontSize: 15, fontFamily: 'Georgia, serif' };
}
