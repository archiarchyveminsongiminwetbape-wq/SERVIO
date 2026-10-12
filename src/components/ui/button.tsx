import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg';
  children: React.ReactNode;
}

export function Button({ 
  variant = 'default', 
  size = 'default', 
  className = '', 
  children, 
  ...props 
}: ButtonProps) {
  const variantStyles = {
    default: 'bg-primary-700 text-white shadow-sm hover:bg-primary-800',
    outline: 'border border-neutral-300 bg-white text-neutral-800 hover:border-primary-500 hover:bg-primary-50 hover:text-primary-800',
    ghost: 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950',
    destructive: 'bg-error-600 text-white hover:bg-error-700'
  };

  const sizeStyles = {
    default: 'min-h-11 px-4 py-2.5',
    sm: 'min-h-9 px-3 py-1.5 text-sm',
    lg: 'min-h-12 px-6 py-3 text-base'
  };

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}