# 🍊 Système de Paiement Orange Money SERVIO

Système complet de gestion de paiements Orange Money avec escrow (tiers de confiance) pour la plateforme SERVIO.

## 🌟 Fonctionnalités

### 💰 Gestion des Paiements
- **Dashboard Orange Money**: Vue d'ensemble de toutes les transactions
- **Paiements Manuels**: Validation manuelle avec preuves de paiement
- **Transferts Automatiques**: Virements automatiques vers les comptes Orange Money
- **Multi-méthodes**: Orange Money, MTN Money, Wave, Virement, Espèces, Chèque

### 🛡️ Système d'Escrow
- **Comptes Séquestres**: Blocage des fonds jusqu'à validation
- **Milestones Progressifs**: Paiements par étapes (30%, 40%, 30% par défaut)
- **Libération de Fonds**: Transfert automatique après validation admin
- **Suivi en Temps Réel**: État des fonds bloqués et libérés

### ✅ Certification des Comptes
- **Upload de Documents**: Pièce d'identité, téléphone, email, adresse, business
- **Système de Points**: Score de confiance 0-100
- **Niveaux de Certification**: None, Basic, Standard, Verified, Premium
- **Validation Admin**: Révision manuelle des documents

### 📋 Validation de Milestones
- **Soumission de Preuves**: Upload d'images/documents par les prestataires
- **Validation Admin**: Révision et approbation/rejet
- **Libération Progressive**: Paiement par étape selon l'avancement
- **Historique Complet**: Traçabilité de toutes les actions

### 📧 Notifications
- **Email & SMS**: Notifications automatiques pour les événements clés
- **Alertes Admin**: Notifications pour validations requises
- **Alertes Prestataires**: Notifications d'approbation et transferts
- **Alertes Clients**: Confirmations de paiements

### 📊 Rapports Financiers
- **KPIs en Temps Réel**: Revenus, transactions, escrow
- **Analyse par Période**: 7j, 30j, 90j, 1 an
- **Par Méthode de Paiement**: Performance par type de paiement
- **Top Prestataires**: Classement par revenus

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT (Paiement)                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              VALIDATION ADMIN (Orange Money)                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  COMPTE ESCROW (Fonds bloqués)               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              MILESTONES (30% → 40% → 30%)                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│         PRESTATAIRE (Soumet preuves de travail)            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              VALIDATION ADMIN (Preuves)                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│         TRANSFERT AUTOMATIQUE (Orange Money)                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│           PRESTATAIRE (Reçoit les fonds)                     │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Structure du Projet

```
src/
├── components/
│   ├── OrangeMoneyDashboard.tsx          # Dashboard principal Orange Money
│   ├── AccountCertificationManager.tsx  # Gestion des certifications
│   ├── MilestoneValidationManager.tsx   # Validation des milestones
│   ├── ManualPaymentManager.tsx         # Gestion des paiements manuels
│   ├── OrangeMoneyTransferManager.tsx   # Gestion des transferts automatiques
│   └── FinancialReports.tsx             # Rapports financiers
├── lib/
│   ├── orange-money-transfer.ts         # Service de transfert automatique
│   ├── notification-service.ts          # Service de notifications
│   ├── flutterwave.ts                   # Intégration Flutterwave
│   └── manual-payment.ts                # Service de paiement manuel
└── pages/
    ├── AdminDashboardPage.tsx           # Dashboard admin (à mettre à jour)
    └── ProviderDashboardPage.tsx        # Dashboard prestataire (à mettre à jour)

supabase/migrations/
├── add_escrow_system.sql               # Système d'escrow
├── create_certifications_table.sql      # Table des certifications
├── add_manual_payments.sql              # Paiements manuels
└── create_transfers_table.sql           # Transferts automatiques
```

## 🚀 Installation

### Prérequis

- Node.js 18+
- Supabase account
- Flutterwave account (pour les transferts automatiques)
- Compte Orange Money (pour les tests)

### Configuration

1. **Cloner le projet**
```bash
cd C:\Users\hp\Music\project
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer les variables d'environnement**
```env
# Dans .env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon
FLUTTERWAVE_PUBLIC_KEY=votre_cle_public
FLUTTERWAVE_SECRET_KEY=votre_cle_secret
FLUTTERWAVE_ENCRYPTION_KEY=votre_cle_encryption
```

4. **Exécuter les migrations Supabase**
```bash
# Via le dashboard Supabase SQL Editor
1. add_escrow_system.sql
2. create_certifications_table.sql
3. add_manual_payments.sql
4. create_transfers_table.sql
```

5. **Créer les buckets de stockage**
- `certifications` - Documents de certification
- `milestone-evidence` - Preuves de travail
- `payment-evidence` - Preuves de paiement

6. **Lancer le développement**
```bash
npm run dev
```

## 📖 Utilisation

### Pour les Administrateurs

1. **Accéder au dashboard admin**
2. **Onglet "Orange Money"**: Gérer les transactions
3. **Onglet "Certifications"**: Valider les comptes
4. **Onglet "Jalons"**: Valider le travail
5. **Onglet "Transferts"**: Gérer les virements automatiques
6. **Onglet "Rapports"**: Voir les statistiques

### Pour les Prestataires

1. **Accéder au dashboard prestataire**
2. **Certifier son compte**: Upload des documents
3. **Soumettre les milestones**: Upload des preuves de travail
4. **Suivre les paiements**: Voir l'état des transferts

### Pour les Clients

1. **Effectuer un paiement** via Orange Money
2. **Suivre l'avancement** du projet
3. **Valider le travail** avant libération des fonds

## 🔧 Configuration Avancée

### Personnalisation des Milestones

Modifier les pourcentages par défaut dans `add_escrow_system.sql`:

```sql
-- Modifier les valeurs par défaut (30%, 40%, 30%)
INSERT INTO public.milestones (escrow_id, title, description, percentage, amount) VALUES
  (escrow_id, 'Initial Payment', 'Premier paiement', 25.0, NEW.amount * 0.25),
  (escrow_id, 'Progress Payment', 'Paiement intermédiaire', 50.0, NEW.amount * 0.50),
  (escrow_id, 'Final Payment', 'Paiement final', 25.0, NEW.amount * 0.25);
```

### Configuration des Notifications

Modifier les templates dans `src/lib/notification-service.ts`:

```typescript
private getNotificationTitle(template: string, data: Record<string, any>): string {
  const titleMap: Record<string, (data: any) => string> = {
    payment_received: () => 'Votre titre personnalisé',
    // ...
  };
  // ...
}
```

### Personnalisation des Rapports

Modifier les périodes et métriques dans `src/components/FinancialReports.tsx`:

```typescript
const periods = {
  '7d': [/* vos données */],
  '30d': [/* vos données */],
  // ...
};
```

## 🧪 Tests

### Test de Paiement

1. Créer un booking de test
2. Effectuer un paiement via Orange Money
3. Valider le paiement en admin
4. Vérifier la création du compte escrow

### Test de Certification

1. Accéder à la page de certification
2. Upload un document de test
3. Valider en admin
4. Vérifier le score de confiance

### Test de Milestone

1. Créer un milestone de test
2. Upload des preuves
3. Valider en admin
4. Vérifier le transfert automatique

## 📚 Documentation

- **Guide du système**: `ORANGE_MONEY_SYSTEM_GUIDE.md`
- **Guide d'intégration**: `ORANGE_MONEY_INTEGRATION.md`
- **Documentation API**: `API_DOCUMENTATION.md`

## 🔐 Sécurité

- **RLS (Row Level Security)** activé sur toutes les tables
- **Validation des rôles** pour les actions sensibles
- **Audit trail** dans `admin_actions`
- **Chiffrement** des données sensibles
- **Vérification** des montants et destinataires

## 🚨 Dépannage

### Transfert échoué
- Vérifier le solde Flutterwave
- Vérifier les coordonnées bancaires
- Vérifier les limites de transfert

### Upload échoué
- Vérifier la configuration du bucket
- Vérifier les permissions RLS
- Vérifier la taille des fichiers

### Notifications non envoyées
- Vérifier les Edge Functions
- Vérifier les variables d'environnement
- Vérifier les logs Supabase

## 🤝 Support

Pour toute question technique:
- Documentation Supabase: https://supabase.com/docs
- Documentation Flutterwave: https://developer.flutterwave.com
- Support SERVIO: support@servio.com

## 📝 Notes de Version

### Version 1.0.0 (2026-09-21)
- Système d'escrow complet
- Certification des comptes avec upload
- Validation de milestones avec preuves
- Transferts automatiques Orange Money
- Notifications email/SMS
- Rapports financiers complets

## 🎯 Roadmap

- [ ] Intégration directe API Orange Money
- [ ] Wallet virtuel interne
- [ ] Système de fidélité
- [ ] Analytics avancés
- [ ] Application mobile

---

**Développé avec ❤️ pour SERVIO**