/*
# SERVIO — Seed categories and admin account

## What this does
1. Inserts the initial set of industry sectors (categories) for the marketplace.
2. Creates the admin user (admin@servio.com) via auth.users with admin role metadata and profile row.
3. Creates a trigger to auto-create profiles for new sign-ups.
*/

-- Seed categories
INSERT INTO public.categories (name, slug, icon, description, sort_order)
SELECT * FROM (VALUES
  ('Artisanat', 'artisanat', 'Hammer', 'Artisans et métiers manuels', 1),
  ('BTP & Construction', 'btp-construction', 'HardHat', 'Bâtiment, construction et gros œuvre', 2),
  ('Beauté & Bien-être', 'beaute-bien-etre', 'Sparkles', 'Coiffure, esthétique, soins, massage', 3),
  ('Événementiel', 'evenementiel', 'PartyPopper', 'Organisation événements, weddings, traiteurs', 4),
  ('Informatique & Tech', 'informatique-tech', 'Laptop', 'Développement, IT, support technique', 5),
  ('Conseil & Coaching', 'conseil-coaching', 'Lightbulb', 'Consulting, coaching professionnel et personnel', 6),
  ('Photographie & Vidéo', 'photographie-video', 'Camera', 'Photographes, vidéastes, monteurs', 7),
  ('Restauration', 'restauration', 'UtensilsCrossed', 'Chefs, traiteurs, cuisiniers', 8),
  ('Éducation & Formation', 'education-formation', 'GraduationCap', 'Formations, tutorat, enseignement', 9),
  ('Design & Créatif', 'design-creatif', 'Palette', 'Design graphique, UI/UX, illustration', 10),
  ('Marketing & Communication', 'marketing-communication', 'Megaphone', 'Stratégie, contenu, community management', 11),
  ('Santé & Médical', 'sante-medical', 'Stethoscope', 'Professions de santé et bien-être médical', 12),
  ('Transport & Logistique', 'transport-logistique', 'Truck', 'Transport, livraison, logistique', 13),
  ('Juridique & Administratif', 'juridique-administratif', 'Scale', 'Services juridiques, comptabilité, admin', 14),
  ('Automobile', 'automobile', 'Car', 'Mécanique, carrosserie, entretien auto', 15)
) AS t(name, slug, icon, description, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = t.slug);

-- Create admin user in auth.users if not exists
DO $$
DECLARE
  admin_id uuid;
BEGIN
  SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@servio.com';
  IF admin_id IS NULL THEN
    admin_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, aud, role, raw_app_meta_data, raw_user_meta_data
    ) VALUES (
      admin_id,
      '00000000-0000-0000-0000-000000000000',
      'admin@servio.com',
      crypt('admin123456', gen_salt('bf')),
      now(),
      now(),
      now(),
      'authenticated',
      'authenticated',
      '{"role":"admin"}'::jsonb,
      '{"full_name":"Administrateur SERVIO"}'::jsonb
    );
    INSERT INTO auth.identities (
      provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) VALUES (
      admin_id::text,
      admin_id,
      jsonb_build_object('sub', admin_id::text, 'email', 'admin@servio.com'),
      'email',
      now(),
      now(),
      now()
    );
  ELSE
    UPDATE auth.users
    SET raw_app_meta_data = jsonb_set(
      COALESCE(raw_app_meta_data, '{}'::jsonb),
      '{role}',
      '"admin"'
    )
    WHERE id = admin_id;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role, status)
  VALUES (admin_id, 'admin@servio.com', 'Administrateur SERVIO', 'admin', 'active')
  ON CONFLICT (id) DO UPDATE
  SET role = 'admin', email = 'admin@servio.com', updated_at = now();
END $$;

-- Trigger: auto-create profile when a new auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'visitor')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
