import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Bot } from 'lucide-react';
import { HfInference } from '@huggingface/inference';

const hf = new HfInference(import.meta.env.VITE_HUGGINGFACE_API_KEY || '');

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const FAQ_KNOWLEDGE_BASE = {
  'comment créer un compte': 'Pour créer un compte sur SERVIO, cliquez sur le bouton "S\'inscrire" en haut à droite de la page d\'accueil. Remplissez le formulaire avec vos informations personnelles, puis confirmez votre email via le lien envoyé automatiquement.',
  
  'comment devenir prestataire': 'Pour devenir prestataire sur SERVIO, créez d\'abord un compte, puis accédez à votre tableau de bord et cliquez sur "Devenir prestataire". Remplissez votre profil professionnel avec vos compétences, expérience et portfolio. Votre profil sera validé par notre équipe sous 24-48h.',
  
  'comment réserver un service': 'Pour réserver un service, recherchez le prestataire de votre choix, consultez son profil et ses disponibilités, puis cliquez sur "Réserver". Sélectionnez la date et l\'heure souhaitées, confirmez les détails et procédez au paiement sécurisé.',
  
  'modes de paiement': 'SERVIO accepte plusieurs modes de paiement : cartes bancaires (Visa, Mastercard), PayPal, virement bancaire et mobile money selon votre région. Tous les paiements sont sécurisés via Stripe.',
  
  'annuler une réservation': 'Vous pouvez annuler une réservation jusqu\'à 24h avant le début du service sans frais. Pour annuler, allez dans votre tableau de bord > Mes réservations, sélectionnez la réservation et cliquez sur "Annuler".',
  
  'facturation': 'Les factures sont générées automatiquement après la complétion des services. Vous pouvez les consulter et télécharger en PDF depuis votre tableau de bord dans la section Factures.',
  
  'abonnements': 'SERVIO propose plusieurs plans d\'abonnement : Gratuit (5 réalisations), Basic (15 réalisations), Pro (illimité) et Enterprise (personnalisé). Les plans payants offrent des fonctionnalités avancées et une meilleure visibilité.',
  
  'support technique': 'Pour contacter le support technique, utilisez le formulaire de contact sur la page d\'aide ou envoyez un email à support@servio.com. Notre équipe répond généralement sous 24h.',
  
  'sécurité': 'SERVIO utilise des protocoles de sécurité avancés incluant le chiffrement SSL, la protection des données personnelles conformément au RGPD, et un système de vérification des prestataires.',
  
  'avis clients': 'Les clients peuvent laisser des avis après la complétion d\'un service. Les avis sont modérés pour garantir leur authenticité. Les prestataires peuvent répondre aux avis pour améliorer leur réputation.'
};

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Bonjour ! Je suis l\'assistant virtuel SERVIO. Comment puis-je vous aider aujourd\'hui ?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const checkFAQ = (query: string): string | null => {
    const lowerQuery = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    for (const [key, answer] of Object.entries(FAQ_KNOWLEDGE_BASE)) {
      const normalizedKey = key.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (lowerQuery.includes(normalizedKey) || normalizedKey.includes(lowerQuery)) {
        return answer;
      }
    }
    return null;
  };

  const generateAIResponse = async (userMessage: string): Promise<string> => {
    try {
      const conversationHistory = messages
        .slice(-4)
        .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n');

      const prompt = `Tu es un assistant virtuel utile pour la plateforme SERVIO, une plateforme de services freelance. Réponds en français de manière concise et professionnelle (maximum 2-3 phrases).

Question: ${userMessage}

Réponds simplement et directement. Si tu ne connais pas la réponse, suggère de contacter le support humain.`;

      try {
        const response = await hf.textGeneration({
          model: 'mistralai/Mistral-7B-Instruct-v0.2',
          inputs: `[INST] ${prompt} [/INST]`,
          parameters: {
            max_new_tokens: 150,
            temperature: 0.7,
            return_full_text: false,
            wait_for_model: true
          }
        });

        const generatedText = response.generated_text?.trim();
        if (generatedText && generatedText.length > 10) {
          return generatedText;
        }
      } catch (hfError) {
        console.warn('Hugging Face API error, using fallback:', hfError);
      }

      // Fallback: Simple keyword-based responses
      const lowerMessage = userMessage.toLowerCase();
      if (lowerMessage.includes('prix') || lowerMessage.includes('coût') || lowerMessage.includes('tarif')) {
        return 'Les prix varient selon les prestataires et les services. Vous pouvez consulter les tarifs sur les profils des prestataires.';
      }
      if (lowerMessage.includes('contact') || lowerMessage.includes('email') || lowerMessage.includes('téléphone')) {
        return 'Pour nous contacter, utilisez le formulaire de contact sur la page d\'aide ou envoyez un email à support@servio.com.';
      }
      if (lowerMessage.includes('aide') || lowerMessage.includes('problème')) {
        return 'Je suis là pour vous aider ! Pour des questions spécifiques sur votre compte ou vos réservations, je vous recommande de contacter notre support humain.';
      }

      return 'Je suis désolé, je n\'ai pas pu trouver une réponse précise. Pour une assistance personnalisée, veuillez contacter notre support humain à support@servio.com.';
    } catch (error) {
      console.error('Error generating AI response:', error);
      return 'Désolé, je rencontre des difficultés techniques. Pour une assistance immédiate, contactez notre support à support@servio.com.';
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    // Check FAQ first
    const faqAnswer = checkFAQ(userMessage);
    
    if (faqAnswer) {
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'assistant', content: faqAnswer }]);
        setIsLoading(false);
      }, 500);
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
