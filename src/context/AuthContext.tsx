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
import { AppRoute, DoctorAvailabilityStatus, UserProfile, UserRole } from '../types';
import { COLLECTIONS, seedInitialFirestoreData, updateDoctorStatusInDb } from '../services/dbService';
import { logAuditEvent } from '../services/auditService';

export const DEFAULT_PATIENT_PROFILE: UserProfile = {
  id: 'user-patient-kiosk',
  name: 'Walk-in Patient (Kiosk Terminal)',
  role: 'PATIENT',
  organizationId: 'HOSP-DEL-001',
  hospitalName: 'AIIMS New Delhi (Central OPD Network)',
};

export function normalizeUserRole(rawRole?: any, department?: string, email?: string): UserRole {
  const roleStr = String(rawRole || '').trim().toUpperCase();
  if (
    roleStr === 'DOCTOR' ||
    roleStr === 'PHYSICIAN' ||
    roleStr === 'MEDICAL_STAFF' ||
    roleStr === 'STAFF'
  ) {
    return 'DOCTOR';
  }
  if (
    roleStr === 'ADMIN' ||
    roleStr === 'ADMINISTRATOR' ||
    roleStr === 'SUPER_ADMIN'
  ) {
    return 'ADMIN';
  }
  if (roleStr === 'PATIENT' || roleStr === 'USER' || roleStr === 'ANONYMOUS') {
    return 'PATIENT';
  }

  // Check department or email hints if role is missing or ambiguous
  if (department) {
    const d = department.toLowerCase();
    if (d.includes('admin') || d.includes('it') || d.includes('director')) {
      return 'ADMIN';
    }
    if (d.includes('medicine') || d.includes('doctor') || d.includes('opd') || d.includes('cardio') || d.includes('physician')) {
      return 'DOCTOR';
    }
  }

  if (email) {
    const e = email.toLowerCase();
    if (e.includes('admin')) {
      return 'ADMIN';
    }
    if (e.includes('doc') || e.includes('dr') || e.includes('physician')) {
      return 'DOCTOR';
    }
  }

  return 'DOCTOR';
}

const ROLE_PERMISSIONS: Record<string, AppRoute[]> = {
  PATIENT: ['kiosk'],
  patient: ['kiosk'],
  user: ['kiosk'],
  DOCTOR: ['doctor', 'timeline', 'ocr_pipeline', 'kiosk'],
  doctor: ['doctor', 'timeline', 'ocr_pipeline', 'kiosk'],
  physician: ['doctor', 'timeline', 'ocr_pipeline', 'kiosk'],
  PHYSICIAN: ['doctor', 'timeline', 'ocr_pipeline', 'kiosk'],
  medical_staff: ['doctor', 'timeline', 'ocr_pipeline', 'kiosk'],
  staff: ['doctor', 'timeline', 'ocr_pipeline', 'kiosk'],
  ADMIN: ['admin', 'abdm', 'ocr_pipeline', 'kiosk'],
  admin: ['admin', 'abdm', 'ocr_pipeline', 'kiosk'],
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
  updateDoctorAvailability: (status: DoctorAvailabilityStatus) => Promise<void>;
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
            const verifiedRole = normalizeUserRole(data.role, data.department, user.email || undefined);
            const verifiedProfile: UserProfile = {
              id: user.uid,
              name: data.name || (verifiedRole === 'DOCTOR' ? 'Dr. Staff Physician' : 'Hospital Administrator'),
              role: verifiedRole,
              email: data.email || user.email || undefined,
              phone: data.phone || undefined,
              registrationNumber: data.registrationNumber || undefined,
              badgeNumber: data.badgeNumber || undefined,
              department: data.department || (verifiedRole === 'DOCTOR' ? 'General Medicine & OPD' : 'Hospital Operations'),
              specialization: data.specialization || data.department || (verifiedRole === 'DOCTOR' ? 'Physician & OPD' : undefined),
              roomNumber: data.roomNumber || (verifiedRole === 'DOCTOR' ? 'OPD Room 12' : undefined),
              availabilityStatus: (data.availabilityStatus as DoctorAvailabilityStatus) || (verifiedRole === 'DOCTOR' ? 'AVAILABLE' : undefined),
              organizationId: data.hospitalId || 'HOSP-DEL-001',
              hospitalName: data.hospitalName || 'AIIMS New Delhi (Central OPD Network)',
            };
            setCurrentUser(verifiedProfile);
          } else {
            if (user.isAnonymous) {
              // Anonymous patient session for Kiosk Terminal intake
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
            } else {
              // Non-anonymous staff account without an existing Firestore profile:
              // Do NOT grant staff access or auto-create doctor profile
              setCurrentUser({
                ...DEFAULT_PATIENT_PROFILE,
                id: user.uid,
                name: user.displayName || 'Unverified User',
                email: user.email || undefined,
                role: 'PATIENT',
              });
            }
          }
        } catch (e) {
          console.warn('[Firebase Auth] Notice loading user document:', e);
          if (user.isAnonymous) {
            setCurrentUser({
              ...DEFAULT_PATIENT_PROFILE,
              id: user.uid,
            });
          }
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
    if (isAuthLoading) return true;
    const roleKey = currentUser.role ? String(currentUser.role).toUpperCase().trim() : 'PATIENT';
    const allowed = ROLE_PERMISSIONS[roleKey] || ROLE_PERMISSIONS[currentUser.role] || ['kiosk'];
    return allowed.includes(route);
  };

  /**
   * Secure Staff Authentication via Firebase Auth
   */
  const loginStaffWithEmail = async (
    email: string,
    pass: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), pass);
      const user = userCredential.user;

      // Verify role from protected Firestore users collection
      const userDocRef = doc(db, COLLECTIONS.USERS, user.uid);
      const userSnap = await getDoc(userDocRef);

      if (!userSnap.exists()) {
        await signOut(auth);
        setFirebaseUser(null);
        setCurrentUser(DEFAULT_PATIENT_PROFILE);
        return {
          success: false,
          message:
            'Authentication successful, but no verified physician/staff profile was found for this account in Firestore. Please register your official staff profile.',
        };
      }

      const d = userSnap.data();
      const role = normalizeUserRole(d.role, d.department, user.email || email);
      const verifiedProfile: UserProfile = {
        id: user.uid,
        name: d.name || (role === 'DOCTOR' ? 'Dr. Staff Physician' : 'Hospital Administrator'),
        role,
        email: d.email || user.email || email,
        phone: d.phone,
        registrationNumber: d.registrationNumber,
        badgeNumber: d.badgeNumber,
        department: d.department || (role === 'DOCTOR' ? 'General Medicine & OPD' : 'Hospital Operations'),
        specialization: d.specialization || d.department || (role === 'DOCTOR' ? 'Physician & OPD' : undefined),
        roomNumber: d.roomNumber || (role === 'DOCTOR' ? 'OPD Room 12' : undefined),
        availabilityStatus: (d.availabilityStatus as DoctorAvailabilityStatus) || (role === 'DOCTOR' ? 'AVAILABLE' : undefined),
        organizationId: d.hospitalId || 'HOSP-DEL-001',
        hospitalName: d.hospitalName || 'AIIMS New Delhi (Central OPD Network)',
      };

      setFirebaseUser(user);
      setCurrentUser(verifiedProfile);

      logAuditEvent({
        action: 'STAFF_LOGIN',
        role,
        userId: user.uid,
        entityType: 'AUTH',
        entityId: user.uid,
        metadata: { role, email: user.email },
      });

      return { success: true };
    } catch (error: any) {
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
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      const user = userCredential.user;
      setFirebaseUser(user);

      // Write protected user profile to Firestore
      const userDocRef = doc(db, COLLECTIONS.USERS, user.uid);
      const isDoctor = role === 'DOCTOR';
      const profileData = {
        uid: user.uid,
        email: user.email,
        name: name.trim(),
        role,
        registrationNumber: registrationNumber?.trim() || (isDoctor ? 'MCI-TEMP-01' : undefined),
        department: department?.trim() || (isDoctor ? 'General Medicine & OPD' : 'Hospital Operations'),
        specialization: department?.trim() || (isDoctor ? 'Physician & OPD' : undefined),
        roomNumber: isDoctor ? 'OPD Room 12' : undefined,
        availabilityStatus: isDoctor ? ('AVAILABLE' as DoctorAvailabilityStatus) : undefined,
        status: isDoctor ? ('AVAILABLE' as DoctorAvailabilityStatus) : undefined,
        hospitalId: 'HOSP-DEL-001',
        hospitalName: 'AIIMS New Delhi (Central OPD Network)',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(userDocRef, profileData);

      const verifiedProfile: UserProfile = {
        id: user.uid,
        name: profileData.name,
        role,
        email: user.email || email,
        registrationNumber: profileData.registrationNumber,
        department: profileData.department,
        specialization: profileData.specialization,
        roomNumber: profileData.roomNumber,
        availabilityStatus: profileData.availabilityStatus,
        organizationId: profileData.hospitalId,
        hospitalName: profileData.hospitalName,
      };

      setCurrentUser(verifiedProfile);

      logAuditEvent({
        action: 'STAFF_REGISTERED',
        role,
        userId: user.uid,
        entityType: 'AUTH',
        entityId: user.uid,
        metadata: { role, name: profileData.name, email },
      });

      return { success: true };
    } catch (error: any) {
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
   * Update real-time doctor availability status in Firestore
   */
  const updateDoctorAvailability = async (status: DoctorAvailabilityStatus) => {
    const roleKey = currentUser.role ? String(currentUser.role).toUpperCase().trim() : '';
    if (!firebaseUser || (roleKey !== 'DOCTOR' && roleKey !== 'PHYSICIAN')) return;
    try {
      await updateDoctorStatusInDb(firebaseUser.uid, status);
      setCurrentUser((prev) => ({
        ...prev,
        availabilityStatus: status,
      }));
      logAuditEvent({
        action: 'DOCTOR_AVAILABILITY_CHANGED',
        role: 'DOCTOR',
        userId: firebaseUser.uid,
        entityType: 'USER',
        entityId: firebaseUser.uid,
        metadata: { newStatus: status },
      });
    } catch (err) {
      console.warn('Notice updating doctor availability:', err);
    }
  };

  /**
   * Log out and restore anonymous Kiosk intake session
   */
  const logout = async () => {
    setIsAuthLoading(true);
    try {
      // If doctor, mark offline before signing out
      if (firebaseUser && currentUser.role === 'DOCTOR') {
        try {
          await updateDoctorStatusInDb(firebaseUser.uid, 'OFFLINE');
        } catch (e) {
          // non-blocking
        }
      }

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
      try {
        if (window.location.pathname !== '/kiosk') {
          window.history.pushState(null, '', '/kiosk');
        }
        window.location.hash = '#/kiosk';
        window.dispatchEvent(new PopStateEvent('popstate'));
      } catch (e) {
        window.location.hash = '#/kiosk';
      }
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
        updateDoctorAvailability,
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
