import { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, MessageCircle, Mail, Phone } from 'lucide-react';
import { useI18n } from '@/context/I18nContext';

const faqCategories = [
  {
    id: 'general',
    name: 'Questions générales',
    icon: HelpCircle,
    questions: [
      {
        q: 'Qu\'est-ce que SERVIO ?',
        a: 'SERVIO est une plateforme qui connecte les prestataires de services avec les clients qui les recherchent. Nous facilitons la mise en relation entre professionnels et particuliers dans tous les secteurs d\'activité.'
      },
      {
        q: 'Comment fonctionne SERVIO ?',
        a: 'Vous pouvez rechercher des prestataires par catégorie, localisation ou compétences. Une fois que vous avez trouvé un prestataire qui correspond à vos besoins, vous pouvez contacter directement via notre messagerie intégrée.'
      },
      {
        q: 'SERVIO est-il gratuit ?',
        a: 'L\'inscription et la recherche de prestataires sont gratuites. Les prestataires peuvent créer un profil de base gratuitement. Des fonctionnalités premium sont disponibles pour une meilleure visibilité.'
      },
      {
        q: 'SERVIO est-il disponible dans ma région ?',
        a: 'SERVIO est disponible partout dans le monde. De nombreux prestataires proposent également des services à distance.'
      }
    ]
  },
  {
    id: 'clients',
    name: 'Pour les clients',
    icon: MessageCircle,
    questions: [
      {
        q: 'Comment trouver un prestataire ?',
        a: 'Utilisez notre barre de recherche pour trouver des prestataires par catégorie, localisation ou mots-clés. Vous pouvez également filtrer les résultats par prix, disponibilité et avis.'
      },
      {
        q: 'Comment contacter un prestataire ?',
        a: 'Une fois connecté, vous pouvez envoyer un message à n\'importe quel prestataire via sa page de profil. La messagerie est gratuite et sécurisée.'
      },
      {
        q: 'Comment savoir si un prestataire est fiable ?',
        a: 'Consultez les avis et notes laissés par d\'autres clients. Les prestataires avec le badge "Vérifié" ont passé notre processus de validation.'
      },
      {
        q: 'Puis-je annuler une prestation ?',
        a: 'Les conditions d\'annulation dépendent de chaque prestataire. Nous recommandons de discuter des conditions avant de confirmer une prestation.'
      }
    ]
  },
  {
    id: 'providers',
    name: 'Pour les prestataires',
    icon: Phone,
    questions: [
      {
        q: 'Comment devenir prestataire sur SERVIO ?',
        a: 'Créez un compte, choisissez "Prestataire" lors de l\'inscription, puis remplissez votre profil professionnel. Votre profil sera soumis à validation avant d\'être visible publiquement.'
      },
      {
        q: 'Combien coûte l\'inscription ?',
        a: 'L\'inscription et la création d\'un profil de base sont gratuites. Des options premium sont disponibles pour améliorer votre visibilité.'
      },
      {
        q: 'Comment suis-je payé ?',
        a: 'Les modalités de paiement sont définies directement entre vous et le client. SERVIO ne gère pas les transactions financières.'
      },
      {
        q: 'Comment améliorer ma visibilité ?',
        a: 'Complétez votre profil avec des informations détaillées, des photos de vos réalisations, et demandez à vos clients de laisser des avis. Les profils vérifiés et mis en avant ont plus de visibilité.'
      }
    ]
  },
  {
    id: 'account',
    name: 'Mon compte',
    icon: HelpCircle,
    questions: [
      {
        q: 'Comment modifier mes informations ?',
        a: 'Connectez-vous à votre compte, allez dans "Mon profil" puis cliquez sur "Modifier". Vous pouvez mettre à jour vos informations personnelles et vos préférences.'
      },
      {
        q: 'Comment changer mon mot de passe ?',
        a: 'Allez dans la page de connexion et cliquez sur "Mot de passe oublié ?" ou accédez à vos paramètres de compte pour le modifier.'
      },
      {
        q: 'Comment supprimer mon compte ?',
        a: 'Allez dans vos paramètres de compte, section "Confidentialité", et cliquez sur "Supprimer le compte". Cette action est irréversible.'
      },
      {
        q: 'Mes données sont-elles sécurisées ?',
        a: 'Oui, nous utilisons des mesures de sécurité avancées pour protéger vos données conformément au RGPD. Nous ne partageons vos informations avec des tiers.'
      }
    ]
  }
];

export default function FaqPage() {
  const { t } = useI18n();
  const [activeCategory, setActiveCategory] = useState('general');
  const [openQuestions, setOpenQuestions] = useState<Set<string>>(new Set());

  const toggleQuestion = (questionId: string) => {
    const newOpen = new Set(openQuestions);
    if (newOpen.has(questionId)) {
      newOpen.delete(questionId);
    } else {
      newOpen.add(questionId);
    }
    setOpenQuestions(newOpen);
  };

  const category = faqCategories.find(c => c.id === activeCategory);
  const CategoryIcon = category?.icon || HelpCircle;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-neutral-900">FAQ</h1>
        <p className="mt-2 text-neutral-600">Trouvez les réponses à vos questions</p>
      </div>

      {/* Category Tabs */}
      <div className="mb-8 flex flex-wrap gap-2">
        {faqCategories.map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                activeCategory === cat.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              <Icon size={16} />
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {category?.questions.map((item, index) => {
          const questionId = `${category.id}-${index}`;
          const isOpen = openQuestions.has(questionId);

          return (
            <div key={questionId} className="card">
              <button
                onClick={() => toggleQuestion(questionId)}
                className="flex w-full items-center justify-between text-left"
              >
                <span className="font-medium text-neutral-900">{item.q}</span>
                {isOpen ? <ChevronUp size={20} className="text-neutral-400" /> : <ChevronDown size={20} className="text-neutral-400" />}
              </button>
              {isOpen && (
                <div className="mt-4 text-sm text-neutral-600 leading-relaxed">
                  {item.a}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Contact Support */}
      <div className="mt-12 card bg-primary-50">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-neutral-900">Vous ne trouvez pas votre réponse ?</h3>
          <p className="mt-2 text-sm text-neutral-600">Notre équipe est là pour vous aider</p>
          
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <a href="mailto:support@servio.com" className="btn-primary inline-flex items-center justify-center gap-2">
              <Mail size={18} />
              Email: support@servio.com
            </a>
            <a href="tel:+237657029080" className="btn-secondary inline-flex items-center justify-center gap-2">
              <Phone size={18} />
              +237 657 029 080
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
