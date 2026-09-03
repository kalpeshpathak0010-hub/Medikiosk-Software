import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, ArrowRight, ArrowLeft, AlertTriangle, CheckCircle2, ShieldAlert, Sparkles, Edit3 } from 'lucide-react';
import { ChiefComplaintId, ClinicalQuestion, Language, Patient, QuestionAnswer, RedFlagAlert } from '../../types';
import { translations } from '../../locales/translations';
import { CHIEF_COMPLAINT_CATEGORIES, QUESTION_FLOWS, evaluateRedFlags } from '../../services/clinicalEngine';
import { audioService } from '../../services/audioService';

interface KioskHistoryQuestionnaireProps {
  language: Language;
  patient: Patient;
  onCompleteHistory: (answers: QuestionAnswer[], redFlagAlert: RedFlagAlert | null, complaintId: ChiefComplaintId) => void;
  onBack: () => void;
  onTriggerRedFlagModal: (alert: RedFlagAlert) => void;
  textSize: 'normal' | 'large' | 'extraLarge';
  highContrast: boolean;
}

export const KioskHistoryQuestionnaire: React.FC<KioskHistoryQuestionnaireProps> = ({
  language,
  patient,
  onCompleteHistory,
  onBack,
  onTriggerRedFlagModal,
  highContrast,
}) => {
  const t = translations[language];

  // History taking state
  const [selectedComplaintId, setSelectedComplaintId] = useState<ChiefComplaintId | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, QuestionAnswer>>({});
  
  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [isEditingTranscript, setIsEditingTranscript] = useState(false);
  const [activeSpeechStopFn, setActiveSpeechStopFn] = useState<(() => void) | null>(null);

  // Scale and selection state for current active question
  const [tempSelectedOptionIds, setTempSelectedOptionIds] = useState<string[]>([]);
  const [tempScaleValue, setTempScaleValue] = useState<number>(5);

  const activeFlow: ClinicalQuestion[] = selectedComplaintId ? QUESTION_FLOWS[selectedComplaintId] || [] : [];
  const currentQuestion: ClinicalQuestion | undefined = selectedComplaintId ? activeFlow[currentQuestionIndex] : undefined;

  // Auto-speak question on transition for low-literacy accessibility
  useEffect(() => {
    if (!selectedComplaintId) {
      audioService.speak(t.chiefComplaintPrompt, language);
    } else if (currentQuestion) {
      const textToSpeak = currentQuestion.audioPrompt?.[language] || currentQuestion.questionText[language];
      audioService.speak(textToSpeak, language);
    }

    return () => {
      audioService.stopSpeaking();
      if (activeSpeechStopFn) activeSpeechStopFn();
    };
  }, [selectedComplaintId, currentQuestionIndex, language]);

  // Handle voice speech recording toggle
  const toggleVoiceRecording = () => {
    if (isRecording) {
      if (activeSpeechStopFn) activeSpeechStopFn();
      setIsRecording(false);
    } else {
      setIsRecording(true);
      setVoiceTranscript('');
      
      const stopFn = audioService.startSpeechRecognition(
        language,
        (transcript, isFinal) => {
          setVoiceTranscript(transcript);
          if (isFinal) {
            setIsRecording(false);
          }
        },
        () => {
          setIsRecording(false);
          // Fallback demo transcript if Web Speech API mic is blocked/unavailable
          if (!selectedComplaintId) {
            setVoiceTranscript(
              language === 'hi'
                ? 'मुझे अचानक छाती में भारी दबाव और पसीना आ रहा है'
                : language === 'mr'
                ? 'माझ्या छातीत दुखत असून धाप लागत आहे'
                : 'I have severe sudden chest pain and feeling breathless with cold sweating'
            );
          } else {
            setVoiceTranscript(
              language === 'hi' ? 'लगभग 45 मिनट पहले अचानक शुरू हुआ' : 'Started suddenly about 45 minutes ago'
            );
          }
        }
      );
      setActiveSpeechStopFn(() => stopFn);

      // Auto-populate simulated response after 3.5 seconds if speech recognition is silent
      setTimeout(() => {
        setIsRecording((prev) => {
          if (prev) {
            setVoiceTranscript((curr) =>
              curr ||
              (language === 'hi'
                ? 'छाती में तेज दबाव और पसीना आ रहा है'
                : 'Severe chest pain radiating to left arm with sweating')
            );
            return false;
          }
          return false;
        });
      }, 3500);
    }
  };

  // Chief Complaint selection
  const handleSelectChiefComplaint = (complaintId: ChiefComplaintId) => {
    setSelectedComplaintId(complaintId);
    setCurrentQuestionIndex(0);
    setTempSelectedOptionIds([]);

    const cat = CHIEF_COMPLAINT_CATEGORIES.find((c) => c.id === complaintId);
    const answer: QuestionAnswer = {
      questionId: 'chief_complaint',
      questionText: t.chiefComplaintPrompt,
      selectedOptionIds: [complaintId],
      selectedOptionLabels: [cat?.label[language] || complaintId],
      transcription: voiceTranscript,
      isVoiceInput: !!voiceTranscript,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };

    setAnswers((prev) => ({ ...prev, chief_complaint: answer }));
  };

  // Option selection for current question
  const toggleOption = (optionId: string, isSingleChoice: boolean) => {
    if (isSingleChoice) {
      setTempSelectedOptionIds([optionId]);
    } else {
      if (tempSelectedOptionIds.includes(optionId)) {
        setTempSelectedOptionIds(tempSelectedOptionIds.filter((id) => id !== optionId));
      } else {
        // If selecting none option, clear others
        if (optionId.includes('none')) {
          setTempSelectedOptionIds([optionId]);
        } else {
          setTempSelectedOptionIds([...tempSelectedOptionIds.filter((id) => !id.includes('none')), optionId]);
        }
      }
    }
  };

  // Proceed to next question or complete questionnaire
  const handleNextQuestion = () => {
    if (!currentQuestion || !selectedComplaintId) return;

    const selectedOptionLabels = (currentQuestion.options || [])
      .filter((opt) => tempSelectedOptionIds.includes(opt.id))
      .map((opt) => opt.label[language]);

    const newAnswer: QuestionAnswer = {
      questionId: currentQuestion.id,
      questionText: currentQuestion.questionText[language],
      selectedOptionIds: tempSelectedOptionIds,
      selectedOptionLabels:
        currentQuestion.type === 'scale'
          ? [`${tempScaleValue} / 10`]
          : selectedOptionLabels.length > 0
          ? selectedOptionLabels
          : [voiceTranscript || 'Reported'],
      scaleValue: currentQuestion.type === 'scale' ? tempScaleValue : undefined,
      textValue: voiceTranscript,
      isVoiceInput: !!voiceTranscript,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedAnswers: Record<string, QuestionAnswer> = { ...answers, [currentQuestion.id]: newAnswer };
    setAnswers(updatedAnswers);

    // Collect all options selected so far to evaluate red flags
    const answersList: QuestionAnswer[] = Object.values(updatedAnswers);
    const allSelectedOptionIds = answersList.flatMap((a) => a.selectedOptionIds || []);
    const scaleValues: Record<string, number> = {};
    answersList.forEach((a) => {
      if (a.scaleValue !== undefined) {
        scaleValues[a.questionId] = a.scaleValue;
      }
    });

    const evaluatedRedFlag = evaluateRedFlags(
      selectedComplaintId,
      allSelectedOptionIds,
      scaleValues,
      patient.id,
      'A-127'
    );

    // If red-flag detected on this step, trigger modal immediately
    if (evaluatedRedFlag && !updatedAnswers['has_alerted_rf']) {
      onTriggerRedFlagModal(evaluatedRedFlag);
      updatedAnswers['has_alerted_rf'] = {
        questionId: 'has_alerted_rf',
        questionText: 'Red Flag Alert Triggered',
        timestamp: new Date().toISOString(),
      };
    }

    // Advance or finish
    if (currentQuestionIndex + 1 < activeFlow.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setTempSelectedOptionIds([]);
      setVoiceTranscript('');
      setTempScaleValue(5);
    } else {
      // Finished all adaptive questions
      onCompleteHistory(Object.values(updatedAnswers), evaluatedRedFlag, selectedComplaintId);
    }
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
        {/* Header and Step Indicator */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase tracking-widest text-blue-600 font-black">
                {t.historyHeader} • {t.stepIndicator} {selectedComplaintId ? `${currentQuestionIndex + 1}` : '1'} {t.of} {selectedComplaintId ? `${activeFlow.length}` : '1'}
              </span>
            </div>
            <h2 className="text-xl sm:text-3xl font-black text-blue-950">
              {!selectedComplaintId
                ? t.chiefComplaintPrompt
                : currentQuestion?.questionText[language]}
            </h2>
          </div>

          <button
            onClick={() => {
              if (selectedComplaintId && currentQuestionIndex > 0) {
                setCurrentQuestionIndex(currentQuestionIndex - 1);
              } else if (selectedComplaintId) {
                setSelectedComplaintId(null);
              } else {
                onBack();
              }
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/80 hover:bg-white text-slate-700 text-sm font-bold border border-white/80 shadow-xs transition active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.back}</span>
          </button>
        </div>

        {/* 🎤 Voice Input Component with Recording Animation - Frosted Glass Container */}
        <div className="mb-6 p-4 sm:p-5 rounded-[24px] bg-white/70 backdrop-blur-md border border-white/80 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              id="btn-voice-input"
              type="button"
              onClick={toggleVoiceRecording}
              className={`w-16 h-16 sm:w-18 sm:h-18 rounded-2xl flex items-center justify-center shrink-0 transition-all transform active:scale-95 shadow-lg cursor-pointer ${
                isRecording
                  ? 'bg-rose-600 text-white ring-4 ring-rose-400/50 animate-pulse'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30'
              }`}
            >
              {isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
            </button>

            <div>
              <span className="text-xs uppercase tracking-wider font-extrabold text-blue-600 block">
                {isRecording ? '🔴 Listening...' : 'Voice History Intake (आवाज से बोलें)'}
              </span>
              <p className="text-sm font-bold text-slate-800">
                {isRecording ? t.listening : t.tapToSpeak}
              </p>
            </div>
          </div>

          {/* Real-time sound wave bars when recording */}
          {isRecording && (
            <div className="flex items-center gap-1.5 h-8 px-4">
              <span className="w-1.5 bg-rose-500 rounded-full animate-soundwave-1"></span>
              <span className="w-1.5 bg-rose-500 rounded-full animate-soundwave-2"></span>
              <span className="w-1.5 bg-rose-500 rounded-full animate-soundwave-3"></span>
              <span className="w-1.5 bg-rose-500 rounded-full animate-soundwave-4"></span>
              <span className="w-1.5 bg-rose-500 rounded-full animate-soundwave-5"></span>
            </div>
          )}

          {/* Transcribed Speech Box with inline edit */}
          {voiceTranscript && (
            <div className="w-full sm:flex-1 p-3 rounded-xl bg-blue-50/80 border border-blue-200 text-xs shadow-xs">
              <div className="flex items-center justify-between text-blue-900 mb-1">
                <span className="font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  {t.transcribedLabel}:
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditingTranscript(!isEditingTranscript)}
                  className="text-slate-500 hover:text-blue-700 flex items-center gap-1 font-bold cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              </div>

              {isEditingTranscript ? (
                <input
                  type="text"
                  value={voiceTranscript}
                  onChange={(e) => setVoiceTranscript(e.target.value)}
                  className="w-full bg-white text-slate-900 p-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-blue-600 font-medium"
                />
              ) : (
                <p className="text-slate-800 italic font-semibold">"{voiceTranscript}"</p>
              )}
            </div>
          )}
        </div>

        {/* Phase 1: Chief Complaint Grid */}
        {!selectedComplaintId && (
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-3">
              {t.typeOrSelect}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
              {CHIEF_COMPLAINT_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  id={`btn-complaint-${cat.id}`}
                  onClick={() => handleSelectChiefComplaint(cat.id)}
                  className="p-4 sm:p-5 rounded-[22px] bg-white/70 hover:bg-white border-2 border-white/80 hover:border-blue-400 text-left transition-all group active:scale-95 flex flex-col justify-between cursor-pointer min-h-[110px] shadow-sm hover:shadow-lg"
                >
                  <span className="text-base sm:text-lg font-black text-blue-950 group-hover:text-blue-600 block mb-2">
                    {cat.label[language]}
                  </span>
                  <span className="text-[11px] text-blue-600 font-bold">{cat.department}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Phase 2: Adaptive Follow-up Questions */}
        {selectedComplaintId && currentQuestion && (
          <div className="space-y-6">
            {/* Single / Multi Choice Options */}
            {(currentQuestion.type === 'single_choice' || currentQuestion.type === 'multi_choice') && currentQuestion.options && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {currentQuestion.options.map((opt) => {
                  const isSelected = tempSelectedOptionIds.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => toggleOption(opt.id, currentQuestion.type === 'single_choice')}
                      className={`p-4 sm:p-5 rounded-[22px] border-2 text-left transition-all active:scale-95 flex items-center justify-between gap-3 cursor-pointer shadow-sm ${
                        isSelected
                          ? opt.isRedFlagTrigger
                            ? 'bg-rose-50 border-rose-500 text-rose-950 shadow-md ring-1 ring-rose-400'
                            : 'bg-blue-50 border-blue-500 text-blue-950 shadow-md ring-1 ring-blue-400'
                          : 'bg-white/70 hover:bg-white border-white/80 text-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 ${
                            isSelected
                              ? opt.isRedFlagTrigger
                                ? 'bg-rose-600 border-rose-500 text-white'
                                : 'bg-blue-600 border-blue-500 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <span className="text-xs font-black">✓</span>}
                        </div>
                        <span className="text-base sm:text-lg font-bold">{opt.label[language]}</span>
                      </div>

                      {opt.isRedFlagTrigger && (
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                          Priority Flag
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Severity Scale (1 - 10) */}
            {currentQuestion.type === 'scale' && (
              <div className="p-6 rounded-2xl bg-white/70 backdrop-blur-md border border-white/80 space-y-6 shadow-sm">
                <div className="flex items-center justify-between text-sm font-black">
                  <span className="text-emerald-700">{currentQuestion.scaleLabels?.min[language] || '1 - Mild'}</span>
                  <span className="text-4xl font-black text-blue-700">{tempScaleValue} / 10</span>
                  <span className="text-rose-700">{currentQuestion.scaleLabels?.max[language] || '10 - Severe'}</span>
                </div>

                <input
                  type="range"
                  min={currentQuestion.minScale || 1}
                  max={currentQuestion.maxScale || 10}
                  value={tempScaleValue}
                  onChange={(e) => setTempScaleValue(parseInt(e.target.value, 10))}
                  className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />

                <div className="grid grid-cols-10 gap-1 text-center">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setTempScaleValue(num)}
                      className={`py-2 rounded-xl text-sm font-black transition cursor-pointer ${
                        tempScaleValue === num
                          ? num >= 8
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white/80 text-slate-700 hover:bg-white border border-slate-200'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Voice Prompt Only mode */}
            {currentQuestion.type === 'voice_prompt' && (
              <div className="p-6 rounded-2xl bg-white/70 backdrop-blur-md border border-white/80 text-center shadow-sm">
                <p className="text-sm text-slate-600 mb-4 font-medium">
                  Please tap the microphone button above to describe your condition, or enter text below:
                </p>
                <textarea
                  rows={3}
                  value={voiceTranscript}
                  onChange={(e) => setVoiceTranscript(e.target.value)}
                  placeholder="Describe symptoms, when it started, and any medicines taken..."
                  className="w-full p-4 rounded-xl bg-white border border-slate-300 text-slate-900 text-base focus:outline-none focus:border-blue-600 shadow-inner"
                />
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between items-center pt-4">
              <button
                type="button"
                onClick={() => {
                  if (currentQuestionIndex > 0) {
                    setCurrentQuestionIndex(currentQuestionIndex - 1);
                  } else {
                    setSelectedComplaintId(null);
                  }
                }}
                className="px-6 py-3 rounded-xl bg-white/80 hover:bg-white text-slate-700 text-sm font-bold border border-white/80 shadow-xs transition cursor-pointer"
              >
                {t.back}
              </button>

              <button
                id="btn-next-question"
                type="button"
                onClick={handleNextQuestion}
                disabled={
                  currentQuestion.type === 'single_choice' &&
                  tempSelectedOptionIds.length === 0 &&
                  !voiceTranscript
                }
                className="px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-extrabold text-base shadow-xl shadow-blue-600/30 flex items-center gap-2 transition cursor-pointer active:scale-95"
              >
                <span>{currentQuestionIndex + 1 === activeFlow.length ? 'Finish History & Continue' : t.next}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
