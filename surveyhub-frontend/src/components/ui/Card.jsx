"use client";
import React from 'react';

export function Card({
  children,
  title,
  subtitle,
  action,
  className = '',
  padding = true,
  hover = false,
}) {
  return (
    <div
      className={`bg-[var(--card-bg)] border border-[var(--border)] rounded-xl shadow-sm ${
        hover ? 'hover:shadow-md hover:border-[var(--accent)] transition-all duration-200' : ''
      } ${padding ? 'p-6' : ''} ${className}`}
    >
      {(title || subtitle || action) && (
        <div className="flex justify-between items-start mb-4">
          <div>
            {title && <h3 className="text-lg font-semibold text-[var(--text-main)]">{title}</h3>}
            {subtitle && <p className="text-sm text-[var(--text-secondary)] mt-1">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return <div className={`mb-4 ${className}`}>{children}</div>;
}

export function CardContent({ children, className = '' }) {
  return <div className={className}>{children}</div>;
}

export function CardFooter({ children, className = '' }) {
  return <div className={`mt-4 pt-4 border-t border-[var(--border)] ${className}`}>{children}</div>;
}

export default Card;