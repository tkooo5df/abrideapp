-- Create passenger_locations table mirroring driver_locations
create table if not exists public.passenger_locations (
  passenger_id uuid primary key references public.profiles(id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  heading double precision,
  speed double precision,
  accuracy double precision,
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.passenger_locations enable row level security;

-- Basic policies (adjust as needed):
-- Passengers can upsert their own location
create policy if not exists "passenger can upsert own location"
  on public.passenger_locations
  for all
  to authenticated
  using (auth.uid() = passenger_id)
  with check (auth.uid() = passenger_id);

-- Drivers can read passenger locations (if authorized by app logic)
-- For now, allow authenticated read; tighten later with views or join policies
create policy if not exists "authenticated can read passenger locations"
  on public.passenger_locations
  for select
  to authenticated
  using (true);

-- Helpful index for queries by updated time
create index if not exists idx_passenger_locations_updated_at on public.passenger_locations(updated_at desc);

