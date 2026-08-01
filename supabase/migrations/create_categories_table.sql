-- Création de la table categories pour la taxonomie des secteurs d'activité
-- Ce script crée la structure nécessaire pour 33 secteurs et 186 sous-catégories

-- Supprimer la table si elle existe (optionnel - commenter en production)
-- DROP TABLE IF EXISTS categories CASCADE;

-- Création de la table categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  icon VARCHAR(100),
  description TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  level INTEGER DEFAULT 0 CHECK (level >= 0 AND level <= 2),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_level ON categories(level);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Commentaires sur la table et les colonnes
COMMENT ON TABLE categories IS 'Taxonomie des secteurs d''activité et sous-catégories';
COMMENT ON COLUMN categories.id IS 'Identifiant unique de la catégorie';
COMMENT ON COLUMN categories.name IS 'Nom de la catégorie (secteur ou sous-catégorie)';
COMMENT ON COLUMN categories.slug IS 'Slug URL-friendly unique';
COMMENT ON COLUMN categories.icon IS 'Nom de l''icône Lucide pour l''affichage';
COMMENT ON COLUMN categories.description IS 'Description de la catégorie';
COMMENT ON COLUMN categories.parent_id IS 'ID de la catégorie parente (NULL pour les secteurs)';
COMMENT ON COLUMN categories.level IS 'Niveau hiérarchique (0=secteur, 1=sous-catégorie)';
COMMENT ON COLUMN categories.sort_order IS 'Ordre d''affichage';
COMMENT ON COLUMN categories.is_active IS 'Indique si la catégorie est active';
COMMENT ON COLUMN categories.created_at IS 'Date de création';
COMMENT ON COLUMN categories.updated_at IS 'Date de dernière modification';

-- Insertion des données de test (optionnel - peut être fait via le component CategorySeeder)
-- Les 33 secteurs principaux seront insérés via l'interface web ou le script de seeding
