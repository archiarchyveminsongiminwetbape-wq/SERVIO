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
 * Analyze image using AI (Hugging Face Vision - Free)
 */
export async function analyzeImage(imageUrl: string): Promise<{
  description: string;
  tags: string[];
  category?: string;
  isAppropriate: boolean;
}> {
  try {
    // Use Hugging Face Vision API
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    
    // Image classification
    const classificationResult = await hf.imageClassification({
      model: 'google/vit-base-patch16-224',
      data: blob
    });

    // Image captioning
    const captionResult = await fetch(
      `https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-base`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_HUGGINGFACE_API_KEY || ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: await blobToBase64(blob) })
      }
    );

    const captionData = await captionResult.json();
    const description = captionData[0]?.generated_text || 'Image analysée';

    // Extract tags from classification
    const tags = classificationResult
      .slice(0, 5)
      .map((result: any) => result.label)
      .filter(Boolean);

    // Basic appropriateness check based on classification
    const inappropriateLabels = ['nsfw', 'adult', 'explicit', 'violence', 'gore'];
    const isAppropriate = !classificationResult.some((result: any) =>
      inappropriateLabels.some(label => result.label.toLowerCase().includes(label))
    );

    return {
      description,
      tags,
      isAppropriate
    };
  } catch (error) {
    console.error('Error analyzing image:', error);
    return {
      description: 'Impossible d\'analyser l\'image',
      tags: [],
      isAppropriate: true
    };
  }
}

/**
 * Convert blob to base64
 */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Categorize portfolio item based on image analysis
 */
export async function categorizePortfolioItem(imageUrl: string, availableCategories: string[]): Promise<string | null> {
  try {
    const analysis = await analyzeImage(imageUrl);
    
    // Find best matching category based on tags
    const matchingCategory = availableCategories.find(category =>
      analysis.tags.some(tag =>
        tag.toLowerCase().includes(category.toLowerCase()) ||
        category.toLowerCase().includes(tag.toLowerCase())
      )
    );

    return matchingCategory || null;
  } catch (error) {
    console.error('Error categorizing portfolio item:', error);
    return null;
  }
}

/**
 * Generate image description for accessibility
 */
export async function generateImageAltText(imageUrl: string): Promise<string> {
  try {
    const analysis = await analyzeImage(imageUrl);
    return analysis.description;
  } catch (error) {
    console.error('Error generating alt text:', error);
    return 'Image de portfolio';
  }
}

/**
 * Predict quote conversion probability using AI
 */
export async function predictQuoteConversion(quoteData: {
  estimated_total: number;
  service_type: string;
  provider_rating: number;
  provider_experience: number;
  client_history?: number; // Number of previous bookings
  timeline_days: number;
  location_match: boolean;
}): Promise<{
  conversion_probability: number; // 0-100
  risk_factors: string[];
  recommendations: string[];
}> {
  try {
    // Use Hugging Face (free) if OpenAI key is not available
    if (!import.meta.env.VITE_OPENAI_API_KEY) {
      // Simple rule-based prediction for Hugging Face
      let probability = 50; // Base probability
      
      // Adjust based on factors
      if (quoteData.provider_rating >= 4.5) probability += 15;
      else if (quoteData.provider_rating >= 4.0) probability += 10;
      else if (quoteData.provider_rating >= 3.5) probability += 5;
      else probability -= 10;
      
      if (quoteData.provider_experience >= 5) probability += 10;
      else if (quoteData.provider_experience >= 2) probability += 5;
      
      if (quoteData.client_history && quoteData.client_history > 0) probability += 15;
      
      if (quoteData.location_match) probability += 10;
      else probability -= 5;
      
      if (quoteData.timeline_days <= 7) probability += 5;
      else if (quoteData.timeline_days > 30) probability -= 10;
      
      // Price sensitivity
      if (quoteData.estimated_total > 5000) probability -= 15;
      else if (quoteData.estimated_total > 2000) probability -= 5;
      
      probability = Math.max(10, Math.min(95, probability));
      
      const riskFactors: string[] = [];
      const recommendations: string[] = [];
      
      if (quoteData.provider_rating < 4.0) {
        riskFactors.push('Note du prestataire inférieure à 4.0');
        recommendations.push('Améliorer le profil et demander plus d\'avis');
      }
      
      if (!quoteData.location_match) {
        riskFactors.push('Localisation non correspondante');
        recommendations.push('Mettre en avant les capacités de travail à distance');
      }
      
      if (quoteData.timeline_days > 30) {
        riskFactors.push('Délai de réalisation trop long');
        recommendations.push('Proposer des étapes intermédiaires ou un livraison rapide');
      }
      
      if (quoteData.estimated_total > 2000) {
        riskFactors.push('Montant élevé');
        recommendations.push('Proposer un paiement échelonné ou une réduction pour paiement anticipé');
      }
      
      return {
        conversion_probability: probability,
        risk_factors: riskFactors,
        recommendations: recommendations
      };
    }

    // Use OpenAI for more sophisticated prediction
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a business analyst specializing in conversion prediction for freelance services. Analyze quote data and predict conversion probability.'
        },
        {
          role: 'user',
          content: `Analyse ce devis et prédit la probabilité de conversion en réservation:
          
          Données du devis:
          - Montant estimé: ${quoteData.estimated_total}€
          - Type de service: ${quoteData.service_type}
          - Note du prestataire: ${quoteData.provider_rating}/5
          - Expérience du prestataire: ${quoteData.provider_experience} ans
          - Historique client: ${quoteData.client_history || 0} réservations précédentes
          - Délai de réalisation: ${quoteData.timeline_days} jours
          - Correspondance de localisation: ${quoteData.location_match ? 'Oui' : 'Non'}
          
          Fournis:
          1. Probabilité de conversion (0-100)
          2. Facteurs de risque
          3. Recommandations pour améliorer la conversion
          
          Format: JSON avec {conversion_probability, risk_factors: [], recommendations: []}`
        }
      ],
      max_tokens: 500,
      temperature: 0.5,
      response_format: { type: "json_object" }
    });

    const result = response.choices[0]?.message?.content || '';
    return JSON.parse(result);
  } catch (error) {
    console.error('Error predicting quote conversion:', error);
    return {
      conversion_probability: 50,
      risk_factors: ['Erreur de prédiction'],
      recommendations: ['Réessayer plus tard']
    };
  }
}

/**
 * Optimize quote pricing based on market data
 */
export async function optimizeQuotePricing(
  serviceType: string,
  currentPrice: number,
  providerRating: number,
  marketAverage?: number
): Promise<{
  suggested_price: number;
  adjustment_reason: string;
  confidence: number;
}> {
  try {
    // Use Hugging Face (free) if OpenAI key is not available
    if (!import.meta.env.VITE_OPENAI_API_KEY) {
      let suggestedPrice = currentPrice;
      let reason = 'Prix maintenu';
      let confidence = 70;
      
      if (marketAverage) {
        if (currentPrice > marketAverage * 1.3) {
          suggestedPrice = marketAverage * 1.15;
          reason = 'Prix réduit pour être plus compétitif';
          confidence = 80;
        } else if (currentPrice < marketAverage * 0.7 && providerRating >= 4.5) {
          suggestedPrice = marketAverage * 0.9;
          reason = 'Prix augmenté en raison de la haute qualité';
          confidence = 75;
        }
      } else if (providerRating >= 4.5) {
        suggestedPrice = currentPrice * 1.1;
        reason = 'Prix légèrement augmenté en raison de la haute qualité';
        confidence = 65;
      }
      
      return {
        suggested_price: Math.round(suggestedPrice),
        adjustment_reason: reason,
        confidence
      };
    }

    // Use OpenAI for more sophisticated optimization
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a pricing strategist for freelance services. Optimize pricing based on market conditions and provider quality.'
        },
        {
          role: 'user',
          content: `Optimise le prix de ce devis:
          
          - Type de service: ${serviceType}
          - Prix actuel: ${currentPrice}€
          - Note du prestataire: ${providerRating}/5
          - Prix moyen du marché: ${marketAverage || 'Non disponible'}€
          
          Fournis:
          1. Prix suggéré
          2. Raison de l'ajustement
          3. Niveau de confiance (0-100)
          
          Format: JSON avec {suggested_price, adjustment_reason, confidence}`
        }
      ],
      max_tokens: 300,
      temperature: 0.4,
      response_format: { type: "json_object" }
    });

    const result = response.choices[0]?.message?.content || '';
    return JSON.parse(result);
  } catch (error) {
    console.error('Error optimizing quote pricing:', error);
    return {
      suggested_price: currentPrice,
      adjustment_reason: 'Erreur d\'optimisation',
      confidence: 0
    };
  }
}
