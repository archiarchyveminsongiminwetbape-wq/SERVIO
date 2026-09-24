import React, { useState } from 'react';

interface SelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  placeholder?: string;
  className?: string;
}

export function Select({ value, onValueChange, children, placeholder = 'Select...', className = '' }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-left bg-white"
      >
        {value || placeholder}
      </button>
      
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {React.Children.map(children, child => 
            React.cloneElement(child as React.ReactElement, {
              onSelect: (selectedValue: string) => {
                onValueChange(selectedValue);
                setIsOpen(false);
              }
            })
          )}
        </div>
      )}
    </div>
  );
}

interface SelectTriggerProps {
  children: React.ReactNode;
  className?: string;
}

export function SelectTrigger({ children, className = '' }: SelectTriggerProps) {
  return <div className={className}>{children}</div>;
}

interface SelectValueProps {
  placeholder?: string;
  className?: string;
}

export function SelectValue({ placeholder, className = '' }: SelectValueProps) {
  return <span className={className}>{placeholder}</span>;
}

interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}

export function SelectContent({ children, className = '' }: SelectContentProps) {
  return <div className={className}>{children}</div>;
}

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  onSelect?: (value: string) => void;
  className?: string;
}

export function SelectItem({ value, children, onSelect, className = '' }: SelectItemProps) {
  return (
    <div
      onClick={() => onSelect?.(value)}
      className={`px-3 py-2 hover:bg-gray-100 cursor-pointer ${className}`}
    >
      {children}
    </div>
  );
}