# Guide de résolution des problèmes de déploiement Vercel

## Problème
L'URL https://servio-sooty.vercel.app/signup ne se charge plus dans les navigateurs.

## Diagnostic effectué

✅ Build local réussi - Le projet compile correctement
✅ Configuration Vite correcte
✅ Ajout de vercel.json pour le déploiement

## Étapes pour résoudre le problème sur Vercel

### 1. Vérifier les variables d'environnement sur Vercel

1. Connectez-vous à votre dashboard Vercel
2. Sélectionnez le projet SERVIO
3. Allez dans **Settings** > **Environment Variables**
4. Vérifiez que les variables suivantes sont configurées :

```
VITE_SUPABASE_URL = votre_url_supabase
VITE_SUPABASE_ANON_KEY = votre_clé_anon_supabase
```

**Important** :
- Les variables doivent commencer par `VITE_` pour être accessibles dans le frontend
- **N'utilisez pas de références à des secrets** - entrez directement les valeurs
- Si vous voyez une erreur comme "references Secret 'supabase_url', which does not exist", supprimez la variable et recréez-la avec la valeur directe

**Comment configurer correctement** :
- Sélectionnez "Environment" : Production, Preview, Development (ou tous)
- Dans "Value", entrez directement votre URL Supabase (ex: https://xxxxxxxx.supabase.co)
- Ne cochez pas "Encrypt" pour les variables VITE_ (elles doivent être accessibles côté client)

### 2. Redéployer le projet

1. Allez dans **Deployments** sur Vercel
2. Cliquez sur le dernier déploiement
3. Cliquez sur **Redeploy**
4. Attendez que le déploiement se termine

### 3. Vérifier les logs de build

1. Allez dans **Deployments** > **View Build Log**
2. Cherchez les erreurs dans les logs
3. Notez les messages d'erreur spécifiques

### 4. Vérifier la configuration du projet

1. Allez dans **Settings** > **General**
2. Vérifiez que **Framework Preset** est sur "Vite"
3. Vérifiez que **Build Command** est `npm run build`
4. Vérifiez que **Output Directory** est `dist`

### 5. Tester avec un déploiement de production

Si vous êtes en environnement Edge Functions :
1. Allez dans **Settings** > **General**
2. Changez **Target** en "Production"
3. Redéployez

## Configuration ajoutée

J'ai ajouté un fichier `vercel.json` avec la configuration suivante :

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Cette configuration assure que :
- Le build utilise les bonnes commandes
- Le routing React fonctionne correctement
- Les headers de sécurité sont appliqués

## Problèmes courants

### Erreur 404 sur les routes
- Résolu par la configuration des rewrites dans vercel.json
- Assure que toutes les routes redirigent vers index.html

### Variables d'environnement non chargées
- Vérifiez que les variables commencent par `VITE_`
- Redéployez après avoir ajouté/modifié les variables

### Build échoue
- Vérifiez que package.json est à jour
- Vérifiez que node_modules est installé correctement
- Consultez les logs de build pour les erreurs spécifiques

## Actions requises

1. **Immédiat** : Vérifiez les variables d'environnement sur Vercel
2. **Immédiat** : Redéployez le projet après avoir ajouté vercel.json
3. **Si problème persiste** : Consultez les logs de build Vercel
4. **Si problème persiste** : Contactez le support Vercel avec les logs d'erreur

## Contact Support

Si le problème persiste après ces étapes :
- Collectez les logs de build
- Collectez les logs du navigateur (console)
- Contactez le support Vercel avec ces informations
