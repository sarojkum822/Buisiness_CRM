'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, TrendingUp, DollarSign, AlertTriangle, Package } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: Date;
    action?: {
        label: string;
        path: string;
    };
}

export function ShopAssistant() {
    const { orgId } = useAuth();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: 'Hi! I\'m your AI Shop Assistant. Tap a topic below or ask me anything!',
            sender: 'bot',
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async (text: string = input) => {
        if (!text.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            text: text,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsTyping(true);

        try {
            const response = await generateResponse(text);
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                text: response.text,
                sender: 'bot',
                timestamp: new Date(),
                action: response.action
            }]);
        } catch (error: any) {
            console.error('Bot Error:', error);
            let errorMessage = "I'm having trouble connecting to the database right now. Please try again.";

            if (error?.message?.includes('index')) {
                errorMessage = `I need a new database index to answer that. Please check the browser console (F12) for a link to create it, or look for an error starting with "The query requires an index..."`;
            }

            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                text: errorMessage,
                sender: 'bot',
                timestamp: new Date()
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    const generateResponse = async (text: string): Promise<{ text: string, action?: { label: string, path: string } }> => {
        const lower = text.toLowerCase();

        if (!orgId) return { text: "Please log in to access your shop data." };

        // SALES & REVENUE
        if (lower.includes('sales') || lower.includes('revenue') || lower.includes('sold')) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Fetch all sales for org and filter client-side to avoid index issues
            const salesRef = collection(db, 'sales');
            const q = query(salesRef, where('orgId', '==', orgId));
            const snapshot = await getDocs(q);

            const todaySales = snapshot.docs
                .map(doc => doc.data())
                .filter((sale: any) => {
                    const saleDate = sale.createdAt?.toDate ? sale.createdAt.toDate() : new Date(sale.createdAt);
                    return saleDate >= today;
                });

            const totalSales = todaySales.length;
            const totalRevenue = todaySales.reduce((sum, sale: any) => sum + sale.grandTotal, 0);

            return {
                text: `Today you've made ${totalSales} sales totaling ₹${totalRevenue.toFixed(2)}. Great work! 🚀`,
                action: { label: 'View Sales Report', path: '/reports' }
            };
        }

        // PROFIT
        if (lower.includes('profit') || lower.includes('margin')) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Fetch all sales for org and filter client-side to avoid index issues
            const salesRef = collection(db, 'sales');
            const q = query(salesRef, where('orgId', '==', orgId));
            const snapshot = await getDocs(q);

            let revenue = 0;
            let cost = 0;

            snapshot.docs.forEach(doc => {
                const data = doc.data();
                const saleDate = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);

                if (saleDate >= today) {
                    revenue += data.grandTotal;
                    cost += data.totalCost || 0;
                }
            });

            const profit = revenue - cost;
            const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

            return {
                text: `Your estimated profit today is ₹${profit.toFixed(2)} (${margin.toFixed(1)}% margin). Keep it up! 💰`,
                action: { label: 'View Analytics', path: '/dashboard' }
            };
        }

        // LOW STOCK
        if (lower.includes('stock') || lower.includes('low') || lower.includes('inventory')) {
            const productsRef = collection(db, 'products');
            const q = query(productsRef, where('orgId', '==', orgId));
            const snapshot = await getDocs(q);

            const lowStockItems = snapshot.docs
                .map(doc => doc.data())
                .filter((p: any) => p.currentStock <= (p.lowStockThreshold || 5));

            if (lowStockItems.length === 0) {
                return { text: "Your inventory looks healthy! No low stock items found. ✅" };
            }

            const top3 = lowStockItems.slice(0, 3).map((p: any) => p.name).join(', ');
            return {
                text: `Alert! You have ${lowStockItems.length} items running low, including: ${top3}. Time to restock? 📦`,
                action: { label: 'Go to Restock List', path: '/restock' }
            };
        }

        // CUSTOMERS / UDHAAR
        if (lower.includes('customer') || lower.includes('credit') || lower.includes('udhaar') || lower.includes('owe')) {
            const customersRef = collection(db, 'customers');
            const q = query(customersRef, where('orgId', '==', orgId));
            const snapshot = await getDocs(q);

            let totalCredit = 0;
            let creditCount = 0;

            snapshot.docs.forEach(doc => {
                const credit = doc.data().totalCredit;
                if (credit > 0) {
                    totalCredit += credit;
                    creditCount++;
                }
            });

            return {
                text: `You have ${creditCount} customers who owe you a total of ₹${totalCredit.toFixed(2)}.`,
                action: { label: 'View Customers', path: '/customers' }
            };
        }

        // GREETINGS
        if (lower.includes('hello') || lower.includes('hi')) {
            return { text: "Hello! 👋 I can help you check sales, profit, stock, or customer credits. What do you need?" };
        }

        return { text: "I'm still learning! Try asking about 'sales', 'profit', 'stock', or 'customers'." };
    };

    const QuickChip = ({ icon: Icon, label, query }: { icon: any, label: string, query: string }) => (
        <button
            onClick={() => handleSend(query)}
            className="flex items-center gap-1.5 whitespace-nowrap rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
        >
            <Icon size={14} />
            {label}
        </button>
    );

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {/* Chat Window */}
            {isOpen && (
                <div className="mb-4 flex h-[500px] w-[350px] flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl transition-all">
                    {/* Header */}
                    <div className="flex items-center justify-between bg-neutral-900 p-4 text-white">
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                                <Bot size={20} />
                            </div>
                            <div>
                                <h3 className="font-semibold">Shop Assistant</h3>
                                <p className="text-xs text-neutral-400">Online • AI Powered</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="rounded-full p-1 hover:bg-white/10"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto bg-neutral-50 p-4">
                        <div className="space-y-4">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                                >
                                    <div
                                        className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${msg.sender === 'user'
                                            ? 'bg-neutral-900 text-white'
                                            : 'bg-white text-neutral-900 shadow-sm'
                                            }`}
                                    >
                                        {msg.text}
                                    </div>
                                    {msg.action && (
                                        <button
                                            onClick={() => {
                                                router.push(msg.action!.path);
                                                setIsOpen(false);
                                            }}
                                            className="mt-2 flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                                        >
                                            {msg.action.label}
                                            <span className="text-lg">→</span>
                                        </button>
                                    )}
                                </div>
                            ))}
                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className="flex items-center gap-1 rounded-2xl bg-white px-4 py-3 shadow-sm">
                                        <div className="h-2 w-2 animate-bounce rounded-full bg-neutral-400" style={{ animationDelay: '0ms' }}></div>
                                        <div className="h-2 w-2 animate-bounce rounded-full bg-neutral-400" style={{ animationDelay: '150ms' }}></div>
                                        <div className="h-2 w-2 animate-bounce rounded-full bg-neutral-400" style={{ animationDelay: '300ms' }}></div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="border-t border-neutral-100 bg-neutral-50 p-3">
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            <QuickChip icon={TrendingUp} label="Sales Today" query="How are my sales today?" />
                            <QuickChip icon={DollarSign} label="Profit" query="What is my profit today?" />
                            <QuickChip icon={AlertTriangle} label="Low Stock" query="Any low stock items?" />
                            <QuickChip icon={Package} label="Udhaar" query="How much credit is outstanding?" />
                        </div>
                    </div>

                    {/* Input */}
                    <div className="border-t border-neutral-200 bg-white p-4">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Ask me anything..."
                                className="flex-1 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm text-neutral-900 placeholder:text-neutral-500 focus:border-neutral-900 focus:outline-none"
                            />
                            <button
                                onClick={() => handleSend()}
                                disabled={!input.trim()}
                                className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900 text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toggle Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-900 text-white shadow-lg transition-transform hover:scale-110 hover:bg-neutral-800"
                >
                    <MessageSquare size={24} />
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold">1</span>
                </button>
            )}
        </div>
    );
}
