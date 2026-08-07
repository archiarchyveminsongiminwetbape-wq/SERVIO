import { useState } from 'react';
import { Star, Loader2, X } from 'lucide-react';
import { createReview, updateReview, type Review } from '@/services/reviewService';

interface ReviewFormProps {
  bookingId: string;
  userId: string;
  providerId: string;
  existingReview?: Review;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ReviewForm({
  bookingId,
  userId,
  providerId,
  existingReview,
  onSuccess,
  onCancel,
}: ReviewFormProps) {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState(existingReview?.title || '');
  const [content, setContent] = useState(existingReview?.content || '');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0 || !content.trim()) return;

    setSubmitting(true);

    const success = existingReview
      ? await updateReview(existingReview.id, { rating, title, content })
      : await createReview({
          booking_id: bookingId,
          user_id: userId,
          provider_id: providerId,
          rating,
          title,
          content,
        });

    setSubmitting(false);

    if (success) {
      onSuccess?.();
    }
  }

  return (
    <div className="card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-neutral-900">
          {existingReview ? 'Modifier votre avis' : 'Laisser un avis'}
        </h3>
        {onCancel && (
          <button
            onClick={onCancel}
            className="p-1 hover:bg-neutral-100 rounded-full"
          >
            <X size={18} className="text-neutral-400" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Rating */}
        <div>
          <label className="label">Note</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  size={24}
                  className={
                    (hoverRating || rating) >= star
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-neutral-300'
                  }
                />
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="label">Titre (optionnel)</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Résumez votre expérience"
            className="input-field"
            maxLength={255}
          />
        </div>

        {/* Content */}
        <div>
          <label className="label">Votre avis</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Partagez votre expérience avec ce prestataire..."
            className="input-field min-h-[120px]"
            required
            minLength={10}
          />
          <p className="text-xs text-neutral-500 mt-1">
            {content.length} caractères (minimum 10)
          </p>
        </div>

        {/* Submit */}
        <div className="flex gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary flex-1"
            >
              Annuler
            </button>
          )}
          <button
            type="submit"
            disabled={rating === 0 || !content.trim() || submitting}
            className="btn-primary flex-1"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={18} className="animate-spin" />
                Envoi...
              </span>
            ) : (
              existingReview ? 'Mettre à jour' : 'Publier'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
