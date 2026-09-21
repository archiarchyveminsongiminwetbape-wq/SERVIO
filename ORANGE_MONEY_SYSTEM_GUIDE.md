# Guide du Système de Paiement Orange Money SERVIO

## Vue d'ensemble

Ce système permet de gérer les paiements via Orange Money avec un système d'escrow (tiers de confiance) pour sécuriser les transactions entre clients et prestataires sur la plateforme SERVIO.

## Fonctionnalités Principales

### 1. 🏦 Dashboard Orange Money
- **Fichier**: `src/components/OrangeMoneyDashboard.tsx`
- **Fonctionnalités**:
  - Vue d'ensemble de toutes les transactions Orange Money
  - Statistiques en temps réel (volume, transactions, escrow)
  - Gestion des comptes escrow
  - Filtres par statut et recherche
  - Validation manuelle des paiements

### 2. 📋 Certification des Comptes
- **Fichier**: `src/components/AccountCertificationManager.tsx`
- **Fonctionnalités**:
  - Upload de documents pour certification
  - Système de points de confiance (0-100)
  - Niveaux de certification: None, Basic, Standard, Verified, Premium
  - Validation manuelle par admin
  - Types de certification: Identité, Téléphone, Email, Adresse, Business, Prestataire

### 3. ✅ Validation des Milestones
- **Fichier**: `src/components/MilestoneValidationManager.tsx`
- **Fonctionnalités**:
  - Soumission de preuves de travail par les prestataires
  - Validation des milestones par admin
  - Libération progressive des fonds (30%, 40%, 30% par défaut)
  - Upload d'images/documents comme preuves
  - Suivi de progression des paiements

### 4. 💳 Gestion des Paiements Manuels
- **Fichier**: `src/components/ManualPaymentManager.tsx`
- **Fonctionnalités**:
  - Enregistrement de paiements manuels
  - Upload de preuves de paiement (captures Orange Money)
  - Validation par admin
  - Support de multiples méthodes: Orange Money, MTN Money, Wave, Virement, Espèces, Chèque

### 5. 🔄 Transferts Automatiques Orange Money
- **Fichier**: `src/lib/orange-money-transfer.ts`
- **Fonctionnalités**:
  - Transferts automatiques vers les comptes Orange Money des prestataires
  - Intégration avec Flutterwave
  - Suivi des statuts de transfert
  - Annulation de transferts en cours
  - Gestion des soldes

### 6. 📧 Système de Notifications
- **Fichier**: `src/lib/notification-service.ts`
- **Fonctionnalités**:
  - Notifications email et SMS
  - Alertes automatiques pour les paiements reçus
  - Notifications de validation de milestones
  - Alertes admin pour validations requises
  - Notifications de certification

### 7. 📊 Rapports Financiers
- **Fichier**: `src/components/FinancialReports.tsx`
- **Fonctionnalités**:
  - Statistiques de revenus par période
  - Analyse par méthode de paiement
  - Top prestataires par revenu
  - KPIs financiers en temps réel
  - Export de rapports

## Architecture du Système

### Flux de Paiement Complet

```
1. Client initie un paiement
   ↓
2. Paiement enregistré (statut: pending)
   ↓
3. Admin valide le paiement (Orange Money ou manuel)
   ↓
4. Compte escrow créé automatiquement
   ↓
5. Milestones générés (30%, 40%, 30%)
   ↓
6. Prestataire soumet les preuves de travail
   ↓
7. Admin valide le milestone
   ↓
8. Transfert automatique Orange Money vers le prestataire
   ↓
9. Notifications envoyées à toutes les parties
```

### Structure de la Base de Données

#### Tables Principales

1. **manual_payments** - Paiements manuels
2. **escrow_accounts** - Comptes séquestres
3. **milestones** - Jalons de paiement
4. **account_certifications** - Certifications de compte
5. **transfers** - Transferts automatiques
6. **provider_bank_accounts** - Comptes bancaires des prestataires

## Configuration Requise

### Variables d'Environnement

```env
# Supabase
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_ANON_KEY=votre_cle_anon

# Flutterwave (pour les transferts automatiques)
FLUTTERWAVE_PUBLIC_KEY=votre_cle_public
FLUTTERWAVE_SECRET_KEY=votre_cle_secret
FLUTTERWAVE_ENCRYPTION_KEY=votre_cle_encryption
```

### Setup Supabase

1. Exécuter les migrations SQL dans l'ordre:
   - `add_escrow_system.sql`
   - `create_certifications_table.sql`
   - `add_manual_payments.sql`
   - `create_transfers_table.sql`

2. Créer les buckets de stockage:
   - `certifications` - Documents de certification
   - `milestone-evidence` - Preuves de travail
   - `payment-evidence` - Preuves de paiement

3. Configurer les politiques RLS pour chaque bucket

## Intégration des Composants

### Dans le Dashboard Admin

```tsx
import OrangeMoneyDashboard from '@/components/OrangeMoneyDashboard';
import AccountCertificationManager from '@/components/AccountCertificationManager';
import MilestoneValidationManager from '@/components/MilestoneValidationManager';
import ManualPaymentManager from '@/components/ManualPaymentManager';
import OrangeMoneyTransferManager from '@/components/OrangeMoneyTransferManager';
import FinancialReports from '@/components/FinancialReports';

// Utiliser selon les besoins dans les onglets du dashboard admin
```

### Pour les Prestataires

```tsx
import MilestoneValidationManager from '@/components/MilestoneValidationManager';
import AccountCertificationManager from '@/components/AccountCertificationManager';

// Dans le dashboard prestataire pour soumettre les milestones et certifications
```

## Processus de Certification

### Pour les Utilisateurs

1. Accéder à la page de certification
2. Sélectionner le type de certification
3. Upload les documents requis
4. Soumettre pour validation

### Pour les Admins

1. Accéder au dashboard admin
2. Onglet "Certifications"
3. Voir les certifications en attente
4. Réviser les documents
5. Approuver ou rejeter avec raison

## Processus de Validation Milestone

### Pour les Prestataires

1. Accéder au dashboard prestataire
2. Voir les milestones disponibles
3. Sélectionner un milestone
4. Upload les preuves de travail
5. Soumettre pour validation

### Pour les Admins

1. Accéder au dashboard admin
2. Onglet "Jalons en Attente"
3. Voir les milestones soumis
4. Réviser les preuves
5. Approuver ou rejeter
6. Libérer les fonds si approuvé

## Processus de Transfert Automatique

### Configuration Préalable

1. Le prestataire doit configurer son compte Orange Money
2. L'admin doit avoir un solde suffisant sur Flutterwave
3. Les coordonnées bancaires doivent être validées

### Exécution du Transfert

```typescript
import { orangeMoneyTransferService } from '@/lib/orange-money-transfer';

// Libérer les fonds d'un milestone
const result = await orangeMoneyTransferService.releaseEscrowFunds(
  escrowId,
  milestoneId,
  adminId
);

if (result.success) {
  console.log('Transfert effectué:', result.reference);
}
```

## Système de Notifications

### Types de Notifications

1. **payment_received** - Paiement reçu par le client
2. **milestone_approved** - Jalon approuvé
3. **transfer_completed** - Transfert effectué
4. **certification_approved** - Certification approuvée
5. **admin_payment_validation** - Paiement à valider (admin)
6. **admin_milestone_validation** - Jalon à valider (admin)

### Utilisation

```typescript
import { notificationService } from '@/lib/notification-service';

// Notifier un client
await notificationService.notifyPaymentReceived(
  userId,
  amount,
  currency,
  bookingId
);

// Notifier un prestataire
await notificationService.notifyMilestoneApproved(
  providerId,
  milestoneTitle,
  amount
);
```

## Rapports et Analytics

### KPIs Disponibles

- Revenu total
- Nombre de transactions
- Fonds en escrow
- Fonds libérés
- Taux de croissance
- Performance par méthode de paiement
- Top prestataires

### Périodes d'Analyse

- 7 derniers jours
- 30 derniers jours
- 90 derniers jours
- 1 an

## Sécurité et Validation

### Mesures de Sécurité

1. **RLS (Row Level Security)** sur toutes les tables
2. Validation des rôles (admin uniquement pour actions sensibles)
3. Audit trail dans `admin_actions`
4. Vérification des montants et destinataires
5. Confirmation pour les actions irréversibles

### Recommandations

1. Toujours vérifier les preuves de paiement
2. Valider les comptes avant d'effectuer des transferts
3. Garder un historique des actions admin
4. Surveiller les transactions suspectes
5. Effectuer des sauvegardes régulières

## Dépannage

### Problèmes Courants

1. **Transfert échoué**
   - Vérifier le solde Flutterwave
   - Vérifier les coordonnées bancaires du prestataire
   - Vérifier les limites de transfert

2. **Upload de fichiers échoué**
   - Vérifier la configuration du bucket Supabase
   - Vérifier les permissions RLS
   - Vérifier la taille des fichiers

3. **Notifications non envoyées**
   - Vérifier la configuration des Edge Functions
   - Vérifier les variables d'environnement
   - Vérifier les logs Supabase

## Support et Maintenance

### Tâches de Maintenance

1. Surveillance des transferts en échec
2. Nettoyage des anciennes notifications
3. Archivage des transactions
4. Mise à jour des certifications expirées
5. Réconciliation des comptes

### Contact Support

Pour toute question technique ou problème, consultez:
- Documentation Supabase: https://supabase.com/docs
- Documentation Flutterwave: https://developer.flutterwave.com
- Support SERVIO: support@servio.com

## Notes de Version

### Version 1.0.0
- Système d'escrow complet
- Certification des comptes
- Validation de milestones
- Transferts automatiques Orange Money
- Notifications email/SMS
- Rapports financiers

---

**Dernière mise à jour**: 2026-09-21
**Version**: 1.0.0
**Auteur**: Devin AI Assistant