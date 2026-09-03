import React, { useState, useEffect } from 'react';
import {
  PlayCircle,
  Clock,
  ShieldCheck,
  HeartPulse,
  Stethoscope,
  ArrowRight,
  QrCode,
  UserCheck,
  AlertCircle,
  FileCheck2,
  Building,
  CheckCircle2,
} from 'lucide-react';
import { Language } from '../../types';
import { translations } from '../../locales/translations';
import { subscribeToAvailableDoctors, DoctorAvailabilityRecord } from '../../services/dbService';

interface KioskHomeProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onStartNewVisit: () => void;
  onContinueExistingVisit: () => void;
  textSize: 'normal' | 'large' | 'extraLarge';
  highContrast: boolean;
}

export const KioskHome: React.FC<KioskHomeProps> = ({
  language,
  onLanguageChange,
  onStartNewVisit,
  onContinueExistingVisit,
  textSize,
  highContrast,
}) => {
  const t = translations[language];
  const [availableDoctors, setAvailableDoctors] = useState<DoctorAvailabilityRecord[]>([]);
  const [isDoctorsLoading, setIsDoctorsLoading] = useState<boolean>(true);

  useEffect(() => {
    setIsDoctorsLoading(true);
    const unsubscribe = subscribeToAvailableDoctors((doctors) => {
      setAvailableDoctors(doctors);
      setIsDoctorsLoading(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const getTextClass = () => {
    if (textSize === 'large') return 'text-lg sm:text-xl';
    if (textSize === 'extraLarge') return 'text-xl sm:text-2xl';
    return 'text-base sm:text-lg';
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 max-w-4xl mx-auto w-full my-auto space-y-6">
      {/* ========================================================================= */}
      {/* 1. PRIMARY INTAKE CARD */}
      {/* ========================================================================= */}
      <div
        className={`w-full rounded-2xl p-6 sm:p-10 text-center transition-all ${
          highContrast
            ? 'bg-black border-4 border-yellow-400 text-white'
            : 'bg-white border border-slate-200 text-slate-900 shadow-sm'
        }`}
      >
        {/* Institutional Category Strip */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold tracking-wider uppercase mb-5">
          <span className="w-2 h-2 rounded-full bg-[#1e3a8a]" />
          <span>{t.homeContextLabel || 'SELF-SERVICE OPD INTAKE'}</span>
        </div>

        {/* System Title & Purpose */}
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1e3a8a] mb-2 leading-tight">
          MEDIKIOSK
        </h1>
        <p className="text-sm sm:text-base font-bold text-slate-700 mb-3">
          AI-assisted Patient Clinical Intake
        </p>

        {/* Clear Subtitle Directive */}
        <p className={`text-slate-600 font-normal max-w-xl mx-auto mb-8 leading-relaxed ${getTextClass()}`}>
          {t.appSubheading || 'Complete your basic health information before meeting the doctor.'}
        </p>

        {/* Primary & Secondary Call to Actions */}
        <div className="flex flex-col sm:flex-row items-stretch justify-center gap-4 max-w-xl mx-auto mb-8">
          {/* Primary CTA: START PATIENT INTAKE */}
          <button
            id="btn-start-patient-intake"
            onClick={onStartNewVisit}
            className="flex-1 min-h-[56px] py-4 px-6 rounded-xl bg-[#1e3a8a] hover:bg-[#1e40af] active:bg-[#172554] text-white font-extrabold text-base sm:text-lg border border-[#1e3a8a] transition-all cursor-pointer flex items-center justify-center gap-3 shadow-sm"
          >
            <PlayCircle className="w-5 h-5 text-white shrink-0" />
            <div className="text-left">
              <div className="leading-tight uppercase tracking-wide">
                {t.startPatientIntake || 'START PATIENT INTAKE'}
              </div>
              {language !== 'en' && (
                <div className="text-[11px] text-blue-200 font-normal font-sans">
                  Start Patient Intake
                </div>
              )}
            </div>
            <ArrowRight className="w-4 h-4 ml-auto text-blue-200" />
          </button>

          {/* Secondary CTA: Continue Existing Session */}
          <button
            id="btn-continue-existing-session"
            onClick={onContinueExistingVisit}
            className="min-h-[56px] py-4 px-5 rounded-xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-800 font-bold text-sm sm:text-base border border-slate-300 transition-all cursor-pointer flex items-center justify-center gap-2.5 shadow-xs"
          >
            <QrCode className="w-5 h-5 text-slate-600 shrink-0" />
            <div className="text-left">
              <div className="leading-tight">
                {t.continueExistingSession || 'Continue Existing Session'}
              </div>
              <div className="text-[11px] text-slate-500 font-normal">
                {t.scanTokenOrAbha || 'Scan Token QR or ABHA ID'}
              </div>
            </div>
          </button>
        </div>

        {/* 3-Step Citizen Visual Guide */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200/90 text-left mb-6">
          <div className="flex items-start gap-2.5 p-2">
            <span className="w-6 h-6 rounded-full bg-[#1e3a8a] text-white text-xs font-bold flex items-center justify-center shrink-0">
              1
            </span>
            <div>
              <p className="text-xs font-bold text-slate-800">Identify Patient</p>
              <p className="text-[11px] text-slate-500">Scan ABHA QR, enter phone, or walk-in registration</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2">
            <span className="w-6 h-6 rounded-full bg-[#1e3a8a] text-white text-xs font-bold flex items-center justify-center shrink-0">
              2
            </span>
            <div>
              <p className="text-xs font-bold text-slate-800">Answer Questions</p>
              <p className="text-[11px] text-slate-500">Share symptoms & previous medical documents (Voice or Touch)</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2">
            <span className="w-6 h-6 rounded-full bg-[#1e3a8a] text-white text-xs font-bold flex items-center justify-center shrink-0">
              3
            </span>
            <div>
              <p className="text-xs font-bold text-slate-800">Receive OPD Token</p>
              <p className="text-[11px] text-slate-500">Structured clinical history is instantly queued for your doctor</p>
            </div>
          </div>
        </div>

        {/* Institutional Trust Notices */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>ABDM Integrated</span>
          </div>
          <span className="text-slate-300 hidden sm:inline">•</span>
          <div className="flex items-center gap-1.5">
            <Stethoscope className="w-4 h-4 text-[#1e3a8a]" />
            <span>Physician Supervised Intake</span>
          </div>
          <span className="text-slate-300 hidden sm:inline">•</span>
          <div className="flex items-center gap-1.5">
            <HeartPulse className="w-4 h-4 text-rose-700" />
            <span>Automated Triage Flagging</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. REAL-TIME DOCTOR AVAILABILITY DIRECTORY (REAL FIRESTORE DATA ONLY) */}
      {/* ========================================================================= */}
      <div
        className={`w-full rounded-xl p-5 sm:p-6 transition-all border ${
          highContrast
            ? 'bg-black border-yellow-400 text-white'
            : 'bg-white border-slate-200 text-slate-900 shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[#1e3a8a]" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              OPD Duty Physicians (Live Status)
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            Real-time Roster
          </span>
        </div>

        {isDoctorsLoading ? (
          <div className="py-6 text-center text-xs text-slate-500">
            Checking doctor availability in Firestore...
          </div>
        ) : availableDoctors.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {availableDoctors.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/70"
              >
                <div>
                  <p className="text-xs font-bold text-slate-900">{doc.name}</p>
                  <p className="text-[11px] text-slate-500">
                    {doc.specialization || doc.department || 'General OPD'}
                    {doc.roomNumber ? ` • ${doc.roomNumber}` : ''}
                  </p>
                </div>
                <div className="shrink-0">
                  {doc.availabilityStatus === 'AVAILABLE' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      Available
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                      With Patient
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Institutional Empty State: No Fake Doctors! */
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-center text-xs text-slate-600">
            <p className="font-semibold text-slate-800">
              No OPD physicians are currently logged in.
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Walk-in clinical intake queue remains operational. Completed intakes will be prioritized when doctors open consultation.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
