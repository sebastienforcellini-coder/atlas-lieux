'use client';

import { useState, useMemo, useRef } from 'react';
import { useTrouvailles } from '@/lib/useTrouvailles';
import { useFournisseurs } from '@/lib/useFournisseurs';
import { supabase } from '@/lib/supabase';
import { CATEGORIES_PRODUIT, UNITES_PRIX } from '@/lib/categoriesProduit';
import { formatPrix } from '@/lib/sourcingShare';
import type { Trouvaille, Fournisseur } from '@/types';

const CREME = '#FDFCFA';
const BEIGE = '#F5F2ED';
const BRUN = '#8C5A28';

const PREVIEW_PER_GROUP = 4;

interface SourcingProps {
  onOpenFournisseur?: (f: Fournisseur) => void;
}

export default function Sourcing({ onOpenFournisseur }: SourcingProps) {
  const { trouvailles, loading, addTrouvaille } = useTrouvailles();
  const { fournisseurs, addFournisseur } = useFournisseurs();

  const [filtre, setFiltre] = useState<string>('Tout');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showForm, setShowForm] = useState(false);
  const [zoom, setZoom] = useState<Trouvaille | null>(null);

  const categoriesPresentes = useMemo(() => {
    const set = new Set<string>();
    trouvailles.forEach((t) => t.categorie && set.add(t.categorie));
    return Array.from(set);
  }, [trouvailles]);

  const parCategorie = useMemo(() => {
    const map: Record<string, Trouvaille[]> = {};
    const list = filtre === 'Tout' ? trouvailles : trouvailles.filter((t) => t.categorie === filtre);
    for (const t of list) {
      const c = t.categorie || 'Sans categorie';
      (map[c] = map[c] || []).push(t);
    }
    return map;
  }, [trouvailles, filtre]);

  const categoriesAffichees = useMemo(() => {
    const keys = Object.keys(parCategorie);
    if (filtre !== 'Tout') {
      keys.forEach((k) =>
        parCategorie[k].sort((a, b) => (a.prix ?? Infinity) - (b.prix ?? Infinity))
      );
    }
    return keys.sort();
  }, [parCategorie, filtre]);

  function resolveFournisseur(t: Trouvaille): Fournisseur | null {
    return fournisseurs.find((x) => x.id === t.fournisseur_id) || t.fournisseur || null;
  }

  return (
    <div style={{ padding: '8px 4px 80px', fontFamily: 'Georgia, serif', maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontStyle: 'italic', fontSize: 26, margin: 0, color: '#333' }}>Sourcing</h1>
        <button
          onClick={() => setShowForm(true)}
          style={{ background: BRUN, color: CREME, border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 14, cursor: 'pointer', fontFamily: 'Georgia, serif' }}
        >
          + Trouvaille
        </button>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        <Pill label="Tout" active={filtre === 'Tout'} onClick={() => setFiltre('Tout')} />
        {categoriesPresentes.sort().map((c) => (
          <Pill key={c} label={c} active={filtre === c} onClick={() => setFiltre(c)} />
        ))}
      </div>

      {loading && <p style={{ color: '#999' }}>Chargement...</p>}
      {!loading && trouvailles.length === 0 && (
        <p style={{ color: '#999', fontStyle: 'italic' }}>
          Aucune trouvaille pour l'instant. Clique sur "+ Trouvaille" apres une visite de sourcing.
        </p>
      )}

      {categoriesAffichees.map((cat) => {
        const items = parCategorie[cat];
        const isExpanded = expanded[cat] || filtre !== 'Tout';
        const visibles = isExpanded ? items : items.slice(0, PREVIEW_PER_GROUP);
        return (
          <div key={cat} style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 14, color: '#888', margin: '0 0 8px', fontStyle: 'italic' }}>
              {cat} - {items.length}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {visibles.map((t) => (
                <PhotoCard key={t.id} t={t} onClick={() => { const f = fournisseurs.find((x) => x.id === t.fournisseur_id) || t.fournisseur || null; if (f && onOpenFournisseur) onOpenFournisseur(f); }} />
              ))}
            </div>
            {filtre === 'Tout' && items.length > PREVIEW_PER_GROUP && (
              <button
                onClick={() => setExpanded((p) => ({ ...p, [cat]: !p[cat] }))}
                style={{ marginTop: 8, background: 'none', border: 'none', color: BRUN, fontSize: 13, cursor: 'pointer', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
              >
                {isExpanded ? 'Reduire' : `Voir les ${items.length}`}
              </button>
            )}
          </div>
        );
      })}

      {zoom && (
        <ZoomModal
          t={zoom}
          fournisseur={resolveFournisseur(zoom)}
          onClose={() => setZoom(null)}
          onOpenFournisseur={(f) => { setZoom(null); onOpenFournisseur && onOpenFournisseur(f); }}
        />
      )}

      {showForm && (
        <TrouvailleForm
          fournisseurs={fournisseurs}
          onClose={() => setShowForm(false)}
          onAddFournisseur={addFournisseur}
          onSave={async (data) => { await addTrouvaille(data); setShowForm(false); }}
        />
      )}
    </div>
  );
}

function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{ background: active ? BRUN : CREME, color: active ? CREME : '#666', border: active ? 'none' : '1px solid #e5ded3', borderRadius: 999, padding: '5px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'Georgia, serif' }}
    >
      {label}
    </button>
  );
}

// Vignette CARREE (ratio 1:1) qui remplit
function PhotoCard({ t, onClick }: { t: Trouvaille; onClick: () => void }) {
  const fname = t.fournisseur?.name || '';
  return (
    <div
      onClick={onClick}
      style={{ border: '1px solid #ece6db', borderRadius: 12, overflow: 'hidden', background: CREME, cursor: 'pointer' }}
    >
      <div style={{ width: '100%', aspectRatio: '1 / 1', background: BEIGE }}>
        {t.photo_url ? (
          <img src={t.photo_url} alt={t.description || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#bbb' }}>(photo)</div>
        )}
      </div>
      <div style={{ padding: '8px 10px' }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 'bold', color: BRUN }}>
          {formatPrix(t.prix, t.devise, t.unite)}
        </p>
        <p style={{ margin: '2px 0 0', fontSize: 11, color: '#999' }}>
          {t.description ? t.description : ''}{t.description && fname ? ' - ' : ''}{fname}
        </p>
      </div>
    </div>
  );
}

// Modal d'agrandissement : photo ENTIERE (rien coupe) + bouton fournisseur
function ZoomModal({
  t, fournisseur, onClose, onOpenFournisseur,
}: {
  t: Trouvaille;
  fournisseur: Fournisseur | null;
  onClose: () => void;
  onOpenFournisseur: (f: Fournisseur) => void;
}) {
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}
    >
      <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 20, background: 'none', border: 'none', color: '#fff', fontSize: 32, cursor: 'pointer' }}>x</button>
      {t.photo_url && (
        <img
          src={t.photo_url}
          alt={t.description || ''}
          onClick={(e) => e.stopPropagation()}
          style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 8 }}
        />
      )}
      <div onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center', marginTop: 16, fontFamily: 'Georgia, serif' }}>
        <p style={{ color: '#fff', fontSize: 22, fontWeight: 'bold', margin: '0 0 4px' }}>{formatPrix(t.prix, t.devise, t.unite)}</p>
        {t.description && <p style={{ color: '#ddd', fontSize: 15, margin: '0 0 12px' }}>{t.description}</p>}
        {fournisseur && (
          <button
            onClick={() => onOpenFournisseur(fournisseur)}
            style={{ background: BRUN, color: CREME, border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 15, cursor: 'pointer', fontFamily: 'Georgia, serif' }}
          >
            Voir le fournisseur : {fournisseur.name}
          </button>
        )}
      </div>
    </div>
  );
}

function TrouvailleForm({
  fournisseurs, onClose, onSave, onAddFournisseur,
}: {
  fournisseurs: Fournisseur[];
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  onAddFournisseur: (input: any) => Promise<Fournisseur | null>;
}) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [categorie, setCategorie] = useState('');
  const [customCat, setCustomCat] = useState('');
  const [prix, setPrix] = useState('');
  const [unite, setUnite] = useState('');
  const [description, setDescription] = useState('');
  const [fournisseurId, setFournisseurId] = useState<string>('');
  const [newFournisseur, setNewFournisseur] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `sourcing/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from('atlas').upload(path, file, { upsert: false });
    if (error) { console.error('upload photo:', error); setUploading(false); return; }
    const { data } = supabase.storage.from('atlas').getPublicUrl(path);
    setPhotoUrl(data.publicUrl);
    setUploading(false);
  }

  async function save() {
    let fid = fournisseurId ? Number(fournisseurId) : null;
    if (!fid && newFournisseur.trim()) {
      const f = await onAddFournisseur({ name: newFournisseur.trim() });
      if (f) fid = f.id;
    }
    if (!fid) { alert('Choisis ou cree un fournisseur.'); return; }
    const finalCat = categorie === '__autre__' ? customCat.trim() : categorie;
    await onSave({
      fournisseur_id: fid,
      photo_url: photoUrl,
      categorie: finalCat || null,
      description: description.trim() || null,
      prix: prix ? Number(prix) : null,
      devise: 'MAD',
      unite: unite || null,
    });
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ background: CREME, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', borderRadius: '16px 16px 0 0', padding: 20, fontFamily: 'Georgia, serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontStyle: 'italic', fontSize: 20, margin: 0 }}>Nouvelle trouvaille</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#999' }}>x</button>
        </div>

        <div
          onClick={() => fileRef.current?.click()}
          style={{ height: 160, border: '2px dashed #d8cfc0', borderRadius: 12, marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: photoUrl ? `center/cover url(${photoUrl})` : BEIGE, color: '#999' }}
        >
          {!photoUrl && (uploading ? 'Envoi...' : 'Ajouter une photo')}
        </div>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFile} style={{ display: 'none' }} />

        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input type="number" inputMode="decimal" placeholder="Prix" value={prix} onChange={(e) => setPrix(e.target.value)} style={inputStyle(2)} />
          <select value={unite} onChange={(e) => setUnite(e.target.value)} style={inputStyle(1)}>
            {UNITES_PRIX.map((u) => <option key={u} value={u}>{u === '' ? 'unite' : u}</option>)}
          </select>
        </div>

        <select value={categorie} onChange={(e) => setCategorie(e.target.value)} style={{ ...inputStyle(1), marginBottom: 12 }}>
          <option value="">- Categorie -</option>
          {CATEGORIES_PRODUIT.map((g) => (
            <optgroup key={g.groupe} label={g.groupe}>
              {g.items.map((it) => <option key={it} value={it}>{it}</option>)}
            </optgroup>
          ))}
          <option value="__autre__">+ Autre...</option>
        </select>
        {categorie === '__autre__' && (
          <input placeholder="Nouvelle categorie" value={customCat} onChange={(e) => setCustomCat(e.target.value)} style={{ ...inputStyle(1), marginBottom: 12 }} />
        )}

        <input placeholder="Description (ex. zellige vert 10x10)" value={description} onChange={(e) => setDescription(e.target.value)} style={{ ...inputStyle(1), marginBottom: 12 }} />

        <select value={fournisseurId} onChange={(e) => setFournisseurId(e.target.value)} style={{ ...inputStyle(1), marginBottom: 8 }}>
          <option value="">- Fournisseur existant -</option>
          {fournisseurs.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
        {!fournisseurId && (
          <input placeholder="...ou nouveau fournisseur" value={newFournisseur} onChange={(e) => setNewFournisseur(e.target.value)} style={{ ...inputStyle(1), marginBottom: 12 }} />
        )}

        <button onClick={save} style={{ width: '100%', background: BRUN, color: CREME, border: 'none', borderRadius: 10, padding: 14, fontSize: 16, cursor: 'pointer', fontFamily: 'Georgia, serif', marginTop: 8 }}>
          Enregistrer
        </button>
      </div>
    </div>
  );
}

function inputStyle(flex: number): React.CSSProperties {
  return { flex, width: '100%', padding: 10, fontSize: 15, borderRadius: 8, border: '1px solid #ddd4c6', background: '#fff', fontFamily: 'Georgia, serif', boxSizing: 'border-box' };
}
