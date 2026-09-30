# Guide d'Installation - SERVIO

Ce guide vous accompagne pas à pas dans l'installation et la configuration de SERVIO sur votre environnement local.

## 📋 Table des matières

1. [Prérequis](#prérequis)
2. [Installation](#installation)
3. [Configuration Supabase](#configuration-supabase)
4. [Configuration Flutterwave](#configuration-flutterwave)
5. [Lancement](#lancement)
6. [Dépannage](#dépannage)

## 📦 Prérequis

### Logiciels requis

- **Node.js** 18.0 ou supérieur
  - Téléchargez sur [nodejs.org](https://nodejs.org/)
  - Vérifiez avec `node --version`

- **npm** ou **yarn**
  - npm est inclus avec Node.js
  - Vérifiez avec `npm --version`

- **Git**
  - Téléchargez sur [git-scm.com](https://git-scm.com/)
  - Vérifiez avec `git --version`

### Comptes requis

- **Compte Supabase** (gratuit)
  - Créez un compte sur [supabase.com](https://supabase.com)
  - Créez un nouveau projet

- **Compte Flutterwave** (optionnel pour paiements)
  - Créez un compte sur [flutterwave.com](https://flutterwave.com)
  - Obtenez vos clés API

## 🔧 Installation

### 1. Cloner le repository

```bash
git clone https://github.com/archiarchyveminsongiminwetbape-wq/SERVIO.git
cd SERVIO
```

### 2. Installer les dépendances

```bash
npm install
```

Cela peut prendre quelques minutes la première fois.

### 3. Créer le fichier .env

```bash
cp .env.example .env
```

Ouvrez `.env` dans votre éditeur de texte et configurez les variables.

## 🗄️ Configuration Supabase

### 1. Obtenir les credentials Supabase

1. Connectez-vous à votre compte Supabase
2. Sélectionnez votre projet
3. Allez dans **Settings** > **API**
4. Copiez les informations suivantes :
   - Project URL
   - anon public key

### 2. Configurer les variables d'environnement

Ajoutez ces variables dans votre fichier `.env` :

```env
VITE_SUPABASE_URL=https://votre_project_id.supabase.co
VITE_SUPABASE_ANON_KEY=votre_anon_key
```

### 3. Installer Supabase CLI

```bash
npm install -g supabase
```

### 4. Connecter le projet local

```bash
npx supabase login
npx supabase link --project-ref votre_project_id
```

Le `project_ref` se trouve dans l'URL de votre projet Supabase.

### 5. Appliquer les migrations

```bash
npx supabase db push
```

Cela va créer toutes les tables et structures nécessaires dans votre base de données.

### 6. Créer un utilisateur admin

Une fois les migrations appliquées, connectez-vous à votre base de données via le dashboard Supabase et exécutez :

```sql
-- Créer un utilisateur admin
INSERT INTO profiles (id, email, full_name, role)
VALUES (
  gen_random_uuid(),
  'admin@servio.com',
  'Administrateur',
  'admin'
);
```

## 💳 Configuration Flutterwave (Optionnel)

### 1. Obtenir les clés Flutterwave

1. Connectez-vous à votre compte Flutterwave
2. Allez dans **Settings** > **API Keys**
3. Copiez les clés suivantes :
   - Public Key
   - Secret Key
   - Encryption Key

### 2. Configurer les variables d'environnement

Ajoutez ces variables dans votre fichier `.env` :

```env
FLUTTERWAVE_PUBLIC_KEY=votre_public_key
FLUTTERWAVE_SECRET_KEY=votre_secret_key
FLUTTERWAVE_ENCRYPTION_KEY=votre_encryption_key
```

### 3. Configurer l'URL de l'application

```env
APP_URL=http://localhost:5173
```

Pour la production, remplacez par votre URL de production.

## 🚀 Lancement

### Mode développement

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

### Mode production

```bash
npm run build
npm run preview
```

Le build sera accessible sur `http://localhost:4173`

## 🔑 Première connexion

### 1. Créer un compte admin

1. Allez sur `http://localhost:5173/signup`
2. Créez un compte avec l'email que vous avez utilisé dans la base de données
3. Une fois connecté, vous devrez mettre à jour manuellement le rôle dans Supabase :

```sql
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'votre_email';
```

### 2. Accéder au tableau de bord admin

1. Connectez-vous avec votre compte admin
2. Allez sur `http://localhost:5173/admin`
3. Vous accéderez au tableau de bord administrateur

## 🐛 Dépannage

### Erreur "Module not found"

```bash
rm -rf node_modules package-lock.json
npm install
```

### Erreur de connexion Supabase

- Vérifiez que vos credentials dans `.env` sont corrects
- Assurez-vous que votre projet Supabase est actif
- Vérifiez votre connexion internet

### Erreur de migration

```bash
npx supabase db reset
npx supabase db push
```

### Port déjà utilisé

```bash
npm run dev -- --port 3000
```

Ou modifiez le port dans `vite.config.ts`

### Erreur TypeScript

```bash
npm run typecheck
```

Cela identifiera les erreurs de type.

## 📚 Ressources utiles

- [Documentation Supabase](https://supabase.com/docs)
- [Documentation Flutterwave](https://developer.flutterwave.com/docs)
- [Documentation React](https://react.dev)
- [Documentation Vite](https://vitejs.dev)

## 🆘 Support

Si vous rencontrez des problèmes :

1. Consultez ce guide de dépannage
2. Vérifiez les fichiers de documentation dans le dossier `docs/`
3. Contactez l'équipe : contact@servio.com

## ✅ Checklist d'installation

- [ ] Node.js installé (18+)
- [ ] Git installé
- [ ] Repository cloné
- [ ] Dépendances installées
- [ ] Fichier .env créé
- [ ] Compte Supabase créé
- [ ] Projet Supabase lié
- [ ] Migrations appliquées
- [ ] Utilisateur admin créé
- [ ] Application lancée avec succès

## 🎉 Prochaine étape

Une fois l'installation terminée, consultez le [README.md](README.md) pour comprendre les fonctionnalités de la plateforme.

---

Bon développement avec SERVIO ! 🚀