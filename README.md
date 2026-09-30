# SERVIO - Plateforme de mise en relation prestataires-clients

SERVIO est une plateforme moderne de mise en relation entre prestataires de services et clients, avec un système de réservation en ligne, paiement sécurisé via escrow, et gestion administrative complète.

## 🌟 Fonctionnalités principales

### Pour les clients
- **Recherche avancée** de prestataires par catégorie, localisation, prix
- **Profils détaillés** avec portfolios, certifications et avis
- **Réservation en ligne** avec sélection de créneaux horaires
- **Paiement sécurisé** via Flutterwave (Carte, Orange Money, MTN Money)
- **Suivi de réservations** en temps réel
- **Système d'avis** et recommandations

### Pour les prestataires
- **Profil professionnel** personnalisable
- **Portfolio** avec projets et réalisations
- **Gestion des disponibilités** (calendrier interactif)
- **Tableau de bord** avec statistiques et analytics
- **Système de réservations** automatisé
- **Paiements sécurisés** via escrow
- **Certifications** et badges de confiance

### Pour les administrateurs
- **Tableau de bord complet** avec 13 sections de gestion
- **Gestion des utilisateurs** (rôles, bannissement, certification)
- **Validation des prestataires**
- **Gestion des réservations** et paiements
- **Système escrow** pour sécurisation des fonds
- **Modération des avis**
- **Rapports financiers** et analytics
- **Configuration plateforme**

## 🚀 Stack technique

### Frontend
- **React 18.3.1** avec TypeScript
- **Vite 5.4.2** pour le build
- **React Router 6.26.2** pour la navigation
- **Tailwind CSS 3.4.1** pour le styling
- **Lucide React** pour les icônes

### Backend
- **Supabase** (PostgreSQL + Auth + Storage + Realtime)
- **Row Level Security (RLS)** pour la sécurité
- **Functions PostgreSQL** pour la logique métier
- **Webhooks** pour les événements

### Paiements
- **Flutterwave** pour les paiements en ligne
- **Orange Money** et **MTN Money** pour les paiements mobiles
- **Système Escrow** pour sécurisation des fonds

### Autres
- **jsPDF** pour la génération de PDF
- **html2canvas** pour les captures d'écran
- **AI Chatbot** intégré avec HuggingFace

## 📋 Prérequis

- Node.js 18+ 
- npm ou yarn
- Compte Supabase
- Compte Flutterwave (optionnel pour paiements)

## 🔧 Installation

1. **Cloner le repository**
```bash
git clone https://github.com/archiarchyveminsongiminwetbape-wq/SERVIO.git
cd SERVIO
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer les variables d'environnement**
```bash
cp .env.example .env
```

Éditez `.env` avec vos credentials :
```env
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_ANON_KEY=votre_key_anon_supabase
FLUTTERWAVE_PUBLIC_KEY=votre_key_flutterwave
FLUTTERWAVE_SECRET_KEY=votre_secret_flutterwave
FLUTTERWAVE_ENCRYPTION_KEY=votre_key_encryption
APP_URL=http://localhost:5173
```

4. **Configurer Supabase**
```bash
npx supabase login
npx supabase link --project-ref votre_project_id
npx supabase db push
```

5. **Lancer le développement**
```bash
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

## 📁 Structure du projet

```
SERVIO/
├── src/
│   ├── components/       # Composants React
│   │   ├── admin/       # Composants admin
│   │   ├── ui/          # Composants UI réutilisables
│   │   └── ...
│   ├── context/         # Contextes React
│   ├── data/            # Données statiques
│   ├── lib/             # Utilitaires
│   ├── pages/           # Pages de l'application
│   └── App.tsx          # Composant principal
├── supabase/
│   └── migrations/      # Migrations base de données
├── public/              # Assets statiques
└── docs/                # Documentation
```

## 🎯 Scripts disponibles

```bash
npm run dev          # Lancer le serveur de développement
npm run build        # Build pour production
npm run preview      # Preview du build de production
npm run lint         # Linter le code
npm run typecheck    # Vérifier les types TypeScript
```

## 🔐 Sécurité

- **Row Level Security (RLS)** activé sur toutes les tables
- **Authentification** via Supabase Auth
- **Paiements sécurisés** via Flutterwave
- **Escrow** pour protection des fonds
- **Validation** des prestataires par admin

## 📊 Base de données

Le projet utilise Supabase avec les tables principales suivantes :
- `profiles` - Profils utilisateurs
- `provider_profiles` - Profils prestataires
- `bookings` - Réservations
- `payments` - Paiements
- `escrow_accounts` - Comptes escrow
- `manual_payments` - Paiements manuels
- `reviews` - Avis clients
- `categories` - Catégories de services
- `certifications` - Certifications prestataires

## 🚢 Déploiement

### Vercel (recommandé)

1. Connecter le repository GitHub à Vercel
2. Configurer les variables d'environnement
3. Deploy automatique

Variables d'environnement Vercel :
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
FLUTTERWAVE_PUBLIC_KEY
FLUTTERWAVE_SECRET_KEY
FLUTTERWAVE_ENCRYPTION_KEY
APP_URL
```

## 📝 Guide utilisateur

### Pour les clients
1. Créer un compte ou se connecter
2. Rechercher un prestataire par catégorie ou mot-clé
3. Consulter le profil et les avis
4. Sélectionner un créneau disponible
5. Choisir le type de service et la durée
6. Valider le devis et payer
7. Suivre la réservation et noter le prestataire

### Pour les prestataires
1. Créer un compte prestataire
2. Compléter le profil (informations, portfolio, certifications)
3. Définir les disponibilités
4. Attendre la validation par l'admin
5. Recevoir et gérer les réservations
6. Effectuer le service
7. Recevoir le paiement après validation

## 🛠️ Administration

Accédez au tableau de bord admin avec un compte utilisateur ayant le rôle `admin` :
- Gestion des utilisateurs et prestataires
- Validation des profils
- Gestion des réservations et paiements
- Administration escrow
- Modération des avis
- Configuration plateforme

## 🐛 Dépannage

### Erreurs courantes

**Problème de connexion Supabase**
- Vérifiez vos credentials dans `.env`
- Assurez-vous que le projet Supabase est actif

**Paiements non fonctionnels**
- Vérifiez vos clés Flutterwave
- Assurez-vous que les webhooks sont configurés

**Migrations non appliquées**
```bash
npx supabase db push
```

## 📄 Licence

Ce projet est propriétaire. Tous droits réservés.

## 👥 Équipe

SERVIO - Plateforme de services professionnels

## 📞 Support

- Email: contact@servio.com
- Téléphone: +237 657 029 080 / +237 620 972 579

## 🔄 Version

Version: 1.0.0
Dernière mise à jour: Septembre 2026

---

**Note**: Ce projet est en développement actif. Certaines fonctionnalités peuvent encore être en cours d'implémentation.