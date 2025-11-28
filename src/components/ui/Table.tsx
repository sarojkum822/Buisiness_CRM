import React from 'react';

interface TableProps {
    children: React.ReactNode;
}

export function Table({ children }: TableProps) {
    return (
        <div className="overflow-x-auto rounded-lg border border-neutral-200">
            <table className="w-full">
                {children}
            </table>
        </div>
    );
}

interface TableHeaderProps {
    children: React.ReactNode;
}

export function TableHeader({ children }: TableHeaderProps) {
    return (
        <thead className="bg-neutral-50">
            <tr>{children}</tr>
        </thead>
    );
}

interface TableHeadProps {
    children: React.ReactNode;
    className?: string;
}

export function TableHead({ children, className = '' }: TableHeadProps) {
    return (
        <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-600 ${className}`}>
            {children}
        </th>
    );
}

interface TableBodyProps {
    children: React.ReactNode;
}

export function TableBody({ children }: TableBodyProps) {
    return <tbody className="divide-y divide-neutral-200 bg-white">{children}</tbody>;
}

interface TableRowProps {
    children: React.ReactNode;
    className?: string;
}

export function TableRow({ children, className = '' }: TableRowProps) {
    return <tr className={`hover:bg-neutral-50 ${className}`}>{children}</tr>;
}

interface TableCellProps {
    children: React.ReactNode;
    className?: string;
}

export function TableCell({ children, className = '' }: TableCellProps) {
    return (
        <td className={`px-4 py-3 text-sm text-neutral-900 ${className}`}>
            {children}
        </td>
    );
}
