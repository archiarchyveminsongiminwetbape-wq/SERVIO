import { ReactNode } from 'react';

interface BentoGridProps {
  children: ReactNode;
  className?: string;
}

export function BentoGrid({ children, className = '' }: BentoGridProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {children}
    </div>
  );
}

interface BentoCardProps {
  children: ReactNode;
  className?: string;
  colSpan?: 1 | 2 | 3;
  rowSpan?: 1 | 2;
  variant?: 'default' | 'primary' | 'gradient' | 'dark';
  hover?: boolean;
}

export function BentoCard({ 
  children, 
  className = '', 
  colSpan = 1, 
  rowSpan = 1,
  variant = 'default',
  hover = true
}: BentoCardProps) {
  const colSpanClass = {
    1: 'col-span-1',
    2: 'col-span-1 md:col-span-2',
    3: 'col-span-1 md:col-span-2 lg:col-span-3'
  }[colSpan];

  const rowSpanClass = {
    1: 'row-span-1',
    2: 'row-span-2'
  }[rowSpan];

  const variantClasses = {
    default: 'bg-white border border-neutral-200',
    primary: 'bg-primary-50 border border-primary-200',
    gradient: 'bg-gradient-to-br from-primary-500 to-primary-600 text-white border-0',
    dark: 'bg-neutral-900 text-white border-0'
  }[variant];

  const hoverClass = hover 
    ? 'transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer' 
    : '';

  return (
    <div className={`
      ${colSpanClass} 
      ${rowSpanClass} 
      ${variantClasses} 
      ${hoverClass}
      rounded-3xl p-6
      ${className}
    `}>
      {children}
    </div>
  );
}

interface BentoSectionProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function BentoSection({ title, description, children, className = '' }: BentoSectionProps) {
  return (
    <section className={`py-12 ${className}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {(title || description) && (
          <div className="mb-8">
            {title && (
              <h2 className="text-3xl font-bold text-neutral-900 mb-2">{title}</h2>
            )}
            {description && (
              <p className="text-lg text-neutral-600">{description}</p>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
