import React from 'react';

export function LoginIllustration() {
    return (
        <div className="relative h-full w-full flex items-center justify-center">
            <svg
                viewBox="0 0 800 600"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full max-w-[600px]"
            >
                <style>
                    {`
            @keyframes breathe {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.02); }
            }
            @keyframes float-item {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-10px); }
            }
            @keyframes slide-in {
              0% { transform: translateX(-20px); opacity: 0; }
              100% { transform: translateX(0); opacity: 1; }
            }
            @keyframes pop-in {
              0% { transform: scale(0); opacity: 0; }
              80% { transform: scale(1.1); opacity: 1; }
              100% { transform: scale(1); opacity: 1; }
            }
            .animate-breathe { animation: breathe 4s ease-in-out infinite; transform-origin: bottom center; }
            .animate-float { animation: float-item 3s ease-in-out infinite; }
            .animate-pop { animation: pop-in 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
          `}
                </style>

                {/* Background - Shop Interior */}
                <rect x="100" y="100" width="600" height="400" rx="20" fill="#F3F4F6" />

                {/* Shelves */}
                <rect x="150" y="150" width="500" height="10" rx="5" fill="#E5E7EB" />
                <rect x="150" y="250" width="500" height="10" rx="5" fill="#E5E7EB" />

                {/* Products on Shelves */}
                <rect x="180" y="110" width="30" height="40" rx="4" fill="#60A5FA" />
                <rect x="220" y="120" width="30" height="30" rx="4" fill="#34D399" />
                <rect x="260" y="100" width="20" height="50" rx="4" fill="#F472B6" />
                <rect x="400" y="210" width="40" height="40" rx="4" fill="#A78BFA" />
                <rect x="450" y="220" width="30" height="30" rx="4" fill="#FBBF24" />

                {/* Counter */}
                <path d="M150 400 L650 400 L650 500 L150 500 Z" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="2" />
                <rect x="150" y="400" width="500" height="20" fill="#DBEAFE" />

                {/* Shopkeeper (Seller) */}
                <g className="animate-breathe" style={{ transformOrigin: '400px 500px' }}>
                    {/* Body */}
                    <path d="M350 500 L350 380 Q350 360 370 360 L430 360 Q450 360 450 380 L450 500" fill="#3B82F6" />
                    {/* Head */}
                    <circle cx="400" cy="330" r="35" fill="#FFD7B5" />
                    <path d="M365 320 Q400 280 435 320" fill="#1F2937" /> {/* Hair */}
                    {/* Apron */}
                    <path d="M370 380 L370 500 L430 500 L430 380 Q400 420 370 380" fill="#2563EB" opacity="0.8" />
                </g>

                {/* Customer (Buyer) */}
                <g className="animate-breathe" style={{ transformOrigin: '550px 500px', animationDelay: '1s' }}>
                    {/* Body */}
                    <path d="M500 500 L500 390 Q500 370 520 370 L580 370 Q600 370 600 390 L600 500" fill="#10B981" />
                    {/* Head */}
                    <circle cx="550" cy="340" r="35" fill="#FFD7B5" />
                    <circle cx="550" cy="340" r="36" fill="none" stroke="#1F2937" strokeWidth="2" strokeDasharray="100 100" strokeDashoffset="60" /> {/* Hair/Hat */}
                    {/* Bag */}
                    <path d="M580 440 L620 440 L610 480 L590 480 Z" fill="#F59E0B" />
                    <path d="M590 440 Q600 420 610 440" stroke="#F59E0B" strokeWidth="3" fill="none" />
                </g>

                {/* Interaction Elements */}

                {/* POS System */}
                <g transform="translate(320, 360)">
                    <rect x="0" y="0" width="60" height="40" rx="4" fill="#4B5563" />
                    <rect x="5" y="5" width="50" height="30" fill="#1F2937" />
                    <rect x="25" y="40" width="10" height="10" fill="#4B5563" />
                    <rect x="15" y="50" width="30" height="5" rx="2" fill="#4B5563" />
                </g>

                {/* Floating "Sale" Icon */}
                <g className="animate-pop" style={{ animationDelay: '0.5s' }}>
                    <circle cx="480" cy="300" r="25" fill="#FFFFFF" stroke="#22C55E" strokeWidth="3" />
                    <path d="M470 300 L478 308 L492 292" stroke="#22C55E" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                </g>

                {/* Floating Coins */}
                <g className="animate-float">
                    <circle cx="450" cy="280" r="8" fill="#FBBF24" stroke="#D97706" strokeWidth="1" />
                    <circle cx="470" cy="260" r="6" fill="#FBBF24" stroke="#D97706" strokeWidth="1" />
                </g>

            </svg>
        </div>
    );
}
