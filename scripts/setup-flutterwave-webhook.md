# Configuration du Webhook Flutterwave

## Étape 1: Obtenir l'URL du webhook

Votre webhook Flutterwave doit pointer vers:
```
https://votre-domaine.com/api/webhooks/flutterwave
```

**Pour le développement local:**
Utilisez ngrok ou un service similaire:
```bash
ngrok http 3000
```
Cela créera une URL publique comme: `https://abc123.ngrok.io/api/webhooks/flutterwave`

## Étape 2: Configurer le webhook sur Flutterwave

1. Connectez-vous à votre dashboard Flutterwave: https://dashboard.flutterwave.com
2. Allez dans **Settings** > **Webhooks**
3. Cliquez sur **Add New Webhook**
4. Entrez l'URL de votre webhook
5. Sélectionnez les événements à écouter:
   - `charge.completed`
   - `charge.failed`
   - `transfer.completed`
6. Cliquez sur **Save**

## Étape 3: Générer le Secret Hash

1. Dans le dashboard Flutterwave, allez dans **Settings** > **API Keys**
2. Copiez le **Secret Hash** généré
3. Ajoutez-le à vos variables d'environnement:
```env
FLUTTERWAVE_SECRET_HASH=votre_secret_hash_ici
```

## Étape 4: Mettre à jour les variables d'environnement

Ajoutez ou mettez à jour ces variables dans votre fichier `.env`:

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
```

## Étape 5: Tester le webhook

### Test avec Flutterwave Dashboard

1. Allez dans **Test** > **Webhook** dans le dashboard Flutterwave
2. Sélectionnez votre webhook
3. Cliquez sur **Send Test Webhook**
4. Vérifiez que votre endpoint reçoit la requête

### Test manuel avec curl

```bash
curl -X POST https://votre-domaine.com/api/webhooks/flutterwave \
  -H "Content-Type: application/json" \
  -H "verif-hash: votre_secret_hash" \
  -d '{
    "event": "charge.completed",
    "data": {
      "tx_ref": "TEST-123",
      "amount": "1000",
      "currency": "XAF",
      "id": "123456",
      "flw_ref": "FLW-123456",
      "customer": {
        "email": "test@example.com",
        "name": "Test User",
        "phone": "+237123456789"
      },
      "payment_type": "orange_money",
      "meta": {
        "booking_id": "test-booking-id",
        "user_id": "test-user-id"
      }
    }
  }'
```

## Étape 6: Vérifier les logs

Sur votre serveur, vérifiez que les webhooks sont reçus:

```bash
# Vérifier les logs du serveur
tail -f /var/log/your-app.log

# Ou pour développement
npm run dev
```

Vous devriez voir des logs comme:
```
Flutterwave payment completed for booking test-booking-id
```

## Dépannage

### Webhook non reçu
- Vérifiez que l'URL est accessible publiquement
- Vérifiez que le port est ouvert (3000 pour développement)
- Vérifiez les règles de pare-feu

### Erreur de signature
- Vérifiez que `FLUTTERWAVE_SECRET_HASH` correspond à celui du dashboard
- Vérifiez que l'en-tête `verif-hash` est correctement envoyé

### Erreur 404
- Vérifiez que le chemin `/api/webhooks/flutterwave` existe
- Vérifiez que le fichier `api/webhooks/flutterwave/index.ts` est déployé

## Sécurité

- Toujours utiliser HTTPS en production
- Ne jamais exposer vos clés secrètes
- Valider toujours la signature du webhook
- Limiter les requêtes par IP si possible
