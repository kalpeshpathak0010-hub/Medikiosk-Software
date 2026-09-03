import React from 'react';
import { HelpCircle, Mic, QrCode, FileText, Volume2, X } from 'lucide-react';
import { Language } from '../../types';
import { translations } from '../../locales/translations';

interface HelpModalProps {
  language: Language;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ language, onClose }) => {
  const t = translations[language];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-xl w-full rounded-3xl bg-slate-900 border-2 border-slate-700 p-6 sm:p-8 shadow-2xl text-white">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center text-teal-300">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold">{t.help}</h3>
              <p className="text-xs text-slate-400">How to use MediKiosk Self-Service Terminal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3.5 mb-6 text-xs text-slate-300">
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
            <QrCode className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white text-sm block">1. Patient Identification</strong>
              <span>Scan your ABHA QR code from your phone or health card, or type your mobile number.</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
            <Mic className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white text-sm block">2. Speak or Touch to Answer</strong>
              <span>Tap the large microphone button to speak in Hindi, Marathi, or English, or simply tap options.</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
            <FileText className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white text-sm block">3. Scan Old Medical Records</strong>
              <span>Place your prescription or lab test on the glass scanner to extract medicines automatically.</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
            <Volume2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white text-sm block">4. Audio Assistance</strong>
              <span>Press the yellow Audio Guide button at the top if you need questions read aloud in your language.</span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm transition"
        >
          Got it, Close Help
        </button>
      </div>
    </div>
  );
};
