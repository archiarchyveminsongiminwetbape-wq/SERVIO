// Analytics tracking utilities
// Supports Google Analytics and custom analytics

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

export function initAnalytics(gaId?: string) {
  if (!gaId) return;

  // Load Google Analytics
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  document.head.appendChild(script);

  window.gtag = window.gtag || function (...args: any[]) {
    (window.dataLayer = window.dataLayer || []).push(args);
  };

  window.gtag('js', new Date());
  window.gtag('config', gaId);
}

export function trackPageView(path: string, title?: string) {
  if (window.gtag) {
    window.gtag('event', 'page_view', {
      page_path: path,
      page_title: title || document.title,
    });
  }
}

export function trackEvent(eventName: string, parameters?: Record<string, any>) {
  if (window.gtag) {
    window.gtag('event', eventName, parameters);
  }
}

// Custom event tracking
export function trackSearch(query: string, resultsCount: number) {
  trackEvent('search', {
    search_query: query,
    results_count: resultsCount,
  });
}

export function trackBooking(providerId: string, providerName: string) {
  trackEvent('booking_initiated', {
    provider_id: providerId,
    provider_name: providerName,
  });
}

export function trackBookingCompleted(bookingId: string, amount: number) {
  trackEvent('booking_completed', {
    booking_id: bookingId,
    amount: amount,
  });
}

export function trackFavorite(providerId: string, action: 'add' | 'remove') {
  trackEvent('favorite', {
    provider_id: providerId,
    action,
  });
}

export function trackMessage(conversationId: string) {
  trackEvent('message_sent', {
    conversation_id: conversationId,
  });
}

export function trackReview(providerId: string, rating: number) {
  trackEvent('review_submitted', {
    provider_id: providerId,
    rating,
  });
}

export function trackSignUp(method: 'email' | 'google' | 'github') {
  trackEvent('sign_up', {
    method,
  });
}

export function trackLogin(method: 'email' | 'google' | 'github') {
  trackEvent('login', {
    method,
  });
}

export function trackError(error: Error, context?: string) {
  trackEvent('error', {
    error_message: error.message,
    error_stack: error.stack,
    context,
  });
}
