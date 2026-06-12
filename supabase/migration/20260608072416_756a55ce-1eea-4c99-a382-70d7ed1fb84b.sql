CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
GRANT SELECT ON public.customers TO anon;

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read customers" ON public.customers FOR SELECT USING (true);
CREATE POLICY "public write customers" ON public.customers FOR INSERT WITH CHECK (true);
CREATE POLICY "public update customers" ON public.customers FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "public delete customers" ON public.customers FOR DELETE USING (true);