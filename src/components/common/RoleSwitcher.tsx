import React, { useState, useRef, useEffect } from 'react';
import {
  Stethoscope,
  User,
  BarChart3,
  Clock,
  FileText,
  ShieldAlert,
  Monitor,
  Sparkles,
  Lock,
  LogOut,
  ChevronDown,
  Building2,
  ShieldCheck,
  Globe,
  Volume2,
  VolumeX,
  Eye,
  HelpCircle,
  PhoneCall,
  ZoomIn,
  Check,
  Activity,
  ArrowRight,
} from 'lucide-react';
import { AppRoute, DoctorAvailabilityStatus, Language, UserRole } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { StaffLoginModal } from './StaffLoginModal';
import { translations } from '../../locales/translations';
import { audioService } from '../../services/audioService';

export type AppView = AppRoute;

interface RoleSwitcherProps {
  currentView: AppView;
  onSelectView: (view: AppView) => void;
  redFlagsCount: number;
  isKioskFullscreenMode: boolean;
  onToggleKioskFullscreen: () => void;
  // Patient Kiosk Header Controls
  language?: Language;
  onLanguageChange?: (lang: Language) => void;
  textSize?: 'normal' | 'large' | 'extraLarge';
  onTextSizeChange?: (size: 'normal' | 'large' | 'extraLarge') => void;
  highContrast?: boolean;
  onToggleHighContrast?: () => void;
  onOpenHelp?: () => void;
  onCallStaff?: () => void;
  audioPromptText?: string;
}

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({
  currentView,
  onSelectView,
  redFlagsCount,
  isKioskFullscreenMode,
  onToggleKioskFullscreen,
  language = 'en',
  onLanguageChange,
  textSize = 'normal',
  onTextSizeChange,
  highContrast = false,
  onToggleHighContrast,
  onOpenHelp,
  onCallStaff,
  audioPromptText,
}) => {
  const { currentUser, currentRole, canAccessRoute, logout, updateDoctorAvailability } = useAuth();
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isAccessibilityOpen, setIsAccessibilityOpen] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const langMenuRef = useRef<HTMLDivElement>(null);
  const accessMenuRef = useRef<HTMLDivElement>(null);

  const t = translations[language];

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setIsLangDropdownOpen(false);
      }
      if (accessMenuRef.current && !accessMenuRef.current.contains(e.target as Node)) {
        setIsAccessibilityOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const handleTextSizeCycle = (targetSize: 'normal' | 'large' | 'extraLarge') => {
    if (onTextSizeChange) {
      onTextSizeChange(targetSize);
    }
  };

  // Fullscreen kiosk floating minimal controls (if triggered)
  if (isKioskFullscreenMode && currentView === 'kiosk') {
    return (
      <>
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2">
          <button
            id="btn-staff-unlock-kiosk"
            onClick={() => setIsStaffModalOpen(true)}
            className="flex items-center gap-1.5 bg-slate-900/90 hover:bg-slate-900 text-white text-xs px-3.5 py-2.5 rounded-full border border-slate-700 shadow-xl backdrop-blur-md font-bold transition active:scale-95 cursor-pointer"
            title="Hospital Staff Authentication"
          >
            <Lock className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Staff Portal</span>
          </button>

          <button
            id="btn-exit-kiosk-mode"
            onClick={onToggleKioskFullscreen}
            className="flex items-center gap-2 bg-white/90 hover:bg-white text-slate-800 text-xs px-3.5 py-2.5 rounded-full border border-slate-200 shadow-xl font-bold transition active:scale-95 cursor-pointer"
          >
            <Monitor className="w-3.5 h-3.5 text-blue-600" />
            <span>Exit Kiosk Mode</span>
          </button>
        </div>

        <StaffLoginModal
          isOpen={isStaffModalOpen}
          onClose={() => setIsStaffModalOpen(false)}
          onSuccess={() => {
            onToggleKioskFullscreen();
            onSelectView('doctor');
          }}
        />
      </>
    );
  }

  // Determine if patient kiosk view
  const isPatientKioskView = currentView === 'kiosk';

  // Internal staff routes permitted based on role
  const staffNavItems: Array<{
    id: AppRoute;
    label: string;
    icon: React.ElementType;
    badge?: number;
  }> = [];

  if (canAccessRoute('doctor')) {
    staffNavItems.push({
      id: 'doctor',
      label: 'OPD Queue',
      icon: Stethoscope,
      badge: redFlagsCount,
    });
  }

  if (canAccessRoute('timeline')) {
    staffNavItems.push({
      id: 'timeline',
      label: 'Medical Timeline',
      icon: Clock,
    });
  }

  if (canAccessRoute('ocr_pipeline')) {
    staffNavItems.push({
      id: 'ocr_pipeline',
      label: 'OCR Documents',
      icon: FileText,
    });
  }

  if (canAccessRoute('admin')) {
    staffNavItems.push({
      id: 'admin',
      label: 'Telemetry & Admin',
      icon: BarChart3,
    });
  }

  if (canAccessRoute('abdm')) {
    staffNavItems.push({
      id: 'abdm',
      label: 'ABDM FHIR',
      icon: Sparkles,
    });
  }

  return (
    <header className="sticky top-0 z-40 w-full bg-white select-none">
      {/* 1. Indian Public-Service Saffron/Orange Accent Strip (3px) */}
      <div className="h-[3px] bg-[#ea580c] w-full" />

      {/* ========================================================================= */}
      {/* PATIENT KIOSK HEADER */}
      {/* ========================================================================= */}
      {isPatientKioskView ? (
        <>
          <div
            className={`w-full border-b transition-colors ${
              highContrast
                ? 'bg-black border-yellow-400 text-white'
                : 'bg-white border-slate-200/90 text-slate-900 shadow-xs'
            }`}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 h-[74px] flex items-center justify-between gap-3 sm:gap-4">
              {/* Left: Clean institutional identity */}
              <div
                className="flex items-center gap-3 cursor-pointer select-none shrink-0"
                onClick={() => onSelectView('kiosk')}
                title="MediKiosk Terminal"
              >
                {/* Institutional Cross Icon */}
                <div className="w-10 h-10 rounded-lg bg-[#1e3a8a] text-white flex items-center justify-center font-black text-xl shadow-xs shrink-0">
                  <span className="leading-none text-white font-serif">+</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 leading-none">
                    <span className="font-extrabold tracking-tight text-[#1e3a8a] text-lg sm:text-xl font-sans">
                      {t.appName || 'MEDIKIOSK'}
                    </span>
                    <span className="hidden sm:inline-block text-xs font-semibold text-slate-400">|</span>
                    <span className="hidden sm:inline-block text-xs font-bold text-slate-700">
                      {t.appTagline || 'Patient Clinical Intake System'}
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-slate-500 mt-1">
                    {t.appTaglineSub || 'Digital Clinical History & Document Assistance'}
                  </p>
                </div>
              </div>

              {/* Right: Citizen Controls (Language, Accessibility, Help) */}
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                {/* Language Switcher: English | हिन्दी | मराठी */}
                {onLanguageChange && (
                  <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-bold text-slate-700">
                    <button
                      id="btn-lang-en"
                      onClick={() => onLanguageChange('en')}
                      className={`px-2.5 py-1.5 rounded-md transition cursor-pointer ${
                        language === 'en'
                          ? 'bg-[#1e3a8a] text-white font-extrabold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                      }`}
                    >
                      English
                    </button>
                    <button
                      id="btn-lang-hi"
                      onClick={() => onLanguageChange('hi')}
                      className={`px-2.5 py-1.5 rounded-md transition cursor-pointer font-devanagari ${
                        language === 'hi'
                          ? 'bg-[#1e3a8a] text-white font-extrabold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                      }`}
                    >
                      हिन्दी
                    </button>
                    <button
                      id="btn-lang-mr"
                      onClick={() => onLanguageChange('mr')}
                      className={`px-2.5 py-1.5 rounded-md transition cursor-pointer font-devanagari ${
                        language === 'mr'
                          ? 'bg-[#1e3a8a] text-white font-extrabold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                      }`}
                    >
                      मराठी
                    </button>
                  </div>
                )}

                {/* Accessibility Controls: Text Size & High Contrast */}
                <div className="hidden sm:flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-bold text-slate-700">
                  <button
                    id="btn-text-size-normal"
                    onClick={() => handleTextSizeCycle('normal')}
                    title="Standard Text Size"
                    className={`px-2 py-1.5 rounded-md transition cursor-pointer ${
                      textSize === 'normal'
                        ? 'bg-slate-700 text-white font-extrabold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    A-
                  </button>
                  <button
                    id="btn-text-size-large"
                    onClick={() => handleTextSizeCycle('large')}
                    title="Large Text Size"
                    className={`px-2 py-1.5 rounded-md transition cursor-pointer ${
                      textSize === 'large'
                        ? 'bg-slate-700 text-white font-extrabold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    A
                  </button>
                  <button
                    id="btn-text-size-extralarge"
                    onClick={() => handleTextSizeCycle('extraLarge')}
                    title="Extra Large Text Size"
                    className={`px-2 py-1.5 rounded-md transition cursor-pointer ${
                      textSize === 'extraLarge'
                        ? 'bg-slate-700 text-white font-extrabold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    A+
                  </button>
                </div>

                {/* High Contrast Toggle */}
                {onToggleHighContrast && (
                  <button
                    id="btn-toggle-contrast"
                    onClick={onToggleHighContrast}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer ${
                      highContrast
                        ? 'bg-yellow-400 text-black border-yellow-500'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                    title="High Contrast Mode"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">
                      {highContrast ? 'Contrast ON' : 'Contrast'}
                    </span>
                  </button>
                )}

                {/* Audio Guide (TTS Voice Assistance) */}
                <button
                  id="btn-audio-guide"
                  onClick={toggleAudioGuide}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                    isPlayingAudio
                      ? 'bg-amber-600 text-white border-amber-700 animate-pulse'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                  title={isPlayingAudio ? 'Stop Audio Guide' : 'Listen to Audio Instructions'}
                >
                  {isPlayingAudio ? (
                    <VolumeX className="w-3.5 h-3.5" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5 text-blue-700" />
                  )}
                  <span className="hidden md:inline">
                    {isPlayingAudio ? (t.audioPlaying || 'Playing...') : (t.audioStopped || 'Audio')}
                  </span>
                </button>

                {/* Need Help Button */}
                {onOpenHelp && (
                  <button
                    id="btn-open-help"
                    onClick={onOpenHelp}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition cursor-pointer"
                    title="Open Help Guide"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-blue-700" />
                    <span className="hidden sm:inline">{t.help || 'Help'}</span>
                  </button>
                )}

                {/* Call Staff Button (Emergency / Nurse Alert) */}
                {onCallStaff && (
                  <button
                    id="btn-call-nurse"
                    onClick={onCallStaff}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#b91c1c] hover:bg-[#991b1b] text-white transition active:scale-95 cursor-pointer shrink-0"
                    title="Call Nursing Staff for Assistance"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>{t.callStaff || 'Call Staff'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 4. Government-Style Information Bar */}
          <div className="w-full bg-slate-100 border-b border-slate-200/80 px-4 sm:px-6 py-1.5 text-xs text-slate-600 font-medium flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800">
                {t.govInfoBar || 'Patient services • Clinical history • Document assistance'}
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-slate-500 font-mono text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span>Central OPD Network • AIIMS New Delhi • Terminal #04</span>
            </div>
          </div>
        </>
      ) : (
        /* ========================================================================= */
        /* STAFF COMMAND & WORKSPACE HEADER (Doctor / Admin / Internal Staff) */
        /* ========================================================================= */
        <div className="w-full bg-slate-900 text-white border-b border-slate-800 shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-[68px] flex items-center justify-between gap-4">
            {/* Left: MediKiosk Staff Identity */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
                M
              </div>
              <div>
                <div className="flex items-center gap-2 leading-none">
                  <span className="font-extrabold tracking-tight text-white text-base font-sans">
                    MEDIKIOSK
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-900/80 text-blue-200 border border-blue-700">
                    STAFF PORTAL
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {currentUser.hospitalName || 'AIIMS New Delhi • Central OPD Network'}
                </p>
              </div>
            </div>

            {/* Center: Internal Staff Nav Tabs */}
            <nav className="hidden lg:flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700 text-xs font-bold">
              {staffNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-${item.id}`}
                    onClick={() => onSelectView(item.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{item.label}</span>
                    {item.badge && item.badge > 0 ? (
                      <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-rose-600 text-white animate-pulse">
                        {item.badge}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </nav>

            {/* Right: Doctor Availability Toggle & Staff Profile */}
            <div className="flex items-center gap-3 shrink-0">
              {/* Doctor Real-Time Availability Switcher */}
              {canAccessRoute('doctor') && (
                <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1 border border-slate-700 text-xs font-bold">
                  <span className="text-[11px] text-slate-400 px-1 hidden xl:inline">Status:</span>
                  <button
                    id="btn-status-available"
                    onClick={() => updateDoctorAvailability('AVAILABLE')}
                    className={`px-2 py-1 rounded-md text-[11px] transition cursor-pointer flex items-center gap-1 ${
                      currentUser.availabilityStatus === 'AVAILABLE' || !currentUser.availabilityStatus
                        ? 'bg-emerald-600 text-white font-extrabold shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    <span>Available</span>
                  </button>
                  <button
                    id="btn-status-busy"
                    onClick={() => updateDoctorAvailability('WITH_PATIENT')}
                    className={`px-2 py-1 rounded-md text-[11px] transition cursor-pointer flex items-center gap-1 ${
                      currentUser.availabilityStatus === 'WITH_PATIENT' || currentUser.availabilityStatus === 'BUSY'
                        ? 'bg-amber-600 text-white font-extrabold shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    <span>With Patient</span>
                  </button>
                  <button
                    id="btn-status-offline"
                    onClick={() => updateDoctorAvailability('OFFLINE')}
                    className={`px-2 py-1 rounded-md text-[11px] transition cursor-pointer flex items-center gap-1 ${
                      currentUser.availabilityStatus === 'OFFLINE'
                        ? 'bg-slate-600 text-white font-extrabold shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    <span>Offline</span>
                  </button>
                </div>
              )}

              {/* Staff Profile Label */}
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-200">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {currentUser.roomNumber || currentUser.department || 'Physician'}
                </span>
              </div>

              {/* Return to Patient Kiosk */}
              <button
                id="btn-return-to-kiosk"
                onClick={() => onSelectView('kiosk')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition cursor-pointer"
                title="Open Patient Touchscreen Kiosk"
              >
                <User className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline">Patient Kiosk</span>
              </button>

              {/* Staff Sign Out */}
              <button
                id="btn-staff-logout"
                onClick={logout}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 text-xs font-bold border border-slate-700 transition cursor-pointer"
                title="Sign Out of Staff Session"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Staff Login Modal */}
      <StaffLoginModal
        isOpen={isStaffModalOpen}
        onClose={() => setIsStaffModalOpen(false)}
        onSuccess={() => onSelectView('doctor')}
      />
    </header>
  );
};
