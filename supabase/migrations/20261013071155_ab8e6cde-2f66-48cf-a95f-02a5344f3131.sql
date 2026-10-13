CREATE TABLE public.app_users (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  first_name text NOT NULL,
  middle_name text NOT NULL DEFAULT '',
  last_name text NOT NULL,
  username text NOT NULL,
  address text NOT NULL DEFAULT '',
  birth_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX app_users_username_lower_idx ON public.app_users (lower(username));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_users TO anon, authenticated;
GRANT ALL ON public.app_users TO service_role;
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Temporary open read" ON public.app_users FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Temporary open insert" ON public.app_users FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Temporary open update" ON public.app_users FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Temporary open delete" ON public.app_users FOR DELETE TO anon, authenticated USING (true);
CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER app_users_updated_at BEFORE UPDATE ON public.app_users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
INSERT INTO public.app_users (first_name, middle_name, last_name, username, address, birth_date) VALUES
('Иван','Петров','Иванов','ivan.ivanov','София, ул. Витоша 10','1985-04-12'),
('Мария','Георгиева','Петрова','maria.p','Пловдив, ул. Главна 5','1990-09-23'),
('Георги','','Димитров','gdimitrov','Варна, бул. Приморски 22','1978-01-30'),
('Елена','Николова','Стоянова','elena.s','','1995-12-05'),
('Петър','Иванов','Колев','pkolev','Бургас, ул. Александровска 3','1988-07-18');