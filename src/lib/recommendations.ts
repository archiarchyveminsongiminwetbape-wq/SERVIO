import { supabase } from './supabase';

interface RecommendationContext {
  userId?: string;
  userInterests?: string[];
  userLocation?: string;
  searchQuery?: string;
  category?: string;
  priceRange?: { min: number; max: number };
}

interface ProviderScore {
  providerId: string;
  score: number;
  reasons: string[];
  provider: any;
}

/**
 * Système de recommandations IA pour SERVIO
 * Utilise plusieurs facteurs pour scorer et recommander les prestataires
 */
export class RecommendationEngine {
  /**
   * Obtenir des recommandations de prestataires basées sur le contexte
   */
  static async getRecommendations(context: RecommendationContext, limit: number = 10): Promise<any[]> {
    const providers = await this.fetchProviders(context);
    const scoredProviders = await this.scoreProviders(providers, context);
    
    return scoredProviders
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(sp => sp.provider);
  }

  /**
   * Récupérer les prestataires candidats
   */
  private static async fetchProviders(context: RecommendationContext): Promise<any[]> {
    let query = supabase
      .from('provider_profiles')
      .select(`
        id,
        user_id,
        business_name,
        headline,
        description,
        avatar_url,
        city,
        country,
        skills,
        rating_avg,
        rating_count,
        price_range,
        category_id,
        category:categories(id, name, slug),
        validation_status,
        is_featured
      `)
      .eq('validation_status', 'approved');

    // Filtrer par catégorie si spécifié
    if (context.category) {
      query = query.eq('category_id', context.category);
    }

    // Filtrer par localisation si spécifié
    if (context.userLocation) {
      query = query.or(`city.ilike.%${context.userLocation}%,country.ilike.%${context.userLocation}%`);
    }

    // Filtrer par plage de prix si spécifié
    if (context.priceRange) {
      // Implementation would depend on how price_range is stored
      // query = query.gte('price_min', context.priceRange.min).lte('price_max', context.priceRange.max);
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching providers:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Scorers les prestataires basés sur plusieurs facteurs
   */
  private static async scoreProviders(providers: any[], context: RecommendationContext): Promise<ProviderScore[]> {
    const scoredProviders: ProviderScore[] = [];

    for (const provider of providers) {
      const score = await this.calculateProviderScore(provider, context);
      scoredProviders.push({
        providerId: provider.id,
        score: score.totalScore,
        reasons: score.reasons,
        provider,
      });
    }

    return scoredProviders;
  }

  /**
   * Calculer le score d'un prestataire
   */
  private static async calculateProviderScore(provider: any, context: RecommendationContext): Promise<{ totalScore: number; reasons: string[] }> {
    let score = 0;
    const reasons: string[] = [];

    // 1. Score de base (rating et nombre d'avis)
    const ratingScore = this.calculateRatingScore(provider);
    score += ratingScore * 0.3; // 30% du poids
    if (ratingScore > 0.7) reasons.push('Excellentes notes');

    // 2. Score de vérification
    const verificationScore = this.calculateVerificationScore(provider);
    score += verificationScore * 0.2; // 20% du poids
    if (verificationScore > 0.8) reasons.push('Profil vérifié');

    // 3. Score de correspondance avec les intérêts de l'utilisateur
    if (context.userInterests && context.userInterests.length > 0) {
      const interestScore = this.calculateInterestMatchScore(provider, context.userInterests);
      score += interestScore * 0.25; // 25% du poids
      if (interestScore > 0.6) reasons.push('Correspond à vos intérêts');
    }

    // 4. Score de localisation
    if (context.userLocation) {
      const locationScore = this.calculateLocationScore(provider, context.userLocation);
      score += locationScore * 0.15; // 15% du poids
      if (locationScore > 0.8) reasons.push('Proche de chez vous');
    }

    // 5. Score de mise en avant (featured)
    if (provider.is_featured) {
      score += 0.1; // 10% bonus
      reasons.push('Prestataire mis en avant');
    }

    // 6. Score de correspondance avec la recherche
    if (context.searchQuery) {
      const searchScore = this.calculateSearchMatchScore(provider, context.searchQuery);
      score += searchScore * 0.2; // 20% du poids
      if (searchScore > 0.7) reasons.push('Correspond à votre recherche');
    }

    return { totalScore: Math.min(score, 1), reasons };
  }

  /**
   * Calculer le score basé sur les notes
   */
  private static calculateRatingScore(provider: any): number {
    if (!provider.rating_avg || provider.rating_count < 3) return 0.3; // Score minimal pour nouveaux
    
    const rating = provider.rating_avg / 5; // Normaliser entre 0 et 1
    const reviewCountBonus = Math.min(provider.rating_count / 50, 0.2); // Bonus jusqu'à 50 avis
    
    return rating + reviewCountBonus;
  }

  /**
   * Calculer le score de vérification
   */
  private static calculateVerificationScore(provider: any): number {
    let score = 0;
    
    if (provider.badges && provider.badges.includes('profil-verifie')) {
      score += 0.5;
    }
    
    if (provider.validation_status === 'approved') {
      score += 0.3;
    }
    
    if (provider.rating_count > 10) {
      score += 0.2;
    }
    
    return score;
  }

  /**
   * Calculer la correspondance avec les intérêts
   */
  private static calculateInterestMatchScore(provider: any, userInterests: string[]): number {
    if (!provider.skills || !Array.isArray(provider.skills)) return 0;
    
    const providerSkills = provider.skills.map((s: string) => s.toLowerCase());
    const userInterestsLower = userInterests.map((i: string) => i.toLowerCase());
    
    const matches = providerSkills.filter((skill: string) => 
      userInterestsLower.some((interest: string) => skill.includes(interest) || interest.includes(skill))
    );
    
    return matches.length / Math.max(providerSkills.length, 1);
  }

  /**
   * Calculer le score de localisation
   */
  private static calculateLocationScore(provider: any, userLocation: string): number {
    if (!provider.city && !provider.country) return 0;
    
    const providerLocation = `${provider.city || ''} ${provider.country || ''}`.toLowerCase();
    const userLocationLower = userLocation.toLowerCase();
    
    if (providerLocation.includes(userLocationLower) || userLocationLower.includes(providerLocation)) {
      return 1;
    }
    
    // Score partiel pour même pays
    if (provider.country && userLocationLower.includes(provider.country.toLowerCase())) {
      return 0.5;
    }
    
    return 0;
  }

  /**
   * Calculer la correspondance avec la recherche
   */
  private static calculateSearchMatchScore(provider: any, searchQuery: string): number {
    const query = searchQuery.toLowerCase();
    const searchableText = [
      provider.business_name,
      provider.headline,
      provider.description,
      ...(provider.skills || []),
    ].join(' ').toLowerCase();
    
    const exactMatch = searchableText.includes(query);
    const partialMatch = query.split(' ').some(word => searchableText.includes(word));
    
    if (exactMatch) return 1;
    if (partialMatch) return 0.7;
    return 0;
  }

  /**
   * Obtenir des recommandations personnalisées pour un utilisateur
   */
  static async getPersonalizedRecommendations(userId: string, limit: number = 10): Promise<any[]> {
    // Récupérer le profil de l'utilisateur
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_data, location')
      .eq('id', userId)
      .single();

    if (!profile) return [];

    const context: RecommendationContext = {
      userId,
      userInterests: profile.onboarding_data?.interests || [],
      userLocation: profile.location,
    };

    return this.getRecommendations(context, limit);
  }

  /**
   * Obtenir des recommandations basées sur une recherche
   */
  static async getSearchRecommendations(searchQuery: string, context: Partial<RecommendationContext> = {}, limit: number = 10): Promise<any[]> {
    return this.getRecommendations({
      ...context,
      searchQuery,
    }, limit);
  }

  /**
   * Enregistrer les interactions utilisateur pour améliorer les recommandations
   */
  static async trackUserInteraction(userId: string, providerId: string, interactionType: 'view' | 'favorite' | 'booking' | 'message'): Promise<void> {
    await supabase.from('user_interactions').insert({
      user_id: userId,
      provider_id: providerId,
      interaction_type: interactionType,
      created_at: new Date().toISOString(),
    });
  }

  /**
   * Obtenir des prestataires similaires
   */
  static async getSimilarProviders(providerId: string, limit: number = 5): Promise<any[]> {
    const { data: provider } = await supabase
      .from('provider_profiles')
      .select('category_id, skills, city, country')
      .eq('id', providerId)
      .single();

    if (!provider) return [];

    const context: RecommendationContext = {
      category: provider.category_id,
      userLocation: provider.city || provider.country,
    };

    const recommendations = await this.getRecommendations(context, limit + 1);
    
    // Retirer le prestataire lui-même
    return recommendations.filter(p => p.id !== providerId).slice(0, limit);
  }
}
