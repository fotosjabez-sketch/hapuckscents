-- HAPUCK SCENTS — estrutura do banco (rodar no SQL Editor de um projeto novo).
-- Depois: trocar url/key em assets/js/supabase-config.js e marcar o admin
-- (comando no final deste arquivo). Os produtos iniciais estão no catalogo.html.

create table public.produtos (
  id         text primary key,
  nome       text not null,
  categoria  text not null check (categoria in ('buques','casa','frutos','corpo','perfumes')),
  preco      numeric(10,2) not null default 0,
  variacao   text not null default '',
  descricao  text not null default '',
  imagem     text not null default '',
  ativo      boolean not null default true,
  ordem      integer not null default 0,
  criado_em  timestamptz not null default now()
);
create index produtos_ordem_idx on public.produtos (ordem);

alter table public.produtos enable row level security;

-- Admin = usuário com app_metadata.role = 'admin' (só dá para definir pelo banco, nunca pelo navegador)
create function public.is_admin() returns boolean
language sql stable set search_path = '' as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
$$;

create policy "visitante le publicados" on public.produtos
  for select to anon, authenticated using (ativo or public.is_admin());
create policy "admin insere" on public.produtos
  for insert to authenticated with check (public.is_admin());
create policy "admin edita" on public.produtos
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin exclui" on public.produtos
  for delete to authenticated using (public.is_admin());

-- Fotos: bucket público para leitura, upload só admin (até 2 MB, como no painel)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('produtos', 'produtos', true, 2097152, array['image/*']);

create policy "admin envia fotos" on storage.objects
  for insert to authenticated with check (bucket_id = 'produtos' and public.is_admin());
create policy "admin troca fotos" on storage.objects
  for update to authenticated using (bucket_id = 'produtos' and public.is_admin());
create policy "admin apaga fotos" on storage.objects
  for delete to authenticated using (bucket_id = 'produtos' and public.is_admin());

-- Marcar o admin (criar o usuário antes em Authentication → Users → Add user):
-- update auth.users set raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}' where email = 'EMAIL_DO_ADMIN';
