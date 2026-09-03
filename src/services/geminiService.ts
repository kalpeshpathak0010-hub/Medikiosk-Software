export interface AiIntakeAssistResult {
  suggestedFollowUp: string;
  audioPrompt?: string;
  isRedFlag?: boolean;
  triagePriority?: 'STANDARD' | 'URGENT' | 'EMERGENCY';
  clinicalRationale?: string;
}

export interface AiOcrResult {
  hospitalOrClinic?: string;
  hospitalName?: string;
  documentDate?: string;
  confidenceScore?: number;
  rawText?: string;
  rawSummary?: string;
  entities: Array<{
    id?: string;
    type: 'medication' | 'investigation' | 'diagnosis' | 'vitals' | 'advice' | 'procedure' | 'allergy' | 'vital';
    name: string;
    dose?: string;
    frequency?: string;
    value?: string;
    unit?: string;
    confidence: number;
    isVerified: boolean;
    rawText?: string;
    date?: string;
  }>;
  timeline?: Array<{
    year?: string;
    date?: string;
    title?: string;
    category?: string;
    description?: string;
    department?: string;
  }>;
}

export const geminiService = {
  // Call server-side intake assist
  async getIntakeAssist(
    complaint: string,
    userResponse: string,
    language: string = 'en',
    currentAnswers: any[] = []
  ): Promise<AiIntakeAssistResult> {
    try {
      const response = await fetch('/api/ai/intake-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ complaint, userResponse, language, currentAnswers }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const resJson = await response.json();
      return resJson.data || resJson;
    } catch (e) {
      console.warn('Fallback clinical assistance:', e);
      return {
        suggestedFollowUp: 'Are you experiencing any radiating pain, sweating, or fever?',
        triagePriority: 'STANDARD',
      };
    }
  },

  // Call server-side OCR entity extractor
  async extractDocumentEntities(
    documentText: string,
    imageBase64?: string,
    documentType: string = 'Prescription'
  ): Promise<AiOcrResult> {
    try {
      const response = await fetch('/api/ai/ocr-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentText, imageBase64, documentType }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const resJson = await response.json();
      return resJson.data || { entities: [] };
    } catch (e) {
      console.warn('Fallback OCR extraction:', e);
      return { entities: [] };
    }
  },

  // Call server-side clinical summary generator
  async generateClinicalSummary(payload: {
    patient: any;
    answers: any[];
    documents: any[];
    intakeMode: string;
    ayushData?: any;
  }): Promise<any> {
    try {
      const response = await fetch('/api/ai/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const resJson = await response.json();
      return resJson.data || null;
    } catch (e) {
      console.warn('Fallback summary generation:', e);
      return null;
    }
  },
};

export async function callServerOcrExtract(
  imageBase64: string,
  mimeType: string = 'image/jpeg',
  documentType: string = 'Prescription'
) {
  try {
    const res = await geminiService.extractDocumentEntities('', imageBase64, documentType);
    return { success: true, data: res };
  } catch (err: any) {
    return { success: false, error: err?.message || 'OCR Extraction failed' };
  }
}
