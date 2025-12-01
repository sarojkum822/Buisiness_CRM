'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth/AuthContext';
import { Supplier } from '@/types';
import { Button } from '@/components/ui/Button';
import { Plus, Phone, Mail, MapPin, Truck } from 'lucide-react';

export default function SuppliersPage() {
    const { orgId } = useAuth();
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        contactPerson: '',
        phone: '',
        email: '',
        gstNumber: '',
        address: ''
    });

    const fetchSuppliers = async () => {
        if (!orgId) return;
        try {
            const q = query(
                collection(db, 'suppliers'),
                where('orgId', '==', orgId),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(q);
            setSuppliers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Supplier)));
        } catch (error) {
            console.error('Error fetching suppliers:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuppliers();
    }, [orgId]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orgId) return;

        setSaving(true);
        try {
            await addDoc(collection(db, 'suppliers'), {
                ...formData,
                orgId,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            setIsAdding(false);
            setFormData({
                name: '',
                contactPerson: '',
                phone: '',
                email: '',
                gstNumber: '',
                address: ''
            });
            fetchSuppliers(); // Refresh list
            alert('✅ Supplier added successfully!');
        } catch (error) {
            console.error('Error adding supplier:', error);
            alert('❌ Error adding supplier.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-6 md:p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900">Suppliers</h1>
                    <p className="mt-2 text-neutral-600">Manage your suppliers and their details.</p>
                </div>
                <Button onClick={() => setIsAdding(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Supplier
                </Button>
            </div>

            {loading ? (
                <div className="text-center py-12">Loading suppliers...</div>
            ) : suppliers.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-neutral-200">
                    <Truck className="mx-auto h-12 w-12 text-neutral-400 mb-4" />
                    <h3 className="text-lg font-medium text-neutral-900">No suppliers yet</h3>
                    <p className="text-neutral-500 mt-2 mb-6">Add your first supplier to get started.</p>
                    <Button onClick={() => setIsAdding(true)}>Add Supplier</Button>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {suppliers.map((supplier) => (
                        <div key={supplier.id} className="bg-white p-6 rounded-lg border border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-semibold text-lg text-neutral-900">{supplier.name}</h3>
                                    {supplier.contactPerson && (
                                        <p className="text-sm text-neutral-500">Contact: {supplier.contactPerson}</p>
                                    )}
                                </div>
                                <div className="bg-neutral-100 p-2 rounded-full">
                                    <Truck className="h-5 w-5 text-neutral-600" />
                                </div>
                            </div>

                            <div className="space-y-3 text-sm text-neutral-600">
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4" />
                                    <span>{supplier.phone}</span>
                                </div>
                                {supplier.email && (
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4" />
                                        <span>{supplier.email}</span>
                                    </div>
                                )}
                                {supplier.address && (
                                    <div className="flex items-start gap-2">
                                        <MapPin className="h-4 w-4 mt-0.5" />
                                        <span>{supplier.address}</span>
                                    </div>
                                )}
                                {supplier.gstNumber && (
                                    <div className="pt-2 border-t border-neutral-100 mt-2">
                                        <span className="font-medium text-neutral-900">GST: </span>
                                        <span className="font-mono">{supplier.gstNumber}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Supplier Modal */}
            {isAdding && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-neutral-200">
                            <h2 className="text-xl font-bold text-neutral-900">Add New Supplier</h2>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">Supplier Name *</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full rounded-lg border border-neutral-300 px-3 py-2"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">Contact Person</label>
                                <input
                                    type="text"
                                    className="w-full rounded-lg border border-neutral-300 px-3 py-2"
                                    value={formData.contactPerson}
                                    onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Phone *</label>
                                    <input
                                        required
                                        type="tel"
                                        className="w-full rounded-lg border border-neutral-300 px-3 py-2"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">GST Number</label>
                                    <input
                                        type="text"
                                        className="w-full rounded-lg border border-neutral-300 px-3 py-2"
                                        value={formData.gstNumber}
                                        onChange={e => setFormData({ ...formData, gstNumber: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    className="w-full rounded-lg border border-neutral-300 px-3 py-2"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">Address</label>
                                <textarea
                                    className="w-full rounded-lg border border-neutral-300 px-3 py-2"
                                    rows={3}
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <Button type="button" variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
                                <Button type="submit" isLoading={saving}>Save Supplier</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
