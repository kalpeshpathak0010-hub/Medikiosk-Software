import React, { useState } from 'react';
import { Leaf, CheckCircle2, ArrowRight, ArrowLeft, AlertCircle, Sparkles } from 'lucide-react';
import { AyushHistory, Language, Patient } from '../../types';
import { translations } from '../../locales/translations';

interface KioskAyushModuleProps {
  language: Language;
  patient: Patient;
  onCompleteAyush: (ayushData: AyushHistory) => void;
  onBack: () => void;
  highContrast: boolean;
}

export const KioskAyushModule: React.FC<KioskAyushModuleProps> = ({
  language,
  onCompleteAyush,
  onBack,
  highContrast,
}) => {
  const t = translations[language];

  const [step, setStep] = useState(1);
  const [ayushState, setAyushState] = useState<AyushHistory>({
    prakriti: {
      primaryDosha: 'Vata-Pitta',
      details: 'Variable appetite, dry skin tendencies, quick physical response.',
    },
    agni: 'Mandagni (Sluggish)',
    koshtha: 'Krura (Hard/Constipated)',
    sara: 'Madhyama (Moderate)',
    samhanana: 'Medium',
    satmya: 'Eka-Rasa (Single taste habit)',
    sattva: 'Madhyama (Moderate)',
    aharaShakti: 'Moderate',
    vyayamaShakti: 'Moderate Endurance',
    vaya: 'Madhyamavastha',
    nidanaNotes: 'Irregular meal timings (Vishamashana) and day sleep reported.',
  });

  const handleFinish = () => {
    onCompleteAyush(ayushState);
  };

  return (
    <div className="flex-1 flex flex-col justify-center p-4 sm:p-6 max-w-4xl mx-auto w-full">
      <div
        className={`w-full rounded-[36px] p-6 sm:p-8 shadow-2xl transition-all ${
          highContrast
            ? 'bg-black border-4 border-yellow-400 text-white'
            : 'bg-white/80 backdrop-blur-xl border-2 border-white/60 text-slate-900 shadow-2xl ring-1 ring-slate-900/5'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center shadow-xs">
              <Leaf className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-widest text-emerald-700 font-black">
                Dashavidha Pariksha (दशविध परीक्षा) • Step {step} of 2
              </span>
              <h2 className="text-xl sm:text-3xl font-black text-blue-950">
                AYUSH / Ayurvedic Clinical Examination
              </h2>
            </div>
          </div>

          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/80 hover:bg-white text-slate-700 text-sm font-bold border border-white/80 shadow-xs transition active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.back}</span>
          </button>
        </div>

        {/* Notice */}
        <div className="mb-6 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-900 font-bold shadow-xs">
          <AlertCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Ayurvedic history intake module. Final Rogi-Roga Pariksha is performed by the consulting Vaidya.</span>
        </div>

        {/* Step 1: Agni, Koshtha, and Prakriti Selection */}
        {step === 1 && (
          <div className="space-y-6">
            {/* Prakriti */}
            <div>
              <label className="block text-sm font-black text-slate-800 mb-2">
                1. {t.prakritiLabel} (Primary Constitutional Tendency)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { val: 'Vata', label: 'Vata (वात प्रधान - Light/Dry)' },
                  { val: 'Pitta', label: 'Pitta (पित्त प्रधान - Sharp/Heat)' },
                  { val: 'Kapha', label: 'Kapha (कफ प्रधान - Heavy/Cool)' },
                  { val: 'Vata-Pitta', label: 'Vata-Pitta (द्वि-दोषज)' },
                  { val: 'Pitta-Kapha', label: 'Pitta-Kapha (द्वि-दोषज)' },
                  { val: 'Vata-Kapha', label: 'Vata-Kapha (द्वि-दोषज)' },
                  { val: 'Tridoshic', label: 'Sama Prakriti (त्रिदोष सम)' },
                ].map((p) => (
                  <button
                    key={p.val}
                    type="button"
                    onClick={() =>
                      setAyushState({
                        ...ayushState,
                        prakriti: { ...ayushState.prakriti, primaryDosha: p.val as any },
                      })
                    }
                    className={`p-3.5 rounded-2xl border text-xs font-bold text-left transition cursor-pointer shadow-xs ${
                      ayushState.prakriti.primaryDosha === p.val
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-1 ring-emerald-400 shadow-sm'
                        : 'bg-white/70 hover:bg-white border-white/80 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Agni (Digestive Fire) */}
            <div>
              <label className="block text-sm font-black text-slate-800 mb-2">
                2. {t.agniLabel} (Digestive Fire)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { id: 'Samagni (Balanced)', title: 'Samagni (समाग्नि)', desc: 'Regular timely hunger, digestion without gas/heaviness' },
                  { id: 'Mandagni (Sluggish)', title: 'Mandagni (मंदाग्नि)', desc: 'Weak appetite, heaviness after food, delayed digestion' },
                  { id: 'Tikshnagni (Intense)', title: 'Tikshnagni (तीक्ष्णाग्नि)', desc: 'Excess burning hunger, acidity, hyper-metabolism' },
                  { id: 'Vishamagni (Irregular)', title: 'Vishamagni (विषमाग्नि)', desc: 'Erratic appetite, bloating, gas, variable digestion' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setAyushState({ ...ayushState, agni: item.id as any })}
                    className={`p-4 rounded-2xl border text-left transition cursor-pointer shadow-xs ${
                      ayushState.agni === item.id
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-1 ring-emerald-400 shadow-sm'
                        : 'bg-white/70 hover:bg-white border-white/80 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-black text-sm text-slate-900">{item.title}</div>
                    <div className="text-xs text-slate-600 font-medium mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Koshtha */}
            <div>
              <label className="block text-sm font-black text-slate-800 mb-2">
                3. {t.koshthaLabel} (Bowel Pattern)
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'Madhyama (Regular)', label: 'Madhyama (मध्यम - Normal regular bowel)' },
                  { id: 'Krura (Hard/Constipated)', label: 'Krura (क्रूर कोष्ठ - Hard/Constipated)' },
                  { id: 'Mrudu (Soft/Loose)', label: 'Mrudu (मृदु कोष्ठ - Frequent/Loose)' },
                ].map((k) => (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => setAyushState({ ...ayushState, koshtha: k.id as any })}
                    className={`p-3.5 rounded-2xl border text-xs font-bold text-left transition cursor-pointer shadow-xs ${
                      ayushState.koshtha === k.id
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-1 ring-emerald-400 shadow-sm'
                        : 'bg-white/70 hover:bg-white border-white/80 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {k.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition cursor-pointer active:scale-95"
              >
                <span>Continue to Sara & Ahara Assessment</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Sara, Samhanana, Ahara-Vihara */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Dhatu Sara */}
              <div>
                <label className="block text-xs font-black text-slate-600 uppercase mb-1.5">
                  4. Dhatu Sara (Tissue Excellence)
                </label>
                <select
                  value={ayushState.sara}
                  onChange={(e) => setAyushState({ ...ayushState, sara: e.target.value as any })}
                  className="w-full text-sm px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 font-medium focus:outline-none focus:border-emerald-600 shadow-xs"
                >
                  <option value="Uttama (Excellent)">Uttama (उत्तम सारता - Robust Vitality)</option>
                  <option value="Madhyama (Moderate)">Madhyama (मध्यम सारता - Moderate)</option>
                  <option value="Heena (Poor)">Heena (हीन सारता - Low Vitality)</option>
                </select>
              </div>

              {/* Sattva (Mental Strength) */}
              <div>
                <label className="block text-xs font-black text-slate-600 uppercase mb-1.5">
                  5. Sattva (Mental Constitution)
                </label>
                <select
                  value={ayushState.sattva}
                  onChange={(e) => setAyushState({ ...ayushState, sattva: e.target.value as any })}
                  className="w-full text-sm px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 font-medium focus:outline-none focus:border-emerald-600 shadow-xs"
                >
                  <option value="Pravara (High Mental Strength)">Pravara Sattva (प्रवर सत्व - High resilience)</option>
                  <option value="Madhyama (Moderate)">Madhyama Sattva (मध्यम सत्व)</option>
                  <option value="Avara (Low)">Avara Sattva (अवर सत्व - Sensitive to stress)</option>
                </select>
              </div>
            </div>

            {/* Ahara-Vihara & Nidana Notes */}
            <div>
              <label className="block text-xs font-black text-slate-600 uppercase mb-1.5">
                6. Ahara-Vihara & Lifestyle Habits (आहार-विहार व निदान)
              </label>
              <textarea
                rows={3}
                value={ayushState.nidanaNotes || ''}
                onChange={(e) => setAyushState({ ...ayushState, nidanaNotes: e.target.value })}
                placeholder="e.g. Day sleep (Divasvapna), spicy food craving, irregular dinner timings..."
                className="w-full p-4 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-emerald-600 shadow-xs"
              />
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-6 py-2.5 rounded-xl bg-white/80 hover:bg-white text-slate-700 text-sm font-bold border border-white/80 shadow-xs transition cursor-pointer"
              >
                Back
              </button>
              <button
                id="btn-complete-ayush"
                type="button"
                onClick={handleFinish}
                className="px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base shadow-xl shadow-emerald-600/30 flex items-center gap-2 transition active:scale-95 cursor-pointer"
              >
                <span>Save AYUSH History & Continue</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
