# Présentation des Services Adaptée par Métier

## 🎯 Objectif
Permettre à chaque métier de présenter ses services de manière différenciée et adaptée à ses spécificités, plutôt que d'utiliser une approche uniforme pour tous les prestataires.

## 🏗️ Architecture

### 1. Système de Templates par Catégorie (`src/data/category-templates.ts`)

**Fonctionnalités :**
- Définition des champs spécifiques pour chaque catégorie de métier
- Configuration de la présentation des services (layout, champs mis en avant)
- Personnalisation des sections à afficher et de leur ordre
- Mapping automatique des sous-catégories vers les catégories principales

**Catégories supportées :**
- **Artisanat** : Spécialités, techniques, matériaux, atelier, travail sur mesure
- **BTP** : Types de construction, certifications, zone d'intervention, assurances
- **Beauté** : Services proposés, spécialités, produits, service à domicile
- **Photographie** : Types de photo, style, équipement, post-traitement
- **Informatique** : Stack technique, niveau d'expérience, types de projets
- **Conseil/Coaching** : Domaines de conseil, méthodologie, types de clients
- **Restauration** : Type de cuisine, service, capacité, options diététiques
- **Éducation** : Matières, niveaux, méthode d'enseignement, certifications

### 2. Composant d'Affichage (`src/components/CategoryServiceDisplay.tsx`)

**Layouts disponibles :**
- `cards` : Affichage en cartes pour les informations structurées
- `gallery` : Galerie d'images pour les métiers visuels (artisanat, photographie)
- `list` : Liste pour les métiers basés sur des informations textuelles
- `timeline` : Timeline pour l'expérience et les projets
- `calendar` : Calendrier pour les disponibilités

**Indicateurs visuels :**
- Certifications professionnelles
- Portfolio et projets
- Avis clients
- Avant/après (beauté)
- GitHub/LinkedIn (informatique)
- Assurances (BTP)
- Service d'urgence

### 3. Composant de Formulaire (`src/components/CategoryServiceForm.tsx`)

**Types de champs supportés :**
- `text` : Champ texte simple
- `textarea` : Zone de texte multi-lignes
- `number` : Nombre avec unité optionnelle
- `select` : Sélection unique
- `multiselect` : Sélection multiple avec checkboxes
- `date` : Sélecteur de date
- `url` : Champ URL
- `file` : Upload de fichier
- `range` : Slider avec min/max

**Fonctionnalités :**
- Validation en temps réel
- Gestion des erreurs
- Champs requis optionnels
- Placeholder personnalisés

## 🔧 Intégration

### Dans la page de profil du prestataire

```tsx
import CategoryServiceDisplay from '@/components/CategoryServiceDisplay';
import { getCategoryTemplate } from '@/data/category-templates';

// Dans ProviderProfilePage.tsx
const { provider } = useProvider(); // vos données existantes
const template = getCategoryTemplate(provider.category?.slug);

return (
  <div>
    {/* Utiliser le composant adapté si un template existe */}
    {template ? (
      <CategoryServiceDisplay
        categorySlug={provider.category?.slug}
        providerData={provider}
        onContact={() => setShowMessageModal(true)}
        onBook={() => navigate(`/booking/${provider.slug}`)}
      />
    ) : (
      {/* Fallback sur l'affichage actuel */}
      <DefaultProviderProfile provider={provider} />
    )}
  </div>
);
```

### Dans le formulaire d'édition de profil

```tsx
import CategoryServiceForm from '@/components/CategoryServiceForm';

// Dans ProviderProfileEditPage.tsx
const [categoryData, setCategoryData] = useState({});

const handleCategoryDataSave = (data: Record<string, any>) => {
  // Sauvegarder les données spécifiques à la catégorie
  await supabase
    .from('provider_profiles')
    .update({ category_specific_data: data })
    .eq('id', providerId);
};

return (
  <CategoryServiceForm
    categorySlug={selectedCategory}
    initialData={provider.category_specific_data}
    onSave={handleCategoryDataSave}
    onCancel={() => navigate('/profile')}
  />
);
```

## 📊 Structure de données

### Table `provider_profiles` - Ajouter un champ

```sql
ALTER TABLE provider_profiles 
ADD COLUMN category_specific_data JSONB DEFAULT '{}';
```

### Exemple de données pour un artisan menuisier

```json
{
  "specialties": ["Menuiserie", "Ébénisterie"],
  "techniques": ["Tournage", "Sculpture", "Assemblage"],
  "materials": ["Chêne", "Noyer", "Hêtre"],
  "workshop_location": "12 rue des Artisans, Lyon",
  "custom_work": "Oui",
  "production_time": "2-4 semaines"
}
```

### Exemple de données pour un développeur web

```json
{
  "specialties": ["Développement web", "Développement mobile"],
  "tech_stack": ["React", "Node.js", "TypeScript", "AWS"],
  "experience_level": "Senior (5-10 ans)",
  "project_types": ["Web apps", "APIs", "Consulting"],
  "remote_work": "100% remote"
}
```

## 🎨 Personnalisation

### Ajouter une nouvelle catégorie

1. **Ajouter le template dans `category-templates.ts`**:

```typescript
export const categoryTemplates: Record<string, CategoryTemplate> = {
  // ... catégories existantes
  
  nouvelle_categorie: {
    id: 'nouvelle_categorie',
    name: 'Nouvelle Catégorie',
    slug: 'nouvelle-categorie',
    fields: [
      {
        id: 'champ_specifique',
        label: 'Champ spécifique',
        type: 'text',
        required: true,
        placeholder: 'Description du champ'
      },
      // ... autres champs
    ],
    servicePresentation: {
      layout: 'cards',
      highlightFields: ['champ_specifique'],
      serviceTemplate: '{champ_specifique}',
      visualIndicators: ['certifications', 'reviews']
    },
    sections: ['portfolio', 'reviews'],
    sectionOrder: ['portfolio', 'reviews']
  }
};
```

2. **Ajouter le mapping dans la fonction `getCategoryTemplate`**:

```typescript
const categoryMapping: Record<string, string> = {
  // ... mappings existants
  'sous-categorie': 'nouvelle_categorie'
};
```

### Créer un layout personnalisé

Ajouter un nouveau layout dans `CategoryServiceDisplay.tsx`:

```typescript
function CustomLayout({ providerData, template }: { providerData: any; template: any }) {
  // Votre logique de layout personnalisé
  return (
    <div className="custom-layout">
      {/* Votre implémentation */}
    </div>
  );
}
```

Puis l'ajouter dans le `switch` de `renderLayout()`.

## 🚀 Avantages

1. **Expérience utilisateur améliorée** : Chaque métier présente ses services de manière pertinente
2. **Meilleure conversion** : Les clients voient rapidement les informations importantes pour leur besoin
3. **Flexibilité** : Facile d'ajouter de nouvelles catégories et champs
4. **Maintenabilité** : Code organisé et réutilisable
5. **Personnalisation** : Possibilité d'adapter l'affichage selon les besoins

## 📝 Exemples d'utilisation

### Artisanat (Menuisier)
- **Layout** : Gallery (photos des réalisations)
- **Champs mis en avant** : Spécialités, techniques, matériaux
- **Sections** : Portfolio, techniques, matériaux, atelier, certifications

### BTP (Électricien)
- **Layout** : Cards (informations structurées)
- **Champs mis en avant** : Types de construction, certifications, zone d'intervention
- **Sections** : Services, certifications, zone d'intervention, portfolio

### Photographie (Photographe de mariage)
- **Layout** : Gallery (portfolio visuel)
- **Champs mis en avant** : Types de photographie, style, équipement
- **Sections** : Portfolio, style, services, tarification

### Informatique (Développeur web)
- **Layout** : Cards (stack technique)
- **Champs mis en avant** : Spécialités, stack technique, niveau d'expérience
- **Sections** : Stack technique, projets, expérience, certifications

## 🔮 Évolutions possibles

1. **Templates personnalisables par les prestataires** : Permettre aux prestataires de créer leurs propres templates
2. **IA pour la génération de descriptions** : Utiliser l'IA pour générer des descriptions basées sur les champs remplis
3. **Recherche avancée par champs spécifiques** : Permettre la recherche sur les champs spécifiques à chaque catégorie
4. **Export PDF/Portfolio** : Générer des portfolios professionnels basés sur les données de la catégorie
5. **Comparaison entre prestataires** : Comparer les prestataires sur les champs pertinents de leur catégorie