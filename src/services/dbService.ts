import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  Patient,
  ClinicalSummary,
  RedFlagAlert,
  MedicalTimelineEvent,
  DocumentRecord,
  AyushHistory,
  QuestionAnswer,
  ChiefComplaintId,
  IntakeMode,
} from '../types';
import { DEMO_PATIENTS, DEMO_SUMMARIES, DEMO_RED_FLAGS, DEMO_TIMELINE_EVENTS } from '../data/demoPatients';

// Firestore collection names
export const COLLECTIONS = {
  HOSPITALS: 'hospitals',
  USERS: 'users',
  PATIENTS: 'patients',
  ENCOUNTERS: 'encounters',
  CLINICAL_HISTORIES: 'clinicalHistories',
  AYUSH_ASSESSMENTS: 'ayushAssessments',
  DOCUMENTS: 'documents',
  OCR_RESULTS: 'ocrResults',
  CLINICAL_SUMMARIES: 'clinicalSummaries',
  PHYSICIAN_REVIEWS: 'physicianReviews',
  SIGN_OFFS: 'signOffs',
  DIAGNOSTIC_REPORTS: 'diagnosticReports',
  AUDIT_LOGS: 'auditLogs',
};

export interface FirestoreEncounter {
  id: string;
  patientId: string;
  hospitalId: string;
  doctorId?: string;
  tokenNumber: string;
  department: string;
  chiefComplaint: string;
  intakeMode: IntakeMode;
  status: 'INTAKE' | 'WAITING' | 'IN_REVIEW' | 'VERIFIED' | 'SIGNED_OFF' | 'COMPLETED';
  triagePriority: 'EMERGENCY' | 'URGENT' | 'STANDARD';
  hasRedFlag: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface AdminStats {
  totalPatients: number;
  todayEncounters: number;
  waitingCount: number;
  completedCount: number;
  emergencyCount: number;
  averageIntakeDuration: string;
  languageBreakdown: Record<string, number>;
  departmentBreakdown: Record<string, number>;
  ocrProcessedCount: number;
}

// Seed initial default patient data into Firestore if collections are empty
export async function seedInitialFirestoreData(): Promise<void> {
  try {
    const patientsSnapshot = await getDocs(collection(db, COLLECTIONS.PATIENTS));
    if (!patientsSnapshot.empty) {
      return; // Already initialized
    }

    // 1. Seed Hospital
    await setDoc(doc(db, COLLECTIONS.HOSPITALS, 'HOSP-DEL-001'), {
      id: 'HOSP-DEL-001',
      name: 'AIIMS New Delhi (Central OPD Network)',
      code: 'AIIMS-DEL',
      address: 'Sri Aurobindo Marg, Ansari Nagar, New Delhi, Delhi 110029',
      contact: '+91-11-26588500',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 2. Seed Patients
    for (const patient of DEMO_PATIENTS) {
      await setDoc(doc(db, COLLECTIONS.PATIENTS, patient.id), {
        ...patient,
        hospitalId: 'HOSP-DEL-001',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Seed corresponding encounter
      const encounterId = `ENC-${patient.id}`;
      const summary = DEMO_SUMMARIES[patient.id];
      const hasRedFlag = DEMO_RED_FLAGS.some((rf) => rf.patientId === patient.id);

      await setDoc(doc(db, COLLECTIONS.ENCOUNTERS, encounterId), {
        id: encounterId,
        patientId: patient.id,
        hospitalId: 'HOSP-DEL-001',
        doctorId: 'user-doc-01',
        tokenNumber: summary?.tokenNumber || 'A-101',
        department: (patient as any).department || 'General Medicine',
        chiefComplaint: summary?.chiefComplaint || 'Routine Consultation',
        intakeMode: summary?.intakeMode || 'modern',
        status: summary?.isPhysicianVerified ? 'VERIFIED' : hasRedFlag ? 'WAITING' : 'WAITING',
        triagePriority: hasRedFlag ? 'EMERGENCY' : 'STANDARD',
        hasRedFlag,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Seed Clinical Summary
      if (summary) {
        await setDoc(doc(db, COLLECTIONS.CLINICAL_SUMMARIES, summary.id || `SUM-${patient.id}`), {
          ...summary,
          encounterId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    }

    // 3. Seed Audit Log
    await setDoc(doc(collection(db, COLLECTIONS.AUDIT_LOGS)), {
      action: 'SYSTEM_INITIALIZED',
      role: 'ADMIN',
      userId: 'system',
      hospitalId: 'HOSP-DEL-001',
      entityType: 'SYSTEM',
      entityId: 'ROOT',
      timestamp: new Date().toISOString(),
      metadata: { note: 'MediKiosk database bootstrap initialized.' },
    });
  } catch (error) {
    console.warn('[Firestore Seed] Notice: Proceeding with available access.', error);
  }
}

// -------------------------------------------------------------
// PATIENT OPERATIONS
// -------------------------------------------------------------
export async function savePatientRecord(patient: Patient, userId?: string): Promise<void> {
  try {
    const ref = doc(db, COLLECTIONS.PATIENTS, patient.id);
    await setDoc(
      ref,
      {
        ...patient,
        userId: userId || patient.id,
        hospitalId: 'HOSP-DEL-001',
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Error saving patient to Firestore:', error);
    throw error;
  }
}

export function subscribeToPatients(callback: (patients: Patient[]) => void) {
  try {
    const q = query(collection(db, COLLECTIONS.PATIENTS));
    return onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          callback(DEMO_PATIENTS);
          return;
        }
        const list: Patient[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as Patient);
        });
        callback(list);
      },
      (err) => {
        console.warn('Patients snapshot listener notice, using memory data:', err);
        callback(DEMO_PATIENTS);
      }
    );
  } catch (e) {
    console.warn('subscribeToPatients error:', e);
    callback(DEMO_PATIENTS);
    return () => {};
  }
}

// -------------------------------------------------------------
// ENCOUNTER & QUEUE OPERATIONS
// -------------------------------------------------------------
export async function createPatientEncounter(
  patient: Patient,
  summary: ClinicalSummary,
  redFlag: RedFlagAlert | null,
  intakeMode: IntakeMode,
  clinicalAnswers?: QuestionAnswer[],
  ayushData?: AyushHistory,
  documents?: DocumentRecord[]
): Promise<string> {
  const encounterId = `ENC-${patient.id}-${Date.now().toString().slice(-4)}`;
  const encounterData: FirestoreEncounter = {
    id: encounterId,
    patientId: patient.id,
    hospitalId: 'HOSP-DEL-001',
    doctorId: 'user-doc-01',
    tokenNumber: summary.tokenNumber || `A-${Math.floor(100 + Math.random() * 900)}`,
    department: (patient as any).department || 'General Medicine',
    chiefComplaint: summary.chiefComplaint || 'Consultation',
    intakeMode,
    status: 'WAITING',
    triagePriority: redFlag ? (redFlag.priority === 'URGENT' || redFlag.priority === 'HIGH' ? 'EMERGENCY' : 'URGENT') : 'STANDARD',
    hasRedFlag: Boolean(redFlag),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    // 1. Save Encounter
    await setDoc(doc(db, COLLECTIONS.ENCOUNTERS, encounterId), encounterData);

    // 2. Save Summary with link to encounter
    await setDoc(doc(db, COLLECTIONS.CLINICAL_SUMMARIES, summary.id || `SUM-${patient.id}`), {
      ...summary,
      encounterId,
      updatedAt: serverTimestamp(),
    });

    // 3. Save Clinical History document
    if (clinicalAnswers && clinicalAnswers.length > 0) {
      await setDoc(doc(db, COLLECTIONS.CLINICAL_HISTORIES, `HIST-${encounterId}`), {
        id: `HIST-${encounterId}`,
        encounterId,
        patientId: patient.id,
        HPI: summary.historyOfPresentIllness || summary.chiefComplaint,
        pastMedicalHistory: summary.pastMedicalHistory || [],
        pastSurgicalHistory: summary.pastSurgicalHistory || [],
        drugHistory: summary.currentMedications || [],
        allergyHistory: summary.drugAllergies || [],
        familyHistory: summary.familyHistory || [],
        personalHistory: summary.personalHistory || {},
        clinicalAnswers,
        redFlags: redFlag ? [redFlag] : [],
        updatedAt: serverTimestamp(),
      });
    }

    // 4. Save AYUSH assessment if present
    if (ayushData) {
      await setDoc(doc(db, COLLECTIONS.AYUSH_ASSESSMENTS, `AYUSH-${encounterId}`), {
        id: `AYUSH-${encounterId}`,
        encounterId,
        patientId: patient.id,
        ...ayushData,
        updatedAt: serverTimestamp(),
      });
    }

    // 5. Save Documents metadata if present
    if (documents && documents.length > 0) {
      for (const docRec of documents) {
        await setDoc(doc(db, COLLECTIONS.DOCUMENTS, docRec.id), {
          id: docRec.id,
          patientId: patient.id,
          encounterId,
          filename: docRec.title,
          documentType: docRec.type,
          downloadUrl: docRec.fileUrl,
          uploadTimestamp: docRec.date || new Date().toISOString(),
          ocrStatus: docRec.ocrStatus || 'completed',
          ocrConfidence: docRec.confidenceScore || 90,
          updatedAt: serverTimestamp(),
        });

        if (docRec.extractedEntities && docRec.extractedEntities.length > 0) {
          await setDoc(doc(db, COLLECTIONS.OCR_RESULTS, `OCR-${docRec.id}`), {
            id: `OCR-${docRec.id}`,
            documentId: docRec.id,
            encounterId,
            medications: docRec.extractedEntities.filter((e) => e.type === 'medication'),
            diagnoses: docRec.extractedEntities.filter((e) => e.type === 'diagnosis'),
            investigations: docRec.extractedEntities.filter((e) => e.type === 'investigation'),
            confidenceScores: { overall: docRec.confidenceScore || 90 },
            verificationStatus: 'COMPLETED',
            updatedAt: serverTimestamp(),
          });
        }
      }
    }

    return encounterId;
  } catch (error) {
    console.error('Error creating encounter in Firestore:', error);
    return encounterId;
  }
}

export function subscribeToEncounters(callback: (encounters: FirestoreEncounter[]) => void) {
  try {
    const q = query(collection(db, COLLECTIONS.ENCOUNTERS));
    return onSnapshot(
      q,
      (snapshot) => {
        const list: FirestoreEncounter[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as FirestoreEncounter);
        });
        callback(list);
      },
      (err) => {
        console.warn('Encounters listener notice:', err);
      }
    );
  } catch (e) {
    console.warn('subscribeToEncounters error:', e);
    return () => {};
  }
}

export function subscribeToSummaries(callback: (summaries: Record<string, ClinicalSummary>) => void) {
  try {
    const q = query(collection(db, COLLECTIONS.CLINICAL_SUMMARIES));
    return onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          callback(DEMO_SUMMARIES);
          return;
        }
        const record: Record<string, ClinicalSummary> = { ...DEMO_SUMMARIES };
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as ClinicalSummary;
          if (data.patientId) {
            record[data.patientId] = data;
          }
        });
        callback(record);
      },
      (err) => {
        console.warn('Summaries listener notice:', err);
        callback(DEMO_SUMMARIES);
      }
    );
  } catch (e) {
    console.warn('subscribeToSummaries error:', e);
    callback(DEMO_SUMMARIES);
    return () => {};
  }
}

export async function updateClinicalSummaryInDb(summary: ClinicalSummary): Promise<void> {
  try {
    const summaryId = summary.id || `SUM-${summary.patientId}`;
    const ref = doc(db, COLLECTIONS.CLINICAL_SUMMARIES, summaryId);
    await setDoc(
      ref,
      {
        ...summary,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Error updating summary in Firestore:', error);
  }
}

// -------------------------------------------------------------
// PHYSICIAN SIGN-OFF & FHIR REPORT
// -------------------------------------------------------------
export async function savePhysicianSignOffAndFhir(
  encounterId: string,
  patient: Patient,
  summary: ClinicalSummary,
  doctorNotes: string,
  doctorName: string,
  doctorRegNo: string,
  fhirReport: any,
  doctorId = 'user-doc-01'
): Promise<{ signOffId: string; reportId: string }> {
  const signOffId = `SIG-${Date.now()}`;
  const reportId = `FHIR-DR-${patient.id}-${Date.now().toString().slice(-4)}`;
  const nowStr = new Date().toISOString();

  try {
    // 1. Save DiagnosticReport
    await setDoc(doc(db, COLLECTIONS.DIAGNOSTIC_REPORTS, reportId), {
      id: reportId,
      encounterId,
      patientId: patient.id,
      doctorId,
      status: 'final',
      fhirVersion: 'R4',
      resource: fhirReport,
      generatedAt: nowStr,
    });

    // 2. Save Sign-Off Record
    await setDoc(doc(db, COLLECTIONS.SIGN_OFFS, signOffId), {
      id: signOffId,
      encounterId,
      doctorId,
      doctorName,
      doctorRegistrationNumber: doctorRegNo,
      finalNotes: doctorNotes,
      signedAt: nowStr,
      status: 'SIGNED_OFF',
      diagnosticReportId: reportId,
    });

    // 3. Save Physician Review record
    await setDoc(doc(db, COLLECTIONS.PHYSICIAN_REVIEWS, `REV-${encounterId}`), {
      id: `REV-${encounterId}`,
      encounterId,
      doctorId,
      doctorName,
      notes: doctorNotes,
      verificationStatus: 'VERIFIED',
      verifiedAt: nowStr,
      updatedAt: serverTimestamp(),
    });

    // 4. Update Summary verification
    const summaryId = summary.id || `SUM-${patient.id}`;
    await setDoc(
      doc(db, COLLECTIONS.CLINICAL_SUMMARIES, summaryId),
      {
        ...summary,
        isPhysicianVerified: true,
        verifiedByDoctorName: doctorName,
        verificationTimestamp: nowStr,
        physicianNotes: doctorNotes,
        status: 'SIGNED_OFF',
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    // 5. Update Encounter status
    await setDoc(
      doc(db, COLLECTIONS.ENCOUNTERS, encounterId),
      {
        status: 'VERIFIED',
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    // 6. Log Audit Event
    await setDoc(doc(collection(db, COLLECTIONS.AUDIT_LOGS)), {
      action: 'PHYSICIAN_SIGNED_OFF',
      role: 'DOCTOR',
      userId: doctorId,
      hospitalId: 'HOSP-DEL-001',
      entityType: 'ENCOUNTER',
      entityId: encounterId,
      timestamp: nowStr,
      metadata: {
        patientId: patient.id,
        doctorName,
        doctorRegNo,
        diagnosticReportId: reportId,
      },
    });

    return { signOffId, reportId };
  } catch (error) {
    console.error('Error recording sign-off and FHIR report:', error);
    return { signOffId, reportId };
  }
}

// -------------------------------------------------------------
// ADMIN ANALYTICS COMPILATION & REALTIME SUBSCRIPTION
// -------------------------------------------------------------
export function subscribeToLiveAdminAnalytics(callback: (stats: AdminStats) => void) {
  try {
    const encountersQuery = query(collection(db, COLLECTIONS.ENCOUNTERS));
    const patientsQuery = query(collection(db, COLLECTIONS.PATIENTS));
    const docsQuery = query(collection(db, COLLECTIONS.DOCUMENTS));

    let encountersCache: any[] = [];
    let patientsCache: any[] = [];
    let docsCount = 0;

    const computeAndEmit = () => {
      let waiting = 0;
      let completed = 0;
      let emergency = 0;
      const langMap: Record<string, number> = { hi: 0, en: 0, mr: 0, ta: 0, te: 0, bn: 0 };
      const deptMap: Record<string, number> = {};

      encountersCache.forEach((enc) => {
        if (enc.status === 'WAITING' || enc.status === 'IN_REVIEW' || enc.status === 'INTAKE') waiting++;
        if (enc.status === 'VERIFIED' || enc.status === 'SIGNED_OFF' || enc.status === 'COMPLETED') completed++;
        if (enc.triagePriority === 'EMERGENCY' || enc.hasRedFlag) emergency++;

        const dept = enc.department || 'General Medicine';
        deptMap[dept] = (deptMap[dept] || 0) + 1;
      });

      patientsCache.forEach((pat) => {
        const lang = pat.preferredLanguage || 'hi';
        langMap[lang] = (langMap[lang] || 0) + 1;
      });

      callback({
        totalPatients: patientsCache.length,
        todayEncounters: encountersCache.length,
        waitingCount: waiting,
        completedCount: completed,
        emergencyCount: emergency,
        averageIntakeDuration: '2m 30s',
        languageBreakdown: langMap,
        departmentBreakdown: deptMap,
        ocrProcessedCount: docsCount,
      });
    };

    const unsubEncounters = onSnapshot(encountersQuery, (snap) => {
      encountersCache = snap.docs.map((d) => d.data());
      computeAndEmit();
    });

    const unsubPatients = onSnapshot(patientsQuery, (snap) => {
      patientsCache = snap.docs.map((d) => d.data());
      computeAndEmit();
    });

    const unsubDocs = onSnapshot(docsQuery, (snap) => {
      docsCount = snap.size;
      computeAndEmit();
    });

    return () => {
      unsubEncounters();
      unsubPatients();
      unsubDocs();
    };
  } catch (e) {
    console.warn('subscribeToLiveAdminAnalytics notice:', e);
    return () => {};
  }
}

export async function fetchLiveAdminAnalytics(): Promise<AdminStats> {
  try {
    const encountersSnapshot = await getDocs(collection(db, COLLECTIONS.ENCOUNTERS));
    const patientsSnapshot = await getDocs(collection(db, COLLECTIONS.PATIENTS));
    const docsSnapshot = await getDocs(collection(db, COLLECTIONS.DOCUMENTS));

    let waiting = 0;
    let completed = 0;
    let emergency = 0;
    const langMap: Record<string, number> = { hi: 0, en: 0, mr: 0, ta: 0, te: 0, bn: 0 };
    const deptMap: Record<string, number> = {};

    encountersSnapshot.forEach((d) => {
      const enc = d.data() as FirestoreEncounter;
      if (enc.status === 'WAITING' || enc.status === 'IN_REVIEW' || enc.status === 'INTAKE') waiting++;
      if (enc.status === 'VERIFIED' || enc.status === 'SIGNED_OFF' || enc.status === 'COMPLETED') completed++;
      if (enc.triagePriority === 'EMERGENCY' || enc.hasRedFlag) emergency++;

      const dept = enc.department || 'General Medicine';
      deptMap[dept] = (deptMap[dept] || 0) + 1;
    });

    patientsSnapshot.forEach((d) => {
      const pat = d.data() as any;
      const lang = pat.preferredLanguage || 'hi';
      langMap[lang] = (langMap[lang] || 0) + 1;
    });

    return {
      totalPatients: patientsSnapshot.size,
      todayEncounters: encountersSnapshot.size,
      waitingCount: waiting,
      completedCount: completed,
      emergencyCount: emergency,
      averageIntakeDuration: '2m 30s',
      languageBreakdown: langMap,
      departmentBreakdown: deptMap,
      ocrProcessedCount: docsSnapshot.size,
    };
  } catch (e) {
    return {
      totalPatients: 0,
      todayEncounters: 0,
      waitingCount: 0,
      completedCount: 0,
      emergencyCount: 0,
      averageIntakeDuration: '0m',
      languageBreakdown: { hi: 0, en: 0, mr: 0 },
      departmentBreakdown: { 'General Medicine': 0 },
      ocrProcessedCount: 0,
    };
  }
}
