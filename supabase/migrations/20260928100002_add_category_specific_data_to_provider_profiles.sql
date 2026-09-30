-- Migration pour ajouter le champ category_specific_data à la table provider_profiles
-- Ce champ permet de stocker les données spécifiques à chaque catégorie de métier

-- Ajouter le champ category_specific_data de type JSONB
ALTER TABLE provider_profiles 
ADD COLUMN IF NOT EXISTS category_specific_data JSONB DEFAULT '{}';

-- Ajouter un commentaire pour documenter le champ
COMMENT ON COLUMN provider_profiles.category_specific_data IS 'Données spécifiques à la catégorie du prestataire. Structure varie selon le template de catégorie (ex: techniques, matériaux pour artisanat; certifications, assurances pour BTP)';

-- Créer un index pour optimiser les recherches sur les données spécifiques
CREATE INDEX IF NOT EXISTS idx_provider_profiles_category_specific_data 
ON provider_profiles USING GIN (category_specific_data);

-- Exemple de données pour un artisan menuisier
-- UPDATE provider_profiles 
-- SET category_specific_data = '{
--   "specialties": ["Menuiserie", "Ébénisterie"],
--   "techniques": ["Tournage", "Sculpture", "Assemblage"],
--   "materials": ["Chêne", "Noyer", "Hêtre"],
--   "workshop_location": "12 rue des Artisans, Lyon",
--   "custom_work": "Oui",
--   "production_time": "2-4 semaines"
-- }'::jsonb
-- WHERE category_id IN (SELECT id FROM categories WHERE slug = 'menuiserie');

-- Exemple de données pour un électricien BTP
-- UPDATE provider_profiles 
-- SET category_specific_data = '{
--   "construction_types": ["Rénovation", "Installation"],
--   "certifications": ["RGE", "Qualibat"],
--   "intervention_area": "50km autour de Paris",
--   "equipment": ["Échafaudage", "Camionnette"],
--   "insurance": ["Responsabilité civile", "Décennale"],
--   "emergency_service": "Oui horaires étendus"
-- }'::jsonb
-- WHERE category_id IN (SELECT id FROM categories WHERE slug = 'electricite');

-- Exemple de données pour un développeur web
-- UPDATE provider_profiles 
-- SET category_specific_data = '{
--   "specialties": ["Développement web", "Développement mobile"],
--   "tech_stack": ["React", "Node.js", "TypeScript", "AWS"],
--   "experience_level": "Senior (5-10 ans)",
--   "project_types": ["Web apps", "APIs", "Consulting"],
--   "remote_work": "100% remote"
-- }'::jsonb
-- WHERE category_id IN (SELECT id FROM categories WHERE slug = 'developpement-web');