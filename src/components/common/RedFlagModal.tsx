import React, { useEffect } from 'react';
import { AlertTriangle, ShieldAlert, PhoneCall, CheckCircle2, ArrowRight } from 'lucide-react';
import { Language, RedFlagAlert } from '../../types';
import { audioService } from '../../services/audioService';

interface RedFlagModalProps {
  alert: RedFlagAlert;
  language: Language;
  onAcknowledge: () => void;
  onCallNurse: () => void;
}

export const RedFlagModal: React.FC<RedFlagModalProps> = ({
  alert,
  language,
  onAcknowledge,
  onCallNurse,
}) => {
  useEffect(() => {
    // Speak red flag warning aloud
    const textToSpeak =
      alert.message?.[language] ||
      alert.message?.en ||
      alert.description ||
      'Emergency symptoms detected';
    audioService.speak(`Alert: ${textToSpeak}. Please alert hospital triage staff.`, language);

    return () => {
      audioService.stopSpeaking();
    };
  }, [alert, language]);

  const alertMessage =
    alert.message?.[language] ||
    alert.message?.en ||
    alert.description ||
    'Emergency symptoms detected. Please seek immediate medical care.';

  const actionText =
    alert.suggestedAction?.[language] ||
    alert.suggestedAction?.en ||
    'Immediate emergency physician assessment and vital signs stabilization required.';

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-lg w-full rounded-3xl bg-slate-900 border-4 border-rose-500 p-6 sm:p-8 shadow-2xl text-white animate-scale-up">
        <div className="w-16 h-16 rounded-2xl bg-rose-600 flex items-center justify-center text-white mb-4 mx-auto shadow-lg shadow-rose-600/40 animate-pulse">
          <ShieldAlert className="w-10 h-10" />
        </div>

        <span className="text-xs uppercase tracking-widest font-black text-rose-400 block text-center mb-1">
          TRIAGE ESCALATION ALERT
        </span>

        <h3 className="text-2xl sm:text-3xl font-black text-center mb-3 text-white">
          Emergency Symptoms Detected
        </h3>

        <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-700/60 text-rose-100 text-sm font-semibold mb-4 leading-relaxed text-center">
          {alertMessage}
        </div>

        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 mb-6 space-y-1.5">
          <p className="font-bold text-teal-400">Hospital Action Protocol:</p>
          <p>• {actionText}</p>
          <p>• A high-priority emergency notification has been forwarded to the triage doctor desk.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            id="btn-red-flag-call-nurse"
            onClick={onCallNurse}
            className="py-3.5 px-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-rose-600/40 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Call OPD Nurse</span>
          </button>

          <button
            id="btn-red-flag-acknowledge"
            onClick={onAcknowledge}
            className="py-3.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider border border-slate-700 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
          >
            <span>Proceed with Intake</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
