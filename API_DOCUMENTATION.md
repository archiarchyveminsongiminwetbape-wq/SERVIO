# SERVIO API Documentation

## Overview
This document describes the complete API structure for the SERVIO platform. All API functions use Supabase as the backend and follow a consistent response pattern.

## API Response Pattern
All API functions return a standardized response:

```typescript
type ApiResponse<T> = {
  data: T | null;
  error: string | null;
  success: boolean;
};
```

## Available API Modules

### 1. Profiles API (`profilesApi`)
User profile management operations.

#### Methods
- `getProfile(userId: string)` - Get user profile by ID
- `updateProfile(userId: string, updates)` - Update user profile
- `updateAvatar(userId: string, avatarUrl: string)` - Update user avatar
- `searchProfiles(query: string, filters?)` - Search profiles
- `deleteProfile(userId: string)` - Delete profile (admin only)

#### Example Usage
```typescript
import { profilesApi } from '@/lib/api/api';

const { data, error, success } = await profilesApi.getProfile('user-id');
if (success) {
  console.log(data.full_name);
}
```

### 2. Providers API (`providersApi`)
Provider profile management operations.

#### Methods
- `getProviders(filters?)` - Get all providers with optional filters
- `getProviderBySlug(slug: string)` - Get provider by slug
- `getProviderByUserId(userId: string)` - Get provider by user ID
- `createProviderProfile(profile)` - Create new provider profile
- `updateProviderProfile(id: string, updates)` - Update provider profile
- `updateAvailability(id: string, availability)` - Update availability status
- `addBadge(id: string, badge: string)` - Add badge to provider
- `updateRating(id: string, rating: number, count: number)` - Update provider rating
- `deleteProviderProfile(id: string)` - Delete provider profile
- `searchProviders(query: string)` - Search providers
- `getFeaturedProviders(limit: number)` - Get featured providers

#### Filters
```typescript
{
  category_id?: string;
  city?: string;
  min_rating?: number;
  availability?: 'available' | 'busy' | 'unavailable';
  remote_service?: boolean;
  limit?: number;
  offset?: number;
}
```

### 3. Messages API (`messagesApi`)
Messaging and conversation management.

#### Methods
- `getConversations(userId: string)` - Get all user conversations
- `getConversation(conversationId: string)` - Get conversation by ID
- `createConversation(conversation)` - Create new conversation
- `getOrCreateConversation(clientId: string, providerId: string)` - Get or create conversation
- `updateConversation(conversationId: string, updates)` - Update conversation
- `markConversationAsRead(conversationId: string, userId: string)` - Mark as read
- `deleteConversation(conversationId: string)` - Delete conversation
- `getMessages(conversationId: string, limit?: number)` - Get conversation messages
- `sendMessage(message)` - Send message
- `markMessageAsRead(messageId: string)` - Mark message as read
- `getUnreadCount(userId: string)` - Get unread message count
- `deleteMessage(messageId: string)` - Delete message

### 4. Reviews API (`reviewsApi`)
Review and rating management.

#### Methods
- `getProviderReviews(providerId: string)` - Get provider reviews
- `getReview(reviewId: string)` - Get review by ID
- `createReview(review)` - Create new review
- `updateReview(reviewId: string, updates)` - Update review
- `deleteReview(reviewId: string)` - Delete review
- `getUserReviews(userId: string)` - Get user's reviews
- `hasUserReviewedProvider(userId: string, providerId: string)` - Check if reviewed
- `getProviderAverageRating(providerId: string)` - Get average rating
- `getRecentReviews(limit?: number)` - Get recent reviews

### 5. Favorites API (`favoritesApi`)
Favorite management operations.

#### Methods
- `getUserFavorites(userId: string)` - Get user's favorites
- `isProviderFavorited(userId: string, providerId: string)` - Check if favorited
- `addFavorite(userId: string, providerId: string)` - Add to favorites
- `removeFavorite(userId: string, providerId: string)` - Remove from favorites
- `toggleFavorite(userId: string, providerId: string)` - Toggle favorite status
- `getProviderFavoriteCount(providerId: string)` - Get favorite count
- `getProviderFavorites(providerId: string)` - Get provider's favorites

### 6. Notifications API (`notificationsApi`)
Notification management operations.

#### Methods
- `getUserNotifications(userId: string, limit?: number)` - Get user notifications
- `getUnreadNotifications(userId: string)` - Get unread notifications
- `getNotification(notificationId: string)` - Get notification by ID
- `createNotification(notification)` - Create notification
- `markAsRead(notificationId: string)` - Mark as read
- `markAllAsRead(userId: string)` - Mark all as read
- `deleteNotification(notificationId: string)` - Delete notification
- `getUnreadCount(userId: string)` - Get unread count
- `notifyNewMessage(userId, conversationId, senderName)` - Notify new message
- `notifyNewReview(userId, providerId, reviewerName, rating)` - Notify new review
- `notifyBookingRequest(userId, clientId, clientName)` - Notify booking request

### 7. Categories API (`categoriesApi`)
Category management operations.

#### Methods
- `getAllCategories()` - Get all categories
- `getCategoryById(categoryId: string)` - Get category by ID
- `getCategoryBySlug(slug: string)` - Get category by slug
- `getParentCategories()` - Get parent categories
- `getSubcategories(parentId: string)` - Get subcategories
- `createCategory(category)` - Create category (admin)
- `updateCategory(categoryId: string, updates)` - Update category (admin)
- `deleteCategory(categoryId: string)` - Delete category (admin)
- `searchCategories(query: string)` - Search categories

### 8. Portfolio API (`portfolioApi`)
Portfolio item management operations.

#### Methods
- `getProviderPortfolio(providerId: string)` - Get provider portfolio
- `getPortfolioItem(itemId: string)` - Get portfolio item
- `createPortfolioItem(item)` - Create portfolio item
- `updatePortfolioItem(itemId: string, updates)` - Update portfolio item
- `deletePortfolioItem(itemId: string)` - Delete portfolio item
- `updateSortOrder(itemId: string, sortOrder: number)` - Update sort order
- `addPhoto(itemId: string, photoUrl: string)` - Add photo
- `removePhoto(itemId: string, photoUrl: string)` - Remove photo
- `searchPortfolioItems(query: string, providerId?)` - Search portfolio
- `getPortfolioByCategory(categoryId: string)` - Get by category

### 9. Validation Utilities
Data validation helpers and schemas.

#### Validators
- `email(email: string)` - Validate email
- `phone(phone: string)` - Validate phone (French format)
- `url(url: string)` - Validate URL
- `rating(rating: number)` - Validate rating (1-5)
- `priceRange(price: string)` - Validate price range
- `slug(slug: string)` - Validate slug
- `required(value: any)` - Check required field
- `minLength(value: string, min: number)` - Check minimum length
- `maxLength(value: string, max: number)` - Check maximum length
- `min(value: number, min: number)` - Check minimum value
- `max(value: number, max: number)` - Check maximum value

#### Validation Schemas
- `schemas.profile` - Profile validation schema
- `schemas.providerProfile` - Provider profile validation schema
- `schemas.review` - Review validation schema
- `schemas.message` - Message validation schema

#### Example Usage
```typescript
import { validateSchema, schemas } from '@/lib/api/api';

const result = validateSchema(schemas.review, {
  rating: 5,
  comment: 'Great service!'
});

if (!result.valid) {
  console.log(result.errors);
}
```

## Error Handling
All API functions include built-in error handling. Check the `success` property and `error` message:

```typescript
const { success, error, data } = await providersApi.getProviderBySlug('provider-slug');

if (!success) {
  console.error('Error:', error);
  // Handle error
} else {
  // Use data
}
```

## Authentication
All API functions rely on Supabase authentication. Make sure the user is authenticated before calling API functions:

```typescript
import { supabase } from '@/lib/supabase';

const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  // Redirect to login
}
```

## Best Practices

1. **Always check success status**: Check `success` before accessing `data`
2. **Handle errors gracefully**: Display user-friendly error messages
3. **Use validation**: Validate user input before sending to API
4. **Optimize queries**: Use filters and limits to reduce data transfer
5. **Cache responses**: Cache frequently accessed data
6. **Use transactions**: For related operations, use Supabase transactions

## TypeScript Support
All API functions are fully typed. Import types from `@/types`:

```typescript
import type { ProviderProfile, Review, Message } from '@/types';
```

## Testing
To test API functions, create test files in `__tests__` directory:

```typescript
import { providersApi } from '@/lib/api/api';

describe('Providers API', () => {
  it('should get providers', async () => {
    const result = await providersApi.getProviders();
    expect(result.success).toBe(true);
  });
});
```

## Future Enhancements
- Add real-time subscriptions using Supabase Realtime
- Implement file upload handling for avatars and portfolio images
- Add caching layer with Redis
- Implement rate limiting
- Add API analytics and monitoring
