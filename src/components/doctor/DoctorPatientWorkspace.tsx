import React, { useState, useEffect, useMemo } from 'react';
import { Stethoscope, ShieldAlert, CheckCircle2, AlertTriangle, FileText, Clock, Edit3, Save, Printer, Download, Sparkles, User, HeartPulse, Leaf, ArrowLeft, ExternalLink } from 'lucide-react';
import { ClinicalSummary, DocumentRecord, MedicalTimelineEvent, Patient, RedFlagAlert } from '../../types';
import { DEMO_DOCUMENTS, DEMO_TIMELINE_EVENTS } from '../../data/demoPatients';
import { generateFhirDiagnosticReport } from '../../services/abdmService';
import { savePhysicianSignOffAndFhir } from '../../services/dbService';
import { useAuth } from '../../context/AuthContext';

interface DoctorPatientWorkspaceProps {
  patient: Patient;
  summary?: ClinicalSummary;
  redFlag?: RedFlagAlert;
  onBackToQueue: () => void;
  onUpdateSummary: (updatedSummary: ClinicalSummary) => void;
  onOpenTimeline: () => void;
}

export const DoctorPatientWorkspace: React.FC<DoctorPatientWorkspaceProps> = ({
  patient,
  summary,
  redFlag,
  onBackToQueue,
  onUpdateSummary,
  onOpenTimeline,
}) => {
  const { currentUser } = useAuth();
  // Safe summary fallbacks
  const safeSummary: ClinicalSummary = useMemo(() => ({
    id: summary?.id || `SUM-${patient?.id || '001'}`,
    patientId: summary?.patientId || patient?.id || 'PAT-001',
    visitId: summary?.visitId || `VISIT-${patient?.id || '001'}`,
    tokenNumber: summary?.tokenNumber || 'A-101',
    timestamp: summary?.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isDraft: summary?.isDraft ?? true,
    status: summary?.status || 'DRAFT_PENDING_REVIEW',
    intakeMode: summary?.intakeMode || 'modern',
    patientInfo: summary?.patientInfo || {
      name: patient?.name || 'Patient',
      age: patient?.age || 35,
      gender: patient?.gender || 'Other',
      abhaId: patient?.abhaId,
      phone: patient?.phone || '',
      department: (patient as any)?.department || 'General Medicine',
    },
    chiefComplaint: summary?.chiefComplaint || 'Outpatient clinical consultation',
    historyOfPresentIllness:
      summary?.historyOfPresentIllness ||
      'Patient presented for outpatient evaluation. Preliminary clinical intake recorded at kiosk.',
    pastMedicalHistory: Array.isArray(summary?.pastMedicalHistory) ? summary.pastMedicalHistory : [],
    pastSurgicalHistory: Array.isArray(summary?.pastSurgicalHistory) ? summary.pastSurgicalHistory : [],
    currentMedications: Array.isArray(summary?.currentMedications) ? summary.currentMedications : [],
    drugAllergies: Array.isArray(summary?.drugAllergies) ? summary.drugAllergies : [],
    familyHistory: Array.isArray(summary?.familyHistory) ? summary.familyHistory : ['Nil significant'],
    personalHistory: summary?.personalHistory || {
      diet: 'Mixed Indian Diet',
      smoking: 'Non-smoker',
      alcohol: 'Non-drinker',
      sleep: 'Adequate (6-8 hrs)',
      bowelBladder: 'Regular',
    },
    reviewOfSystems: Array.isArray(summary?.reviewOfSystems) ? summary.reviewOfSystems : [],
    previousInvestigations: Array.isArray(summary?.previousInvestigations) ? summary.previousInvestigations : [],
    documentSummary: summary?.documentSummary || 'No external documents uploaded.',
    redFlags: Array.isArray(summary?.redFlags) ? summary.redFlags : [],
    importantNotes: summary?.importantNotes || '',
    ayushHistory: summary?.ayushHistory,
    ayushData: summary?.ayushData,
    isPhysicianVerified: summary?.isPhysicianVerified || false,
    verifiedByDoctorName: summary?.verifiedByDoctorName,
    verificationTimestamp: summary?.verificationTimestamp,
    physicianNotes: summary?.physicianNotes || '',
  }), [summary, patient]);

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editedHpi, setEditedHpi] = useState(safeSummary.historyOfPresentIllness);
  const [editedPmh, setEditedPmh] = useState(safeSummary.pastMedicalHistory.join(', '));
  const [doctorNotes, setDoctorNotes] = useState(safeSummary.physicianNotes || '');
  const [activeTab, setActiveTab] = useState<'clinical_summary' | 'ocr_docs' | 'ayush_pariksha' | 'fhir_json'>('clinical_summary');

  // Synchronize edit inputs when patient/summary prop changes
  useEffect(() => {
    setEditedHpi(safeSummary.historyOfPresentIllness);
    setEditedPmh(safeSummary.pastMedicalHistory.join(', '));
    setDoctorNotes(safeSummary.physicianNotes || '');
    setIsSigned(Boolean(safeSummary.isPhysicianVerified));
    setIsEditing(false);
  }, [safeSummary]);

  // Low confidence entities
  const [verifiedEntities, setVerifiedEntities] = useState<Record<string, boolean>>({
    'ent-002': true,
  });

  // Verify and Sign state
  const [isSigned, setIsSigned] = useState(safeSummary.isPhysicianVerified);
  const [showSignModal, setShowSignModal] = useState(false);
  const [signSuccessToast, setSignSuccessToast] = useState(false);

  const handleSaveEdits = () => {
    const updated: ClinicalSummary = {
      ...safeSummary,
      historyOfPresentIllness: editedHpi,
      pastMedicalHistory: editedPmh.split(',').map((s) => s.trim()).filter(Boolean),
      physicianNotes: doctorNotes,
    };
    onUpdateSummary(updated);
    setIsEditing(false);
  };

  const handleSignAndConfirm = () => {
    const docName = currentUser.name || 'Dr. Physician (MD)';
    const docReg = currentUser.registrationNumber || 'MCI-48921';
    const updated: ClinicalSummary = {
      ...safeSummary,
      historyOfPresentIllness: editedHpi,
      pastMedicalHistory: editedPmh.split(',').map((s) => s.trim()).filter(Boolean),
      physicianNotes: doctorNotes,
      isPhysicianVerified: true,
      verifiedByDoctorName: `${docName} (Reg: ${docReg})`,
      verificationTimestamp: new Date().toISOString(),
    };
    onUpdateSummary(updated);
    setIsSigned(true);
    setShowSignModal(false);
    setSignSuccessToast(true);

    const fhirReport = generateFhirDiagnosticReport(patient, updated);
    savePhysicianSignOffAndFhir(
      `ENC-${patient.id}`,
      patient,
      updated,
      doctorNotes,
      docName,
      docReg,
      fhirReport,
      currentUser.id
    ).catch((err) => console.warn('Sign-off persistence notice:', err));

    setTimeout(() => setSignSuccessToast(false), 4000);
  };

  const fhirDiagnosticReport = generateFhirDiagnosticReport(patient, safeSummary);

  return (
    <div className="flex-1 text-slate-800 p-4 sm:p-6 max-w-7xl mx-auto w-full">
      {/* Top Breadcrumb & Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-200/80">
        <button
          onClick={onBackToQueue}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/80 hover:bg-white text-slate-700 text-xs font-bold border border-white/80 shadow-xs transition active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to OPD Queue</span>
        </button>

        <div className="flex items-center gap-2">
          {isSigned ? (
            <span className="px-3.5 py-1.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-xs flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Signed & Verified by Dr. A. Varma ({safeSummary.verificationTimestamp?.slice(0, 10) || 'Today'})</span>
            </span>
          ) : (
            <span className="px-3.5 py-1.5 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-200 shadow-xs flex items-center gap-1.5 animate-pulse">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Draft Intake • Awaiting Physician Sign-off</span>
            </span>
          )}
        </div>
      </div>

      {/* Mandatory AI Draft Warning Banner */}
      <div className="mb-6 p-4 rounded-2xl bg-amber-50/90 border-2 border-amber-300 text-amber-950 text-xs sm:text-sm font-bold flex items-center justify-between gap-3 shadow-xs backdrop-blur-md">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0" />
          <span>
            AI-GENERATED DRAFT — THIS SUMMARY MUST BE PERSONALLY REVIEWED, AMENDED AND CONFIRMED BY THE EXAMINING PHYSICIAN.
          </span>
        </div>

        {!isSigned && (
          <button
            onClick={() => setShowSignModal(true)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md uppercase tracking-wider shrink-0 transition active:scale-95 cursor-pointer"
          >
            Review & Sign Note
          </button>
        )}
      </div>

      {/* Urgent Red Flag Alert (if present) */}
      {redFlag && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50/90 border-2 border-rose-400 text-rose-950 flex items-start gap-3.5 shadow-md backdrop-blur-md">
          <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center shrink-0 shadow-md">
            <HeartPulse className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-600 text-white">
                TRIAGE RED-FLAG ALERT
              </span>
              <span className="text-xs font-black text-rose-800">
                {((redFlag as any).priority || (redFlag as any).severity || 'URGENT').toUpperCase()} PRIORITY
              </span>
            </div>
            <p className="text-sm font-black text-rose-950 mt-1">
              {redFlag.message?.en || redFlag.description || 'Clinical red-flag indicator detected.'}
            </p>
            <p className="text-xs text-rose-800 font-semibold mt-0.5">
              <strong>Physician Action Required:</strong>{' '}
              {redFlag.suggestedAction?.en || 'Immediate clinical evaluation and vital signs stabilization.'}
            </p>
          </div>
        </div>
      )}

      {/* Patient Header Demographics Card */}
      <div className="mb-6 p-6 rounded-[32px] bg-white/80 backdrop-blur-xl border-2 border-white/60 shadow-xl ring-1 ring-slate-900/5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-teal-500 flex items-center justify-center font-black text-2xl text-white shadow-lg">
              {patient.name.slice(0, 1)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-2xl font-black text-blue-950">{patient.name}</h2>
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg bg-blue-950 text-teal-300 shadow-xs">
                  Token: {safeSummary.tokenNumber || 'A-127'}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-lg bg-blue-100 text-blue-800 border border-blue-200 font-bold">
                  {patient.gender} • {patient.age} yrs
                </span>
              </div>
              <p className="text-xs text-slate-600 font-mono flex flex-wrap items-center gap-3 font-medium">
                <span>ABHA ID: <strong className="text-blue-900 font-bold">{patient.abhaId || patient.phone}</strong></span>
                <span>Phone: {patient.phone}</span>
                <span>Blood: <strong className="text-rose-600 font-bold">{patient.bloodGroup || 'B+'}</strong></span>
                <span>Intake Station: Kiosk #3 (OPD Ground Floor)</span>
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenTimeline}
              className="px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-900 text-xs font-black flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer"
            >
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>Longitudinal Timeline</span>
            </button>

            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-black flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer"
            >
              <Edit3 className="w-4 h-4 text-teal-600" />
              <span>{isEditing ? 'Cancel Edit' : 'Edit Intake Fields'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3 mb-6 overflow-x-auto text-xs font-black">
        <button
          onClick={() => setActiveTab('clinical_summary')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer ${
            activeTab === 'clinical_summary'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white/80 text-slate-600 hover:text-slate-900 border border-white/80'
          }`}
        >
          Structured Clinical Summary
        </button>

        <button
          onClick={() => setActiveTab('ocr_docs')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'ocr_docs'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-white/80 text-slate-600 hover:text-slate-900 border border-white/80'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Scanned Documents & OCR (2)</span>
        </button>

        {safeSummary.ayushHistory && (
          <button
            onClick={() => setActiveTab('ayush_pariksha')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'ayush_pariksha'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-white/80 text-slate-600 hover:text-slate-900 border border-white/80'
            }`}
          >
            <Leaf className="w-3.5 h-3.5" />
            <span>AYUSH Pariksha</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('fhir_json')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'fhir_json'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-white/80 text-slate-600 hover:text-slate-900 border border-white/80'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-300" />
          <span>ABDM FHIR Resource JSON</span>
        </button>
      </div>

      {/* TAB 1: Structured Clinical Summary */}
      {activeTab === 'clinical_summary' && (
        <div className="space-y-6">
          {/* Section 1: Chief Complaint & HPI */}
          <div className="p-6 rounded-[32px] bg-white/80 backdrop-blur-xl border-2 border-white/60 shadow-xl ring-1 ring-slate-900/5">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200/80">
              <h3 className="text-base font-black text-blue-950 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
                1. Chief Complaint & History of Present Illness (HPI)
              </h3>
              <span className="text-xs text-slate-500 font-semibold">Audio/Touch Intake Recorded</span>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-xs text-slate-500 font-black uppercase block">Chief Complaint</span>
                <p className="text-lg font-black text-teal-800 mt-0.5">{safeSummary.chiefComplaint}</p>
              </div>

              <div>
                <span className="text-xs text-slate-500 font-black uppercase block">History of Present Illness (HPI)</span>
                {isEditing ? (
                  <textarea
                    rows={4}
                    value={editedHpi}
                    onChange={(e) => setEditedHpi(e.target.value)}
                    className="w-full p-3.5 mt-1 rounded-2xl bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-blue-500 font-sans shadow-inner"
                  />
                ) : (
                  <p className="text-sm text-slate-700 mt-1 leading-relaxed bg-white/60 p-4 rounded-2xl border border-slate-200/80 font-medium">
                    {safeSummary.historyOfPresentIllness}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Past Medical & Surgical History */}
          <div className="p-6 rounded-[32px] bg-white/80 backdrop-blur-xl border-2 border-white/60 shadow-xl ring-1 ring-slate-900/5">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200/80">
              <h3 className="text-base font-black text-blue-950 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                2. Past Medical & Surgical History
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-slate-500 font-black uppercase block mb-1.5">
                  Past Medical Conditions
                </span>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedPmh}
                    onChange={(e) => setEditedPmh(e.target.value)}
                    className="w-full p-3 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm shadow-inner"
                  />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {safeSummary.pastMedicalHistory.map((pmh, idx) => (
                      <span
                        key={idx}
                        className="px-3.5 py-1 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-black shadow-xs"
                      >
                        {pmh}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <span className="text-xs text-slate-500 font-black uppercase block mb-1.5">
                  Past Surgical / Interventions
                </span>
                <div className="flex flex-wrap gap-2">
                  {safeSummary.pastSurgicalHistory.map((psh, idx) => (
                    <span
                      key={idx}
                      className="px-3.5 py-1 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-black shadow-xs"
                    >
                      {psh}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Current Medications (With OCR Confidence Tags) */}
          <div className="p-6 rounded-[32px] bg-white/80 backdrop-blur-xl border-2 border-white/60 shadow-xl ring-1 ring-slate-900/5">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200/80">
              <h3 className="text-base font-black text-blue-950 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                3. Current Medications & OCR Confidence Calibration
              </h3>
              <span className="text-xs text-emerald-700 font-bold">Extracted from prescriptions</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {safeSummary.currentMedications.map((med, idx) => {
                const isLow = med.confidenceScore && med.confidenceScore < 75 && !med.isPhysicianVerified;
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border transition ${
                      isLow
                        ? 'bg-amber-50/90 border-amber-300 text-amber-950'
                        : 'bg-white/70 border-white/80 text-slate-800 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-black text-sm text-slate-900">{med.name}</h4>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          isLow ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {med.confidenceScore || 95}% OCR
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 font-medium">
                      <strong>Dose:</strong> {med.dose} • <strong>Freq:</strong> {med.frequency}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1 font-medium">For: {med.indication}</p>

                    {isLow && (
                      <div className="mt-2 pt-2 border-t border-amber-200 flex items-center justify-between">
                        <span className="text-[10px] text-amber-800 font-black">Uncertain handwriting</span>
                        <button
                          onClick={() => {
                            med.isPhysicianVerified = true;
                            med.confidenceScore = 98;
                            handleSaveEdits();
                          }}
                          className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-[10px] font-black transition cursor-pointer"
                        >
                          Confirm Dose
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 4: Allergies, Family History & Lifestyle */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Allergies */}
            <div className="p-6 rounded-[32px] bg-white/80 backdrop-blur-xl border-2 border-white/60 shadow-xl ring-1 ring-slate-900/5">
              <span className="text-xs text-rose-700 font-black uppercase tracking-wider block mb-3">
                4. Known Drug Allergies
              </span>
              {safeSummary.drugAllergies.length > 0 ? (
                <div className="space-y-2">
                  {safeSummary.drugAllergies.map((all, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-black flex items-center gap-2 shadow-xs"
                    >
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{all}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No drug allergies reported during intake.</p>
              )}
            </div>

            {/* Family History */}
            <div className="p-6 rounded-[32px] bg-white/80 backdrop-blur-xl border-2 border-white/60 shadow-xl ring-1 ring-slate-900/5">
              <span className="text-xs text-slate-600 font-black uppercase tracking-wider block mb-3">
                5. Family Medical History
              </span>
              <div className="space-y-1.5 text-xs text-slate-700 font-medium">
                {safeSummary.familyHistory.map((fh, idx) => (
                  <p key={idx}>• {fh}</p>
                ))}
              </div>
            </div>

            {/* Personal History */}
            <div className="p-6 rounded-[32px] bg-white/80 backdrop-blur-xl border-2 border-white/60 shadow-xl ring-1 ring-slate-900/5">
              <span className="text-xs text-slate-600 font-black uppercase tracking-wider block mb-3">
                6. Personal & Habits
              </span>
              <div className="space-y-1 text-xs text-slate-700 font-medium">
                <p><strong>Diet:</strong> {safeSummary.personalHistory.diet}</p>
                <p><strong>Smoking:</strong> {safeSummary.personalHistory.smoking}</p>
                <p><strong>Alcohol:</strong> {safeSummary.personalHistory.alcohol}</p>
                <p><strong>Sleep / Bowel:</strong> {safeSummary.personalHistory.sleep} / {safeSummary.personalHistory.bowelBladder || safeSummary.personalHistory.bowelHabits || 'Regular'}</p>
              </div>
            </div>
          </div>

          {/* Section 5: Doctor Notes & Final Assessment */}
          <div className="p-6 rounded-[32px] bg-white/80 backdrop-blur-xl border-2 border-blue-300 shadow-xl ring-1 ring-slate-900/5">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/80">
              <h3 className="text-base font-black text-blue-950 uppercase tracking-wider flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-blue-600" />
                7. Physician Consultation Notes & Clinical Assessment
              </h3>
              {isEditing && (
                <button
                  onClick={handleSaveEdits}
                  className="px-3 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-black flex items-center gap-1 transition cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Notes</span>
                </button>
              )}
            </div>

            <textarea
              rows={4}
              value={doctorNotes}
              onChange={(e) => setDoctorNotes(e.target.value)}
              placeholder="Type clinical impression, provisional diagnosis, prescribed investigations (e.g. ECG, Troponin-I) and prescription plan..."
              className="w-full p-4 rounded-2xl bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-blue-500 shadow-inner font-medium"
            />

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 pt-4 border-t border-slate-200/80">
              <div className="text-xs text-slate-600 font-medium">
                <span>Signing Physician: <strong className="text-slate-900">Dr. A. Varma, MD (Reg: MCI-48921)</strong></span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowSignModal(true)}
                  className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-xl shadow-emerald-600/30 flex items-center gap-2 transition active:scale-95 cursor-pointer"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{isSigned ? 'Re-Sign & Update Note' : 'Verify & Sign Clinical Note'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Scanned Documents & OCR Inspector */}
      {activeTab === 'ocr_docs' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {DEMO_DOCUMENTS.map((doc) => (
              <div key={doc.id} className="p-6 rounded-[32px] bg-white/80 backdrop-blur-xl border-2 border-white/60 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
                  <div>
                    <h3 className="font-black text-blue-950 text-base">{doc.title}</h3>
                    <p className="text-xs text-slate-500 font-medium">{doc.hospitalName} • {doc.date}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-xs">
                    OCR: {doc.confidenceScore}% ✓
                  </span>
                </div>

                {/* Simulated Document Preview Area */}
                <div className="h-44 rounded-2xl bg-slate-950 p-4 border border-slate-800 overflow-y-auto text-xs font-mono text-slate-300 leading-relaxed shadow-inner">
                  <div className="text-[11px] text-teal-400 mb-2 uppercase font-bold tracking-wider">
                    --- Raw OCR Stream Output ---
                  </div>
                  <p>{doc.rawOcrText}</p>
                </div>

                {/* Extracted Entities Table */}
                <div>
                  <span className="text-xs uppercase font-black text-slate-600 block mb-2">
                    Structured Clinical Entities:
                  </span>
                  <div className="space-y-2">
                    {doc.extractedEntities.map((ent) => (
                      <div
                        key={ent.id}
                        className="p-3 rounded-2xl bg-white/70 border border-slate-200/80 flex items-center justify-between text-xs shadow-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-900">{ent.name}</span>
                          {ent.dose && <span className="ml-2 text-slate-500 font-mono">{ent.dose} {ent.frequency}</span>}
                          {ent.value && <span className="ml-2 text-teal-700 font-bold">{ent.value} {ent.unit}</span>}
                        </div>
                        <span className="font-mono text-[11px] text-slate-500 font-bold">{ent.confidence}% conf</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: AYUSH Pariksha */}
      {activeTab === 'ayush_pariksha' && safeSummary.ayushHistory && (
        <div className="p-6 rounded-[32px] bg-white/80 backdrop-blur-xl border-2 border-white/60 shadow-xl space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-200/80">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700">
              <Leaf className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-blue-950">Dashavidha Pariksha (दशविध परीक्षा Clinical Intake)</h3>
              <p className="text-xs text-slate-500 font-medium">Ayurvedic Rogi-Roga Pariksha parameters gathered at kiosk</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white/70 border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 uppercase font-black block">1. Prakriti (Constitutional Tendency)</span>
              <p className="text-base font-black text-emerald-800 mt-1">{safeSummary.ayushHistory.prakriti.primaryDosha}</p>
              <p className="text-xs text-slate-600 mt-1 font-medium">{safeSummary.ayushHistory.prakriti.details}</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/70 border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 uppercase font-black block">2. Agni (Digestive Capacity)</span>
              <p className="text-base font-black text-slate-900 mt-1">{safeSummary.ayushHistory.agni}</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/70 border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 uppercase font-black block">3. Koshtha (Bowel Pattern)</span>
              <p className="text-base font-black text-slate-900 mt-1">{safeSummary.ayushHistory.koshtha}</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/70 border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 uppercase font-black block">4. Dhatu Sara (Tissue Integrity)</span>
              <p className="text-base font-black text-slate-900 mt-1">{safeSummary.ayushHistory.sara}</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/70 border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 uppercase font-black block">5. Sattva (Mental Resilience)</span>
              <p className="text-base font-black text-slate-900 mt-1">{safeSummary.ayushHistory.sattva}</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/70 border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 uppercase font-black block">6. Ahara & Vyayama Shakti</span>
              <p className="text-base font-black text-slate-900 mt-1">{safeSummary.ayushHistory.aharaShakti} / {safeSummary.ayushHistory.vyayamaShakti}</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/70 border border-slate-200/80 shadow-xs">
            <span className="text-xs text-slate-500 uppercase font-black block mb-1">Ahara-Vihara & Nidana Observations</span>
            <p className="text-sm text-slate-800 font-medium">{safeSummary.ayushHistory.nidanaNotes || 'None recorded'}</p>
          </div>
        </div>
      )}

      {/* TAB 4: ABDM FHIR Resource JSON */}
      {activeTab === 'fhir_json' && (
        <div className="p-6 rounded-[32px] bg-white/80 backdrop-blur-xl border-2 border-white/60 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
            <div>
              <h3 className="text-base font-black text-blue-950">ABDM FHIR DiagnosticReport Payload</h3>
              <p className="text-xs text-slate-500 font-medium">HL7 FHIR R4 Bundle compliant with National Digital Health Mission specifications</p>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(fhirDiagnosticReport, null, 2));
                alert('FHIR JSON copied to clipboard!');
              }}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black transition cursor-pointer shadow-md"
            >
              Copy FHIR JSON
            </button>
          </div>

          <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto max-h-[480px] shadow-inner">
            {JSON.stringify(fhirDiagnosticReport, null, 2)}
          </pre>
        </div>
      )}

      {/* Verification & Signature Confirmation Modal */}
      {showSignModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-lg w-full rounded-[32px] bg-white/95 backdrop-blur-2xl border-2 border-emerald-500 p-6 sm:p-8 shadow-2xl text-slate-900">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 mb-4 mx-auto shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="text-2xl font-black text-center text-blue-950 mb-2">Physician Verification & Sign-off</h3>
            <p className="text-xs text-slate-600 text-center mb-6 leading-relaxed font-medium">
              By signing, you confirm that you have personally reviewed, edited and verified the AI-generated clinical intake history for patient <strong>{patient.name}</strong>.
            </p>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2 mb-6">
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Physician Name:</span>
                <span className="font-black text-slate-900">Dr. A. Varma, MD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Registration Number:</span>
                <span className="font-mono font-bold text-teal-700">MCI-48921</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">ABDM Health Facility:</span>
                <span className="font-bold text-slate-900">AIIMS OPD-IN-DELHI-004</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Timestamp:</span>
                <span className="font-mono text-slate-600 font-medium">{new Date().toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowSignModal(false)}
                className="py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-sign-note"
                onClick={handleSignAndConfirm}
                className="py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs tracking-wider uppercase shadow-lg shadow-emerald-600/30 transition cursor-pointer active:scale-95"
              >
                Sign & Finalize
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification Toast */}
      {signSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-xs font-black">Clinical Note Successfully Verified & Signed!</span>
        </div>
      )}
    </div>
  );
};
