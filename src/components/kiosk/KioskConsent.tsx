import React, { useState } from 'react';
import { Volume2, VolumeX, ShieldCheck, FileCheck, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { Language, Patient } from '../../types';
import { translations } from '../../locales/translations';
import { audioService } from '../../services/audioService';

interface KioskConsentProps {
  language: Language;
  patient: Patient;
  onAgree: () => void;
  onDisagree: () => void;
  onBack: () => void;
  textSize: 'normal' | 'large' | 'extraLarge';
  highContrast: boolean;
}

export const KioskConsent: React.FC<KioskConsentProps> = ({
  language,
  patient,
  onAgree,
  onDisagree,
  onBack,
  textSize,
  highContrast,
}) => {
  const t = translations[language];
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [hasAgreedCheck, setHasAgreedCheck] = useState(true);

  const handleToggleAudio = () => {
    if (isPlayingAudio) {
      audioService.stopSpeaking();
      setIsPlayingAudio(false);
    } else {
      setIsPlayingAudio(true);
      audioService.speak(t.consentAudioText, language, () => {
        setIsPlayingAudio(false);
      });
    }
  };

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
            <span className="text-xs uppercase tracking-widest text-blue-600 font-black">Step 2 of 6</span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-blue-950">{t.consentTitle}</h2>
            <p className="text-slate-600 text-sm mt-1 font-medium">{t.consentSubtitle}</p>
          </div>
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/80 hover:bg-white text-slate-700 text-sm font-bold border border-white/80 shadow-xs transition active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.back}</span>
          </button>
        </div>

        {/* Audio explainer prompt box for low-literacy users */}
        <div className="mb-6 p-4 rounded-2xl bg-amber-50/80 border-2 border-amber-200/80 flex items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800 shadow-xs">
              {isPlayingAudio ? (
                <div className="flex items-center gap-1">
                  <span className="w-1.5 bg-amber-600 animate-soundwave-1 rounded-full"></span>
                  <span className="w-1.5 bg-amber-600 animate-soundwave-2 rounded-full"></span>
                  <span className="w-1.5 bg-amber-600 animate-soundwave-3 rounded-full"></span>
                </div>
              ) : (
                <Volume2 className="w-6 h-6 text-amber-700" />
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-amber-950">
                {isPlayingAudio ? 'Audio explanation playing in your language...' : 'Listen to Audio Consent Explanation'}
              </p>
              <p className="text-xs text-amber-800 font-medium">Tap button for spoken instructions (ऑडियो सुनें)</p>
            </div>
          </div>

          <button
            id="btn-play-consent-audio"
            onClick={handleToggleAudio}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition shadow-xs cursor-pointer ${
              isPlayingAudio ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300' : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
            }`}
          >
            {isPlayingAudio ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span>{isPlayingAudio ? 'Stop Audio' : 'Play Voice Guide'}</span>
          </button>
        </div>

        {/* Main Consent Body Card - Frosted Sub-Panel */}
        <div className="bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-white/80 mb-6 space-y-4 shadow-sm">
          <div className="flex items-start gap-3">
            <FileCheck className="w-6 h-6 text-blue-600 shrink-0 mt-1" />
            <p className="text-base sm:text-lg text-slate-800 leading-relaxed font-semibold">
              {t.consentBody}
            </p>
          </div>

          <div className="pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 font-medium">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{t.privacyNotice}</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Doctor verification mandatory prior to medical advice.</span>
            </div>
          </div>
        </div>

        {/* Consent Checkbox Touch Target */}
        <button
          id="btn-toggle-consent-checkbox"
          type="button"
          onClick={() => setHasAgreedCheck(!hasAgreedCheck)}
          className={`w-full p-4 rounded-2xl border-2 flex items-center gap-3.5 mb-8 text-left transition cursor-pointer shadow-xs ${
            hasAgreedCheck
              ? 'bg-blue-50/90 border-blue-500 text-blue-950'
              : 'bg-white/80 border-slate-300 text-slate-600 hover:border-slate-400'
          }`}
        >
          <div
            className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center shrink-0 transition ${
              hasAgreedCheck ? 'bg-blue-600 border-blue-500 text-white' : 'border-slate-400 bg-white'
            }`}
          >
            {hasAgreedCheck && <span className="font-black text-sm">✓</span>}
          </div>
          <span className="text-sm sm:text-base font-bold">{t.consentCheckbox}</span>
        </button>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            id="btn-disagree-consent"
            onClick={onDisagree}
            className="p-4 sm:p-5 rounded-2xl bg-white/80 hover:bg-white text-slate-700 font-bold text-base sm:text-lg border border-white/80 shadow-xs transition active:scale-95 cursor-pointer"
          >
            {t.doNotAgree}
          </button>

          <button
            id="btn-agree-continue-consent"
            onClick={onAgree}
            disabled={!hasAgreedCheck}
            className="p-4 sm:p-5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-base sm:text-lg shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
          >
            <span>{t.agreeAndContinue}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
