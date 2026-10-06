CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Lire ses roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.acces_module (
  user_id uuid PRIMARY KEY,
  email text NOT NULL UNIQUE,
  nom text NOT NULL DEFAULT '',
  actif boolean NOT NULL DEFAULT true,
  invite_le timestamptz NOT NULL DEFAULT now(),
  retire_le timestamptz
);
GRANT SELECT ON public.acces_module TO authenticated;
GRANT ALL ON public.acces_module TO service_role;
ALTER TABLE public.acces_module ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lire son acces ou admin" ON public.acces_module FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));