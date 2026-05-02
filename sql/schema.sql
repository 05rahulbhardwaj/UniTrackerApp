-- UniTrack Supabase Schema
-- Run this in your Supabase SQL Editor

create table universities (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  country text default '',
  website text default '',
  emoji text default '🎓',
  notes text default '',
  created_at timestamptz default now()
);

create table courses (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  university_id text not null,
  name text not null,
  degree text default 'MS',
  department text default '',
  status text default 'Researching',
  deadline date,
  priority text default 'Medium',
  application_fee text default '',
  notes text default '',
  created_at timestamptz default now()
);

create table requirements (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  course_id text not null,
  label text not null,
  completed boolean default false,
  due_date date,
  notes text default '',
  created_at timestamptz default now()
);

create table dependencies (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  course_id text not null,
  label text not null,
  status text default 'Pending',
  notes text default '',
  created_at timestamptz default now()
);

-- Row Level Security
alter table universities enable row level security;
alter table courses enable row level security;
alter table requirements enable row level security;
alter table dependencies enable row level security;

create policy "Users manage own universities" on universities for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own courses" on courses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own requirements" on requirements for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own dependencies" on dependencies for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
