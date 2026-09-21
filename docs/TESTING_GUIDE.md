# Guide de Test Complet - Système d'Escrow SERVIO

## 🎯 Objectif du Guide

Ce guide vous permettra de tester l'ensemble du système d'escrow, de la configuration à l'exécution complète d'un paiement sécurisé.

## 📋 Prérequis

### 1. Configuration de Base

- ✅ **Migrations SQL appliquées** (5 fichiers exécutés avec succès)
- ✅ **Variables d'environnement configurées**
- ✅ **Serveur de développement en cours** (`npm run dev`)
- ✅ **Compte admin créé** dans Supabase

### 2. Vérification des Prérequis

```bash
# Vérifier que le serveur tourne
curl http://localhost:3000

# Vérifier les variables d'environnement
cat .env | grep FLUTTERWAVE
cat .env | grep SUPABASE

# Vérifier les migrations via script
npx tsx scripts/apply-escrow-migration.ts
```

## 🧪 Scénario de Test Complet

### Scénario 1: Configuration Initiale

#### Étape 1.1: Créer un compte admin

```sql
-- Via Supabase SQL Editor
INSERT INTO public.profiles (id, email, full_name, role)
VALUES (
  gen_random_uuid(),
  'admin@servio.com',
  'Admin SERVIO',
  'admin'
);
```

#### Étape 1.2: Créer un compte client de test

```sql
-- Via Supabase SQL Editor
INSERT INTO public.profiles (id, email, full_name, role)
VALUES (
  gen_random_uuid(),
  'client@test.com',
  'Client Test',
  'user'
);
```

#### Étape 1.3: Créer un compte prestataire de test

```sql
-- Via Supabase SQL Editor
INSERT INTO public.profiles (id, email, full_name, role)
VALUES (
  gen_random_uuid(),
  'provider@test.com',
  'Provider Test',
  'user'
);

-- Créer le profil prestataire
INSERT INTO public.provider_profiles (id, user_id, business_name, slug)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.profiles WHERE email = 'provider@test.com'),
  'Test Business',
  'test-business'
);
```

### Scénario 2: Configuration des Comptes

#### Étape 2.1: Configurer le compte bancaire du prestataire

1. Connectez-vous en tant que prestataire
2. Accédez à son dashboard
3. Naviguez vers la section "Comptes Bancaires"
4. Ajoutez un compte Orange Money de test:
   - Type: Mobile Money
   - Fournisseur: Orange Money
   - Numéro: +237123456789
   - Nom: Test Provider
   - Devise: XAF
   - Pays: Cameroun

#### Étape 2.2: Soumettre des certifications

1. Accédez à la section "Certifications"
2. Soumettez une certification d'identité:
   ```json
   {
     "document_type": "carte_identite",
     "document_number": "123456789",
     "document_url": "https://example.com/cni.jpg"
   }
   ```

### Scénario 3: Création d'un Booking

#### Étape 3.1: Créer un booking de test

```sql
-- Via Supabase SQL Editor
INSERT INTO public.bookings (
  id,
  client_id,
  provider_id,
  service_type,
  scheduled_at,
  duration_minutes,
  location_type,
  status,
  price,
  currency
)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.profiles WHERE email = 'client@test.com'),
  (SELECT id FROM public.provider_profiles WHERE business_name = 'Test Business'),
  'Service Test',
  NOW() + INTERVAL '1 day',
  60,
  'remote',
  'pending',
  50000,
  'XAF'
);
```

### Scénario 4: Paiement et Escrow

#### Étape 4.1: Simuler un paiement Flutterwave

**Option A: Via l'interface utilisateur**
1. Connectez-vous en tant que client
2. Accédez à la page de booking
3. Initiez un paiement avec Orange Money
4. Simulez un paiement réussi

**Option B: Via API directe**
```bash
# Simuler un webhook Flutterwave
curl -X POST http://localhost:3000/api/webhooks/flutterwave \
  -H "Content-Type: application/json" \
  -H "verif-hash: votre_secret_hash" \
  -d '{
    "event": "charge.completed",
    "data": {
      "tx_ref": "TEST-'$(date +%s)'",
      "amount": "50000",
      "currency": "XAF",
      "id": "test-payment-'$(date +%s)'",
      "flw_ref": "FLW-TEST-'$(date +%s)'",
      "customer": {
        "email": "client@test.com",
        "name": "Client Test",
        "phone": "+237123456789"
      },
      "payment_type": "orange_money",
      "meta": {
        "booking_id": "votre_booking_id",
        "user_id": "votre_client_id"
      }
    }
  }'
```

#### Étape 4.2: Vérifier la création de l'escrow

```sql
-- Vérifier que l'escrow account a été créé
SELECT * FROM public.escrow_accounts 
WHERE booking_id = 'votre_booking_id';

-- Vérifier que les milestones ont été créés
SELECT * FROM public.milestones 
WHERE escrow_id = (SELECT id FROM public.escrow_accounts WHERE booking_id = 'votre_booking_id');
```

**Résultat attendu:**
- ✅ 1 escrow account créé avec status 'funded'
- ✅ 3 milestones créés (30%, 40%, 30%)
- ✅ Payment status = 'in_escrow'

### Scénario 5: Workflow du Prestataire

#### Étape 5.1: Prestataire soumet un milestone

1. Connectez-vous en tant que prestataire
2. Accédez au composant `MilestoneSubmission`
3. Sélectionnez le premier milestone (30%)
4. Uploadez des preuves de travail (images/documents)
5. Ajoutez des notes décrivant le travail accompli
6. Soumettez le milestone

#### Étape 5.2: Vérifier le statut du milestone

```sql
-- Vérifier que le milestone est en statut 'completed'
SELECT * FROM public.milestones 
WHERE id = 'votre_milestone_id';
```

**Résultat attendu:**
- ✅ Milestone status = 'completed'
- ✅ evidence_urls contient les URLs des fichiers uploadés
- ✅ completed_at est renseigné

### Scénario 6: Workflow Admin

#### Étape 6.1: Admin review le milestone

1. Connectez-vous en tant qu'admin
2. Accédez à `/admin/escrow`
3. Allez dans l'onglet "Jalons en Attente"
4. Review les preuves soumises
5. Approuvez le milestone

#### Étape 6.2: Admin libère les fonds

1. Dans le même dashboard admin
2. Cliquez sur "Libérer Fonds" pour le milestone approuvé
3. Confirmez la libération

#### Étape 6.3: Vérifier la libération des fonds

```sql
-- Vérifier l'état de l'escrow
SELECT * FROM public.escrow_accounts 
WHERE id = 'votre_escrow_id';

-- Vérifier le milestone
SELECT * FROM public.milestones 
WHERE id = 'votre_milestone_id';

-- Vérifier le transfert
SELECT * FROM public.transfer_transactions 
WHERE milestone_id = 'votre_milestone_id';
```

**Résultat attendu:**
- ✅ Escrow status = 'partially_released'
- ✅ Escrow release_percentage = 30
- ✅ Escrow amount_released = 15000 XAF
- ✅ Milestone status = 'paid'
- ✅ Transfer transaction créé avec status 'processing' ou 'completed'

### Scénario 7: Certification du Compte

#### Étape 7.1: Admin approuve la certification

1. Connectez-vous en tant qu'admin
2. Accédez à `/admin/escrow`
3. Allez dans l'onglet "Certifications"
4. Review la certification soumise
5. Approuvez la certification

#### Étape 7.2: Vérifier le niveau de certification

```sql
-- Vérifier le niveau de certification du profil
SELECT is_certified, certification_level, certification_date 
FROM public.profiles 
WHERE id = 'votre_user_id';

-- Vérifier le score de certification
SELECT verification_score 
FROM public.account_certifications 
WHERE user_id = 'votre_user_id';
```

**Résultat attendu:**
- ✅ is_certified = true
- ✅ certification_level = 'basic' (au minimum)
- ✅ verification_score > 0

### Scénario 8: Workflow Complet

#### Étape 8.1: Répéter pour les autres milestones

1. Prestataire soumet le 2ème milestone (40%)
2. Admin approuve et libère les fonds
3. Prestataire soumet le 3ème milestone (30%)
4. Admin approuve et libère les fonds

#### Étape 8.2: Vérifier l'état final

```sql
-- Escrow final
SELECT * FROM public.escrow_accounts 
WHERE id = 'votre_escrow_id';

-- Résultat attendu:
-- status = 'fully_released'
-- release_percentage = 100
-- amount_released = 50000
-- amount_remaining = 0
```

## 🔍 Points de Vérification

### Base de Données

```sql
-- Tables à vérifier
SELECT COUNT(*) FROM public.escrow_accounts;
SELECT COUNT(*) FROM public.milestones;
SELECT COUNT(*) FROM public.account_certifications;
SELECT COUNT(*) FROM public.provider_bank_accounts;
SELECT COUNT(*) FROM public.transfer_transactions;

-- Statuts des transactions
SELECT status, COUNT(*) FROM public.payments GROUP BY status;
SELECT status, COUNT(*) FROM public.escrow_accounts GROUP BY status;
SELECT status, COUNT(*) FROM public.milestones GROUP BY status;
```

### Interface Utilisateur

- ✅ Dashboard admin accessible à `/admin/escrow`
- ✅ Composant de soumission de jalons fonctionnel
- ✅ Configuration des comptes bancaires opérationnelle
- ✅ Soumission de certifications fonctionnelle

### API Endpoints

```bash
# Tester les endpoints
curl http://localhost:3000/api/admin/approve-milestone
curl http://localhost:3000/api/admin/release-escrow-funds
curl http://localhost:3000/api/certifications/submit
curl http://localhost:3000/api/milestones/submit
```

## 🐛 Dépannage

### Problèmes Courants

**1. Escrow account non créé après paiement**
- Vérifiez que le webhook Flutterwave fonctionne
- Vérifiez que le trigger `create_escrow_after_payment` est actif
- Vérifiez le statut du payment dans la table `payments`

**2. Milestones non créés automatiquement**
- Vérifiez que la fonction `create_escrow_after_payment` existe
- Vérifiez les logs du serveur pour les erreurs

**3. Transfert automatique échoué**
- Vérifiez que le compte bancaire du prestataire est vérifié
- Vérifiez les clés API Flutterwave
- Vérifiez les logs pour les erreurs Flutterwave

**4. Upload de fichiers échoué**
- Vérifiez que le bucket `evidence` existe dans Supabase Storage
- Vérifiez les permissions RLS du bucket
- Vérifiez la taille des fichiers (max 10MB)

## 📊 Checklist de Validation

- [ ] Migrations SQL appliquées avec succès
- [ ] Variables d'environnement configurées
- [ ] Dashboard admin accessible
- [ ] Compte admin fonctionnel
- [ ] Comptes de test créés
- [ ] Paiement simulé fonctionne
- [ ] Escrow account créé automatiquement
- [ ] Milestones créés automatiquement
- [ ] Soumission de jalons fonctionne
- [ ] Review admin fonctionne
- [ ] Libération de fonds fonctionne
- [ ] Transfert automatique initié
- [ ] Certifications fonctionnelles
- [ ] Niveaux de certification calculés
- [ ] Notifications envoyées

## 🎉 Succès!

Si tous les scénarios de test passent avec succès, votre système d'escrow est **100% opérationnel** et prêt pour la production!

### Prochaines étapes en production:

1. **Configurer le webhook Flutterwave** avec l'URL de production
2. **Utiliser les clés API Flutterwave de production**
3. **Activer le bucket storage en production**
4. **Configurer les notifications email/SMS**
5. **Surveiller les transactions** avec des alertes
6. **Configurer les backups** de la base de données

## 📞 Support

En cas de problème:
- Consultez la documentation technique: `docs/ESCROW_SYSTEM_GUIDE.md`
- Vérifiez les logs du serveur
- Consultez les tables de la base de données
- Contactez le support technique
