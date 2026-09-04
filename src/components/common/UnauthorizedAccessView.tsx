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
  const { currentUser, firebaseUser, loginStaffWithEmail, registerStaffAccount } = useAuth();
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isStaffAuthenticated = Boolean(
    firebaseUser && !firebaseUser.isAnonymous && (currentUser.role === 'DOCTOR' || currentUser.role === 'ADMIN')
  );

  const getRouteDetails = (route: AppRoute) => {
    switch (route) {
      case 'doctor':
        return {
          title: 'Physician OPD Clinical Workspace',
          requiredRole: 'DOCTOR or ADMIN',
          description:
            'Contains confidential patient triage queue, live clinical history intake streams, and physician verification notes.',
          icon: Stethoscope,
          accentColor: 'blue',
        };
      case 'timeline':
        return {
          title: 'Longitudinal Medical Timeline',
          requiredRole: 'DOCTOR or ADMIN',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

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
          setTimeout(() => {
            onNavigate(attemptedRoute);
          }, 400);
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
          setTimeout(() => {
            onNavigate(attemptedRoute);
          }, 400);
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
                  {authMode === 'signin' ? 'Staff Login' : 'Create Staff Profile'}
                </h4>
              </div>
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
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {authMode === 'register' && (
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
                </div>
              )}

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

              {/* Error or Success feedback */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-700 text-rose-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{errorMessage}</span>
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
                    <span>Verifying Credentials...</span>
                  </>
                ) : authMode === 'signin' ? (
                  <>
                    <Key className="w-4 h-4" />
                    <span>Staff Login</span>
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
