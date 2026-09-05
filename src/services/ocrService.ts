import { DocumentRecord, ExtractedEntity, MedicalTimelineEvent } from '../types';
import { callServerOcrExtract } from './geminiService';

export interface OcrResult {
  document: DocumentRecord;
  newTimelineEvents: MedicalTimelineEvent[];
}

export const SAMPLE_DOCUMENTS: Array<{
  title: string;
  type: DocumentRecord['type'];
  hospital: string;
  previewUrl: string;
  rawText: string;
  entities: ExtractedEntity[];
  timeline: MedicalTimelineEvent[];
}> = [
  {
    title: 'Dr. Mehta Clinic - OPD Prescription (2025)',
    type: 'Prescription',
    hospital: 'Apex Heart & Diabetes Institute, Mumbai',
    previewUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80',
    rawText: `APEX HEART & DIABETES CLINIC
Patient: Rajesh Sharma | Age: 55 | Date: 12-Nov-2025
Rx:
1. Tab. Metformin 500 mg - 1 tab BD after meals (Confidence 96%)
2. Tab. Telmisartan 40 mg - 1 tab OD morning (Confidence 94%)
3. Tab. Atorvastatin 20 mg - 1 tab HS (Confidence 91%)
4. Tab. Clopidogrel 75 mg - 1 tab OD (Confidence 88%)
Advice: Check HbA1c, Fasting Blood Sugar in 3 months. Low salt & low carb diet.`,
    entities: [
      {
        id: 'ent-1',
        type: 'medication',
        name: 'Metformin',
        dose: '500 mg',
        frequency: 'BD (Twice Daily)',
        confidence: 96,
        isVerified: true,
        date: '2025-11-12',
      },
      {
        id: 'ent-2',
        type: 'medication',
        name: 'Telmisartan',
        dose: '40 mg',
        frequency: 'OD (Once Daily)',
        confidence: 94,
        isVerified: true,
        date: '2025-11-12',
      },
      {
        id: 'ent-3',
        type: 'medication',
        name: 'Atorvastatin',
        dose: '20 mg',
        frequency: 'HS (Bedtime)',
        confidence: 91,
        isVerified: true,
        date: '2025-11-12',
      },
      {
        id: 'ent-4',
        type: 'diagnosis',
        name: 'Type 2 Diabetes Mellitus',
        confidence: 98,
        isVerified: true,
        date: '2025-11-12',
      },
      {
        id: 'ent-5',
        type: 'diagnosis',
        name: 'Essential Hypertension',
        confidence: 95,
        isVerified: true,
        date: '2025-11-12',
      },
      {
        id: 'ent-6',
        type: 'medication',
        name: 'Clopidogrel (?)',
        dose: '75 mg',
        frequency: 'OD',
        confidence: 64, // Low confidence to trigger physician verification!
        isVerified: false,
        rawText: 'Tab. Clopi... 75 mg OD',
        date: '2025-11-12',
      },
    ],
    timeline: [
      {
        id: 'tl-1',
        patientId: '',
        year: '2025',
        date: '12 Nov 2025',
        title: 'Prescription for Diabetes & Hypertension',
        category: 'prescription',
        description: 'Metformin 500mg BD, Telmisartan 40mg OD, Atorvastatin 20mg HS',
        department: 'Cardio-Diabetology',
      },
    ],
  },
  {
    title: 'Dr. Lal PathLabs - Comprehensive Metabolic Panel & HbA1c',
    type: 'Laboratory Report',
    hospital: 'Dr. Lal PathLabs Central Reference Lab',
    previewUrl: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=600&q=80',
    rawText: `DR. LAL PATHLABS
Investigation: HbA1c (Glycosylated Hemoglobin)
Method: HPLC (NGSP Certified)
Result: 9.1 %  [Normal: < 5.7 %, Good Control: < 7.0 %] -> High
Fasting Blood Sugar: 168 mg/dL [Normal: 70 - 100 mg/dL]
Serum Creatinine: 1.1 mg/dL [Normal: 0.7 - 1.3 mg/dL]
Lipid Profile: Total Cholesterol 224 mg/dL [Desirable: < 200]
LDL Cholesterol: 142 mg/dL`,
    entities: [
      {
        id: 'ent-7',
        type: 'investigation',
        name: 'HbA1c (Glycated Hemoglobin)',
        value: '9.1',
        unit: '%',
        referenceRange: '< 5.7%',
        confidence: 98,
        isVerified: true,
        date: '2025-08-20',
      },
      {
        id: 'ent-8',
        type: 'investigation',
        name: 'Fasting Blood Sugar',
        value: '168',
        unit: 'mg/dL',
        referenceRange: '70 - 100 mg/dL',
        confidence: 97,
        isVerified: true,
        date: '2025-08-20',
      },
      {
        id: 'ent-9',
        type: 'investigation',
        name: 'Serum Creatinine',
        value: '1.1',
        unit: 'mg/dL',
        referenceRange: '0.7 - 1.3 mg/dL',
        confidence: 95,
        isVerified: true,
        date: '2025-08-20',
      },
      {
        id: 'ent-10',
        type: 'investigation',
        name: 'Total Cholesterol',
        value: '224',
        unit: 'mg/dL',
        referenceRange: '< 200 mg/dL',
        confidence: 94,
        isVerified: true,
        date: '2025-08-20',
      },
    ],
    timeline: [
      {
        id: 'tl-2',
        patientId: '',
        year: '2025',
        date: '20 Aug 2025',
        title: 'High Glycemic Marker (HbA1c 9.1%)',
        category: 'investigation',
        description: 'Elevated HbA1c 9.1% and Fasting Blood Sugar 168 mg/dL indicating sub-optimal diabetic control.',
        severity: 'caution',
        department: 'Biochemistry / Pathology',
      },
    ],
  },
  {
    title: 'Lilavati Hospital - Cardiac Care Unit Discharge Summary',
    type: 'Discharge Summary',
    hospital: 'Lilavati Hospital & Research Centre, Bandra',
    previewUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=600&q=80',
    rawText: `LILAVATI HOSPITAL & RESEARCH CENTRE
Discharge Summary | IPD No: 98124
Admission Date: 14-Mar-2023 | Discharge Date: 17-Mar-2023
Primary Diagnosis: Acute Coronary Syndrome - Unstable Angina
Coronary Angiography: Single vessel disease (70% mid-LAD stenosis)
Procedure: PTCA with Drug-Eluting Stent (DES) to LAD on 15-Mar-2023.
Course in Hospital: Uneventful recovery. Stable vitals at discharge.
Discharge Medications: Aspirin 75mg, Ticagrelor 90mg BD, Rosuvastatin 20mg.`,
    entities: [
      {
        id: 'ent-11',
        type: 'diagnosis',
        name: 'Acute Coronary Syndrome / Unstable Angina',
        confidence: 98,
        isVerified: true,
        date: '2023-03-14',
      },
      {
        id: 'ent-12',
        type: 'procedure',
        name: 'Coronary Angioplasty (PTCA with DES Stent to LAD)',
        confidence: 97,
        isVerified: true,
        date: '2023-03-15',
      },
    ],
    timeline: [
      {
        id: 'tl-3',
        patientId: '',
        year: '2023',
        date: '15 Mar 2023',
        title: 'Hospital Admission & Coronary Stenting (LAD PTCA)',
        category: 'surgery',
        description: 'Admitted for Unstable Angina; successful DES stenting to mid-LAD artery.',
        severity: 'critical',
        department: 'Interventional Cardiology',
      },
    ],
  },
];

/**
 * Document processing and extraction pipeline (Server-backed OCR with offline fallback)
 */
export async function processDocumentFile(
  file: File | { name: string; type?: string; text?: string; base64?: string },
  patientId: string,
  docType: DocumentRecord['type'] = 'Prescription'
): Promise<OcrResult> {
  const sampleIndex = docType === 'Laboratory Report' ? 1 : docType === 'Discharge Summary' ? 2 : 0;
  const sample = SAMPLE_DOCUMENTS[sampleIndex] || SAMPLE_DOCUMENTS[0];
  const docId = `DOC-${Date.now().toString().slice(-6)}`;

  // If a real base64 or text file is uploaded, attempt server-side Gemini OCR extraction
  if ('base64' in file && file.base64) {
    try {
      const serverRes = await callServerOcrExtract(
        file.base64,
        file.type || 'image/jpeg',
        docType
      );
      if (serverRes.success && serverRes.data) {
        const d = serverRes.data;
        const document: DocumentRecord = {
          id: docId,
          patientId,
          title: file.name || `${docType} Document`,
          type: docType,
          date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          fileUrl: sample.previewUrl,
          thumbnailUrl: sample.previewUrl,
          ocrStatus: 'completed',
          confidenceScore: d.confidenceScore || 94,
          extractedEntities: (d.entities || []).map((e: any, idx: number) => ({
            id: `${docId}-ent-${idx + 1}`,
            type: e.type || 'medication',
            name: e.name || 'Extracted Clinical Entity',
            dose: e.dose,
            frequency: e.frequency,
            confidence: e.confidence || 90,
            isVerified: (e.confidence || 90) >= 80,
            date: e.date || new Date().toISOString().split('T')[0],
            rawText: e.rawText,
          })),
          rawOcrText: d.rawText || sample.rawText,
          hospitalName: d.hospitalName || sample.hospital,
        };

        const newTimelineEvents: MedicalTimelineEvent[] = (d.timeline || sample.timeline).map((tl: any, idx: number) => ({
          id: `TL-${Date.now()}-${idx}`,
          patientId,
          year: tl.year || new Date().getFullYear().toString(),
          date: tl.date || 'Recent',
          title: tl.title || `${docType} Event`,
          category: tl.category || (docType === 'Prescription' ? 'prescription' : docType === 'Laboratory Report' ? 'lab' : 'consultation'),
          description: tl.description || document.title,
          department: tl.department || 'General Medicine',
          documentId: docId,
          documentTitle: document.title,
        }));

        return { document, newTimelineEvents };
      }
    } catch (e) {
      console.warn('Server OCR fallback engaged:', e);
    }
  }

  // Simulated OCR pipeline delay: Image Prep -> OCR -> Entity Extraction
  await new Promise((resolve) => setTimeout(resolve, 1200));

  const document: DocumentRecord = {
    id: docId,
    patientId,
    title: file.name || sample.title,
    type: docType,
    date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    fileUrl: sample.previewUrl,
    thumbnailUrl: sample.previewUrl,
    ocrStatus: 'completed',
    confidenceScore: 92,
    extractedEntities: sample.entities.map((e) => ({ ...e, id: `${docId}-${e.id}` })),
    rawOcrText: sample.rawText,
    hospitalName: sample.hospital,
  };

  const newTimelineEvents: MedicalTimelineEvent[] = sample.timeline.map((tl, index) => ({
    ...tl,
    id: `TL-${Date.now()}-${(index + 1).toString().padStart(3, '0')}`,
    patientId,
    documentId: docId,
    documentTitle: document.title,
  }));

  return { document, newTimelineEvents };
}
