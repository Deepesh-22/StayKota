import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = '', hover = false, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border border-slate-100 shadow-sm
        ${hover ? 'hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer' : ''}
        ${className}`}
    >
      {children}
    </div>
  );
}
