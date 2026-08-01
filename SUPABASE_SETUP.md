# Configuration Supabase - Catégories

## Étapes pour configurer la table categories dans Supabase

### 1. Exécuter le script SQL

Ouvrez votre dashboard Supabase et suivez ces étapes :

1. Connectez-vous à votre projet Supabase
2. Allez dans **SQL Editor** dans le menu de gauche
3. Cliquez sur **New Query**
4. Copiez le contenu du fichier `supabase/migrations/create_categories_table.sql`
5. Collez-le dans l'éditeur SQL
6. Cliquez sur **Run** pour exécuter le script

Ce script va :
- Créer la table `categories` avec tous les champs nécessaires
- Créer les index pour optimiser les performances
- Ajouter un trigger pour mettre à jour automatiquement `updated_at`

### 2. Importer les données des catégories

Après avoir créé la table, vous avez deux options pour importer les données :

#### Option A : Via l'interface web (recommandé)

1. Démarrez le serveur de développement : `npm run dev`
2. Naviguez vers `http://localhost:5174/admin/seed-categories`
3. Cliquez sur **"Démarrer l'import"**
4. Attendez que le seeding se termine (environ 30-60 secondes)

#### Option B : Via le script TypeScript

1. Créez un fichier `.env` à la racine du projet avec vos variables Supabase :
   ```
   VITE_SUPABASE_URL=https://votre-projet.supabase.co
   VITE_SUPABASE_ANON_KEY=votre_cle_anon
   ```

2. Exécutez le script :
   ```bash
   npx tsx scripts/seed-categories.ts
   ```

### 3. Vérifier l'import

Dans le dashboard Supabase :
1. Allez dans **Table Editor**
2. Sélectionnez la table `categories`
3. Vous devriez voir 219 lignes (33 secteurs + 186 sous-catégories)

## Structure de la table

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID | Identifiant unique |
| name | VARCHAR(255) | Nom de la catégorie |
| slug | VARCHAR(255) | Slug URL unique |
| icon | VARCHAR(100) | Nom de l'icône Lucide |
| description | TEXT | Description |
| parent_id | UUID | ID de la catégorie parente |
| level | INTEGER | Niveau hiérarchique (0=secteur, 1=sous-catégorie) |
| sort_order | INTEGER | Ordre d'affichage |
| is_active | BOOLEAN | Catégorie active |
| created_at | TIMESTAMP | Date de création |
| updated_at | TIMESTAMP | Date de modification |

## Taxonomie

- **33 secteurs principaux** (level = 0, parent_id = NULL)
- **186 sous-catégories** (level = 1, parent_id = secteur_id)
- **219 catégories au total**

## Dépannage

### Erreur "relation categories does not exist"

Assurez-vous d'avoir exécuté le script SQL de création de table avant d'importer les données.

### Erreur de permission

Vérifiez que votre clé ANON Supabase a les permissions nécessaires pour insérer des données dans la table categories.

### Données en double

Si vous exécutez le seeding plusieurs fois, les catégories seront dupliquées. Pour nettoyer :
```sql
TRUNCATE TABLE categories CASCADE;
```
