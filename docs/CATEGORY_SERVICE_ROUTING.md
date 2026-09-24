# Configuration du Routage pour le Système de Présentation de Services par Catégorie

## 🛣️ Routes à ajouter dans App.tsx

Ajoutez ces nouvelles routes dans votre fichier `src/App.tsx` pour intégrer le système de présentation de services adaptée :

```tsx
import CategorySearchPage from '@/pages/CategorySearchPage';
import ProviderCategoryEditPage from '@/pages/ProviderCategoryEditPage';

// Dans votre configuration de routes
<Route path="/category/:categorySlug/search" element={<CategorySearchPage />} />
<Route path="/provider/:slug/edit/services" element={<ProviderCategoryEditPage />} />
```

## 🔗 Intégration dans les pages existantes

### 1. Dans SearchPage.tsx

Ajoutez des liens vers les recherches par catégorie :

```tsx
import { useNavigate } from 'react-router-dom';

// Dans le composant SearchPage
const navigate = useNavigate();

// Quand l'utilisateur sélectionne une catégorie
const handleCategorySelect = (categorySlug: string) => {
  navigate(`/category/${categorySlug}/search`);
};

// Ajoutez des boutons ou liens dans l'interface
{categories.map(category => (
  <button 
    key={category.slug}
    onClick={() => handleCategorySelect(category.slug)}
    className="..."
  >
    {category.name}
  </button>
))}
```

### 2. Dans ProviderProfilePage.tsx

Ajoutez un bouton pour éditer les services adaptés (visible uniquement pour le propriétaire) :

```tsx
import { useAuth } from '@/context/AuthContext';
import { Settings } from 'lucide-react';

const { user } = useAuth();
const isOwnProfile = user?.id === provider.user_id;

// Dans l'interface, près des autres boutons d'action
{isOwnProfile && (
  <button
    onClick={() => navigate(`/provider/${provider.slug}/edit/services`)}
    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
  >
    <Settings size={16} />
    Edit Services
  </button>
)}
```

### 3. Dans ProviderProfileEditPage.tsx

Ajoutez un lien vers l'édition des services de catégorie :

```tsx
import { Link } from 'react-router-dom';

// Dans le formulaire d'édition de profil
<div className="mb-6">
  <h3 className="text-lg font-semibold mb-4">Service Presentation</h3>
  {provider.category && (
    <Link 
      to={`/provider/${provider.slug}/edit/services`}
      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
    >
      Customize Service Presentation
    </Link>
  )}
  {!provider.category && (
    <p className="text-gray-500">
      Select a category first to customize your service presentation.
    </p>
  )}
</div>
```

## 📱 Navigation recommandée

### Pour les utilisateurs (chercheurs de services)

1. **Page d'accueil** → Sélection d'une catégorie
2. **Page de recherche** → `/category/:categorySlug/search`
3. **Filtres avancés** → Utilisation des filtres spécifiques à la catégorie
4. **Résultats** → Affichage adapté avec badges de champs spécifiques
5. **Page profil** → `/provider/:slug` avec affichage adapté

### Pour les prestataires

1. **Page profil** → Voir l'affichage actuel
2. **Édition profil** → `/provider/:slug/edit`
3. **Édition services** → `/provider/:slug/edit/services`
4. **Formulaire adapté** → Remplir les champs spécifiques
5. **Sauvegarde** → Mise à jour automatique du profil

## 🎯 Exemples d'URLs

```
# Recherche par catégorie
/category/artisanat/search
/category/btp/search
/category/beaute/search
/category/photographie/search

# Édition des services pour un prestataire
/provider/jean-dupont-menuisier/edit/services
/provider/tech-solutions/edit/services
/provider/studio-photo-paris/edit/services
```

## 🔧 Configuration des routes

Assurez-vous que votre routeur React est configuré correctement :

```tsx
// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Routes existantes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/provider/:slug" element={<ProviderProfilePage />} />
        <Route path="/provider/:slug/edit" element={<ProviderProfileEditPage />} />
        
        {/* Nouvelles routes pour les services de catégorie */}
        <Route path="/category/:categorySlug/search" element={<CategorySearchPage />} />
        <Route path="/provider/:slug/edit/services" element={<ProviderCategoryEditPage />} />
        
        {/* Autres routes... */}
      </Routes>
    </BrowserRouter>
  );
}
```

## 📊 Analytics et tracking

Pour suivre l'utilisation du système de présentation adaptée, vous pouvez ajouter du tracking :

```tsx
// Dans CategorySearchPage.tsx
useEffect(() => {
  // Track category search
  if (window.gtag) {
    window.gtag('event', 'category_search', {
      category_slug: categorySlug,
      filter_count: Object.keys(filters).length
    });
  }
}, [categorySlug, filters]);

// Dans ProviderCategoryEditPage.tsx
useEffect(() => {
  // Track category service edit
  if (window.gtag) {
    window.gtag('event', 'category_service_edit', {
      category_slug: categorySlug,
      provider_id: provider?.id
    });
  }
}, [categorySlug, provider?.id]);
```

## 🎨 Personnalisation de l'expérience utilisateur

### Messages de bienvenue par catégorie

Vous pouvez personnaliser les messages en fonction de la catégorie :

```tsx
const getCategoryWelcomeMessage = (categorySlug: string) => {
  const messages: Record<string, string> = {
    artisanat: "Trouvez des artisans qualifiés pour vos projets de création et rénovation",
    btp: "Des professionnels du bâtiment pour tous vos travaux de construction",
    beaute: "Prenez soin de vous avec nos experts en beauté et bien-être",
    photographie: "Capturez vos moments précieux avec nos photographes professionnels",
    informatique: "Solutions informatiques et développement web par des experts",
    conseil: "Conseils stratégiques pour développer votre activité",
    restauration: "Dégustez les saveurs du monde avec nos prestataires culinaires",
    education: "Formez-vous avec nos enseignants et formateurs qualifiés"
  };
  
  return messages[categorySlug] || "Trouvez le prestataire idéal pour vos besoins";
};
```

### Filtrage intelligent

Vous pouvez ajouter des filtres préconfigurés par catégorie :

```tsx
const getPresetFilters = (categorySlug: string) => {
  const presets: Record<string, Record<string, any>> = {
    btp: {
      certifications: ['RGE', 'Qualibat'],
      emergency_service: 'Oui 24/7'
    },
    informatique: {
      remote_work: '100% remote',
      experience_level: 'Senior (5-10 ans)'
    },
    photographie: {
      style: 'Portrait classique'
    }
  };
  
  return presets[categorySlug] || {};
};
```

## 🚀 Étapes suivantes

1. **Ajouter les routes** dans votre fichier App.tsx
2. **Tester la navigation** entre les différentes pages
3. **Ajouter des liens** dans votre interface existante
4. **Personnaliser les messages** et filtres par catégorie
5. **Configurer l'analyse** pour suivre l'utilisation
6. **Optimiser l'expérience** mobile pour les nouvelles pages