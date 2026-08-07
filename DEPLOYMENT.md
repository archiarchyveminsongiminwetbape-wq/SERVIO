# Guide de Déploiement - SERVIO

Ce guide couvre le déploiement complet de l'application SERVIO sur Vercel avec Supabase comme backend.

## Prérequis

- Compte Supabase (https://supabase.com)
- Compte Vercel (https://vercel.com)
- Compte Stripe (https://stripe.com) pour les paiements
- Compte Resend (https://resend.com) pour les emails

## 1. Configuration Supabase

### 1.1 Créer un projet Supabase

1. Connectez-vous à [Supabase](https://supabase.com)
2. Cliquez sur "New Project"
3. Remplissez les informations:
   - Name: `servio`
   - Database Password: (générez un mot de passe fort)
   - Region: Choisissez la région la plus proche de vos utilisateurs
4. Attendez que le projet soit créé (2-3 minutes)

### 1.2 Appliquer les migrations

1. Allez dans le SQL Editor de votre projet Supabase
2. Exécutez les migrations dans l'ordre suivant:

```sql
-- 1. Core schema
-- Exécutez: supabase/migrations/20260729100711_servio_core_part1.sql
-- Exécutez: supabase/migrations/20260729100736_servio_core_part2.sql
-- Exécutez: supabase/migrations/20260729100908_servio_core_part3.sql

-- 2. Additional tables
-- Exécutez: supabase/migrations/create_categories_table.sql
-- Exécutez: supabase/migrations/create_portfolio.sql
-- Exécutez: supabase/migrations/create_reviews.sql
-- Exécutez: supabase/migrations/create_favorites.sql
-- Exécutez: supabase/migrations/create_messages.sql
-- Exécutez: supabase/migrations/create_notifications.sql
-- Exécutez: supabase/migrations/create_user_settings.sql
-- Exécutez: supabase/migrations/add_bookings.sql
-- Exécutez: supabase/migrations/add_payments.sql

-- 3. Storage buckets
-- Exécutez: supabase/migrations/create_profile_images_bucket.sql
-- Exécutez: supabase/migrations/create_portfolio_media_bucket.sql
-- Exécutez: supabase/migrations/20260804130000_add_portfolio_demo_videos_bucket.sql

-- 4. RLS policies and permissions
-- Exécutez: supabase/migrations/enable_rls_categories.sql
-- Exécutez: supabase/migrations/grant_permissions.sql
-- Exécutez: supabase/migrations/grant_anon_permissions.sql
-- Exécutez: supabase/migrations/fix_rls_policies.sql
-- Exécutez: supabase/migrations/fix_portfolio.sql
-- Exécutez: supabase/migrations/fix_messages.sql
-- Exécutez: supabase/migrations/fix_notifications.sql
-- Exécutez: supabase/migrations/fix_storage_rls.sql
-- Exécutez: supabase/migrations/fix_messaging_realtime.sql
-- Exécutez: supabase/migrations/update_portfolio_schema.sql
-- Exécutez: supabase/migrations/grant_portfolio_permissions.sql

-- 5. Performance indexes
-- Exécutez: supabase/migrations/add_performance_indexes.sql

-- 6. RPC functions
-- Exécutez: supabase/migrations/20260729102219_servio_add_increment_views_rpc.sql
-- Exécutez: supabase/migrations/20260729102508_servio_add_admin_stats_rpc.sql

-- 7. Triggers and additional features
-- Exécutez: supabase/migrations/create_profile_trigger.sql
-- Exécutez: supabase/migrations/20260804120000_add_profile_preferences.sql
-- Exécutez: supabase/migrations/20260729155052_servio_add_notifications.sql
-- Exécutez: supabase/migrations/alter_categories_table.sql
-- Exécutez: supabase/migrations/fix_admin_actions.sql
-- Exécutez: supabase/migrations/create_admin_user.sql
```

### 1.3 Configurer les Storage Buckets

1. Allez dans "Storage" dans votre dashboard Supabase
2. Vérifiez que les buckets suivants existent:
   - `profile-images` (public)
   - `portfolio-media` (public)
   - `portfolio-demo-videos` (public)

### 1.4 Obtenir les clés API

1. Allez dans "Settings" > "API"
2. Copiez les valeurs suivantes:
   - Project URL
   - anon/public key
   - service_role key (garder secret)

## 2. Configuration Stripe

### 2.1 Créer un compte Stripe

1. Connectez-vous à [Stripe](https://stripe.com)
2. Allez dans "Developers" > "API keys"
3. Copiez:
   - Publishable key
   - Secret key

### 2.2 Configurer le Webhook

1. Allez dans "Developers" > "Webhooks"
2. Cliquez sur "Add endpoint"
3. URL: `https://your-project.supabase.co/functions/v1/stripe-webhook`
4. Sélectionnez les événements:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copiez le "Signing Secret" (webhook secret)

## 3. Configuration Resend (Emails)

### 3.1 Créer un compte Resend

1. Connectez-vous à [Resend](https://resend.com)
2. Allez dans "API Keys"
3. Créez une nouvelle API key
4. Copiez la clé

### 3.2 Configurer le domaine d'envoi

1. Allez dans "Domains"
2. Ajoutez votre domaine ou utilisez le domaine par défaut de Resend
3. Vérifiez le domaine si nécessaire

## 4. Configuration Vercel

### 4.1 Créer un projet Vercel

1. Connectez-vous à [Vercel](https://vercel.com)
2. Cliquez sur "Add New" > "Project"
3. Importez votre repository GitHub

### 4.2 Configurer les variables d'environnement

Dans les settings du projet Vercel, ajoutez les variables suivantes:

```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key
STRIPE_SECRET_KEY=sk_live_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Email (Resend)
RESEND_API_KEY=re_your_resend_api_key

# Application
VITE_APP_URL=https://your-app.vercel.app
VITE_APP_NAME=SERVIO
```

### 4.3 Configurer les Edge Functions Supabase

Pour que les Edge Functions fonctionnent correctement, vous devez configurer les secrets dans Supabase:

1. Allez dans votre projet Supabase
2. Cliquez sur "Edge Functions"
3. Cliquez sur "Secrets"
4. Ajoutez les secrets suivants:

```bash
STRIPE_SECRET_KEY=sk_live_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
RESEND_API_KEY=re_your_resend_api_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4.4 Déployer

1. Cliquez sur "Deploy" dans Vercel
2. Attendez que le déploiement soit terminé
3. Votre application sera disponible à l'URL fournie

## 5. Configuration Post-Déploiement

### 5.1 Mettre à jour le Webhook Stripe

1. Une fois l'application déployée, mettez à jour l'URL du webhook Stripe:
   - URL: `https://your-app.vercel.app/api/stripe-webhook`
   - Ou utilisez l'URL Supabase: `https://your-project.supabase.co/functions/v1/stripe-webhook`

### 5.2 Créer un utilisateur admin

Exécutez la migration `create_admin_user.sql` dans le SQL Editor Supabase pour créer le premier utilisateur admin.

### 5.3 Tester l'application

1. Testez l'inscription/connexion
2. Testez la création de profil prestataire
3. Testez l'ajout de portfolio items
4. Testez le système de réservation (si Stripe est configuré)
5. Testez la messagerie
6. Testez les notifications

## 6. Maintenance

### 6.1 Sauvegardes

Supabase effectue des sauvegardes automatiques quotidiennes. Vous pouvez également:
- Activer les "Point-in-Time Recovery" pour une récupération plus précise
- Exporter régulièrement les données via pg_dump

### 6.2 Monitoring

- Surveillez les logs Supabase Edge Functions
- Surveillez les erreurs dans Vercel
- Configurez des alertes pour les erreurs critiques

### 6.3 Mises à jour

Pour appliquer de nouvelles migrations:
1. Ajoutez le fichier SQL dans `supabase/migrations/`
2. Exécutez-le dans le SQL Editor Supabase
3. Redéployez sur Vercel si nécessaire

## 7. Sécurité

### 7.1 Variables d'environnement

- Ne commettez jamais les clés secrètes dans Git
- Utilisez des clés différentes pour développement et production
- Faites pivoter les clés régulièrement

### 7.2 RLS Policies

- Vérifiez que toutes les tables ont RLS activé
- Testez les politiques avec différents rôles utilisateur
- Surveillez les logs pour les erreurs de permission

### 7.3 Rate Limiting

- Configurez des limites de taux dans Supabase
- Utilisez des middleware pour limiter les requêtes API

## 8. Dépannage

### Erreurs courantes

**Erreur 403 Forbidden:**
- Vérifiez que les migrations RLS sont appliquées
- Vérifiez que l'utilisateur est authentifié
- Vérifiez les politiques RLS dans Supabase

**Erreur de paiement Stripe:**
- Vérifiez que les clés Stripe sont correctes
- Vérifiez que le webhook est configuré
- Vérifiez les logs Edge Functions

**Emails non envoyés:**
- Vérifiez que la clé API Resend est configurée
- Vérifiez que le domaine Resend est vérifié
- Vérifiez les logs Edge Functions

## 9. Support

Pour toute question ou problème:
- Documentation Supabase: https://supabase.com/docs
- Documentation Vercel: https://vercel.com/docs
- Documentation Stripe: https://stripe.com/docs
- Documentation Resend: https://resend.com/docs
