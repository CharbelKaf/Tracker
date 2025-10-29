import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

const Select: React.FC<SelectProps> = ({ label, className = '', children, ...props }) => {
  const base = 'shrink-0 appearance-none rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-2 pl-4 pr-10 text-sm font-medium text-gray-700 dark:text-gray-300 focus:border-primary-500 focus:ring-primary-500 cursor-pointer';
  return (
    <label className="block">
      {label && (
        <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</span>
      )}
      <div className="relative inline-flex">
        <select className={[base, className].join(' ')} {...props}>
          {children}
        </select>
        <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-400 !text-base leading-none">expand_more</span>
      </div>
    </label>
  );
};

export default Select;
