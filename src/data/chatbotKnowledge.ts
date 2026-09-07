export interface ChatbotKnowledgeEntry {
  question: string;
  answer: string;
  intent: string;
  keywords: string[];
}

interface KnowledgeIntent {
  intent: string;
  subject: string;
  keywords: string[];
  answer: string;
}

const questionOpeners = [
  'Comment',
  'Pouvez-vous m expliquer comment',
  'Je voudrais savoir comment',
  'Quelle est la procedure pour',
  'Que dois-je faire pour',
  'Est-ce possible de',
  'Je cherche a savoir comment',
  'Aidez-moi a',
];

const questionClosers = [
  '',
  'sur SERVIO',
  'depuis mon compte',
  'en toute securite',
  'rapidement',
  'sans erreur',
];

const knowledgeIntents: KnowledgeIntent[] = [
  { intent: 'account.create', subject: 'creer un compte client', keywords: ['compte', 'creer', 'inscrire'], answer: 'Cliquez sur « S inscrire », choisissez votre profil, renseignez votre nom, votre email et un mot de passe d au moins 8 caracteres, puis confirmez votre adresse email si SERVIO le demande.' },
  { intent: 'account.login', subject: 'me connecter a mon compte', keywords: ['connexion', 'connecter', 'compte'], answer: 'Ouvrez la page « Connexion », saisissez l email et le mot de passe de votre compte, puis validez. Si vous avez oublie votre mot de passe, utilisez le lien « Mot de passe oublie ».' },
  { intent: 'account.password', subject: 'changer mon mot de passe', keywords: ['mot', 'passe', 'changer'], answer: 'Depuis la page de connexion, cliquez sur « Mot de passe oublie » et suivez le lien recu par email. Ne partagez jamais ce lien ni votre nouveau mot de passe.' },
  { intent: 'account.email', subject: 'modifier mon adresse email', keywords: ['email', 'adresse', 'modifier'], answer: 'Modifiez votre adresse email dans les parametres du compte, puis confirmez la nouvelle adresse si un email de verification est envoye. Contactez le support si l ancienne adresse est inaccessible.' },
  { intent: 'account.delete', subject: 'supprimer mon compte', keywords: ['supprimer', 'compte', 'donnees'], answer: 'Demandez la suppression de votre compte depuis les parametres ou au support SERVIO. Avant la suppression, telechargez vos factures et verifiez vos reservations en cours.' },
  { intent: 'provider.register', subject: 'devenir prestataire', keywords: ['prestataire', 'devenir', 'inscription'], answer: 'Creez un compte, choisissez le role prestataire et completez votre profil avec votre activite, vos competences, votre experience, vos photos et vos disponibilites. Le profil est ensuite soumis a validation.' },
  { intent: 'provider.profile', subject: 'completer mon profil professionnel', keywords: ['profil', 'professionnel', 'completer'], answer: 'Ouvrez « Modifier mon profil » et renseignez votre presentation, vos competences, vos langues, votre zone de service, vos tarifs, vos photos et vos disponibilites. Un profil complet inspire davantage confiance.' },
  { intent: 'provider.edit', subject: 'modifier mon profil prestataire', keywords: ['profil', 'modifier', 'prestataire'], answer: 'Depuis le tableau de bord prestataire, ouvrez « Modifier mon profil », changez les informations souhaitees puis enregistrez. Les changements importants peuvent etre reverifies avant publication.' },
  { intent: 'provider.validation', subject: 'faire valider mon profil', keywords: ['validation', 'profil', 'approuver'], answer: 'Completez toutes les informations demandees et envoyez des photos professionnelles et lisibles. Le statut de validation se consulte dans le tableau de bord; contactez le support si l attente se prolonge.' },
  { intent: 'provider.visibility', subject: 'rendre mon profil visible', keywords: ['visible', 'profil', 'recherche'], answer: 'Un profil prestataire doit etre complet et approuve pour apparaitre dans les resultats publics. Verifiez votre statut de validation, votre categorie, votre ville et vos disponibilites.' },
  { intent: 'provider.availability', subject: 'gerer mes disponibilites', keywords: ['disponibilite', 'horaire', 'calendrier'], answer: 'Dans votre tableau de bord, mettez a jour vos jours et horaires disponibles ainsi que votre statut disponible, occupe ou indisponible. Gardez ces informations a jour pour eviter les demandes impossibles.' },
  { intent: 'provider.portfolio', subject: 'ajouter des projets a mon portfolio', keywords: ['portfolio', 'projet', 'photo'], answer: 'Ajoutez des projets depuis la section Portfolio, avec un titre, une description et des images dont vous detenez les droits. Des exemples pertinents aident les clients a choisir.' },
  { intent: 'provider.price', subject: 'definir mes tarifs', keywords: ['tarif', 'prix', 'prestataire'], answer: 'Indiquez une fourchette de prix claire et precisez ce qui est inclus. Les tarifs doivent rester realistes et peuvent etre confirmes avec le client avant la reservation.' },
  { intent: 'provider.badges', subject: 'obtenir un badge de profil', keywords: ['badge', 'verifie', 'profil'], answer: 'Les badges sont attribues selon les criteres de SERVIO, comme la verification du profil, la qualite des informations et le respect des regles. Ils ne peuvent pas etre achetes.' },
  { intent: 'search.find', subject: 'trouver un prestataire', keywords: ['trouver', 'chercher', 'prestataire'], answer: 'Utilisez la recherche SERVIO avec un mot-cle, une categorie ou une ville, puis comparez les competences, les avis, les tarifs et les disponibilites des profils approuves.' },
  { intent: 'search.filter', subject: 'filtrer les prestataires', keywords: ['filtrer', 'recherche', 'ville'], answer: 'Dans la recherche, utilisez les filtres de categorie, ville, note, disponibilite et service a distance. Combinez plusieurs filtres pour obtenir des resultats plus pertinents.' },
  { intent: 'search.remote', subject: 'trouver un service a distance', keywords: ['distance', 'remote', 'en ligne'], answer: 'Activez le filtre « Service a distance » dans la recherche et verifiez dans le profil les outils ou conditions necessaires. Confirmez les modalites avec le prestataire avant de reserver.' },
  { intent: 'booking.create', subject: 'reserver un service', keywords: ['reserver', 'reservation', 'service'], answer: 'Ouvrez le profil d un prestataire approuve, consultez ses disponibilites, cliquez sur « Reserver », choisissez le creneau et verifiez le prix et les details avant de confirmer.' },
  { intent: 'booking.calendar', subject: 'choisir un creneau', keywords: ['creneau', 'calendrier', 'rendez'], answer: 'Les creneaux disponibles apparaissent sur le calendrier du prestataire. Choisissez une date libre, verifiez votre fuseau horaire et envoyez la demande avec des informations utiles.' },
  { intent: 'booking.cancel', subject: 'annuler une reservation', keywords: ['annuler', 'reservation', 'remboursement'], answer: 'Ouvrez « Mes reservations », selectionnez la reservation puis choisissez « Annuler ». Les frais et les conditions de remboursement dependent du delai et du service concerne.' },
  { intent: 'booking.modify', subject: 'modifier une reservation', keywords: ['modifier', 'reservation', 'date'], answer: 'Contactez le prestataire depuis la conversation et demandez un autre creneau. Si la modification n est pas possible, annulez la reservation selon les conditions affichees et creez une nouvelle demande.' },
  { intent: 'booking.status', subject: 'connaitre le statut de ma reservation', keywords: ['statut', 'reservation', 'suivi'], answer: 'Consultez la rubrique « Mes reservations » pour voir si la demande est en attente, acceptee, terminee ou annulee. Les changements importants peuvent aussi etre signales dans vos notifications.' },
  { intent: 'payment.methods', subject: 'payer une reservation', keywords: ['paiement', 'payer', 'carte'], answer: 'Les moyens de paiement disponibles sont presentes au moment de la reservation selon votre pays. Le paiement est traite de maniere securisee par le prestataire de paiement configure par SERVIO.' },
  { intent: 'payment.failed', subject: 'resoudre un paiement refuse', keywords: ['paiement', 'refuse', 'erreur'], answer: 'Verifiez les informations de paiement, le plafond de la carte, la connexion et les fonds disponibles, puis reessayez une seule fois. Si le probleme continue, contactez votre banque et le support SERVIO.' },
  { intent: 'payment.refund', subject: 'demander un remboursement', keywords: ['remboursement', 'rembourser', 'paiement'], answer: 'Consultez d abord les conditions d annulation de la reservation, puis envoyez une demande avec votre reference au support SERVIO. Le remboursement depend du statut et des conditions du service.' },
  { intent: 'invoice.download', subject: 'telecharger une facture', keywords: ['facture', 'telecharger', 'pdf'], answer: 'Ouvrez la rubrique « Factures », selectionnez la transaction concernee puis telechargez le document disponible. Contactez le support si une facture attendue n apparait pas.' },
  { intent: 'messages.contact', subject: 'contacter un prestataire', keywords: ['message', 'contacter', 'prestataire'], answer: 'Depuis le profil du prestataire, utilisez le bouton de contact ou de message. Restez dans la messagerie SERVIO et ne partagez pas de mot de passe ni de donnees bancaires.' },
  { intent: 'reviews.write', subject: 'laisser un avis', keywords: ['avis', 'noter', 'evaluation'], answer: 'Apres la realisation du service, ouvrez la reservation terminee et choisissez l option pour laisser une note et un commentaire. Soyez precis, honnete et respectueux.' },
  { intent: 'reviews.reply', subject: 'repondre a un avis', keywords: ['repondre', 'avis', 'prestataire'], answer: 'Les prestataires peuvent repondre aux avis depuis leur espace, avec un message professionnel et factuel. N indiquez jamais de donnees personnelles du client.' },
  { intent: 'security.data', subject: 'proteger mes donnees', keywords: ['securite', 'donnees', 'confidentialite'], answer: 'Utilisez un mot de passe unique, activez les protections disponibles et ne partagez jamais vos identifiants. SERVIO ne vous demandera pas votre mot de passe dans la messagerie.' },
  { intent: 'support.contact', subject: 'contacter le support', keywords: ['support', 'aide', 'contact'], answer: 'Pour obtenir une aide efficace, indiquez votre email de compte, la page concernee, l action effectuee, le message d erreur et, si possible, une capture sans information sensible.' },
];

const buildKnowledgeBase = (): ChatbotKnowledgeEntry[] => knowledgeIntents.flatMap(item =>
  questionOpeners.flatMap(opener => questionClosers.map(closer => ({
    question: `${opener} ${item.subject}${closer ? ` ${closer}` : ''} ?`,
    answer: item.answer,
    intent: item.intent,
    keywords: item.keywords,
  }))),
);

export const CHATBOT_KNOWLEDGE_BASE = buildKnowledgeBase();

export const CHATBOT_KNOWLEDGE_COUNT = CHATBOT_KNOWLEDGE_BASE.length;