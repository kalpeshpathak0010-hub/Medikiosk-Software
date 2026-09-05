import React, { useState } from 'react';
import {
  ShieldAlert,
  Lock,
  Stethoscope,
  BarChart3,
  Key,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  UserCheck,
} from 'lucide-react';
import { AppRoute, UserRole } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface UnauthorizedAccessViewProps {
  attemptedRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
}

export const UnauthorizedAccessView: React.FC<UnauthorizedAccessViewProps> = ({
  attemptedRoute,
  onNavigate,
}) => {
  const { currentUser, firebaseUser, loginStaffWithEmail, loginStaffWithGoogle, assignStaffProfile, registerStaffAccount } = useAuth();
  const [authMode, setAuthMode] = useState<'signin' | 'register' | 'profile_setup'>('signin');
  const [selectedRole, setSelectedRole] = useState<'DOCTOR' | 'ADMIN'>(
    attemptedRoute === 'admin' || attemptedRoute === 'abdm' ? 'ADMIN' : 'DOCTOR'
  );
  const [showSwitchLoginForm, setShowSwitchLoginForm] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [department, setDepartment] = useState('Cardiology & Internal Medicine');

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const userRoleNormalized = String(currentUser.role || '').toUpperCase().trim();
  const isStaffAuthenticated = Boolean(
    firebaseUser && !firebaseUser.isAnonymous && (userRoleNormalized === 'DOCTOR' || userRoleNormalized === 'ADMIN' || userRoleNormalized === 'PHYSICIAN')
  );

  const getRouteDetails = (route: AppRoute) => {
    switch (route) {
      case 'doctor':
        return {
          title: 'Physician OPD Clinical Workspace',
          requiredRole: 'DOCTOR',
          description:
            'Contains confidential patient triage queue, live clinical history intake streams, and physician verification notes.',
          icon: Stethoscope,
          accentColor: 'blue',
        };
      case 'timeline':
        return {
          title: 'Longitudinal Medical Timeline',
          requiredRole: 'DOCTOR',
          description:
            'Displays multi-year chronological medical history and confidential diagnostic event logs.',
          icon: Stethoscope,
          accentColor: 'indigo',
        };
      case 'ocr_pipeline':
        return {
          title: 'OCR & Document AI Pipeline Inspector',
          requiredRole: 'DOCTOR or ADMIN',
          description:
            'Contains raw scanned document OCR bounding boxes, NER confidence scores, and extraction logs.',
          icon: Lock,
          accentColor: 'amber',
        };
      case 'admin':
        return {
          title: 'Hospital Admin & Kiosk Telemetry',
          requiredRole: 'ADMIN',
          description:
            'Restricted to hospital medical directors and system administrators for managing kiosk fleet hardware, throughput metrics, and staff assignments.',
          icon: BarChart3,
          accentColor: 'purple',
        };
      case 'abdm':
        return {
          title: 'ABDM FHIR Technical Architecture',
          requiredRole: 'ADMIN',
          description:
            'National Digital Health Mission (NDHM) payload configuration, M1/M2/M3 milestone telemetry, and security policy inspector.',
          icon: Lock,
          accentColor: 'emerald',
        };
      default:
        return {
          title: 'Protected Healthcare Resource',
          requiredRole: 'DOCTOR or ADMIN',
          description: 'Access to this module requires verified hospital staff credentials.',
          icon: Lock,
          accentColor: 'blue',
        };
    }
  };

  const routeInfo = getRouteDetails(attemptedRoute);
  const RouteIcon = routeInfo.icon;

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsGoogleLoading(true);
    try {
      const res = await loginStaffWithGoogle();
      if (res.success) {
        setSuccessMessage('Staff authentication verified with Google! Loading workspace...');
        onNavigate(attemptedRoute);
      } else if (res.needsProfileSetup) {
        if (res.userName) setName(res.userName);
        if (res.userEmail) setEmail(res.userEmail);
        setAuthMode('profile_setup');
        setErrorMessage(null);
      } else {
        setErrorMessage(res.message || 'Google sign-in failed. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Google sign-in encountered an error.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleProfileSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!name.trim()) {
      setErrorMessage('Please provide your full clinical/staff name.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await assignStaffProfile(selectedRole, name, regNumber, department);
      if (res.success) {
        setSuccessMessage('Staff profile assigned! Loading protected workspace...');
        onNavigate(attemptedRoute);
      } else {
        setErrorMessage(res.message || 'Failed to assign staff profile.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Unexpected error while assigning staff profile.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (authMode === 'profile_setup') {
      return handleProfileSetup(e);
    }

    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      if (authMode === 'signin') {
        const res = await loginStaffWithEmail(email, password);
        if (res.success) {
          setSuccessMessage('Staff authentication verified! Loading protected workspace...');
          onNavigate(attemptedRoute);
        } else {
          setErrorMessage(res.message || 'Authentication failed. Please check your credentials.');
        }
      } else {
        if (!name) {
          setErrorMessage('Please provide your full clinical/staff name.');
          setIsLoading(false);
          return;
        }

        const res = await registerStaffAccount(
          email,
          password,
          selectedRole,
          name,
          regNumber,
          department
        );
        if (res.success) {
          setSuccessMessage('Staff profile registered! Loading protected workspace...');
          onNavigate(attemptedRoute);
        } else {
          setErrorMessage(res.message || 'Registration failed. Please try again.');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected authentication error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-8 relative z-10">
      <div className="max-w-2xl w-full rounded-[36px] bg-white/85 backdrop-blur-2xl border-2 border-white/80 shadow-2xl p-6 sm:p-10 text-slate-900 ring-1 ring-slate-900/10 animate-scale-up">
        {/* Top Warning Shield */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pb-6 mb-6 border-b border-slate-200/80 text-center sm:text-left">
          <div className="w-16 h-16 rounded-3xl bg-rose-100 border-2 border-rose-300 flex items-center justify-center text-rose-600 shrink-0 shadow-lg shadow-rose-500/10">
            <ShieldAlert className="w-9 h-9" />
          </div>

          <div className="flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
              <span className="text-[11px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-rose-600 text-white shadow-xs">
                Access Restricted • RBAC Enforced
              </span>
              <span className="text-xs font-mono font-bold text-slate-500">
                Route: #{attemptedRoute}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-blue-950 tracking-tight">
              {!isStaffAuthenticated
                ? 'Staff authentication required.'
                : 'You do not have permission to access this workspace.'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium leading-relaxed">
              {!isStaffAuthenticated ? (
                <span>Access to this clinical workspace requires verified hospital staff credentials.</span>
              ) : (
                <span>
                  You are currently signed in as <strong className="text-slate-900 font-bold">{currentUser.name}</strong> (Role:{' '}
                  <span className="px-2 py-0.5 rounded-md bg-slate-200 font-mono font-bold text-slate-800 text-xs">
                    {currentUser.role}
                  </span>
                  ). This workspace is restricted to <strong>{routeInfo.requiredRole}</strong>.
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Route Details Box */}
        <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-blue-50/80 border border-blue-200/80 shadow-xs flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-xs">
            <RouteIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-blue-950">
              {routeInfo.title}
            </h3>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed font-medium">
              {routeInfo.description}
            </p>
            <p className="text-xs text-blue-800 font-bold mt-2 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>Required Role: <strong>{routeInfo.requiredRole}</strong></span>
            </p>
          </div>
        </div>

        {/* Staff Authentication Box (Always shown for unauthenticated users, or toggleable for authenticated users switching accounts) */}
        {(!isStaffAuthenticated || showSwitchLoginForm) ? (
          <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl mb-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-teal-400" />
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">
                  {authMode === 'signin' ? 'Staff Login' : authMode === 'profile_setup' ? 'Assign Staff Profile' : 'Create Staff Profile'}
                </h4>
              </div>
              {authMode !== 'profile_setup' && (
                <div className="flex rounded-xl bg-slate-800 p-0.5 border border-slate-700 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signin');
                      setErrorMessage(null);
                    }}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                      authMode === 'signin' ? 'bg-teal-500 text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('register');
                      setErrorMessage(null);
                    }}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                      authMode === 'register' ? 'bg-teal-500 text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Register
                  </button>
                </div>
              )}
            </div>

            {authMode === 'profile_setup' && (
              <div className="p-3 rounded-2xl bg-teal-950/60 border border-teal-700/60 text-teal-200 text-xs">
                <p className="font-bold flex items-center gap-1.5 mb-1 text-teal-300">
                  <UserCheck className="w-4 h-4" />
                  <span>Google Account Authenticated: Complete Profile</span>
                </p>
                <p className="text-slate-300">
                  Please verify your clinical title and department to activate OPD Doctor access.
                </p>
              </div>
            )}

            {authMode === 'signin' && (
              <div className="space-y-3 mb-4">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading || isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs shadow-md flex items-center justify-center gap-2.5 transition active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {isGoogleLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  ) : (
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                  )}
                  <span>Sign In with Google (AIIMS Staff)</span>
                </button>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px bg-slate-800"></div>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">or hospital email & password</span>
                  <div className="flex-1 h-px bg-slate-800"></div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {(authMode === 'register' || authMode === 'profile_setup') && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedRole('DOCTOR')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        selectedRole === 'DOCTOR'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Stethoscope className="w-3.5 h-3.5" />
                      <span>Doctor (MD)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedRole('ADMIN')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        selectedRole === 'ADMIN'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      <span>Admin</span>
                    </button>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-1">
                      Full Clinical Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Dr. A. Varma, MD"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-medium focus:outline-none focus:border-teal-400"
                      required
                    />
                  </div>

                  {selectedRole === 'DOCTOR' && (
                    <div>
                      <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-1">
                        MCI / State Council Registration No.
                      </label>
                      <input
                        type="text"
                        value={regNumber}
                        onChange={(e) => setRegNumber(e.target.value)}
                        placeholder="e.g. MCI-48921"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono font-medium focus:outline-none focus:border-teal-400"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-1">
                      Department
                    </label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. Cardiology & Internal Medicine"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-medium focus:outline-none focus:border-teal-400"
                    />
                  </div>
                </div>
              )}

              {authMode !== 'profile_setup' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-1">
                      Hospital Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. dr.varma@aiims.edu.in"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-medium focus:outline-none focus:border-teal-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-medium focus:outline-none focus:border-teal-400"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Error or Success feedback */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-700 text-rose-200 text-xs space-y-1.5">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                  {errorMessage.includes('auth/operation-not-allowed') && (
                    <div className="mt-2 pt-2 border-t border-rose-800/80 text-[11px] text-rose-200 leading-normal">
                      <strong>How to enable:</strong> Open{' '}
                      <a
                        href="https://console.firebase.google.com/project/lustrous-flash-ck7s0/authentication/providers"
                        target="_blank"
                        rel="noreferrer"
                        className="font-bold underline text-teal-300 hover:text-teal-200 inline-flex items-center gap-1"
                      >
                        Firebase Auth Providers
                      </a>
                      , click <strong>Email/Password</strong> and toggle <strong>Enable</strong>. Or use the <strong>Sign In with Google</strong> button above for immediate access.
                    </div>
                  )}
                </div>
              )}

              {successMessage && (
                <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-black uppercase tracking-wider transition active:scale-95 shadow cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : authMode === 'signin' ? (
                  <>
                    <Key className="w-4 h-4" />
                    <span>Staff Login</span>
                  </>
                ) : authMode === 'profile_setup' ? (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>Save Profile & Enter Workspace</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>Register & Authenticate</span>
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-3">
            <p className="font-semibold">
              Need administrator privileges? Sign in with authorized administrative credentials.
            </p>
            <button
              onClick={() => setShowSwitchLoginForm(true)}
              className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Staff Login (Switch Account)</span>
            </button>
          </div>
        )}

        {/* Actions: Return to Kiosk & Alternative Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('kiosk')}
              className="px-5 py-3 rounded-2xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs border border-slate-300 shadow-xs flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-slate-600" />
              <span>Return to Kiosk</span>
            </button>

            {currentUser.role === 'DOCTOR' && attemptedRoute !== 'doctor' && (
              <button
                onClick={() => onNavigate('doctor')}
                className="px-5 py-3 rounded-2xl bg-[#1e3a8a] hover:bg-[#1e40af] text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
              >
                <Stethoscope className="w-4 h-4" />
                <span>Open Doctor Workspace</span>
              </button>
            )}
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            AIIMS New Delhi OPD Central Network
          </span>
        </div>
      </div>
    </div>
  );
};
