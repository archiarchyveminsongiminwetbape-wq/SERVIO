# Configuration Vercel pour SERVIO

## Étape 1 : Configurer les variables d'environnement sur Vercel

1. Allez sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionnez votre projet SERVIO
3. Cliquez sur **Settings** → **Environment Variables**
4. Ajoutez les variables suivantes :

| Nom | Valeur |
|-----|--------|
| `VITE_SUPABASE_URL` | Votre URL Supabase (ex: https://xyz.supabase.co) |
| `VITE_SUPABASE_ANON_KEY` | Votre clé anonyme Supabase |

**Pour obtenir ces valeurs :**
- Allez sur [Supabase Dashboard](https://supabase.com/dashboard)
- Sélectionnez votre projet
- Cliquez sur **Settings** → **API**
- Copiez l'URL et la clé "anon public"

## Étape 2 : Redéployer

1. Allez sur l'onglet **Deployments**
2. Cliquez sur **Redeploy** en haut à droite
3. Attendez que le déploiement se termine

## Étape 3 : Vérifier

Ouvrez https://servio-sooty.vercel.app/ et vérifiez que l'application se charge correctement.

## Si problème persiste

Consultez les logs de déploiement dans Vercel pour identifier l'erreur spécifique.
