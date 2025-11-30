'use client';

import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '../ui/Button';

interface BarcodeScannerProps {
    onScan: (barcode: string) => void;
    onClose?: () => void;
    variant?: 'modal' | 'embedded';
    autoStart?: boolean;
    keepOpenOnScan?: boolean;
}

export default function BarcodeScanner({ onScan, onClose, variant = 'modal', autoStart = false, keepOpenOnScan = false }: BarcodeScannerProps) {
    const [scanning, setScanning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const [cameraId, setCameraId] = useState<string | null>(null);

    useEffect(() => {
        // Get available cameras
        Html5Qrcode.getCameras()
            .then((devices) => {
                if (devices && devices.length > 0) {
                    // Prefer back camera on mobile
                    const backCamera = devices.find(device =>
                        device.label.toLowerCase().includes('back') ||
                        device.label.toLowerCase().includes('rear')
                    );
                    setCameraId(backCamera?.id || devices[0].id);
                } else {
                    setError('No cameras found on this device');
                }
            })
            .catch((err) => {
                console.error('Error getting cameras:', err);
                setError('Unable to access camera. Please check permissions.');
            });

        return () => {
            // Cleanup scanner on unmount
            if (scannerRef.current) {
                try {
                    scannerRef.current.stop().then(() => {
                        scannerRef.current?.clear();
                    }).catch(err => {
                        console.warn('Error stopping scanner cleanup:', err);
                    });
                } catch (e) {
                    console.warn('Error in cleanup:', e);
                }
            }
        };
    }, []);



    const [lastScanned, setLastScanned] = useState<string | null>(null);

    const startScanning = async () => {
        if (!cameraId) {
            setError('No camera available');
            return;
        }

        try {
            // If scanner is already running, stop it first
            if (scannerRef.current?.isScanning) {
                await scannerRef.current.stop();
            }

            setScanning(true);
            setError(null);

            const scanner = new Html5Qrcode('barcode-scanner');
            scannerRef.current = scanner;

            const lastCodeRef = { current: null as string | null };
            const lastSeenTimeRef = { current: 0 };

            await scanner.start(
                cameraId,
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0,
                },
                (decodedText) => {
                    // Successfully scanned
                    const now = Date.now();

                    // Debounce logic for both embedded and keepOpenOnScan
                    if (variant === 'embedded' || keepOpenOnScan) {
                        // If it's the same code and we saw it recently (< 2 seconds), ignore it
                        if (decodedText === lastCodeRef.current && (now - lastSeenTimeRef.current < 2000)) {
                            lastSeenTimeRef.current = now;
                            return;
                        }

                        // It's a new code (or the old one after a break)
                        lastCodeRef.current = decodedText;
                        lastSeenTimeRef.current = now;

                        // Show feedback
                        setLastScanned(decodedText);
                        setTimeout(() => setLastScanned(null), 1500);

                        onScan(decodedText);
                    } else {
                        // For modal mode without keepOpen, stop and close
                        scanner.stop().then(() => {
                            scanner.clear();
                            setScanning(false);
                            onScan(decodedText);
                        });
                    }
                },
                (errorMessage) => {
                    // Scanning error (no barcode found in frame)
                    // If we haven't seen the code for 0.5 second, clear it so it can be scanned again
                    const now = Date.now();
                    if (lastCodeRef.current && (now - lastSeenTimeRef.current > 500)) {
                        // Only clear if we are NOT in keepOpen mode, or if we want to allow rapid rescanning of different codes
                        // For keepOpen, we want to prevent double-scanning the SAME code instantly.
                        // So we rely on the 2000ms check above.
                        // But if the user moves the camera away, we should allow rescanning sooner?
                        // Let's stick to the 2s delay for same code to be safe.
                    }
                }
            );
        } catch (err) {
            console.error('Error starting scanner:', err);
            setError('Failed to start camera');
            setScanning(false);
        }
    };

    // Auto-start effect
    useEffect(() => {
        if (autoStart && cameraId && !scanning) {
            startScanning();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoStart, cameraId, scanning]);

    const stopScanning = async () => {
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop();
                await scannerRef.current.clear();
            } catch (err) {
                console.warn('Error stopping scanner:', err);
            }
            setScanning(false);
            if (onClose) onClose();
        }
    };

    // ScannerOverlay moved outside or defined here properly
    const ScannerOverlay = () => (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
            <div className="relative w-64 h-64">
                {/* Top Left */}
                <div className="absolute top-0 left-0 w-12 h-12 border-l-4 border-t-4 border-red-500 rounded-tl-lg shadow-sm"></div>
                {/* Top Right */}
                <div className="absolute top-0 right-0 w-12 h-12 border-r-4 border-t-4 border-red-500 rounded-tr-lg shadow-sm"></div>
                {/* Bottom Left */}
                <div className="absolute bottom-0 left-0 w-12 h-12 border-l-4 border-b-4 border-red-500 rounded-bl-lg shadow-sm"></div>
                {/* Bottom Right */}
                <div className="absolute bottom-0 right-0 w-12 h-12 border-r-4 border-b-4 border-red-500 rounded-br-lg shadow-sm"></div>

                {/* Center Crosshair (Optional) */}
                <div className="absolute top-1/2 left-1/2 w-4 h-0.5 bg-red-500/50 -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute top-1/2 left-1/2 w-0.5 h-4 bg-red-500/50 -translate-x-1/2 -translate-y-1/2"></div>
            </div>
        </div>
    );

    if (variant === 'embedded') {
        return (
            <div className="relative w-full overflow-hidden rounded-lg bg-black">
                <div id="barcode-scanner" className="w-full" />
                {scanning && <ScannerOverlay />}
                {!scanning && !error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-neutral-900/90">
                        <Button onClick={startScanning} variant="secondary" size="sm">
                            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Start Camera
                        </Button>
                    </div>
                )}
                {error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-900 p-4 text-center text-white">
                        <p className="mb-2 text-sm text-red-400">{error}</p>
                        <Button onClick={startScanning} variant="secondary" size="sm">
                            Retry
                        </Button>
                    </div>
                )}
            </div>
        );
    }

    const Content = (
        <div className={`relative w-full max-w-md rounded-lg bg-white p-6`}>
            {variant === 'modal' && (
                <button
                    onClick={() => {
                        stopScanning();
                        onClose?.();
                    }}
                    className="absolute right-4 top-4 text-neutral-500 hover:text-neutral-900"
                >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            )}

            {variant === 'modal' && <h2 className="mb-4 text-xl font-bold text-neutral-900">Scan Barcode</h2>}

            {error && (
                <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            <div className="mb-4 relative">
                <div
                    id="barcode-scanner"
                    className="overflow-hidden rounded-lg border-2 border-neutral-300"
                    style={{ width: '100%', minHeight: '300px' }}
                />
                {scanning && <ScannerOverlay />}
                {lastScanned && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                        <div className="bg-green-500 text-white px-4 py-2 rounded-full shadow-lg font-bold animate-bounce">
                            Scanned: {lastScanned}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex gap-3">
                {!scanning ? (
                    <Button onClick={startScanning} disabled={!cameraId || !!error} className="flex-1">
                        <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Start Scanning
                    </Button>
                ) : (
                    <Button onClick={stopScanning} variant="secondary" className="flex-1">
                        Stop Scanning
                    </Button>
                )}
                {variant === 'modal' && (
                    <Button onClick={() => { stopScanning(); onClose?.(); }} variant="ghost">
                        Cancel
                    </Button>
                )}
            </div>

            {variant === 'modal' && (
                <p className="mt-4 text-xs text-neutral-500">
                    Position the barcode within the frame. The scanner will automatically detect and read it.
                </p>
            )}
        </div>
    );



    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
            {Content}
        </div>
    );
}
