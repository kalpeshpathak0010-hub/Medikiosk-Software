import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInAnonymously,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { AppRoute, UserProfile, UserRole } from '../types';
import { COLLECTIONS, seedInitialFirestoreData } from '../services/dbService';
import { logAuditEvent } from '../services/auditService';

export const DEFAULT_PATIENT_PROFILE: UserProfile = {
  id: 'user-patient-kiosk',
  name: 'Walk-in Patient (Kiosk Terminal)',
  role: 'PATIENT',
  organizationId: 'HOSP-DEL-001',
  hospitalName: 'AIIMS New Delhi (Central OPD Network)',
};

const ROLE_PERMISSIONS: Record<UserRole, AppRoute[]> = {
  PATIENT: ['kiosk'],
  DOCTOR: ['doctor', 'timeline', 'ocr_pipeline', 'kiosk'],
  ADMIN: ['admin', 'abdm', 'ocr_pipeline', 'doctor', 'timeline', 'kiosk'],
};

interface AuthContextType {
  currentUser: UserProfile;
  currentRole: UserRole;
  firebaseUser: FirebaseUser | null;
  isAuthLoading: boolean;
  isKioskLocked: boolean;
  loginStaffWithEmail: (email: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  registerStaffAccount: (
    email: string,
    pass: string,
    role: 'DOCTOR' | 'ADMIN',
    name: string,
    registrationNumber?: string,
    department?: string
  ) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  canAccessRoute: (route: AppRoute) => boolean;
  setKioskLocked: (locked: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile>(DEFAULT_PATIENT_PROFILE);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [isKioskLocked, setIsKioskLocked] = useState<boolean>(false);

  // Initialize Firebase Auth & Sync User Profile from Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setFirebaseUser(user);

        // Fetch verified user profile from protected Firestore collection
        try {
          const userDocRef = doc(db, COLLECTIONS.USERS, user.uid);
          const userSnap = await getDoc(userDocRef);

          if (userSnap.exists()) {
            const data = userSnap.data();
            const verifiedProfile: UserProfile = {
              id: user.uid,
              name: data.name || (data.role === 'DOCTOR' ? 'Dr. Staff Physician' : 'Hospital Administrator'),
              role: (data.role as UserRole) || 'PATIENT',
              email: data.email || user.email || undefined,
              phone: data.phone || undefined,
              registrationNumber: data.registrationNumber || undefined,
              badgeNumber: data.badgeNumber || undefined,
              department: data.department || (data.role === 'DOCTOR' ? 'General Medicine & OPD' : 'Hospital Operations'),
              organizationId: data.hospitalId || 'HOSP-DEL-001',
              hospitalName: data.hospitalName || 'AIIMS New Delhi (Central OPD Network)',
            };
            setCurrentUser(verifiedProfile);
          } else {
            // New anonymous patient or unprofiled user
            const patientProfile: UserProfile = {
              ...DEFAULT_PATIENT_PROFILE,
              id: user.uid,
            };
            setCurrentUser(patientProfile);

            // Persist base patient profile
            await setDoc(
              userDocRef,
              {
                uid: user.uid,
                role: 'PATIENT',
                name: patientProfile.name,
                hospitalId: patientProfile.organizationId,
                hospitalName: patientProfile.hospitalName,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              },
              { merge: true }
            );
          }
        } catch (e) {
          console.warn('[Firebase Auth] Notice loading user document:', e);
          setCurrentUser({
            ...DEFAULT_PATIENT_PROFILE,
            id: user.uid,
          });
        }
      } else {
        // Automatically sign in anonymously for Kiosk Terminal intake
        try {
          await signInAnonymously(auth);
        } catch (err) {
          console.warn('[Firebase Auth Notice] Anonymous sign-in:', err);
          setCurrentUser(DEFAULT_PATIENT_PROFILE);
        }
      }
      setIsAuthLoading(false);
    });

    // Seed default hospital & initial data into Firestore
    seedInitialFirestoreData().catch((err) => {
      console.warn('[Firestore Seed Notice]', err);
    });

    return () => unsubscribe();
  }, []);

  const canAccessRoute = (route: AppRoute): boolean => {
    const allowed = ROLE_PERMISSIONS[currentUser.role] || ['kiosk'];
    return allowed.includes(route);
  };

  /**
   * Secure Staff Authentication via Firebase Auth
   */
  const loginStaffWithEmail = async (
    email: string,
    pass: string
  ): Promise<{ success: boolean; message?: string }> => {
    setIsAuthLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), pass);
      const user = userCredential.user;

      // Verify role from protected Firestore users collection
      const userDocRef = doc(db, COLLECTIONS.USERS, user.uid);
      const userSnap = await getDoc(userDocRef);

      let role: UserRole = 'DOCTOR';
      let name = email.split('@')[0];
      let dept = 'General Medicine';
      let regNo: string | undefined;

      if (userSnap.exists()) {
        const d = userSnap.data();
        role = (d.role as UserRole) || 'DOCTOR';
        name = d.name || name;
        dept = d.department || dept;
        regNo = d.registrationNumber;
      } else {
        // First login: create doctor profile based on email
        const isDoc = email.toLowerCase().includes('doc') || email.toLowerCase().includes('dr');
        role = isDoc ? 'DOCTOR' : 'ADMIN';
        name = isDoc ? 'Dr. Physician (MD)' : 'OPD Administrator';
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          name,
          role,
          hospitalId: 'HOSP-DEL-001',
          hospitalName: 'AIIMS New Delhi (Central OPD Network)',
          department: dept,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      setCurrentUser({
        id: user.uid,
        name,
        role,
        email: user.email || email,
        department: dept,
        registrationNumber: regNo,
        organizationId: 'HOSP-DEL-001',
        hospitalName: 'AIIMS New Delhi (Central OPD Network)',
      });

      logAuditEvent({
        action: 'STAFF_LOGIN',
        role,
        userId: user.uid,
        entityType: 'AUTH',
        entityId: user.uid,
        metadata: { role, email: user.email },
      });

      setIsAuthLoading(false);
      return { success: true };
    } catch (error: any) {
      setIsAuthLoading(false);
      const code = error.code;
      let msg = 'Authentication failed. Please verify your credentials.';
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        msg = 'Invalid email or password. Please check your credentials or create a new staff account.';
      } else if (code === 'auth/invalid-email') {
        msg = 'Please enter a valid email address.';
      }

      logAuditEvent({
        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        role: currentUser.role,
        userId: currentUser.id,
        entityType: 'AUTH',
        entityId: email,
        metadata: { attemptedEmail: email, reason: code || error.message },
      });

      return { success: false, message: msg };
    }
  };

  /**
   * Register a new Staff / Doctor account via Firebase Auth
   */
  const registerStaffAccount = async (
    email: string,
    pass: string,
    role: 'DOCTOR' | 'ADMIN',
    name: string,
    registrationNumber?: string,
    department?: string
  ): Promise<{ success: boolean; message?: string }> => {
    setIsAuthLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      const user = userCredential.user;

      // Write protected user profile to Firestore
      const userDocRef = doc(db, COLLECTIONS.USERS, user.uid);
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        name: name.trim(),
        role,
        registrationNumber: registrationNumber?.trim() || (role === 'DOCTOR' ? 'MCI-TEMP-01' : undefined),
        department: department?.trim() || (role === 'DOCTOR' ? 'General Medicine & OPD' : 'Hospital Operations'),
        hospitalId: 'HOSP-DEL-001',
        hospitalName: 'AIIMS New Delhi (Central OPD Network)',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setCurrentUser({
        id: user.uid,
        name: name.trim(),
        role,
        email: user.email || email,
        registrationNumber: registrationNumber?.trim(),
        department: department?.trim(),
        organizationId: 'HOSP-DEL-001',
        hospitalName: 'AIIMS New Delhi (Central OPD Network)',
      });

      logAuditEvent({
        action: 'STAFF_REGISTERED',
        role,
        userId: user.uid,
        entityType: 'AUTH',
        entityId: user.uid,
        metadata: { role, name, email },
      });

      setIsAuthLoading(false);
      return { success: true };
    } catch (error: any) {
      setIsAuthLoading(false);
      const code = error.code;
      let msg = 'Registration failed. Please try again.';
      if (code === 'auth/email-already-in-use') {
        msg = 'This email is already registered. Please sign in with your password.';
      } else if (code === 'auth/weak-password') {
        msg = 'Password is too weak. Please use at least 6 characters.';
      } else if (code === 'auth/invalid-email') {
        msg = 'Please provide a valid official email address.';
      }
      return { success: false, message: msg };
    }
  };

  /**
   * Log out and restore anonymous Kiosk intake session
   */
  const logout = async () => {
    setIsAuthLoading(true);
    try {
      logAuditEvent({
        action: 'LOGOUT',
        role: currentUser.role,
        userId: currentUser.id,
        entityType: 'AUTH',
        entityId: currentUser.id,
      });

      await signOut(auth);
      await signInAnonymously(auth);
    } catch (e) {
      console.warn('Logout notice:', e);
    } finally {
      setCurrentUser(DEFAULT_PATIENT_PROFILE);
      setIsAuthLoading(false);
      window.location.hash = '#/kiosk';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole: currentUser.role,
        firebaseUser,
        isAuthLoading,
        isKioskLocked,
        loginStaffWithEmail,
        registerStaffAccount,
        logout,
        canAccessRoute,
        setKioskLocked: setIsKioskLocked,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
