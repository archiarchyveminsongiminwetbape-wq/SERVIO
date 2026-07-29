/*
# SERVIO — Expand categories with many more sectors and subcategories

## What this does
1. Adds 18 new top-level activity sectors.
2. Creates a helper function insert_sub() for inserting subcategories.
3. Adds subcategories under all top-level categories.
4. All new categories are safe to re-run (IF NOT EXISTS checks).
*/

-- New top-level categories
INSERT INTO public.categories (name, slug, icon, description, sort_order)
SELECT * FROM (VALUES
  ('Agriculture & Élevage', 'agriculture-elevage', 'Wheat', 'Agriculture, élevage, viticulture, maraîchage', 16),
  ('Musique & Audio', 'musique-audio', 'Music', 'Musiciens, studios, ingénieurs du son, DJ', 17),
  ('Mode & Textile', 'mode-textile', 'Shirt', 'Couture, stylisme, retouches, confection', 18),
  ('Maison & Jardin', 'maison-jardin', 'Home', 'Jardinage, paysagisme, entretien, piscine', 19),
  ('Sécurité & Protection', 'securite-protection', 'ShieldCheck', 'Sécurité privée, alarmes, contrôle d''accès', 20),
  ('Industrie & Manufacture', 'industrie-manufacture', 'Factory', 'Usinage, soudure, fabrication industrielle', 21),
  ('Environnement & Éco', 'environnement-eco', 'Leaf', 'Éco-construction, recyclage, énergies renouvelables', 22),
  ('Tourisme & Loisirs', 'tourisme-loisirs', 'Plane', 'Guides, activités, hébergement, excursion', 23),
  ('Immobilier', 'immobilier', 'Building2', 'Agences, gestion locative, diagnostics, estimation', 24),
  ('Art & Culture', 'art-culture', 'Brush', 'Artistes peintres, sculpteurs, galeristes, artisan d''art', 25),
  ('Services aux Entreprises', 'services-entreprises', 'Briefcase', 'Comptabilité, RH, secrétariat, traduction', 26),
  ('Animaux & Animalerie', 'animaux-animalerie', 'PawPrint', 'Toilettage, éducation canine, soins, pension', 27),
  ('Sport & Loisirs', 'sport-loisirs', 'Dumbbell', 'Coachs sportifs, clubs, équipements, activités', 28),
  ('Énergie & Utilities', 'energie-utilities', 'Zap', 'Électricité, gaz, panneaux solaires, climatisation', 29),
  ('Impression & Reprographie', 'impression-reprographie', 'Printer', 'Imprimerie, signalétique, flyers, stickers', 30),
  ('Télécom & Réseaux', 'telecom-reseaux', 'Wifi', 'Installation réseaux, fibre, téléphonie, câblage', 31),
  ('Nettoyage & Entretien', 'nettoyage-entretien', 'SprayCan', 'Nettoyage professionnel, pressing, désinfection', 32),
  ('Événementiel Musical', 'evenementiel-musical', 'Disc3', 'DJ, sonorisation, éclairage spectacle, location sono', 33)
) AS t(name, slug, icon, description, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = t.slug);

-- Helper function for inserting subcategories idempotently
CREATE OR REPLACE FUNCTION public.insert_sub(p_parent uuid, p_name text, p_slug text, p_sort int)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.categories (name, slug, parent_id, sort_order)
  SELECT p_name, p_slug, p_parent, p_sort
  WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = p_slug);
END;
$$;

-- Add subcategories under all top-level categories
DO $$
DECLARE
  v_artisan uuid; v_btp uuid; v_beaute uuid; v_event uuid; v_info uuid;
  v_coach uuid; v_photo uuid; v_resto uuid; v_edu uuid; v_design uuid;
  v_marketing uuid; v_sante uuid; v_transport uuid; v_juridique uuid;
  v_auto uuid; v_agri uuid; v_musique uuid; v_mode uuid; v_maison uuid;
  v_securite uuid; v_industrie uuid; v_env uuid; v_tourisme uuid;
  v_immo uuid; v_art uuid; v_entreprise uuid; v_animaux uuid;
  v_sport uuid; v_energie uuid; v_impression uuid; v_telecom uuid;
  v_nettoyage uuid; v_event_musical uuid;
  s int;
BEGIN
  SELECT id INTO v_artisan FROM public.categories WHERE slug='artisanat';
  SELECT id INTO v_btp FROM public.categories WHERE slug='btp-construction';
  SELECT id INTO v_beaute FROM public.categories WHERE slug='beaute-bien-etre';
  SELECT id INTO v_event FROM public.categories WHERE slug='evenementiel';
  SELECT id INTO v_info FROM public.categories WHERE slug='informatique-tech';
  SELECT id INTO v_coach FROM public.categories WHERE slug='conseil-coaching';
  SELECT id INTO v_photo FROM public.categories WHERE slug='photographie-video';
  SELECT id INTO v_resto FROM public.categories WHERE slug='restauration';
  SELECT id INTO v_edu FROM public.categories WHERE slug='education-formation';
  SELECT id INTO v_design FROM public.categories WHERE slug='design-creatif';
  SELECT id INTO v_marketing FROM public.categories WHERE slug='marketing-communication';
  SELECT id INTO v_sante FROM public.categories WHERE slug='sante-medical';
  SELECT id INTO v_transport FROM public.categories WHERE slug='transport-logistique';
  SELECT id INTO v_juridique FROM public.categories WHERE slug='juridique-administratif';
  SELECT id INTO v_auto FROM public.categories WHERE slug='automobile';
  SELECT id INTO v_agri FROM public.categories WHERE slug='agriculture-elevage';
  SELECT id INTO v_musique FROM public.categories WHERE slug='musique-audio';
  SELECT id INTO v_mode FROM public.categories WHERE slug='mode-textile';
  SELECT id INTO v_maison FROM public.categories WHERE slug='maison-jardin';
  SELECT id INTO v_securite FROM public.categories WHERE slug='securite-protection';
  SELECT id INTO v_industrie FROM public.categories WHERE slug='industrie-manufacture';
  SELECT id INTO v_env FROM public.categories WHERE slug='environnement-eco';
  SELECT id INTO v_tourisme FROM public.categories WHERE slug='tourisme-loisirs';
  SELECT id INTO v_immo FROM public.categories WHERE slug='immobilier';
  SELECT id INTO v_art FROM public.categories WHERE slug='art-culture';
  SELECT id INTO v_entreprise FROM public.categories WHERE slug='services-entreprises';
  SELECT id INTO v_animaux FROM public.categories WHERE slug='animaux-animalerie';
  SELECT id INTO v_sport FROM public.categories WHERE slug='sport-loisirs';
  SELECT id INTO v_energie FROM public.categories WHERE slug='energie-utilities';
  SELECT id INTO v_impression FROM public.categories WHERE slug='impression-reprographie';
  SELECT id INTO v_telecom FROM public.categories WHERE slug='telecom-reseaux';
  SELECT id INTO v_nettoyage FROM public.categories WHERE slug='nettoyage-entretien';
  SELECT id INTO v_event_musical FROM public.categories WHERE slug='evenementiel-musical';

  s := 1;
  PERFORM insert_sub(v_artisan, 'Menuiserie & Ébénisterie', 'menuiserie-ebenisterie', s); s := s+1;
  PERFORM insert_sub(v_artisan, 'Maçonnerie', 'maconnerie-artisanat', s); s := s+1;
  PERFORM insert_sub(v_artisan, 'Coutellerie', 'coutellerie', s); s := s+1;
  PERFORM insert_sub(v_artisan, 'Verrerie & Vitrail', 'verrerie-vitrail', s); s := s+1;
  PERFORM insert_sub(v_artisan, 'Poterie & Céramique', 'poterie-ceramique', s); s := s+1;
  PERFORM insert_sub(v_artisan, 'Bijouterie & Joaillerie', 'bijouterie-joaillerie', s); s := s+1;
  PERFORM insert_sub(v_artisan, 'Maroquinerie', 'maroquinerie', s); s := s+1;
  PERFORM insert_sub(v_artisan, 'Sculpture sur Bois', 'sculpture-sur-bois', s); s := s+1;

  s := 1;
  PERFORM insert_sub(v_btp, 'Maçonnerie', 'maconnerie-btp', s); s := s+1;
  PERFORM insert_sub(v_btp, 'Électricité', 'electricite-btp', s); s := s+1;
  PERFORM insert_sub(v_btp, 'Plomberie & Chauffage', 'plomberie-chauffage', s); s := s+1;
  PERFORM insert_sub(v_btp, 'Charpente & Couverture', 'charpente-couverture', s); s := s+1;
  PERFORM insert_sub(v_btp, 'Carrelage & Faïence', 'carrelage-faience', s); s := s+1;
  PERFORM insert_sub(v_btp, 'Peinture & Décoration', 'peinture-decoration-btp', s); s := s+1;
  PERFORM insert_sub(v_btp, 'Isolation', 'isolation', s); s := s+1;
  PERFORM insert_sub(v_btp, 'Plâtrerie & Cloisons', 'platrerie-cloisons', s); s := s+1;
  PERFORM insert_sub(v_btp, 'Terrassement & VRD', 'terrassement-vrd', s); s := s+1;
  PERFORM insert_sub(v_btp, 'Rénovation', 'renovation-btp', s); s := s+1;

  s := 1;
  PERFORM insert_sub(v_beaute, 'Coiffure', 'coiffure', s); s := s+1;
  PERFORM insert_sub(v_beaute, 'Esthétique & Soins', 'esthetique-soins', s); s := s+1;
  PERFORM insert_sub(v_beaute, 'Onglerie & Manucure', 'onglerie-manucure', s); s := s+1;
  PERFORM insert_sub(v_beaute, 'Maquillage', 'maquillage', s); s := s+1;
  PERFORM insert_sub(v_beaute, 'Massage & Spa', 'massage-spa', s); s := s+1;
  PERFORM insert_sub(v_beaute, 'Tatouage & Piercing', 'tatouage-piercing', s); s := s+1;
  PERFORM insert_sub(v_beaute, 'Barbier', 'barbier', s); s := s+1;

  s := 1;
  PERFORM insert_sub(v_event, 'Wedding Planner', 'wedding-planner', s); s := s+1;
  PERFORM insert_sub(v_event, 'Traiteur', 'traiteur-evenementiel', s); s := s+1;
  PERFORM insert_sub(v_event, 'Décoration Événementielle', 'decoration-evenementielle', s); s := s+1;
  PERFORM insert_sub(v_event, 'Location de Matériel', 'location-materiel-event', s); s := s+1;
  PERFORM insert_sub(v_event, 'Animation & Spectacle', 'animation-spectacle', s); s := s+1;
  PERFORM insert_sub(v_event, 'Organisation Salons & Foires', 'salons-foires', s); s := s+1;

  s := 1;
  PERFORM insert_sub(v_info, 'Développement Web', 'developpement-web', s); s := s+1;
  PERFORM insert_sub(v_info, 'Développement Mobile', 'developpement-mobile', s); s := s+1;
  PERFORM insert_sub(v_info, 'DevOps & Cloud', 'devops-cloud', s); s := s+1;
  PERFORM insert_sub(v_info, 'Cybersécurité', 'cybersecurite', s); s := s+1;
  PERFORM insert_sub(v_info, 'Support & Maintenance IT', 'support-maintenance-it', s); s := s+1;
  PERFORM insert_sub(v_info, 'Data & IA', 'data-ia', s); s := s+1;
  PERFORM insert_sub(v_info, 'Référencement SEO', 'referencement-seo', s); s := s+1;

  s := 1;
  PERFORM insert_sub(v_coach, 'Coaching Professionnel', 'coaching-professionnel', s); s := s+1;
  PERFORM insert_sub(v_coach, 'Coaching de Vie', 'coaching-de-vie', s); s := s+1;
  PERFORM insert_sub(v_coach, 'Consulting Stratégie', 'consulting-strategie', s); s := s+1;
  PERFORM insert_sub(v_coach, 'Coaching Sportif', 'coaching-sportif', s); s := s+1;
  PERFORM insert_sub(v_coach, 'Orientation & Bilan', 'orientation-bilan', s); s := s+1;

  s := 1;
  PERFORM insert_sub(v_photo, 'Photo Portrait', 'photo-portrait', s); s := s+1;
  PERFORM insert_sub(v_photo, 'Photo Mariage', 'photo-mariage', s); s := s+1;
  PERFORM insert_sub(v_photo, 'Photo Événementielle', 'photo-evenementielle', s); s := s+1;
  PERFORM insert_sub(v_photo, 'Photo Corporate', 'photo-corporate', s); s := s+1;
  PERFORM insert_sub(v_photo, 'Vidéaste & Montage', 'videaste-montage', s); s := s+1;
  PERFORM insert_sub(v_photo, 'Photo Immobilier', 'photo-immobilier', s); s := s+1;
  PERFORM insert_sub(v_photo, 'Drone & Aérienne', 'drone-aerienne', s); s := s+1;

  s := 1;
  PERFORM insert_sub(v_resto, 'Chef à Domicile', 'chef-a-domicile', s); s := s+1;
  PERFORM insert_sub(v_resto, 'Traiteur', 'traiteur-restauration', s); s := s+1;
  PERFORM insert_sub(v_resto, 'Pâtisserie & Desserts', 'patisserie-desserts', s); s := s+1;
  PERFORM insert_sub(v_resto, 'Cuisine du Monde', 'cuisine-du-monde', s); s := s+1;
  PERFORM insert_sub(v_resto, 'Boulangerie', 'boulangerie', s); s := s+1;
  PERFORM insert_sub(v_resto, 'Food Truck', 'food-truck', s); s := s+1;

  s := 1;
  PERFORM insert_sub(v_edu, 'Soutien Scolaire', 'soutien-scolaire', s); s := s+1;
  PERFORM insert_sub(v_edu, 'Formation Professionnelle', 'formation-professionnelle', s); s := s+1;
  PERFORM insert_sub(v_edu, 'Langues & Traduction', 'langues-traduction-edu', s); s := s+1;
  PERFORM insert_sub(v_edu, 'Musique & Arts', 'musique-arts-edu', s); s := s+1;
  PERFORM insert_sub(v_edu, 'Préparation Concours', 'preparation-concours', s); s := s+1;
  PERFORM insert_sub(v_edu, 'Formation Digital', 'formation-digital', s); s := s+1;

  s := 1;
  PERFORM insert_sub(v_design, 'Design Graphique', 'design-graphique', s); s := s+1;
  PERFORM insert_sub(v_design, 'UI/UX Design', 'ui-ux-design', s); s := s+1;
  PERFORM insert_sub(v_design, 'Architecture Intérieure', 'architecture-interieure', s); s := s+1;
  PERFORM insert_sub(v_design, 'Illustration', 'illustration', s); s := s+1;
  PERFORM insert_sub(v_design, 'Logo & Identité Visuelle', 'logo-identite-visuelle', s); s := s+1;
  PERFORM insert_sub(v_design, 'Motion Design', 'motion-design', s); s := s+1;

  s := 1;
  PERFORM insert_sub(v_marketing, 'Community Management', 'community-management', s); s := s+1;
  PERFORM insert_sub(v_marketing, 'Stratégie Marketing', 'strategie-marketing', s); s := s+1;
  PERFORM insert_sub(v_marketing, 'Création de Contenu', 'creation-contenu', s); s := s+1;
  PERFORM insert_sub(v_marketing, 'Publicité & Ads', 'publicite-ads', s); s := s+1;
  PERFORM insert_sub(v_marketing, 'Relations Presse', 'relations-presse', s); s := s+1;
  PERFORM insert_sub(v_marketing, 'Email Marketing', 'email-marketing', s); s := s+1;

  s := 1;
  PERFORM insert_sub(v_sante, 'Kinésithérapie', 'kinesitherapie', s); s := s+1;
  PERFORM insert_sub(v_sante, 'Ostéopathie', 'osteopathie', s); s := s+1;
  PERFORM insert_sub(v_sante, 'Nutrition & Diététique', 'nutrition-dietetique', s); s := s+1;
  PERFORM insert_sub(v_sante, 'Psychologie & Thérapie', 'psychologie-therapie', s); s := s+1;
  PERFORM insert_sub(v_sante, 'Sophrologie', 'sophrologie', s); s := s+1;
  PERFORM insert_sub(v_sante, 'Acupuncture', 'acupuncture', s); s := s+1;
  PERFORM insert_sub(v_sante, 'Infirmier à Domicile', 'infirmier-domicile', s); s := s+1;

  s := 1;
  PERFORM insert_sub(v_transport, 'Déménagement', 'demenagement', s); s := s+1;
  PERFORM insert_sub(v_transport, 'Livraison', 'livraison', s); s := s+1;
  PERFORM insert_sub(v_transport, 'Transport de Personnes', 'transport-personnes', s); s := s+1;
  PERFORM insert_sub(v_transport, 'Transport Marchandises', 'transport-marchandises', s); s := s+1;
  PERFORM insert_sub(v_transport, 'Location Véhicules', 'location-vehicules', s); s := s+1;

  s := 1;
  PERFORM insert_sub(v_juridique, 'Avocat', 'avocat', s); s := s+1;
  PERFORM insert_sub(v_juridique, 'Notaire', 'notaire', s); s := s+1;
  PERFORM insert_sub(v_juridique, 'Comptabilité', 'comptabilite', s); s := s+1;
  PERFORM insert_sub(v_juridique, 'Conseil Fiscal', 'conseil-fiscal', s); s := s+1;
  PERFORM insert_sub(v_juridique, 'Assistant Administratif', 'assistant-administratif', s); s := s+1;
  PERFORM insert_sub(v_juridique, 'Création Entreprise', 'creation-entreprise', s); s := s+1;

  s := 1;
  PERFORM insert_sub(v_auto, 'Mécanique', 'mecanique-auto', s); s := s+1;
  PERFORM insert_sub(v_auto, 'Carrosserie & Peinture', 'carrosserie-peinture-auto', s); s := s+1;
  PERFORM insert_sub(v_auto, 'Pneus & Pneumatiques', 'pneus-pneumatiques', s); s := s+1;
  PERFORM insert_sub(v_auto, 'Diagnostic Électronique', 'diagnostic-electronique', s); s := s+1;
  PERFORM insert_sub(v_auto, 'Vente Auto', 'vente-auto', s); s := s+1;
  PERFORM insert_sub(v_auto, 'Entretien & Révision', 'entretien-revision-auto', s); s := s+1;

  s := 1;
  PERFORM insert_sub(v_agri, 'Maraîchage', 'maraichage', s); s := s+1;
  PERFORM insert_sub(v_agri, 'Viticulture', 'viticulture', s); s := s+1;
  PERFORM insert_sub(v_agri, 'Élevage', 'elevage', s); s := s+1;
  PERFORM insert_sub(v_agri, 'Apiculture', 'apiculture', s); s := s+1;
  PERFORM insert_sub(v_agri, 'Arboriculture', 'arboriculture', s); s := s+1;
  PERFORM insert_sub(v_agri, 'Conseil Agricole', 'conseil-agricole', s); s := s+1;

  s := 1;
  PERFORM insert_sub(v_musique, 'Musicien', 'musicien', s); s := s+1;
  PERFORM insert_sub(v_musique, 'DJ', 'dj', s); s := s+1;
  PERFORM insert_sub(v_musique, 'Studio Enregistrement', 'studio-enregistrement', s); s := s+1;
  PERFORM insert_sub(v_musique, 'Ingénieur du Son', 'ingenieur-son', s); s := s+1;
  PERFORM insert_sub(v_musique, 'Cours de Musique', 'cours-musique', s); s := s+1;
  PERFORM insert_sub(v_musique, 'Compositeur', 'compositeur', s); s := s+1;

  s := 1;
  PERFORM insert_sub(v_mode, 'Couture & Retouches', 'couture-retouches', s); s := s+1;
  PERFORM insert_sub(v_mode, 'Styliste', 'styliste', s); s := s+1;
  PERFORM insert_sub(v_mode, 'Confection', 'confection', s); s := s+1;
  PERFORM insert_sub(v_mode, 'Bijoux Fantaisie', 'bijoux-fantaisie', s); s := s+1;
  PERFORM insert_sub(v_mode, 'Customisation', 'customisation-mode', s); s := s+1;

  s := 1;
  PERFORM insert_sub(v_maison, 'Paysagisme', 'paysagisme', s); s := s+1;
  PERFORM insert_sub(v_maison, 'Jardinage & Entretien', 'jardinage-entretien', s); s := s+1;
  PERFORM insert_sub(v_maison, 'Piscine & Espaces Aqua', 'piscine-espaces-aqua', s); s := s+1;
  PERFORM insert_sub(v_maison, 'Élagage & Abattage', 'elagage-abattage', s); s := s+1;
  PERFORM insert_sub(v_maison, 'Conciergerie', 'conciergerie', s); s := s+1;

  s := 1;
  PERFORM insert_sub(v_securite, 'Agent de Sécurité', 'agent-securite', s); s := s+1;
  PERFORM insert_sub(v_securite, 'Alarme & Télésurveillance', 'alarme-telesurveillance', s); s := s+1;
  PERFORM insert_sub(v_securite, 'Contrôle d''Accès', 'controle-acces', s); s := s+1;
  PERFORM insert_sub(v_securite, 'Rondes & Surveillance', 'rondes-surveillance', s); s := s+1;

  s := 1;
  PERFORM insert_sub(v_industrie, 'Usinage & Mécanique', 'usinage-mecanique', s); s := s+1;
  PERFORM insert_sub(v_industrie, 'Soudure', 'soudure', s); s := s+1;
  PERFORM insert_sub(v_industrie, 'Chaudronnerie', 'chaudronnerie', s); s := s+1;
  PERFORM insert_sub(v_industrie, 'Maintenance Industrielle', 'maintenance-industrielle', s); s := s+1;
  PERFORM insert_sub(v_industrie, 'Automation & Robotique', 'automation-robotique', s); s := s+1;

  s := 1;
  PERFORM insert_sub(v_env, 'Éco-construction', 'eco-construction', s); s := s+1;
  PERFORM insert_sub(v_env, 'Recyclage & Déchets', 'recyclage-dechets', s); s := s+1;
  PERFORM insert_sub(v_env, 'Énergies Renouvelables', 'energies-renouvelables', s); s := s+1;
  PERFORM insert_sub(v_env, 'Audit Énergétique', 'audit-energetique', s); s := s+1;
  PERFORM insert_sub(v_env, 'Éco-conseil', 'eco-conseil', s); s := s+1;

  s := 1;
  PERFORM insert_sub(v_tourisme, 'Guide Touristique', 'guide-touristique', s); s := s+1;
  PERFORM insert_sub(v_tourisme, 'Hébergement', 'hebergement', s); s := s+1;
  PERFORM insert_sub(v_tourisme, 'Activités de Plein Air', 'activites-plein-air', s); s := s+1;
  PERFORM insert_sub(v_tourisme, 'Excursions', 'excursions', s); s := s+1;

  s := 1;
  PERFORM insert_sub(v_immo, 'Agence Immobilière', 'agence-immobiliere', s); s := s+1;
  PERFORM insert_sub(v_immo, 'Gestion Locative', 'gestion-locative', s); s := s+1;
  PERFORM insert_sub(v_immo, 'Diagnostic Immobilier', 'diagnostic-immobilier', s); s := s+1;
  PERFORM insert_sub(v_immo, 'Estimation', 'estimation-immobiliere', s); s := s+1;
  PERFORM insert_sub(v_immo, 'Home Staging', 'home-staging', s); s := s+1;

  s := 1;
  PERFORM insert_sub(v_art, 'Peinture', 'peinture-art', s); s := s+1;
  PERFORM insert_sub(v_art, 'Sculpture', 'sculpture-art', s); s := s+1;
  PERFORM insert_sub(v_art, 'Galerie d''Art', 'galerie-art', s); s := s+1;
  PERFORM insert_sub(v_art, 'Calligraphie & Enluminure', 'calligraphie-enluminure', s); s := s+1;
  PERFORM insert_sub(v_art, 'Artisanat d''Art', 'artisanat-art', s); s := s+1;

  s := 1;
  PERFORM insert_sub(v_entreprise, 'Comptabilité & Gestion', 'compta-gestion', s); s := s+1;
  PERFORM insert_sub(v_entreprise, 'Ressources Humaines', 'ressources-humaines', s); s := s+1;
  PERFORM insert_sub(v_entreprise, 'Secrétariat', 'secretariat', s); s := s+1;
  PERFORM insert_sub(v_entreprise, 'Traduction & Interprétariat', 'traduction-interpretariat', s); s := s+1;
  PERFORM insert_sub(v_entreprise, 'Conseil en Management', 'conseil-management', s); s := s+1;
  PERFORM insert_sub(v_entreprise, 'Recouvrement', 'recouvrement', s); s := s+1;

  s := 1;
  PERFORM insert_sub(v_animaux, 'Toilettage', 'toilettage', s); s := s+1;
  PERFORM insert_sub(v_animaux, 'Éducation Canine', 'education-canine', s); s := s+1;
  PERFORM insert_sub(v_animaux, 'Soins Vétérinaires', 'soins-veterinaires', s); s := s+1;
  PERFORM insert_sub(v_animaux, 'Pension & Gardiennage', 'pension-gardiennage', s); s := s+1;
  PERFORM insert_sub(v_animaux, 'Pet-sitting', 'pet-sitting', s); s := s+1;

  s := 1;
  PERFORM insert_sub(v_sport, 'Coach Personnel', 'coach-personnel', s); s := s+1;
  PERFORM insert_sub(v_sport, 'Yoga & Pilates', 'yoga-pilates', s); s := s+1;
  PERFORM insert_sub(v_sport, 'Arts Martiaux', 'arts-martiaux', s); s := s+1;
  PERFORM insert_sub(v_sport, 'Activités Collectives', 'activites-collectives', s); s := s+1;
  PERFORM insert_sub(v_sport, 'Préparation Physique', 'preparation-physique', s); s := s+1;

  s := 1;
  PERFORM insert_sub(v_energie, 'Panneaux Solaires', 'panneaux-solaires', s); s := s+1;
  PERFORM insert_sub(v_energie, 'Climatisation & Chauffage', 'climatisation-chauffage', s); s := s+1;
  PERFORM insert_sub(v_energie, 'Domotique', 'domotique', s); s := s+1;
  PERFORM insert_sub(v_energie, 'Bornes de Recharge', 'bornes-recharge', s); s := s+1;

  s := 1;
  PERFORM insert_sub(v_impression, 'Imprimerie Numérique', 'imprimerie-numerique', s); s := s+1;
  PERFORM insert_sub(v_impression, 'Imprimerie Offset', 'imprimerie-offset', s); s := s+1;
  PERFORM insert_sub(v_impression, 'Signalétique & Enseignes', 'signaletique-enseignes', s); s := s+1;
  PERFORM insert_sub(v_impression, 'Textile & Flocage', 'textile-flocage', s); s := s+1;
  PERFORM insert_sub(v_impression, 'Photocopies & Reprographie', 'photocopies-reprographie', s); s := s+1;

  s := 1;
  PERFORM insert_sub(v_telecom, 'Installation Fibre', 'installation-fibre', s); s := s+1;
  PERFORM insert_sub(v_telecom, 'Réseaux d''Entreprise', 'reseaux-entreprise', s); s := s+1;
  PERFORM insert_sub(v_telecom, 'Téléphonie IP', 'telephonie-ip', s); s := s+1;
  PERFORM insert_sub(v_telecom, 'Câblage & Connectique', 'cablage-connectique', s); s := s+1;

  s := 1;
  PERFORM insert_sub(v_nettoyage, 'Nettoyage Bureaux', 'nettoyage-bureaux', s); s := s+1;
  PERFORM insert_sub(v_nettoyage, 'Nettoyage Fin de Chantier', 'nettoyage-fin-chantier', s); s := s+1;
  PERFORM insert_sub(v_nettoyage, 'Pressing & Blanchisserie', 'pressing-blanchisserie', s); s := s+1;
  PERFORM insert_sub(v_nettoyage, 'Désinfection & Punaises', 'desinfection-punaises', s); s := s+1;
  PERFORM insert_sub(v_nettoyage, 'Nettoyage Vitres', 'nettoyage-vitres', s); s := s+1;

  s := 1;
  PERFORM insert_sub(v_event_musical, 'DJ Événementiel', 'dj-evenementiel', s); s := s+1;
  PERFORM insert_sub(v_event_musical, 'Sonorisation', 'sonorisation', s); s := s+1;
  PERFORM insert_sub(v_event_musical, 'Éclairage Spectacle', 'eclairage-spectacle', s); s := s+1;
  PERFORM insert_sub(v_event_musical, 'Location Matériel Sono', 'location-materiel-sono', s); s := s+1;
END $$;

-- Drop the helper function after use
DROP FUNCTION IF EXISTS public.insert_sub(uuid, text, text, int);
