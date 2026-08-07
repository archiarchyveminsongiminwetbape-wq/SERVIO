import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'dark' | 'primary' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  hover?: boolean;
  glow?: boolean;
}

export function GlassCard({ 
  children, 
  className = '', 
  variant = 'default',
  size = 'md',
  hover = true,
  glow = false
}: GlassCardProps) {
  const variantClasses = {
    default: 'glass-card',
    dark: 'glass-card-dark',
    primary: 'glass-primary',
    gradient: 'glass-gradient'
  }[variant];

  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }[size];

  const hoverClass = hover ? 'hover:transform hover:-translate-y-1' : '';
  const glowClass = glow ? 'glass-glow' : '';

  return (
    <div className={`${variantClasses} ${sizeClasses} ${hoverClass} ${glowClass} ${className}`}>
      {children}
    </div>
  );
}

interface GlassButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'primary' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export function GlassButton({ 
  children, 
  onClick, 
  className = '', 
  variant = 'default',
  size = 'md',
  disabled = false
}: GlassButtonProps) {
  const variantClasses = {
    default: 'glass-btn',
    primary: 'glass-btn-primary',
    dark: 'glass-btn glass-card-dark'
  }[variant];

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  }[size];

  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`${variantClasses} ${sizeClasses} font-medium transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  );
}

interface GlassInputProps {
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  variant?: 'default' | 'dark';
  icon?: ReactNode;
}

export function GlassInput({ 
  type = 'text',
  placeholder,
  value,
  onChange,
  className = '',
  variant = 'default',
  icon
}: GlassInputProps) {
  const variantClasses = {
    default: 'glass-input',
    dark: 'glass-input-dark'
  }[variant];

  return (
    <div className="relative">
      {icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
          {icon}
        </div>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`${variantClasses} w-full ${icon ? 'pl-12' : 'px-4'} py-3 ${className}`}
      />
    </div>
  );
}

interface GlassBadgeProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'primary';
}

export function GlassBadge({ 
  children, 
  className = '', 
  variant = 'default'
}: GlassBadgeProps) {
  const variantClasses = {
    default: 'glass-badge',
    primary: 'glass-badge-primary'
  }[variant];

  return (
    <span className={`${variantClasses} px-3 py-1 text-sm font-medium ${className}`}>
      {children}
    </span>
  );
}

interface GlassModalProps {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  variant?: 'default' | 'dark';
}

export function GlassModal({ 
  children, 
  isOpen, 
  onClose, 
  className = '',
  variant = 'default'
}: GlassModalProps) {
  if (!isOpen) return null;

  const variantClasses = {
    default: 'glass-modal',
    dark: 'glass-modal-dark'
  }[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className={`${variantClasses} relative max-w-2xl w-full max-h-[90vh] overflow-auto ${className}`}>
        {children}
      </div>
    </div>
  );
}
