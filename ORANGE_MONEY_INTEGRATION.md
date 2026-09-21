# Guide d'Intégration du Système Orange Money

## Étapes d'Intégration

### 1. Mise à jour du Dashboard Admin

Modifier `src/pages/AdminDashboardPage.tsx` pour inclure les nouveaux onglets:

```tsx
// Ajouter les imports
import OrangeMoneyDashboard from '@/components/OrangeMoneyDashboard';
import AccountCertificationManager from '@/components/AccountCertificationManager';
import MilestoneValidationManager from '@/components/MilestoneValidationManager';
import ManualPaymentManager from '@/components/ManualPaymentManager';
import OrangeMoneyTransferManager from '@/components/OrangeMoneyTransferManager';
import FinancialReports from '@/components/FinancialReports';

// Mettre à jour le type Tab
type Tab = 'stats' | 'validation' | 'users' | 'reports' | 'categories' | 'audit' | 'commissions' | 'roles' | 'payments' | 'escrow' | 'certifications' | 'orange-money' | 'transfers' | 'financial-reports';

// Ajouter les onglets dans le tableau tabs
const tabs = [
  // ... onglets existants
  { id: 'orange-money', label: 'Orange Money', icon: Smartphone },
  { id: 'escrow', label: 'Escrow', icon: Shield },
  { id: 'certifications', label: 'Certifications', icon: Award },
  { id: 'transfers', label: 'Transferts', icon: ArrowRight },
  { id: 'financial-reports', label: 'Rapports', icon: BarChart3 },
];

// Ajouter le contenu pour chaque onglet
{tab === 'orange-money' && <OrangeMoneyDashboard />}
{tab === 'escrow' && <MilestoneValidationManager isAdmin={true} />}
{tab === 'certifications' && <AccountCertificationManager isAdmin={true} />}
{tab === 'transfers' && <OrangeMoneyTransferManager />}
{tab === 'financial-reports' && <FinancialReports />}
```

### 2. Mise à jour du Dashboard Prestataire

Modifier `src/pages/ProviderDashboardPage.tsx` pour inclure les fonctionnalités:

```tsx
import MilestoneValidationManager from '@/components/MilestoneValidationManager';
import AccountCertificationManager from '@/components/AccountCertificationManager';

// Ajouter les onglets dans le dashboard prestataire
{tab === 'milestones' && <MilestoneValidationManager isAdmin={false} />}
{tab === 'certifications' && <AccountCertificationManager userId={user.id} isAdmin={false} />}
```

### 3. Configuration des Routes

Ajouter les routes dans `src/App.tsx` ou votre fichier de routing:

```tsx
import OrangeMoneyDashboard from '@/components/OrangeMoneyDashboard';
import AccountCertificationManager from '@/components/AccountCertificationManager';
import MilestoneValidationManager from '@/components/MilestoneValidationManager';
import ManualPaymentManager from '@/components/ManualPaymentManager';
import OrangeMoneyTransferManager from '@/components/OrangeMoneyTransferManager';
import FinancialReports from '@/components/FinancialReports';

// Routes admin
<Route path="/admin/orange-money" element={<OrangeMoneyDashboard />} />
<Route path="/admin/certifications" element={<AccountCertificationManager isAdmin={true} />} />
<Route path="/admin/milestones" element={<MilestoneValidationManager isAdmin={true} />} />
<Route path="/admin/manual-payments" element={<ManualPaymentManager isAdmin={true} />} />
<Route path="/admin/transfers" element={<OrangeMoneyTransferManager />} />
<Route path="/admin/financial-reports" element={<FinancialReports />} />

// Routes prestataires
<Route path="/provider/milestones" element={<MilestoneValidationManager isAdmin={false} />} />
<Route path="/provider/certifications" element={<AccountCertificationManager userId={userId} isAdmin={false} />} />
```

### 4. Exécution des Migrations Supabase

Exécuter les migrations SQL dans l'ordre:

```bash
# Via le dashboard Supabase
1. Ouvrir SQL Editor
2. Exécuter: supabase/migrations/add_escrow_system.sql
3. Exécuter: supabase/migrations/create_certifications_table.sql
4. Exécuter: supabase/migrations/add_manual_payments.sql
5. Exécuter: supabase/migrations/create_transfers_table.sql
```

Ou via CLI:

```bash
supabase db push
```

### 5. Configuration des Buckets Supabase

Créer les buckets de stockage via le dashboard Supabase:

1. **certifications**
   - Public: false
   - File size limit: 5MB
   - Allowed MIME types: image/*, application/pdf

2. **milestone-evidence**
   - Public: false
   - File size limit: 10MB
   - Allowed MIME types: image/*, application/pdf

3. **payment-evidence**
   - Public: false
   - File size limit: 5MB
   - Allowed MIME types: image/*, application/pdf

Configurer les politiques RLS pour chaque bucket:

```sql
-- Pour le bucket certifications
CREATE POLICY "Users can upload certifications"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'certifications' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own certifications"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'certifications' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all certifications"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'certifications' AND EXISTS (
  SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
));
```

### 6. Configuration des Variables d'Environnement

Ajouter au fichier `.env`:

```env
# Supabase (existant)
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon

# Flutterwave (nouveau)
FLUTTERWAVE_PUBLIC_KEY=votre_cle_public_flutterwave
FLUTTERWAVE_SECRET_KEY=votre_cle_secret_flutterwave
FLUTTERWAVE_ENCRYPTION_KEY=votre_cle_encryption_flutterwave
```

### 7. Création des Edge Functions Supabase

Créer les Edge Functions pour les notifications:

**send-email**:
```typescript
// supabase/functions/send-email/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Resend } from 'https://esm.sh/resend@2.0.0'

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

serve(async (req) => {
  const { to, template, data } = await req.json()
  
  // Logique d'envoi d'email selon le template
  // ...
  
  return new Response(JSON.stringify({ success: true }))
})
```

**send-sms**:
```typescript
// supabase/functions/send-sms/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const { to, template, data } = await req.json()
  
  // Logique d'envoi SMS via un provider (Orange SMS, Twilio, etc.)
  // ...
  
  return new Response(JSON.stringify({ success: true }))
})
```

### 8. Tests d'Intégration

Tester chaque composant:

1. **Dashboard Orange Money**
   - Vérifier l'affichage des transactions
   - Tester les filtres
   - Tester la validation de paiements

2. **Certification des Comptes**
   - Tester l'upload de documents
   - Vérifier le système de points
   - Tester la validation admin

3. **Validation de Milestones**
   - Tester la soumission de preuves
   - Vérifier la validation admin
   - Tester la libération de fonds

4. **Transferts Automatiques**
   - Configurer un compte bancaire de test
   - Tester un petit transfert
   - Vérifier les notifications

### 9. Déploiement

```bash
# Build de l'application
npm run build

# Déploiement sur Vercel
vercel --prod

# Ou déploiement sur votre plateforme préférée
```

## Checklist de Déploiement

- [ ] Toutes les migrations SQL exécutées
- [ ] Buckets Supabase créés et configurés
- [ ] Politiques RLS configurées
- [ ] Variables d'environnement définies
- [ ] Edge Functions déployées
- [ ] Tests de paiement effectués
- [ ] Système de notifications testé
- [ ] Documentation mise à jour
- [ ] Admin formés à l'utilisation
- [ ] Monitoring configuré

## Support

En cas de problème lors de l'intégration:

1. Vérifier les logs Supabase
2. Vérifier la console du navigateur
3. Consulter la documentation complète: `ORANGE_MONEY_SYSTEM_GUIDE.md`
4. Contacter le support technique

---

**Bonnes pratiques**:
- Toujours tester en environnement de développement d'abord
- Effectuer des sauvegardes avant les migrations
- Former les équipes administratives
- Surveiller les performances après déploiement
- Avoir un plan de retour en cas de problème