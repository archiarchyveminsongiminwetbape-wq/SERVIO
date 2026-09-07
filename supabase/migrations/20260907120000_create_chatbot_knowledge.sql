-- SERVIO chatbot knowledge base
-- Generates 1,488 ready-to-use question/answer entries from 31 validated intents.

CREATE TABLE IF NOT EXISTS public.chatbot_knowledge (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL UNIQUE,
  answer text NOT NULL,
  intent text NOT NULL,
  keywords text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chatbot_knowledge_intent ON public.chatbot_knowledge(intent);
CREATE INDEX IF NOT EXISTS idx_chatbot_knowledge_active ON public.chatbot_knowledge(is_active);

ALTER TABLE public.chatbot_knowledge ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chatbot_knowledge_public_read" ON public.chatbot_knowledge;
CREATE POLICY "chatbot_knowledge_public_read" ON public.chatbot_knowledge
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "chatbot_knowledge_admin_write" ON public.chatbot_knowledge;
CREATE POLICY "chatbot_knowledge_admin_write" ON public.chatbot_knowledge
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

WITH intents(intent, subject, answer, keywords) AS (
  VALUES
    ('account.create', 'creer un compte client', 'Cliquez sur « S inscrire », renseignez votre nom, votre email et un mot de passe d au moins 8 caracteres, puis confirmez votre adresse email si necessaire.', ARRAY['compte','creer','inscrire']),
    ('account.login', 'me connecter a mon compte', 'Ouvrez « Connexion », saisissez votre email et votre mot de passe, puis validez. Utilisez « Mot de passe oublie » si vous ne pouvez plus vous connecter.', ARRAY['connexion','connecter','compte']),
    ('account.password', 'changer mon mot de passe', 'Depuis la page de connexion, cliquez sur « Mot de passe oublie » et suivez le lien recu par email. Ne partagez jamais ce lien.', ARRAY['mot','passe','changer']),
    ('account.email', 'modifier mon adresse email', 'Modifiez votre email dans les parametres, puis confirmez la nouvelle adresse. Contactez le support si l ancienne adresse est inaccessible.', ARRAY['email','adresse','modifier']),
    ('account.delete', 'supprimer mon compte', 'Demandez la suppression depuis les parametres ou au support SERVIO. Telechargez vos factures et verifiez vos reservations avant la suppression.', ARRAY['supprimer','compte','donnees']),
    ('provider.register', 'devenir prestataire', 'Creez un compte, choisissez le role prestataire et completez votre profil avec activite, competences, experience, photos et disponibilites. Le profil sera soumis a validation.', ARRAY['prestataire','devenir','inscription']),
    ('provider.profile', 'completer mon profil professionnel', 'Ouvrez « Modifier mon profil » et renseignez presentation, competences, langues, zone de service, tarifs, photos et disponibilites.', ARRAY['profil','professionnel','completer']),
    ('provider.edit', 'modifier mon profil prestataire', 'Depuis le tableau de bord prestataire, ouvrez « Modifier mon profil », changez les informations puis enregistrez.', ARRAY['profil','modifier','prestataire']),
    ('provider.validation', 'faire valider mon profil', 'Completez les informations demandees et envoyez des photos lisibles. Le statut se consulte dans le tableau de bord; contactez le support si l attente se prolonge.', ARRAY['validation','profil','approuver']),
    ('provider.visibility', 'rendre mon profil visible', 'Un profil doit etre complet et approuve pour apparaitre dans les resultats publics. Verifiez validation, categorie, ville et disponibilites.', ARRAY['visible','profil','recherche']),
    ('provider.availability', 'gerer mes disponibilites', 'Mettez a jour vos jours, horaires et statut disponible dans le tableau de bord. Gardez ces informations a jour pour eviter les demandes impossibles.', ARRAY['disponibilite','horaire','calendrier']),
    ('provider.portfolio', 'ajouter des projets a mon portfolio', 'Ajoutez des projets avec titre, description et images dont vous detenez les droits. Des exemples pertinents aident les clients a choisir.', ARRAY['portfolio','projet','photo']),
    ('provider.price', 'definir mes tarifs', 'Indiquez une fourchette claire et precisez ce qui est inclus. Confirmez les details avec le client avant la reservation.', ARRAY['tarif','prix','prestataire']),
    ('provider.badges', 'obtenir un badge de profil', 'Les badges sont attribues selon verification, qualite des informations et respect des regles SERVIO. Ils ne peuvent pas etre achetes.', ARRAY['badge','verifie','profil']),
    ('search.find', 'trouver un prestataire', 'Utilisez la recherche avec mot-cle, categorie ou ville, puis comparez competences, avis, tarifs et disponibilites des profils approuves.', ARRAY['trouver','chercher','prestataire']),
    ('search.filter', 'filtrer les prestataires', 'Utilisez les filtres de categorie, ville, note, disponibilite et service a distance. Combinez plusieurs filtres pour des resultats pertinents.', ARRAY['filtrer','recherche','ville']),
    ('search.remote', 'trouver un service a distance', 'Activez le filtre « Service a distance » et verifiez dans le profil les outils ou conditions necessaires. Confirmez les modalites avant de reserver.', ARRAY['distance','remote','ligne']),
    ('booking.create', 'reserver un service', 'Ouvrez un profil approuve, consultez les disponibilites, cliquez sur « Reserver », choisissez le creneau et verifiez le prix avant de confirmer.', ARRAY['reserver','reservation','service']),
    ('booking.calendar', 'choisir un creneau', 'Les creneaux libres apparaissent sur le calendrier du prestataire. Verifiez votre fuseau horaire et envoyez les informations utiles.', ARRAY['creneau','calendrier','rendez']),
    ('booking.cancel', 'annuler une reservation', 'Ouvrez « Mes reservations », selectionnez la reservation puis choisissez « Annuler ». Les frais et conditions dependent du delai et du service.', ARRAY['annuler','reservation','remboursement']),
    ('booking.modify', 'modifier une reservation', 'Contactez le prestataire et demandez un autre creneau. Si necessaire, annulez selon les conditions affichees et creez une nouvelle demande.', ARRAY['modifier','reservation','date']),
    ('booking.status', 'connaitre le statut de ma reservation', 'Consultez « Mes reservations » pour voir si la demande est en attente, acceptee, terminee ou annulee. Les changements peuvent apparaitre dans les notifications.', ARRAY['statut','reservation','suivi']),
    ('payment.methods', 'payer une reservation', 'Les moyens disponibles sont presentes au moment de la reservation selon votre pays. Le paiement est traite de maniere securisee.', ARRAY['paiement','payer','carte']),
    ('payment.failed', 'resoudre un paiement refuse', 'Verifiez carte, plafond, connexion et fonds, puis reessayez une fois. Si le probleme continue, contactez votre banque et le support SERVIO.', ARRAY['paiement','refuse','erreur']),
    ('payment.refund', 'demander un remboursement', 'Consultez les conditions d annulation puis envoyez votre reference au support SERVIO. Le remboursement depend du statut et des conditions du service.', ARRAY['remboursement','rembourser','paiement']),
    ('invoice.download', 'telecharger une facture', 'Ouvrez « Factures », selectionnez la transaction puis telechargez le document. Contactez le support si la facture attendue n apparait pas.', ARRAY['facture','telecharger','pdf']),
    ('messages.contact', 'contacter un prestataire', 'Depuis son profil, utilisez le bouton de contact ou message. Restez dans la messagerie SERVIO et ne partagez jamais vos donnees bancaires.', ARRAY['message','contacter','prestataire']),
    ('reviews.write', 'laisser un avis', 'Apres le service, ouvrez la reservation terminee et choisissez l option d avis. Soyez precis, honnete et respectueux.', ARRAY['avis','noter','evaluation']),
    ('reviews.reply', 'repondre a un avis', 'Les prestataires peuvent repondre depuis leur espace avec un message professionnel et factuel, sans divulguer de donnees personnelles.', ARRAY['repondre','avis','prestataire']),
    ('security.data', 'proteger mes donnees', 'Utilisez un mot de passe unique et ne partagez jamais vos identifiants. SERVIO ne vous demandera pas votre mot de passe dans la messagerie.', ARRAY['securite','donnees','confidentialite']),
    ('support.contact', 'contacter le support', 'Indiquez votre email de compte, la page, l action, le message d erreur et une capture sans information sensible pour obtenir une aide efficace.', ARRAY['support','aide','contact'])
), openers(opener) AS (
  VALUES ('Comment'), ('Pouvez-vous m expliquer comment'), ('Je voudrais savoir comment'), ('Quelle est la procedure pour'), ('Que dois-je faire pour'), ('Est-ce possible de'), ('Je cherche a savoir comment'), ('Aidez-moi a')
), closers(closer) AS (
  VALUES (''), ('sur SERVIO'), ('depuis mon compte'), ('en toute securite'), ('rapidement'), ('sans erreur')
)
INSERT INTO public.chatbot_knowledge (question, answer, intent, keywords)
SELECT DISTINCT
  opener || ' ' || subject || CASE WHEN closer = '' THEN '' ELSE ' ' || closer END || ' ?',
  answer,
  intent,
  keywords
FROM intents
CROSS JOIN openers
CROSS JOIN closers
ON CONFLICT (question) DO UPDATE SET
  answer = EXCLUDED.answer,
  intent = EXCLUDED.intent,
  keywords = EXCLUDED.keywords,
  is_active = true,
  updated_at = now();

COMMENT ON TABLE public.chatbot_knowledge IS 'Knowledge base SERVIO: generated question variants and validated answers for the chatbot.';
