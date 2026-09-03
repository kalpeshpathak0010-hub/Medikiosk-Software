import React, { useState, useEffect, useMemo } from 'react';
import {
  Stethoscope,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  Edit3,
  Save,
  Printer,
  Download,
  Sparkles,
  User,
  HeartPulse,
  Leaf,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react';
import { ClinicalSummary, DocumentRecord, Patient, RedFlagAlert } from '../../types';
import { generateFhirDiagnosticReport } from '../../services/abdmService';
import { savePhysicianSignOffAndFhir, updateClinicalSessionStatus } from '../../services/dbService';
import { useAuth } from '../../context/AuthContext';

interface DoctorPatientWorkspaceProps {
  patient: Patient;
  summary?: ClinicalSummary;
  redFlag?: RedFlagAlert;
  sessionId?: string;
  documents?: DocumentRecord[];
  onBackToQueue: () => void;
  onUpdateSummary: (updatedSummary: ClinicalSummary) => void;
  onOpenTimeline: () => void;
}

export const DoctorPatientWorkspace: React.FC<DoctorPatientWorkspaceProps> = ({
  patient,
  summary,
  redFlag,
  sessionId,
  documents = [],
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

  const handleVerifySummary = () => {
    const docName = currentUser.name || 'Duty Medical Officer';
    const docReg = currentUser.registrationNumber || 'MCI-48921';
    const updated: ClinicalSummary = {
      ...safeSummary,
      historyOfPresentIllness: editedHpi,
      pastMedicalHistory: editedPmh.split(',').map((s) => s.trim()).filter(Boolean),
      physicianNotes: doctorNotes,
      isPhysicianVerified: true,
      status: 'PHYSICIAN_VERIFIED',
      verifiedByDoctorName: `${docName} (Reg: ${docReg})`,
      verificationTimestamp: new Date().toISOString(),
    };
    onUpdateSummary(updated);
    setIsSigned(true);
    setSignSuccessToast(true);

    if (sessionId) {
      updateClinicalSessionStatus(sessionId, 'verified', {
        verifiedByDoctorName: `${docName} (Reg: ${docReg})`,
        verifiedAt: new Date().toISOString(),
        doctorNotes,
      }).catch((err) => console.warn('Session verification update notice:', err));
    }

    setTimeout(() => setSignSuccessToast(false), 4000);
  };

  const handleSignAndConfirm = () => {
    const docName = currentUser.name || 'Duty Medical Officer';
    const docReg = currentUser.registrationNumber || 'MCI-48921';
    const updated: ClinicalSummary = {
      ...safeSummary,
      historyOfPresentIllness: editedHpi,
      pastMedicalHistory: editedPmh.split(',').map((s) => s.trim()).filter(Boolean),
      physicianNotes: doctorNotes,
      isPhysicianVerified: true,
      status: 'PHYSICIAN_VERIFIED',
      verifiedByDoctorName: `${docName} (Reg: ${docReg})`,
      verificationTimestamp: new Date().toISOString(),
    };
    onUpdateSummary(updated);
    setIsSigned(true);
    setShowSignModal(false);
    setSignSuccessToast(true);

    if (sessionId) {
      updateClinicalSessionStatus(sessionId, 'signed_off', {
        verifiedByDoctorName: `${docName} (Reg: ${docReg})`,
        signedOffAt: new Date().toISOString(),
        doctorNotes,
      }).catch((err) => console.warn('Session sign-off update notice:', err));
    }

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
    <div className="flex-1 text-slate-800 p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-5">
      {/* Top Breadcrumb & Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <button
          onClick={onBackToQueue}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-300 shadow-xs transition active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to OPD Queue</span>
        </button>

        <div className="flex items-center gap-2">
          {isSigned ? (
            <span className="px-3 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>Verified & Signed ({safeSummary.verificationTimestamp?.slice(0, 10) || 'Today'})</span>
            </span>
          ) : (
            <span className="px-3 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
              <span>Draft Intake • Awaiting Physician Review</span>
            </span>
          )}
        </div>
      </div>

      {/* Mandatory AI Verification Compliance Banner with [EDIT], [VERIFY], [SIGN OFF] */}
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5 sm:mt-0" />
          <div>
            <span className="font-bold text-xs sm:text-sm tracking-wide block uppercase text-amber-950">
              AI-ASSISTED CLINICAL INTAKE — PHYSICIAN VERIFICATION REQUIRED
            </span>
            <span className="text-xs text-amber-900 font-medium">
              Data collected at kiosk terminal. Review the findings, edit if necessary, and complete verification.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
          <button
            id="btn-workspace-edit"
            onClick={() => setIsEditing(!isEditing)}
            className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-[#1e3a8a]" />
            <span>{isEditing ? 'Cancel Edit' : 'Edit Note'}</span>
          </button>

          <button
            id="btn-workspace-verify"
            onClick={handleVerifySummary}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer ${
              isSigned
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-emerald-700 hover:bg-emerald-800 text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isSigned ? 'Verified ✓' : 'Verify'}</span>
          </button>

          <button
            id="btn-workspace-signoff"
            onClick={() => setShowSignModal(true)}
            className="px-4 py-1.5 rounded-lg bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs active:scale-95 transition cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Sign Off & FHIR</span>
          </button>
        </div>
      </div>

      {/* Urgent Red Flag Alert (if present) */}
      {redFlag && (
        <div className="p-4 rounded-xl bg-rose-50 border-2 border-rose-400 text-rose-950 flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-rose-700 flex items-center justify-center shrink-0">
            <HeartPulse className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-700 text-white">
                TRIAGE RED-FLAG ALERT
              </span>
              <span className="text-xs font-bold text-rose-800">
                {((redFlag as any).priority || (redFlag as any).severity || 'URGENT').toUpperCase()} PRIORITY
              </span>
            </div>
            <p className="text-sm font-bold text-rose-950 mt-1">
              {redFlag.message?.en || redFlag.description || 'Clinical red-flag indicator detected.'}
            </p>
            <p className="text-xs text-rose-800 font-medium mt-0.5">
              Protocol: {redFlag.suggestedAction?.en || 'Immediate clinical evaluation and vital signs stabilization.'}
            </p>
          </div>
        </div>
      )}

      {/* Patient Header Demographics Card */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-lg bg-[#1e3a8a] text-white flex items-center justify-center font-bold text-xl shadow-xs">
              {patient.name.slice(0, 1)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-slate-900">{patient.name}</h2>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-white">
                  Token: {safeSummary.tokenNumber || 'A-127'}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200 font-bold">
                  {patient.gender} • {patient.age} yrs
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono flex flex-wrap items-center gap-3">
                <span>ABHA: <strong className="text-slate-800 font-bold">{patient.abhaId || patient.phone || 'Walk-in'}</strong></span>
                <span>Phone: {patient.phone}</span>
                <span>Blood: <strong className="text-slate-800 font-bold">{patient.bloodGroup || 'B+'}</strong></span>
              </p>
            </div>
          </div>

          {/* Quick Navigation Action */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenTimeline}
              className="px-3.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer"
            >
              <Clock className="w-4 h-4 text-[#1e3a8a]" />
              <span>Medical Timeline</span>
            </button>
          </div>
        </div>
      </div>

      {/* Workspace Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 overflow-x-auto text-xs font-bold pb-2">
        <button
          onClick={() => setActiveTab('clinical_summary')}
          className={`px-3.5 py-1.5 rounded-lg transition uppercase tracking-wider text-[11px] cursor-pointer ${
            activeTab === 'clinical_summary'
              ? 'bg-[#1e3a8a] text-white'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          Clinical Summary & Intake
        </button>

        <button
          onClick={() => setActiveTab('ocr_docs')}
          className={`px-3.5 py-1.5 rounded-lg transition uppercase tracking-wider text-[11px] flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'ocr_docs'
              ? 'bg-[#1e3a8a] text-white'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Uploaded Records ({documents.length})</span>
        </button>

        {safeSummary.ayushHistory && (
          <button
            onClick={() => setActiveTab('ayush_pariksha')}
            className={`px-3.5 py-1.5 rounded-lg transition uppercase tracking-wider text-[11px] flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'ayush_pariksha'
                ? 'bg-emerald-700 text-white'
                : 'bg-white text-emerald-800 hover:text-emerald-950 border border-emerald-200'
            }`}
          >
            <Leaf className="w-3.5 h-3.5" />
            <span>AYUSH Pariksha</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('fhir_json')}
          className={`px-3.5 py-1.5 rounded-lg transition uppercase tracking-wider text-[11px] cursor-pointer ${
            activeTab === 'fhir_json'
              ? 'bg-[#1e3a8a] text-white'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          ABDM FHIR Resource
        </button>
      </div>

      {/* TAB 1: Clinical Summary & Intake Form */}
      {activeTab === 'clinical_summary' && (
        <div className="space-y-4">
          {/* Chief Complaint & HPI */}
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div>
              <span className="text-xs text-slate-500 uppercase font-bold tracking-wider block mb-1">
                1. Chief Complaint
              </span>
              <p className="text-base font-bold text-slate-900">
                {safeSummary.chiefComplaint}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider block">
                  2. History of Present Illness (HPI)
                </span>
                {isEditing && (
                  <span className="text-[11px] font-bold text-blue-700">Editing Enabled</span>
                )}
              </div>

              {isEditing ? (
                <textarea
                  value={editedHpi}
                  onChange={(e) => setEditedHpi(e.target.value)}
                  rows={4}
                  className="w-full p-3 rounded-lg border border-blue-400 bg-blue-50/40 text-xs text-slate-900 leading-relaxed font-medium focus:outline-none"
                />
              ) : (
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed font-medium">
                  {editedHpi}
                </div>
              )}
            </div>

            {/* Past Medical History */}
            <div>
              <span className="text-xs text-slate-500 uppercase font-bold tracking-wider block mb-1.5">
                3. Past Medical & Surgical History
              </span>
              {isEditing ? (
                <input
                  type="text"
                  value={editedPmh}
                  onChange={(e) => setEditedPmh(e.target.value)}
                  placeholder="Enter conditions separated by commas..."
                  className="w-full p-2 rounded-lg border border-blue-400 bg-blue-50/40 text-xs text-slate-900 font-medium focus:outline-none"
                />
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {safeSummary.pastMedicalHistory.length > 0 ? (
                    safeSummary.pastMedicalHistory.map((item, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800"
                      >
                        {item}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500 italic">No previous chronic conditions reported.</span>
                  )}
                </div>
              )}
            </div>

            {/* Physician Notes Section */}
            <div className="pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-700 font-bold uppercase tracking-wider block mb-1">
                Physician Consultation Notes & Prescription Directives:
              </span>
              <textarea
                value={doctorNotes}
                onChange={(e) => setDoctorNotes(e.target.value)}
                placeholder="Enter clinical examination notes, diagnostic orders, or advice..."
                rows={3}
                className="w-full p-3 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 font-medium focus:outline-none focus:border-[#1e3a8a]"
              />
              {isEditing && (
                <button
                  onClick={handleSaveEdits}
                  className="mt-2 px-4 py-1.5 rounded-lg bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-xs font-bold cursor-pointer"
                >
                  Save Notes
                </button>
              )}
            </div>
          </div>

          {/* Current Medications & Allergies */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Medications */}
            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-700 font-bold uppercase tracking-wider block mb-3">
                Current Reported Medications
              </span>
              {safeSummary.currentMedications.length > 0 ? (
                <div className="space-y-2">
                  {safeSummary.currentMedications.map((med, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                      <div className="flex justify-between font-bold text-slate-900">
                        <span>{med.name}</span>
                        <span className="text-slate-500 font-normal">{med.dose}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">Frequency: {med.frequency}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No regular daily medications reported.</p>
              )}
            </div>

            {/* Allergies & Lifestyle */}
            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-700 font-bold uppercase tracking-wider block mb-3">
                Allergies & Lifestyle
              </span>
              <div className="space-y-2 text-xs">
                <div>
                  <strong className="text-slate-900">Allergies:</strong>{' '}
                  {safeSummary.drugAllergies.length > 0 ? (
                    <span className="text-rose-700 font-bold">{safeSummary.drugAllergies.join(', ')}</span>
                  ) : (
                    <span className="text-slate-500">None reported</span>
                  )}
                </div>
                <div>
                  <strong className="text-slate-900">Diet:</strong> {safeSummary.personalHistory?.diet || 'Mixed'}
                </div>
                <div>
                  <strong className="text-slate-900">Smoking / Tobacco:</strong> {safeSummary.personalHistory?.smoking || 'No'}
                </div>
                <div>
                  <strong className="text-slate-900">Alcohol:</strong> {safeSummary.personalHistory?.alcohol || 'No'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Uploaded Records */}
      {activeTab === 'ocr_docs' && (
        <div className="space-y-4">
          {documents.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {documents.map((doc) => (
                <div key={doc.id} className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{doc.title}</h3>
                      <p className="text-xs text-slate-500">{doc.hospitalName || 'Health Center'} • {doc.date}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      OCR: {doc.confidenceScore}% ✓
                    </span>
                  </div>

                  {doc.rawOcrText && (
                    <div className="h-32 rounded-lg bg-slate-900 p-3 border border-slate-800 overflow-y-auto text-xs font-mono text-slate-300">
                      {doc.rawOcrText}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-600">
              <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800">
                No physical documents scanned for this patient encounter.
              </p>
              <p className="text-slate-500 mt-1">
                If the patient brought paper prescriptions or lab reports, they can be captured at the scanner kiosk.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: AYUSH Pariksha */}
      {activeTab === 'ayush_pariksha' && safeSummary.ayushHistory && (
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Leaf className="w-5 h-5 text-emerald-700" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Dashavidha Pariksha (दशविध परीक्षा)</h3>
              <p className="text-xs text-slate-500">Ayurvedic Rogi-Roga Pariksha parameters gathered at kiosk</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[11px] text-slate-500 uppercase font-bold block">1. Prakriti</span>
              <p className="text-sm font-bold text-emerald-800 mt-0.5">{safeSummary.ayushHistory.prakriti.primaryDosha}</p>
              <p className="text-xs text-slate-600 mt-0.5">{safeSummary.ayushHistory.prakriti.details}</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[11px] text-slate-500 uppercase font-bold block">2. Agni (Digestive)</span>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{safeSummary.ayushHistory.agni}</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[11px] text-slate-500 uppercase font-bold block">3. Koshtha (Bowel)</span>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{safeSummary.ayushHistory.koshtha}</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[11px] text-slate-500 uppercase font-bold block">4. Dhatu Sara</span>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{safeSummary.ayushHistory.sara}</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[11px] text-slate-500 uppercase font-bold block">5. Sattva (Mental)</span>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{safeSummary.ayushHistory.sattva}</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[11px] text-slate-500 uppercase font-bold block">6. Ahara & Vyayama Shakti</span>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{safeSummary.ayushHistory.aharaShakti} / {safeSummary.ayushHistory.vyayamaShakti}</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ABDM FHIR Resource JSON */}
      {activeTab === 'fhir_json' && (
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">ABDM FHIR DiagnosticReport Payload</h3>
              <p className="text-xs text-slate-500">HL7 FHIR R4 Bundle compliant with National Digital Health specifications</p>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(fhirDiagnosticReport, null, 2));
              }}
              className="px-3 py-1.5 rounded-lg bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-xs font-bold transition cursor-pointer"
            >
              Copy FHIR JSON
            </button>
          </div>

          <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto max-h-[400px]">
            {JSON.stringify(fhirDiagnosticReport, null, 2)}
          </pre>
        </div>
      )}

      {/* Sign Off Confirmation Modal */}
      {showSignModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-xl bg-white border border-slate-200 p-6 shadow-xl text-slate-900 space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-700" />
              <h3 className="text-base font-bold">Sign Off Clinical Encounter</h3>
            </div>
            <p className="text-xs text-slate-600">
              You are certifying that you have evaluated the AI intake summary for <strong>{patient.name}</strong> and confirmed the clinical directives. This generates an ABDM-compliant FHIR DiagnosticReport record.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowSignModal(false)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSignAndConfirm}
                className="px-4 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer"
              >
                Confirm Signature
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
