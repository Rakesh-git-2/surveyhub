"use client";
import React, { forwardRef } from 'react';

export const Input = forwardRef(({
  label,
  type = 'text',
  error,
  helperText,
  icon,
  className = '',
  ...props
}, ref) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-[var(--text-main)] mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          type={type}
          className={`w-full px-4 py-2.5 rounded-lg border bg-[var(--primary-bg)] text-[var(--text-main)] transition-all duration-200
            ${icon ? 'pl-10' : ''}
            ${error
              ? 'border-[var(--error)] focus:ring-2 focus:ring-[var(--error)]'
              : 'border-[var(--border)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)] focus:ring-opacity-20'
            }
            outline-none placeholder:text-[var(--text-muted)]
          `}
          {...props}
        />
      </div>
      {(error || helperText) && (
        <p className={`mt-1.5 text-sm ${error ? 'text-[var(--error)]' : 'text-[var(--text-secondary)]'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export const Textarea = forwardRef(({
  label,
  error,
  helperText,
  className = '',
  rows = 4,
  ...props
}, ref) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-[var(--text-main)] mb-1.5">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        rows={rows}
        className={`w-full px-4 py-2.5 rounded-lg border bg-[var(--primary-bg)] text-[var(--text-main)] transition-all duration-200 resize-none
          ${error
            ? 'border-[var(--error)] focus:ring-2 focus:ring-[var(--error)]'
            : 'border-[var(--border)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)] focus:ring-opacity-20'
          }
          outline-none placeholder:text-[var(--text-muted)]
        `}
        {...props}
      />
      {(error || helperText) && (
        <p className={`mt-1.5 text-sm ${error ? 'text-[var(--error)]' : 'text-[var(--text-secondary)]'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

export const Select = forwardRef(({
  label,
  options = [],
  error,
  helperText,
  placeholder,
  className = '',
  ...props
}, ref) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-[var(--text-main)] mb-1.5">
          {label}
        </label>
      )}
      <select
        ref={ref}
        className={`w-full px-4 py-2.5 rounded-lg border bg-[var(--primary-bg)] text-[var(--text-main)] transition-all duration-200 cursor-pointer
          ${error
            ? 'border-[var(--error)] focus:ring-2 focus:ring-[var(--error)]'
            : 'border-[var(--border)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)] focus:ring-opacity-20'
          }
          outline-none
        `}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {(error || helperText) && (
        <p className={`mt-1.5 text-sm ${error ? 'text-[var(--error)]' : 'text-[var(--text-secondary)]'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export const Checkbox = forwardRef(({
  label,
  className = '',
  ...props
}, ref) => {
  return (
    <label className={`inline-flex items-center gap-2 cursor-pointer ${className}`}>
      <input
        ref={ref}
        type="checkbox"
        className="w-4 h-4 rounded border-[var(--border)] text-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)] focus:ring-opacity-20"
        {...props}
      />
      {label && <span className="text-sm text-[var(--text-main)]">{label}</span>}
    </label>
  );
});

Checkbox.displayName = 'Checkbox';

export const Radio = forwardRef(({
  label,
  options = [],
  name,
  className = '',
  onChange,
  ...props
}, ref) => {
  return (
    <div className={className}>
      {label && <p className="text-sm font-medium text-[var(--text-main)] mb-2">{label}</p>}
      <div className="space-y-2">
        {options.map((option) => (
          <label key={option.value} className="inline-flex items-center gap-2 cursor-pointer">
            <input
              ref={ref}
              type="radio"
              name={name}
              value={option.value}
              onChange={onChange}
              className="w-4 h-4 border-[var(--border)] text-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]"
              {...props}
            />
            <span className="text-sm text-[var(--text-main)]">{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
});

Radio.displayName = 'Radio';

export default Input;