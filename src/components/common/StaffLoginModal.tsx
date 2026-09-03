import React, { useState } from 'react';
import { Lock, Stethoscope, BarChart3, X, AlertCircle, Key, UserCheck, Loader2 } from 'lucide-react';
import { UserRole } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface StaffLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialRole?: UserRole;
}

export const StaffLoginModal: React.FC<StaffLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialRole = 'DOCTOR',
}) => {
  const { loginStaffWithEmail, registerStaffAccount } = useAuth();
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');
  const [selectedRole, setSelectedRole] = useState<'DOCTOR' | 'ADMIN'>(
    initialRole === 'ADMIN' ? 'ADMIN' : 'DOCTOR'
  );

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [department, setDepartment] = useState('Cardiology & Internal Medicine');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      if (authMode === 'signin') {
        const res = await loginStaffWithEmail(email, password);
        if (res.success) {
          if (onSuccess) onSuccess();
          onClose();
        } else {
          setError(res.message || 'Authentication failed. Please check your credentials.');
        }
      } else {
        if (!name) {
          setError('Please provide your full clinical/staff name.');
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
          if (onSuccess) onSuccess();
          onClose();
        } else {
          setError(res.message || 'Registration failed. Please try again.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-md w-full rounded-[36px] bg-white/95 backdrop-blur-2xl border-2 border-white/80 p-6 sm:p-8 shadow-2xl text-slate-900 animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200/80">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-700 font-bold shadow-xs">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-blue-950">Staff Authentication</h3>
              <p className="text-xs text-slate-500 font-medium">
                {authMode === 'signin' ? 'Sign in to access protected OPD systems' : 'Register official hospital credentials'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex rounded-xl bg-slate-100 p-1 mb-4 border border-slate-200">
          <button
            type="button"
            onClick={() => {
              setAuthMode('signin');
              setError(null);
            }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
              authMode === 'signin' ? 'bg-white text-blue-950 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Staff Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('register');
              setError(null);
            }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
              authMode === 'register' ? 'bg-white text-blue-950 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Create Staff Account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {authMode === 'register' && (
            <>
              <div>
                <label className="text-[11px] uppercase tracking-wider font-bold text-slate-500 block mb-1">
                  Hospital Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('DOCTOR')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      selectedRole === 'DOCTOR'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>Admin / Triage</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wider font-bold text-slate-500 block mb-1">
                  Full Name & Title
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={selectedRole === 'DOCTOR' ? 'e.g. Dr. A. Varma, MD' : 'e.g. Hospital Admin'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 font-medium focus:outline-none focus:border-blue-600 focus:bg-white"
                  required
                />
              </div>

              {selectedRole === 'DOCTOR' && (
                <div>
                  <label className="text-[11px] uppercase tracking-wider font-bold text-slate-500 block mb-1">
                    MCI / State Medical Council Registration No.
                  </label>
                  <input
                    type="text"
                    value={regNumber}
                    onChange={(e) => setRegNumber(e.target.value)}
                    placeholder="e.g. MCI-48921"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 font-mono font-medium focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
              )}

              <div>
                <label className="text-[11px] uppercase tracking-wider font-bold text-slate-500 block mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Cardiology & Internal Medicine"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 font-medium focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>
            </>
          )}

          <div>
            <label className="text-[11px] uppercase tracking-wider font-bold text-slate-500 block mb-1">
              Official Hospital Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. dr.varma@aiims.edu.in"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 font-medium focus:outline-none focus:border-blue-600 focus:bg-white shadow-inner"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wider font-bold text-slate-500 block mb-1">
              Account Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter secure password"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 font-medium focus:outline-none focus:border-blue-600 focus:bg-white shadow-inner"
              required
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating with Firebase...</span>
              </>
            ) : authMode === 'signin' ? (
              <>
                <Key className="w-4 h-4" />
                <span>Verify & Sign In</span>
              </>
            ) : (
              <>
                <UserCheck className="w-4 h-4" />
                <span>Register & Create Profile</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-4 pt-3 border-t border-slate-200 text-center">
          <p className="text-[11px] text-slate-400 font-medium">
            Firebase Authentication • Cloud Firestore RBAC • AIIMS New Delhi Tenant
          </p>
        </div>
      </div>
    </div>
  );
};
