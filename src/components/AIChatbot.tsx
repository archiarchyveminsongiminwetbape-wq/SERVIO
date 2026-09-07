import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Bot, Trash2, ThumbsUp, ThumbsDown } from 'lucide-react';
import { HfInference } from '@huggingface/inference';
import { supabase } from '@/lib/supabase';

const hf = new HfInference(import.meta.env.VITE_HUGGINGFACE_API_KEY || '');

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface KnowledgeIntent {
  keywords: string[];
  examples: string[];
  answer: string;
}

const FAQ_KNOWLEDGE_BASE: KnowledgeIntent[] = [
  { keywords: ['creer', 'compte', 'inscrire'], examples: ['je veux ouvrir un compte', 'comment faire pour m inscrire', 'nouveau compte client'], answer: 'Pour créer un compte sur SERVIO, cliquez sur « S\'inscrire », renseignez vos informations, puis confirmez votre adresse email si cela vous est demandé.' },
  { keywords: ['devenir', 'prestataire', 'proposer', 'service'], examples: ['je veux vendre mes services', 'comment travailler sur servio', 'inscription professionnelle'], answer: 'Créez un compte, choisissez le rôle prestataire, puis complétez votre profil professionnel avec vos compétences, votre expérience et votre portfolio. Après envoi, le profil est soumis à validation.' },
  { keywords: ['reserver', 'reservation', 'service', 'rendez', 'disponibilite'], examples: ['je veux prendre rendez vous', 'comment commander une prestation', 'trouver un professionnel'], answer: 'Recherchez un prestataire, consultez son profil et ses disponibilités, puis cliquez sur « Réserver ». Sélectionnez le créneau, vérifiez les détails et confirmez la demande.' },
  { keywords: ['paiement', 'payer', 'carte', 'stripe', 'mobile', 'money'], examples: ['comment payer', 'ma carte est refusee', 'payer avec mobile money'], answer: 'Les moyens de paiement disponibles dépendent de votre région et sont affichés lors de la réservation. Le paiement est traité de façon sécurisée par Stripe.' },
  { keywords: ['annuler', 'annulation', 'rembourser'], examples: ['je ne veux plus la reservation', 'est ce que je peux etre rembourse', 'supprimer une commande'], answer: 'Ouvrez « Mes réservations », sélectionnez la réservation concernée et choisissez « Annuler ». Les conditions et éventuels frais dépendent du délai et du service.' },
  { keywords: ['facture', 'facturation', 'pdf'], examples: ['ou trouver ma facture', 'telecharger un justificatif', 'besoin de facture'], answer: 'Les factures disponibles se trouvent dans la rubrique « Factures » de votre compte, une fois le service complété ou le paiement confirmé.' },
  { keywords: ['abonnement', 'plan', 'forfait'], examples: ['quels sont les tarifs pro', 'je veux un abonnement', 'offre pour prestataire'], answer: 'Les abonnements SERVIO peuvent offrir davantage de visibilité et de fonctionnalités. Consultez la page « Abonnement » pour voir les offres actuellement disponibles.' },
  { keywords: ['support', 'aide', 'probleme', 'contact'], examples: ['je dois parler au support', 'le site ne marche pas', 'j ai une erreur'], answer: 'Décrivez votre problème avec l\'adresse email de votre compte, la page concernée et le message affiché. Pour une assistance humaine, contactez le support de SERVIO.' },
  { keywords: ['securite', 'donnees', 'rgpd', 'confidentialite'], examples: ['mes informations sont elles protegees', 'qui voit mes donnees', 'politique de confidentialite'], answer: 'SERVIO protège les échanges et limite l\'accès aux données selon les permissions du compte. Ne partagez jamais votre mot de passe ou vos informations de paiement dans le chat.' },
  { keywords: ['avis', 'note', 'evaluation'], examples: ['comment noter un prestataire', 'laisser un commentaire', 'donner mon avis'], answer: 'Vous pouvez laisser un avis après la réalisation d\'un service. Les avis doivent rester factuels et respectueux ; le prestataire peut ensuite y répondre.' },
  { keywords: ['profil', 'modifier', 'photo', 'competence'], examples: ['changer mon profil professionnel', 'modifier mes informations', 'ajouter une photo'], answer: 'Depuis votre espace, ouvrez « Modifier mon profil » pour mettre à jour votre présentation, vos compétences, vos photos et vos disponibilités, puis enregistrez les changements.' },
  { keywords: ['validation', 'approuve', 'verifie', 'visible'], examples: ['pourquoi mon profil n apparait pas', 'combien de temps pour valider', 'profil prestataire en attente'], answer: 'Un profil prestataire devient visible après validation. Vérifiez que les informations et photos demandées sont complètes ; si le statut reste en attente, contactez le support avec votre identifiant de compte.' },
];

const QUICK_QUESTIONS = ['Comment réserver un service ?', 'Comment devenir prestataire ?', 'Je rencontre un problème de paiement'];
const CHAT_HISTORY_KEY = 'servio-chatbot-history-v1';
const SEARCH_TERMS = new Set(['cherche', 'chercher', 'trouve', 'trouver', 'prestataire', 'prestataires', 'professionnel', 'professionnels', 'service', 'services', 'besoin', 'veux', 'voudrais', 'dans', 'ville', 'a', 'au', 'en']);
const INITIAL_MESSAGE: Message = { role: 'assistant', content: 'Bonjour ! Je suis l\'assistant virtuel SERVIO. Comment puis-je vous aider aujourd\'hui ?' };

const normalizeText = (value: string) => value
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9\s]/g, ' ')
  .trim();

const STOP_WORDS = new Set(['a', 'au', 'aux', 'avec', 'comment', 'dans', 'de', 'des', 'du', 'en', 'et', 'je', 'la', 'le', 'les', 'moi', 'pour', 'que', 'sur', 'un', 'une', 'vous']);

const getWords = (value: string) => normalizeText(value)
  .split(/\s+/)
  .filter(word => word.length > 2 && !STOP_WORDS.has(word));

const levenshteinDistance = (left: string, right: string): number => {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);

  for (let row = 1; row <= left.length; row += 1) {
    let diagonal = previous[0];
    previous[0] = row;

    for (let column = 1; column <= right.length; column += 1) {
      const above = previous[column];
      previous[column] = left[row - 1] === right[column - 1]
        ? diagonal
        : Math.min(diagonal + 1, previous[column] + 1, previous[column - 1] + 1);
      diagonal = above;
    }
  }

  return previous[right.length];
};

const wordsMatch = (queryWord: string, keyword: string) => {
  if (queryWord === keyword || queryWord.startsWith(keyword) || keyword.startsWith(queryWord)) return true;
  const threshold = Math.max(queryWord.length, keyword.length) > 6 ? 2 : 1;
  return levenshteinDistance(queryWord, keyword) <= threshold;
};

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const savedMessages = localStorage.getItem(CHAT_HISTORY_KEY);
      const parsedMessages = savedMessages ? JSON.parse(savedMessages) as Message[] : [];
      return parsedMessages.length > 0 ? parsedMessages.slice(-20) : [INITIAL_MESSAGE];
    } catch {
      return [INITIAL_MESSAGE];
    }
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<Record<number, 'up' | 'down'>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages.slice(-20)));
  }, [messages]);

  const clearConversation = () => {
    setMessages([INITIAL_MESSAGE]);
    setFeedback({});
    localStorage.removeItem(CHAT_HISTORY_KEY);
  };

  const findProviders = async (query: string): Promise<string | null> => {
    const normalizedQuery = normalizeText(query);
    const isProviderSearch = /(cherche|trouve|besoin|prestataire|professionnel|service)/.test(normalizedQuery);
    if (!isProviderSearch) return null;

    const searchTerms = getWords(query)
      .filter(word => !SEARCH_TERMS.has(word))
      .slice(0, 3);
    if (searchTerms.length === 0) return null;

    const safeTerms = searchTerms.map(term => term.replace(/[%(),]/g, ''));
    const filters = safeTerms.flatMap(term => [
      `business_name.ilike.%${term}%`,
      `headline.ilike.%${term}%`,
      `description.ilike.%${term}%`,
      `city.ilike.%${term}%`,
    ]).join(',');

    const { data, error } = await supabase
      .from('provider_profiles')
      .select('business_name, slug, headline, city, rating_avg, rating_count')
      .eq('validation_status', 'approved')
      .or(filters)
      .order('rating_avg', { ascending: false })
      .limit(3);

    if (error || !data?.length) return null;

    const results = data.map(provider => {
      const rating = provider.rating_count > 0 ? ` · ${Number(provider.rating_avg).toFixed(1)}/5` : '';
      const location = provider.city ? ` · ${provider.city}` : '';
      return `• ${provider.business_name}${location}${rating}\n  ${provider.headline || 'Profil professionnel SERVIO'}\n  /provider/${provider.slug}`;
    }).join('\n');

    return `J'ai trouvé ces prestataires approuvés qui peuvent correspondre à votre recherche :\n${results}\n\nOuvrez un profil pour vérifier les compétences, le tarif et les disponibilités avant de réserver.`;
  };

  const checkFAQ = (query: string): string | null => {
    const words = getWords(query);
    let bestMatch: { score: number; answer: string } | null = null;

    for (const item of FAQ_KNOWLEDGE_BASE) {
      const keywordScore = item.keywords.reduce(
        (total, keyword) => total + (words.some(word => wordsMatch(word, keyword)) ? 1 : 0),
        0,
      );
      const exampleScore = Math.max(...item.examples.map(example =>
        getWords(example).reduce((total, exampleWord) => total + (words.some(word => wordsMatch(word, exampleWord)) ? 1 : 0), 0),
      ));
      const score = keywordScore + (exampleScore >= 2 ? 2 : 0);
      const hasSpecificKeyword = item.keywords.some(keyword => keyword.length >= 8 && words.some(word => wordsMatch(word, keyword)));
      const hasMatchingExample = exampleScore >= 2;
      if ((score >= 2 || hasSpecificKeyword || hasMatchingExample) && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { score, answer: item.answer };
      }
    }

    return bestMatch?.answer ?? null;
  };

  const getReliableFallback = (userMessage: string): string => {
    const message = normalizeText(userMessage);
    if (/\b(bonjour|salut|bonsoir|coucou|hello)\b/.test(message)) {
      return 'Bonjour ! Je peux vous aider à trouver un prestataire, réserver un service, gérer un paiement ou créer votre profil professionnel. Que souhaitez-vous faire ?';
    }
    if (/\b(merci|thanks)\b/.test(message)) {
      return 'Avec plaisir. Je reste disponible pour vous aider avec votre compte, une réservation ou un profil prestataire.';
    }
    if (/(prix|cout|tarif|combien|cher)/.test(message)) {
      return 'Les prix sont fixés par chaque prestataire et sont visibles sur son profil ou avant la confirmation de la réservation. Comparez plusieurs profils pour choisir l’offre adaptée.';
    }
    if (/(contact|email|telephone|joindre)/.test(message)) {
      return 'Pour obtenir de l’aide, indiquez le problème rencontré, la page concernée et l’adresse email de votre compte au support SERVIO. Ne partagez jamais votre mot de passe.';
    }
    if (/(aide|probleme|bloque|bug|erreur|marche pas)/.test(message)) {
      return 'Je peux vous guider sur la recherche, les profils, les réservations et les paiements. Décrivez l’action effectuée et le message affiché afin que je vous donne la prochaine étape.';
    }
    return 'Je veux vous donner une réponse fiable. Pouvez-vous préciser si votre demande concerne un compte, un prestataire, une réservation, un paiement ou un problème technique ?';
  };

  const isReliableAIResponse = (response: string, userMessage: string) => {
    const normalizedResponse = normalizeText(response);
    const normalizedQuestion = normalizeText(userMessage);
    const hasUsefulLength = normalizedResponse.length >= 30 && normalizedResponse.length <= 1200;
    const hasNoPromptLeak = !/(\[inst\]|question actuelle|historique recent|assistant:|user:)/i.test(response);
    const isNotGeneric = !/(je ne peux pas aider|je n ai pas compris|je suis un modele|en tant qu ia)/i.test(normalizedResponse);
    const sharesContext = getWords(normalizedQuestion).some(word => normalizedResponse.includes(word));
    return hasUsefulLength && hasNoPromptLeak && isNotGeneric && sharesContext;
  };

  const generateAIResponse = async (userMessage: string): Promise<string> => {
    try {
      const conversationHistory = messages
        .slice(-4)
        .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n');

      const pageContext = window.location.pathname === '/'
        ? 'L’utilisateur est sur la page d’accueil.'
        : `L’utilisateur consulte actuellement ${window.location.pathname}.`;
      const prompt = `Tu es l’assistant officiel de SERVIO, une plateforme qui met en relation des clients et des prestataires de services.
    Réponds en français, avec des informations concrètes, en 3 à 5 phrases maximum. Ne prétends jamais avoir accès au compte, aux paiements ou aux données privées de l’utilisateur. Si une action nécessite une page de l’application, indique clairement son chemin. Si tu n’es pas certain, dis-le et propose le support humain.

    Contexte de page: ${pageContext}
    Historique récent:
    ${conversationHistory || 'Aucun historique.'}

    Question actuelle: ${userMessage}`;

      try {
        const response = await hf.textGeneration({
          model: 'mistralai/Mistral-7B-Instruct-v0.2',
          inputs: `[INST] ${prompt} [/INST]`,
          parameters: {
            max_new_tokens: 180,
            temperature: 0.3,
            return_full_text: false,
            wait_for_model: true
          }
        });

        const generatedText = response.generated_text?.trim();
        if (generatedText && isReliableAIResponse(generatedText, userMessage)) {
          return generatedText;
        }
      } catch (hfError) {
        console.warn('Hugging Face API error, using fallback:', hfError);
      }

      return getReliableFallback(userMessage);
    } catch (error) {
      console.error('Error generating AI response:', error);
      return getReliableFallback(userMessage);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    const providerResults = await findProviders(userMessage);
    if (providerResults) {
      setMessages(prev => [...prev, { role: 'assistant', content: providerResults }]);
      setIsLoading(false);
      return;
    }

    // Check FAQ first
    const faqAnswer = checkFAQ(userMessage);
    
    if (faqAnswer) {
      setMessages(prev => [...prev, { role: 'assistant', content: faqAnswer }]);
      setIsLoading(false);
    } else {
      // Use AI for more complex queries
      const aiResponse = await generateAIResponse(userMessage);
      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-primary-600 text-white p-4 rounded-full shadow-lg hover:bg-primary-700 transition-colors z-50"
        title="Assistant virtuel"
      >
        <MessageCircle size={24} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 bg-white rounded-2xl shadow-2xl z-50 flex flex-col max-h-[600px]">
      {/* Header */}
      <div className="bg-primary-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bot size={24} />
          <div>
            <h3 className="font-semibold">Assistant SERVIO</h3>
            <p className="text-xs text-primary-100">Réponses instantanées 24/7</p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-white hover:bg-primary-700 rounded-lg p-1 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] max-h-[450px]">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-2xl ${
                message.role === 'user'
                  ? 'bg-primary-600 text-white'
                  : 'bg-neutral-100 text-neutral-900'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              {message.role === 'assistant' && index > 0 && !isLoading && (
                <div className="mt-2 flex items-center gap-1 border-t border-neutral-200 pt-1">
                  <button
                    type="button"
                    onClick={() => setFeedback(previous => ({ ...previous, [index]: 'up' }))}
                    className={`rounded p-1 ${feedback[index] === 'up' ? 'text-primary-600' : 'text-neutral-400 hover:text-primary-600'}`}
                    title="Réponse utile"
                    aria-label="Réponse utile"
                  >
                    <ThumbsUp size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedback(previous => ({ ...previous, [index]: 'down' }))}
                    className={`rounded p-1 ${feedback[index] === 'down' ? 'text-error-600' : 'text-neutral-400 hover:text-error-600'}`}
                    title="Réponse à améliorer"
                    aria-label="Réponse à améliorer"
                  >
                    <ThumbsDown size={13} />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-neutral-100 p-3 rounded-2xl">
              <Loader2 size={16} className="animate-spin text-neutral-600" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-neutral-200">
        <div className="mb-2 flex justify-end">
          <button
            type="button"
            onClick={clearConversation}
            className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-800"
            title="Effacer la conversation"
          >
            <Trash2 size={13} />
            Effacer
          </button>
        </div>
        {messages.length === 1 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {QUICK_QUESTIONS.map(question => (
              <button
                key={question}
                type="button"
                onClick={() => setInput(question)}
                className="rounded-full border border-neutral-200 px-3 py-1.5 text-left text-xs text-neutral-600 hover:border-primary-300 hover:text-primary-700"
              >
                {question}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Posez votre question..."
            className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="bg-primary-600 text-white p-2 rounded-lg hover:bg-primary-700 transition-colors disabled:bg-neutral-300 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Send size={20} />
            )}
          </button>
        </div>
        <p className="text-xs text-neutral-500 mt-2 text-center">
          Questions fréquentes : compte, prestataire, réservation, paiement
        </p>
      </div>
    </div>
  );
}
