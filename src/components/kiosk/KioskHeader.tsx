import React from 'react';
import { Volume2, VolumeX, Eye, HelpCircle, PhoneCall, Globe, ZoomIn, Lock } from 'lucide-react';
import { Language } from '../../types';
import { translations } from '../../locales/translations';
import { audioService } from '../../services/audioService';

interface KioskHeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  textSize: 'normal' | 'large' | 'extraLarge';
  onTextSizeChange: (size: 'normal' | 'large' | 'extraLarge') => void;
  highContrast: boolean;
  onToggleHighContrast: () => void;
  onOpenHelp: () => void;
  onCallStaff: () => void;
  onOpenStaffLogin?: () => void;
  audioPromptText?: string;
}

export const KioskHeader: React.FC<KioskHeaderProps> = ({
  language,
  onLanguageChange,
  textSize,
  onTextSizeChange,
  highContrast,
  onToggleHighContrast,
  onOpenHelp,
  onCallStaff,
  onOpenStaffLogin,
  audioPromptText,
}) => {
  const t = translations[language];
  const [isPlayingAudio, setIsPlayingAudio] = React.useState(false);

  const toggleAudioGuide = () => {
    if (isPlayingAudio) {
      audioService.stopSpeaking();
      setIsPlayingAudio(false);
    } else {
      const textToSpeak = audioPromptText || t.appSubheading;
      setIsPlayingAudio(true);
      audioService.speak(textToSpeak, language, () => {
        setIsPlayingAudio(false);
      });
    }
  };

  // Cycle text sizes: normal -> large -> extraLarge -> normal
  const cycleTextSize = () => {
    if (textSize === 'normal') onTextSizeChange('large');
    else if (textSize === 'large') onTextSizeChange('extraLarge');
    else onTextSizeChange('normal');
  };

  return (
    <div
      className={`w-full ${
        highContrast
          ? 'bg-black border-b-2 border-yellow-400'
          : 'bg-white/60 backdrop-blur-md border-b border-white/40 shadow-xs'
      } py-3 px-4 sm:px-6`}
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Kiosk Station Info */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white text-xl shadow-md shadow-blue-500/20">
              +
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black tracking-tight text-blue-950">{t.appName}</h1>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                  TOUCHSCREEN KIOSK
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                <span>{t.kioskStation}</span>
              </p>
            </div>
          </div>

          {/* Mobile Language Pill */}
          <div className="flex md:hidden items-center gap-1 bg-white/70 p-1 rounded-xl border border-white/80 shadow-xs">
            {(['en', 'hi', 'mr'] as Language[]).map((lang) => (
              <button
                key={lang}
                onClick={() => onLanguageChange(lang)}
                className={`px-2.5 py-1 text-xs rounded-lg font-bold transition ${
                  language === lang ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {lang === 'en' ? 'EN' : lang === 'hi' ? 'हिन्दी' : 'मराठी'}
              </button>
            ))}
          </div>
        </div>

        {/* Accessibility and Multilingual Controls */}
        <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 sm:gap-2.5 w-full md:w-auto">
          {/* Desktop Language Selector */}
          <div className="hidden md:flex items-center gap-1 bg-white/70 backdrop-blur-md p-1 rounded-2xl border border-white/80 shadow-xs">
            <Globe className="w-4 h-4 text-slate-400 ml-1.5 mr-0.5" />
            <button
              id="lang-btn-en"
              onClick={() => onLanguageChange('en')}
              className={`px-3 py-1.5 text-xs rounded-xl font-bold transition-all ${
                language === 'en'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              English
            </button>
            <button
              id="lang-btn-hi"
              onClick={() => onLanguageChange('hi')}
              className={`px-3 py-1.5 text-xs rounded-xl font-bold transition-all ${
                language === 'hi'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              हिन्दी
            </button>
            <button
              id="lang-btn-mr"
              onClick={() => onLanguageChange('mr')}
              className={`px-3 py-1.5 text-xs rounded-xl font-bold transition-all ${
                language === 'mr'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              मराठी
            </button>
          </div>

          {/* Audio Assistance (TTS) */}
          <button
            id="btn-audio-guide"
            onClick={toggleAudioGuide}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
              isPlayingAudio
                ? 'bg-amber-400 text-amber-950 ring-2 ring-amber-300 animate-pulse'
                : 'bg-amber-100/90 hover:bg-amber-100 text-amber-900 border border-amber-200 shadow-xs'
            }`}
            title="Listen to audio instructions in selected language"
          >
            {isPlayingAudio ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span>{isPlayingAudio ? t.audioPlaying : t.audioAssistance}</span>
          </button>

          {/* Text Size Zoom */}
          <button
            id="btn-text-size"
            onClick={cycleTextSize}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white/70 hover:bg-white text-slate-700 border border-white/80 shadow-xs transition"
            title="Adjust text font size for low vision users"
          >
            <ZoomIn className="w-4 h-4 text-blue-600" />
            <span>
              {t.textSize}:{' '}
              <strong className="text-blue-900">
                {textSize === 'normal' ? t.normalText : textSize === 'large' ? t.largeText : t.extraLargeText}
              </strong>
            </span>
          </button>

          {/* High Contrast Toggle */}
          <button
            id="btn-high-contrast"
            onClick={onToggleHighContrast}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
              highContrast
                ? 'bg-yellow-400 text-black ring-2 ring-yellow-300'
                : 'bg-white/70 hover:bg-white text-slate-700 border border-white/80 shadow-xs'
            }`}
            title="High contrast display mode"
          >
            <Eye className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">{t.highContrast}</span>
          </button>

          {/* Help Button */}
          <button
            id="btn-help"
            onClick={onOpenHelp}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-blue-50/80 hover:bg-blue-100/80 text-blue-900 border border-blue-200/80 shadow-xs transition"
            title="Get instructions on how to use kiosk"
          >
            <HelpCircle className="w-4 h-4 text-blue-600" />
            <span>{t.help}</span>
          </button>

          {/* Call Triage Staff / Nurse Emergency */}
          <button
            id="btn-call-nurse"
            onClick={onCallStaff}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-500/20 transition active:scale-95 cursor-pointer"
            title="Emergency nurse call assistance"
          >
            <PhoneCall className="w-4 h-4" />
            <span>{t.emergencyCallStaff}</span>
          </button>

          {/* Staff Access / PIN Unlock */}
          {onOpenStaffLogin && (
            <button
              id="btn-kiosk-staff-login"
              onClick={onOpenStaffLogin}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-900/80 hover:bg-slate-900 text-slate-200 border border-slate-700 shadow-xs transition active:scale-95 cursor-pointer"
              title="Hospital Staff / Doctor Passcode Login"
            >
              <Lock className="w-3.5 h-3.5 text-teal-400" />
              <span className="hidden sm:inline">Staff</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
