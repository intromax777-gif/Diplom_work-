-- =============================================
-- Kommunal Pay — Database Schema for Supabase
-- Run this in Supabase SQL Editor
-- =============================================

-- Clients table
create table public.clients (
  id uuid default gen_random_uuid() primary key,
  full_name text not null,
  address text not null,
  phone text,
  email text,
  account_number text unique not null,
  created_at timestamptz default now()
);

-- Tariffs table
create table public.tariffs (
  id uuid default gen_random_uuid() primary key,
  service_type text not null check (service_type in ('electricity', 'water', 'gas')),
  price_per_unit numeric not null default 0,
  unit text not null,
  updated_at timestamptz default now()
);

-- Default tariffs (Uzbekistan approximate rates)
insert into public.tariffs (service_type, price_per_unit, unit) values
  ('electricity', 380, 'kWh'),
  ('water', 1200, 'm³'),
  ('gas', 650, 'm³');

-- Meter readings table
create table public.meter_readings (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references public.clients(id) on delete cascade,
  service_type text not null check (service_type in ('electricity', 'water', 'gas')),
  reading_value numeric not null,
  reading_date date not null,
  month int not null,
  year int not null,
  created_at timestamptz default now()
);

-- Invoices table
create table public.invoices (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references public.clients(id) on delete cascade,
  invoice_number text unique not null,
  month int not null,
  year int not null,
  electricity_amount numeric default 0,
  water_amount numeric default 0,
  gas_amount numeric default 0,
  total_amount numeric not null default 0,
  status text default 'pending' check (status in ('pending', 'paid', 'overdue')),
  due_date date,
  paid_at timestamptz,
  created_at timestamptz default now()
);

-- Payments table
create table public.payments (
  id uuid default gen_random_uuid() primary key,
  invoice_id uuid references public.invoices(id) on delete cascade,
  client_id uuid references public.clients(id) on delete cascade,
  amount numeric not null,
  payment_date timestamptz default now(),
  method text default 'cash'
);

-- Disable RLS for admin-only app (enable + add policies for multi-user)
alter table public.clients disable row level security;
alter table public.tariffs disable row level security;
alter table public.meter_readings disable row level security;
alter table public.invoices disable row level security;
alter table public.payments disable row level security;
