begin;
-- Enlace opcional a una noticia. Conserva los destacados y permisos existentes.
alter table public.destacados add column nota_id uuid references public.notas(id) on delete set null;
grant select (nota_id) on public.destacados to anon;
notify pgrst, 'reload schema';
commit;
