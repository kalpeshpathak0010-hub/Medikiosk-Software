import React, { useState } from 'react';
import { Stethoscope, ShieldAlert, Clock, User, FileText, CheckCircle2, AlertTriangle, Search, Filter, Sparkles, ChevronRight, Activity, ArrowUpRight } from 'lucide-react';
import { ClinicalSummary, Language, Patient, RedFlagAlert } from '../../types';
import { DEMO_PATIENTS, DEMO_SUMMARIES, DEMO_RED_FLAGS } from '../../data/demoPatients';
import { useAuth } from '../../context/AuthContext';

interface DoctorDashboardProps {
  patients: Patient[];
  summaries: Record<string, ClinicalSummary>;
  redFlags: RedFlagAlert[];
  onSelectPatient: (patientId: string) => void;
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
  const [filterPriority, setFilterPriority] = useState<'all' | 'urgent' | 'high' | 'normal'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');

  // Compute stats
  const totalPatients = patients.length;
  const urgentCount = redFlags.length;
  const verifiedCount = (Object.values(summaries) as ClinicalSummary[]).filter((s) => s?.isPhysicianVerified || s?.status === 'PHYSICIAN_VERIFIED').length;
  const pendingCount = totalPatients - verifiedCount;

  // Filter patients
  const filteredPatients = patients.filter((pat) => {
    const summary = summaries[pat.id];
    const hasRedFlag = redFlags.find((rf) => rf.patientId === pat.id);

    if (filterPriority === 'urgent' && !hasRedFlag) return false;
    if (filterPriority === 'high' && (!hasRedFlag || hasRedFlag.priority !== 'HIGH')) return false;
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

  return (
    <div className="flex-1 text-slate-800 p-4 sm:p-6 max-w-7xl mx-auto w-full">
      {/* Top Welcome & Metrics Bar */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-100/80 border border-blue-200 flex items-center justify-center text-blue-700 shadow-xs">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-blue-950 tracking-tight flex items-center gap-2">
                Physician OPD Workspace
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 shadow-xs">
                  Live Queue
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                {currentUser.name || 'Dr. Physician (MD)'} {currentUser.registrationNumber ? `(Reg: ${currentUser.registrationNumber})` : ''} • {currentUser.department || 'Cardiology & Internal Medicine'} • AI Intake Stream
              </p>
            </div>
          </div>
        </div>

        {/* Quick KPI stats */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3 text-center">
          <div className="bg-white/80 backdrop-blur-md border border-white/80 p-3 rounded-2xl shadow-xs">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-black block">Queue</span>
            <span className="text-xl font-black text-slate-900">{totalPatients}</span>
          </div>

          <div className="bg-rose-50/90 border border-rose-200 p-3 rounded-2xl shadow-xs">
            <span className="text-[11px] uppercase tracking-wider text-rose-700 font-black block">Triage</span>
            <span className="text-xl font-black text-rose-600 animate-pulse">{urgentCount}</span>
          </div>

          <div className="bg-amber-50/90 border border-amber-200 p-3 rounded-2xl shadow-xs">
            <span className="text-[11px] uppercase tracking-wider text-amber-700 font-black block">Pending</span>
            <span className="text-xl font-black text-amber-600">{pendingCount}</span>
          </div>

          <div className="bg-emerald-50/90 border border-emerald-200 p-3 rounded-2xl shadow-xs">
            <span className="text-[11px] uppercase tracking-wider text-emerald-700 font-black block">Verified</span>
            <span className="text-xl font-black text-emerald-600">{verifiedCount}</span>
          </div>
        </div>
      </div>

      {/* Urgent Red Flag Alert Banner */}
      {redFlags.length > 0 && (
        <div className="mb-6 p-5 rounded-[28px] bg-rose-50/90 border-2 border-rose-400 text-rose-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-rose-500/10 backdrop-blur-md">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-rose-600 flex items-center justify-center shrink-0 shadow-md">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-600 text-white">
                  URGENT RED-FLAG DETECTED
                </span>
                <span className="text-xs font-mono font-bold text-rose-800">
                  {redFlags[0].patientId === 'pat-001' ? 'Rajesh Sharma • Token A-127' : 'Urgent Patient'}
                </span>
              </div>
              <p className="text-sm font-black text-rose-950 mt-1">
                {redFlags[0].message?.en || redFlags[0].description || 'Clinical red-flag indicator detected.'}
              </p>
              <p className="text-xs text-rose-800 font-semibold mt-0.5">
                Suggested Action: {redFlags[0].suggestedAction?.en || 'Immediate physician evaluation and vital signs stabilization.'}
              </p>
            </div>
          </div>

          <button
            id="btn-triage-inspect"
            onClick={() => onSelectPatient(redFlags[0].patientId)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs tracking-wider uppercase shadow-md flex items-center justify-center gap-1.5 transition active:scale-95 shrink-0 cursor-pointer"
          >
            <span>Open Clinical Intake</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Queue Filters and Search */}
      <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white/80 backdrop-blur-md p-3.5 rounded-2xl border-2 border-white/80 shadow-xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Patient Name, ABHA ID, or Chief Complaint..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/90 border border-slate-200 text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-inner"
          />
        </div>

        {/* Priority Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold">
          <span className="text-slate-500 text-[11px] mr-1 hidden md:inline font-black uppercase">Priority:</span>
          {(['all', 'urgent', 'normal'] as const).map((pri) => (
            <button
              key={pri}
              onClick={() => setFilterPriority(pri)}
              className={`px-3.5 py-1.5 rounded-xl transition uppercase tracking-wider text-[11px] font-black cursor-pointer ${
                filterPriority === pri
                  ? pri === 'urgent'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white/80 text-slate-600 hover:text-slate-900 border border-slate-200/60'
              }`}
            >
              {pri}
            </button>
          ))}
        </div>
      </div>

      {/* Patients Queue List */}
      <div className="grid grid-cols-1 gap-3.5">
        {filteredPatients.map((patient) => {
          const summary = summaries[patient.id];
          const redFlag = redFlags.find((rf) => rf.patientId === patient.id);
          const isSelected = selectedPatientId === patient.id;

          return (
            <div
              key={patient.id}
              onClick={() => onSelectPatient(patient.id)}
              className={`p-5 rounded-3xl border-2 transition-all cursor-pointer group active:scale-[0.99] backdrop-blur-md ${
                isSelected
                  ? 'bg-blue-50/90 border-blue-500 ring-2 ring-blue-400/50 shadow-xl'
                  : redFlag
                  ? 'bg-rose-50/80 border-rose-300 hover:border-rose-500 hover:bg-rose-50 shadow-xs'
                  : 'bg-white/80 border-white/80 hover:border-blue-300 hover:bg-white shadow-xs'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left: Token, Name, Vitals & Badges */}
                <div className="flex items-start gap-4">
                  {/* Token Number Box */}
                  <div
                    className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-mono font-black shrink-0 ${
                      redFlag
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                        : 'bg-blue-950 text-teal-300 shadow-xs'
                    }`}
                  >
                    <span className="text-[10px] uppercase tracking-tighter opacity-80">TOKEN</span>
                    <span className="text-lg leading-tight">{summary?.tokenNumber || 'A-100'}</span>
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition">
                        {patient.name}
                      </h3>
                      <span className="text-xs text-slate-500 font-semibold">
                        ({patient.age} yrs • {patient.gender})
                      </span>

                      {/* Status Badges */}
                      {redFlag && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200 animate-pulse">
                          🚨 TRIAGE RED-FLAG
                        </span>
                      )}

                      {summary?.mode === 'ayush' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                          🌿 AYUSH INTAKE
                        </span>
                      )}

                      {summary?.isPhysicianVerified ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Verified
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200">
                          AI Draft (Unverified)
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 font-mono flex items-center gap-2 font-medium">
                      <span>ABHA: <strong className="text-slate-700">{patient.abhaId || patient.phone}</strong></span>
                      <span>•</span>
                      <span>Blood: <strong className="text-slate-700">{patient.bloodGroup || 'B+'}</strong></span>
                      <span>•</span>
                      <span>Intake: {summary?.intakeTimestamp || 'Just now'}</span>
                    </p>

                    {/* Chief Complaint snippet */}
                    <div className="mt-2 text-xs text-slate-700 flex items-center gap-2 font-medium">
                      <span className="font-black text-blue-900">Chief Complaint:</span>
                      <span>{summary?.chiefComplaint || 'General consultation'}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Quick Extracted Data & Action */}
                <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-200/80">
                  {/* Scanned Docs Indicator */}
                  {summary && summary.sourceDocumentIds.length > 0 && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 border border-slate-200 text-xs text-slate-700 font-bold shadow-xs">
                      <FileText className="w-3.5 h-3.5 text-teal-600" />
                      <span>{summary.sourceDocumentIds.length} OCR Records</span>
                    </div>
                  )}

                  {/* Open Clinical Workspace Button */}
                  <button
                    id={`btn-open-patient-${patient.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectPatient(patient.id);
                    }}
                    className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs flex items-center gap-1.5 shadow-md transition group-hover:translate-x-0.5 cursor-pointer"
                  >
                    <span>Open Clinical Workspace</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
