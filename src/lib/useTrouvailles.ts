'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';
import { toSlug } from './slug';
import type { Trouvaille, TrouvailleInput } from '@/types';

function normalize(row: any): Trouvaille {
  return {
    id: row.id,
    slug: row.slug ?? null,
    fournisseur_id: row.fournisseur_id,
    photo_url: row.photo_url ?? null,
    categorie: row.categorie ?? null,
    description: row.description ?? null,
    prix: row.prix ?? null,
    devise: row.devise ?? 'MAD',
    unite: row.unite ?? null,
    note: row.note ?? 0,
    created_at: row.created_at,
    fournisseur: row.fournisseur ? row.fournisseur : null,
  };
}

function makeSlug(desc: string, categorie: string): string {
  // toSlug attend (name, city) ; on reutilise pour (desc, categorie)
  const base = toSlug(desc || categorie || 'idee', '');
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}

export function useTrouvailles() {
  const [trouvailles, setTrouvailles] = useState<Trouvaille[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    // jointure fournisseur pour afficher le nom sur le mur de photos
    const { data, error } = await supabase
      .from('trouvailles')
      .select('*, fournisseur:fournisseurs(*)')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('useTrouvailles load:', error);
      setTrouvailles([]);
    } else {
      setTrouvailles((data ?? []).map(normalize));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addTrouvaille = useCallback(async (input: Partial<TrouvailleInput>) => {
    const payload: any = {
      slug: makeSlug(input.description ?? '', input.categorie ?? ''),
      fournisseur_id: input.fournisseur_id,
      photo_url: input.photo_url ?? null,
      categorie: input.categorie ?? null,
      description: input.description ?? null,
      prix: input.prix ?? null,
      devise: input.devise ?? 'MAD',
      unite: input.unite ?? null,
      note: input.note ?? 0,
    };
    const { data, error } = await supabase
      .from('trouvailles')
      .insert(payload)
      .select('*, fournisseur:fournisseurs(*)')
      .single();
    if (error) {
      console.error('addTrouvaille:', error);
      return null;
    }
    const t = normalize(data);
    setTrouvailles((prev) => [t, ...prev]);
    return t;
  }, []);

  const updateTrouvaille = useCallback(async (id: number, patch: Partial<TrouvailleInput>) => {
    const payload: any = {};
    for (const k of [
      'fournisseur_id', 'photo_url', 'categorie', 'description',
      'prix', 'devise', 'unite', 'note',
    ] as const) {
      if (k in patch) payload[k] = (patch as any)[k];
    }
    const { data, error } = await supabase
      .from('trouvailles')
      .update(payload)
      .eq('id', id)
      .select('*, fournisseur:fournisseurs(*)')
      .single();
    if (error) {
      console.error('updateTrouvaille:', error);
      return null;
    }
    const t = normalize(data);
    setTrouvailles((prev) => prev.map((x) => (x.id === id ? t : x)));
    return t;
  }, []);

  const deleteTrouvaille = useCallback(async (id: number) => {
    const { error } = await supabase.from('trouvailles').delete().eq('id', id);
    if (error) {
      console.error('deleteTrouvaille:', error);
      return false;
    }
    setTrouvailles((prev) => prev.filter((x) => x.id !== id));
    return true;
  }, []);

  return { trouvailles, loading, reload: load, addTrouvaille, updateTrouvaille, deleteTrouvaille };
}
