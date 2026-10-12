import { getCategoryTemplate } from '@/data/category-templates';

export interface PortfolioFieldDefinition {
  id: string;
  label: string;
  placeholder: string;
  multiline?: boolean;
}

export interface PortfolioFieldConfig {
  sectionTitle: string;
  sectionDescription: string;
  technologyLabel: string;
  technologyPlaceholder: string;
  fields: PortfolioFieldDefinition[];
}

const commonFields: PortfolioFieldDefinition[] = [
  { id: 'materials', label: 'Matériaux ou produits utilisés', placeholder: 'Ex. bois massif, argile, produits capillaires...' },
  { id: 'constraints', label: 'Contraintes et conditions', placeholder: 'Ex. dimensions, délai, lieu, conditions du chantier...', multiline: true },
  { id: 'deliverable', label: 'Livrable ou résultat concret', placeholder: 'Qu’avez-vous réalisé ou remis au client ?', multiline: true },
];

const portfolioConfigs: Record<string, PortfolioFieldConfig> = {
  artisanat: {
    sectionTitle: 'Détails de fabrication',
    sectionDescription: 'Montrez les gestes, matériaux et finitions qui rendent cette pièce unique.',
    technologyLabel: 'Techniques et savoir-faire',
    technologyPlaceholder: 'Ex. tournage, forge, broderie, finition à la main',
    fields: [
      { id: 'materials', label: 'Matériaux travaillés', placeholder: 'Ex. teck, laiton, cuir, argile...' },
      { id: 'techniques', label: 'Techniques de fabrication', placeholder: 'Ex. sculpture, soudure, tissage...' },
      { id: 'dimensions', label: 'Dimensions et finitions', placeholder: 'Ex. 120 × 80 cm, finition huilée...' },
      { id: 'custom_order', label: 'Commande sur mesure', placeholder: 'Besoin du client et adaptations réalisées...', multiline: true },
    ],
  },
  btp: {
    sectionTitle: 'Détails du chantier',
    sectionDescription: 'Précisez l’intervention, les contraintes du chantier et les résultats obtenus.',
    technologyLabel: 'Techniques et équipements',
    technologyPlaceholder: 'Ex. pose scellée, échafaudage, matériel utilisé',
    fields: [
      { id: 'work_type', label: 'Nature des travaux', placeholder: 'Ex. rénovation, installation, dépannage...' },
      { id: 'surface', label: 'Surface ou volume traité', placeholder: 'Ex. 85 m², 3 pièces, 12 ml...' },
      { id: 'materials', label: 'Matériaux et équipements', placeholder: 'Ex. carrelage grès cérame, cuivre...' },
      { id: 'site_constraints', label: 'Contraintes du chantier', placeholder: 'Ex. accès, sécurité, logement occupé...', multiline: true },
      { id: 'compliance', label: 'Normes et garanties appliquées', placeholder: 'Normes, contrôles ou garanties pertinents...' },
    ],
  },
  beaute: {
    sectionTitle: 'Détails de la prestation',
    sectionDescription: 'Décrivez la prestation et les soins ou techniques adaptés à la personne.',
    technologyLabel: 'Techniques et produits',
    technologyPlaceholder: 'Ex. balayage, gel, produits utilisés',
    fields: [
      { id: 'service_type', label: 'Type de prestation', placeholder: 'Ex. coiffure événementielle, soin visage...' },
      { id: 'duration', label: 'Durée de la séance', placeholder: 'Ex. 1 h 30' },
      { id: 'products', label: 'Produits et techniques', placeholder: 'Produits, soins ou techniques utilisés...' },
      { id: 'personalization', label: 'Adaptation au besoin du client', placeholder: 'Attente initiale et personnalisation apportée...', multiline: true },
    ],
  },
  photographie: {
    sectionTitle: 'Détails de la production',
    sectionDescription: 'Aidez vos clients à comprendre le style, le déroulé et les livrables.',
    technologyLabel: 'Matériel et logiciels',
    technologyPlaceholder: 'Ex. boîtier, objectif, éclairage, logiciel de retouche',
    fields: [
      { id: 'shoot_type', label: 'Type de prise de vue', placeholder: 'Ex. portrait, mariage, produit, architecture...' },
      { id: 'deliverables', label: 'Livrables', placeholder: 'Ex. 30 photos retouchées, galerie privée...' },
      { id: 'style', label: 'Style et direction artistique', placeholder: 'Ambiance, cadrage, lumière...', multiline: true },
      { id: 'usage_rights', label: 'Usage des images', placeholder: 'Ex. usage personnel, campagne, réseaux...' },
    ],
  },
  informatique: {
    sectionTitle: 'Détails de la réalisation numérique',
    sectionDescription: 'Présentez le besoin, votre contribution technique et les résultats mesurables.',
    technologyLabel: 'Technologies et outils',
    technologyPlaceholder: 'Ex. React, Supabase, Figma, Docker',
    fields: [
      { id: 'solution_type', label: 'Type de solution', placeholder: 'Ex. application web, audit, migration...' },
      { id: 'architecture', label: 'Architecture et intégrations', placeholder: 'Composants, API, services connectés...', multiline: true },
      { id: 'team_role', label: 'Votre rôle dans le projet', placeholder: 'Ex. conception, développement frontend, audit...' },
      { id: 'outcome_metrics', label: 'Résultats mesurables', placeholder: 'Ex. temps gagné, disponibilité, performances...' },
    ],
  },
  conseil: {
    sectionTitle: 'Détails de la mission',
    sectionDescription: 'Mettez en évidence le contexte, votre méthode et la valeur apportée.',
    technologyLabel: 'Méthodes et outils',
    technologyPlaceholder: 'Ex. diagnostic, ateliers, outils d’analyse',
    fields: [
      { id: 'mission_area', label: 'Domaine de conseil', placeholder: 'Ex. stratégie, finance, RH, organisation...' },
      { id: 'scope', label: 'Périmètre de la mission', placeholder: 'Équipe, service ou processus concerné...' },
      { id: 'approach', label: 'Approche et recommandations', placeholder: 'Étapes clés et recommandations formulées...', multiline: true },
      { id: 'business_impact', label: 'Impact pour le client', placeholder: 'Résultats, économies ou décisions facilitées...' },
    ],
  },
  restauration: {
    sectionTitle: 'Détails de la prestation culinaire',
    sectionDescription: 'Précisez le format, le menu et les contraintes alimentaires prises en compte.',
    technologyLabel: 'Cuisine et équipements',
    technologyPlaceholder: 'Ex. cuisine locale, four à bois, matériel de service',
    fields: [
      { id: 'format', label: 'Format de la prestation', placeholder: 'Ex. buffet, repas livré, service à table...' },
      { id: 'guest_count', label: 'Nombre de convives', placeholder: 'Ex. 40 personnes' },
      { id: 'menu', label: 'Menu ou spécialités', placeholder: 'Plats, ingrédients ou spécialités proposés...', multiline: true },
      { id: 'dietary_needs', label: 'Régimes et contraintes alimentaires', placeholder: 'Allergies ou adaptations prises en compte...' },
    ],
  },
  education: {
    sectionTitle: 'Détails de l’accompagnement',
    sectionDescription: 'Présentez le niveau, la méthode pédagogique et la progression obtenue.',
    technologyLabel: 'Méthodes et supports pédagogiques',
    technologyPlaceholder: 'Ex. exercices, supports, plateformes utilisées',
    fields: [
      { id: 'subject_level', label: 'Matière et niveau', placeholder: 'Ex. mathématiques, terminale...' },
      { id: 'format', label: 'Format et durée', placeholder: 'Ex. cours individuel, 10 séances...' },
      { id: 'teaching_method', label: 'Méthode pédagogique', placeholder: 'Approche et supports utilisés...', multiline: true },
      { id: 'progress', label: 'Progression observée', placeholder: 'Compétences acquises ou objectif atteint...' },
    ],
  },
  evenementiel: {
    sectionTitle: 'Détails de l’événement',
    sectionDescription: 'Décrivez le format, le nombre de participants et les éléments pris en charge.',
    technologyLabel: 'Équipements et prestations',
    technologyPlaceholder: 'Ex. sonorisation, décoration, coordination',
    fields: [
      { id: 'event_type', label: 'Type d’événement', placeholder: 'Ex. mariage, conférence, anniversaire...' },
      { id: 'attendees', label: 'Nombre de participants', placeholder: 'Ex. 120 personnes' },
      { id: 'scope', label: 'Prestations prises en charge', placeholder: 'Préparation, installation, coordination...', multiline: true },
      { id: 'venue_constraints', label: 'Lieu et contraintes', placeholder: 'Ex. intérieur/extérieur, horaires, accès...' },
    ],
  },
};

export function getPortfolioFieldConfig(categorySlug?: string | null): PortfolioFieldConfig {
  const template = categorySlug ? getCategoryTemplate(categorySlug) : null;
  const rootSlug = template?.slug ?? categorySlug ?? '';
  return portfolioConfigs[rootSlug] ?? {
    sectionTitle: 'Détails propres à votre métier',
    sectionDescription: 'Ajoutez les informations qui aideront vos clients à comprendre cette réalisation.',
    technologyLabel: 'Outils, techniques ou équipements',
    technologyPlaceholder: 'Ajoutez les outils, méthodes ou équipements utilisés',
    fields: commonFields,
  };
}
