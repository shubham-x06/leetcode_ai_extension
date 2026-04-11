import type { HTMLAttributes, ReactNode } from 'react';

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function Card({ children, className = '', ...rest }: CardProps) {
  return (
    <div className={`rounded-xl border border-[var(--border)] bg-[var(--panel)] p-5 ${className}`.trim()} {...rest}>
      {children}
    </div>
  );
}
