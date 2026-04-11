import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: 'primary' | 'ghost';
};

export function Button({ children, className = '', variant = 'primary', ...rest }: ButtonProps) {
  const base =
    variant === 'primary'
      ? 'rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[#0f0f12] disabled:opacity-50'
      : 'rounded-lg border border-[var(--border)] px-4 py-2 text-sm';
  return (
    <button type="button" className={`${base} ${className}`.trim()} {...rest}>
      {children}
    </button>
  );
}
