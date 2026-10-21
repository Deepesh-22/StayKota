import React from 'react';
import { CustomSelect } from './CustomSelect';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, error, options, className = '', id, value, onChange, disabled, 'aria-label': ariaLabel }: SelectProps) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className={`w-full ${className}`.trim()}>
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-slate-700 mb-1.5">
          {label}
        </label>
      )}
      <CustomSelect
        id={selectId}
        value={String(value ?? '')}
        options={options}
        disabled={disabled}
        ariaLabel={ariaLabel || label}
        hasError={Boolean(error)}
        onChange={(nextValue) => {
          onChange?.({
            target: { value: nextValue },
            currentTarget: { value: nextValue },
          } as React.ChangeEvent<HTMLSelectElement>);
        }}
      />
      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
    </div>
  );
}
