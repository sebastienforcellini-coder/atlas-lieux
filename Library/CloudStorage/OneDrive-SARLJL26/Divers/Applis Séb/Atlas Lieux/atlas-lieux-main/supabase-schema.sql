-- ============================================
-- Atlas Lieux — Supabase SQL Schema
-- À coller dans : Supabase > SQL Editor > New query
-- ============================================

create table if not exists public.lieux (
  id           bigserial primary key,
  created_at   timestamptz default now() not null,
  updated_at   timestamptz default now() not null,
  name         text        not null,
  country      text        not null,
  city         text        not null,
  address      text,
  description  text,
  photos       text[]      default '{}',
  videos       text[]      default '{}',
  tags         text[]      default '{}',
  gps_lat      text,
  gps_lng      text,
  rating       int         default 0 check (rating >= 0 and rating <= 5),
  visit_date   date,
  comments     jsonb       default '[]'
);

-- Index pour les recherches fréquentes
create index if not exists lieux_country_idx on public.lieux (country);
create index if not exists lieux_city_idx    on public.lieux (city);
create index if not exists lieux_created_idx on public.lieux (created_at desc);

-- Mise à jour auto de updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger lieux_updated_at
  before update on public.lieux
  for each row execute function public.set_updated_at();

-- Row Level Security (désactivé pour app publique, à activer si auth)
alter table public.lieux enable row level security;

-- Politique : lecture et écriture publiques (sans auth)
-- Pour sécuriser avec auth, remplacer par : request.auth.uid() is not null
create policy "public read"  on public.lieux for select using (true);
create policy "public insert" on public.lieux for insert with check (true);
create policy "public update" on public.lieux for update using (true);
create policy "public delete" on public.lieux for delete using (true);
