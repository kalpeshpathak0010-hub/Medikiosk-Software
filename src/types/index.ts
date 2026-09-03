export type UserRole = 'PATIENT' | 'DOCTOR' | 'ADMIN';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  email?: string;
  phone?: string;
  badgeNumber?: string;
  registrationNumber?: string;
  department?: string;
  organizationId: string;
  hospitalName: string;
  avatarUrl?: string;
}

export type AppRoute = 'kiosk' | 'doctor' | 'admin' | 'timeline' | 'ocr_pipeline' | 'abdm';

export type Language = 'en' | 'hi' | 'mr';

export type IntakeMode = 'modern' | 'ayush';

export type PatientIdentificationMethod = 'abha_qr' | 'abha_number' | 'scan_id' | 'new_patient';

export type PriorityLevel = 'URGENT' | 'HIGH' | 'NORMAL';

export type IntakeStatus = 'in_progress' | 'completed' | 'verified_by_doctor' | 'flagged_triage';

export type ChiefComplaintId =
  | 'chest_pain'
  | 'fever'
  | 'headache'
  | 'cough'
  | 'breathing_problem'
  | 'stomach_problem'
  | 'joint_pain'
  | 'skin_rash'
  | 'ayush_general'
  | 'other';

export interface Patient {
  id: string;
  abhaId?: string;
  name: string;
  nameHi?: string;
  nameMr?: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  address?: string;
  bloodGroup?: string;
  isExistingPatient: boolean;
  avatarUrl?: string;
}

export interface QuestionOption {
  id: string;
  label: Record<Language, string>;
  isRedFlagTrigger?: boolean;
  followUpQuestionId?: string;
  ayushFactor?: string;
}

export interface ClinicalQuestion {
  id: string;
  complaintId?: ChiefComplaintId;
  questionText: Record<Language, string>;
  audioPrompt?: Record<Language, string>;
  type: 'single_choice' | 'multi_choice' | 'scale' | 'text' | 'voice_prompt';
  options?: QuestionOption[];
  minScale?: number;
  maxScale?: number;
  scaleLabels?: { min: Record<Language, string>; max: Record<Language, string> };
  category: 'chief_complaint' | 'hpi' | 'severity' | 'associated_symptoms' | 'history' | 'ayush';
  required?: boolean;
}

export interface QuestionAnswer {
  questionId: string;
  questionText: string;
  selectedOptionIds?: string[];
  selectedOptionLabels?: string[];
  scaleValue?: number;
  textValue?: string;
  transcription?: string;
  isVoiceInput?: boolean;
  timestamp: string;
}

export interface RedFlagAlert {
  id: string;
  patientId: string;
  tokenNumber: string;
  symptoms: string[];
  description: string;
  message?: Record<Language, string>;
  suggestedAction?: Record<Language, string>;
  timestamp: string;
  priority: PriorityLevel;
  department: string;
  isAcknowledged: boolean;
  acknowledgedBy?: string;
}

export interface ExtractedEntity {
  id: string;
  type: 'diagnosis' | 'medication' | 'investigation' | 'procedure' | 'allergy' | 'vital';
  name: string;
  value?: string;
  dose?: string;
  frequency?: string;
  unit?: string;
  referenceRange?: string;
  date?: string;
  confidence: number; // 0 to 100
  isVerified?: boolean;
  rawText?: string;
  category?: string;
}

export interface DocumentRecord {
  id: string;
  patientId: string;
  title: string;
  type: 'Prescription' | 'Laboratory Report' | 'Discharge Summary' | 'Imaging Report' | 'Operation Record' | 'Other';
  date: string;
  fileUrl: string;
  thumbnailUrl?: string;
  ocrStatus: 'pending' | 'processing' | 'completed' | 'verified';
  confidenceScore: number;
  extractedEntities: ExtractedEntity[];
  rawOcrText?: string;
  hospitalName?: string;
}

export interface MedicalTimelineEvent {
  id: string;
  patientId: string;
  year: string;
  date: string;
  title: string;
  category: 'diagnosis' | 'hospitalization' | 'surgery' | 'investigation' | 'prescription' | 'lifestyle' | 'lab_report';
  description: string;
  department?: string;
  documentId?: string;
  documentTitle?: string;
  severity?: 'normal' | 'caution' | 'critical';
  extractedEntities?: string[];
  hospital?: string;
  documentSourceId?: string;
}

export interface AyushHistory {
  prakriti: {
    primaryDosha: 'Vata' | 'Pitta' | 'Kapha' | 'Vata-Pitta' | 'Pitta-Kapha' | 'Vata-Kapha' | 'Tridoshic';
    secondaryDosha?: string;
    details: string;
  };
  agni: 'Vishamagni (Irregular)' | 'Tikshnagni (Intense)' | 'Mandagni (Sluggish)' | 'Samagni (Balanced)';
  koshtha: 'Krura (Hard/Constipated)' | 'Mrudu (Soft/Loose)' | 'Madhyama (Regular)';
  sara: 'Uttama (Excellent)' | 'Madhyama (Moderate)' | 'Heena (Poor)';
  samhanana: 'Good Compactness' | 'Medium' | 'Loose';
  satmya: 'Eka-Rasa (Single taste habit)' | 'Sarva-Rasa (Wholesome multi-taste)' | 'Oka-Satmya';
  sattva: 'Pravara (High Mental Strength)' | 'Madhyama (Moderate)' | 'Avara (Low)';
  aharaShakti: 'Abhyavaharana (Good Intake) & Jarana (Good Digestion)' | 'Moderate' | 'Poor';
  vyayamaShakti: 'High Endurance' | 'Moderate Endurance' | 'Low Endurance';
  vaya: 'Balyavastha' | 'Madhyamavastha' | 'Vriddhavastha';
  nidanaNotes?: string;
}

export interface ClinicalSummary {
  id: string;
  patientId: string;
  visitId: string;
  tokenNumber: string;
  timestamp: string;
  isDraft: boolean; // Always true initially
  status: 'DRAFT_PENDING_REVIEW' | 'PHYSICIAN_VERIFIED' | 'REJECTED';
  intakeMode: IntakeMode;
  isPhysicianVerified?: boolean;
  verificationTimestamp?: string;
  verifiedByDoctorName?: string;
  physicianNotes?: string;
  sourceDocumentIds?: string[];
  mode?: IntakeMode;
  intakeTimestamp?: string;
  ayushHistory?: AyushHistory;
  
  patientInfo: {
    name: string;
    age: number;
    gender: string;
    abhaId?: string;
    phone: string;
    department: string;
  };
  
  chiefComplaint: string;
  historyOfPresentIllness: string;
  pastMedicalHistory: string[];
  pastSurgicalHistory: string[];
  currentMedications: Array<{
    name: string;
    dose: string;
    frequency: string;
    source: 'patient_reported' | 'ocr_extracted';
    indication?: string;
    confidenceScore?: number;
    isPhysicianVerified?: boolean;
  }>;
  drugAllergies: string[];
  familyHistory: string[];
  personalHistory: {
    diet: string;
    smoking: string;
    alcohol: string;
    sleep: string;
    bowelBladder: string;
    bowelHabits?: string;
  };
  reviewOfSystems: Array<{ system: string; positiveFindings: string[]; negativeFindings: string[] }>;
  previousInvestigations: Array<{ test: string; result: string; unit: string; date: string; isAbnormal?: boolean; referenceRange?: string }>;
  documentSummary: string;
  redFlags: string[];
  importantNotes: string;
  ayushData?: AyushHistory;
  
  // Doctor Edit Tracking
  doctorReview?: {
    verifiedByDoctorId: string;
    verifiedByDoctorName: string;
    verifiedAt: string;
    doctorNotes: string;
    editedSections?: Record<string, string>;
    clinicalImpression?: string;
    physicianPrescriptionNotes?: string;
  };
}

export interface PatientVisit {
  id: string;
  patientId: string;
  tokenNumber: string;
  roomNumber: string;
  department: string;
  startTime: string;
  completedTime?: string;
  intakeStatus: IntakeStatus;
  priority: PriorityLevel;
  languageUsed: Language;
  intakeMode: IntakeMode;
  answers: QuestionAnswer[];
  redFlagAlerts: RedFlagAlert[];
  documents: DocumentRecord[];
  timeline: MedicalTimelineEvent[];
  summary: ClinicalSummary;
  estimatedWaitMinutes: number;
}

export interface KioskSession {
  sessionId: string;
  kioskId: string;
  kioskLocation: string;
  startedAt: string;
  language: Language;
  currentStep: number;
  consentAgreed: boolean;
  consentTimestamp?: string;
  intakeMode: IntakeMode;
  patient?: Patient;
  answers: Record<string, QuestionAnswer>;
  detectedRedFlags: string[];
  uploadedDocuments: DocumentRecord[];
}

export interface AdminAnalytics {
  totalPatientsToday: number;
  completedIntakes: number;
  avgCompletionTimeMinutes: number;
  patientsWaiting: number;
  redFlagAlertsCount: number;
  documentsProcessedCount: number;
  kioskUptimePercentage: number;
  languageDistribution: { language: string; count: number; percentage: number }[];
  hourlyThroughput: { hour: string; patients: number }[];
  departmentStats: { department: string; count: number; redFlags: number }[];
  ocrConfidenceStats: { range: string; count: number; percentage: number }[];
}
