CREATE TABLE public.technicians (
  id uuid not null default gen_random_uuid() primary key,
  name text not null unique,
  created_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.technicians TO anon, authenticated;
GRANT ALL ON public.technicians TO service_role;
ALTER TABLE public.technicians ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read tech" ON public.technicians FOR SELECT USING (true);
CREATE POLICY "public write tech" ON public.technicians FOR INSERT WITH CHECK (true);
CREATE POLICY "public update tech" ON public.technicians FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "public delete tech" ON public.technicians FOR DELETE USING (true);

INSERT INTO public.technicians (name)
SELECT DISTINCT technician FROM public.daily_records
WHERE technician IS NOT NULL AND technician <> ''
ON CONFLICT (name) DO NOTHING;