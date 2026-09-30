# Guide de Déploiement - SERVIO

Ce guide explique comment déployer SERVIO en production sur Vercel.

## 🚀 Déploiement sur Vercel

### Prérequis

- Compte Vercel (gratuit)
- Repository GitHub
- Variables d'environnement configurées

### Étape 1: Connecter le repository à Vercel

1. Connectez-vous à [vercel.com](https://vercel.com)
2. Cliquez sur "Add New Project"
3. Importez votre repository GitHub
4. Sélectionnez le repository SERVIO

### Étape 2: Configurer le projet

**Framework Preset**: Vite

**Build Command**:
```
npm run build
```

**Output Directory**:
```
dist
```

### Étape 3: Configurer les variables d'environnement

Ajoutez ces variables dans les settings du projet Vercel :

```env
VITE_SUPABASE_URL=https://your-production-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key
FLUTTERWAVE_PUBLIC_KEY=your-production-public-key
FLUTTERWAVE_SECRET_KEY=your-production-secret-key
FLUTTERWAVE_ENCRYPTION_KEY=your-production-encryption-key
APP_URL=https://your-domain.vercel.app
```

### Étape 4: Déployer

Cliquez sur "Deploy". Vercel construira et déploiera automatiquement votre application.

### Étape 5: Configurer le domaine personnalisé (optionnel)

1. Allez dans Settings > Domains
2. Ajoutez votre domaine personnalisé
3. Configurez les DNS selon les instructions Vercel

## 🗄️ Configuration Supabase Production

### 1. Créer un projet Supabase de production

1. Connectez-vous à Supabase
2. Créez un nouveau projet "SERVIO Production"
3. Attendez que le projet soit prêt (environ 2 minutes)

### 2. Appliquer les migrations

```bash
npx supabase link --project-ref production-project-id
npx supabase db push
```

### 3. Configurer RLS

Les politiques RLS sont déjà définies dans les migrations. Vérifiez qu'elles sont actives dans le dashboard Supabase.

### 4. Configurer Storage

Créez les buckets nécessaires :
- `uploads` - pour les images de profil
- `portfolios` - pour les images de portfolio
- `documents` - pour les documents de certification

### 5. Configurer Auth

Activez les providers d'authentification nécessaires :
- Email/Password
- Google (optionnel)
- Facebook (optionnel)

## 💳 Configuration Flutterwave Production

### 1. Utiliser l'environnement de production

1. Connectez-vous à Flutterwave
2. Allez dans Settings > API Keys
3. Utilisez les clés "Live" (pas les clés "Test")

### 2. Configurer les Webhooks

1. Dans Flutterwave, configurez le webhook URL :
   ```
   https://your-domain.vercel.app/api/webhooks/flutterwave
   ```

2. Sélectionnez les événements à écouter :
   - charge.success
   - charge.failed
   - transfer.success
   - transfer.failed

## 🔒 Sécurité en Production

### 1. Activer HTTPS

Vercel fournit automatiquement HTTPS avec des certificats SSL gratuits.

### 2. Configurer CORS

Dans Supabase, configurez les allowed origins :
```
https://your-domain.vercel.app
https://your-custom-domain.com
```

### 3. Activer les Security Headers

Ajoutez dans `vercel.json` :

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

## 📊 Monitoring

### 1. Vercel Analytics

Activé par défaut. Consultez les stats dans le dashboard Vercel.

### 2. Supabase Logs

Consultez les logs dans le dashboard Supabase > Database > Logs.

### 3. Error Tracking (Optionnel)

Intégrez Sentry pour le tracking d'erreurs :

```bash
npm install @sentry/react
```

Configurez dans votre code React.

## 🔄 CI/CD

Vercel gère automatiquement le CI/CD :
- À chaque push sur `main` : build et déploiement automatique
- À chaque pull request : preview deployment

## 📈 Performance

### 1. Optimisation du build

Le build Vite est déjà optimisé. Vérifiez que :
- Le mode production est activé
- Le code splitting fonctionne
- Les images sont optimisées

### 2. CDN

Vercel fournit un CDN global automatique.

### 3. Cache

Configurez le cache pour les assets statiques dans `vercel.json` :

```json
{
  "caching": {
    "maxAge": 31536000
  }
}
```

## 🧪 Tests avant déploiement

### Checklist

- [ ] Build local réussi (`npm run build`)
- [ ] Variables d'environnement configurées
- [ ] Migrations Supabase appliquées
- [ ] Tests manuels sur les fonctionnalités critiques
- [ ] Paiements testés en mode Sandbox
- [ ] RLS policies vérifiées
- [ ] Storage buckets créés
- [ ] Webhooks configurés

## 🐛 Gestion des erreurs en production

### 1. Logs

Consultez les logs dans :
- Vercel Dashboard > Logs
- Supabase Dashboard > Database > Logs

### 2. Rollback

Si un déploiement cause des problèmes :
1. Allez dans Vercel Dashboard > Deployments
2. Cliquez sur "Revert" sur le déploiement précédent

### 3. Maintenance Mode

Activez le mode maintenance dans les settings admin de l'application.

## 📞 Support en production

Contactez l'équipe technique :
- Email: tech@servio.com
- Téléphone: +237 657 029 080

## ✅ Checklist de déploiement

- [ ] Repository connecté à Vercel
- [ ] Variables d'environnement configurées
- [ ] Build configuration correcte
- [ ] Projet Supabase production créé
- [ ] Migrations appliquées
- [ ] Storage buckets créés
- [ ] Flutterwave configuré en mode Live
- [ ] Webhooks configurés
- [ ] HTTPS activé
- [ ] Domaine configuré
- [ ] Monitoring activé
- [ ] Tests effectués
- [ ] Rollback planifié

---

Votre application SERVIO est maintenant en production ! 🎉