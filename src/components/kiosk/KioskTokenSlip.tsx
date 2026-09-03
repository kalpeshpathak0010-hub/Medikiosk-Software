import React, { useState, useEffect } from 'react';
import { Printer, QrCode, CheckCircle2, AlertTriangle, Clock, MapPin, Stethoscope, ArrowRight, RotateCcw, Sparkles } from 'lucide-react';
import { ClinicalSummary, Language, Patient, RedFlagAlert } from '../../types';
import { translations } from '../../locales/translations';

interface KioskTokenSlipProps {
  language: Language;
  patient: Patient;
  summary: ClinicalSummary;
  redFlag: RedFlagAlert | null;
  onDone: () => void;
  highContrast: boolean;
}

export const KioskTokenSlip: React.FC<KioskTokenSlipProps> = ({
  language,
  patient,
  summary,
  redFlag,
  onDone,
  highContrast,
}) => {
  const t = translations[language];
  const [countdown, setCountdown] = useState(30);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isPrinted, setIsPrinted] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onDone();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onDone]);

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      setIsPrinting(false);
      setIsPrinted(true);
    }, 1500);
  };

  return (
    <div className="flex-1 flex flex-col justify-center p-4 sm:p-6 max-w-3xl mx-auto w-full">
      <div
        className={`w-full rounded-[36px] p-6 sm:p-8 shadow-2xl transition-all ${
          highContrast
            ? 'bg-black border-4 border-yellow-400 text-white'
            : 'bg-white/80 backdrop-blur-xl border-2 border-white/60 text-slate-900 shadow-2xl ring-1 ring-slate-900/5'
        }`}
      >
        {/* Success header */}
        <div className="text-center pb-6 border-b border-slate-200/80">
          <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-500 flex items-center justify-center mx-auto mb-3 animate-bounce shadow-sm">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-blue-950 tracking-tight">{t.tokenTitle}</h2>
          <p className="text-slate-600 text-sm mt-1 font-medium">{t.tokenSubtitle}</p>
        </div>

        {/* Triage Priority Banner if Red Flag */}
        {redFlag && (
          <div className="my-4 p-4 rounded-2xl bg-rose-50 border-2 border-rose-400 text-rose-900 flex items-center justify-between gap-3 animate-pulse shadow-sm">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0" />
              <div>
                <span className="font-extrabold text-sm uppercase tracking-wider block text-rose-950">
                  PRIORITY TRIAGE ESCALATION
                </span>
                <p className="text-xs text-rose-800 font-medium">
                  {redFlag.message?.[language] || redFlag.message?.en || redFlag.description || 'Urgent priority triage evaluation recommended.'}
                </p>
              </div>
            </div>
            <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-rose-600 text-white shrink-0 shadow-xs">
              URGENT
            </span>
          </div>
        )}

        {/* The Printable OPD Token Slip - Physical Token Visual */}
        <div className="my-6 bg-white text-slate-950 p-6 sm:p-8 rounded-3xl shadow-xl border-2 border-slate-200 relative overflow-hidden font-sans">
          {/* Top Receipt header */}
          <div className="flex items-center justify-between border-b-2 border-dashed border-slate-200 pb-4 mb-4">
            <div>
              <h3 className="font-black text-xl tracking-tight text-slate-900">ALL INDIA INSTITUTE OF MEDICAL SCIENCES</h3>
              <p className="text-xs text-slate-500 font-medium">Digital OPD Triage Station #3 • New Delhi</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono text-slate-500 block">
                {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
              <span className="text-xs font-mono text-slate-500">
                {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          {/* Big Token Number Display */}
          <div className="text-center py-4 bg-slate-50 rounded-2xl border border-slate-200/80 mb-6">
            <span className="text-xs uppercase font-extrabold text-slate-500 tracking-widest block">
              YOUR QUEUE TOKEN NUMBER
            </span>
            <div className="text-5xl sm:text-7xl font-black text-blue-700 tracking-tight font-mono my-1">
              {summary.tokenNumber || 'A-127'}
            </div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 text-blue-900 text-xs font-bold">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>Est. Wait Time: ~15 mins (2 patients ahead)</span>
            </div>
          </div>

          {/* Consultation Room Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-6 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
            <div className="space-y-1">
              <span className="text-xs text-slate-500 font-bold uppercase flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                {t.roomNumber}
              </span>
              <p className="font-extrabold text-slate-900 text-base">OPD Room 4 – General Medicine & Cardiology</p>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-slate-500 font-bold uppercase flex items-center gap-1">
                <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
                {t.doctorName}
              </span>
              <p className="font-extrabold text-slate-900 text-base">Dr. A. Varma, MD (Physician)</p>
            </div>
          </div>

          {/* Patient Details & QR Tracker */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t-2 border-dashed border-slate-200">
            <div>
              <p className="text-sm font-bold text-slate-900">
                Patient: <span className="text-blue-700 font-extrabold">{patient.name}</span> ({patient.age}y / {patient.gender})
              </p>
              <p className="text-xs text-slate-500 font-mono">
                ABHA: {patient.abhaId || patient.phone}
              </p>
              <p className="text-xs text-slate-600 mt-1 font-medium">
                Chief Complaint: <strong className="text-slate-900 font-bold">{summary.chiefComplaint}</strong>
              </p>
            </div>

            <div className="text-center shrink-0">
              <div className="w-20 h-20 bg-slate-900 text-white rounded-xl p-1.5 flex items-center justify-center mx-auto shadow-sm">
                <QrCode className="w-16 h-16 text-white" />
              </div>
              <span className="text-[10px] text-slate-500 font-bold mt-1 block">Scan for Live Queue SMS</span>
            </div>
          </div>
        </div>

        {/* Print & Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <button
            id="btn-print-token"
            onClick={handlePrint}
            disabled={isPrinting}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
          >
            <Printer className="w-5 h-5" />
            <span>{isPrinting ? 'Printing Slip...' : isPrinted ? 'Printed ✓ (Print Again)' : t.printSlip}</span>
          </button>

          <button
            id="btn-kiosk-finish-session"
            onClick={onDone}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white/80 hover:bg-white text-slate-800 font-bold text-base border border-white/80 shadow-xs flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
          >
            <span>{t.done}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Auto Privacy Reset Countdown Bar */}
        <div className="p-3 rounded-2xl bg-white/70 backdrop-blur-md border border-white/80 flex items-center justify-between text-xs text-slate-600 font-medium shadow-xs">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-blue-600" />
            <span>For your privacy, kiosk will reset to home screen automatically:</span>
          </div>
          <span className="font-bold text-blue-900 font-mono text-sm px-2.5 py-0.5 rounded-lg bg-blue-100 border border-blue-200">
            {countdown}s
          </span>
        </div>
      </div>
    </div>
  );
};
