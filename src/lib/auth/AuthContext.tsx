'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    User,
    GoogleAuthProvider,
    signInWithPopup,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, collection } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { UserMapping, Organization } from '@/types';

interface AuthContextType {
    user: User | null;
    orgId: string | null;
    orgName: string | null;
    loading: boolean;
    orgLoading: boolean;
    isPro: boolean;
    signInWithGoogle: () => Promise<void>;
    signInWithEmail: (email: string, pass: string) => Promise<void>;
    signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    orgId: null,
    orgName: null,
    loading: true,
    orgLoading: true,
    isPro: false,
    signInWithGoogle: async () => { },
    signInWithEmail: async () => { },
    signUpWithEmail: async () => { },
    logout: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [orgId, setOrgId] = useState<string | null>(null);
    const [orgName, setOrgName] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [orgLoading, setOrgLoading] = useState(true);

    // Handle organization setup for new or existing users
    const setupUserOrganization = async (user: User) => {
        setOrgLoading(true);
        try {
            // Check if user mapping exists
            const userMappingRef = doc(db, 'userMappings', user.uid);
            const userMappingSnap = await getDoc(userMappingRef);

            if (userMappingSnap.exists()) {
                // Existing user - get their org
                const mapping = userMappingSnap.data() as UserMapping;
                setOrgId(mapping.orgId);

                // Get org name
                const orgRef = doc(db, 'organizations', mapping.orgId);
                const orgSnap = await getDoc(orgRef);
                if (orgSnap.exists()) {
                    setOrgName((orgSnap.data() as Organization).name);
                }
            } else {
                // New user - create organization
                const newOrgRef = doc(collection(db, 'organizations'));
                const orgData: Omit<Organization, 'id'> = {
                    name: `${user.displayName || user.email}'s Shop`,
                    ownerId: user.uid,
                    createdAt: new Date(),
                };

                await setDoc(newOrgRef, {
                    ...orgData,
                    createdAt: serverTimestamp(),
                });

                // Create user mapping
                const userMappingData: UserMapping = {
                    userId: user.uid,
                    orgId: newOrgRef.id,
                    email: user.email || '',
                    displayName: user.displayName || '',
                };

                await setDoc(userMappingRef, userMappingData);

                // Add user to organization's users subcollection
                const orgUserRef = doc(db, 'organizations', newOrgRef.id, 'users', user.uid);
                await setDoc(orgUserRef, {
                    userId: user.uid,
                    name: user.displayName || '',
                    email: user.email || '',
                    role: 'owner',
                    isActive: true,
                });

                setOrgId(newOrgRef.id);
                setOrgName(orgData.name);
            }
        } catch (error) {
            console.error('Error setting up organization:', error);
        } finally {
            setOrgLoading(false);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user);
            setLoading(false);

            if (user) {
                await setupUserOrganization(user);
            } else {
                setOrgId(null);
                setOrgName(null);
                setOrgLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error('Error signing in with Google:', error);
            throw error;
        }
    };

    const signInWithEmail = async (email: string, pass: string) => {
        try {
            await signInWithEmailAndPassword(auth, email, pass);
        } catch (error) {
            console.error('Error signing in with Email:', error);
            throw error;
        }
    };

    const signUpWithEmail = async (email: string, pass: string, name: string) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
            await updateProfile(userCredential.user, { displayName: name });
            // The onAuthStateChanged listener will handle organization setup
        } catch (error) {
            console.error('Error signing up with Email:', error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await firebaseSignOut(auth);
            setOrgId(null);
            setOrgName(null);
        } catch (error) {
            console.error('Error signing out:', error);
            throw error;
        }
    };

    const isPro = user?.email === 'sarojkum822@gmail.com';

    const value = {
        user,
        orgId,
        orgName,
        loading,
        orgLoading,
        isPro,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
