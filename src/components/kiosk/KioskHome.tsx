import React from 'react';
import { PlayCircle, Clock, ShieldCheck, HeartPulse, Stethoscope, ArrowRight, QrCode } from 'lucide-react';
import { Language } from '../../types';
import { translations } from '../../locales/translations';

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

  const getTextClass = () => {
    if (textSize === 'large') return 'text-lg sm:text-xl';
    if (textSize === 'extraLarge') return 'text-xl sm:text-2xl';
    return 'text-base sm:text-lg';
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 max-w-4xl mx-auto w-full my-auto">
      {/* Hospital Intake Card */}
      <div
        className={`w-full rounded-3xl p-6 sm:p-12 text-center transition-all ${
          highContrast
            ? 'bg-black border-4 border-yellow-400 text-white'
            : 'bg-white border border-slate-200/90 text-slate-900 shadow-xl shadow-slate-200/50'
        }`}
      >
        {/* Contextual Label */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/70 text-blue-800 text-xs font-bold tracking-wider uppercase mb-6">
          <span className="w-2 h-2 rounded-full bg-blue-600" />
          <span>{t.homeContextLabel || 'SELF-SERVICE OPD INTAKE'}</span>
        </div>

        {/* Main Heading */}
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-blue-950 mb-4 leading-tight max-w-2xl mx-auto">
          {t.homeMainHeading ? (
            t.homeMainHeading.split('\n').map((line, i) => (
              <React.Fragment key={i}>
                {line}
                {i === 0 && <br />}
              </React.Fragment>
            ))
          ) : (
            <>
              Before you see the doctor,
              <br />
              tell us about your health.
            </>
          )}
        </h1>

        {/* Supporting Clinical Explainer */}
        <p className={`text-slate-600 font-normal max-w-xl mx-auto mb-10 leading-relaxed ${getTextClass()}`}>
          {t.homeSupportingText ||
            'Share your symptoms, medical history and previous reports. MediKiosk prepares a structured summary for your doctor.'}
        </p>

        {/* Primary and Secondary Intake Actions */}
        <div className="flex flex-col sm:flex-row items-stretch justify-center gap-4 max-w-xl mx-auto mb-10">
          {/* Primary CTA: Start Patient Intake */}
          <button
            id="btn-start-patient-intake"
            onClick={onStartNewVisit}
            className="flex-1 group py-5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-extrabold text-lg sm:text-xl shadow-lg shadow-blue-600/20 border border-blue-500 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-3"
          >
            <PlayCircle className="w-6 h-6 text-white shrink-0 group-hover:scale-110 transition-transform" />
            <div className="text-left">
              <div className="leading-tight">{t.startPatientIntake || 'Start Patient Intake'}</div>
              {language !== 'en' && (
                <div className="text-xs text-blue-200 font-normal font-sans">
                  Start Patient Intake
                </div>
              )}
            </div>
            <ArrowRight className="w-5 h-5 ml-auto text-blue-200 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Secondary CTA: Continue Existing Session */}
          <button
            id="btn-continue-existing-session"
            onClick={onContinueExistingVisit}
            className="py-5 px-6 rounded-2xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-800 font-bold text-base sm:text-lg border border-slate-200 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-3"
          >
            <QrCode className="w-5 h-5 text-slate-600 shrink-0" />
            <div className="text-left">
              <div className="leading-tight">{t.continueExistingSession || 'Continue Existing Session'}</div>
              <div className="text-xs text-slate-500 font-normal">
                {t.scanTokenOrAbha || 'Scan Token QR or ABHA ID'}
              </div>
            </div>
          </button>
        </div>

        {/* Calm Trust Badges (Compact Hospital Notice) */}
        <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs font-medium text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>ABDM Integrated</span>
          </div>
          <span className="text-slate-300 hidden sm:inline">•</span>
          <div className="flex items-center gap-1.5">
            <Stethoscope className="w-4 h-4 text-blue-600" />
            <span>Physician Supervised Intake</span>
          </div>
          <span className="text-slate-300 hidden sm:inline">•</span>
          <div className="flex items-center gap-1.5">
            <HeartPulse className="w-4 h-4 text-rose-600" />
            <span>Automated Triage Flagging</span>
          </div>
        </div>
      </div>
    </div>
  );
};

