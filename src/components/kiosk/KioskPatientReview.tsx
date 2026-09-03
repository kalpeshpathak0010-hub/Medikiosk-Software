import React, { useState } from 'react';
import { CheckCircle2, Edit3, ArrowRight, ArrowLeft, ShieldAlert, Sparkles, User, FileText, Stethoscope } from 'lucide-react';
import { ClinicalSummary, Language, Patient } from '../../types';
import { translations } from '../../locales/translations';

interface KioskPatientReviewProps {
  language: Language;
  patient: Patient;
  summary: ClinicalSummary;
  onEditSection: (sectionKey: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  highContrast: boolean;
}

export const KioskPatientReview: React.FC<KioskPatientReviewProps> = ({
  language,
  patient,
  summary,
  onEditSection,
  onSubmit,
  onBack,
  highContrast,
}) => {
  const t = translations[language];

  return (
    <div className="flex-1 flex flex-col justify-center p-4 sm:p-6 max-w-4xl mx-auto w-full">
      <div
        className={`w-full rounded-[36px] p-6 sm:p-8 shadow-2xl transition-all ${
          highContrast
            ? 'bg-black border-4 border-yellow-400 text-white'
            : 'bg-white/80 backdrop-blur-xl border-2 border-white/60 text-slate-900 shadow-2xl ring-1 ring-slate-900/5'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200/80">
          <div>
            <span className="text-xs uppercase tracking-widest text-blue-600 font-black">Step 6 of 6</span>
            <h2 className="text-2xl sm:text-4xl font-black text-blue-950">{t.reviewTitle}</h2>
            <p className="text-slate-600 text-sm mt-1 font-medium">{t.reviewSubtitle}</p>
          </div>

          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/80 hover:bg-white text-slate-700 text-sm font-bold border border-white/80 shadow-xs transition active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.back}</span>
          </button>
        </div>

        {/* AI Draft Disclaimer Banner */}
        <div className="mb-6 p-4 rounded-2xl bg-amber-500/15 border-2 border-amber-500/40 text-amber-950 text-xs sm:text-sm font-black flex items-center gap-3 shadow-xs">
          <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0" />
          <span>
            AI-GENERATED DRAFT — THIS SUMMARY WILL BE REVIEWED & VERIFIED BY YOUR CONSULTING PHYSICIAN.
          </span>
        </div>

        {/* Review Cards Grid - Frosted glass cards */}
        <div className="space-y-4 mb-8">
          {/* Patient Details */}
          <div className="p-5 rounded-2xl bg-white/70 backdrop-blur-md border border-white/80 flex items-center justify-between shadow-sm">
            <div>
              <span className="text-xs font-black text-slate-500 uppercase tracking-wider block">Patient Information</span>
              <h3 className="text-lg font-black text-blue-950 mt-1">
                {patient.name}, {patient.age} yrs ({patient.gender})
              </h3>
              <p className="text-xs text-blue-600 font-mono font-bold">{patient.abhaId || patient.phone}</p>
            </div>
            <button
              onClick={() => onEditSection('patient')}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1 transition border border-slate-200 shadow-xs cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-blue-600" />
              <span>{t.edit}</span>
            </button>
          </div>

          {/* Chief Complaint */}
          <div className="p-5 rounded-2xl bg-white/70 backdrop-blur-md border border-white/80 flex items-start justify-between gap-3 shadow-sm">
            <div>
              <span className="text-xs font-black text-slate-500 uppercase tracking-wider block">Chief Complaint (मुख्य समस्या)</span>
              <p className="text-base font-black text-blue-900 mt-1">{summary.chiefComplaint}</p>
              <p className="text-xs text-slate-700 mt-1.5 leading-relaxed font-medium">{summary.historyOfPresentIllness}</p>
            </div>
            <button
              onClick={() => onEditSection('complaint')}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1 transition shrink-0 border border-slate-200 shadow-xs cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-blue-600" />
              <span>{t.edit}</span>
            </button>
          </div>

          {/* Current Medications & Allergies */}
          <div className="p-5 rounded-2xl bg-white/70 backdrop-blur-md border border-white/80 flex items-start justify-between gap-3 shadow-sm">
            <div className="w-full">
              <span className="text-xs font-black text-slate-500 uppercase tracking-wider block">Current Medications & Allergies</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {summary.currentMedications.map((m, idx) => (
                  <span key={idx} className="px-3 py-1 rounded-xl bg-blue-50 border border-blue-200 text-xs font-bold text-blue-950 shadow-2xs">
                    {m.name} {m.dose} ({m.frequency})
                  </span>
                ))}
              </div>
              <p className="text-xs text-slate-600 mt-2 font-medium">
                <strong className="font-bold text-slate-800">Allergies:</strong> {summary.drugAllergies.join(', ') || 'No known allergies reported'}
              </p>
            </div>
            <button
              onClick={() => onEditSection('medications')}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1 transition shrink-0 border border-slate-200 shadow-xs cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-blue-600" />
              <span>{t.edit}</span>
            </button>
          </div>

          {/* Past Conditions */}
          <div className="p-5 rounded-2xl bg-white/70 backdrop-blur-md border border-white/80 flex items-start justify-between gap-3 shadow-sm">
            <div>
              <span className="text-xs font-black text-slate-500 uppercase tracking-wider block">Past Medical History</span>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {summary.pastMedicalHistory.map((pmh, idx) => (
                  <span key={idx} className="px-3 py-1 rounded-xl bg-sky-50 border border-sky-200 text-sky-950 text-xs font-bold shadow-2xs">
                    {pmh}
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={() => onEditSection('history')}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1 transition shrink-0 border border-slate-200 shadow-xs cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-blue-600" />
              <span>{t.edit}</span>
            </button>
          </div>
        </div>

        {/* Big Submit Button */}
        <button
          id="btn-patient-submit-intake"
          onClick={onSubmit}
          className="w-full py-5 rounded-[24px] bg-blue-600 hover:bg-blue-700 text-white font-black text-xl sm:text-2xl shadow-2xl shadow-blue-600/30 flex items-center justify-center gap-3 transition transform active:scale-95 cursor-pointer"
        >
          <span>{t.submitToDoctor}</span>
          <ArrowRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
