import { useEffect, useRef } from 'react';

interface UseScanDetectionOptions {
    onScan: (barcode: string) => void;
    minLength?: number;
    timeLimit?: number; // Max time between keystrokes (ms)
}

/**
 * Hook to detect barcode scans from physical scanners (which act as keyboards).
 * Scanners typically type characters very fast and end with 'Enter'.
 */
export function useScanDetection({
    onScan,
    minLength = 3,
    timeLimit = 50
}: UseScanDetectionOptions) {
    const buffer = useRef<string>('');
    const lastKeyTime = useRef<number>(0);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const now = Date.now();
            const char = e.key;

            // Ignore non-character keys (except Enter)
            if (char.length > 1 && char !== 'Enter') {
                return;
            }

            // Check timing - if too slow, reset buffer (it's likely manual typing)
            if (now - lastKeyTime.current > timeLimit) {
                buffer.current = '';
            }
            lastKeyTime.current = now;

            if (char === 'Enter') {
                if (buffer.current.length >= minLength) {
                    // Valid scan detected
                    e.preventDefault(); // Prevent form submission if inside a form
                    onScan(buffer.current);
                    buffer.current = '';
                }
            } else {
                // Append character to buffer
                buffer.current += char;
            }
        };

        // Attach listener to window
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onScan, minLength, timeLimit]);
}
