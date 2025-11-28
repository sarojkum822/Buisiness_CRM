import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
    icon?: React.ReactNode;
}

export function Input({
    label,
    error,
    helperText,
    className = '',
    id,
    icon,
    ...props
}: InputProps) {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
        <div className="w-full">
            {label && (
                <label
                    htmlFor={inputId}
                    className="mb-1.5 block text-sm font-medium text-neutral-700"
                >
                    {label}
                    {props.required && <span className="ml-1 text-red-600">*</span>}
                </label>
            )}
            <div className="relative">
                <input
                    id={inputId}
                    className={`w-full rounded-lg border px-3 py-2 text-sm text-neutral-900 transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-1 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500 placeholder:text-neutral-600 ${error
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-neutral-300 hover:border-neutral-400'
                        } ${icon ? 'pr-10' : ''} ${className}`}
                    {...props}
                />
                {icon && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500">
                        {icon}
                    </div>
                )}
            </div>
            {error && (
                <p className="mt-1.5 text-xs text-red-600">{error}</p>
            )}
            {helperText && !error && (
                <p className="mt-1.5 text-xs text-neutral-500">{helperText}</p>
            )}
        </div>
    );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    helperText?: string;
}

export function Select({
    label,
    error,
    helperText,
    className = '',
    id,
    children,
    ...props
}: SelectProps) {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
        <div className="w-full">
            {label && (
                <label
                    htmlFor={selectId}
                    className="mb-1.5 block text-sm font-medium text-neutral-700"
                >
                    {label}
                    {props.required && <span className="ml-1 text-red-600">*</span>}
                </label>
            )}
            <select
                id={selectId}
                className={`w-full rounded-lg border px-3 py-2 text-sm text-neutral-900 transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-1 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500 ${error
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-neutral-300 hover:border-neutral-400'
                    } ${className}`}
                {...props}
            >
                {children}
            </select>
            {error && (
                <p className="mt-1.5 text-xs text-red-600">{error}</p>
            )}
            {helperText && !error && (
                <p className="mt-1.5 text-xs text-neutral-500">{helperText}</p>
            )}
        </div>
    );
}
