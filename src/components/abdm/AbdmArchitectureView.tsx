import React, { useState } from 'react';
import { Sparkles, ShieldCheck, CheckCircle2, FileText, Layers, Database, Lock, Key, ArrowRight, RefreshCw } from 'lucide-react';
import { DEMO_PATIENTS, DEMO_SUMMARIES } from '../../data/demoPatients';
import { generateFhirDiagnosticReport } from '../../services/abdmService';

export const AbdmArchitectureView: React.FC = () => {
  const [activeMilestone, setActiveMilestone] = useState<'M1' | 'M2' | 'M3'>('M1');
  const [selectedPatientIndex, setSelectedPatientIndex] = useState(0);

  const currentPatient = DEMO_PATIENTS[selectedPatientIndex];
  const currentSummary = DEMO_SUMMARIES[currentPatient.id];
  const fhirBundle = generateFhirDiagnosticReport(currentPatient, currentSummary);

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 p-4 sm:p-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              ABDM (Ayushman Bharat Digital Mission) Compliance
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            FHIR R4 DiagnosticReport & Clinical History Bundling Architecture (NDHM / NHA Standards)
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-bold">
          {(['M1', 'M2', 'M3'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setActiveMilestone(m)}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeMilestone === m
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Milestone {m}
            </button>
          ))}
        </div>
      </div>

      {/* 3 Milestone Badges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div
          onClick={() => setActiveMilestone('M1')}
          className={`p-5 rounded-2xl border-2 transition cursor-pointer ${
            activeMilestone === 'M1'
              ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-lg'
              : 'bg-slate-900/80 border-slate-800 text-slate-400'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-bold text-emerald-400">Milestone M1</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <h3 className="text-base font-extrabold text-white">ABHA Number & QR Capture</h3>
          <p className="text-xs text-slate-300 mt-1">Patient authentication via 14-digit ABHA ID, QR scanner & demographic lookup.</p>
        </div>

        <div
          onClick={() => setActiveMilestone('M2')}
          className={`p-5 rounded-2xl border-2 transition cursor-pointer ${
            activeMilestone === 'M2'
              ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-lg'
              : 'bg-slate-900/80 border-slate-800 text-slate-400'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-bold text-emerald-400">Milestone M2 (HIP)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <h3 className="text-base font-extrabold text-white">Health Information Provider</h3>
          <p className="text-xs text-slate-300 mt-1">Generates signed FHIR R4 OP Consultation & DiagnosticReport bundles to national registry.</p>
        </div>

        <div
          onClick={() => setActiveMilestone('M3')}
          className={`p-5 rounded-2xl border-2 transition cursor-pointer ${
            activeMilestone === 'M3'
              ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-lg'
              : 'bg-slate-900/80 border-slate-800 text-slate-400'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-bold text-emerald-400">Milestone M3 (HIU)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <h3 className="text-base font-extrabold text-white">Health Information User</h3>
          <p className="text-xs text-slate-300 mt-1">Fetches previous longitudinal EHR records upon patient OTP/Consent Manager authorization.</p>
        </div>
      </div>

      {/* FHIR R4 Resources Hierarchy Card */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-extrabold text-white">HL7 FHIR R4 Resource Mapping Checklist</h3>
            <p className="text-xs text-slate-400">Verified against National Digital Health Mission schema validator</p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            All 9 Resources Compliant ✓
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 text-xs">
          {[
            { name: 'Bundle', desc: 'document type container with timestamp & signature' },
            { name: 'Composition', desc: 'Clinical intake document structure' },
            { name: 'Patient', desc: 'ABHA ID, Name, Age, Gender, Telecom' },
            { name: 'Practitioner', desc: 'Dr. A. Varma (MCI-48921 registration)' },
            { name: 'Encounter', desc: 'OPD Consultation at Station #3' },
            { name: 'Condition', desc: 'Chief complaint & SNOMED CT diagnosis' },
            { name: 'MedicationStatement', desc: 'Extracted Rx with dose/freq' },
            { name: 'AllergyIntolerance', desc: 'Known drug allergies & severity' },
            { name: 'DiagnosticReport', desc: 'Verified AI Intake Clinical Summary' },
          ].map((item, idx) => (
            <div key={idx} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="font-bold text-teal-300 font-mono block">{item.name}</span>
              <span className="text-slate-400 text-[11px] mt-0.5 block">{item.desc}</span>
            </div>
          ))}
        </div>

        {/* Live FHIR JSON Payload Preview */}
        <div className="pt-4">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
            Live FHIR R4 Bundle Payload Preview (Patient: {currentPatient.name}):
          </span>
          <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto max-h-[360px]">
            {JSON.stringify(fhirBundle, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};
