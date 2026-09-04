import OpenAI from 'openai';
import { HfInference } from '@huggingface/inference';

// Initialize OpenAI client (optional - requires API key)
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
  dangerouslyAllowBrowser: true
});

// Initialize Hugging Face client (free, no API key required for basic models)
const hf = new HfInference(import.meta.env.VITE_HUGGINGFACE_API_KEY || '');

/**
 * Generate service description using AI (Hugging Face - Free)
 */
export async function generateServiceDescription(
  serviceName: string,
  category: string,
  skills: string[],
  experience: string,
  targetAudience: string
): Promise<string> {
  try {
    // Use Hugging Face (free) if OpenAI key is not available
    if (!import.meta.env.VITE_OPENAI_API_KEY) {
      const prompt = `Génère une description professionnelle et attrayante pour un service:
      - Nom du service: ${serviceName}
      - Catégorie: ${category}
      - Compétences: ${skills.join(', ')}
      - Expérience: ${experience}
      - Public cible: ${targetAudience}
      
      La description doit être professionnelle, engageante, en français, entre 150-250 mots.`;

      const response = await hf.textGeneration({
        model: 'mistralai/Mistral-7B-Instruct-v0.2',
        inputs: `[INST] ${prompt} [/INST]`,
        parameters: {
          max_new_tokens: 500,
          temperature: 0.7,
          return_full_text: false
        }
      });

      return response.generated_text || '';
    }

    // Use OpenAI if key is available
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a professional copywriter specializing in service descriptions for a freelance platform. Write compelling, professional descriptions in French.'
        },
        {
          role: 'user',
          content: `Génère une description professionnelle et attrayante pour un service avec les détails suivants:
          - Nom du service: ${serviceName}
          - Catégorie: ${category}
          - Compétences: ${skills.join(', ')}
          - Expérience: ${experience}
          - Public cible: ${targetAudience}
          
          La description doit être:
          - Professionnelle et engageante
          - En français
          - Entre 150-250 mots
          - Mettre en valeur les compétences et l'expérience
          - Adaptée au public cible`
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    });

    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Error generating service description:', error);
    throw new Error('Erreur lors de la génération de la description');
  }
}

/**
 * Extract skills from service description using AI (Hugging Face - Free)
 */
export async function extractSkillsFromDescription(description: string): Promise<string[]> {
  try {
    // Use Hugging Face (free) if OpenAI key is not available
    if (!import.meta.env.VITE_OPENAI_API_KEY) {
      const prompt = `Extrais les compétences clés de cette description de service. Retourne uniquement une liste de compétences séparées par des virgules, sans autre texte:
      
      ${description}`;

      const response = await hf.textGeneration({
        model: 'mistralai/Mistral-7B-Instruct-v0.2',
        inputs: `[INST] ${prompt} [/INST]`,
        parameters: {
          max_new_tokens: 200,
          temperature: 0.3,
          return_full_text: false
        }
      });

      const skillsText = response.generated_text || '';
      return skillsText.split(',').map(s => s.trim()).filter(Boolean);
    }

    // Use OpenAI if key is available
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert in analyzing professional profiles. Extract key skills from descriptions.'
        },
        {
          role: 'user',
          content: `Extrais les compétences clés de cette description de service. Retourne uniquement une liste de compétences séparées par des virgules, sans autre texte:
          
          ${description}`
        }
      ],
      max_tokens: 200,
      temperature: 0.3
    });

    const skillsText = response.choices[0]?.message?.content || '';
    return skillsText.split(',').map(s => s.trim()).filter(Boolean);
  } catch (error) {
    console.error('Error extracting skills:', error);
    return [];
  }
}

/**
 * Generate response suggestion for messages
 */
export async function generateMessageResponse(
  receivedMessage: string,
  context: string
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant for a freelance platform. Generate professional, polite responses in French.'
        },
        {
          role: 'user',
          content: `Génère une réponse professionnelle et polie pour ce message dans le contexte suivant:
          
          Contexte: ${context}
          Message reçu: ${receivedMessage}
          
          La réponse doit être:
          - Professionnelle et courtoise
          - En français
          - Adaptée au contexte
          - Brève et directe (50-100 mots)`
        }
      ],
      max_tokens: 200,
      temperature: 0.6
    });

    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Error generating message response:', error);
    throw new Error('Erreur lors de la génération de la réponse');
  }
}

/**
 * Summarize reviews using AI
 */
export async function summarizeReviews(reviews: Array<{ comment: string; rating: number }>): Promise<string> {
  try {
    const reviewsText = reviews.map(r => `Note: ${r.rating}/5, Commentaire: ${r.comment}`).join('\n');
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert in analyzing customer feedback. Summarize reviews concisely.'
        },
        {
          role: 'user',
          content: `Génère un résumé concis de ces avis clients en français:
          
          ${reviewsText}
          
          Le résumé doit:
          - Être en français
          - Mettre en évidence les points forts et faibles
          - Être entre 50-100 mots`
        }
      ],
      max_tokens: 200,
      temperature: 0.5
    });

    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Error summarizing reviews:', error);
    throw new Error('Erreur lors du résumé des avis');
  }
}

/**
 * Detect inappropriate content
 */
export async function detectInappropriateContent(text: string): Promise<{ isAppropriate: boolean; reason?: string }> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a content moderator. Detect inappropriate, spam, or harmful content.'
        },
        {
          role: 'user',
          content: `Analyse ce texte pour détecter du contenu inapproprié, du spam ou du contenu nuisible:
          
          ${text}
          
          Réponds uniquement par "APPROPRIATE" si le contenu est acceptable, ou "INAPPROPRIATE: [raison]" si ce n'est pas le cas.`
        }
      ],
      max_tokens: 50,
      temperature: 0.1
    });

    const result = response.choices[0]?.message?.content || '';
    
    if (result.startsWith('INAPPROPRIATE')) {
      return {
        isAppropriate: false,
        reason: result.replace('INAPPROPRIATE:', '').trim()
      };
    }
    
    return { isAppropriate: true };
  } catch (error) {
    console.error('Error detecting inappropriate content:', error);
    return { isAppropriate: true }; // Default to appropriate on error
  }
}

/**
 * Generate provider recommendations based on user preferences
 */
export async function generateProviderRecommendations(
  userPreferences: {
    categories: string[];
    location?: string;
    budget?: string;
    skills?: string[];
  },
  availableProviders: Array<{
    id: string;
    business_name: string;
    category: string;
    skills: string[];
    city: string;
    price_range: string;
    rating: number;
  }>
): Promise<Array<{ providerId: string; score: number; reason: string }>> {
  try {
    const providersText = availableProviders.map(p => 
      `ID: ${p.id}, Nom: ${p.business_name}, Catégorie: ${p.category}, Compétences: ${p.skills.join(', ')}, Ville: ${p.city}, Prix: ${p.price_range}, Note: ${p.rating}`
    ).join('\n');
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a recommendation engine. Match providers to user preferences and score them.'
        },
        {
          role: 'user',
          content: `Génère des recommandations de prestataires basées sur ces préférences utilisateur:
          
          Préférences:
          - Catégories: ${userPreferences.categories.join(', ')}
          - Localisation: ${userPreferences.location || 'Non spécifiée'}
          - Budget: ${userPreferences.budget || 'Non spécifié'}
          - Compétences recherchées: ${userPreferences.skills?.join(', ') || 'Non spécifiées'}
          
          Prestataires disponibles:
          ${providersText}
          
          Pour chaque recommandation, fournis:
          - ID du prestataire
          - Score de correspondance (0-100)
          - Raison de la recommandation
          
          Format: JSON array avec objects {providerId, score, reason}`
        }
      ],
      max_tokens: 1000,
      temperature: 0.5,
      response_format: { type: "json_object" }
    });

    const result = response.choices[0]?.message?.content || '';
    const parsed = JSON.parse(result);
    
    return parsed.recommendations || [];
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return [];
  }
}

/**
 * Generate quote template using AI
 */
export async function generateQuoteTemplate(
  serviceType: string,
  projectDescription: string,
  estimatedBudget: string,
  timeline: string
): Promise<{
  title: string;
  description: string;
  items: Array<{ description: string; quantity: number; unit_price: number }>;
  terms: string;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a professional quote generator. Create detailed quotes for freelance services.'
        },
        {
          role: 'user',
          content: `Génère un modèle de devis professionnel pour:
          
          Type de service: ${serviceType}
          Description du projet: ${projectDescription}
          Budget estimé: ${estimatedBudget}
          Délai: ${timeline}
          
          Le devis doit inclure:
          - Titre professionnel
          - Description détaillée
          - Liste des éléments avec descriptions, quantités et prix unitaires (en euros)
          - Conditions générales
          
          Format: JSON avec {title, description, items: [{description, quantity, unit_price}], terms}`
        }
      ],
      max_tokens: 1000,
      temperature: 0.6,
      response_format: { type: "json_object" }
    });

    const result = response.choices[0]?.message?.content || '';
    return JSON.parse(result);
  } catch (error) {
    console.error('Error generating quote template:', error);
    throw new Error('Erreur lors de la génération du devis');
  }
}

/**
 * Translate text using AI
 */
export async function translateText(text: string, targetLanguage: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a professional translator. Translate text accurately while maintaining context and tone.'
        },
        {
          role: 'user',
          content: `Traduis ce texte en ${targetLanguage}:
          
          ${text}`
        }
      ],
      max_tokens: 500,
      temperature: 0.3
    });

    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Error translating text:', error);
    throw new Error('Erreur lors de la traduction');
  }
}
