// Configuration de présentation adaptée par catégorie de métier
// Chaque catégorie a ses propres champs et modes d'affichage

export interface CategoryTemplate {
  id: string;
  name: string;
  slug: string;
  // Champs spécifiques pour cette catégorie
  fields: CategoryField[];
  // Comment présenter les services
  servicePresentation: ServicePresentation;
  // Sections spécifiques à afficher
  sections: string[];
  // Ordre d'affichage des sections
  sectionOrder: string[];
}

export interface CategoryField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'multiselect' | 'date' | 'file' | 'url' | 'range';
  required: boolean;
  placeholder?: string;
  options?: string[];
  validation?: (value: any) => boolean | string;
  unit?: string;
  min?: number;
  max?: number;
}

export interface ServicePresentation {
  // Comment présenter les services (cartes, liste, grille, etc.)
  layout: 'cards' | 'list' | 'grid' | 'timeline' | 'gallery' | 'calendar' | 'custom';
  // Champs à mettre en avant
  highlightFields: string[];
  // Template de description de service
  serviceTemplate: string;
  // Indicateurs visuels spécifiques
  visualIndicators: string[];
}

// Templates par grandes catégories
export const categoryTemplates: Record<string, CategoryTemplate> = {
  // Artisanat - Focus sur les techniques, matériaux, réalisations
  artisanat: {
    id: 'artisanat',
    name: 'Artisanat',
    slug: 'artisanat',
    fields: [
      {
        id: 'specialties',
        label: 'Spécialités',
        type: 'multiselect',
        required: true,
        options: ['Menuiserie', 'Ferronnerie', 'Poterie', 'Verrerie', 'Céramique', 'Broderie', 'Tapisserie', 'Maroquinerie'],
        placeholder: 'Sélectionnez vos spécialités'
      },
      {
        id: 'techniques',
        label: 'Techniques utilisées',
        type: 'multiselect',
        required: false,
        placeholder: 'Ex: Tournage, Forge, Dessin à la main...'
      },
      {
        id: 'materials',
        label: 'Matériaux travaillés',
        type: 'multiselect',
        required: false,
        placeholder: 'Ex: Bois, Fer, Argile, Verre, Cuir...'
      },
      {
        id: 'workshop_location',
        label: 'Localisation de l\'atelier',
        type: 'text',
        required: false,
        placeholder: 'Adresse de votre atelier'
      },
      {
        id: 'custom_work',
        label: 'Travail sur mesure disponible',
        type: 'select',
        required: false,
        options: ['Oui', 'Sur devis', 'Non']
      },
      {
        id: 'production_time',
        label: 'Délai de production moyen',
        type: 'select',
        required: false,
        options: ['< 1 semaine', '1-2 semaines', '2-4 semaines', '1-2 mois', '> 2 mois']
      }
    ],
    servicePresentation: {
      layout: 'gallery',
      highlightFields: ['specialties', 'techniques', 'materials'],
      serviceTemplate: '{specialties} - {techniques} avec {materials}',
      visualIndicators: ['gallery', 'workshop', 'certifications']
    },
    sections: ['gallery', 'techniques', 'materials', 'workshop', 'certifications', 'reviews'],
    sectionOrder: ['gallery', 'techniques', 'materials', 'workshop', 'certifications', 'reviews']
  },

  // BTP - Focus sur certifications, zones d'intervention, types de travaux
  btp: {
    id: 'btp',
    name: 'BTP',
    slug: 'btp',
    fields: [
      {
        id: 'construction_types',
        label: 'Types de construction',
        type: 'multiselect',
        required: true,
        options: ['Rénovation', 'Construction neuve', 'Aménagement', 'Décoration', 'Installation'],
        placeholder: 'Types de travaux réalisés'
      },
      {
        id: 'certifications',
        label: 'Certifications professionnelles',
        type: 'multiselect',
        required: true,
        placeholder: 'Ex: RGE, Qualibat, Artisan qualifié...'
      },
      {
        id: 'intervention_area',
        label: 'Zone d\'intervention',
        type: 'text',
        required: true,
        placeholder: 'Rayon d\'intervention (ex: 50km autour de Paris)'
      },
      {
        id: 'equipment',
        label: 'Équipement disponible',
        type: 'multiselect',
        required: false,
        placeholder: 'Ex: Échafaudage, Camionnette, Outils spécialisés...'
      },
      {
        id: 'insurance',
        label: 'Assurances',
        type: 'multiselect',
        required: true,
        options: ['Responsabilité civile', 'Décennale', 'Dommages ouvrage', 'Accident du travail']
      },
      {
        id: 'emergency_service',
        label: 'Service d\'urgence',
        type: 'select',
        required: false,
        options: ['Oui 24/7', 'Oui horaires étendus', 'Non']
      }
    ],
    servicePresentation: {
      layout: 'cards',
      highlightFields: ['construction_types', 'certifications', 'intervention_area'],
      serviceTemplate: '{construction_types} - Certifié {certifications}',
      visualIndicators: ['certifications', 'insurance', 'emergency']
    },
    sections: ['services', 'certifications', 'intervention_area', 'portfolio', 'reviews'],
    sectionOrder: ['services', 'certifications', 'intervention_area', 'portfolio', 'reviews']
  },

  // Beauté - Focus sur photos avant/après, tarifs par service, disponibilités
  beaute: {
    id: 'beaute',
    name: 'Beauté',
    slug: 'beaute',
    fields: [
      {
        id: 'services_offered',
        label: 'Services proposés',
        type: 'multiselect',
        required: true,
        options: ['Coiffure', 'Maquillage', 'Soins visage', 'Soins corps', 'Onglerie', 'Épilation', 'Tatouage', 'Piercing'],
        placeholder: 'Services que vous proposez'
      },
      {
        id: 'specialties',
        label: 'Spécialités',
        type: 'multiselect',
        required: false,
        placeholder: 'Ex: Mariage, Événements, Coloration experte...'
      },
      {
        id: 'products_used',
        label: 'Produits utilisés',
        type: 'multiselect',
        required: false,
        placeholder: 'Marques et types de produits'
      },
      {
        id: 'home_service',
        label: 'Service à domicile',
        type: 'select',
        required: false,
        options: ['Oui', 'Sur devis', 'Non']
      },
      {
        id: 'booking_system',
        label: 'Système de réservation',
        type: 'select',
        required: false,
        options: ['En ligne', 'Téléphone', 'WhatsApp', 'Email']
      }
    ],
    servicePresentation: {
      layout: 'cards',
      highlightFields: ['services_offered', 'specialties', 'home_service'],
      serviceTemplate: '{services_offered} - {specialties}',
      visualIndicators: ['before_after', 'products', 'booking']
    },
    sections: ['services', 'prices', 'before_after', 'products', 'reviews'],
    sectionOrder: ['services', 'prices', 'before_after', 'products', 'reviews']
  },

  // Photographie - Focus sur portfolio, style de travail, tarifs par séance
  photographie: {
    id: 'photographie',
    name: 'Photographie',
    slug: 'photographie',
    fields: [
      {
        id: 'photography_types',
        label: 'Types de photographie',
        type: 'multiselect',
        required: true,
        options: ['Portrait', 'Paysage', 'Architecture', 'Mode', 'Produit', 'Mariage', 'Événement'],
        placeholder: 'Types de photographie pratiqués'
      },
      {
        id: 'style',
        label: 'Style photographique',
        type: 'select',
        required: true,
        options: ['Portrait classique', 'Photojournalisme', 'Artistique', 'Commercial', 'Documentaire', 'Créatif']
      },
      {
        id: 'equipment',
        label: 'Équipement',
        type: 'text',
        required: false,
        placeholder: 'Appareils, objectifs, éclairage...'
      },
      {
        id: 'post_processing',
        label: 'Post-traitement inclus',
        type: 'select',
        required: false,
        options: ['Oui complet', 'Oui basique', 'Non', 'Sur devis']
      },
      {
        id: 'delivery_format',
        label: 'Format de livraison',
        type: 'multiselect',
        required: false,
        options: ['Numérique haute résolution', 'Imprimé', 'Album', 'Galerie en ligne']
      }
    ],
    servicePresentation: {
      layout: 'gallery',
      highlightFields: ['photography_types', 'style', 'equipment'],
      serviceTemplate: '{photography_types} - Style {style}',
      visualIndicators: ['portfolio', 'style', 'equipment']
    },
    sections: ['portfolio', 'style', 'services', 'pricing', 'reviews'],
    sectionOrder: ['portfolio', 'style', 'services', 'pricing', 'reviews']
  },

  // Informatique - Focus sur technologies, stack, projets, certifications
  informatique: {
    id: 'informatique',
    name: 'Informatique',
    slug: 'informatique',
    fields: [
      {
        id: 'specialties',
        label: 'Spécialités',
        type: 'multiselect',
        required: true,
        options: ['Développement web', 'Développement mobile', 'Cybersécurité', 'Réseaux', 'Support informatique', 'Cloud', 'Data science', 'IA'],
        placeholder: 'Vos spécialités techniques'
      },
      {
        id: 'tech_stack',
        label: 'Stack technique',
        type: 'multiselect',
        required: true,
        placeholder: 'Ex: React, Node.js, Python, AWS, Docker...'
      },
      {
        id: 'experience_level',
        label: 'Niveau d\'expérience',
        type: 'select',
        required: true,
        options: ['Junior (0-2 ans)', 'Intermediate (2-5 ans)', 'Senior (5-10 ans)', 'Expert (10+ ans)']
      },
      {
        id: 'project_types',
        label: 'Types de projets',
        type: 'multiselect',
        required: false,
        options: ['Web apps', 'Mobile apps', 'APIs', 'Systèmes', 'Consulting', 'Formation']
      },
      {
        id: 'remote_work',
        label: 'Travail à distance',
        type: 'select',
        required: false,
        options: ['100% remote', 'Hybride', 'Sur place uniquement']
      }
    ],
    servicePresentation: {
      layout: 'cards',
      highlightFields: ['specialties', 'tech_stack', 'experience_level'],
      serviceTemplate: '{specialties} - {tech_stack}',
      visualIndicators: ['github', 'linkedin', 'certifications']
    },
    sections: ['tech_stack', 'projects', 'experience', 'certifications', 'reviews'],
    sectionOrder: ['tech_stack', 'projects', 'experience', 'certifications', 'reviews']
  },

  // Conseil/Coaching - Focus sur expertise, études de cas, témoignages
  conseil: {
    id: 'conseil',
    name: 'Conseil',
    slug: 'conseil',
    fields: [
      {
        id: 'consulting_areas',
        label: 'Domaines de conseil',
        type: 'multiselect',
        required: true,
        options: ['Stratégie', 'Finance', 'RH', 'Marketing', 'Juridique', 'Digital'],
        placeholder: 'Domaines où vous conseillez'
      },
      {
        id: 'methodology',
        label: 'Méthodologie',
        type: 'textarea',
        required: false,
        placeholder: 'Décrivez votre approche de conseil'
      },
      {
        id: 'target_clients',
        label: 'Types de clients',
        type: 'multiselect',
        required: false,
        options: ['Startups', 'PME', 'Grandes entreprises', 'Particuliers', 'Institutions']
      },
      {
        id: 'case_studies',
        label: 'Études de cas disponibles',
        type: 'select',
        required: false,
        options: ['Oui, publiques', 'Oui, sur demande', 'Non']
      },
      {
        id: 'languages',
        label: 'Langues de travail',
        type: 'multiselect',
        required: true,
        options: ['Français', 'Anglais', 'Espagnol', 'Allemand', 'Autre']
      }
    ],
    servicePresentation: {
      layout: 'list',
      highlightFields: ['consulting_areas', 'methodology', 'target_clients'],
      serviceTemplate: '{consulting_areas} - {methodology}',
      visualIndicators: ['case_studies', 'testimonials', 'certifications']
    },
    sections: ['methodology', 'case_studies', 'testimonials', 'certifications', 'reviews'],
    sectionOrder: ['methodology', 'case_studies', 'testimonials', 'certifications', 'reviews']
  },

  // Restauration - Focus sur menu, type de cuisine, capacités, avis
  restauration: {
    id: 'restauration',
    name: 'Restauration',
    slug: 'restauration',
    fields: [
      {
        id: 'cuisine_type',
        label: 'Type de cuisine',
        type: 'multiselect',
        required: true,
        options: ['Française', 'Italienne', 'Asiatique', 'Africaine', 'Fusion', 'Végétarienne', 'Végane'],
        placeholder: 'Types de cuisine proposés'
      },
      {
        id: 'service_type',
        label: 'Type de service',
        type: 'multiselect',
        required: true,
        options: ['Restaurant', 'Catering', 'Boulangerie', 'Pâtisserie', 'Cuisine à domicile', 'Food truck']
      },
      {
        id: 'capacity',
        label: 'Capacité',
        type: 'number',
        required: false,
        placeholder: 'Nombre de couverts / personnes',
        unit: 'personnes'
      },
      {
        id: 'specialties',
        label: 'Spécialités',
        type: 'text',
        required: false,
        placeholder: 'Plats ou spécialités signatures'
      },
      {
        id: 'dietary_options',
        label: 'Options diététiques',
        type: 'multiselect',
        required: false,
        options: ['Végétarien', 'Végan', 'Sans gluten', 'Halal', 'Casher', 'Allergènes']
      }
    ],
    servicePresentation: {
      layout: 'cards',
      highlightFields: ['cuisine_type', 'service_type', 'specialties'],
      serviceTemplate: '{cuisine_type} - {service_type}',
      visualIndicators: ['menu', 'photos', 'reviews']
    },
    sections: ['menu', 'photos', 'specialties', 'reviews'],
    sectionOrder: ['menu', 'photos', 'specialties', 'reviews']
  },

  // Éducation - Focus sur matières, niveaux, méthodes pédagogiques
  education: {
    id: 'education',
    name: 'Éducation',
    slug: 'education',
    fields: [
      {
        id: 'subjects',
        label: 'Matières enseignées',
        type: 'multiselect',
        required: true,
        options: ['Soutien scolaire', 'Langues', 'Musique', 'Arts plastiques', 'Sport', 'Formation professionnelle'],
        placeholder: 'Matières que vous enseignez'
      },
      {
        id: 'levels',
        label: 'Niveaux',
        type: 'multiselect',
        required: true,
        options: ['Primaire', 'Collège', 'Lycée', 'Université', 'Professionnel', 'Tous niveaux']
      },
      {
        id: 'teaching_method',
        label: 'Méthode d\'enseignement',
        type: 'select',
        required: false,
        options: ['En ligne', 'En présentiel', 'Hybride', 'Domicile']
      },
      {
        id: 'group_size',
        label: 'Taille des groupes',
        type: 'select',
        required: false,
        options: ['Individuel', 'Petit groupe (2-5)', 'Groupe moyen (6-10)', 'Grand groupe (10+)']
      },
      {
        id: 'certifications',
        label: 'Certifications pédagogiques',
        type: 'multiselect',
        required: false,
        placeholder: 'Ex: CAPES, Agrégation, Diplômes spécifiques...'
      }
    ],
    servicePresentation: {
      layout: 'cards',
      highlightFields: ['subjects', 'levels', 'teaching_method'],
      serviceTemplate: '{subjects} - Niveaux {levels}',
      visualIndicators: ['certifications', 'reviews', 'methodology']
    },
    sections: ['subjects', 'methodology', 'certifications', 'reviews'],
    sectionOrder: ['subjects', 'methodology', 'certifications', 'reviews']
  }
};

// Fonction pour obtenir le template d'une catégorie
export function getCategoryTemplate(categorySlug: string): CategoryTemplate | null {
  // Mapping des sous-catégories vers les catégories principales
  const categoryMapping: Record<string, string> = {
    // Artisanat
    'menuiserie': 'artisanat',
    'ferronnerie': 'artisanat',
    'poterie': 'artisanat',
    'verrerie': 'artisanat',
    'ceramique': 'artisanat',
    'broderie': 'artisanat',
    'tapisserie': 'artisanat',
    'maroquinerie': 'artisanat',
    
    // BTP
    'maconnerie': 'btp',
    'electricite': 'btp',
    'plomberie': 'btp',
    'charpente': 'btp',
    'carrelage': 'btp',
    'peinture': 'btp',
    'isolation': 'btp',
    'couverture': 'btp',
    'terrassement': 'btp',
    'demolition': 'btp',
    
    // Beauté
    'coiffure': 'beaute',
    'maquillage': 'beaute',
    'soins-visage': 'beaute',
    'soins-corps': 'beaute',
    'onglerie': 'beaute',
    'epilation': 'beaute',
    'tatouage': 'beaute',
    'piercing': 'beaute',
    
    // Photographie
    'portrait': 'photographie',
    'paysage': 'photographie',
    'architecture': 'photographie',
    'mode': 'photographie',
    'produit': 'photographie',
    'mariage': 'photographie',
    'evenement': 'photographie',
    
    // Informatique
    'developpement-web': 'informatique',
    'developpement-mobile': 'informatique',
    'cybersecurite': 'informatique',
    'reseaux': 'informatique',
    'support-informatique': 'informatique',
    'cloud': 'informatique',
    'data-science': 'informatique',
    'ia': 'informatique',
    
    // Conseil
    'conseil-strategie': 'conseil',
    'conseil-finance': 'conseil',
    'conseil-rh': 'conseil',
    'conseil-marketing': 'conseil',
    'conseil-juridique': 'conseil',
    'conseil-digital': 'conseil',
    
    // Restauration
    'restaurant': 'restauration',
    'catering': 'restauration',
    'boulangerie': 'restauration',
    'patisserie': 'restauration',
    'cuisine-domicile': 'restauration',
    'food-truck': 'restauration',
    
    // Éducation
    'soutien-scolaire': 'education',
    'langues': 'education',
    'musique': 'education',
    'arts-plastiques': 'education',
    'sport': 'education',
    'formation-professionnelle': 'education'
  };
  
  const mainCategory = categoryMapping[categorySlug] || categorySlug;
  return categoryTemplates[mainCategory] || null;
}

// Fonction pour obtenir les champs spécifiques à une catégorie
export function getCategoryFields(categorySlug: string): CategoryField[] {
  const template = getCategoryTemplate(categorySlug);
  return template?.fields || [];
}

// Fonction pour obtenir la présentation de services pour une catégorie
export function getServicePresentation(categorySlug: string): ServicePresentation | null {
  const template = getCategoryTemplate(categorySlug);
  return template?.servicePresentation || null;
}