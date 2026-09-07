-- Table pour les questions/réponses du chatbot
CREATE TABLE IF NOT EXISTS chatbot_qa (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT NOT NULL, -- 'general', 'booking', 'payment', 'account', 'provider', 'support'
  keywords TEXT[], -- Mots-clés pour la recherche
  priority INTEGER DEFAULT 0, -- Priorité pour le classement des résultats
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Index pour améliorer les performances de recherche
CREATE INDEX IF NOT EXISTS idx_chatbot_qa_category ON chatbot_qa(category);
CREATE INDEX IF NOT EXISTS idx_chatbot_qa_keywords ON chatbot_qa USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_chatbot_qa_active ON chatbot_qa(is_active) WHERE is_active = true;

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_chatbot_qa_updated_at
  BEFORE UPDATE ON chatbot_qa
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Politique RLS
ALTER TABLE chatbot_qa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tout le monde peut voir les questions/réponses actives"
  ON chatbot_qa FOR SELECT
  USING (is_active = true);

CREATE POLICY "Seuls les admins peuvent gérer les questions/réponses"
  ON chatbot_qa FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.admin_role IN ('super_admin', 'admin')
    )
  );

-- Insérer 100 questions/réponses pour le chatbot
INSERT INTO chatbot_qa (question, answer, category, keywords, priority) VALUES
-- Questions générales (20)
('Qu''est-ce que SERVIO ?', 'SERVIO est une plateforme qui connecte les clients aux meilleurs prestataires de services. Vous pouvez trouver des artisans, consultants, créatifs et professionnels qualifiés près de chez vous ou à distance.', ARRAY['servio', 'plateforme', 'présentation', 'qu''est-ce', 'définition'], 10),
('Comment fonctionne SERVIO ?', 'SERVIO fonctionne simplement : 1) Recherchez un prestataire par catégorie ou localisation, 2) Consultez les profils et avis, 3) Réservez directement en ligne, 4) Communiquez via notre messagerie intégrée.', ARRAY['fonctionnement', 'comment', 'marche', 'utilisation', 'étape'], 10),
('SERVIO est-il gratuit ?', 'Oui, l''inscription et la recherche de prestataires sur SERVIO sont entièrement gratuits. Les prestataires paient une commission sur chaque réservation.', ARRAY['gratuit', 'prix', 'coût', 'tarif', 'abonnement'], 10),
('Dans quels pays SERVIO est-il disponible ?', 'SERVIO est disponible dans plusieurs pays francophones dont la France, le Cameroun, la Côte d''Ivoire, le Sénégal et d''autres pays d''Afrique de l''Ouest.', ARRAY['pays', 'disponible', 'localisation', 'géographie', 'région'], 5),
('Comment puis-je contacter le support ?', 'Vous pouvez nous contacter via le formulaire de contact sur notre site, par email à support@servio.com, ou via le chatbot disponible 24h/24 et 7j/7.', ARRAY['contact', 'support', 'aide', 'assistance', 'email'], 10),
('SERVIO est-il sécurisé ?', 'Oui, SERVIO utilise des paiements sécurisés, vérifie les profils des prestataires, et offre une protection contre les fraudes. Vos données personnelles sont protégées.', ARRAY['sécurité', 'sécurisé', 'protection', 'données', 'fraude'], 10),
('Puis-je annuler une réservation ?', 'Oui, vous pouvez annuler une réservation selon les conditions d''annulation du prestataire. Les remboursements sont traités selon la politique de chaque prestataire.', ARRAY['annuler', 'remboursement', 'cancellation', 'retour', 'politique'], 10),
('Comment puis-je laisser un avis ?', 'Après la completion d''un service, vous recevrez une notification pour laisser un avis. Vous pouvez noter le prestataire sur plusieurs critères et laisser un commentaire détaillé.', ARRAY['avis', 'notation', 'évaluation', 'commentaire', 'note'], 10),
('Les prestataires sont-ils vérifiés ?', 'Oui, tous les prestataires passent par un processus de vérification incluant l''identité, les qualifications et les références. Les profils vérifiés portent un badge.', ARRAY['vérifié', 'badge', 'authentique', 'qualité', 'confiance'], 10),
('Comment fonctionne le système de recommandation ?', 'Notre IA analyse vos besoins, vos préférences et votre historique pour vous recommander les prestataires les plus adaptés à votre projet.', ARRAY['recommandation', 'ia', 'algorithme', 'suggestion', 'personnalisation'], 5),
('Puis-je devenir prestataire sur SERVIO ?', 'Oui, inscrivez-vous comme prestataire, complétez votre profil avec vos services, tarifs et disponibilités. Après validation, vous pourrez recevoir des demandes de réservation.', ARRAY['prestataire', 'devenir', 'inscription', 'vendre', 'services'], 10),
('Quels types de services sont disponibles ?', 'SERVIO propose des services dans de nombreuses catégories : artisanat, conseil, beauté, informatique, événementiel, éducation, photographie, restauration, et bien d''autres.', ARRAY['catégorie', 'services', 'types', 'domaine', 'secteur'], 10),
('Comment SERVIO protège mes données ?', 'Nous utilisons le chiffrement SSL, respectons le RGPD, et ne partageons jamais vos données sans consentement. Vos informations sont stockées de manière sécurisée.', ARRAY['données', 'privé', 'confidentialité', 'rgpd', 'protection'], 10),
('Y a-t-il une application mobile ?', 'SERVIO est disponible en tant qu''application web progressive (PWA). Vous pouvez l''installer sur votre mobile depuis votre navigateur pour une expérience native.', ARRAY['mobile', 'application', 'app', 'pwa', 'téléphone'], 5),
('Comment fonctionne le paiement ?', 'Les paiements sont sécurisés via notre plateforme intégrée. Vous payez lors de la réservation et le prestataire reçoit le paiement après completion du service.', ARRAY['paiement', 'argent', 'transaction', 'sécurisé', 'carte'], 10),
('Puis-je discuter avec le prestataire avant de réserver ?', 'Oui, vous pouvez envoyer un message au prestataire via notre messagerie intégrée pour discuter de votre projet avant de réserver.', ARRAY['message', 'discuter', 'communication', 'avant', 'réservation'], 10),
('Comment fonctionne la géolocalisation ?', 'SERVIO utilise votre position pour trouver des prestataires près de chez vous. Vous pouvez également rechercher dans une ville ou région spécifique.', ARRAY['géolocalisation', 'position', 'près', 'localisation', 'carte'], 5),
('SERVIO propose-t-il des garanties ?', 'Oui, nous offrons une protection acheteur et une assurance sur certains services. Consultez les conditions pour plus de détails.', ARRAY['garantie', 'assurance', 'protection', 'risque', 'couverture'], 5),
('Comment puis-je signaler un problème ?', 'Si vous rencontrez un problème avec un prestataire ou un service, utilisez le bouton de signalement sur le profil ou contactez notre support.', ARRAY['signaler', 'problème', 'plainte', 'abus', 'réclamation'], 10),
('SERVIO est-il disponible en anglais ?', 'Actuellement, SERVIO est principalement disponible en français. Nous travaillons à ajouter d''autres langues à l''avenir.', ARRAY['anglais', 'langue', 'traduction', 'english', 'multilingue'], 5),

-- Questions sur les réservations (20)
('Comment réserver un service ?', 'Pour réserver : 1) Trouvez un prestataire, 2) Cliquez sur "Réserver", 3) Choisissez date/heure, 4) Confirmez et payez. Vous recevrez une confirmation par email.', ARRAY['réserver', 'booking', 'réservation', 'comment', 'processus'], 10),
('Puis-je modifier ma réservation ?', 'Les modifications de réservation dépendent du prestataire. Contactez-le via la messagerie pour demander un changement de date ou d''heure.', ARRAY['modifier', 'changer', 'date', 'heure', 'modification'], 10),
('Que se passe-t-il si le prestataire annule ?', 'Si le prestataire annule, vous serez remboursé intégralement. Nous vous aiderons à trouver un autre prestataire si nécessaire.', ARRAY['annulation', 'prestataire', 'remboursement', 'problème', 'solution'], 10),
('Comment voir mes réservations ?', 'Connectez-vous à votre compte et allez dans la section "Mes réservations" pour voir toutes vos réservations actuelles et passées.', ARRAY['réservations', 'mes', 'historique', 'voir', 'compte'], 10),
('Puis-je réserver pour quelqu''un d''autre ?', 'Oui, vous pouvez réserver un service pour une autre personne. Indiquez simplement les informations du bénéficiaire lors de la réservation.', ARRAY['autre', 'personne', 'tiers', 'cadeau', 'bénéficiaire'], 5),
('Y a-t-il des frais de réservation ?', 'SERVIO ne facture pas de frais de réservation aux clients. Vous payez uniquement le prix du service indiqué par le prestataire.', ARRAY['frais', 'coût', 'réservation', 'supplément', 'commission'], 10),
('Comment confirmer une réservation ?', 'Après avoir choisi date/heure et payé, votre réservation est automatiquement confirmée. Vous recevrez un email de confirmation avec tous les détails.', ARRAY['confirmer', 'confirmation', 'email', 'détails', 'validation'], 10),
('Puis-je réserver plusieurs services ?', 'Oui, vous pouvez réserver autant de services que vous le souhaitez avec différents prestataires.', ARRAY['plusieurs', 'multiple', 'services', 'prestataires', 'différents'], 5),
('Comment fonctionne le calendrier de réservation ?', 'Le calendrier affiche les disponibilités du prestataire en temps réel. Sélectionnez une date et une heure créneau pour réserver.', ARRAY['calendrier', 'disponibilité', 'créneau', 'horaire', 'planning'], 10),
('Puis-je réserver en urgence ?', 'Certains prestataires proposent des créneaux d''urgence. Filtrez votre recherche par "disponible immédiatement" pour les trouver.', ARRAY['urgence', 'immédiat', 'rapide', 'dernière minute', 'urgent'], 5),
('Comment fonctionne le rappel de réservation ?', 'Vous recevrez des rappels par email et notification 24h avant votre réservation pour ne pas l''oublier.', ARRAY['rappel', 'notification', 'email', 'avant', 'oubli'], 5),
('Puis-je réserver un service récurrent ?', 'Pour les services récurrents, contactez directement le prestataire via la messagerie pour organiser un abonnement ou des réservations multiples.', ARRAY['récurrent', 'abonnement', 'régulier', 'mensuel', 'périodique'], 5),
('Comment annuler une réservation en cours ?', 'Allez dans "Mes réservations", sélectionnez la réservation et cliquez sur "Annuler". Suivez les instructions selon la politique du prestataire.', ARRAY['annuler', 'en cours', 'mes réservations', 'bouton', 'instructions'], 10),
('Y a-t-il une limite de réservation ?', 'Non, il n''y a pas de limite au nombre de réservations que vous pouvez effectuer.', ARRAY['limite', 'maximum', 'nombre', 'restriction', 'illimité'], 5),
('Comment fonctionne la validation de réservation ?', 'La réservation est validée dès le paiement. Le prestataire reçoit alors une notification et confirmera sa disponibilité.', ARRAY['validation', 'paiement', 'notification', 'prestataire', 'confirmation'], 10),
('Puis-je réserver sans compte ?', 'Non, vous devez créer un compte pour réserver un service. Cela garantit la sécurité et permet le suivi de vos réservations.', ARRAY['sans compte', 'anonyme', 'inscription', 'obligatoire', 'sécurité'], 10),
('Comment réserver un service spécifique ?', 'Utilisez la barre de recherche pour trouver le service souhaité, puis filtrez par catégorie, localisation et prix pour trouver le prestataire idéal.', ARRAY['spécifique', 'recherche', 'filtre', 'catégorie', 'prix'], 10),
('Puis-je réserver pour une entreprise ?', 'Oui, les entreprises peuvent créer un compte professionnel et réserver des services pour leurs besoins.', ARRAY['entreprise', 'professionnel', 'b2b', 'société', 'corporate'], 5),
('Comment fonctionne le suivi de réservation ?', 'Suivez l''état de votre réservation dans "Mes réservations" : en attente, confirmé, en cours, terminé, annulé.', ARRAY['suivi', 'état', 'statut', 'mes réservations', 'avancement'], 10),
('Puis-je ajouter des notes à ma réservation ?', 'Oui, lors de la réservation, vous pouvez ajouter des notes pour le prestataire concernant vos besoins ou préférences.', ARRAY['notes', 'commentaires', 'préférences', 'besoins', 'détails'], 5),

-- Questions sur les paiements (20)
('Quels moyens de paiement sont acceptés ?', 'Nous acceptons les cartes bancaires (Visa, Mastercard), PayPal, et les paiements mobiles selon votre pays.', ARRAY['paiement', 'carte', 'visa', 'mastercard', 'paypal'], 10),
('Le paiement est-il sécurisé ?', 'Oui, tous les paiements sont sécurisés via SSL et conformes aux normes PCI-DSS. Nous ne stockons jamais vos informations bancaires.', ARRAY['sécurisé', 'ssl', 'pci-dss', 'bancaire', 'norme'], 10),
('Comment obtenir un remboursement ?', 'En cas d''annulation ou de problème, contactez le support. Les remboursements sont traités sous 5-10 jours ouvrés selon votre moyen de paiement.', ARRAY['remboursement', 'argent', 'retour', 'délai', 'support'], 10),
('Y a-t-il des frais cachés ?', 'Non, le prix affiché est le prix final. Aucun frais caché ni surprise à payer.', ARRAY['frais', 'caché', 'surprise', 'transparence', 'final'], 10),
('Comment fonctionne la facturation ?', 'Une facture est générée automatiquement après chaque paiement et envoyée par email. Vous pouvez également la télécharger depuis votre compte.', ARRAY['facture', 'facturation', 'email', 'télécharger', 'compte'], 10),
('Puis-je payer en plusieurs fois ?', 'Certains prestataires acceptent le paiement en plusieurs fois. Cette option est indiquée sur leur profil si disponible.', ARRAY['plusieurs fois', 'échéances', 'fractionné', 'mensualités', 'paiement'], 5),
('Comment fonctionne le système de commission ?', 'Les prestataires paient une commission de 15% sur chaque réservation (10% pour les abonnés PRO). Les clients ne paient aucune commission.', ARRAY['commission', 'prestataire', 'pourcentage', 'pro', 'tarif'], 10),
('Puis-je avoir une déduction fiscale ?', 'Pour les services professionnels, une facture avec TVA peut être fournie sur demande. Consultez un comptable pour les déductions fiscales.', ARRAY['fiscal', 'tva', 'déduction', 'facture', 'comptable'], 5),
('Comment fonctionne le paiement au prestataire ?', 'Le prestataire reçoit le paiement après completion du service, moins la commission de plateforme. Le transfert est effectué sous 48h.', ARRAY['prestataire', 'transfert', '48h', 'completion', 'commission'], 10),
('Y a-t-il une assurance paiement ?', 'Oui, nous offrons une protection acheteur qui couvre les paiements en cas de litige ou de service non rendu.', ARRAY['assurance', 'protection', 'litige', 'non rendu', 'couverture'], 10),
('Comment ajouter un moyen de paiement ?', 'Allez dans "Paramètres" > "Moyens de paiement" pour ajouter ou modifier vos cartes bancaires et comptes.', ARRAY['ajouter', 'moyen', 'paramètres', 'carte', 'compte'], 10),
('Puis-je payer en espèces ?', 'Non, tous les paiements doivent être effectués via notre plateforme pour garantir la sécurité et le suivi des transactions.', ARRAY['espèces', 'cash', 'liquide', 'physique', 'direct'], 10),
('Comment fonctionne le remboursement partiel ?', 'En cas de service partiellement rendu, un remboursement partiel peut être accordé selon les circonstances et après validation.', ARRAY['partiel', 'remboursement', 'service', 'validation', 'circonstances'], 5),
('Y a-t-il des codes promo ?', 'Les codes promo sont disponibles lors de promotions spéciales. Abonnez-vous à notre newsletter pour en être informé.', ARRAY['promo', 'code', 'réduction', 'promotion', 'newsletter'], 5),
('Comment fonctionne le paiement des acomptes ?', 'Certains prestataires demandent un acompte. Le reste est payé à la completion du service selon les conditions convenues.', ARRAY['acompte', 'avance', 'reste', 'completion', 'conditions'], 5),
('Puis-je payer pour quelqu''un d''autre ?', 'Oui, vous pouvez payer pour un tiers en utilisant votre propre moyen de paiement lors de la réservation.', ARRAY['tiers', 'autre', 'payer pour', 'quelqu''un', 'bénéficiaire'], 5),
('Comment vérifier mon historique de paiement ?', 'Allez dans "Paramètres" > "Factures" pour voir l''historique complet de vos paiements et télécharger les factures.', ARRAY['historique', 'paiement', 'factures', 'paramètres', 'télécharger'], 10),
('Y a-t-il des frais internationaux ?', 'Pour les paiements internationaux, des frais de change peuvent s''appliquer selon votre banque. SERVIO ne facture pas de frais supplémentaires.', ARRAY['international', 'frais', 'change', 'banque', 'étranger'], 5),
('Comment fonctionne le paiement des pourboires ?', 'Les pourboires sont optionnels et peuvent être ajoutés après completion du service via un lien sécurisé.', ARRAY['pourboire', 'tip', 'optionnel', 'completion', 'sécurisé'], 5),
('Puis-je obtenir un devis avant de payer ?', 'Oui, demandez un devis via la messagerie au prestataire avant de réserver. Certains services nécessitent un devis personnalisé.', ARRAY['devis', 'avant', 'payer', 'personnalisé', 'messagerie'], 10),

-- Questions sur le compte (20)
('Comment créer un compte ?', 'Cliquez sur "S''inscrire" en haut de la page, remplissez vos informations (nom, email, mot de passe), et validez votre email pour activer votre compte.', ARRAY['créer', 'compte', 'inscrire', 'inscription', 'email'], 10),
('J''ai oublié mon mot de passe', 'Cliquez sur "Mot de passe oublié" sur la page de connexion. Entrez votre email et suivez les instructions pour réinitialiser votre mot de passe.', ARRAY['oublié', 'mot de passe', 'réinitialiser', 'connexion', 'email'], 10),
('Comment modifier mon profil ?', 'Connectez-vous et allez dans "Mon profil" pour modifier vos informations personnelles, photo et préférences.', ARRAY['modifier', 'profil', 'informations', 'photo', 'préférences'], 10),
('Comment supprimer mon compte ?', 'Pour supprimer votre compte, allez dans "Paramètres" > "Supprimer le compte". Notez que cette action est irréversible.', ARRAY['supprimer', 'compte', 'paramètres', 'irréversible', 'désinscription'], 10),
('Puis-je avoir plusieurs comptes ?', 'Non, une personne ne peut avoir qu''un seul compte. Créer plusieurs comptes est contraire à nos conditions d''utilisation.', ARRAY['plusieurs', 'comptes', 'multiple', 'conditions', 'utilisation'], 5),
('Comment changer mon email ?', 'Allez dans "Paramètres" > "Informations personnelles" pour changer votre email. Vous devrez valider la nouvelle adresse.', ARRAY['changer', 'email', 'paramètres', 'valider', 'adresse'], 10),
('Comment changer mon mot de passe ?', 'Allez dans "Paramètres" > "Sécurité" > "Changer le mot de passe". Entrez votre ancien et nouveau mot de passe.', ARRAY['changer', 'mot de passe', 'sécurité', 'paramètres', 'nouveau'], 10),
('Comment activer la 2FA ?', 'La double authentification (2FA) peut être activée dans "Paramètres" > "Sécurité" pour protéger votre compte.', ARRAY['2fa', 'double authentification', 'sécurité', 'activer', 'protection'], 5),
('Comment voir mes notifications ?', 'Les notifications apparaissent dans l''icône de cloche en haut de l''écran. Vous pouvez également les consulter dans "Paramètres" > "Notifications".', ARRAY['notifications', 'cloche', 'paramètres', 'voir', 'alertes'], 10),
('Puis-je désactiver les notifications ?', 'Oui, allez dans "Paramètres" > "Notifications" pour choisir quelles notifications recevoir et comment.', ARRAY['désactiver', 'notifications', 'paramètres', 'choisir', 'préférences'], 5),
('Comment fonctionne le profil vérifié ?', 'Un profil vérifié signifie que nous avons confirmé l''identité du prestataire. Vous pouvez voir le badge de vérification sur les profils.', ARRAY['vérifié', 'badge', 'identité', 'profil', 'confiance'], 10),
('Comment ajouter une photo de profil ?', 'Allez dans "Mon profil" > "Photo" pour télécharger une image. Les photos doivent respecter nos directives de contenu.', ARRAY['photo', 'profil', 'télécharger', 'image', 'directives'], 10),
('Puis-je masquer mon profil ?', 'Oui, vous pouvez rendre votre profil privé dans "Paramètres" > "Confidentialité". Seuls les prestataires avec qui vous avez réservé pourront vous voir.', ARRAY['masquer', 'profil', 'privé', 'confidentialité', 'paramètres'], 5),
('Comment fonctionne le mode sombre ?', 'Le mode sombre peut être activé dans "Paramètres" > "Apparence" ou via l''icône en haut de l''écran.', ARRAY['mode sombre', 'dark mode', 'apparence', 'paramètres', 'thème'], 5),
('Comment changer ma langue ?', 'La langue peut être changée dans "Paramètres" > "Langue". Actuellement, le français est la langue principale.', ARRAY['langue', 'changer', 'paramètres', 'français', 'traduction'], 5),
('Comment exporter mes données ?', 'Vous pouvez demander l''export de vos données dans "Paramètres" > "Confidentialité" > "Exporter mes données".', ARRAY['exporter', 'données', 'paramètres', 'confidentialité', 'rgpd'], 5),
('Puis-je connecter mon compte LinkedIn ?', 'Oui, vous pouvez connecter votre compte LinkedIn dans "Paramètres" > "Réseaux sociaux" pour importer votre profil.', ARRAY['linkedin', 'connecter', 'réseaux sociaux', 'importer', 'paramètres'], 5),
('Comment fonctionne l''historique des connexions ?', 'Vous pouvez voir l''historique de vos connexions dans "Paramètres" > "Sécurité" > "Historique des connexions".', ARRAY['historique', 'connexions', 'sécurité', 'paramètres', 'voir'], 5),
('Puis-je avoir un compte business ?', 'Oui, créez un compte business lors de l''inscription ou convertissez votre compte existant dans "Paramètres" > "Type de compte".', ARRAY['business', 'entreprise', 'compte pro', 'convertir', 'paramètres'], 5),
('Comment fonctionne la suppression des données ?', 'Conformément au RGPD, vous pouvez demander la suppression de vos données. Contactez le support pour procéder.', ARRAY['suppression', 'données', 'rgpd', 'support', 'conformité'], 5),

-- Questions pour les prestataires (20)
('Comment devenir prestataire ?', 'Inscrivez-vous comme prestataire, complétez votre profil avec vos services, tarifs et disponibilités. Après validation, vous pourrez recevoir des demandes.', ARRAY['devenir', 'prestataire', 'inscription', 'profil', 'validation'], 10),
('Quels sont les frais pour les prestataires ?', 'Les prestataires paient une commission de 15% sur chaque réservation (10% avec l''abonnement PRO). Aucun frais d''inscription.', ARRAY['frais', 'commission', 'prestataire', '15%', 'pro'], 10),
('Comment créer mon profil prestataire ?', 'Après inscription, suivez le guide d''onboarding pour ajouter vos informations business, services, portfolio et disponibilités.', ARRAY['profil', 'prestataire', 'créer', 'onboarding', 'services'], 10),
('Comment définir mes tarifs ?', 'Dans votre profil, ajoutez vos services avec leurs tarifs. Vous pouvez proposer différents forfaits ou tarifs horaires.', ARRAY['tarifs', 'prix', 'services', 'forfaits', 'horaire'], 10),
('Comment gérer mes disponibilités ?', 'Utilisez le calendrier dans votre tableau de bord pour définir vos créneaux disponibles. Les clients ne peuvent réserver que sur ces créneaux.', ARRAY['disponibilités', 'calendrier', 'créneaux', 'tableau de bord', 'horaires'], 10),
('Comment recevoir des réservations ?', 'Vous recevrez une notification pour chaque nouvelle réservation. Acceptez ou refusez selon votre disponibilité.', ARRAY['réservations', 'recevoir', 'notification', 'accepter', 'refuser'], 10),
('Comment communiquer avec les clients ?', 'Utilisez notre messagerie intégrée pour discuter avec les clients avant et après les réservations.', ARRAY['communiquer', 'messagerie', 'clients', 'discuter', 'intégrée'], 10),
('Puis-je refuser une réservation ?', 'Oui, vous pouvez refuser une réservation si vous n''êtes pas disponible. Expliquez le motif au client via la messagerie.', ARRAY['refuser', 'réservation', 'disponible', 'motif', 'messagerie'], 10),
('Comment fonctionne le profil vérifié ?', 'Pour obtenir le badge vérifié, soumettez vos documents d''identité et qualifications. Nous vérifierons votre authenticité.', ARRAY['vérifié', 'badge', 'documents', 'identité', 'qualifications'], 10),
('Comment ajouter mon portfolio ?', 'Dans votre profil, ajoutez des photos et descriptions de vos travaux précédents pour montrer votre expertise.', ARRAY['portfolio', 'photos', 'travaux', 'expertise', 'ajouter'], 10),
('Comment obtenir des avis ?', 'Les clients peuvent laisser des avis après chaque service. Encouragez-les à noter votre travail pour améliorer votre visibilité.', ARRAY['avis', 'notation', 'clients', 'visibilité', 'note'], 10),
('Comment fonctionne le classement ?', 'Les prestataires sont classés selon plusieurs critères : notes, nombre de réservations, taux de réponse, et mise en avant PRO.', ARRAY['classement', 'critères', 'notes', 'réservations', 'taux de réponse'], 10),
('Qu''est-ce que l''abonnement PRO ?', 'L''abonnement PRO réduit votre commission à 10%, vous donne une mise en avant dans les résultats, et des avantages supplémentaires.', ARRAY['pro', 'abonnement', 'commission', 'avantages', 'mise en avant'], 10),
('Comment s''abonner à SERVIO PRO ?', 'Allez dans "Abonnement" dans votre tableau de bord pour choisir le plan PRO et activer les avantages.', ARRAY['abonner', 'pro', 'tableau de bord', 'plan', 'activer'], 10),
('Comment fonctionne la mise en avant ?', 'Les prestataires PRO sont mis en avant dans les résultats de recherche et reçoivent plus de visibilité.', ARRAY['mise en avant', 'pro', 'visibilité', 'résultats', 'recherche'], 10),
('Puis-je proposer des promotions ?', 'Oui, vous pouvez créer des codes promo et offres spéciales dans votre tableau de bord pour attirer plus de clients.', ARRAY['promotions', 'codes promo', 'offres', 'tableau de bord', 'clients'], 5),
('Comment suivre mes revenus ?', 'Votre tableau de bord affiche vos revenus, commissions et paiements en temps réel. Des factures détaillées sont disponibles.', ARRAY['revenus', 'tableau de bord', 'commissions', 'paiements', 'factures'], 10),
('Comment fonctionne le support prestataire ?', 'Un support dédié est disponible pour les prestataires PRO. Contactez-nous via le formulaire de contact prestataire.', ARRAY['support', 'prestataire', 'dédié', 'pro', 'contact'], 5),
('Puis-je avoir plusieurs catégories ?', 'Oui, vous pouvez proposer des services dans plusieurs catégories pertinentes à votre expertise.', ARRAY['catégories', 'plusieurs', 'services', 'expertise', 'pertinentes'], 5),
('Comment optimiser mon profil ?', 'Utilisez des photos professionnelles, décrivez clairement vos services, obtenez des avis positifs, et maintenez un taux de réponse élevé.', ARRAY['optimiser', 'profil', 'photos', 'avis', 'taux de réponse'], 10);
