import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, helperText, className = '', ...props }, ref) => {
    const hasError = !!error;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={props.id} className="label">
            {label}
            {props.required && <span className="text-error-500 ml-1" aria-label="Champ obligatoire">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" aria-hidden="true">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={props.id}
            className={`input-field ${icon ? 'pl-10' : ''} ${hasError ? 'input-error' : ''} ${className}`}
            aria-invalid={hasError}
            aria-describedby={error ? `${props.id}-error` : helperText ? `${props.id}-helper` : undefined}
            {...props}
          />
        </div>
        {error && (
          <p id={`${props.id}-error`} className="error-message" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${props.id}-helper`} className="mt-1 text-sm text-neutral-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    const hasError = !!error;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={props.id} className="label">
            {label}
            {props.required && <span className="text-error-500 ml-1" aria-label="Champ obligatoire">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={props.id}
          className={`input-field min-h-[120px] ${hasError ? 'input-error' : ''} ${className}`}
          aria-invalid={hasError}
          aria-describedby={error ? `${props.id}-error` : helperText ? `${props.id}-helper` : undefined}
          {...props}
        />
        {error && (
          <p id={`${props.id}-error`} className="error-message" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${props.id}-helper`} className="mt-1 text-sm text-neutral-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, className = '', ...props }, ref) => {
    const hasError = !!error;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={props.id} className="label">
            {label}
            {props.required && <span className="text-error-500 ml-1" aria-label="Champ obligatoire">*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={props.id}
          className={`input-field ${hasError ? 'input-error' : ''} ${className}`}
          aria-invalid={hasError}
          aria-describedby={error ? `${props.id}-error` : helperText ? `${props.id}-helper` : undefined}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p id={`${props.id}-error`} className="error-message" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${props.id}-helper`} className="mt-1 text-sm text-neutral-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, className = '', ...props }, ref) => {
    const hasError = !!error;
    return (
      <div className="flex items-start gap-2">
        <input
          ref={ref}
          id={props.id}
          type="checkbox"
          className={`h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500 ${hasError ? 'border-error-300 focus:border-error-500 focus:ring-error-500' : ''} ${className}`}
          aria-invalid={hasError}
          aria-describedby={error ? `${props.id}-error` : undefined}
          {...props}
        />
        {label && (
          <label htmlFor={props.id} className={`text-sm text-neutral-700 ${hasError ? 'text-error-700' : ''}`}>
            {label}
            {props.required && <span className="text-error-500 ml-1" aria-label="Champ obligatoire">*</span>}
          </label>
        )}
        {error && (
          <p id={`${props.id}-error`} className="error-message" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

interface RadioGroupProps {
  label?: string;
  error?: string;
  options: { value: string; label: string; icon?: ReactNode }[];
  value: string;
  onChange: (value: string) => void;
  name: string;
}

export const RadioGroup = ({ label, error, options, value, onChange, name }: RadioGroupProps) => {
  const hasError = !!error;
  return (
    <div className="w-full" role="radiogroup" aria-invalid={hasError} aria-describedby={error ? `${name}-error` : undefined}>
      {label && (
        <label className="label">
          {label}
        </label>
      )}
      <div className="space-y-2">
        {options.map((option) => (
          <label
            key={option.value}
            htmlFor={`${name}-${option.value}`}
            className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
              value === option.value
                ? 'border-primary-500 bg-primary-50'
                : 'border-neutral-200 bg-white hover:border-neutral-300'
            }`}
          >
            <input
              type="radio"
              id={`${name}-${option.value}`}
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={(e) => onChange(e.target.value)}
              className="h-4 w-4 border-neutral-300 text-primary-600 focus:ring-primary-500"
            />
            {option.icon && <span className="text-neutral-600" aria-hidden="true">{option.icon}</span>}
            <span className="text-sm font-medium text-neutral-900">{option.label}</span>
          </label>
        ))}
      </div>
      {error && (
        <p id={`${name}-error`} className="error-message" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};
