// Taxonomie complète des secteurs d'activité
// 33 secteurs principaux, 186 sous-catégories, 219 catégories au total

export const categoryTaxonomy = [
  // Secteurs initiaux
  {
    name: "Artisanat",
    slug: "artisanat",
    icon: "hammer",
    subcategories: [
      { name: "Menuiserie", slug: "menuiserie" },
      { name: "Ferronnerie", slug: "ferronnerie" },
      { name: "Poterie", slug: "poterie" },
      { name: "Verrerie", slug: "verrerie" },
      { name: "Céramique", slug: "ceramique" },
      { name: "Broderie", slug: "broderie" },
      { name: "Tapisserie", slug: "tapisserie" },
      { name: "Maroquinerie", slug: "maroquinerie" }
    ]
  },
  {
    name: "BTP",
    slug: "btp",
    icon: "hard-hat",
    subcategories: [
      { name: "Maçonnerie", slug: "maconnerie" },
      { name: "Électricité", slug: "electricite" },
      { name: "Plomberie", slug: "plomberie" },
      { name: "Charpente", slug: "charpente" },
      { name: "Carrelage", slug: "carrelage" },
      { name: "Peinture", slug: "peinture" },
      { name: "Isolation", slug: "isolation" },
      { name: "Couverture", slug: "couverture" },
      { name: "Terrassement", slug: "terrassement" },
      { name: "Démolition", slug: "demolition" }
    ]
  },
  {
    name: "Beauté",
    slug: "beaute",
    icon: "sparkles",
    subcategories: [
      { name: "Coiffure", slug: "coiffure" },
      { name: "Maquillage", slug: "maquillage" },
      { name: "Soins visage", slug: "soins-visage" },
      { name: "Soins corps", slug: "soins-corps" },
      { name: "Onglerie", slug: "onglerie" },
      { name: "Épilation", slug: "epilation" },
      { name: "Tatouage", slug: "tatouage" },
      { name: "Piercing", slug: "piercing" }
    ]
  },
  {
    name: "Événementiel",
    slug: "evenementiel",
    icon: "calendar",
    subcategories: [
      { name: "Organisation événements", slug: "organisation-evenements" },
      { name: "Traiteur", slug: "traiteur" },
      { name: "Décoration événementielle", slug: "decoration-evenementielle" },
      { name: "Photographie événement", slug: "photographie-evenement" },
      { name: "Vidéo événement", slug: "video-evenement" },
      { name: "DJ", slug: "dj" },
      { name: "Sonorisation", slug: "sonorisation" },
      { name: "Location matériel", slug: "location-materiel" }
    ]
  },
  {
    name: "Informatique",
    slug: "informatique",
    icon: "laptop",
    subcategories: [
      { name: "Développement web", slug: "developpement-web" },
      { name: "Développement mobile", slug: "developpement-mobile" },
      { name: "Cybersécurité", slug: "cybersecurite" },
      { name: "Réseaux", slug: "reseaux" },
      { name: "Support informatique", slug: "support-informatique" },
      { name: "Cloud", slug: "cloud" },
      { name: "Data science", slug: "data-science" },
      { name: "IA", slug: "ia" }
    ]
  },
  {
    name: "Conseil",
    slug: "conseil",
    icon: "briefcase",
    subcategories: [
      { name: "Conseil stratégie", slug: "conseil-strategie" },
      { name: "Conseil finance", slug: "conseil-finance" },
      { name: "Conseil RH", slug: "conseil-rh" },
      { name: "Conseil marketing", slug: "conseil-marketing" },
      { name: "Conseil juridique", slug: "conseil-juridique" },
      { name: "Conseil digital", slug: "conseil-digital" }
    ]
  },
  {
    name: "Coaching",
    slug: "coaching",
    icon: "users",
    subcategories: [
      { name: "Coaching professionnel", slug: "coaching-professionnel" },
      { name: "Coaching personnel", slug: "coaching-personnel" },
      { name: "Coaching sportif", slug: "coaching-sportif" },
      { name: "Coaching nutrition", slug: "coaching-nutrition" },
      { name: "Coaching business", slug: "coaching-business" }
    ]
  },
  {
    name: "Photographie",
    slug: "photographie",
    icon: "camera",
    subcategories: [
      { name: "Portrait", slug: "portrait" },
      { name: "Paysage", slug: "paysage" },
      { name: "Architecture", slug: "architecture" },
      { name: "Mode", slug: "mode" },
      { name: "Produit", slug: "produit" },
      { name: "Mariage", slug: "mariage" },
      { name: "Événement", slug: "evenement" }
    ]
  },
  {
    name: "Restauration",
    slug: "restauration",
    icon: "utensils",
    subcategories: [
      { name: "Restaurant", slug: "restaurant" },
      { name: "Catering", slug: "catering" },
      { name: "Boulangerie", slug: "boulangerie" },
      { name: "Pâtisserie", slug: "patisserie" },
      { name: "Cuisine à domicile", slug: "cuisine-domicile" },
      { name: "Food truck", slug: "food-truck" }
    ]
  },
  {
    name: "Éducation",
    slug: "education",
    icon: "book",
    subcategories: [
      { name: "Soutien scolaire", slug: "soutien-scolaire" },
      { name: "Langues", slug: "langues" },
      { name: "Musique", slug: "musique" },
      { name: "Arts plastiques", slug: "arts-plastiques" },
      { name: "Sport", slug: "sport" },
      { name: "Formation professionnelle", slug: "formation-professionnelle" }
    ]
  },
  // Nouveaux secteurs ajoutés
  {
    name: "Agriculture",
    slug: "agriculture",
    icon: "tractor",
    subcategories: [
      { name: "Maraîchage", slug: "maraichage" },
      { name: "Élevage", slug: "elevage" },
      { name: "Viticulture", slug: "viticulture" },
      { name: "Arboriculture", slug: "arboriculture" },
      { name: "Apiculture", slug: "apiculture" },
      { name: "Jardinage", slug: "jardinage" }
    ]
  },
  {
    name: "Musique & audio",
    slug: "musique-audio",
    icon: "music",
    subcategories: [
      { name: "Production musicale", slug: "production-musicale" },
      { name: "Mixage", slug: "mixage" },
      { name: "Mastering", slug: "mastering" },
      { name: "Composition", slug: "composition" },
      { name: "Enregistrement", slug: "enregistrement" },
      { name: "Sonorisation live", slug: "sonorisation-live" },
      { name: "Podcast", slug: "podcast" }
    ]
  },
  {
    name: "Mode & textile",
    slug: "mode-textile",
    icon: "shirt",
    subcategories: [
      { name: "Couture", slug: "couture" },
      { name: "Design de mode", slug: "design-mode" },
      { name: "Stylisme", slug: "stylisme" },
      { name: "Création textile", slug: "creation-textile" },
      { name: "Retouche", slug: "retouche" },
      { name: "Confection sur mesure", slug: "confection-mesure" }
    ]
  },
  {
    name: "Maison & jardin",
    slug: "maison-jardin",
    icon: "home",
    subcategories: [
      { name: "Aménagement intérieur", slug: "amenagement-interieur" },
      { name: "Décoration", slug: "decoration" },
      { name: "Paysagisme", slug: "paysagisme" },
      { name: "Entretien jardin", slug: "entretien-jardin" },
      { name: "Nettoyage maison", slug: "nettoyage-maison" },
      { name: "Organisation domicile", slug: "organisation-domicile" }
    ]
  },
  {
    name: "Sécurité",
    slug: "securite",
    icon: "shield",
    subcategories: [
      { name: "Gardiennage", slug: "gardiennage" },
      { name: "Sécurité privée", slug: "securite-privee" },
      { name: "Système d'alarme", slug: "systeme-alarme" },
      { name: "Vidéo surveillance", slug: "video-surveillance" },
      { name: "Contrôle d'accès", slug: "controle-acces" },
      { name: "Sécurité incendie", slug: "securite-incendie" }
    ]
  },
  {
    name: "Industrie",
    slug: "industrie",
    icon: "factory",
    subcategories: [
      { name: "Mécanique", slug: "mecanique" },
      { name: "Soudure", slug: "soudure" },
      { name: "Usinage", slug: "usinage" },
      { name: "Maintenance industrielle", slug: "maintenance-industrielle" },
      { name: "Logistique", slug: "logistique" },
      { name: "Production", slug: "production" }
    ]
  },
  {
    name: "Environnement",
    slug: "environnement",
    icon: "leaf",
    subcategories: [
      { name: "Gestion des déchets", slug: "gestion-dechets" },
      { name: "Recyclage", slug: "recyclage" },
      { name: "Énergies renouvelables", slug: "energies-renouvelables" },
      { name: "Assainissement", slug: "assainissement" },
      { name: "Dépollution", slug: "depollution" },
      { name: "Conseil environnement", slug: "conseil-environnement" }
    ]
  },
  {
    name: "Tourisme",
    slug: "tourisme",
    icon: "map",
    subcategories: [
      { name: "Guide touristique", slug: "guide-touristique" },
      { name: "Hébergement", slug: "hebergement" },
      { name: "Transport touristique", slug: "transport-touristique" },
      { name: "Animation touristique", slug: "animation-touristique" },
      { name: "Événements touristiques", slug: "evenements-touristiques" }
    ]
  },
  {
    name: "Immobilier",
    slug: "immobilier",
    icon: "building",
    subcategories: [
      { name: "Agence immobilière", slug: "agence-immobiliere" },
      { name: "Gestion locative", slug: "gestion-locative" },
      { name: "Estimation immobilière", slug: "estimation-immobiliere" },
      { name: "Syndic", slug: "syndic" },
      { name: "Home staging", slug: "home-staging" },
      { name: "Conseil immobilier", slug: "conseil-immobilier" }
    ]
  },
  {
    name: "Art & culture",
    slug: "art-culture",
    icon: "palette",
    subcategories: [
      { name: "Peinture", slug: "peinture-art" },
      { name: "Sculpture", slug: "sculpture" },
      { name: "Dessin", slug: "dessin" },
      { name: "Art numérique", slug: "art-numerique" },
      { name: "Artisanat d'art", slug: "artisanat-art" },
      { name: "Conservation restauration", slug: "conservation-restauration" }
    ]
  },
  {
    name: "Services aux entreprises",
    slug: "services-entreprises",
    icon: "briefcase",
    subcategories: [
      { name: "Comptabilité", slug: "comptabilite" },
      { name: "Paie", slug: "paie" },
      { name: "Juridique", slug: "juridique" },
      { name: "Assurance", slug: "assurance" },
      { name: "Communication", slug: "communication" },
      { name: "Traduction", slug: "traduction" },
      { name: "Secrétariat", slug: "secretariat" },
      { name: "Assistance virtuelle", slug: "assistance-virtuelle" }
    ]
  },
  {
    name: "Animaux",
    slug: "animaux",
    icon: "paw",
    subcategories: [
      { name: "Toilettage", slug: "toilettage" },
      { name: "Dressage", slug: "dressage" },
      { name: "Pension animaux", slug: "pension-animaux" },
      { name: "Garde animaux", slug: "garde-animaux" },
      { name: "Éducation canine", slug: "education-canine" },
      { name: "Soins vétérinaires", slug: "soins-veterinaires" }
    ]
  },
  {
    name: "Sport & loisirs",
    slug: "sport-loisirs",
    icon: "dumbbell",
    subcategories: [
      { name: "Fitness", slug: "fitness" },
      { name: "Yoga", slug: "yoga" },
      { name: "Arts martiaux", slug: "arts-martiaux" },
      { name: "Danse", slug: "danse" },
      { name: "Escalade", slug: "escalade" },
      { name: "Randonnée", slug: "randonnee" },
      { name: "Vélo", slug: "velo" },
      { name: "Natation", slug: "natation" }
    ]
  },
  {
    name: "Énergie",
    slug: "energie",
    icon: "zap",
    subcategories: [
      { name: "Installation solaire", slug: "installation-solaire" },
      { name: "Installation éolienne", slug: "installation-eolienne" },
      { name: "Chauffage", slug: "chauffage" },
      { name: "Plomberie chauffage", slug: "plomberie-chauffage" },
      { name: "Ventilation", slug: "ventilation" },
      { name: "Isolation thermique", slug: "isolation-thermique" }
    ]
  },
  {
    name: "Impression",
    slug: "impression",
    icon: "printer",
    subcategories: [
      { name: "Impression offset", slug: "impression-offset" },
      { name: "Impression numérique", slug: "impression-numerique" },
      { name: "Impression grand format", slug: "impression-grand-format" },
      { name: "Reliure", slug: "reliure" },
      { name: "Graphisme", slug: "graphisme" },
      { name: "PAO", slug: "pao" }
    ]
  },
  {
    name: "Télécom",
    slug: "telecom",
    icon: "phone",
    subcategories: [
      { name: "Installation téléphonique", slug: "installation-telephonique" },
      { name: "Installation fibre", slug: "installation-fibre" },
      { name: "Maintenance télécom", slug: "maintenance-telecom" },
      { name: "Réseaux télécom", slug: "reseaux-telecom" },
      { name: "VoIP", slug: "voip" }
    ]
  },
  {
    name: "Nettoyage",
    slug: "nettoyage",
    icon: "broom",
    subcategories: [
      { name: "Nettoyage bureaux", slug: "nettoyage-bureaux" },
      { name: "Nettoyage vitres", slug: "nettoyage-vitres" },
      { name: "Nettoyage industriel", slug: "nettoyage-industriel" },
      { name: "Désinfection", slug: "desinfection" },
      { name: "Nettoyage tapis", slug: "nettoyage-tapis" },
      { name: "Nettoyage façades", slug: "nettoyage-facades" }
    ]
  },
  {
    name: "Événementiel musical",
    slug: "evenementiel-musical",
    icon: "music",
    subcategories: [
      { name: "Concert", slug: "concert" },
      { name: "Festival", slug: "festival" },
      { name: "Production musicale", slug: "production-musicale-evenement" },
      { name: "Booking artistes", slug: "booking-artistes" },
      { name: "Gestion tournée", slug: "gestion-tournee" },
      { name: "Promotion musicale", slug: "promotion-musicale" }
    ]
  },
  {
    name: "Santé & bien-être",
    slug: "sante-bien-etre",
    icon: "heart",
    subcategories: [
      { name: "Ostéopathie", slug: "osteopathie" },
      { name: "Kinésithérapie", slug: "kinesitherapie" },
      { name: "Sophrologie", slug: "sophrologie" },
      { name: "Hypnose", slug: "hypnose" },
      { name: "Réflexologie", slug: "reflexologie" },
      { name: "Massage", slug: "massage" }
    ]
  },
  {
    name: "Transport & logistique",
    slug: "transport-logistique",
    icon: "truck",
    subcategories: [
      { name: "Déménagement", slug: "demenagement" },
      { name: "Transport de marchandises", slug: "transport-marchandises" },
      { name: "Livraison", slug: "livraison" },
      { name: "Logistique", slug: "logistique-transport" },
      { name: "Stockage", slug: "stockage" },
      { name: "Affrètement", slug: "affretement" }
    ]
  },
  {
    name: "Marketing & communication",
    slug: "marketing-communication",
    icon: "megaphone",
    subcategories: [
      { name: "Marketing digital", slug: "marketing-digital" },
      { name: "SEO", slug: "seo" },
      { name: "SEA", slug: "sea" },
      { name: "Social media", slug: "social-media" },
      { name: "Content marketing", slug: "content-marketing" },
      { name: "Email marketing", slug: "email-marketing" },
      { name: "Brand design", slug: "brand-design" }
    ]
  }
];

export type CategoryTaxonomy = typeof categoryTaxonomy;
