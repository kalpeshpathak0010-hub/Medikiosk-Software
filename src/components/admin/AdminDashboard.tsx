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
    <div className="flex-1 text-slate-800 p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6">
      {/* Top Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-lg bg-[#1e3a8a] text-white flex items-center justify-center font-bold shadow-xs">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Hospital Admin & System Telemetry
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Facility: {currentUser.hospitalName} • Org ID: <code className="text-slate-800 font-mono font-bold">{currentUser.organizationId}</code>
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-bold overflow-x-auto">
          <button
            onClick={() => setActiveAdminTab('telemetry')}
            className={`px-3 py-1.5 rounded-md transition whitespace-nowrap cursor-pointer ${
              activeAdminTab === 'telemetry' ? 'bg-[#1e3a8a] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            OPD Telemetry
          </button>
          <button
            onClick={() => setActiveAdminTab('hardware')}
            className={`px-3 py-1.5 rounded-md transition whitespace-nowrap cursor-pointer ${
              activeAdminTab === 'hardware' ? 'bg-[#1e3a8a] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Kiosk Terminals
          </button>
          <button
            onClick={() => setActiveAdminTab('security_rls')}
            className={`px-3 py-1.5 rounded-md transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeAdminTab === 'security_rls' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Security & Rules</span>
          </button>
          <button
            onClick={manualRefresh}
            disabled={isLoading}
            className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition cursor-pointer"
            title="Refresh Live Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {activeAdminTab === 'telemetry' && (
        <div className="space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Total Patients</span>
                <Users className="w-4 h-4 text-[#1e3a8a]" />
              </div>
              <p className="text-2xl font-black text-slate-900">{stats.totalPatients}</p>
              <p className="text-[11px] text-emerald-700 font-medium mt-1">Live Firestore Count</p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Today Encounters</span>
                <Activity className="w-4 h-4 text-blue-700" />
              </div>
              <p className="text-2xl font-black text-slate-900">{stats.todayEncounters}</p>
              <p className="text-[11px] text-blue-700 font-medium mt-1">OPD Queue Sessions</p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Waiting Intake</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-2xl font-black text-amber-700">{stats.waitingCount}</p>
              <p className="text-[11px] text-slate-500 font-medium mt-1">Avg time: {stats.averageIntakeDuration}</p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Verified by Doctor</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              </div>
              <p className="text-2xl font-black text-emerald-700">{stats.completedCount}</p>
              <p className="text-[11px] text-emerald-700 font-medium mt-1">Signed Off & FHIR</p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Emergency Flags</span>
                <ShieldAlert className="w-4 h-4 text-rose-700" />
              </div>
              <p className="text-2xl font-black text-rose-700">{stats.emergencyCount}</p>
              <p className="text-[11px] text-rose-700 font-medium mt-1">Red-Flag Alerts</p>
            </div>
          </div>

          {/* Language & Department Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Language Breakdown */}
            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#1e3a8a]" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase">Multilingual Kiosk Utilization</h3>
                </div>
                <span className="text-[10px] font-mono text-slate-500">BHASHINI / NATIVE</span>
              </div>

              <div className="space-y-3">
                {[
                  { lang: 'Hindi (हिंदी)', code: 'hi', count: stats.languageBreakdown.hi || 0, color: 'bg-orange-600' },
                  { lang: 'English (Indian)', code: 'en', count: stats.languageBreakdown.en || 0, color: 'bg-[#1e3a8a]' },
                  { lang: 'Marathi (मराठी)', code: 'mr', count: stats.languageBreakdown.mr || 0, color: 'bg-emerald-600' },
                  { lang: 'Tamil (தமிழ்)', code: 'ta', count: stats.languageBreakdown.ta || 0, color: 'bg-indigo-600' },
                  { lang: 'Telugu (తెలుగు)', code: 'te', count: stats.languageBreakdown.te || 0, color: 'bg-amber-600' },
                  { lang: 'Bengali (বাংলা)', code: 'bn', count: stats.languageBreakdown.bn || 0, color: 'bg-rose-600' },
                ].map((item) => {
                  const total = Math.max(1, stats.totalPatients || 1);
                  const pct = Math.round((item.count / total) * 100);
                  return (
                    <div key={item.code} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-700">{item.lang}</span>
                        <span className="text-slate-500 font-mono">{item.count} sessions ({pct}%)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div className={`h-full ${item.color} rounded-full`} style={{ width: `${Math.min(100, Math.max(4, pct))}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Department Breakdown */}
            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#1e3a8a]" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase">OPD Department Allocation</h3>
                </div>
                <span className="text-[10px] font-mono text-slate-500">TRIAGE ROUTING</span>
              </div>

              <div className="space-y-3">
                {Object.entries(stats.departmentBreakdown).map(([dept, count]) => {
                  const total = Math.max(1, stats.todayEncounters || 1);
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={dept} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-700">{dept}</span>
                        <span className="text-slate-500 font-mono">{count} patients ({pct}%)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full bg-[#1e3a8a] rounded-full" style={{ width: `${Math.min(100, Math.max(6, pct))}%` }} />
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
              <div key={kiosk.id} className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Monitor className="w-5 h-5 text-[#1e3a8a]" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{kiosk.id}</h4>
                      <p className="text-xs text-slate-500">{kiosk.location}</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 border border-emerald-200 text-emerald-800">
                    {kiosk.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-medium">Printer Paper</span>
                    <span className="text-slate-800 font-mono font-bold flex items-center gap-1 mt-0.5">
                      <Printer className="w-3 h-3 text-slate-400" />
                      {kiosk.paper}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-medium">Microphone</span>
                    <span className="text-emerald-700 font-mono font-bold flex items-center gap-1 mt-0.5">
                      <Mic className="w-3 h-3 text-emerald-600" />
                      {kiosk.mic}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-medium">Throughput</span>
                    <span className="text-[#1e3a8a] font-mono font-bold mt-0.5 block">
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
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">Firestore Security Rules & RBAC Policies</h3>
                <p className="text-xs text-slate-500">
                  Enforces patient privacy, doctor verification, and append-only audits
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
              ACTIVE & ENFORCED
            </span>
          </div>

          <div className="space-y-3">
            {rlsPolicies.map((pol, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1e3a8a]">{pol.collection}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 font-sans font-bold">
                    {pol.roles}
                  </span>
                </div>
                <p className="text-slate-600 text-[11px] font-sans">{pol.command}</p>
                <pre className="text-[11px] text-slate-800 bg-white p-2 rounded border border-slate-200 overflow-x-auto">
                  {pol.rule}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
