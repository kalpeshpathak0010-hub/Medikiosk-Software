import { Patient, ClinicalSummary, RedFlagAlert, MedicalTimelineEvent } from '../types';
import { DEMO_PATIENTS, DEMO_SUMMARIES, DEMO_RED_FLAGS, DEMO_TIMELINE_EVENTS } from '../data/demoPatients';

const STORAGE_KEYS = {
  PATIENTS: 'medikiosk_patients_v1',
  SUMMARIES: 'medikiosk_summaries_v1',
  RED_FLAGS: 'medikiosk_red_flags_v1',
  TIMELINE: 'medikiosk_timeline_v1',
};

export const storageService = {
  getPatients(): Patient[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PATIENTS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load patients from localStorage:', e);
    }
    return DEMO_PATIENTS;
  },

  savePatients(patients: Patient[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));
    } catch (e) {
      console.warn('Failed to save patients to localStorage:', e);
    }
  },

  getSummaries(): Record<string, ClinicalSummary> {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SUMMARIES);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load summaries from localStorage:', e);
    }
    return DEMO_SUMMARIES;
  },

  saveSummaries(summaries: Record<string, ClinicalSummary>): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SUMMARIES, JSON.stringify(summaries));
    } catch (e) {
      console.warn('Failed to save summaries to localStorage:', e);
    }
  },

  getRedFlags(): RedFlagAlert[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.RED_FLAGS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load red flags from localStorage:', e);
    }
    return DEMO_RED_FLAGS;
  },

  saveRedFlags(redFlags: RedFlagAlert[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.RED_FLAGS, JSON.stringify(redFlags));
    } catch (e) {
      console.warn('Failed to save red flags to localStorage:', e);
    }
  },

  getTimelineEvents(): MedicalTimelineEvent[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.TIMELINE);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load timeline events from localStorage:', e);
    }
    return DEMO_TIMELINE_EVENTS;
  },

  saveTimelineEvents(events: MedicalTimelineEvent[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.TIMELINE, JSON.stringify(events));
    } catch (e) {
      console.warn('Failed to save timeline events to localStorage:', e);
    }
  },

  resetAllToDefault(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.PATIENTS);
      localStorage.removeItem(STORAGE_KEYS.SUMMARIES);
      localStorage.removeItem(STORAGE_KEYS.RED_FLAGS);
      localStorage.removeItem(STORAGE_KEYS.TIMELINE);
    } catch (e) {
      console.warn('Failed to reset storage:', e);
    }
  },
};
