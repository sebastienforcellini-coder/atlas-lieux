// =====================================================================
//  Helpers de partage — liens WhatsApp / mail pour le module Sourcing
//  Les pages publiques /idee/[slug] et /source/[slug] masquent le prix
//  par defaut ; le parametre ?prix=1 l'affiche.
// =====================================================================

const BASE_URL =
  typeof window !== 'undefined' ? window.location.origin : 'https://atlas-lieux.vercel.app';

export type NiveauPartage = 'image' | 'prix' | 'tout';

export function ideeUrl(slug: string, niveau: NiveauPartage): string {
  return `${BASE_URL}/idee/${slug}?n=${niveau}`;
}

export function sourceUrl(slug: string, withPrice: boolean): string {
  const q = withPrice ? '?prix=1' : '';
  return `${BASE_URL}/source/${slug}${q}`;
}

export function whatsappLink(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function mailtoLink(subject: string, body: string): string {
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

// Formate un prix lisible : "120 MAD /m²" ou "—"
export function formatPrix(
  prix: number | null,
  devise: string | null,
  unite: string | null
): string {
  if (prix == null) return '—';
  const u = unite && unite !== 'forfait' ? ` ${unite}` : unite === 'forfait' ? ' (forfait)' : '';
  return `${Math.round(prix)} ${devise ?? 'MAD'}${u}`;
}
