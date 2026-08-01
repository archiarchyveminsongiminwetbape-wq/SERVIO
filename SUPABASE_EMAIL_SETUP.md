# Configuration Supabase pour les emails de confirmation

## Problème
Vous ne recevez plus les emails de confirmation lors de la création de compte.

## Solutions

### Option 1: Désactiver la confirmation email (Recommandé pour développement)

1. Connectez-vous à votre dashboard Supabase
2. Allez dans **Authentication** > **Providers**
3. Cliquez sur **Email**
4. Désactivez l'option **"Confirm email"**
5. Cliquez sur **Save**

Cela permettra aux utilisateurs de s'inscrire sans confirmation email.

### Option 2: Configurer les emails SMTP (Pour production)

1. Connectez-vous à votre dashboard Supabase
2. Allez dans **Project Settings** > **Authentication** > **SMTP Settings**
3. Configurez votre serveur SMTP :

```
SMTP Host: smtp.gmail.com (ou votre serveur)
SMTP Port: 587
SMTP User: votre-email@gmail.com
SMTP Password: votre-mot-de-passe-app
Sender Email: votre-email@gmail.com
Sender Name: SERVIO
```

4. Cliquez sur **Test** pour vérifier la configuration
5. Cliquez sur **Save**

### Option 3: Utiliser le service email de Supabase (Gratuit pour test)

1. Connectez-vous à votre dashboard Supabase
2. Allez dans **Project Settings** > **Authentication** > **Email Templates**
3. Vérifiez que les templates sont configurés
4. Allez dans **Authentication** > **Providers** > **Email**
5. Assurez-vous que **"Confirm email"** est activé
6. Vérifiez que **"Site URL"** est correctement configuré (votre URL de production)

## Vérifications supplémentaires

### Vérifier les logs Supabase

1. Allez dans **Logs** > **Auth Logs**
2. Cherchez les erreurs liées à l'envoi d'emails
3. Notez les messages d'erreur pour diagnostiquer le problème

### Vérifier le dossier spam

Les emails de confirmation peuvent être envoyés mais finir dans :
- Dossier Spam
- Dossier Promotions
- Dossier Courrier indésirable

### Tester avec une adresse email différente

Certains fournisseurs d'email bloquent les emails de Supabase :
- Évitez les emails temporaire
- Utilisez Gmail, Outlook, ou un email professionnel

## Configuration recommandée pour développement

Pour le développement, je recommande de **désactiver la confirmation email** :

1. Dashboard Supabase > Authentication > Providers > Email
2. Désactiver **"Confirm email"**
3. Sauvegarder

Cela simplifiera le développement et les tests.

## Pour la production

En production, activez la confirmation email et configurez un serveur SMTP fiable pour garantir la livraison des emails.
