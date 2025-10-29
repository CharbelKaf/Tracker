import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  iconLeft?: string; // Material icon name
}

const Input: React.FC<InputProps> = ({ label, iconLeft, className = '', ...props }) => {
  const base = 'w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 shadow-sm focus:border-primary-500 focus:ring-primary-500';
  return (
    <label className="block">
      {label && (
        <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</span>
      )}
      <div className="relative">
        {iconLeft && (
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 !text-base">
            {iconLeft}
          </span>
        )}
        <input className={[base, iconLeft ? 'pl-9 pr-3 py-2' : 'px-3 py-2', className].join(' ')} {...props} />
      </div>
    </label>
  );
};

export default Input;
