import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  ShieldAlert,
  Clock,
  User,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  Sparkles,
  ChevronRight,
  Activity,
  ArrowUpRight,
  Radio,
  UserCheck,
  Building,
} from 'lucide-react';
import { ClinicalSummary, Language, Patient, RedFlagAlert } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { subscribeToClinicalSessions, ClinicalSessionRecord } from '../../services/dbService';

interface DoctorDashboardProps {
  patients: Patient[];
  summaries: Record<string, ClinicalSummary>;
  redFlags: RedFlagAlert[];
  onSelectPatient: (patientId: string, sessionId?: string) => void;
  selectedPatientId?: string;
}

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({
  patients,
  summaries,
  redFlags,
  onSelectPatient,
  selectedPatientId,
}) => {
  const { currentUser } = useAuth();
  const [filterPriority, setFilterPriority] = useState<'all' | 'urgent' | 'normal'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [liveSessions, setLiveSessions] = useState<ClinicalSessionRecord[]>([]);

  // Subscribe to real-time clinicalSessions from Firestore (Multi-device link)
  useEffect(() => {
    const unsub = subscribeToClinicalSessions((sessions) => {
      setLiveSessions(sessions);
    });
    return () => unsub();
  }, []);

  // Compute stats
  const totalPatients = patients.length + liveSessions.length;
  const urgentCount =
    redFlags.length + liveSessions.filter((s) => s.hasRedFlag || s.redFlagStatus === 'urgent').length;
  const verifiedCount =
    (Object.values(summaries) as ClinicalSummary[]).filter(
      (s) => s?.isPhysicianVerified || s?.status === 'PHYSICIAN_VERIFIED'
    ).length + liveSessions.filter((s) => s.status === 'verified' || s.status === 'signed_off').length;
  const pendingCount = Math.max(0, totalPatients - verifiedCount);

  // Filter patients
  const filteredPatients = patients.filter((pat) => {
    const summary = summaries[pat.id];
    const hasRedFlag = redFlags.find((rf) => rf.patientId === pat.id);

    if (filterPriority === 'urgent' && !hasRedFlag) return false;
    if (filterPriority === 'normal' && hasRedFlag) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = pat.name.toLowerCase().includes(q);
      const matchAbha = (pat.abhaId || '').toLowerCase().includes(q);
      const matchComplaint = (summary?.chiefComplaint || '').toLowerCase().includes(q);
      if (!matchName && !matchAbha && !matchComplaint) return false;
    }

    return true;
  });

  const filteredSessions = liveSessions.filter((sess) => {
    if (filterPriority === 'urgent' && !sess.hasRedFlag && sess.redFlagStatus === 'none') return false;
    if (filterPriority === 'normal' && (sess.hasRedFlag || sess.redFlagStatus !== 'none')) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (sess.patientName || '').toLowerCase().includes(q);
      const matchSession = (sess.sessionId || '').toLowerCase().includes(q);
      const matchComplaint = (sess.chiefComplaint || '').toLowerCase().includes(q);
      if (!matchName && !matchSession && !matchComplaint) return false;
    }

    return true;
  });

  const totalFilteredCount = filteredPatients.length + filteredSessions.length;

  return (
    <div className="flex-1 text-slate-800 p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6">
      {/* Top Welcome & Metrics Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#1e3a8a] text-white flex items-center justify-center font-bold shadow-xs">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                Physician OPD Workspace
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-200">
                  Live Queue
                </span>
              </h1>
              <p className="text-xs text-slate-600 font-medium">
                {currentUser.name || 'Duty Medical Officer'} {currentUser.registrationNumber ? `(Reg: ${currentUser.registrationNumber})` : ''} • {currentUser.department || 'General Medicine'} • {currentUser.hospitalName || 'Central OPD'}
              </p>
            </div>
          </div>
        </div>

        {/* Quick KPI stats */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3 text-center">
          <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold block">Total</span>
            <span className="text-lg font-black text-slate-900">{totalPatients}</span>
          </div>

          <div className="bg-rose-50 border border-rose-200 p-2.5 rounded-lg">
            <span className="text-[11px] uppercase tracking-wider text-rose-700 font-bold block">Triage</span>
            <span className="text-lg font-black text-rose-700">{urgentCount}</span>
          </div>

          <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-lg">
            <span className="text-[11px] uppercase tracking-wider text-amber-800 font-bold block">Pending</span>
            <span className="text-lg font-black text-amber-700">{pendingCount}</span>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg">
            <span className="text-[11px] uppercase tracking-wider text-emerald-800 font-bold block">Verified</span>
            <span className="text-lg font-black text-emerald-700">{verifiedCount}</span>
          </div>
        </div>
      </div>

      {/* Urgent Red Flag Alert Banner */}
      {redFlags.length > 0 && (
        <div className="p-4 rounded-xl bg-rose-50 border-2 border-rose-400 text-rose-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-700 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-rose-700 text-white">
                  URGENT TRIAGE FLAG
                </span>
                <span className="text-xs font-mono font-bold text-rose-900">
                  Priority Action Required
                </span>
              </div>
              <p className="text-sm font-bold text-rose-950 mt-1">
                {redFlags[0].message?.en || redFlags[0].description || 'Clinical red-flag indicator detected.'}
              </p>
              <p className="text-xs text-rose-800 font-medium mt-0.5">
                Protocol: {redFlags[0].suggestedAction?.en || 'Immediate physician evaluation and vital signs stabilization.'}
              </p>
            </div>
          </div>

          <button
            id="btn-triage-inspect"
            onClick={() => onSelectPatient(redFlags[0].patientId)}
            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition active:scale-95 shrink-0 cursor-pointer"
          >
            <span>Open Clinical Intake</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Queue Filters and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Patient Name, ABHA ID, or Chief Complaint..."
            className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:border-[#1e3a8a]"
          />
        </div>

        {/* Priority Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold">
          <span className="text-slate-500 text-[11px] mr-1 hidden md:inline font-bold uppercase">Filter:</span>
          {(['all', 'urgent', 'normal'] as const).map((pri) => (
            <button
              key={pri}
              onClick={() => setFilterPriority(pri)}
              className={`px-3 py-1.5 rounded-lg transition uppercase tracking-wider text-[11px] font-bold cursor-pointer ${
                filterPriority === pri
                  ? pri === 'urgent'
                    ? 'bg-rose-700 text-white'
                    : 'bg-[#1e3a8a] text-white'
                  : 'bg-slate-100 text-slate-700 hover:text-slate-900'
              }`}
            >
              {pri === 'all' ? 'All Patients' : pri === 'urgent' ? 'Urgent Only' : 'Standard'}
            </button>
          ))}
        </div>
      </div>

      {/* Live OPD Queue Section Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
          <h2 className="text-sm font-bold tracking-wide text-slate-900 uppercase">
            Live OPD Queue
          </h2>
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
            {totalFilteredCount} in queue
          </span>
        </div>
        <span className="text-xs text-slate-500 font-medium hidden sm:inline">
          Real-time Firestore Sync • Terminal Station Linked
        </span>
      </div>

      {/* Real-time Kiosk Sessions List */}
      {filteredSessions.length > 0 && (
        <div className="space-y-3">
          {filteredSessions.map((session) => {
            const hasRedFlag = session.hasRedFlag || session.redFlagStatus !== 'none';
            const isCompleted = session.status === 'completed' || session.status === 'summary_ready';
            const isReady = session.summaryStatus === 'ready' || session.status === 'summary_ready' || session.status === 'completed';

            return (
              <div
                key={session.sessionId}
                id={`session-card-${session.sessionId}`}
                className={`p-4 rounded-xl border transition-all ${
                  hasRedFlag
                    ? 'bg-rose-50/80 border-rose-300'
                    : 'bg-white border-slate-200 hover:border-blue-400'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-xs text-blue-900 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                        {session.sessionId}
                      </span>
                      <h3 className="font-bold text-sm text-slate-900">
                        {session.patientName} ({session.patientAge} yrs • {session.patientGender})
                      </h3>
                      {session.tokenNumber && (
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-white">
                          Token: {session.tokenNumber}
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-700 flex flex-wrap items-center gap-2 pt-0.5">
                      <span>
                        <strong className="text-slate-900 font-semibold">Complaint:</strong>{' '}
                        {session.chiefComplaint || 'Clinical Intake Consultation'}
                      </span>
                      <span>•</span>
                      <span>
                        <strong className="text-slate-900 font-semibold">Status:</strong>{' '}
                        <span
                          className={`font-bold uppercase px-1.5 py-0.5 rounded text-[10px] ${
                            isCompleted
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {session.status.replace('_', ' ')}
                        </span>
                      </span>
                      {hasRedFlag && (
                        <>
                          <span>•</span>
                          <span className="font-bold uppercase px-1.5 py-0.5 rounded text-[10px] bg-rose-700 text-white">
                            Red Flag
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <button
                    id={`btn-open-session-${session.sessionId}`}
                    onClick={() => onSelectPatient(session.patientId, session.sessionId)}
                    className="w-full sm:w-auto px-4 py-2 rounded-lg bg-[#1e3a8a] hover:bg-[#1e40af] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shrink-0"
                  >
                    <span>Open Case</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Standard Patients Queue List */}
      {filteredPatients.length > 0 && (
        <div className="space-y-3">
          {filteredPatients.map((patient) => {
            const summary = summaries[patient.id];
            const redFlag = redFlags.find((rf) => rf.patientId === patient.id);
            const isSelected = selectedPatientId === patient.id;

            return (
              <div
                key={patient.id}
                onClick={() => onSelectPatient(patient.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50/70 border-blue-600 ring-1 ring-blue-500'
                    : redFlag
                    ? 'bg-rose-50/70 border-rose-300'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Token, Name, Vitals & Badges */}
                  <div className="flex items-start gap-3">
                    {/* Token Number Box */}
                    <div
                      className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center font-mono font-bold shrink-0 ${
                        redFlag
                          ? 'bg-rose-700 text-white'
                          : 'bg-[#1e3a8a] text-white'
                      }`}
                    >
                      <span className="text-[9px] uppercase tracking-tighter opacity-80">TOKEN</span>
                      <span className="text-base leading-tight">{summary?.tokenNumber || 'A-100'}</span>
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="text-base font-bold text-slate-900">
                          {patient.name}
                        </h3>
                        <span className="text-xs text-slate-500">
                          ({patient.age} yrs • {patient.gender})
                        </span>

                        {/* Status Badges */}
                        {redFlag && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            TRIAGE FLAG
                          </span>
                        )}

                        {summary?.mode === 'ayush' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            AYUSH
                          </span>
                        )}

                        {summary?.isPhysicianVerified ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                            Verified
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            Unverified AI Summary
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-500 font-mono flex items-center gap-2">
                        <span>ABHA: <strong className="text-slate-700">{patient.abhaId || patient.phone || 'Walk-in'}</strong></span>
                        <span>•</span>
                        <span>Intake: {summary?.intakeTimestamp || 'Recent'}</span>
                      </p>

                      <div className="mt-1 text-xs text-slate-700 flex items-center gap-2">
                        <span className="font-bold text-slate-900">Chief Complaint:</span>
                        <span>{summary?.chiefComplaint || 'General consultation'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Quick Extracted Data & Action */}
                  <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    {summary && summary.sourceDocumentIds.length > 0 && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-xs text-slate-700 font-medium">
                        <FileText className="w-3.5 h-3.5 text-blue-700" />
                        <span>{summary.sourceDocumentIds.length} OCR Records</span>
                      </div>
                    )}

                    <button
                      id={`btn-open-patient-${patient.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectPatient(patient.id);
                      }}
                      className="px-4 py-2 rounded-lg bg-[#1e3a8a] hover:bg-[#1e40af] text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <span>Open Workspace</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Institutional Empty State: When No Patients in Queue */}
      {totalFilteredCount === 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-600">
          <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-800">
            No patients currently waiting in the OPD queue.
          </p>
          <p className="text-slate-500 mt-1 max-w-md mx-auto">
            New patient intakes completed at the kiosk terminal will automatically appear here in real time.
          </p>
        </div>
      )}
    </div>
  );
};
