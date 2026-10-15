import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export function Input({ label, error, helper, className = '', id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-700 mb-1.5">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full px-4 py-2.5 rounded-xl border bg-white text-slate-900 placeholder:text-slate-400
          focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
          transition-shadow duration-200
          ${error ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 hover:border-slate-300'}
          ${className}`}
        {...props}
      />
      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
      {helper && !error && <p className="mt-1.5 text-sm text-slate-500">{helper}</p>}
    </div>
  );
}
