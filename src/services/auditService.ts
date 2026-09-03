import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { COLLECTIONS } from './dbService';

export interface AuditEvent {
  action:
    | 'PATIENT_CREATED'
    | 'CONSENT_RECORDED'
    | 'ENCOUNTER_CREATED'
    | 'DOCUMENT_UPLOADED'
    | 'OCR_COMPLETED'
    | 'SUMMARY_GENERATED'
    | 'SUMMARY_EDITED'
    | 'PHYSICIAN_VERIFIED'
    | 'PHYSICIAN_SIGNED_OFF'
    | 'FHIR_REPORT_GENERATED'
    | 'UNAUTHORIZED_ACCESS_ATTEMPT'
    | 'STAFF_LOGIN'
    | 'STAFF_REGISTERED'
    | 'LOGOUT'
    | 'SYSTEM_INITIALIZED'
    | 'DOCTOR_AVAILABILITY_CHANGED';
  role: 'PATIENT' | 'DOCTOR' | 'ADMIN';
  userId: string;
  hospitalId?: string;
  entityType: 'PATIENT' | 'ENCOUNTER' | 'DOCUMENT' | 'SUMMARY' | 'SYSTEM' | 'AUTH' | 'USER';
  entityId: string;
  metadata?: Record<string, any>;
}

export async function logAuditEvent(event: AuditEvent): Promise<void> {
  try {
    const ref = doc(collection(db, COLLECTIONS.AUDIT_LOGS));
    await setDoc(ref, {
      ...event,
      hospitalId: event.hospitalId || 'HOSP-DEL-001',
      timestamp: new Date().toISOString(),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.warn('[Audit Log Notice]', error);
  }
}
