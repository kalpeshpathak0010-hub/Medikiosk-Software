import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RoleSwitcher, AppView } from './components/common/RoleSwitcher';
import { UnauthorizedAccessView } from './components/common/UnauthorizedAccessView';
import { KioskIdleTimeoutModal } from './components/common/KioskIdleTimeoutModal';
import { StaffLoginModal } from './components/common/StaffLoginModal';

import { KioskHome } from './components/kiosk/KioskHome';
import { KioskIdentification } from './components/kiosk/KioskIdentification';
import { KioskConsent } from './components/kiosk/KioskConsent';
import { KioskModeSelect } from './components/kiosk/KioskModeSelect';
import { KioskHistoryQuestionnaire } from './components/kiosk/KioskHistoryQuestionnaire';
import { KioskAyushModule } from './components/kiosk/KioskAyushModule';
import { KioskDocumentScanner } from './components/kiosk/KioskDocumentScanner';
import { KioskPatientReview } from './components/kiosk/KioskPatientReview';
import { KioskTokenSlip } from './components/kiosk/KioskTokenSlip';

import { DoctorDashboard } from './components/doctor/DoctorDashboard';
import { DoctorPatientWorkspace } from './components/doctor/DoctorPatientWorkspace';
import { DoctorTimelineView } from './components/doctor/DoctorTimelineView';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { DocumentProcessingView } from './components/pipeline/DocumentProcessingView';
import { AbdmArchitectureView } from './components/abdm/AbdmArchitectureView';
import { RedFlagModal } from './components/common/RedFlagModal';
import { HelpModal } from './components/common/HelpModal';

import {
  AppRoute,
  AyushHistory,
  ChiefComplaintId,
  ClinicalSummary,
  DocumentRecord,
  IntakeMode,
  Language,
  MedicalTimelineEvent,
  Patient,
  QuestionAnswer,
  RedFlagAlert,
} from './types';
import { generateClinicalSummaryFromAnswers } from './services/clinicalEngine';
import {
  savePatientRecord,
  createPatientEncounter,
  updateClinicalSummaryInDb,
  subscribeToPatients,
  subscribeToSummaries,
  saveClinicalSession,
  saveClinicalSessionDetails,
  getClinicalSessionData,
} from './services/dbService';
import { logAuditEvent } from './services/auditService';
import { ErrorBoundary } from './components/common/ErrorBoundary';

type KioskStep =
  | 'home'
  | 'identify'
  | 'consent'
  | 'mode_select'
  | 'history_taking'
  | 'ayush_pariksha'
  | 'documents'
  | 'review'
  | 'token';

function getAppRouteFromLocation(): AppRoute {
  // 1. Check pathname first (e.g. /doctor, /admin, /kiosk, /timeline, /ocr_pipeline, /abdm)
  const path = window.location.pathname.replace(/^\/+/, '').split('/')[0].toLowerCase();
  if (['kiosk', 'doctor', 'admin', 'timeline', 'ocr_pipeline', 'abdm'].includes(path)) {
    return path as AppRoute;
  }
  // 2. Check hash fallback (e.g. #/doctor, #doctor, #/admin)
  const hash = window.location.hash.replace(/^#\/?/, '').split('/')[0].toLowerCase();
  if (['kiosk', 'doctor', 'admin', 'timeline', 'ocr_pipeline', 'abdm'].includes(hash)) {
    return hash as AppRoute;
  }
  return 'kiosk';
}

function MainAppRouter() {
  const { currentUser, currentRole, canAccessRoute, isAuthLoading } = useAuth();

  // Active View & Route sync from URL pathname or hash
  const [currentView, setCurrentView] = useState<AppRoute>(getAppRouteFromLocation());
  const [isKioskFullscreen, setIsKioskFullscreen] = useState(false);
  const [isStaffLoginOpen, setIsStaffLoginOpen] = useState(false);

  // Kiosk Terminal State
  const [kioskStep, setKioskStep] = useState<KioskStep>('home');
  const [language, setLanguage] = useState<Language>('hi');
  const [textSize, setTextSize] = useState<'normal' | 'large' | 'extraLarge'>('normal');
  const [highContrast, setHighContrast] = useState(false);

  // Global State (for Doctor & Admin views) with Firestore as single source of truth
  const [patients, setPatients] = useState<Patient[]>([]);
  const [summaries, setSummaries] = useState<Record<string, ClinicalSummary>>({});
  const [redFlags, setRedFlags] = useState<RedFlagAlert[]>([]);
  const [patientTimelineEvents, setPatientTimelineEvents] = useState<MedicalTimelineEvent[]>([]);

  // Firestore Real-Time Subscriptions
  useEffect(() => {
    const unsubPatients = subscribeToPatients((livePatients) => {
      setPatients(livePatients);
    });

    const unsubSummaries = subscribeToSummaries((liveSummaries) => {
      setSummaries(liveSummaries);

      // Dynamically extract red flags from live summaries
      const collected: RedFlagAlert[] = [];
      Object.values(liveSummaries).forEach((sum) => {
        if (sum.redFlags && sum.redFlags.length > 0) {
          collected.push({
            id: `RF-${sum.patientId}`,
            patientId: sum.patientId,
            tokenNumber: sum.tokenNumber || 'A-100',
            symptoms: sum.redFlags,
            description: `Triage Red Flag: ${sum.redFlags.join(', ')}`,
            timestamp: sum.timestamp || new Date().toISOString(),
            priority: 'HIGH',
            department: sum.patientInfo?.department || 'General Medicine',
            isAcknowledged: false,
          });
        }
      });
      setRedFlags(collected);
    });

    return () => {
      unsubPatients();
      unsubSummaries();
    };
  }, []);

  // Active Patient Session
  const [currentPatient, setCurrentPatient] = useState<Patient>({
    id: 'pat-walkin',
    name: 'Walk-in Patient',
    age: 35,
    gender: 'Other',
    phone: '',
    isExistingPatient: false,
  });
  const [selectedIntakeMode, setSelectedIntakeMode] = useState<IntakeMode>('modern');
  const [intakeAnswers, setIntakeAnswers] = useState<QuestionAnswer[]>([]);
  const [activeRedFlag, setActiveRedFlag] = useState<RedFlagAlert | null>(null);
  const [activeComplaintId, setActiveComplaintId] = useState<ChiefComplaintId>('chest_pain');
  const [uploadedDocs, setUploadedDocs] = useState<DocumentRecord[]>([]);
  const [ayushData, setAyushData] = useState<AyushHistory | undefined>(undefined);

  // Generated Summary for active session
  const [generatedSummary, setGeneratedSummary] = useState<ClinicalSummary>({
    id: `SUM-${Date.now()}`,
    patientId: 'pat-walkin',
    visitId: `VIS-${Date.now()}`,
    tokenNumber: 'A-101',
    timestamp: new Date().toISOString(),
    isDraft: true,
    status: 'DRAFT_PENDING_REVIEW',
    intakeMode: 'modern',
    patientInfo: {
      name: 'Walk-in Patient',
      age: 35,
      gender: 'Other',
      phone: '',
      department: 'General Medicine',
    },
    chiefComplaint: '',
    historyOfPresentIllness: '',
    pastMedicalHistory: [],
    pastSurgicalHistory: [],
    currentMedications: [],
    drugAllergies: [],
    familyHistory: [],
    personalHistory: {
      diet: 'Mixed',
      smoking: 'No',
      alcohol: 'No',
      sleep: 'Normal',
      bowelBladder: 'Normal',
    },
    reviewOfSystems: [],
    previousInvestigations: [],
    documentSummary: '',
    redFlags: [],
    importantNotes: '',
    isPhysicianVerified: false,
    sourceDocumentIds: [],
    intakeTimestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  });

  // Doctor Workspace State
  const [doctorSelectedPatientId, setDoctorSelectedPatientId] = useState<string>('');
  const [doctorSelectedSessionId, setDoctorSelectedSessionId] = useState<string>('');

  // Modals & Inactivity Guard
  const [urgentModalAlert, setUrgentModalAlert] = useState<RedFlagAlert | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isNurseAlertToast, setIsNurseAlertToast] = useState(false);
  const [showIdleTimeoutModal, setShowIdleTimeoutModal] = useState(false);
  const lastActivityRef = useRef<number>(Date.now());

  // URL and Protected Route Synchronization
  const navigateTo = useCallback(
    (targetRoute: AppRoute) => {
      const targetPath = `/${targetRoute}`;
      if (window.location.pathname !== targetPath) {
        window.history.pushState(null, '', targetPath);
      }
      window.location.hash = `#/${targetRoute}`;
      setCurrentView(targetRoute);
    },
    []
  );

  // Listen to popstate and hashchange events
  useEffect(() => {
    const handleUrlChange = () => {
      const route = getAppRouteFromLocation();
      setCurrentView(route);
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    handleUrlChange(); // initial sync

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  // Cross-device session loader for Doctor Workspace
  useEffect(() => {
    if (
      doctorSelectedSessionId &&
      (!patients.some((p) => p.id === doctorSelectedPatientId) ||
        !summaries[doctorSelectedPatientId])
    ) {
      getClinicalSessionData(doctorSelectedSessionId)
        .then((data) => {
          if (data) {
            if (data.patient) {
              setPatients((prev) =>
                prev.some((p) => p.id === data.patient.id) ? prev : [data.patient, ...prev]
              );
            }
            if (data.summary) {
              setSummaries((prev) => ({
                ...prev,
                [data.patient?.id || doctorSelectedPatientId]: data.summary,
              }));
            }
            if (data.redFlag) {
              setRedFlags((prev) =>
                prev.some((rf) => rf.patientId === (data.patient?.id || doctorSelectedPatientId))
                  ? prev
                  : [data.redFlag, ...prev]
              );
            }
          }
        })
        .catch(() => {});
    }
  }, [doctorSelectedSessionId, doctorSelectedPatientId, patients, summaries]);

  // Kiosk Inactivity Privacy Guard
  useEffect(() => {
    // Only monitor idle timeout in active kiosk intake (not home or token screen)
    if (currentView !== 'kiosk' || kioskStep === 'home' || kioskStep === 'token') {
      setShowIdleTimeoutModal(false);
      return;
    }

    const resetTimer = () => {
      lastActivityRef.current = Date.now();
    };

    const events = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll'];
    events.forEach((evt) => window.addEventListener(evt, resetTimer, { passive: true }));

    const checkInterval = setInterval(() => {
      const now = Date.now();
      const idleTime = now - lastActivityRef.current;
      // 60 seconds of inactivity -> show privacy countdown warning ('Are you still there?')
      if (idleTime > 60000 && !showIdleTimeoutModal) {
        setShowIdleTimeoutModal(true);
      }
    }, 3000);

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, resetTimer));
      clearInterval(checkInterval);
    };
  }, [currentView, kioskStep, showIdleTimeoutModal]);

  // Nurse Emergency Trigger
  const handleCallNurse = () => {
    setIsNurseAlertToast(true);
    setTimeout(() => setIsNurseAlertToast(false), 5000);
  };

  // Kiosk workflow transitions
  const handleStartNewVisit = () => {
    setKioskStep('identify');
  };

  const handlePatientIdentified = (patient: Patient) => {
    setCurrentPatient(patient);
    if (summaries[patient.id]) {
      setGeneratedSummary(summaries[patient.id]);
    }
    setKioskStep('consent');
  };

  const handleConsentAgreed = () => {
    setKioskStep('mode_select');
  };

  const handleSelectMode = (mode: IntakeMode) => {
    setSelectedIntakeMode(mode);
    setKioskStep('history_taking');
  };

  const handleCompleteHistory = (
    answers: QuestionAnswer[],
    redFlagAlert: RedFlagAlert | null,
    complaintId: ChiefComplaintId
  ) => {
    setIntakeAnswers(answers);
    setActiveRedFlag(redFlagAlert);
    setActiveComplaintId(complaintId);

    if (redFlagAlert) {
      setRedFlags((prev) => {
        const filtered = prev.filter((r) => r.patientId !== currentPatient.id);
        return [redFlagAlert, ...filtered];
      });
    }

    if (selectedIntakeMode === 'ayush') {
      setKioskStep('ayush_pariksha');
    } else {
      setKioskStep('documents');
    }
  };

  const handleCompleteAyush = (ayushHistoryData: AyushHistory) => {
    setAyushData(ayushHistoryData);
    setKioskStep('documents');
  };

  const handleDocumentsConfirmed = (docs: DocumentRecord[], newEvents: MedicalTimelineEvent[]) => {
    setUploadedDocs(docs);
    if (newEvents.length > 0) {
      setPatientTimelineEvents((prev) => [...newEvents, ...prev]);
    }

    const summary = generateClinicalSummaryFromAnswers(
      currentPatient,
      intakeAnswers,
      docs,
      selectedIntakeMode,
      ayushData,
      activeComplaintId
    );

    setGeneratedSummary(summary);
    setSummaries((prev) => ({ ...prev, [currentPatient.id]: summary }));
    setKioskStep('review');
  };

  const handleSkipDocuments = () => {
    const summary = generateClinicalSummaryFromAnswers(
      currentPatient,
      intakeAnswers,
      [],
      selectedIntakeMode,
      ayushData,
      activeComplaintId
    );
    setGeneratedSummary(summary);
    setSummaries((prev) => ({ ...prev, [currentPatient.id]: summary }));
    setKioskStep('review');
  };

  const handlePatientSubmitIntake = async () => {
    if (!patients.some((p) => p.id === currentPatient.id)) {
      setPatients((prev) => [currentPatient, ...prev]);
    }
    setSummaries((prev) => ({ ...prev, [currentPatient.id]: generatedSummary }));
    setKioskStep('token');

    // Async Firestore Persistence for multi-device clinical system
    try {
      await savePatientRecord(currentPatient);
      const encounterId = await createPatientEncounter(
        currentPatient,
        generatedSummary,
        activeRedFlag,
        selectedIntakeMode
      );
      await updateClinicalSummaryInDb(generatedSummary);

      const newSessionId = `MK-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
      await saveClinicalSession({
        sessionId: newSessionId,
        patientId: currentPatient.id,
        patientName: currentPatient.name,
        patientAge: currentPatient.age,
        patientGender: currentPatient.gender,
        chiefComplaint: generatedSummary.chiefComplaint || activeComplaintId || 'Clinical Intake Consultation',
        status: 'completed',
        summaryStatus: 'ready',
        redFlagStatus: activeRedFlag ? (activeRedFlag.priority === 'URGENT' || activeRedFlag.priority === 'HIGH' ? 'urgent' : 'attention') : 'none',
        hasRedFlag: Boolean(activeRedFlag),
        tokenNumber: generatedSummary.tokenNumber || `A-${((Date.now() % 900) + 100).toString()}`,
        kioskStationId: 'Kiosk-01 (Ground Floor OPD)',
        startedAt: new Date(Date.now() - 600000).toISOString(),
        completedAt: new Date().toISOString(),
      });

      await saveClinicalSessionDetails(newSessionId, {
        patient: currentPatient,
        summary: generatedSummary,
        redFlag: activeRedFlag,
        intakeAnswers,
      });

      logAuditEvent({
        action: 'PATIENT_CREATED',
        role: 'PATIENT',
        userId: currentPatient.id,
        entityType: 'PATIENT',
        entityId: currentPatient.id,
        metadata: { name: currentPatient.name, age: currentPatient.age },
      });

      logAuditEvent({
        action: 'CONSENT_RECORDED',
        role: 'PATIENT',
        userId: currentPatient.id,
        entityType: 'PATIENT',
        entityId: currentPatient.id,
        metadata: { consentGranted: true, timestamp: new Date().toISOString() },
      });

      logAuditEvent({
        action: 'ENCOUNTER_CREATED',
        role: 'PATIENT',
        userId: currentPatient.id,
        entityType: 'ENCOUNTER',
        entityId: encounterId,
        metadata: {
          intakeMode: selectedIntakeMode,
          chiefComplaint: activeComplaintId,
          hasRedFlag: Boolean(activeRedFlag),
        },
      });
    } catch (err) {
      console.warn('Encounter persistence notice:', err);
    }
  };

  const handleResetKiosk = () => {
    setKioskStep('home');
    setCurrentPatient({
      id: `pat-${Date.now()}`,
      name: '',
      age: 0,
      gender: 'Male',
      phone: '',
      bloodGroup: 'B+',
      isExistingPatient: false,
    });
    setIntakeAnswers([]);
    setActiveRedFlag(null);
    setUploadedDocs([]);
    setAyushData(undefined);
    setShowIdleTimeoutModal(false);
    lastActivityRef.current = Date.now();
  };

  // Text size wrapper classes
  const getTextSizeWrapperClass = () => {
    if (textSize === 'large') return 'text-lg';
    if (textSize === 'extraLarge') return 'text-xl';
    return 'text-base';
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white font-sans">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center font-black text-xl mb-4 shadow-lg shadow-blue-500/30 animate-pulse text-white">
          M
        </div>
        <p className="text-sm font-bold tracking-tight text-slate-200">Initializing MediKiosk Clinical System...</p>
        <p className="text-xs text-slate-500 mt-1">Connecting to Firebase Auth & Cloud Firestore</p>
      </div>
    );
  }

  const isAccessBlocked = currentView !== 'kiosk' && !canAccessRoute(currentView);
  const blockedTarget = currentView;

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors relative overflow-x-hidden ${
        highContrast ? 'bg-black text-yellow-300' : 'bg-slate-100 text-slate-900'
      } ${getTextSizeWrapperClass()}`}
    >
      {/* Top Application Header & Unified Navigation */}
      <RoleSwitcher
        currentView={isAccessBlocked ? blockedTarget : currentView}
        onSelectView={(route) => navigateTo(route)}
        redFlagsCount={redFlags.length}
        isKioskFullscreenMode={isKioskFullscreen}
        onToggleKioskFullscreen={() => setIsKioskFullscreen(!isKioskFullscreen)}
        language={language}
        onLanguageChange={setLanguage}
        textSize={textSize}
        onTextSizeChange={setTextSize}
        highContrast={highContrast}
        onToggleHighContrast={() => setHighContrast(!highContrast)}
        onOpenHelp={() => setIsHelpOpen(true)}
        onCallStaff={handleCallNurse}
      />

      {/* ========================================================================= */}
      {/* ROUTE GUARD: UNAUTHORIZED ACCESS INTERCEPTOR */}
      {/* ========================================================================= */}
      {isAccessBlocked ? (
        <UnauthorizedAccessView
          attemptedRoute={blockedTarget}
          onNavigate={(route) => navigateTo(route)}
        />
      ) : (
        <>
          {/* VIEW 1: PATIENT TOUCHSCREEN KIOSK */}
          {currentView === 'kiosk' && (
            <div className="flex-1 flex flex-col relative z-10">
              {/* Kiosk Workflow Screen Router */}
              <main className="flex-1 flex flex-col relative z-10">
                <ErrorBoundary
                  fallbackTitle="Kiosk Screen Issue"
                  fallbackMessage="An unexpected issue occurred on this screen. Tap reload to continue your visit seamlessly."
                  onReset={handleResetKiosk}
                >
                  {kioskStep === 'home' && (
                    <KioskHome
                      language={language}
                      onLanguageChange={setLanguage}
                      onStartNewVisit={handleStartNewVisit}
                      onContinueExistingVisit={() => setKioskStep('identify')}
                      textSize={textSize}
                      highContrast={highContrast}
                    />
                  )}

                  {kioskStep === 'identify' && (
                    <KioskIdentification
                      language={language}
                      onPatientIdentified={handlePatientIdentified}
                      onBack={() => setKioskStep('home')}
                      textSize={textSize}
                      highContrast={highContrast}
                    />
                  )}

                  {kioskStep === 'consent' && (
                    <KioskConsent
                      language={language}
                      patient={currentPatient}
                      onAgree={handleConsentAgreed}
                      onDisagree={() => setKioskStep('home')}
                      onBack={() => setKioskStep('identify')}
                      textSize={textSize}
                      highContrast={highContrast}
                    />
                  )}

                  {kioskStep === 'mode_select' && (
                    <KioskModeSelect
                      language={language}
                      onSelectMode={handleSelectMode}
                      onBack={() => setKioskStep('consent')}
                      textSize={textSize}
                      highContrast={highContrast}
                    />
                  )}

                  {kioskStep === 'history_taking' && (
                    <KioskHistoryQuestionnaire
                      language={language}
                      patient={currentPatient}
                      onCompleteHistory={handleCompleteHistory}
                      onBack={() => setKioskStep('mode_select')}
                      onTriggerRedFlagModal={(alert) => setUrgentModalAlert(alert)}
                      textSize={textSize}
                      highContrast={highContrast}
                    />
                  )}

                  {kioskStep === 'ayush_pariksha' && (
                    <KioskAyushModule
                      language={language}
                      patient={currentPatient}
                      onCompleteAyush={handleCompleteAyush}
                      onBack={() => setKioskStep('history_taking')}
                      highContrast={highContrast}
                    />
                  )}

                  {kioskStep === 'documents' && (
                    <KioskDocumentScanner
                      language={language}
                      patient={currentPatient}
                      onDocumentsConfirmed={handleDocumentsConfirmed}
                      onSkip={handleSkipDocuments}
                      onBack={() =>
                        setKioskStep(selectedIntakeMode === 'ayush' ? 'ayush_pariksha' : 'history_taking')
                      }
                      highContrast={highContrast}
                    />
                  )}

                  {kioskStep === 'review' && (
                    <KioskPatientReview
                      language={language}
                      patient={currentPatient}
                      summary={generatedSummary}
                      onEditSection={(sec) => {
                        if (sec === 'patient') setKioskStep('identify');
                        else if (sec === 'history' || sec === 'complaint') setKioskStep('history_taking');
                        else if (sec === 'medications') setKioskStep('documents');
                      }}
                      onSubmit={handlePatientSubmitIntake}
                      onBack={() => setKioskStep('documents')}
                      highContrast={highContrast}
                    />
                  )}

                  {kioskStep === 'token' && (
                    <KioskTokenSlip
                      language={language}
                      patient={currentPatient}
                      summary={generatedSummary}
                      redFlag={activeRedFlag}
                      onDone={handleResetKiosk}
                      highContrast={highContrast}
                    />
                  )}
                </ErrorBoundary>
              </main>
            </div>
          )}

          {/* VIEW 2: DOCTOR CLINICAL WORKSPACE & OPD QUEUE */}
          {currentView === 'doctor' && (
            <div className="flex-1 flex flex-col relative z-10">
              <ErrorBoundary fallbackTitle="Doctor Workspace Error" fallbackMessage="Could not load patient workspace. Tap reload to return to the queue.">
                {doctorSelectedPatientId ? (
                  <DoctorPatientWorkspace
                    patient={
                      patients.find((p) => p.id === doctorSelectedPatientId) || {
                        id: doctorSelectedPatientId || 'pat-new',
                        name: 'Intake Patient',
                        age: 42,
                        gender: 'Male',
                        phone: '+91 98201 12345',
                        bloodGroup: 'B+',
                        isExistingPatient: false,
                      }
                    }
                    summary={summaries[doctorSelectedPatientId] || generatedSummary}
                    redFlag={redFlags.find((rf) => rf.patientId === doctorSelectedPatientId)}
                    sessionId={doctorSelectedSessionId}
                    documents={uploadedDocs.filter((d) => d.patientId === doctorSelectedPatientId)}
                    onBackToQueue={() => {
                      setDoctorSelectedPatientId('');
                      setDoctorSelectedSessionId('');
                    }}
                    onUpdateSummary={(updated) => {
                      setSummaries((prev) => ({ ...prev, [updated.patientId]: updated }));
                      updateClinicalSummaryInDb(updated).catch(() => {});
                      logAuditEvent({
                        action: 'SUMMARY_EDITED',
                        role: 'DOCTOR',
                        userId: currentUser.id,
                        entityType: 'SUMMARY',
                        entityId: updated.patientId,
                        metadata: {
                          editedBy: currentUser.name,
                          hasPhysicianNotes: Boolean(updated.physicianNotes),
                          isVerified: Boolean(updated.isPhysicianVerified),
                        },
                      });
                    }}
                    onOpenTimeline={() => navigateTo('timeline')}
                  />
                ) : (
                  <DoctorDashboard
                    patients={patients}
                    summaries={summaries}
                    redFlags={redFlags}
                    onSelectPatient={(id, sessId) => {
                      setDoctorSelectedPatientId(id);
                      setDoctorSelectedSessionId(sessId || '');
                    }}
                    selectedPatientId={doctorSelectedPatientId}
                  />
                )}
              </ErrorBoundary>
            </div>
          )}

          {/* VIEW 3: LONGITUDINAL MEDICAL TIMELINE */}
          {currentView === 'timeline' && (
            <div className="flex-1 flex flex-col relative z-10">
              <ErrorBoundary fallbackTitle="Timeline View Error">
                <DoctorTimelineView
                  patient={patients.find((p) => p.id === (doctorSelectedPatientId || 'pat-001')) || patients[0]}
                  events={patientTimelineEvents}
                  onBack={() => navigateTo('doctor')}
                />
              </ErrorBoundary>
            </div>
          )}

          {/* VIEW 4: OCR & DOCUMENT AI PIPELINE INSPECTOR */}
          {currentView === 'ocr_pipeline' && (
            <div className="flex-1 flex flex-col relative z-10">
              <ErrorBoundary fallbackTitle="OCR Pipeline Inspector Error">
                <DocumentProcessingView documents={uploadedDocs} />
              </ErrorBoundary>
            </div>
          )}

          {/* VIEW 5: ADMIN & KIOSK TELEMETRY */}
          {currentView === 'admin' && (
            <div className="flex-1 flex flex-col relative z-10">
              <ErrorBoundary fallbackTitle="Admin Dashboard Error">
                <AdminDashboard />
              </ErrorBoundary>
            </div>
          )}

          {/* VIEW 6: ABDM FHIR ARCHITECTURE SPECS */}
          {currentView === 'abdm' && (
            <div className="flex-1 flex flex-col relative z-10">
              <ErrorBoundary fallbackTitle="ABDM Architecture View Error">
                <AbdmArchitectureView patients={patients} summaries={summaries} />
              </ErrorBoundary>
            </div>
          )}
        </>
      )}

      {/* EMERGENCY RED-FLAG MODAL */}
      {urgentModalAlert && (
        <RedFlagModal
          alert={urgentModalAlert}
          language={language}
          onAcknowledge={() => setUrgentModalAlert(null)}
          onCallNurse={() => {
            handleCallNurse();
            setUrgentModalAlert(null);
          }}
        />
      )}

      {/* HELP INSTRUCTIONS MODAL */}
      {isHelpOpen && <HelpModal language={language} onClose={() => setIsHelpOpen(false)} />}

      {/* STAFF PIN LOGIN MODAL */}
      <StaffLoginModal
        isOpen={isStaffLoginOpen}
        onClose={() => setIsStaffLoginOpen(false)}
        onSuccess={() => navigateTo('doctor')}
      />

      {/* PATIENT KIOSK PRIVACY INACTIVITY MODAL */}
      {showIdleTimeoutModal && (
        <KioskIdleTimeoutModal
          language={language}
          onStayActive={() => {
            setShowIdleTimeoutModal(false);
            lastActivityRef.current = Date.now();
          }}
          onResetSession={handleResetKiosk}
        />
      )}

      {/* Institutional Public-Service Footer */}
      <footer className="w-full bg-white border-t border-slate-200 py-3.5 px-4 sm:px-6 text-xs text-slate-500 relative z-20">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <p className="font-semibold text-slate-700">MediKiosk • Digital Clinical History & Document Assistance</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Designed with institutional public-health service principles. All clinical summaries require physician review.</p>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={() => setIsHelpOpen(true)}
              className="hover:text-slate-800 underline underline-offset-2 transition cursor-pointer"
            >
              Accessibility & Help
            </button>
            <span className="text-slate-300">•</span>
            <button
              onClick={() => setIsStaffLoginOpen(true)}
              className="text-slate-400 hover:text-slate-700 font-medium transition cursor-pointer"
              title="Authorized Clinical & Admin Access"
            >
              Staff Portal
            </button>
          </div>
        </div>
      </footer>

      {/* EMERGENCY NURSE CALL TOAST */}
      {isNurseAlertToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-rose-600 text-white px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-3 border-2 border-rose-400 animate-bounce">
          <span className="w-3 h-3 rounded-full bg-white animate-ping"></span>
          <span className="font-extrabold text-sm">
            🚨 Nurse & Triage Staff Alerted to Kiosk Station #3!
          </span>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppRouter />
    </AuthProvider>
  );
}
