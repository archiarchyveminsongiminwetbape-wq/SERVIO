export type UserRole = 'visitor' | 'provider' | 'admin';
export type UserStatus = 'active' | 'suspended' | 'banned';
export type ValidationStatus = 'pending' | 'approved' | 'rejected' | 'changes_requested';
export type AvailabilityStatus = 'available' | 'busy' | 'unavailable';
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
export type LocationType = 'in_person' | 'remote' | 'hybrid';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
export type PaymentMethod = 'card' | 'bank_transfer' | 'paypal' | 'cash';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'cancelled' | 'unpaid';
export type SubscriptionPlan = 'free' | 'basic' | 'pro' | 'enterprise';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  status: UserStatus;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  icon: string | null;
  description: string | null;
  sort_order: number;
  created_at: string;
}

export interface ProviderProfile {
  id: string;
  user_id: string;
  business_name: string;
  slug: string;
  headline: string | null;
  description: string | null;
  avatar_url: string | null;
  owner_avatar_url?: string | null;
  banner_url: string | null;
  category_id: string | null;
  skills: string[];
  experience_years: number | null;
  languages: string[];
  certifications: string | null;
  city: string | null;
  country: string | null;
  service_area: string | null;
  remote_service: boolean;
  phone: string | null;
  website: string | null;
  social_links: Record<string, string>;
  price_range: string | null;
  availability: AvailabilityStatus;
  validation_status: ValidationStatus;
  validation_note: string | null;
  validated_at: string | null;
  validated_by: string | null;
  badges: string[];
  rating_avg: number;
  rating_count: number;
  profile_views: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  category?: Category | null;
}

export interface PortfolioItem {
  // ===== BASIC INFO =====
  id: string;
  provider_id: string;
  title: string;
  description: string | null; // Short description
  sort_order: number;
  featured: boolean;
  view_count?: number;
  like_count?: number;
  created_at: string;
  updated_at: string;

  // ===== PROJECT CONTEXT (Élément obligatoire) =====
  context: string | null; // Problématique, brief, contraintes
  objective: string | null; // Ce qu'il fallait accomplir
  role: string | null; // Votre contribution exacte (seul ou en équipe)
  process: string | null; // Méthodologie, outils utilisés, étapes clés
  result: string | null; // Livrable final, impact mesurable (chiffres, KPIs, retours)

  // ===== PROJECT DETAILS =====
  client_name: string | null;
  project_date: string | null;
  budget: string | null;
  location: string | null;
  duration: string | null;
  team_size: number | null;

  // ===== MEDIA & VISUALS =====
  photos: string[]; // Array of image URLs
  videos: string[]; // Array of video URLs
  video_thumbnails: string[]; // Thumbnails for videos
  video_url: string | null; // Primary video URL (deprecated, use videos array)
  project_links: {
    label: string;
    url: string;
    type?: 'demo' | 'repo' | 'case-study' | 'live' | 'other';
  }[];

  // ===== SKILLS & TAGS =====
  category_id: string | null;
  tags: string[]; // Project tags
  technologies_used: string[]; // Tech stack used
}

export interface Review {
  id: string;
  provider_id: string;
  author_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
  author?: Profile | null;
  responses?: ReviewResponse[];
}

export interface ReviewResponse {
  id: string;
  review_id: string;
  responder_id: string;
  response: string;
  created_at: string;
  updated_at: string;
  responder?: Profile | null;
}

export interface Conversation {
  id: string;
  participant_a: string;
  participant_b: string;
  last_message_preview: string | null;
  last_message_at: string | null;
  status: 'open' | 'closed';
  created_at: string;
  other_user?: Profile | null;
  other_provider?: ProviderProfile | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  attachments: MessageAttachment[];
  read_at: string | null;
  created_at: string;
}

export interface MessageAttachment {
  id: string;
  message_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

export interface Booking {
  id: string;
  client_id: string;
  provider_id: string;
  service_type: string | null;
  scheduled_at: string;
  duration_minutes: number | null;
  location_type: LocationType;
  location_address: string | null;
  notes: string | null;
  status: BookingStatus;
  price: number | null;
  currency: string | null;
  payment_method: PaymentMethod | null;
  payment_status: PaymentStatus;
  created_at: string;
  updated_at: string;
  client?: Profile | null;
  provider?: ProviderProfile | null;
}

export interface Invoice {
  id: string;
  booking_id: string;
  client_id: string;
  provider_id: string;
  invoice_number: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  due_date: string;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  client?: Profile | null;
  provider?: ProviderProfile | null;
  booking?: Booking | null;
}

export interface AvailabilitySlot {
  id: string;
  provider_id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  provider_id: string;
  created_at: string;
}

export interface Report {
  id: string;
  report_type: 'profile' | 'portfolio' | 'review' | 'message';
  target_id: string;
  reporter_id: string;
  reason: string;
  status: 'open' | 'reviewing' | 'resolved' | 'dismissed';
  resolved_by: string | null;
  resolution_note: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface AdminAction {
  id: string;
  admin_id: string;
  action_type: string;
  target_type: string | null;
  target_id: string | null;
  details: string | null;
  created_at: string;
  admin?: Profile | null;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'message' | 'validation' | 'review' | 'report' | 'system';
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  provider_profile_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  client_id: string;
  provider_profile_id: string | null;
  booking_id: string | null;
  subscription_id: string | null;
  type: 'booking' | 'subscription' | 'custom';
  status: InvoiceStatus;
  amount: number;
  currency: string;
  tax_amount: number;
  total_amount: number;
  due_date: string | null;
  paid_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  booking_id: string | null;
  user_id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_method: PaymentMethod;
  payment_provider: string | null;
  provider_payment_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  failed_at: string | null;
  refunded_at: string | null;
  refund_reason: string | null;
  booking?: Booking | null;
}

export interface Invoice {
  id: string;
  booking_id: string;
  client_id: string;
  provider_id: string;
  invoice_number: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  due_date: string;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  client?: Profile | null;
  provider?: ProviderProfile | null;
  booking?: Booking | null;
}
