
CREATE TABLE public.master_conditions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name text NOT NULL,
  mold_no text NOT NULL,
  product_number text,
  customer text,
  materials text,
  cavities text,
  shot_weight text,
  piece_weight text,
  cycle_time text,
  drying_temp_time text,
  mould_temp text,
  barrel_nozzle text,
  barrel_zone1 text,
  barrel_zone2 text,
  barrel_zone3 text,
  barrel_zone4 text,
  machine_a text,
  fill_speed_a text,
  fill_pressure_a text,
  transfer_position_a text,
  hold_speed_a text,
  hold_pressure_a text,
  hold_time_a text,
  machine_b text,
  fill_speed_b text,
  fill_pressure_b text,
  transfer_position_b text,
  hold_speed_b text,
  hold_pressure_b text,
  hold_time_b text,
  extra jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.machines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_name text NOT NULL,
  machine_no text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.defect_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.daily_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  master_condition_id uuid REFERENCES public.master_conditions(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  mold_no text NOT NULL,
  part_no text,
  customer text,
  machine_name text,
  machine_no text,
  record_date date NOT NULL,
  shift text NOT NULL CHECK (shift IN ('D','N')),
  technician text,
  parameters jsonb NOT NULL DEFAULT '{}'::jsonb,
  defects jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (master_condition_id, record_date, shift, machine_no)
);

CREATE INDEX idx_records_date ON public.daily_records(record_date);
CREATE INDEX idx_records_master ON public.daily_records(master_condition_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.master_conditions TO anon, authenticated;
GRANT ALL ON public.master_conditions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.machines TO anon, authenticated;
GRANT ALL ON public.machines TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.defect_types TO anon, authenticated;
GRANT ALL ON public.defect_types TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_records TO anon, authenticated;
GRANT ALL ON public.daily_records TO service_role;

ALTER TABLE public.master_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.defect_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read mc" ON public.master_conditions FOR SELECT USING (true);
CREATE POLICY "public write mc" ON public.master_conditions FOR INSERT WITH CHECK (true);
CREATE POLICY "public update mc" ON public.master_conditions FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "public delete mc" ON public.master_conditions FOR DELETE USING (true);

CREATE POLICY "public read m" ON public.machines FOR SELECT USING (true);
CREATE POLICY "public write m" ON public.machines FOR INSERT WITH CHECK (true);
CREATE POLICY "public update m" ON public.machines FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "public delete m" ON public.machines FOR DELETE USING (true);

CREATE POLICY "public read d" ON public.defect_types FOR SELECT USING (true);
CREATE POLICY "public write d" ON public.defect_types FOR INSERT WITH CHECK (true);
CREATE POLICY "public update d" ON public.defect_types FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "public delete d" ON public.defect_types FOR DELETE USING (true);

CREATE POLICY "public read dr" ON public.daily_records FOR SELECT USING (true);
CREATE POLICY "public write dr" ON public.daily_records FOR INSERT WITH CHECK (true);
CREATE POLICY "public update dr" ON public.daily_records FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "public delete dr" ON public.daily_records FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_mc_updated BEFORE UPDATE ON public.master_conditions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_dr_updated BEFORE UPDATE ON public.daily_records
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
