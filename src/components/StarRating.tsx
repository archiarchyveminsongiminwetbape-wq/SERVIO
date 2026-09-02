import { Star } from 'lucide-react';
import { memo } from 'react';

interface StarRatingProps {
  rating?: number | null;
  size?: number;
  showValue?: boolean;
  count?: number;
}

function StarRating({ rating, size = 16, showValue = false, count }: StarRatingProps) {
  const normalizedRating = Number(rating ?? 0);

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((i) => {
          const filled = i <= Math.floor(normalizedRating);
          const half = !filled && i === Math.ceil(normalizedRating) && normalizedRating % 1 >= 0.5;
          return (
            <Star
              key={i}
              size={size}
              className={
                filled || half
                  ? 'fill-accent-400 text-accent-400'
                  : 'fill-neutral-200 text-neutral-200'
              }
            />
          );
        })}
      </div>
      {showValue && (
        <span className="text-sm font-semibold text-neutral-700">
          {normalizedRating.toFixed(1)}
        </span>
      )}
      {count !== undefined && (
        <span className="text-sm text-neutral-500">({count})</span>
      )}
    </div>
  );
}

export default memo(StarRating);
