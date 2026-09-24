# Guide d'Implémentation Complète du Système de Présentation de Services par Catégorie

## 🎯 Vue d'ensemble du système

Le système de présentation de services adaptée par métier permet à chaque professionnel de présenter ses services de manière personnalisée selon sa catégorie d'activité, plutôt que d'utiliser une approche uniforme pour tous les prestataires.

## 📦 Structure du système

### 1. **Données et Templates** (`src/data/category-templates.ts`)
- Définition des templates pour 8 catégories principales
- Chaque catégorie a ses propres champs spécifiques
- Configuration de présentation (layout, champs mis en avant)
- Mapping automatique des sous-catégories

### 2. **Composants UI**
- `CategoryServiceDisplay.tsx` - Affichage adaptatif des services
- `CategoryServiceForm.tsx` - Formulaire d'édition des données de catégorie
- `CategorySearchFilters.tsx` - Filtres de recherche avancés
- `CategoryStatsDisplay.tsx` - Affichage des statistiques de catégorie
- Composants UI de base (Card, Button, Input, etc.)

### 3. **API et Hooks** (`src/lib/api/category-data.ts`, `src/hooks/useCategoryData.ts`)
- Fonctions API pour CRUD des données de catégorie
- Hooks React pour faciliter l'intégration
- Recherche avancée par champs spécifiques
- Statistiques et analytics

### 4. **Pages**
- `CategorySearchPage.tsx` - Recherche par catégorie
- `ProviderCategoryEditPage.tsx` - Édition des services
- `AdminCategoryStatsPage.tsx` - Analytics admin

### 5. **Base de données**
- Migration Supabase pour `category_specific_data`
- Index GIN pour optimiser les recherches

## 🚀 Guide d'implémentation étape par étape

### Étape 1: Configuration de la base de données

```bash
# Exécuter la migration Supabase
npx supabase db push
```

Ou manuellement dans Supabase SQL Editor:

```sql
ALTER TABLE provider_profiles 
ADD COLUMN category_specific_data JSONB DEFAULT '{}';

CREATE INDEX idx_provider_profiles_category_specific_data 
ON provider_profiles USING GIN (category_specific_data);
```

### Étape 2: Tester les composants UI

#### Tester l'affichage adaptatif

```tsx
import CategoryServiceDisplay from '@/components/CategoryServiceDisplay';

<CategoryServiceDisplay
  categorySlug="artisanat"
  providerData={{
    business_name: "Ébénisterie Dupont",
    category_specific_data: {
      specialties: ["Menuiserie", "Ébénisterie"],
      techniques: ["Tournage", "Sculpture"],
      materials: ["Chêne", "Noyer"]
    }
  }}
  onContact={() => console.log('Contact')}
  onBook={() => console.log('Book')}
/>
```

#### Tester le formulaire d'édition

```tsx
import CategoryServiceForm from '@/components/CategoryServiceForm';

<CategoryServiceForm
  categorySlug="btp"
  initialData={{
    construction_types: ["Rénovation"],
    certifications: ["RGE"],
    intervention_area: "50km autour de Paris"
  }}
  onSave={(data) => console.log('Saved:', data)}
  onCancel={() => console.log('Cancelled')}
/>
```

### Étape 3: Intégrer dans les pages existantes

#### Dans ProviderProfilePage.tsx

```tsx
import CategoryServiceDisplay from '@/components/CategoryServiceDisplay';
import { getCategoryTemplate } from '@/data/category-templates';

// Dans le composant
const template = getCategoryTemplate(provider.category?.slug);

{template ? (
  <CategoryServiceDisplay
    categorySlug={provider.category?.slug}
    providerData={provider}
    onContact={() => setShowMessageModal(true)}
    onBook={() => navigate(`/booking/${provider.slug}`)}
  />
) : (
  <DefaultProviderDisplay provider={provider} />
)}
```

#### Dans SearchPage.tsx

```tsx
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();

// Lien vers recherche avancée par catégorie
{categorySlug && (
  <button
    onClick={() => navigate(`/category/${categorySlug}/search`)}
    className="flex items-center gap-2 text-sm text-primary-600"
  >
    Advanced search for {getCategoryName(categorySlug)}
    <ArrowRight size={16} />
  </button>
)}
```

### Étape 4: Configurer le routage

```tsx
// Dans App.tsx
import CategorySearchPage from '@/pages/CategorySearchPage';
import ProviderCategoryEditPage from '@/pages/ProviderCategoryEditPage';
import AdminCategoryStatsPage from '@/pages/AdminCategoryStatsPage';

// Ajouter les routes
<Route path="/category/:categorySlug/search" element={<Layout><CategorySearchPage /></Layout>} />
<Route path="/provider/:slug/edit/services" element={<Layout><ProviderCategoryEditPage /></Layout>} />
<Route path="/admin/category/:categorySlug/stats" element={<Layout><AdminCategoryStatsPage /></Layout>} />
```

### Étape 5: Tester le flux utilisateur complet

#### Pour un prestataire (Menuisier)

1. **Créer son profil** avec catégorie "Artisanat" → sous-catégorie "Menuiserie"
2. **Accéder à l'édition des services** : `/provider/jean-dupont-menuisier/edit/services`
3. **Remplir le formulaire adapté** :
   - Spécialités: ["Menuiserie", "Ébénisterie"]
   - Techniques: ["Tournage", "Sculpture", "Assemblage"]
   - Matériaux: ["Chêne", "Noyer", "Hêtre"]
   - Localisation atelier: "12 rue des Artisans, Lyon"
4. **Sauvegarder** → Les données sont stockées dans `category_specific_data`
5. **Vérifier l'affichage** sur sa page profil

#### Pour un client (Chercheur de menuisier)

1. **Naviguer vers la recherche** → Sélectionner "Artisanat" → "Menuiserie"
2. **Utiliser les filtres avancés** :
   - Techniques: "Tournage"
   - Matériaux: "Chêne"
3. **Voir les résultats** avec badges personnalisés
4. **Cliquer sur un prestataire** → Voir l'affichage adapté

### Étape 6: Personnaliser les templates

#### Ajouter une nouvelle catégorie

```typescript
// Dans category-templates.ts
export const categoryTemplates: Record<string, CategoryTemplate> = {
  // ... catégories existantes
  
  nouvelles_categorie: {
    id: 'nouvelles_categorie',
    name: 'Nouvelle Catégorie',
    slug: 'nouvelle-categorie',
    fields: [
      {
        id: 'champ_specifique',
        label: 'Champ spécifique',
        type: 'text',
        required: true,
        placeholder: 'Description du champ'
      }
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

// Ajouter le mapping
const categoryMapping: Record<string, string> = {
  // ... mappings existants
  'sous-categorie': 'nouvelles_categorie'
};
```

#### Créer un layout personnalisé

```typescript
// Dans CategoryServiceDisplay.tsx
function CustomLayout({ providerData, template }: { providerData: any; template: any }) {
  return (
    <div className="custom-layout">
      {/* Votre implémentation personnalisée */}
    </div>
  );
}

// Ajouter dans renderLayout()
case 'custom':
  return <CustomLayout providerData={providerData} template={template} />;
```

## 🔧 Fonctionnalités avancées

### Recherche par champs spécifiques

```typescript
import { searchProvidersByCategoryData } from '@/lib/api/category-data';

const results = await searchProvidersByCategoryData('btp', {
  certifications: ['RGE', 'Qualibat'],
  emergency_service: 'Oui 24/7'
});
```

### Statistiques de catégorie

```typescript
import { getCategoryDataStats } from '@/lib/api/category-data';

const stats = await getCategoryDataStats('artisanat');
// Returns: total_providers, field_stats with distributions
```

### Validation des données

```typescript
// Dans category-templates.ts
fields: [
  {
    id: 'experience_years',
    label: 'Années d\'expérience',
    type: 'number',
    required: true,
    validation: (value) => {
      if (value < 0) return 'Experience must be positive';
      if (value > 50) return 'Experience seems unrealistic';
      return true;
    }
  }
]
```

## 📊 Monitoring et Analytics

### Tracking des événements

```typescript
// Dans CategorySearchPage.tsx
useEffect(() => {
  if (window.gtag) {
    window.gtag('event', 'category_search', {
      category_slug: categorySlug,
      filter_count: Object.keys(filters).length,
      result_count: results.length
    });
  }
}, [categorySlug, filters, results.length]);
```

### KPIs à suivre

- **Taux d'adoption** : Pourcentage de prestataires avec `category_specific_data` rempli
- **Taux de conversion** : Conversion par catégorie avec/without présentation adaptée
- **Utilisation des filtres** : Fréquence d'utilisation des filtres avancés
- **Temps de recherche** : Temps passé sur les pages de recherche par catégorie

## 🐛 Résolution de problèmes courants

### Problème: Template non trouvé

**Solution**: Vérifier que le slug de catégorie correspond au mapping dans `getCategoryTemplate()`

### Problème: Données non sauvegardées

**Solution**: Vérifier que la migration Supabase a été exécutée et que le champ `category_specific_data` existe

### Problème: Layout incorrect

**Solution**: Vérifier que le layout spécifié dans le template existe dans `CategoryServiceDisplay.tsx`

### Problème: Filtres ne fonctionnent pas

**Solution**: Vérifier que les noms de champs dans les filtres correspondent exactement aux IDs dans le template

## 🎨 Personnalisation visuelle

### Adapter les couleurs par catégorie

```typescript
const getCategoryColors = (categorySlug: string) => {
  const colors: Record<string, string> = {
    artisanat: 'amber',
    btp: 'blue',
    beaute: 'pink',
    photographie: 'purple',
    informatique: 'cyan',
    conseil: 'indigo',
    restauration: 'orange',
    education: 'green'
  };
  return colors[categorySlug] || 'gray';
};
```

### Personnaliser les icônes

```typescript
const getCategoryIcon = (categorySlug: string) => {
  const icons: Record<string, any> = {
    artisanat: Hammer,
    btp: HardHat,
    beaute: Sparkles,
    // ...
  };
  return icons[categorySlug] || Briefcase;
};
```

## 🚀 Étapes suivantes recommandées

1. **Tester toutes les catégories** avec des données réelles
2. **Optimiser les performances** des recherches avec filtres
3. **Ajouter l'export** des statistiques en CSV/Excel
4. **Créer des dashboards** pour les prestataires
5. **Implementer l'IA** pour suggérer des champs basés sur la catégorie
6. **Ajouter la validation** automatique des données spécifiques
7. **Créer des templates** pour les sous-catégories les plus populaires
8. **Optimiser pour mobile** l'expérience de recherche et d'édition

## 📚 Ressources additionnelles

- Documentation complète : <ref_file file="C:\Users\hp\Music\project\docs\CATEGORY_SERVICE_PRESENTATION.md" />
- Guide de routage : <ref_file file="C:\Users\hp\Music\project\docs\CATEGORY_SERVICE_ROUTING.md" />
- Templates de catégorie : <ref_file file="C:\Users\hp\Music\project\src\data\category-templates.ts" />
- Exemples d'utilisation : <ref_file file="C:\Users\hp\Music\project\src\components\CategoryServiceDisplay.tsx" />