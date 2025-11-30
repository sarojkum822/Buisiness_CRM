'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, ScanBarcode, Camera } from 'lucide-react';
import { Product } from '@/types';
import { useProducts } from '@/components/providers/ProductProvider';
import BarcodeScanner from '@/components/stock/BarcodeScanner';

// ...

export function ProductSearch({ onProductSelect, orgId }: ProductSearchProps) {
    const { products } = useProducts();

    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Product[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-focus input on mount and after selection
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleSearch = (value: string) => {
        setQuery(value);

        if (!value.trim()) {
            setResults([]);
            setIsOpen(false);
            return;
        }

        const searchTerm = value.toLowerCase();

        // Client-side filter
        const filtered = products.filter(product => {
            const nameMatch = (product.name || '').toLowerCase().includes(searchTerm);
            const barcodeMatch = (product.barcode || '').toLowerCase().includes(searchTerm);
            return nameMatch || barcodeMatch;
        }).slice(0, 10); // Limit to 10 results

        setResults(filtered);
        setIsOpen(filtered.length > 0);
    };

    const processBarcode = (barcode: string) => {
        if (!barcode) return;

        // Exact match for barcode
        const product = products.find(p => p.barcode === barcode);

        if (product) {
            onProductSelect(product);
            setQuery(''); // Clear input for next scan
            setIsOpen(false);
            inputRef.current?.focus();
        } else {
            alert('Product not found');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();

            if (query.trim()) {
                // If we have search results and it's not a pure barcode scan, select first result
                if (results.length > 0 && !/^\d{4,}$/.test(query.trim())) {
                    onProductSelect(results[0]);
                    setQuery('');
                    setIsOpen(false);
                    inputRef.current?.focus();
                    return;
                }

                // Otherwise treat as barcode
                processBarcode(query.trim());
            }
        }
    };

    const handleSelect = (product: Product) => {
        onProductSelect(product);
        setQuery('');
        setIsOpen(false);
        inputRef.current?.focus();
    };

    const handleCameraScan = (barcode: string) => {
        setShowScanner(false);
        processBarcode(barcode);
    };

    return (
        <div className="relative w-full">
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <ScanBarcode className="h-5 w-5 text-neutral-400" />
                    </div>
                    <input
                        ref={inputRef}
                        type="text"
                        className="block w-full pl-10 pr-3 py-3 border border-neutral-300 rounded-lg leading-5 bg-white placeholder-neutral-500 text-neutral-900 focus:outline-none focus:placeholder-neutral-400 focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 sm:text-sm"
                        placeholder="Scan barcode or type product name..."
                        value={query}
                        onChange={(e) => handleSearch(e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoComplete="off"
                    />

                </div>
                <button
                    onClick={() => setShowScanner(true)}
                    className="p-3 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors"
                    title="Scan with Camera"
                >
                    <Camera className="h-5 w-5" />
                </button>
            </div>

            {isOpen && results.length > 0 && (
                <ul className="absolute z-50 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                    {results.map((product) => (
                        <li
                            key={product.id}
                            className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-neutral-100 border-b border-neutral-100 last:border-0"
                            onClick={() => handleSelect(product)}
                        >
                            <div className="flex justify-between items-center">
                                <span className="font-medium block truncate text-neutral-900">{product.name}</span>
                                <span className="text-neutral-700 font-medium">₹{product.sellingPrice}</span>
                            </div>
                            <div className="flex justify-between items-center mt-0.5">
                                <span className="text-xs text-neutral-500">Stock: {product.currentStock}</span>
                                {product.barcode && <span className="text-xs text-neutral-400 font-mono">{product.barcode}</span>}
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {showScanner && (
                <BarcodeScanner
                    onScan={handleCameraScan}
                    onClose={() => setShowScanner(false)}
                    variant="modal"
                    autoStart={true}
                />
            )}
        </div>
    );
}
