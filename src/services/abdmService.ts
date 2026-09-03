import { Patient } from '../types';

export interface AbhaProfile {
  abhaNumber: string;
  abhaAddress: string;
  name: string;
  gender: 'M' | 'F' | 'O';
  dateOfBirth: string;
  mobile: string;
  photoBase64?: string;
  stateName: string;
  districtName: string;
  kycVerified: boolean;
}

export interface ConsentArtifact {
  id: string;
  patientAbhaId: string;
  hipId: string;
  hiTypes: string[];
  purpose: string;
  status: 'GRANTED' | 'REQUESTED' | 'REVOKED';
  grantedOn: string;
  expiresOn: string;
}

export interface FhirBundleMock {
  resourceType: 'Bundle';
  id: string;
  type: 'document' | 'collection';
  timestamp: string;
  entry: Array<{
    resource: {
      resourceType: 'Patient' | 'Condition' | 'MedicationRequest' | 'Observation' | 'DiagnosticReport';
      id: string;
      [key: string]: any;
    };
  }>;
}

class AbdmMockService {
  private registeredProfiles: Record<string, AbhaProfile> = {
    '91-4589-2341-9874': {
      abhaNumber: '91-4589-2341-9874',
      abhaAddress: 'rajesh.sharma@abdm',
      name: 'Rajesh Sharma',
      gender: 'M',
      dateOfBirth: '1970-05-14',
      mobile: '9820145892',
      stateName: 'Maharashtra',
      districtName: 'Mumbai Suburban',
      kycVerified: true,
    },
    '12-8874-1234-5678': {
      abhaNumber: '12-8874-1234-5678',
      abhaAddress: 'sunita.patel@abdm',
      name: 'Sunita Patel',
      gender: 'F',
      dateOfBirth: '1988-11-22',
      mobile: '9765412345',
      stateName: 'Gujarat',
      districtName: 'Ahmedabad',
      kycVerified: true,
    },
    '45-2319-9012-3456': {
      abhaNumber: '45-2319-9012-3456',
      abhaAddress: 'ramesh.deshmukh@abdm',
      name: 'Ramesh Deshmukh',
      gender: 'M',
      dateOfBirth: '1962-08-03',
      mobile: '9422019012',
      stateName: 'Maharashtra',
      districtName: 'Pune',
      kycVerified: true,
    },
    '78-9012-3456-7890': {
      abhaNumber: '78-9012-3456-7890',
      abhaAddress: 'priya.sharma@abdm',
      name: 'Priya Sharma',
      gender: 'F',
      dateOfBirth: '1997-04-19',
      mobile: '9819034567',
      stateName: 'Delhi',
      districtName: 'South Delhi',
      kycVerified: true,
    },
  };

  /**
   * Authenticates or fetches patient profile via ABHA
   */
  public async authenticatePatient(abhaOrMobile: string): Promise<{ success: boolean; profile?: AbhaProfile; message: string }> {
    await new Promise((resolve) => setTimeout(resolve, 800)); // Network delay

    const cleanInput = abhaOrMobile.replace(/\s+/g, '');
    const foundProfile = Object.values(this.registeredProfiles).find(
      (p) => p.abhaNumber.replace(/[- ]/g, '') === cleanInput.replace(/[- ]/g, '') || p.mobile === cleanInput || p.abhaAddress === abhaOrMobile
    );

    if (foundProfile) {
      return {
        success: true,
        profile: foundProfile,
        message: 'ABDM Health ID verified successfully.',
      };
    }

    // Quick auto-provision for test demonstration
    if (cleanInput.length >= 10) {
      const generatedProfile: AbhaProfile = {
        abhaNumber: cleanInput.length === 14 ? cleanInput : `91-${cleanInput.slice(0, 4)}-${cleanInput.slice(4, 8)}-${cleanInput.slice(8, 12) || '9901'}`,
        abhaAddress: `patient.${cleanInput.slice(-4)}@abdm`,
        name: 'Demo Patient',
        gender: 'M',
        dateOfBirth: '1985-01-01',
        mobile: cleanInput.slice(0, 10),
        stateName: 'Maharashtra',
        districtName: 'Mumbai',
        kycVerified: true,
      };
      return {
        success: true,
        profile: generatedProfile,
        message: 'ABDM Mock demo profile generated.',
      };
    }

    return {
      success: false,
      message: 'ABHA record not found. You may register as a new patient.',
    };
  }

  /**
   * Request consent artifact from patient via ABDM HIP
   */
  public async requestConsent(patientAbhaId: string): Promise<ConsentArtifact> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      id: `CONSENT-${Date.now()}`,
      patientAbhaId,
      hipId: 'IN-MH-HOSP-7482',
      hiTypes: ['OPConsultation', 'Prescription', 'DiagnosticReport', 'DischargeSummary'],
      purpose: 'CAREMGT (Care Management & OPD Consultation)',
      status: 'GRANTED',
      grantedOn: new Date().toISOString(),
      expiresOn: new Date(Date.now() + 86400000 * 30).toISOString(),
    };
  }

  /**
   * Generates a FHIR-compliant bundle representation of the clinical intake
   */
  public generateFhirBundle(patient: Patient, chiefComplaint: string, medications: any[]): FhirBundleMock {
    return {
      resourceType: 'Bundle',
      id: `FHIR-BUNDLE-${patient.id}`,
      type: 'document',
      timestamp: new Date().toISOString(),
      entry: [
        {
          resource: {
            resourceType: 'Patient',
            id: patient.id,
            identifier: [{ system: 'https://abdm.gov.in/health-id', value: patient.abhaId || '' }],
            name: [{ text: patient.name }],
            gender: patient.gender.toLowerCase(),
            birthDate: `${2026 - patient.age}-01-01`,
            telecom: [{ system: 'phone', value: patient.phone }],
          },
        },
        {
          resource: {
            resourceType: 'Condition',
            id: `cond-${Date.now()}`,
            clinicalStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active' }] },
            code: { text: chiefComplaint },
            subject: { reference: `Patient/${patient.id}` },
          },
        },
        ...medications.map((m, idx) => ({
          resource: {
            resourceType: 'MedicationRequest' as const,
            id: `med-${idx}-${Date.now()}`,
            status: 'active',
            intent: 'order',
            medicationCodeableConcept: { text: `${m.name} ${m.dose}` },
            subject: { reference: `Patient/${patient.id}` },
            dosageInstruction: [{ text: m.frequency }],
          },
        })),
      ],
    };
  }
}

export function generateFhirDiagnosticReport(patient: any, summary: any): any {
  return {
    resourceType: 'Bundle',
    id: `FHIR-R4-BUNDLE-${patient.id}`,
    identifier: {
      system: 'https://ndhm.gov.in/bundles',
      value: `BDL-${patient.id}-${Date.now()}`,
    },
    type: 'document',
    timestamp: new Date().toISOString(),
    entry: [
      {
        resource: {
          resourceType: 'Composition',
          id: `comp-${patient.id}`,
          status: 'final',
          type: {
            coding: [{ system: 'http://snomed.info/sct', code: '423401007', display: 'Clinical Intake Summary' }],
          },
          subject: { reference: `Patient/${patient.id}`, display: patient.name },
          date: new Date().toISOString(),
          title: 'MediKiosk Clinical Intake & Verification',
        },
      },
      {
        resource: {
          resourceType: 'Patient',
          id: patient.id,
          identifier: [{ system: 'https://abdm.gov.in/health-id', value: patient.abhaId || '' }],
          name: [{ text: patient.name }],
          gender: patient.gender.toLowerCase(),
          birthDate: `${2026 - patient.age}-01-01`,
          telecom: [{ system: 'phone', value: patient.phone }],
        },
      },
      {
        resource: {
          resourceType: 'Condition',
          id: `cond-${patient.id}`,
          clinicalStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active' }] },
          code: { text: summary?.chiefComplaint || 'Clinical Consultation' },
          subject: { reference: `Patient/${patient.id}` },
        },
      },
      {
        resource: {
          resourceType: 'DiagnosticReport',
          id: `diag-report-${patient.id}`,
          status: summary?.isPhysicianVerified ? 'final' : 'preliminary',
          code: { text: 'AI-Assisted Clinical History & Intake' },
          subject: { reference: `Patient/${patient.id}` },
          conclusion: summary?.historyOfPresentIllness || 'Patient intake collected.',
        },
      },
    ],
  };
}

export const abdmService = new AbdmMockService();

