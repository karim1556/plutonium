create extension if not exists "pgcrypto";

do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('patient', 'caregiver');
  end if;

  if not exists (select 1 from pg_type where typname = 'device_status') then
    create type device_status as enum ('online', 'offline', 'dispensing', 'alert');
  end if;

  if not exists (select 1 from pg_type where typname = 'slot_type') then
    create type slot_type as enum ('single', 'dual');
  end if;

  if not exists (select 1 from pg_type where typname = 'schedule_status') then
    create type schedule_status as enum ('pending', 'due_soon', 'taken', 'missed', 'delayed');
  end if;

  if not exists (select 1 from pg_type where typname = 'hardware_event') then
    create type hardware_event as enum (
      'dispense_requested',
      'dispensed',
      'pickup_confirmed',
      'missed',
      'stuck_retry',
      'unauthorized',
      'offline',
      'heartbeat'
    );
  end if;
end $$;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  name text not null,
  role user_role not null default 'patient',
  phone text,
  locale text not null default 'en-IN',
  created_at timestamptz not null default now()
);

create table if not exists public.caregiver_links (
  id uuid primary key default gen_random_uuid(),
  caregiver_user_id uuid not null references public.users(id) on delete cascade,
  patient_user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (caregiver_user_id, patient_user_id)
);

create table if not exists public.caregiver_invitations (
  id uuid primary key default gen_random_uuid(),
  patient_user_id uuid not null references public.users(id) on delete cascade,
  caregiver_user_id uuid references public.users(id) on delete set null,
  token text not null unique,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked', 'expired')),
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  ip_address text not null,
  status device_status not null default 'offline',
  current_slot integer not null default 1,
  firmware_version text,
  requires_fingerprint boolean not null default true,
  last_seen timestamptz,
  last_activity timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.slots (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.devices(id) on delete cascade,
  slot_number integer not null check (slot_number between 1 and 5),
  type slot_type not null,
  medicines jsonb not null default '[]'::jsonb,
  capacity integer not null check (capacity in (1, 2)),
  remaining integer not null default 0,
  rotation_angle integer not null,
  created_at timestamptz not null default now(),
  unique (device_id, slot_number)
);

create table if not exists public.medications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  dosage text not null,
  frequency integer not null check (frequency between 1 and 4),
  duration integer not null,
  timing jsonb not null default '{}'::jsonb,
  remaining_pills integer,
  refill_threshold integer default 5,
  instructions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.schedules (
  id uuid primary key default gen_random_uuid(),
  medication_id uuid not null references public.medications(id) on delete cascade,
  slot_id uuid not null references public.slots(id) on delete cascade,
  bundle_key text,
  bundle_medicines jsonb not null default '[]'::jsonb,
  scheduled_for date not null,
  time time not null,
  status schedule_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists public.logs (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references public.schedules(id) on delete cascade,
  status schedule_status not null,
  source text not null default 'manual',
  timestamp timestamptz not null default now(),
  notes text
);

create table if not exists public.hardware_logs (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.devices(id) on delete cascade,
  slot_id uuid references public.slots(id) on delete set null,
  event hardware_event not null,
  timestamp timestamptz not null default now(),
  details text
);

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  assigned_role user_role;
begin
  assigned_role := coalesce((new.raw_user_meta_data->>'role')::user_role, 'patient');

  insert into public.users (auth_user_id, name, role, phone, locale)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'name', ''), split_part(new.email, '@', 1)),
    assigned_role,
    nullif(new.raw_user_meta_data->>'phone', ''),
    coalesce(nullif(new.raw_user_meta_data->>'locale', ''), 'en-IN')
  )
  on conflict (auth_user_id) do update
  set
    name = excluded.name,
    role = excluded.role,
    phone = excluded.phone,
    locale = excluded.locale;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_user_profile();

alter table public.users enable row level security;
alter table public.caregiver_links enable row level security;
alter table public.caregiver_invitations enable row level security;
alter table public.devices enable row level security;
alter table public.slots enable row level security;
alter table public.medications enable row level security;
alter table public.schedules enable row level security;
alter table public.logs enable row level security;
alter table public.hardware_logs enable row level security;

drop policy if exists "Users can view own profile" on public.users;
create policy "Users can view own profile"
on public.users
for select
using (auth.uid() = auth_user_id);

drop policy if exists "Users can update own profile" on public.users;
create policy "Users can update own profile"
on public.users
for update
using (auth.uid() = auth_user_id)
with check (auth.uid() = auth_user_id);

drop policy if exists "Caregivers can view linked patients" on public.caregiver_links;
create policy "Caregivers can view linked patients"
on public.caregiver_links
for select
using (
  exists (
    select 1
    from public.users viewer
    where viewer.id = caregiver_links.caregiver_user_id
      and viewer.auth_user_id = auth.uid()
  )
);

drop policy if exists "Patients can view their caregiver links" on public.caregiver_links;
create policy "Patients can view their caregiver links"
on public.caregiver_links
for select
using (
  exists (
    select 1
    from public.users viewer
    where viewer.id = caregiver_links.patient_user_id
      and viewer.auth_user_id = auth.uid()
  )
);

drop policy if exists "Patients can manage their invitations" on public.caregiver_invitations;
create policy "Patients can manage their invitations"
on public.caregiver_invitations
for all
using (
  exists (
    select 1
    from public.users u
    where u.id = caregiver_invitations.patient_user_id
      and u.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.users u
    where u.id = caregiver_invitations.patient_user_id
      and u.auth_user_id = auth.uid()
  )
);

drop policy if exists "Users can manage own devices" on public.devices;
create policy "Users can manage own devices"
on public.devices
for all
using (
  exists (
    select 1
    from public.users u
    where u.id = devices.user_id
      and u.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.users u
    where u.id = devices.user_id
      and u.auth_user_id = auth.uid()
  )
);

drop policy if exists "Users can manage own slots" on public.slots;
create policy "Users can manage own slots"
on public.slots
for all
using (
  exists (
    select 1
    from public.devices d
    join public.users u on u.id = d.user_id
    where d.id = slots.device_id
      and u.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.devices d
    join public.users u on u.id = d.user_id
    where d.id = slots.device_id
      and u.auth_user_id = auth.uid()
  )
);

drop policy if exists "Users can manage own medications" on public.medications;
create policy "Users can manage own medications"
on public.medications
for all
using (
  exists (
    select 1
    from public.users u
    where u.id = medications.user_id
      and u.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.users u
    where u.id = medications.user_id
      and u.auth_user_id = auth.uid()
  )
);

drop policy if exists "Users can manage own schedules" on public.schedules;
create policy "Users can manage own schedules"
on public.schedules
for all
using (
  exists (
    select 1
    from public.medications m
    join public.users u on u.id = m.user_id
    where m.id = schedules.medication_id
      and u.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.medications m
    join public.users u on u.id = m.user_id
    where m.id = schedules.medication_id
      and u.auth_user_id = auth.uid()
  )
);

drop policy if exists "Users can manage own logs" on public.logs;
create policy "Users can manage own logs"
on public.logs
for all
using (
  exists (
    select 1
    from public.schedules s
    join public.medications m on m.id = s.medication_id
    join public.users u on u.id = m.user_id
    where s.id = logs.schedule_id
      and u.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.schedules s
    join public.medications m on m.id = s.medication_id
    join public.users u on u.id = m.user_id
    where s.id = logs.schedule_id
      and u.auth_user_id = auth.uid()
  )
);

drop policy if exists "Users can manage own hardware logs" on public.hardware_logs;
create policy "Users can manage own hardware logs"
on public.hardware_logs
for all
using (
  exists (
    select 1
    from public.devices d
    join public.users u on u.id = d.user_id
    where d.id = hardware_logs.device_id
      and u.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.devices d
    join public.users u on u.id = d.user_id
    where d.id = hardware_logs.device_id
      and u.auth_user_id = auth.uid()
  )
);
