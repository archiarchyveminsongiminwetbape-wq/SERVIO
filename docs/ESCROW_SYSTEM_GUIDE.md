# Guide Complet du Système d'Escrow SERVIO

## 🎯 Vue d'ensemble

Le système d'escrow SERVIO permet de:
- **Bloquer les fonds** des clients jusqu'à validation du travail
- **Certifier les comptes** utilisateurs pour plus de confiance
- **Payer progressivement** via des jalons (milestones)
- **Utiliser Orange Money** comme méthode de paiement prioritaire
- **Virements automatiques** vers les comptes des prestataires

## 📋 Étapes d'Installation

### 1. Appliquer les migrations SQL

```bash
# Exécutez le script pour voir les instructions
npx tsx scripts/apply-escrow-migration.ts

# Ou appliquez manuellement les fichiers dans l'ordre suivant:
# Allez sur https://app.supabase.com > SQL Editor
# Exécutez chaque fichier séparément:

1. supabase/migrations/escrow_part1_tables.sql       # Création des tables
2. supabase/migrations/escrow_part2_policies.sql     # Politiques RLS
3. supabase/migrations/escrow_part3_functions.sql    # Fonctions et triggers
4. supabase/migrations/create_evidence_storage.sql   # Stockage des preuves
5. supabase/migrations/add_provider_bank_accounts.sql # Comptes bancaires
```

### 2. Configurer les variables d'environnement

Ajoutez à votre fichier `.env`:

```env
# Flutterwave Configuration
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-XXXXXXXXXXXXXXXXXXXXX
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-XXXXXXXXXXXXXXXXXXXXX
FLUTTERWAVE_ENCRYPTION_KEY=FLWSECK_TESTXXXXXXXXXXXXXXXXXXXXX
FLUTTERWAVE_SECRET_HASH=your_secret_hash_here

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Application URL (pour les webhooks)
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 3. Configurer le webhook Flutterwave

1. Allez sur https://dashboard.flutterwave.com
2. Settings > Webhooks > Add New Webhook
3. URL: `https://your-domain.com/api/webhooks/flutterwave`
4. Événements: `charge.completed`, `charge.failed`, `transfer.completed`
5. Copiez le Secret Hash et ajoutez-le aux variables d'environnement

Voir `scripts/setup-flutterwave-webhook.md` pour plus de détails.

### 4. Tester le système

```bash
# Démarrer le serveur de développement
npm run dev

# Accéder au dashboard admin
# http://localhost:3000/admin/escrow
```

## 🔄 Flux de Complet du Système

### 1. Client fait un paiement

```
Client → Flutterwave (Orange Money) → Webhook → Escrow Account
```

- Le client paie via Flutterwave (Orange Money prioritaire)
- Le webhook reçoit la confirmation
- Les fonds sont bloqués dans `escrow_accounts`
- Des milestones sont créés automatiquement (30%, 40%, 30%)

### 2. Prestataire soumet un jalon

```
Prestataire → Upload preuves → Milestone Submission → Admin Review
```

- Le prestataire utilise le composant `MilestoneSubmission`
- Il upload des preuves (images, documents)
- Le jalon passe en statut `completed`
- Notification envoyée à l'admin

### 3. Admin valide le travail

```
Admin → Dashboard → Approve Milestone → Release Funds → Transfer
```

- L'admin accède à `/admin/escrow`
- Il review les preuves soumisses
- Il approuve ou rejette le jalon
- Si approuvé, les fonds sont libérés
- Un virement automatique est initié

### 4. Virement automatique

```
Release Funds → Initiate Transfer → Flutterwave → Provider Account
```

- Le système récupère le compte bancaire du prestataire
- Il initie un transfert via Flutterwave
- Le transfert peut être Mobile Money (Orange Money) ou bancaire
- Le prestataire reçoit les fonds

## 🛠️ Composants Principaux

### Backend API

- `api/webhooks/flutterwave/index.ts` - Webhook Flutterwave
- `api/verify-payment/index.ts` - Vérification de paiement
- `api/admin/approve-milestone/index.ts` - Approuver un jalon
- `api/admin/reject-milestone/index.ts` - Rejeter un jalon
- `api/admin/release-escrow-funds/index.ts` - Libérer les fonds
- `api/admin/initiate-transfer/index.ts` - Initier un virement
- `api/admin/review-certification/index.ts` - Revoir une certification
- `api/certifications/submit/index.ts` - Soumettre une certification
- `api/milestones/submit/index.ts` - Soumettre un jalon

### Frontend Components

- `src/pages/AdminEscrowDashboard.tsx` - Dashboard admin
- `src/components/MilestoneSubmission.tsx` - Soumission de jalons
- `src/lib/flutterwave.ts` - Service Flutterwave
- `src/lib/api/escrow.ts` - API Escrow

### Base de Données

- `escrow_accounts` - Comptes séquestres
- `milestones` - Jalons de paiement
- `account_certifications` - Certifications de comptes
- `provider_bank_accounts` - Comptes bancaires des prestataires
- `transfer_transactions` - Transactions de virement

## 📱 Utilisation par les Utilisateurs

### Pour les Prestataires

1. **Configurer leur compte bancaire:**
   - Ajouter leur compte Orange Money ou bancaire
   - Faire vérifier leur compte

2. **Travailler sur le projet:**
   - Accéder à leurs projets
   - Voir les jalons à accomplir

3. **Soumettre les jalons:**
   - Utiliser le composant `MilestoneSubmission`
   - Upload des preuves de travail
   - Attendre la validation admin

4. **Recevoir les paiements:**
   - Notification quand un jalon est approuvé
   - Virement automatique vers leur compte
   - Suivi des transactions

### Pour les Clients

1. **Payer pour un service:**
   - Choisir Orange Money comme méthode de paiement
   - Les fonds sont bloqués en escrow
   - Paiement sécurisé

2. **Suivre l'avancement:**
   - Voir les jalons du projet
   - Notifications des mises à jour
   - Confirmation des livraisons

3. **Validations finales:**
   - Confirmer que le travail est conforme
   - Libération des derniers fonds
   - Noter le prestataire

### Pour les Admins

1. **Certifier les comptes:**
   - Review les demandes de certification
   - Vérifier les documents
   - Approuver/rejeter les certifications

2. **Valider les jalons:**
   - Accéder au dashboard `/admin/escrow`
   - Review les preuves soumisses
   - Approuver/rejeter les jalons

3. **Gérer les transferts:**
   - Surveiller les virements automatiques
   - Gérer les échecs de transfert
   - Manual transfer si nécessaire

## 🔒 Sécurité

- **RLS (Row Level Security)** activé sur toutes les tables
- **Vérification des rôles** pour toutes les opérations admin
- **Validation des signatures** de webhooks Flutterwave
- **Chiffrement des données** sensibles
- **Audit trail** complet des transactions

## 🐛 Dépannage

### Webhook non reçu
- Vérifiez que l'URL est accessible publiquement
- Utilisez ngrok pour le développement local
- Vérifiez les logs du serveur

### Erreur de signature webhook
- Vérifiez que `FLUTTERWAVE_SECRET_HASH` correspond
- Vérifiez l'en-tête `verif-hash`

### Transfert échoué
- Vérifiez que le compte bancaire est vérifié
- Vérifiez les fonds disponibles sur Flutterwave
- Vérifiez les limites de transfert

### Upload de fichiers échoué
- Vérifiez que le bucket `evidence` existe
- Vérifiez les permissions RLS
- Vérifiez la taille des fichiers (max 10MB)

## 📊 Monitoring

### KPIs à surveiller

- **Volume en escrow:** Montant total des fonds bloqués
- **Taux d'approbation:** Pourcentage de jalons approuvés
- **Temps de validation:** Temps moyen entre soumission et approbation
- **Taux de transfert réussi:** Pourcentage de virements réussis
- **Certification:** Nombre de comptes certifiés

### Alertes recommandées

- **Fonds bloqués > 24h:** Alertes admin
- **Transfert échoué:** Notification immédiate
- **Certification en attente > 48h:** Rappel admin
- **Jalon rejeté:** Notification prestataire

## 🚀 Améliorations Futures

- [ ] Système de dispute entre client et prestataire
- [ ] Assurance pour les transactions
- [ ] Multi-devise support
- [ ] Intégration avec d'autres fournisseurs de paiement
- [ ] Analytics avancés
- [ ] Mobile app native
- [ ] Système de bonus pour certifications
- [ ] Notifications SMS et email

## 📞 Support

Pour toute question ou problème:
- Documentation technique: `docs/`
- API Documentation: `API_DOCUMENTATION.md`
- Supabase Dashboard: https://app.supabase.com
- Flutterwave Dashboard: https://dashboard.flutterwave.com
