import { BadgeCheck } from 'lucide-react';
import { memo } from 'react';

interface VerifiedBadgeProps {
  size?: number;
  showLabel?: boolean;
  variant?: 'default' | 'small' | 'large';
}

function VerifiedBadge({ size = 16, showLabel = false, variant = 'default' }: VerifiedBadgeProps) {
  const sizeClasses = {
    small: 'h-4 w-4',
    default: 'h-5 w-5',
    large: 'h-6 w-6',
  };

  const labelClasses = {
    small: 'text-xs',
    default: 'text-sm',
    large: 'text-base',
  };

  return (
    <div className="inline-flex items-center gap-1.5">
      <div className={`flex items-center justify-center rounded-full bg-blue-500 text-white ${sizeClasses[variant]}`}>
        <BadgeCheck size={size} className="stroke-2" />
      </div>
      {showLabel && (
        <span className={`font-semibold text-blue-600 ${labelClasses[variant]}`}>
          Vérifié
        </span>
      )}
    </div>
  );
}

export default memo(VerifiedBadge);
