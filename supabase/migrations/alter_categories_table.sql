-- Script pour mettre à jour la table categories existante
-- À utiliser si la table existe déjà mais n'a pas toutes les colonnes nécessaires

-- Vérifier si la colonne level existe, sinon l'ajouter
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name='categories'
        AND column_name='level'
    ) THEN
        ALTER TABLE categories ADD COLUMN level INTEGER DEFAULT 0 CHECK (level >= 0 AND level <= 2);
        RAISE NOTICE 'Colonne level ajoutée';
    ELSE
        RAISE NOTICE 'Colonne level existe déjà';
    END IF;
END $$;

-- Vérifier si la colonne sort_order existe, sinon l'ajouter
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name='categories'
        AND column_name='sort_order'
    ) THEN
        ALTER TABLE categories ADD COLUMN sort_order INTEGER DEFAULT 0;
        RAISE NOTICE 'Colonne sort_order ajoutée';
    ELSE
        RAISE NOTICE 'Colonne sort_order existe déjà';
    END IF;
END $$;

-- Vérifier si la colonne is_active existe, sinon l'ajouter
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name='categories'
        AND column_name='is_active'
    ) THEN
        ALTER TABLE categories ADD COLUMN is_active BOOLEAN DEFAULT true;
        RAISE NOTICE 'Colonne is_active ajoutée';
    ELSE
        RAISE NOTICE 'Colonne is_active existe déjà';
    END IF;
END $$;

-- Vérifier si la colonne updated_at existe, sinon l'ajouter
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name='categories'
        AND column_name='updated_at'
    ) THEN
        ALTER TABLE categories ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Colonne updated_at ajoutée';
    ELSE
        RAISE NOTICE 'Colonne updated_at existe déjà';
    END IF;
END $$;

-- Recréer le trigger pour updated_at
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
DROP FUNCTION IF EXISTS update_updated_at_column();

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Recréer les index
DROP INDEX IF EXISTS idx_categories_parent_id;
DROP INDEX IF EXISTS idx_categories_slug;
DROP INDEX IF EXISTS idx_categories_level;
DROP INDEX IF EXISTS idx_categories_sort_order;
DROP INDEX IF EXISTS idx_categories_is_active;

CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_level ON categories(level);
CREATE INDEX idx_categories_sort_order ON categories(sort_order);
CREATE INDEX idx_categories_is_active ON categories(is_active);

-- Mettre à jour les commentaires
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
