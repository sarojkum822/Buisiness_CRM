'use client';

import { useState } from 'react';
import { updateProfile } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth/AuthContext';
import { Button } from '@/components/ui/Button';

export default function SettingsPage() {
    const { user, orgId, orgName, logout } = useAuth();
    const [activeTab, setActiveTab] = useState<'organization' | 'profile'>('organization');
    const [isEditing, setIsEditing] = useState(false);
    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [saving, setSaving] = useState(false);

    // Organization State
    const [orgNameInput, setOrgNameInput] = useState(orgName || '');
    const [gstNumber, setGstNumber] = useState('');
    const [isEditingOrg, setIsEditingOrg] = useState(false);
    const [loadingOrg, setLoadingOrg] = useState(false);

    // Fetch Org Details
    useState(() => {
        if (orgId) {
            const fetchOrg = async () => {
                const docRef = doc(db, 'organizations', orgId);
                const snap = await getDoc(docRef);
                if (snap.exists()) {
                    const data = snap.data();
                    setOrgNameInput(data.name);
                    setGstNumber(data.gstNumber || '');
                }
            };
            fetchOrg();
        }
    });

    const handleSaveOrg = async () => {
        if (!orgId) return;
        setSaving(true);
        try {
            await updateDoc(doc(db, 'organizations', orgId), {
                name: orgNameInput,
                gstNumber: gstNumber
            });
            setIsEditingOrg(false);
            alert('✅ Organization updated successfully!');
        } catch (error) {
            console.error('Error updating organization:', error);
            alert('❌ Error updating organization.');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!user) return;

        setSaving(true);
        try {
            await updateProfile(user, {
                displayName: displayName,
            });
            setIsEditing(false);
            alert('✅ Profile updated successfully!');
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('❌ Error updating profile. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleCancelEdit = () => {
        setDisplayName(user?.displayName || '');
        setIsEditing(false);
    };

    return (
        <div className="p-6 md:p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-neutral-900">Settings</h1>
                <p className="mt-2 text-neutral-600">
                    Manage your organization and account settings.
                </p>
            </div>

            {/* Tabs */}
            <div className="mb-6 border-b border-neutral-200">
                <div className="flex gap-6">
                    <button
                        onClick={() => setActiveTab('organization')}
                        className={`pb-3 text-sm font-medium transition-colors ${activeTab === 'organization'
                            ? 'border-b-2 border-neutral-900 text-neutral-900'
                            : 'text-neutral-600 hover:text-neutral-900'
                            }`}
                    >
                        Organization
                    </button>
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`pb-3 text-sm font-medium transition-colors ${activeTab === 'profile'
                            ? 'border-b-2 border-neutral-900 text-neutral-900'
                            : 'text-neutral-600 hover:text-neutral-900'
                            }`}
                    >
                        Profile
                    </button>
                </div>
            </div>

            {/* Organization Tab */}
            {activeTab === 'organization' && (
                <div className="space-y-6">
                    <div className="rounded-lg border border-neutral-200 bg-white p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-neutral-900">Organization Details</h2>
                            {!isEditingOrg && (
                                <Button variant="ghost" onClick={() => setIsEditingOrg(true)}>
                                    Edit Details
                                </Button>
                            )}
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-neutral-700">
                                    Organization Name
                                </label>
                                <input
                                    type="text"
                                    value={orgNameInput}
                                    onChange={(e) => setOrgNameInput(e.target.value)}
                                    disabled={!isEditingOrg}
                                    className={`w-full rounded-lg border px-4 py-2 ${isEditingOrg
                                        ? 'border-neutral-300 bg-white text-neutral-900 focus:border-neutral-900 focus:outline-none'
                                        : 'border-neutral-300 bg-neutral-50 text-neutral-500'
                                        }`}
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-neutral-700">
                                    GST Number
                                </label>
                                <input
                                    type="text"
                                    value={gstNumber}
                                    onChange={(e) => setGstNumber(e.target.value)}
                                    disabled={!isEditingOrg}
                                    placeholder="e.g. 22AAAAA0000A1Z5"
                                    className={`w-full rounded-lg border px-4 py-2 ${isEditingOrg
                                        ? 'border-neutral-300 bg-white text-neutral-900 focus:border-neutral-900 focus:outline-none'
                                        : 'border-neutral-300 bg-neutral-50 text-neutral-500'
                                        }`}
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-neutral-700">
                                    Organization ID
                                </label>
                                <input
                                    type="text"
                                    value={orgId || ''}
                                    disabled
                                    className="w-full rounded-lg border border-neutral-300 bg-neutral-50 px-4 py-2 font-mono text-sm text-neutral-500"
                                />
                                <p className="mt-1 text-xs text-neutral-500">
                                    This is your unique organization identifier
                                </p>
                            </div>
                        </div>
                        {isEditingOrg && (
                            <div className="mt-6 flex justify-end gap-3">
                                <Button variant="ghost" onClick={() => setIsEditingOrg(false)} disabled={saving}>
                                    Cancel
                                </Button>
                                <Button onClick={handleSaveOrg} isLoading={saving} disabled={saving}>
                                    Save Changes
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="rounded-lg border border-neutral-200 bg-white p-6">
                        <h2 className="mb-4 text-lg font-semibold text-neutral-900">Business Information</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-neutral-700">
                                    Business Type
                                </label>
                                <select
                                    disabled
                                    className="w-full rounded-lg border border-neutral-300 bg-neutral-50 px-4 py-2 text-neutral-500"
                                >
                                    <option>Retail Shop</option>
                                </select>
                                <p className="mt-1 text-xs text-neutral-500">
                                    Feature coming soon
                                </p>
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-neutral-700">
                                    Currency
                                </label>
                                <select
                                    disabled
                                    className="w-full rounded-lg border border-neutral-300 bg-neutral-50 px-4 py-2 text-neutral-500"
                                >
                                    <option>Indian Rupee (₹)</option>
                                </select>
                                <p className="mt-1 text-xs text-neutral-500">
                                    Currently only INR is supported
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
                <div className="space-y-6">
                    <div className="rounded-lg border border-neutral-200 bg-white p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-neutral-900">Account Information</h2>
                            {!isEditing && (
                                <Button variant="ghost" onClick={() => setIsEditing(true)}>
                                    Edit Profile
                                </Button>
                            )}
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-neutral-700">
                                    Display Name
                                </label>
                                <input
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    disabled={!isEditing}
                                    className={`w-full rounded-lg border px-4 py-2 ${isEditing
                                        ? 'border-neutral-300 bg-white text-neutral-900 focus:border-neutral-900 focus:outline-none'
                                        : 'border-neutral-300 bg-neutral-50 text-neutral-500'
                                        }`}
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-neutral-700">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={user?.email || ''}
                                    disabled
                                    className="w-full rounded-lg border border-neutral-300 bg-neutral-50 px-4 py-2 text-neutral-500"
                                />
                                <p className="mt-1 text-xs text-neutral-500">
                                    Email cannot be changed
                                </p>
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-neutral-700">
                                    User ID
                                </label>
                                <input
                                    type="text"
                                    value={user?.uid || ''}
                                    disabled
                                    className="w-full rounded-lg border border-neutral-300 bg-neutral-50 px-4 py-2 font-mono text-sm text-neutral-500"
                                />
                            </div>
                        </div>

                        {isEditing && (
                            <div className="mt-6 flex justify-end gap-3">
                                <Button variant="ghost" onClick={handleCancelEdit} disabled={saving}>
                                    Cancel
                                </Button>
                                <Button onClick={handleSaveProfile} isLoading={saving} disabled={saving}>
                                    Save Changes
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="rounded-lg border border-neutral-200 bg-white p-6">
                        <h2 className="mb-4 text-lg font-semibold text-neutral-900">Authentication</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-neutral-700">
                                    Sign-in Method
                                </label>
                                <div className="flex items-center gap-2 rounded-lg border border-neutral-300 bg-neutral-50 px-4 py-2">
                                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                                        <path
                                            fill="#4285F4"
                                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        />
                                        <path
                                            fill="#34A853"
                                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        />
                                        <path
                                            fill="#FBBC05"
                                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                        />
                                        <path
                                            fill="#EA4335"
                                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        />
                                    </svg>
                                    <span className="text-sm text-neutral-700">Google</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg border border-red-200 bg-red-50 p-6">
                        <h2 className="mb-2 text-lg font-semibold text-red-900">Sign Out</h2>
                        <p className="mb-4 text-sm text-red-700">
                            Sign out of your account on this device.
                        </p>
                        <Button variant="danger" onClick={logout}>
                            Sign Out
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
