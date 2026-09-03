import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '15mb' }));

// Lazy Google GenAI Client
let genAI: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not set. AI requests will return fallback structured responses.');
    }
    genAI = new GoogleGenAI({ apiKey: apiKey || '' });
  }
  return genAI;
}

// 1. Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'MediKiosk Clinical Core Backend',
    timestamp: new Date().toISOString(),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
  });
});

// 2. Server-side Gemini Clinical Intake Assist
app.post('/api/ai/intake-assist', async (req, res) => {
  try {
    const { complaint, userResponse, language = 'en', currentAnswers = [] } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.json({
        success: true,
        fallback: true,
        suggestedFollowUp: 'Do you have any associated fever, breathing discomfort, or radiating pain?',
        triagePriority: 'STANDARD',
      });
    }

    const ai = getGeminiClient();
    const prompt = `You are a clinical decision-support triage assistant in an Indian Hospital OPD kiosk.
Patient's Primary Complaint: ${complaint}
User's Latest Statement: ${userResponse}
Language requested: ${language}
Prior answers: ${JSON.stringify(currentAnswers)}

Provide a structured clinical follow-up question and determine triage urgency.
Return ONLY valid JSON in this structure:
{
  "suggestedFollowUp": "Clear, patient-friendly follow-up question",
  "audioPrompt": "Short spoken prompt in simple terms",
  "isRedFlag": false,
  "triagePriority": "STANDARD" | "URGENT" | "EMERGENCY",
  "clinicalRationale": "Brief 1-sentence note for doctor"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text?.trim() || '{}';
    const parsed = JSON.parse(text);
    return res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Error in /api/ai/intake-assist:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to process clinical intake assistance',
      fallback: true,
      suggestedFollowUp: 'Please describe the onset and severity of your symptoms.',
      triagePriority: 'STANDARD',
    });
  }
});

// 3. Server-side Gemini Document OCR & Entity Extraction
app.post('/api/ai/ocr-extract', async (req, res) => {
  try {
    const { documentText, imageBase64, mimeType = 'image/jpeg', documentType = 'Prescription' } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey && !documentText) {
      return res.json({
        success: true,
        fallback: true,
        entities: [],
        message: 'No API key configured for live OCR model extraction.',
      });
    }

    const ai = getGeminiClient();
    const contents: any[] = [];

    if (imageBase64) {
      contents.push({
        inlineData: {
          mimeType,
          data: imageBase64.replace(/^data:image\/\w+;base64,/, ''),
        },
      });
    }

    const prompt = `Extract all medical entities from this Indian hospital ${documentType} (such as medications, dosage, frequency, lab test results, diagnoses, and doctor advice).
${documentText ? `Raw text:\n${documentText}` : ''}

Output strictly valid JSON with this schema:
{
  "hospitalOrClinic": "Hospital / Clinic name or Unknown",
  "documentDate": "YYYY-MM-DD or Unknown",
  "entities": [
    {
      "id": "ent-1",
      "type": "medication" | "investigation" | "diagnosis" | "vitals" | "advice",
      "name": "Exact medication or test name",
      "dose": "e.g. 500 mg or empty",
      "frequency": "e.g. BD / OD / HS or empty",
      "value": "e.g. 9.1 or empty for lab values",
      "unit": "e.g. % or mg/dL or empty",
      "confidence": 95,
      "isVerified": false,
      "rawText": "snippet from document"
    }
  ],
  "rawSummary": "Concise summary of findings in this medical record"
}`;

    contents.push(prompt);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    return res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Error in /api/ai/ocr-extract:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'OCR parsing failed',
      fallback: true,
    });
  }
});

// 4. Server-side Gemini Clinical Summary Synthesis
app.post('/api/ai/generate-summary', async (req, res) => {
  try {
    const { patient, answers, documents, intakeMode, ayushData } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.json({
        success: true,
        fallback: true,
        message: 'Using rule-based clinical engine for summary generation.',
      });
    }

    const ai = getGeminiClient();
    const prompt = `You are an expert Clinical Decision Support System aiding doctors in an Indian OPD.
Patient Profile: ${JSON.stringify(patient || {})}
Intake Mode: ${intakeMode || 'modern'}
Clinical Questionnaire Answers: ${JSON.stringify(answers || [])}
Attached Documents & OCR: ${JSON.stringify(documents || [])}
AYUSH Pariksha Data: ${JSON.stringify(ayushData || {})}

Synthesize an outpatient clinical summary. Do NOT invent diagnoses; strictly format the patient's reported symptoms, timeline, and extracted documents for physician review.
Return ONLY valid JSON:
{
  "chiefComplaint": "Concise chief complaint with duration",
  "historyOfPresentIllness": "Detailed chronological narrative of symptoms, aggravating/relieving factors, and onset",
  "pastMedicalHistory": ["Known conditions"],
  "pastSurgicalHistory": ["Past surgeries or None"],
  "currentMedications": [
    {
      "name": "Medicine name",
      "dosage": "500 mg",
      "frequency": "BD",
      "confidenceScore": 92,
      "isPhysicianVerified": false
    }
  ],
  "drugAllergies": ["e.g. Penicillin or Nil known"],
  "familyHistory": ["e.g. Father: CAD"],
  "personalHistory": {
    "diet": "Vegetarian / Non-Vegetarian",
    "smoking": "Non-smoker",
    "alcohol": "Non-drinker",
    "sleep": "Adequate",
    "bowelBladder": "Regular"
  },
  "reviewOfSystems": ["pertinent negative/positive systems"],
  "redFlags": ["Any emergency warning triggers or None"],
  "confidenceScore": 94,
  "intakeMode": "${intakeMode || 'modern'}"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    return res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Error in /api/ai/generate-summary:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Summary generation failed',
      fallback: true,
    });
  }
});

// Vite middleware / Static Serving
async function setupViteOrStatic() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[MediKiosk Backend] Server running on http://0.0.0.0:${PORT}`);
  });
}

setupViteOrStatic();
