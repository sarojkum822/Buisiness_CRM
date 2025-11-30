import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
    message: string;
    type?: ToastType;
    duration?: number; // in milliseconds
    onClose: () => void;
}

export function Toast({ message, type = 'success', duration = 3000, onClose }: ToastProps) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onClose, 300); // Wait for animation to finish
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 300);
    };

    const bgColors = {
        success: 'bg-green-600',
        error: 'bg-red-600',
        info: 'bg-blue-600',
    };

    const icons = {
        success: <CheckCircle className="h-5 w-5 text-white" />,
        error: <AlertCircle className="h-5 w-5 text-white" />,
        info: <Info className="h-5 w-5 text-white" />,
    };

    return (
        <div
            className={`fixed top-4 right-4 z-50 flex items-center gap-3 rounded-lg shadow-lg p-4 text-white transition-all duration-300 ${bgColors[type]} ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
                }`}
        >
            {icons[type]}
            <p className="font-medium text-sm">{message}</p>
            <button
                onClick={handleClose}
                className="ml-2 rounded-full p-1 hover:bg-white/20 transition-colors"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}
