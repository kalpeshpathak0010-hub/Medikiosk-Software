import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInAnonymously,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
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

export function normalizeUserRole(rawRole?: any): UserRole | null {
  if (!rawRole) return null;
  const roleStr = String(rawRole).trim().toUpperCase();
  if (roleStr === 'DOCTOR' || roleStr === 'PHYSICIAN') {
    return 'DOCTOR';
  }
  if (roleStr === 'ADMIN' || roleStr === 'ADMINISTRATOR') {
    return 'ADMIN';
  }
  if (roleStr === 'PATIENT') {
    return 'PATIENT';
  }
  return null;
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
  loginStaffWithGoogle: () => Promise<{
    success: boolean;
    message?: string;
    needsProfileSetup?: boolean;
    userEmail?: string;
    userName?: string;
  }>;
  assignStaffProfile: (
    role: 'DOCTOR' | 'ADMIN',
    name: string,
    registrationNumber?: string,
    department?: string
  ) => Promise<{ success: boolean; message?: string }>;
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

        if (user.isAnonymous) {
          // Anonymous patient session for Kiosk Terminal intake
          const patientProfile: UserProfile = {
            ...DEFAULT_PATIENT_PROFILE,
            id: user.uid,
          };
          setCurrentUser(patientProfile);

          try {
            const userDocRef = doc(db, COLLECTIONS.USERS, user.uid);
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
          } catch (e) {
            // Patient doc persistence notice (non-fatal)
          }
        } else {
          // Non-anonymous staff account: fetch verified profile from protected collections
          try {
            let profileSnap = await getDoc(doc(db, COLLECTIONS.STAFF_PROFILES, user.uid)).catch(() => null);
            if (!profileSnap || !profileSnap.exists()) {
              profileSnap = await getDoc(doc(db, COLLECTIONS.USERS, user.uid)).catch(() => null);
            }

            if (profileSnap && profileSnap.exists()) {
              const data = profileSnap.data();
              const verifiedRole = normalizeUserRole(data.role);

              if (verifiedRole && data.active !== false && data.status !== 'INACTIVE') {
                const verifiedProfile: UserProfile = {
                  id: user.uid,
                  name: data.name || (verifiedRole === 'DOCTOR' ? 'Staff Physician' : 'Hospital Staff'),
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
                // Invalid or missing staff role/inactive profile: do NOT grant doctor/admin access
                setCurrentUser({
                  ...DEFAULT_PATIENT_PROFILE,
                  id: user.uid,
                  name: user.displayName || user.email || 'Unverified User',
                  email: user.email || undefined,
                  role: 'PATIENT',
                });
              }
            } else {
              // Firebase account exists but Firestore staff profile is missing:
              // Do NOT grant staff access or auto-create doctor profile
              setCurrentUser({
                ...DEFAULT_PATIENT_PROFILE,
                id: user.uid,
                name: user.displayName || user.email || 'Unverified User',
                email: user.email || undefined,
                role: 'PATIENT',
              });
            }
          } catch (e) {
            console.warn('[Firebase Auth] Notice loading user document:', e);
            setCurrentUser({
              ...DEFAULT_PATIENT_PROFILE,
              id: user.uid,
              role: 'PATIENT',
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
   * Strictly separates Firebase Auth credentials from Firestore profile authorization.
   */
  const loginStaffWithEmail = async (
    email: string,
    pass: string
  ): Promise<{ success: boolean; message?: string }> => {
    const cleanEmail = email.trim();

    try {
      // 1. Authenticate with Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      const user = userCredential.user;

      console.log('[Auth Diagnostics] Firebase Auth returned user: true');
      console.log('[Auth Diagnostics] Returned Firebase UID:', user.uid);

      // 2. Fetch canonical staff profile from Firestore using the Firebase UID
      // Check staff_profiles/{uid} first, then fallback to users/{uid}
      let profileDoc = await getDoc(doc(db, COLLECTIONS.STAFF_PROFILES, user.uid)).catch((err) => {
        console.warn('[Auth Diagnostics] staff_profiles lookup notice:', err.message);
        return null;
      });

      if (!profileDoc || !profileDoc.exists()) {
        profileDoc = await getDoc(doc(db, COLLECTIONS.USERS, user.uid)).catch((err) => {
          console.warn('[Auth Diagnostics] users lookup notice:', err.message);
          return null;
        });
      }

      // 3. Verify Firestore profile existence
      if (!profileDoc || !profileDoc.exists()) {
        console.warn('[Auth Diagnostics] Firestore profile exists: false');
        console.warn('[Auth Diagnostics] Final route decision: Access Denied (Missing staff profile)');
        await signOut(auth);
        setFirebaseUser(null);
        setCurrentUser(DEFAULT_PATIENT_PROFILE);
        return {
          success: false,
          message:
            'Your Firebase account is authenticated, but no authorized physician profile is assigned to this account. Contact the hospital administrator.',
        };
      }

      console.log('[Auth Diagnostics] Firestore profile exists: true');
      const d = profileDoc.data();

      // 4. Verify account is active
      if (d.active === false || d.status === 'INACTIVE' || d.status === 'DEACTIVATED') {
        console.warn('[Auth Diagnostics] Profile is inactive');
        console.warn('[Auth Diagnostics] Final route decision: Access Denied (Inactive staff profile)');
        await signOut(auth);
        setFirebaseUser(null);
        setCurrentUser(DEFAULT_PATIENT_PROFILE);
        return {
          success: false,
          message: 'This staff account is deactivated. Contact the hospital administrator.',
        };
      }

      // 5. Verify role exists and is strictly valid
      const validatedRole = normalizeUserRole(d.role);
      console.log('[Auth Diagnostics] Profile raw role:', d.role, '| Normalized role:', validatedRole);

      if (!validatedRole) {
        console.warn('[Auth Diagnostics] Missing or invalid role in staff profile:', d.role);
        console.warn('[Auth Diagnostics] Final route decision: Access Denied (Invalid Role)');
        await signOut(auth);
        setFirebaseUser(null);
        setCurrentUser(DEFAULT_PATIENT_PROFILE);
        return {
          success: false,
          message:
            'Your Firebase account is authenticated, but no authorized physician profile is assigned to this account. Contact the hospital administrator.',
        };
      }

      // 6. Verify required staff fields exist
      if (!d.name || typeof d.name !== 'string' || !d.name.trim()) {
        console.warn('[Auth Diagnostics] Staff profile missing required clinical name field');
        console.warn('[Auth Diagnostics] Final route decision: Access Denied (Incomplete Profile)');
        await signOut(auth);
        setFirebaseUser(null);
        setCurrentUser(DEFAULT_PATIENT_PROFILE);
        return {
          success: false,
          message: 'Staff profile is missing required clinical name. Contact the hospital administrator.',
        };
      }

      // 7. Establish authenticated staff state
      const verifiedProfile: UserProfile = {
        id: user.uid,
        name: d.name.trim(),
        role: validatedRole,
        email: d.email || user.email || cleanEmail,
        phone: d.phone,
        registrationNumber: d.registrationNumber,
        badgeNumber: d.badgeNumber,
        department: d.department || (validatedRole === 'DOCTOR' ? 'General Medicine & OPD' : 'Hospital Operations'),
        specialization: d.specialization || d.department || (validatedRole === 'DOCTOR' ? 'Physician & OPD' : undefined),
        roomNumber: d.roomNumber || (validatedRole === 'DOCTOR' ? 'OPD Room 12' : undefined),
        availabilityStatus: (d.availabilityStatus as DoctorAvailabilityStatus) || (validatedRole === 'DOCTOR' ? 'AVAILABLE' : undefined),
        organizationId: d.hospitalId || 'HOSP-DEL-001',
        hospitalName: d.hospitalName || 'AIIMS New Delhi (Central OPD Network)',
      };

      setFirebaseUser(user);
      setCurrentUser(verifiedProfile);

      console.log('[Auth Diagnostics] Final route decision: Authorized for role', validatedRole);

      logAuditEvent({
        action: 'STAFF_LOGIN',
        role: validatedRole,
        userId: user.uid,
        entityType: 'AUTH',
        entityId: user.uid,
        metadata: { role: validatedRole, email: user.email },
      });

      return { success: true };
    } catch (error: any) {
      const code = error?.code || 'unknown-error';
      const rawMessage = error?.message || String(error);

      console.error('[Auth Diagnostics] Firebase authentication error code:', code);
      console.error('[Auth Diagnostics] Firebase authentication error message:', rawMessage);
      console.log('[Auth Diagnostics] Firebase Auth returned user: false');
      console.log('[Auth Diagnostics] Returned Firebase UID: None');
      console.log('[Auth Diagnostics] Firestore profile exists: N/A');
      console.log('[Auth Diagnostics] Profile role: N/A');
      console.log('[Auth Diagnostics] Final route decision: Access Denied');

      let msg: string;
      if (code === 'auth/operation-not-allowed') {
        msg =
          'Firebase Authentication Error (auth/operation-not-allowed): The Email/Password sign-in provider is disabled in Firebase Console for project "lustrous-flash-ck7s0". Please enable Email/Password under Authentication > Sign-in method in the Firebase Console.';
      } else if (code === 'auth/invalid-credential' || code === 'auth/user-not-found') {
        msg = 'Firebase Authentication account does not exist or the supplied password is incorrect.';
      } else if (code === 'auth/wrong-password') {
        msg = 'Firebase Authentication account does not exist or the supplied password is incorrect.';
      } else if (code === 'auth/invalid-email') {
        msg = 'Invalid email format. Please enter a valid official email address.';
      } else if (code === 'auth/user-disabled') {
        msg = 'This staff account has been disabled in Firebase Authentication.';
      } else if (code === 'auth/too-many-requests') {
        msg = 'Access temporarily disabled due to many failed login attempts. Please try again later.';
      } else if (code === 'auth/network-request-failed') {
        msg = 'Network communication failed while connecting to Firebase Authentication. Please check your connectivity.';
      } else if (code === 'auth/admin-restricted-operation') {
        msg = 'This operation is restricted by project security settings in Firebase Console.';
      } else if (code === 'auth/configuration-not-found') {
        msg = 'Firebase project authentication configuration not found.';
      } else if (code === 'permission-denied') {
        msg = 'Firestore permission-denied: Insufficient permissions to access staff profiles.';
      } else if (code === 'unavailable') {
        msg = 'Firestore database service is currently unavailable. Please retry.';
      } else {
        msg = `Firebase Authentication error (${code}): ${rawMessage}`;
      }

      logAuditEvent({
        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        role: currentUser.role,
        userId: currentUser.id,
        entityType: 'AUTH',
        entityId: cleanEmail,
        metadata: { attemptedEmail: cleanEmail, errorCode: code, errorMessage: rawMessage },
      });

      return { success: false, message: msg };
    }
  };

  /**
   * Secure Google Authentication for Staff / Doctors
   * Uses Firebase Auth popup (Google provider enabled by set_up_firebase)
   */
  const loginStaffWithGoogle = async (): Promise<{
    success: boolean;
    message?: string;
    needsProfileSetup?: boolean;
    userEmail?: string;
    userName?: string;
  }> => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;
      setFirebaseUser(user);

      console.log('[Auth Diagnostics] Google sign-in successful. UID:', user.uid, 'Email:', user.email);

      // Fetch canonical profile from staff_profiles or users
      let profileDoc = await getDoc(doc(db, COLLECTIONS.STAFF_PROFILES, user.uid)).catch(() => null);
      if (!profileDoc || !profileDoc.exists()) {
        profileDoc = await getDoc(doc(db, COLLECTIONS.USERS, user.uid)).catch(() => null);
      }

      if (profileDoc && profileDoc.exists()) {
        const d = profileDoc.data();
        const validatedRole = normalizeUserRole(d.role);
        if (validatedRole && d.active !== false && d.status !== 'INACTIVE') {
          const verifiedProfile: UserProfile = {
            id: user.uid,
            name: d.name || user.displayName || 'Staff Physician',
            role: validatedRole,
            email: d.email || user.email || undefined,
            phone: d.phone,
            registrationNumber: d.registrationNumber,
            badgeNumber: d.badgeNumber,
            department: d.department || (validatedRole === 'DOCTOR' ? 'General Medicine & OPD' : 'Hospital Operations'),
            specialization: d.specialization || d.department || (validatedRole === 'DOCTOR' ? 'Physician & OPD' : undefined),
            roomNumber: d.roomNumber || (validatedRole === 'DOCTOR' ? 'OPD Room 12' : undefined),
            availabilityStatus: (d.availabilityStatus as DoctorAvailabilityStatus) || (validatedRole === 'DOCTOR' ? 'AVAILABLE' : undefined),
            organizationId: d.hospitalId || 'HOSP-DEL-001',
            hospitalName: d.hospitalName || 'AIIMS New Delhi (Central OPD Network)',
          };
          setCurrentUser(verifiedProfile);

          logAuditEvent({
            action: 'STAFF_LOGIN',
            role: validatedRole,
            userId: user.uid,
            entityType: 'AUTH',
            entityId: user.uid,
            metadata: { role: validatedRole, email: user.email, provider: 'google.com' },
          });

          return { success: true };
        }
      }

      // If account is authenticated via Google, but no staff profile document exists yet:
      return {
        success: false,
        needsProfileSetup: true,
        userEmail: user.email || undefined,
        userName: user.displayName || undefined,
        message: `Authenticated as ${user.email}. Complete your physician profile registration below to access OPD.`,
      };
    } catch (error: any) {
      const code = error?.code || 'unknown-error';
      const rawMessage = error?.message || String(error);
      console.error('[Auth Diagnostics] Google sign-in error:', code, rawMessage);

      let msg = `Google sign-in error: ${rawMessage}`;
      if (code === 'auth/popup-closed-by-user') {
        msg = 'Sign-in popup was closed before completing authentication.';
      } else if (code === 'auth/popup-blocked') {
        msg = 'Sign-in pop-up was blocked by browser. Please allow pop-ups for this site.';
      } else if (code === 'auth/cancelled-popup-request') {
        msg = 'Another sign-in pop-up is already active.';
      }
      return { success: false, message: msg };
    }
  };

  /**
   * Assign or Register a verified staff profile for the currently signed-in Firebase user
   */
  const assignStaffProfile = async (
    role: 'DOCTOR' | 'ADMIN',
    name: string,
    registrationNumber?: string,
    department?: string
  ): Promise<{ success: boolean; message?: string }> => {
    if (!auth.currentUser) {
      return { success: false, message: 'No active Firebase session. Please sign in with Google or Email first.' };
    }
    const user = auth.currentUser;
    const isDoctor = role === 'DOCTOR';
    const profileData = {
      uid: user.uid,
      email: user.email || '',
      name: name.trim(),
      role,
      active: true,
      status: 'ACTIVE',
      registrationNumber: registrationNumber?.trim() || (isDoctor ? 'MCI-REG-01' : undefined),
      department: department?.trim() || (isDoctor ? 'General Medicine & OPD' : 'Hospital Operations'),
      specialization: department?.trim() || (isDoctor ? 'Physician & OPD' : undefined),
      roomNumber: isDoctor ? 'OPD Room 12' : undefined,
      availabilityStatus: isDoctor ? ('AVAILABLE' as DoctorAvailabilityStatus) : undefined,
      hospitalId: 'HOSP-DEL-001',
      hospitalName: 'AIIMS New Delhi (Central OPD Network)',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(doc(db, COLLECTIONS.STAFF_PROFILES, user.uid), profileData);
      await setDoc(doc(db, COLLECTIONS.USERS, user.uid), profileData);

      const verifiedProfile: UserProfile = {
        id: user.uid,
        name: profileData.name,
        role,
        email: user.email || undefined,
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
        entityType: 'USER',
        entityId: user.uid,
        metadata: { role, name: profileData.name, email: user.email },
      });

      return { success: true };
    } catch (e: any) {
      return { success: false, message: `Failed to save profile: ${e.message}` };
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
    const cleanEmail = email.trim();

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      const user = userCredential.user;
      setFirebaseUser(user);

      const isDoctor = role === 'DOCTOR';
      const profileData = {
        uid: user.uid,
        email: user.email || cleanEmail,
        name: name.trim(),
        role,
        active: true,
        status: 'ACTIVE',
        registrationNumber: registrationNumber?.trim() || (isDoctor ? 'MCI-REG-01' : undefined),
        department: department?.trim() || (isDoctor ? 'General Medicine & OPD' : 'Hospital Operations'),
        specialization: department?.trim() || (isDoctor ? 'Physician & OPD' : undefined),
        roomNumber: isDoctor ? 'OPD Room 12' : undefined,
        availabilityStatus: isDoctor ? ('AVAILABLE' as DoctorAvailabilityStatus) : undefined,
        hospitalId: 'HOSP-DEL-001',
        hospitalName: 'AIIMS New Delhi (Central OPD Network)',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Write canonical profile to both staff_profiles and users collections
      await setDoc(doc(db, COLLECTIONS.STAFF_PROFILES, user.uid), profileData);
      await setDoc(doc(db, COLLECTIONS.USERS, user.uid), profileData);

      const verifiedProfile: UserProfile = {
        id: user.uid,
        name: profileData.name,
        role,
        email: user.email || cleanEmail,
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
        metadata: { role, name: profileData.name, email: cleanEmail },
      });

      return { success: true };
    } catch (error: any) {
      const code = error?.code || 'unknown-error';
      const rawMessage = error?.message || String(error);

      console.error('[Auth Diagnostics] Registration error code:', code);
      console.error('[Auth Diagnostics] Registration error message:', rawMessage);

      let msg = 'Registration failed. Please try again.';
      if (code === 'auth/operation-not-allowed') {
        msg =
          'Firebase Authentication Error (auth/operation-not-allowed): The Email/Password sign-in provider is disabled in Firebase Console for project "lustrous-flash-ck7s0". Please enable Email/Password under Authentication > Sign-in method in the Firebase Console.';
      } else if (code === 'auth/email-already-in-use') {
        msg = 'This email is already registered in Firebase Authentication. Please sign in with your password.';
      } else if (code === 'auth/weak-password') {
        msg = 'Password is too weak. Please use at least 6 characters.';
      } else if (code === 'auth/invalid-email') {
        msg = 'Please provide a valid official email address format.';
      } else if (code === 'auth/network-request-failed') {
        msg = 'Network communication failed while connecting to Firebase Authentication. Please check your connectivity.';
      } else {
        msg = `Registration error (${code}): ${rawMessage}`;
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
        loginStaffWithGoogle,
        assignStaffProfile,
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
