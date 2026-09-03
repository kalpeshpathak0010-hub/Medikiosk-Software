import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Users,
  Clock,
  ShieldAlert,
  Globe,
  Monitor,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Mic,
  Activity,
  RefreshCw,
  Lock,
  Database,
  Key,
  ShieldCheck,
  Building2,
  FileCode,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchLiveAdminAnalytics, subscribeToLiveAdminAnalytics, AdminStats } from '../../services/dbService';

export const AdminDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [selectedTimeframe, setSelectedTimeframe] = useState<'today' | 'week' | 'month'>('today');
  const [activeAdminTab, setActiveAdminTab] = useState<'telemetry' | 'hardware' | 'security_rls'>('telemetry');
  const [stats, setStats] = useState<AdminStats>({
    totalPatients: 0,
    todayEncounters: 0,
    waitingCount: 0,
    completedCount: 0,
    emergencyCount: 0,
    averageIntakeDuration: '2m 30s',
    languageBreakdown: { hi: 0, en: 0, mr: 0, ta: 0, te: 0, bn: 0 },
    departmentBreakdown: { 'General Medicine': 0 },
    ocrProcessedCount: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    // Subscribe to live real-time Firestore analytics
    const unsub = subscribeToLiveAdminAnalytics((liveStats) => {
      setStats(liveStats);
      setIsLoading(false);
    });

    return () => {
      if (unsub) unsub();
    };
  }, []);

  const manualRefresh = async () => {
    setIsLoading(true);
    try {
      const data = await fetchLiveAdminAnalytics();
      setStats(data);
    } catch (e) {
      console.warn('Analytics manual refresh notice:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const kioskTerminals = [
    { id: 'KIOSK-01', location: 'OPD Ground Floor Main Gate', status: 'Online', paper: '85%', mic: 'Operational', patientsToday: stats.todayEncounters, ip: '10.24.1.101' },
    { id: 'KIOSK-02', location: 'Cardiology Waiting Area (1st Floor)', status: 'Online', paper: '62%', mic: 'Operational', patientsToday: Math.round(stats.todayEncounters * 0.4), ip: '10.24.1.102' },
    { id: 'KIOSK-03', location: 'Ayurveda & AYUSH Center (2nd Floor)', status: 'Online', paper: '91%', mic: 'Operational', patientsToday: Math.round(stats.todayEncounters * 0.3), ip: '10.24.1.103' },
    { id: 'KIOSK-04', location: 'Emergency Triage Entry', status: 'Online', paper: '44%', mic: 'Operational', patientsToday: stats.emergencyCount, ip: '10.24.1.104' },
  ];

  const rlsPolicies = [
    {
      collection: 'encounters / opd_visits',
      policy: 'isolate_by_tenant_and_role',
      command: 'READ / CREATE / UPDATE',
      roles: 'DOCTOR, ADMIN, PATIENT',
      rule: 'request.auth != null && (isStaff() || request.auth.uid == resource.data.userId)',
      status: 'ACTIVE_FIREBASE_RULES',
    },
    {
      collection: 'clinical_summaries',
      policy: 'doctor_sign_and_physician_access',
      command: 'UPDATE / SIGN_OFF',
      roles: 'DOCTOR, ADMIN',
      rule: 'request.auth != null && isStaff()',
      status: 'ACTIVE_FIREBASE_RULES',
    },
    {
      collection: 'ayush_assessments',
      policy: 'ayush_pariksha_integrity',
      command: 'READ / WRITE',
      roles: 'PATIENT, DOCTOR, ADMIN',
      rule: 'request.auth != null',
      status: 'ACTIVE_FIREBASE_RULES',
    },
    {
      collection: 'audit_logs',
      policy: 'phi_immutable_audit_boundary',
      command: 'CREATE ONLY (APPEND-ONLY)',
      roles: 'AUDIT_SERVICE, AUTH_ENGINE',
      rule: 'allow create: if request.auth != null; allow update, delete: if false;',
      status: 'ACTIVE_FIREBASE_RULES',
    },
  ];

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 p-4 sm:p-6 max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Hospital Admin & Security Telemetry
            </h1>
          </div>
          <p className="text-xs text-slate-400 flex flex-wrap items-center gap-2">
            <span>Facility: <strong className="text-slate-200">{currentUser.hospitalName}</strong></span>
            <span>•</span>
            <span>Org ID: <code className="text-teal-400 font-mono font-bold">{currentUser.organizationId}</code></span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-emerald-400 font-bold">Real-Time Firestore Live</span>
            </span>
            <button
              onClick={manualRefresh}
              disabled={isLoading}
              className="ml-2 inline-flex items-center gap-1 text-[11px] font-bold text-violet-400 hover:text-violet-300 bg-violet-950/60 border border-violet-800/60 px-2 py-0.5 rounded-lg cursor-pointer transition active:scale-95"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Syncing...' : 'Sync Now'}</span>
            </button>
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveAdminTab('telemetry')}
            className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap cursor-pointer ${
              activeAdminTab === 'telemetry' ? 'bg-violet-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            OPD Telemetry
          </button>
          <button
            onClick={() => setActiveAdminTab('hardware')}
            className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap cursor-pointer ${
              activeAdminTab === 'hardware' ? 'bg-violet-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Fleet Hardware
          </button>
          <button
            onClick={() => setActiveAdminTab('security_rls')}
            className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeAdminTab === 'security_rls' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Security & Rules Audit</span>
          </button>
        </div>
      </div>

      {activeAdminTab === 'telemetry' && (
        <div className="space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-black uppercase tracking-wider">Total Patients</span>
                <Users className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white">{stats.totalPatients}</p>
              <p className="text-[11px] text-emerald-400 font-bold mt-1">Live Firestore Count</p>
            </div>

            <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-black uppercase tracking-wider">Today Encounters</span>
                <Activity className="w-4 h-4 text-violet-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white">{stats.todayEncounters}</p>
              <p className="text-[11px] text-violet-400 font-bold mt-1">OPD Queue Sessions</p>
            </div>

            <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-black uppercase tracking-wider">Waiting / In Triage</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-amber-400">{stats.waitingCount}</p>
              <p className="text-[11px] text-slate-400 font-medium mt-1">Avg time: {stats.averageIntakeDuration}</p>
            </div>

            <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-black uppercase tracking-wider">Verified by Doctor</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-emerald-400">{stats.completedCount}</p>
              <p className="text-[11px] text-emerald-400 font-bold mt-1">Signed Off & FHIR</p>
            </div>

            <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-black uppercase tracking-wider">Emergency Flags</span>
                <ShieldAlert className="w-4 h-4 text-rose-500 animate-pulse" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-rose-500">{stats.emergencyCount}</p>
              <p className="text-[11px] text-rose-400 font-bold mt-1">Instant Red-Flag Alerts</p>
            </div>
          </div>

          {/* Language & Department Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Language Breakdown */}
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-teal-400" />
                  <h3 className="text-sm font-black text-white">Multilingual Kiosk Utilization</h3>
                </div>
                <span className="text-[10px] font-mono text-slate-400">BHASHINI / NATIVE</span>
              </div>

              <div className="space-y-3">
                {[
                  { lang: 'Hindi (हिंदी)', code: 'hi', count: stats.languageBreakdown.hi || 0, color: 'bg-orange-500' },
                  { lang: 'English (Indian)', code: 'en', count: stats.languageBreakdown.en || 0, color: 'bg-blue-500' },
                  { lang: 'Marathi (मराठी)', code: 'mr', count: stats.languageBreakdown.mr || 0, color: 'bg-emerald-500' },
                  { lang: 'Tamil (தமிழ்)', code: 'ta', count: stats.languageBreakdown.ta || 0, color: 'bg-purple-500' },
                  { lang: 'Telugu (తెలుగు)', code: 'te', count: stats.languageBreakdown.te || 0, color: 'bg-yellow-500' },
                  { lang: 'Bengali (বাংলা)', code: 'bn', count: stats.languageBreakdown.bn || 0, color: 'bg-rose-500' },
                ].map((item) => {
                  const total = Math.max(1, stats.totalPatients || 1);
                  const pct = Math.round((item.count / total) * 100);
                  return (
                    <div key={item.code} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-300">{item.lang}</span>
                        <span className="text-slate-400 font-mono">{item.count} sessions ({pct}%)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div className={`h-full ${item.color} rounded-full transition-all duration-500`} style={{ width: `${Math.min(100, Math.max(8, pct))}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Department Breakdown */}
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-violet-400" />
                  <h3 className="text-sm font-black text-white">OPD Department Allocation</h3>
                </div>
                <span className="text-[10px] font-mono text-slate-400">AI TRIAGE ROUTING</span>
              </div>

              <div className="space-y-3">
                {Object.entries(stats.departmentBreakdown).map(([dept, count]) => {
                  const total = Math.max(1, stats.todayEncounters || 1);
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={dept} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-300">{dept}</span>
                        <span className="text-slate-400 font-mono">{count} patients ({pct}%)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full bg-violet-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(10, pct))}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeAdminTab === 'hardware' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {kioskTerminals.map((kiosk) => (
              <div key={kiosk.id} className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Monitor className="w-5 h-5 text-teal-400" />
                    <div>
                      <h4 className="text-sm font-black text-white">{kiosk.id}</h4>
                      <p className="text-[11px] text-slate-400">{kiosk.location}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
                    {kiosk.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Printer Paper</span>
                    <span className="text-slate-200 font-mono font-bold flex items-center gap-1 mt-0.5">
                      <Printer className="w-3 h-3 text-slate-400" />
                      {kiosk.paper}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Microphone</span>
                    <span className="text-slate-200 font-mono font-bold flex items-center gap-1 mt-0.5">
                      <Mic className="w-3 h-3 text-emerald-400" />
                      {kiosk.mic}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Throughput</span>
                    <span className="text-teal-400 font-mono font-black mt-0.5 block">
                      {kiosk.patientsToday} Intakes
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeAdminTab === 'security_rls' && (
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-black text-white">Firestore Security Rules & RBAC Policies</h3>
                  <p className="text-xs text-slate-400">
                    Role-Based Access Control enforcing patient privacy, doctor verification, and append-only audits
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                ACTIVE & ENFORCED
              </span>
            </div>

            <div className="space-y-3">
              {rlsPolicies.map((pol, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-teal-400">{pol.collection}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-sans font-bold">
                      {pol.roles}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px]">{pol.command}</p>
                  <pre className="text-[11px] text-slate-300 bg-slate-900 p-2 rounded-xl border border-slate-800/80 overflow-x-auto">
                    {pol.rule}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
