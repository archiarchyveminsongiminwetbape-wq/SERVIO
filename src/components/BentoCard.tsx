import { LucideIcon } from 'lucide-react';

interface BentoStatCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  trend?: string;
  variant?: 'default' | 'primary' | 'gradient' | 'dark';
}

export function BentoStatCard({ 
  icon: Icon, 
  value, 
  label, 
  trend,
  variant = 'default' 
}: BentoStatCardProps) {
  const variantClasses = {
    default: 'bg-white border border-neutral-200',
    primary: 'bg-primary-50 border border-primary-200',
    gradient: 'bg-gradient-to-br from-primary-500 to-primary-600 text-white border-0',
    dark: 'bg-neutral-900 text-white border-0'
  }[variant];

  return (
    <div className={`${variantClasses} rounded-3xl p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-2xl ${variant === 'gradient' || variant === 'dark' ? 'bg-white/20' : 'bg-primary-100'}`}>
          <Icon size={24} className={variant === 'gradient' || variant === 'dark' ? 'text-white' : 'text-primary-600'} />
        </div>
        {trend && (
          <span className="text-xs font-semibold text-success-600 bg-success-50 px-2 py-1 rounded-full">
            {trend}
          </span>
        )}
      </div>
      <div className={`text-3xl font-bold ${variant === 'gradient' || variant === 'dark' ? 'text-white' : 'text-neutral-900'} mb-1`}>
        {value}
      </div>
      <div className={`text-sm ${variant === 'gradient' || variant === 'dark' ? 'text-primary-100' : 'text-neutral-600'}`}>
        {label}
      </div>
    </div>
  );
}

interface BentoFeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  variant?: 'default' | 'primary' | 'gradient';
}

export function BentoFeatureCard({ 
  icon: Icon, 
  title, 
  description,
  variant = 'default'
}: BentoFeatureCardProps) {
  const variantClasses = {
    default: 'bg-white border border-neutral-200',
    primary: 'bg-primary-50 border border-primary-200',
    gradient: 'bg-gradient-to-br from-primary-500 to-primary-600 text-white border-0'
  }[variant];

  return (
    <div className={`${variantClasses} rounded-3xl p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1`}>
      <div className={`p-3 rounded-2xl mb-4 ${variant === 'gradient' ? 'bg-white/20' : 'bg-primary-100'}`}>
        <Icon size={24} className={variant === 'gradient' ? 'text-white' : 'text-primary-600'} />
      </div>
      <h3 className={`text-xl font-bold mb-2 ${variant === 'gradient' ? 'text-white' : 'text-neutral-900'}`}>
        {title}
      </h3>
      <p className={`text-sm ${variant === 'gradient' ? 'text-primary-100' : 'text-neutral-600'}`}>
        {description}
      </p>
    </div>
  );
}

interface BentoImageCardProps {
  image: string;
  title: string;
  description?: string;
  overlay?: boolean;
}

export function BentoImageCard({ image, title, description, overlay = true }: BentoImageCardProps) {
  return (
    <div className="relative rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group">
      <img 
        src={image} 
        alt={title} 
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      {overlay && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      )}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <h3 className="text-xl font-bold text-white mb-1">{title}</h3>
        {description && (
          <p className="text-sm text-white/80">{description}</p>
        )}
      </div>
    </div>
  );
}

interface BentoActionCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action: string;
  onClick?: () => void;
  variant?: 'default' | 'primary' | 'gradient';
}

export function BentoActionCard({ 
  icon: Icon, 
  title, 
  description, 
  action,
  onClick,
  variant = 'primary'
}: BentoActionCardProps) {
  const variantClasses = {
    default: 'bg-white border border-neutral-200',
    primary: 'bg-primary-50 border border-primary-200',
    gradient: 'bg-gradient-to-br from-primary-500 to-primary-600 text-white border-0'
  }[variant];

  return (
    <div 
      onClick={onClick}
      className={`${variantClasses} rounded-3xl p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer`}
    >
      <div className={`p-3 rounded-2xl mb-4 ${variant === 'gradient' ? 'bg-white/20' : 'bg-primary-100'}`}>
        <Icon size={24} className={variant === 'gradient' ? 'text-white' : 'text-primary-600'} />
      </div>
      <h3 className={`text-xl font-bold mb-2 ${variant === 'gradient' ? 'text-white' : 'text-neutral-900'}`}>
        {title}
      </h3>
      <p className={`text-sm mb-4 ${variant === 'gradient' ? 'text-primary-100' : 'text-neutral-600'}`}>
        {description}
      </p>
      <span className={`text-sm font-semibold ${variant === 'gradient' ? 'text-white' : 'text-primary-600'}`}>
        {action} →
      </span>
    </div>
  );
}
