import { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, MessageCircle, Mail, Phone } from 'lucide-react';
import { useI18n } from '@/context/I18nContext';

const faqCategories = [
  {
    id: 'general',
    icon: HelpCircle,
  },
  {
    id: 'clients',
    icon: MessageCircle,
  },
  {
    id: 'providers',
    icon: Phone,
  },
  {
    id: 'account',
    icon: HelpCircle,
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
        <h1 className="text-3xl font-bold text-neutral-900">{t.faq.title}</h1>
        <p className="mt-2 text-neutral-600">{t.faq.subtitle}</p>
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
              {t.faq.categories[cat.id as keyof typeof t.faq.categories]}
            </button>
          );
        })}
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {category?.id && (
          <div className="space-y-4">
            {(() => {
              const categoryQuestions = t.faq.questions[category.id as keyof typeof t.faq.questions];
              if (!categoryQuestions) return null;
              const questions = Object.entries(categoryQuestions).filter(([key]) => key.endsWith('Answer')).map(([key, value]) => ({
                q: categoryQuestions[key.replace('Answer', '') as keyof typeof categoryQuestions],
                a: value
              }));
              return questions.map((item, index) => {
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
              });
            })()}
          </div>
        )}
      </div>

      {/* Contact Support */}
      <div className="mt-12 card bg-primary-50">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-neutral-900">{t.faq.contactTitle}</h3>
          <p className="mt-2 text-sm text-neutral-600">{t.faq.contactSubtitle}</p>
          
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <a href="mailto:support@servio.com" className="btn-primary inline-flex items-center justify-center gap-2">
              <Mail size={18} />
              {t.faq.emailLabel}
            </a>
            <a href="tel:+237657029080" className="btn-secondary inline-flex items-center justify-center gap-2">
              <Phone size={18} />
              {t.faq.phoneLabel}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
