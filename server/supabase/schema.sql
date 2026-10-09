-- AIForge / Musicmy Supabase schema
-- Run once in Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  password text not null,
  role text not null default 'user' check (role in ('user','admin')),
  plan text not null default 'free' check (plan in ('free','pro','premium')),
  credits integer not null default 50 check (credits >= 0),
  subscription_started_at timestamptz,
  subscription_expires_at timestamptz,
  reset_password_token text,
  reset_password_expires timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists tools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  category text,
  icon text,
  provider text,
  credit_cost integer not null default 1,
  is_premium boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  tool_id uuid references tools(id) on delete set null,
  title text not null default 'AI Generation',
  content text,
  question text,
  answer text,
  slug text,
  status text not null default 'completed',
  amount integer not null default 0,
  plan text,
  provider text,
  transaction_id text,
  created_at timestamptz not null default now()
);

create table if not exists favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  generation_id uuid not null references generations(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, generation_id)
);

create table if not exists saved_outputs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  generation_id uuid references generations(id) on delete set null,
  title text,
  content text,
  created_at timestamptz not null default now()
);

create table if not exists credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  amount integer not null,
  balance_after integer not null,
  type text not null default 'usage',
  description text,
  created_at timestamptz not null default now()
);

create table if not exists payment_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  amount numeric(12,2) not null default 499,
  currency text not null default 'INR',
  plan text not null default 'pro',
  utr text not null unique,
  screenshot_url text,
  note text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  rejection_reason text,
  reviewed_by uuid references users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  payment_request_id uuid references payment_requests(id) on delete set null,
  amount numeric(12,2) not null,
  currency text not null default 'INR',
  plan text not null default 'pro',
  status text not null default 'paid',
  provider text not null default 'upi',
  transaction_id text,
  created_at timestamptz not null default now()
);

create table if not exists blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  content text not null,
  cover_image text,
  author text default 'AIForge Team',
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  sort_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text,
  message text not null,
  status text not null default 'new' check (status in ('new','read','resolved')),
  created_at timestamptz not null default now()
);

create index if not exists idx_generations_user_created on generations(user_id, created_at desc);
create index if not exists idx_payment_requests_status on payment_requests(status, created_at desc);
create index if not exists idx_blog_published on blog_posts(published, published_at desc);
create index if not exists idx_faqs_order on faqs(published, sort_order);

create or replace function consume_user_credits(p_user_id uuid, p_cost integer)
returns integer language plpgsql security definer set search_path = public as $$
declare new_balance integer;
begin
  if p_cost is null or p_cost <= 0 then
    select credits into new_balance from users where id = p_user_id;
    if new_balance is null then raise exception 'USER_NOT_FOUND'; end if;
    return new_balance;
  end if;
  update users set credits = credits - p_cost, updated_at = now()
  where id = p_user_id and credits >= p_cost
  returning credits into new_balance;
  if new_balance is null then
    if not exists(select 1 from users where id = p_user_id) then raise exception 'USER_NOT_FOUND'; end if;
    raise exception 'INSUFFICIENT_CREDITS';
  end if;
  insert into credit_transactions(user_id, amount, balance_after, type, description)
  values(p_user_id, -p_cost, new_balance, 'usage', 'AI tool usage');
  return new_balance;
end; $$;

create or replace function approve_payment_request(p_request_id uuid, p_admin_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare pr payment_requests%rowtype; u users%rowtype; expires timestamptz;
begin
  select * into pr from payment_requests where id = p_request_id for update;
  if pr.id is null then raise exception 'PAYMENT_REQUEST_NOT_FOUND'; end if;
  if pr.status <> 'pending' then raise exception 'PAYMENT_REQUEST_NOT_PENDING'; end if;
  if not exists(select 1 from users where id = p_admin_id and role = 'admin') then raise exception 'ADMIN_REQUIRED'; end if;
  expires := now() + interval '1 month';
  update payment_requests set status='approved', reviewed_by=p_admin_id, reviewed_at=now() where id=pr.id returning * into pr;
  update users set plan='pro', subscription_started_at=now(), subscription_expires_at=expires, updated_at=now() where id=pr.user_id returning * into u;
  insert into payments(user_id,payment_request_id,amount,currency,plan,status,provider,transaction_id) values(u.id,pr.id,pr.amount,pr.currency,'pro','paid','upi',pr.utr);
  return jsonb_build_object('request', to_jsonb(pr), 'user', jsonb_build_object('id',u.id,'name',u.name,'email',u.email,'plan',u.plan,'credits',u.credits));
end; $$;

insert into tools(name,slug,description,category,provider,credit_cost,is_premium) values
('AI Writer','ai-writer','Create polished original content.','Writing','gemini',1,false),
('AI Paraphraser','ai-paraphraser','Rewrite content with a fresh voice.','Writing','gemini',1,false),
('AI Summarizer','ai-summarizer','Turn long text into concise summaries.','Writing','gemini',1,false),
('AI Translator','ai-translator','Translate content naturally across languages.','Language','gemini',1,false),
('AI Image Generator','ai-image-generator','Generate images from text prompts.','Creative','gemini',10,true),
('AI Image Enhancer','ai-image-enhancer','Improve image prompts and enhancement workflows.','Creative','gemini',5,true),
('Code Generator','code-generator','Generate production-ready code.','Coding','gemini',2,true),
('Code Explainer','code-explainer','Understand code step by step.','Coding','gemini',2,true),
('PDF Summarizer','pdf-summarizer','Summarize uploaded PDF documents.','Documents','gemini',5,false),
('Caption Generator','caption-generator','Create social captions quickly.','Marketing','gemini',1,false),
('AI Resume Builder','resume-builder','Create professional resume content.','Career','gemini',4,true),
('Email Writer','email-writer','Write professional emails.','Writing','gemini',1,false)
on conflict(slug) do nothing;

insert into faqs(question,answer,sort_order) values
('What is AIForge?','AIForge is an AI productivity workspace for writing, summarizing, translation, coding and creative workflows.',1),
('How do credits work?','Each AI tool consumes credits based on its configured cost. Your remaining balance is shown in the dashboard.',2),
('What does Pro include?','Pro unlocks premium tools and image generation. Pro subscriptions are activated after payment verification.',3),
('How long does payment verification take?','Manual UPI payments are reviewed by an administrator. Keep your UTR/transaction ID available.',4)
on conflict do nothing;

insert into blog_posts(title,slug,excerpt,content,published,published_at) values
('How to use AI for productivity','ai-productivity','Practical ways to use AI for everyday work.','Use AIForge to turn repetitive writing, summarization and research tasks into faster workflows. Start with a clear prompt, review the result, then refine it with a second pass.',true,now()),
('AI coding workflow for developers','ai-coding-workflow','A simple workflow for learning and building with AI.','Use AI to explain unfamiliar code, generate small functions, debug errors and create tests. Always review generated code before shipping it.',true,now()),
('Writing better prompts','better-prompts','Simple prompt patterns that improve AI output.','State the goal, context, constraints and desired output format. Include examples when the format matters.',true,now())
on conflict(slug) do nothing;

-- Optional: after creating your first account, promote it with:
-- update users set role='admin' where email='YOUR_ADMIN_EMAIL';
