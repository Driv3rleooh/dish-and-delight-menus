CREATE TABLE public.profiles (
 id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 name text NOT NULL DEFAULT '',
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_read_own ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE FUNCTION public.touch_profile_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_profile_updated_at();
CREATE FUNCTION public.create_user_profile() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN INSERT INTO public.profiles(id, name) VALUES (NEW.id, COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'name'), ''), NULLIF(trim(NEW.raw_user_meta_data->>'full_name'), ''), '')); RETURN NEW; END; $$;
REVOKE EXECUTE ON FUNCTION public.create_user_profile() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER on_auth_user_created_profile AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.create_user_profile();
INSERT INTO public.profiles(id, name) SELECT id, COALESCE(NULLIF(trim(raw_user_meta_data->>'name'), ''), NULLIF(trim(raw_user_meta_data->>'full_name'), ''), '') FROM auth.users ON CONFLICT(id) DO NOTHING;