import React, { useEffect, useState } from 'react';
import { ShieldAlert, Clock, UserCheck, RefreshCw } from 'lucide-react';
import { Language } from '../../types';
import { audioService } from '../../services/audioService';

interface KioskIdleTimeoutModalProps {
  language: Language;
  onStayActive: () => void;
  onResetSession: () => void;
  countdownSeconds?: number;
}

export const KioskIdleTimeoutModal: React.FC<KioskIdleTimeoutModalProps> = ({
  language,
  onStayActive,
  onResetSession,
  countdownSeconds = 15,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(countdownSeconds);

  useEffect(() => {
    // Speak audio prompt
    const prompt =
      language === 'hi'
        ? 'क्या आप अभी भी यहाँ हैं? आपकी गोपनीयता की सुरक्षा के लिए सत्र रीसेट हो रहा है।'
        : language === 'mr'
        ? 'तुम्ही अजूनही इथे आहात का? गोपनीयतेच्या संरक्षणासाठी सत्र रीसेट होत आहे.'
        : 'Are you still there? To protect your medical privacy, this kiosk will reset.';

    audioService.speak(prompt, language);

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onResetSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      audioService.stopSpeaking();
    };
  }, [language, onResetSession]);

  const titles: Record<Language, string> = {
    en: 'Are You Still There?',
    hi: 'क्या आप अभी भी यहाँ हैं?',
    mr: 'तुम्ही अजूनही इथे आहात का?',
  };

  const descriptions: Record<Language, string> = {
    en: 'To protect your personal medical data and privacy in public hospital waiting rooms, this kiosk will automatically clear your session and return to the main screen.',
    hi: 'सार्वजनिक अस्पताल में आपके व्यक्तिगत मेडिकल डेटा और गोपनीयता की सुरक्षा के लिए, यह कियोस्क सत्र को रीसेट कर देगा।',
    mr: 'सार्वजनिक रुग्णालयात आपल्या वैयक्तिक वैद्यकीय डेटा आणि गोपनीयतेच्या संरक्षणासाठी, हे कियोस्क सत्र रीसेट करेल.',
  };

  const stayLabels: Record<Language, string> = {
    en: 'Yes, I am Still Here!',
    hi: 'हाँ, मैं अभी भी यहाँ हूँ!',
    mr: 'होय, मी अजूनही इथे आहे!',
  };

  const resetLabels: Record<Language, string> = {
    en: 'Reset / Start Over',
    hi: 'सत्र रीसेट करें',
    mr: 'सत्र रीसेट करा',
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-md w-full rounded-[36px] bg-white/95 backdrop-blur-2xl border-4 border-amber-400 p-6 sm:p-8 shadow-2xl text-slate-900 text-center animate-scale-up">
        {/* Countdown Circle */}
        <div className="relative w-20 h-20 mx-auto mb-4 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-amber-100 border-4 border-amber-400 animate-ping opacity-30"></div>
          <div className="w-20 h-20 rounded-full bg-amber-500 flex items-center justify-center text-slate-950 font-black text-3xl shadow-lg shadow-amber-500/30">
            {secondsRemaining}
          </div>
        </div>

        <span className="text-xs font-black uppercase tracking-widest text-amber-700 block mb-1">
          Patient Privacy Timeout Guard
        </span>

        <h3 className="text-2xl sm:text-3xl font-black text-blue-950 mb-3">
          {titles[language] || titles.en}
        </h3>

        <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed font-medium">
          {descriptions[language] || descriptions.en}
        </p>

        {/* Buttons with large touch targets */}
        <div className="space-y-3">
          <button
            id="btn-kiosk-idle-stay"
            onClick={onStayActive}
            className="w-full min-h-[56px] py-4 px-6 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-black text-base uppercase tracking-wider shadow-lg shadow-teal-600/30 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
          >
            <UserCheck className="w-5 h-5" />
            <span>{stayLabels[language] || stayLabels.en}</span>
          </button>

          <button
            id="btn-kiosk-idle-reset"
            onClick={onResetSession}
            className="w-full min-h-[48px] py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
            <span>{resetLabels[language] || resetLabels.en}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
