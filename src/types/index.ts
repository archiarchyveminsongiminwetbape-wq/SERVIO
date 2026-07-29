export type UserRole = 'visitor' | 'provider' | 'admin';
export type UserStatus = 'active' | 'suspended' | 'banned';
export type ValidationStatus = 'pending' | 'approved' | 'rejected' | 'changes_requested';
export type AvailabilityStatus = 'available' | 'busy' | 'unavailable';

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
  banner_url: string | null;
  category_id: string | null;
  skills: string[];
  experience_years: number | null;
  languages: string[];
  certifications: string | null;
  city: string | null;
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
  id: string;
  provider_id: string;
  title: string;
  description: string | null;
  photos: string[];
  video_url: string | null;
  category_id: string | null;
  tags: string[];
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  provider_id: string;
  author_id: string;
  rating: number;
  comment: string | null;
  provider_response: string | null;
  provider_response_at: string | null;
  created_at: string;
  author?: Profile | null;
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
  attachment_url: string | null;
  read_at: string | null;
  created_at: string;
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
