import React from 'react';
import { Stethoscope, Leaf, ArrowRight, ArrowLeft, ShieldAlert } from 'lucide-react';
import { IntakeMode, Language } from '../../types';
import { translations } from '../../locales/translations';

interface KioskModeSelectProps {
  language: Language;
  onSelectMode: (mode: IntakeMode) => void;
  onBack: () => void;
  textSize: 'normal' | 'large' | 'extraLarge';
  highContrast: boolean;
}

export const KioskModeSelect: React.FC<KioskModeSelectProps> = ({
  language,
  onSelectMode,
  onBack,
  highContrast,
}) => {
  const t = translations[language];

  return (
    <div className="flex-1 flex flex-col justify-center p-4 sm:p-6 max-w-4xl mx-auto w-full">
      <div
        className={`w-full rounded-[36px] p-6 sm:p-10 shadow-2xl transition-all ${
          highContrast
            ? 'bg-black border-4 border-yellow-400 text-white'
            : 'bg-white/80 backdrop-blur-xl border-2 border-white/60 text-slate-900 shadow-2xl ring-1 ring-slate-900/5'
        }`}
      >
        {/* Step Indicator & Header */}
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-200/80">
          <div>
            <span className="text-xs uppercase tracking-widest text-blue-600 font-black">Step 3 of 6</span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-blue-950">{t.modeTitle}</h2>
            <p className="text-slate-600 text-sm mt-1 font-medium">{t.modeSubtitle}</p>
          </div>
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/80 hover:bg-white text-slate-700 text-sm font-bold border border-white/80 shadow-xs transition active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.back}</span>
          </button>
        </div>

        {/* 2 Big Mode Selection Cards - Frosted Glass Panels */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          {/* Modern Medicine */}
          <button
            id="btn-mode-modern"
            onClick={() => onSelectMode('modern')}
            className="p-8 rounded-[30px] bg-white/70 hover:bg-white border-2 border-white/80 hover:border-blue-400 text-left transition-all group active:scale-95 shadow-lg hover:shadow-2xl cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-16 h-16 rounded-2xl bg-blue-100 border border-blue-200 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-xs">
                <Stethoscope className="w-9 h-9 text-blue-600" />
              </div>
              <h3 className="text-2xl font-black text-blue-950 mb-2 group-hover:text-blue-600">{t.modeModern}</h3>
              <p className="text-sm text-slate-600 font-medium leading-relaxed mb-6">{t.modeModernDesc}</p>
            </div>
            <div className="flex items-center gap-2 text-blue-600 font-bold text-sm">
              <span>Select Allopathic Intake</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* AYUSH / Ayurveda */}
          <button
            id="btn-mode-ayush"
            onClick={() => onSelectMode('ayush')}
            className="p-8 rounded-[30px] bg-white/70 hover:bg-white border-2 border-white/80 hover:border-emerald-400 text-left transition-all group active:scale-95 shadow-lg hover:shadow-2xl cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-xs">
                <Leaf className="w-9 h-9 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-black text-blue-950 mb-2 group-hover:text-emerald-700">{t.modeAyush}</h3>
              <p className="text-sm text-slate-600 font-medium leading-relaxed mb-6">{t.modeAyushDesc}</p>
            </div>
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
              <span>Select Ayurvedic Intake</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex items-center gap-3 text-xs text-slate-600 font-medium shadow-xs">
          <ShieldAlert className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            Note: MediKiosk organizes clinical history for the respective physician and does not independently recommend medication.
          </span>
        </div>
      </div>
    </div>
  );
};
