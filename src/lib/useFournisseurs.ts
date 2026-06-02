'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';
import { toSlug } from './slug';
import type { Fournisseur, FournisseurInput } from '@/types';

// Normalise une ligne Supabase -> objet Fournisseur propre
function normalize(row: any): Fournisseur {
  return {
    id: row.id,
    slug: row.slug ?? null,
    name: row.name ?? '',
    specialite: row.specialite ?? null,
    city: row.city ?? null,
    address: row.address ?? null,
    gps_lat: row.gps_lat ?? null,
    gps_lng: row.gps_lng ?? null,
    phone: row.phone ?? null,
    whatsapp: row.whatsapp ?? null,
    email: row.email ?? null,
    website: row.website ?? null,
    instagram: row.instagram ?? null,
    carte_visite_url: row.carte_visite_url ?? null,
    notes: row.notes ?? null,
    created_at: row.created_at,
  };
}

// Genere un slug unique (suffixe court aleatoire facon collections : marrakech-m4m7)
// toSlug attend (name, city) -> on passe city='' pour ne pas avoir de "undefined"
function makeSlug(name: string, city?: string | null): string {
  const base = toSlug(name || 'fournisseur', city || '');
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}

export function useFournisseurs() {
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('fournisseurs')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('useFournisseurs load:', error);
      setFournisseurs([]);
    } else {
      setFournisseurs((data ?? []).map(normalize));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addFournisseur = useCallback(async (input: Partial<FournisseurInput>) => {
    const payload: any = {
      slug: makeSlug(input.name ?? '', input.city ?? ''),
      name: input.name ?? '',
      specialite: input.specialite ?? null,
      city: input.city ?? null,
      address: input.address ?? null,
      gps_lat: input.gps_lat ?? null,
      gps_lng: input.gps_lng ?? null,
      phone: input.phone ?? null,
      whatsapp: input.whatsapp ?? null,
      email: input.email ?? null,
      website: input.website ?? null,
      instagram: input.instagram ?? null,
      carte_visite_url: input.carte_visite_url ?? null,
      notes: input.notes ?? null,
    };
    const { data, error } = await supabase
      .from('fournisseurs')
      .insert(payload)
      .select('*')
      .single();
    if (error) {
      console.error('addFournisseur:', error);
      return null;
    }
    const f = normalize(data);
    setFournisseurs((prev) => [f, ...prev]);
    return f;
  }, []);

  const updateFournisseur = useCallback(async (id: number, patch: Partial<FournisseurInput>) => {
    const payload: any = {};
    // on ne pousse que les champs fournis (evite d'ecraser avec du null)
    for (const k of [
      'name', 'specialite', 'city', 'address', 'gps_lat', 'gps_lng',
      'phone', 'whatsapp', 'email', 'website', 'instagram',
      'carte_visite_url', 'notes',
    ] as const) {
      if (k in patch) payload[k] = (patch as any)[k];
    }
    const { data, error } = await supabase
      .from('fournisseurs')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();
    if (error) {
      console.error('updateFournisseur:', error);
      return null;
    }
    const f = normalize(data);
    setFournisseurs((prev) => prev.map((x) => (x.id === id ? f : x)));
    return f;
  }, []);

  const deleteFournisseur = useCallback(async (id: number) => {
    const { error } = await supabase.from('fournisseurs').delete().eq('id', id);
    if (error) {
      console.error('deleteFournisseur:', error);
      return false;
    }
    setFournisseurs((prev) => prev.filter((x) => x.id !== id));
    return true;
  }, []);

  return { fournisseurs, loading, reload: load, addFournisseur, updateFournisseur, deleteFournisseur };
}
