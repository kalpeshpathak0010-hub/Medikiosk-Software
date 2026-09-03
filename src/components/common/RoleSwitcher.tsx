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
} from 'lucide-react';
import { AppRoute, Language, UserRole } from '../../types';
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
  language = 'hi',
  onLanguageChange,
  textSize = 'normal',
  onTextSizeChange,
  highContrast = false,
  onToggleHighContrast,
  onOpenHelp,
  onCallStaff,
  audioPromptText,
}) => {
  const { currentUser, currentRole, canAccessRoute, logout } = useAuth();
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isAccessibilityOpen, setIsAccessibilityOpen] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const langMenuRef = useRef<HTMLDivElement>(null);
  const accessMenuRef = useRef<HTMLDivElement>(null);
  const roleMenuRef = useRef<HTMLDivElement>(null);

  const t = translations[language];

  // Close popovers on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setIsLangDropdownOpen(false);
      }
      if (accessMenuRef.current && !accessMenuRef.current.contains(e.target as Node)) {
        setIsAccessibilityOpen(false);
      }
      if (roleMenuRef.current && !roleMenuRef.current.contains(e.target as Node)) {
        setIsRoleDropdownOpen(false);
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

  const cycleTextSize = () => {
    if (!onTextSizeChange) return;
    if (textSize === 'normal') onTextSizeChange('large');
    else if (textSize === 'large') onTextSizeChange('extraLarge');
    else onTextSizeChange('normal');
  };

  // Fullscreen kiosk floating minimal controls
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
            <Lock className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden sm:inline">Staff Access</span>
          </button>

          <button
            id="btn-exit-kiosk-mode"
            onClick={onToggleKioskFullscreen}
            className="flex items-center gap-2 bg-white/90 hover:bg-white text-slate-800 text-xs px-3.5 py-2.5 rounded-full border border-white/80 shadow-xl backdrop-blur-md font-bold transition active:scale-95 cursor-pointer"
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

  // Internal staff routes permitted based on role
  const staffNavItems: Array<{
    id: AppRoute;
    label: string;
    icon: React.ElementType;
    badge?: number;
    color: string;
  }> = [];

  if (currentRole === 'DOCTOR' || currentRole === 'ADMIN') {
    staffNavItems.push({
      id: 'doctor',
      label: 'Doctor Workspace',
      icon: Stethoscope,
      badge: redFlagsCount,
      color: 'bg-blue-600',
    });
    staffNavItems.push({
      id: 'timeline',
      label: 'Medical Timeline',
      icon: Clock,
      color: 'bg-indigo-600',
    });
    staffNavItems.push({
      id: 'ocr_pipeline',
      label: 'OCR Pipeline',
      icon: FileText,
      color: 'bg-amber-600',
    });
  }

  if (currentRole === 'ADMIN') {
    staffNavItems.push({
      id: 'admin',
      label: 'Admin & Telemetry',
      icon: BarChart3,
      color: 'bg-purple-600',
    });
    staffNavItems.push({
      id: 'abdm',
      label: 'ABDM Specs',
      icon: Sparkles,
      color: 'bg-emerald-600',
    });
  }

  const isPatientKioskView = currentView === 'kiosk';

  return (
    <>
      <header
        className={`sticky top-0 z-40 transition-colors ${
          highContrast
            ? 'bg-black border-b-2 border-yellow-400 text-yellow-300'
            : 'bg-white/90 backdrop-blur-md border-b border-slate-200/80 text-slate-800 shadow-xs'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-[72px] sm:h-[76px] flex items-center justify-between gap-3 sm:gap-4">
          
          {/* ========================================================================= */}
          {/* LEFT: MEDIKIOSK IDENTITY */}
          {/* ========================================================================= */}
          <div
            className="flex items-center gap-3 cursor-pointer select-none shrink-0"
            onClick={() => onSelectView('kiosk')}
            title="MediKiosk Home"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white text-base sm:text-lg shadow-md shadow-blue-500/20 shrink-0">
              M
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-black tracking-tight text-blue-950 text-base sm:text-lg">
                  MEDIKIOSK
                </span>
              </div>
              <p className="text-[9px] sm:text-[10px] font-bold tracking-wider text-slate-500 uppercase mt-0.5">
                AI CLINICAL INTAKE PLATFORM
              </p>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* CENTER: CONTEXT (Patient Kiosk) OR INTERNAL NAV (Staff Workspace) */}
          {/* ========================================================================= */}
          {isPatientKioskView ? (
            /* Subtle Hospital & Kiosk Status for Patients */
            <div className="hidden lg:flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-100/90 border border-slate-200/70 text-xs font-medium text-slate-600">
              <span className="flex items-center gap-1.5 text-slate-700 font-semibold">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                <span>{currentUser.hospitalName || 'OPD • AIIMS New Delhi'}</span>
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1.5 text-slate-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Kiosk 04 · Ready</span>
              </span>
            </div>
          ) : (
            /* Authenticated Staff Navigation Bar */
            <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-semibold">
              <button
                id="nav-back-to-kiosk"
                onClick={() => onSelectView('kiosk')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-white/70 transition cursor-pointer"
                title="Switch to Patient Kiosk Mode"
              >
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>Patient Kiosk</span>
              </button>

              {staffNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-${item.id}`}
                    onClick={() => onSelectView(item.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition cursor-pointer ${
                      isActive
                        ? `${item.color} text-white shadow-xs font-bold`
                        : 'text-slate-700 hover:text-slate-900 hover:bg-white/80'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{item.label}</span>
                    {item.badge && item.badge > 0 ? (
                      <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-600 text-white animate-pulse">
                        {item.badge}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </nav>
          )}

          {/* ========================================================================= */}
          {/* RIGHT: CONTROLS & ACTIONS */}
          {/* ========================================================================= */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">

            {/* If in Patient Kiosk: Show Language, Accessibility, Call Staff */}
            {isPatientKioskView && (
              <>
                {/* 1. Compact Language Selector */}
                {onLanguageChange && (
                  <div className="relative" ref={langMenuRef}>
                    <div className="hidden sm:flex items-center bg-slate-100/90 p-0.5 rounded-xl border border-slate-200/80 text-xs font-bold">
                      <button
                        id="lang-quick-en"
                        onClick={() => onLanguageChange('en')}
                        className={`px-2.5 py-1 rounded-lg transition ${
                          language === 'en'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        English
                      </button>
                      <button
                        id="lang-quick-hi"
                        onClick={() => onLanguageChange('hi')}
                        className={`px-2.5 py-1 rounded-lg transition font-devanagari ${
                          language === 'hi'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        हिन्दी
                      </button>
                      <button
                        id="lang-quick-mr"
                        onClick={() => onLanguageChange('mr')}
                        className={`px-2.5 py-1 rounded-lg transition font-devanagari ${
                          language === 'mr'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        मराठी
                      </button>
                      
                      <button
                        id="btn-lang-dropdown"
                        onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                        className="px-1.5 py-1 text-slate-500 hover:text-slate-800"
                        title="More Languages"
                      >
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Mobile Language Button */}
                    <button
                      id="btn-lang-mobile-toggle"
                      onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                      className="sm:hidden flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700"
                    >
                      <Globe className="w-3.5 h-3.5 text-blue-600" />
                      <span>{language === 'en' ? 'EN' : language === 'hi' ? 'हिन्दी' : 'मराठी'}</span>
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    </button>

                    {/* Language Dropdown Menu */}
                    {isLangDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-white border border-slate-200 shadow-xl p-2 z-50 text-slate-800">
                        <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1 tracking-wider">
                          Select Language
                        </div>
                        <button
                          onClick={() => {
                            onLanguageChange('en');
                            setIsLangDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition text-left ${
                            language === 'en' ? 'bg-blue-50 text-blue-800' : 'hover:bg-slate-50'
                          }`}
                        >
                          <span>English (Default)</span>
                          {language === 'en' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                        </button>
                        <button
                          onClick={() => {
                            onLanguageChange('hi');
                            setIsLangDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition text-left font-devanagari ${
                            language === 'hi' ? 'bg-blue-50 text-blue-800' : 'hover:bg-slate-50'
                          }`}
                        >
                          <span>हिन्दी (Hindi)</span>
                          {language === 'hi' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                        </button>
                        <button
                          onClick={() => {
                            onLanguageChange('mr');
                            setIsLangDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition text-left font-devanagari ${
                            language === 'mr' ? 'bg-blue-50 text-blue-800' : 'hover:bg-slate-50'
                          }`}
                        >
                          <span>मराठी (Marathi)</span>
                          {language === 'mr' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                        </button>
                        <div className="border-t border-slate-100 mt-1 pt-1">
                          <div className="text-[10px] text-slate-400 px-2 py-1 font-semibold">
                            Supported Regional Options
                          </div>
                          <div className="px-3 py-1.5 text-xs text-slate-500 flex items-center justify-between">
                            <span>தமிழ் (Tamil)</span>
                            <span className="text-[10px] text-slate-400">Assisted</span>
                          </div>
                          <div className="px-3 py-1.5 text-xs text-slate-500 flex items-center justify-between">
                            <span>తెలుగు (Telugu)</span>
                            <span className="text-[10px] text-slate-400">Assisted</span>
                          </div>
                          <div className="px-3 py-1.5 text-xs text-slate-500 flex items-center justify-between">
                            <span>বাংলা (Bengali)</span>
                            <span className="text-[10px] text-slate-400">Assisted</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Grouped Accessibility Control */}
                <div className="relative" ref={accessMenuRef}>
                  <button
                    id="btn-accessibility-toggle"
                    onClick={() => setIsAccessibilityOpen(!isAccessibilityOpen)}
                    className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-700 text-xs font-semibold transition active:scale-95 cursor-pointer"
                    title="Accessibility & Assistance Settings"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-600" />
                    <span className="hidden sm:inline">Accessibility</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>

                  {isAccessibilityOpen && (
                    <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-xl p-3 z-50 text-slate-800 space-y-2">
                      <div className="text-[10px] uppercase font-bold text-slate-400 px-1 tracking-wider mb-1">
                        Accessibility & Assistance
                      </div>

                      {/* Audio Guide */}
                      <button
                        onClick={toggleAudioGuide}
                        className={`w-full p-2.5 rounded-xl text-left text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                          isPlayingAudio
                            ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isPlayingAudio ? (
                            <VolumeX className="w-4 h-4 text-amber-700" />
                          ) : (
                            <Volume2 className="w-4 h-4 text-blue-600" />
                          )}
                          <span>Audio Assistance</span>
                        </div>
                        <span className="text-[10px] font-semibold text-slate-500">
                          {isPlayingAudio ? 'Stop' : 'Play TTS'}
                        </span>
                      </button>

                      {/* Text Size */}
                      {onTextSizeChange && (
                        <button
                          onClick={cycleTextSize}
                          className="w-full p-2.5 rounded-xl text-left text-xs font-bold flex items-center justify-between bg-slate-50 hover:bg-slate-100 text-slate-800 transition cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <ZoomIn className="w-4 h-4 text-blue-600" />
                            <span>Text Size</span>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 text-[11px] font-bold">
                            {textSize === 'normal' ? 'Normal' : textSize === 'large' ? 'Large' : 'Extra Large'}
                          </span>
                        </button>
                      )}

                      {/* High Contrast */}
                      {onToggleHighContrast && (
                        <button
                          onClick={onToggleHighContrast}
                          className={`w-full p-2.5 rounded-xl text-left text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                            highContrast
                              ? 'bg-yellow-100 text-yellow-900 border border-yellow-300'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4 text-slate-600" />
                            <span>High Contrast</span>
                          </div>
                          <span className="text-[10px] font-bold text-slate-500">
                            {highContrast ? 'ON' : 'OFF'}
                          </span>
                        </button>
                      )}

                      {/* Help */}
                      {onOpenHelp && (
                        <button
                          onClick={() => {
                            setIsAccessibilityOpen(false);
                            onOpenHelp();
                          }}
                          className="w-full p-2.5 rounded-xl text-left text-xs font-bold flex items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-800 transition cursor-pointer"
                        >
                          <HelpCircle className="w-4 h-4 text-blue-600" />
                          <span>Kiosk Help Guide</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* 3. Call Staff (High-visibility, compact & professional emergency action) */}
                {onCallStaff && (
                  <button
                    id="btn-call-nurse"
                    onClick={onCallStaff}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition active:scale-95 cursor-pointer shrink-0"
                    title="Call Nursing Staff for Assistance"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Call Staff</span>
                  </button>
                )}
              </>
            )}

            {/* In Staff Workspace: Show Triage Alert if active */}
            {!isPatientKioskView && redFlagsCount > 0 && (
              <button
                id="btn-quick-red-flags"
                onClick={() => onSelectView('doctor')}
                className="flex items-center gap-1.5 text-xs bg-rose-600 hover:bg-rose-700 text-white px-3 py-2 rounded-xl transition font-bold shadow-xs animate-pulse cursor-pointer"
                title={`${redFlagsCount} Urgent Triage Patients`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>{redFlagsCount} Triage</span>
              </button>
            )}

            {/* ========================================================================= */}
            {/* 4. PROFESSIONAL STAFF ACCESS / SESSION MENU */}
            {/* ========================================================================= */}
            {currentRole === 'PATIENT' ? (
              /* Subtle Professional Staff Login Button */
              <button
                id="btn-doctor-signin"
                onClick={() => setIsStaffModalOpen(true)}
                className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium border border-slate-700 shadow-xs transition active:scale-95 cursor-pointer shrink-0"
                title="Hospital Staff Authentication (Doctor / Admin)"
              >
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Staff Login</span>
              </button>
            ) : (
              /* Authenticated Staff User Pill & Dropdown */
              <div className="relative" ref={roleMenuRef}>
                <button
                  id="btn-role-selector-toggle"
                  onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-800 text-xs font-bold transition active:scale-95 cursor-pointer"
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      currentRole === 'DOCTOR' ? 'bg-blue-600 animate-pulse' : 'bg-purple-600'
                    }`}
                  />
                  <span className="font-extrabold text-blue-950">
                    {currentUser.name ? currentUser.name.split(' ')[0] : currentRole}
                  </span>
                  <span className="hidden sm:inline text-[11px] text-slate-500 font-normal">
                    ({currentRole})
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {/* Role Profile Menu */}
                {isRoleDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border border-slate-200 shadow-2xl p-3 z-50 text-slate-900 ring-1 ring-slate-900/10">
                    <div className="pb-2.5 mb-2 border-b border-slate-100">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                          Staff Session
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          Verified
                        </span>
                      </div>
                      <p className="text-sm font-black text-blue-950 truncate">
                        {currentUser.name}
                      </p>
                      {currentUser.registrationNumber && (
                        <p className="text-[11px] font-mono text-teal-700 font-bold">
                          Reg No: {currentUser.registrationNumber}
                        </p>
                      )}
                      {currentUser.department && (
                        <p className="text-xs text-slate-500 font-medium truncate">
                          {currentUser.department}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <button
                        onClick={() => {
                          setIsRoleDropdownOpen(false);
                          onSelectView('doctor');
                        }}
                        className="w-full p-2 rounded-xl text-left text-xs font-bold flex items-center gap-2 hover:bg-slate-100 text-slate-800 transition cursor-pointer"
                      >
                        <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
                        <span>Doctor Clinical Workspace</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsRoleDropdownOpen(false);
                          onSelectView('timeline');
                        }}
                        className="w-full p-2 rounded-xl text-left text-xs font-bold flex items-center gap-2 hover:bg-slate-100 text-slate-800 transition cursor-pointer"
                      >
                        <Clock className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Medical Timeline</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsRoleDropdownOpen(false);
                          onSelectView('ocr_pipeline');
                        }}
                        className="w-full p-2 rounded-xl text-left text-xs font-bold flex items-center gap-2 hover:bg-slate-100 text-slate-800 transition cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-amber-600" />
                        <span>OCR Pipeline</span>
                      </button>

                      {currentRole === 'ADMIN' && (
                        <button
                          onClick={() => {
                            setIsRoleDropdownOpen(false);
                            onSelectView('admin');
                          }}
                          className="w-full p-2 rounded-xl text-left text-xs font-bold flex items-center gap-2 hover:bg-slate-100 text-slate-800 transition cursor-pointer"
                        >
                          <BarChart3 className="w-3.5 h-3.5 text-purple-600" />
                          <span>Admin & Telemetry</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setIsRoleDropdownOpen(false);
                          onSelectView('kiosk');
                        }}
                        className="w-full p-2 rounded-xl text-left text-xs font-bold flex items-center gap-2 hover:bg-slate-100 text-slate-800 transition cursor-pointer"
                      >
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        <span>Switch to Patient Kiosk</span>
                      </button>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setIsRoleDropdownOpen(false);
                          logout();
                        }}
                        className="w-full py-2 px-3 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out (Lock Terminal)</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Kiosk Fullscreen Toggle in staff mode */}
            {!isPatientKioskView && (
              <button
                id="btn-kiosk-fullscreen-toggle"
                onClick={onToggleKioskFullscreen}
                title="Fullscreen Kiosk"
                className="hidden xl:flex items-center gap-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-2 rounded-xl border border-slate-200 font-bold transition cursor-pointer"
              >
                <Monitor className="w-3.5 h-3.5 text-blue-600" />
              </button>
            )}

          </div>
        </div>
      </header>

      {/* Staff Login Modal */}
      <StaffLoginModal
        isOpen={isStaffModalOpen}
        onClose={() => setIsStaffModalOpen(false)}
        onSuccess={() => onSelectView('doctor')}
      />
    </>
  );
};

