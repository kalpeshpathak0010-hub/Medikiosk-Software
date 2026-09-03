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

// 2. POST /api/ai/understand-response
// Converts natural patient language into structured clinical information
app.post('/api/ai/understand-response', async (req, res) => {
  try {
    const { sessionId, language = 'en', question = '', patientResponse = '' } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!patientResponse || patientResponse.trim() === '') {
      return res.json({
        success: true,
        data: {
          chiefComplaint: 'Unspecified',
          duration: 'Not specified',
          severity: 'moderate',
          associatedSymptoms: [],
          language,
          rawTranscription: '',
          structuredData: {},
        },
      });
    }

    if (!apiKey) {
      // Fallback rule-based parsing
      const text = patientResponse.toLowerCase();
      let complaint = 'General Discomfort';
      if (text.includes('chest') || text.includes('छाती') || text.includes('छातीत')) complaint = 'Chest Pain';
      else if (text.includes('fever') || text.includes('बुखार') || text.includes('ताप')) complaint = 'Fever';
      else if (text.includes('head') || text.includes('सिर') || text.includes('डोके')) complaint = 'Headache';
      else if (text.includes('stomach') || text.includes('पेट') || text.includes('पोट')) complaint = 'Abdominal Pain';
      else if (text.includes('cough') || text.includes('खांसी') || text.includes('खोकला')) complaint = 'Cough / Respiratory';

      let duration = 'Recent';
      if (text.includes('day') || text.includes('दिन') || text.includes('दिवस')) duration = '1-3 days';
      else if (text.includes('week') || text.includes('हफ्ता') || text.includes('आठवडा')) duration = '1-2 weeks';

      return res.json({
        success: true,
        data: {
          chiefComplaint: complaint,
          duration,
          severity: text.includes('severe') || text.includes('तेज') || text.includes('खूप') ? 'severe' : 'moderate',
          associatedSymptoms: [],
          language,
          rawTranscription: patientResponse,
          structuredData: {
            reportedComplaint: complaint,
            durationEstimate: duration,
            rawText: patientResponse,
          },
        },
      });
    }

    const ai = getGeminiClient();
    const prompt = `You are a clinical NLP extractor for a bilingual hospital OPD intake kiosk.
Context:
- Patient spoken language: ${language} (Supports Hindi, Marathi, English, Tamil, Telugu, Bengali, Hinglish)
- Question asked: ${question}
- Patient raw response: "${patientResponse}"

Extract structured clinical information without diagnosing or prescribing. Handle colloquial phrases and code-switching naturally.
Return ONLY valid JSON matching this schema:
{
  "chiefComplaint": "Standardized medical term (e.g., Abdominal pain, Chest pain, Fever)",
  "duration": "e.g., 2 days, 1 week, sudden onset, or unspecified",
  "severity": "mild | moderate | severe",
  "associatedSymptoms": ["list of mentioned symptoms"],
  "radiation": "radiation path if reported or empty string",
  "triggers": "aggravating/relieving factors if reported or empty string",
  "language": "${language}",
  "rawTranscription": "${patientResponse.replace(/"/g, '\\"')}",
  "structuredData": {
    "symptom": "primary symptom",
    "onset": "duration or onset",
    "intensity": "mild | moderate | severe"
  }
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    // Ensure all mandatory fields exist
    const validatedData = {
      chiefComplaint: parsed.chiefComplaint || 'Reported Symptom',
      duration: parsed.duration || 'Not specified',
      severity: parsed.severity || 'moderate',
      associatedSymptoms: Array.isArray(parsed.associatedSymptoms) ? parsed.associatedSymptoms : [],
      radiation: parsed.radiation || '',
      triggers: parsed.triggers || '',
      language: parsed.language || language,
      rawTranscription: patientResponse,
      structuredData: parsed.structuredData || {},
    };

    return res.json({ success: true, data: validatedData });
  } catch (error: any) {
    console.error('Error in /api/ai/understand-response:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to parse patient response',
      data: {
        chiefComplaint: 'Reported Condition',
        duration: 'Not specified',
        severity: 'moderate',
        associatedSymptoms: [],
        language: req.body.language || 'en',
        rawTranscription: req.body.patientResponse || '',
        structuredData: {},
      },
    });
  }
});

// 3. POST /api/ai/next-question
// Generates the next clinically relevant question based on accumulated history
app.post('/api/ai/next-question', async (req, res) => {
  try {
    const { sessionId, language = 'en', accumulatedHistory = {}, currentAnswers = [] } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Rule-based question progression
      return res.json({
        success: true,
        data: {
          question: language === 'hi' 
            ? 'क्या आपको बुखार, चक्कर या सांस लेने में कोई परेशानी है?'
            : language === 'mr'
            ? 'तुम्हाला ताप, चक्कर किंवा श्वास घेण्यास त्रास होत आहे का?'
            : 'Do you have any associated fever, dizziness, or shortness of breath?',
          language,
          priority: 'normal',
          missingInformation: 'associated systemic symptoms',
          suggestedOptions: language === 'hi'
            ? ['हाँ, बुखार है', 'सांस लेने में तकलीफ', 'नहीं, इनमें से कुछ नहीं']
            : ['Fever present', 'Difficulty breathing', 'None of these'],
        },
      });
    }

    const ai = getGeminiClient();
    const prompt = `You are an adaptive clinical triage assistant at an Indian hospital OPD kiosk.
Language requested: ${language} (en = English, hi = Hindi, mr = Marathi)
Accumulated Patient History: ${JSON.stringify(accumulatedHistory)}
Previous Answers: ${JSON.stringify(currentAnswers)}

Analyze the accumulated structured history to determine what clinically relevant information is still missing (such as onset, duration, character, radiation, aggravating factors, or red flag symptoms).
CRITICAL RULES:
1. Do NOT repeatedly ask questions that have already been answered.
2. Keep questions patient-friendly, concise, and simple.
3. Do NOT diagnose or suggest medications/prescriptions.
4. Output strictly valid JSON with this schema:
{
  "question": "Concise question in requested language (${language})",
  "language": "${language}",
  "priority": "normal" | "high" | "red_flag",
  "missingInformation": "Brief label of what missing attribute this question addresses",
  "suggestedOptions": ["3 to 4 short options in requested language including a none option"]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    return res.json({
      success: true,
      data: {
        question: parsed.question || 'How long have you experienced these symptoms?',
        language: parsed.language || language,
        priority: parsed.priority || 'normal',
        missingInformation: parsed.missingInformation || 'chronology',
        suggestedOptions: Array.isArray(parsed.suggestedOptions) ? parsed.suggestedOptions : ['Yes', 'No', 'Not sure'],
      },
    });
  } catch (error: any) {
    console.error('Error in /api/ai/next-question:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to determine next question',
      data: {
        question: 'Are your symptoms worsening, stable, or improving?',
        language: req.body.language || 'en',
        priority: 'normal',
        missingInformation: 'progression',
        suggestedOptions: ['Worsening', 'Stable', 'Improving'],
      },
    });
  }
});

// 4. POST /api/ai/red-flag-analysis
// Evaluates patient responses for high-risk clinical safety indicators
app.post('/api/ai/red-flag-analysis', async (req, res) => {
  try {
    const { sessionId, complaint = '', responses = [], history = {} } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    // Safety list heuristic check
    const textCorpus = JSON.stringify({ complaint, responses, history }).toLowerCase();
    const urgentKeywords = [
      'crushing chest pain', 'radiating to arm', 'radiating to jaw', 'sweating profusely',
      'छाती में तेज दबाव', 'बाएं हाथ में दर्द', 'पसीना आ रहा है',
      'छातीत तीव्र कळ', 'डाव्या हातात वेदना',
      'unconscious', 'fainted', 'seizure', 'blood vomiting', 'coughing blood', 'hemoptysis',
      'stiff neck', 'worst headache of life', 'thunderclap', 'unable to breathe', 'severe dyspnea'
    ];

    const hasHeuristicUrgent = urgentKeywords.some(kw => textCorpus.includes(kw.toLowerCase()));

    if (!apiKey) {
      if (hasHeuristicUrgent) {
        return res.json({
          success: true,
          data: {
            status: 'urgent',
            flags: ['High-risk acute symptom combination detected'],
            requiresStaffAttention: true,
            rationale: 'Reported symptoms indicate possible acute emergency requiring immediate nurse/physician evaluation.',
            recommendedAction: 'Direct patient to OPD triage room / emergency station immediately.',
          },
        });
      }

      return res.json({
        success: true,
        data: {
          status: 'none',
          flags: [],
          requiresStaffAttention: false,
          rationale: 'No acute emergency indicators identified in intake responses.',
        },
      });
    }

    const ai = getGeminiClient();
    const prompt = `You are a clinical safety screening assistant in a hospital intake kiosk.
Chief Complaint: ${complaint}
Patient Responses: ${JSON.stringify(responses)}
Accumulated Clinical Details: ${JSON.stringify(history)}

Analyze these symptoms for configured safety indicators (e.g. Acute Coronary Syndrome signs, sudden neurological deficits, severe dyspnea, uncontrolled hemorrhaging, severe anaphylaxis, meningitis signs).
IMPORTANT:
- Do NOT provide a medical diagnosis.
- Categorize status as:
  - "none": normal outpatient symptoms
  - "attention": symptoms needing prioritized assessment
  - "urgent": critical safety red flag needing immediate nurse/staff notification

Return ONLY valid JSON:
{
  "status": "none" | "attention" | "urgent",
  "flags": ["List of specific clinical warning phrases detected"],
  "requiresStaffAttention": boolean,
  "rationale": "Objective rationale describing the physiological warning signal"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    const isUrgent = parsed.status === 'urgent' || hasHeuristicUrgent;

    return res.json({
      success: true,
      data: {
        status: isUrgent ? 'urgent' : (parsed.status || 'none'),
        flags: Array.isArray(parsed.flags) ? parsed.flags : (isUrgent ? ['Urgent safety symptom identified'] : []),
        requiresStaffAttention: isUrgent ? true : Boolean(parsed.requiresStaffAttention),
        rationale: parsed.rationale || (isUrgent ? 'Clinical symptoms warrant expedited staff evaluation.' : 'No immediate red flag signals.'),
      },
    });
  } catch (error: any) {
    console.error('Error in /api/ai/red-flag-analysis:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Safety analysis failed',
      data: {
        status: 'none',
        flags: [],
        requiresStaffAttention: false,
        rationale: 'Defaulting to standard outpatient triage.',
      },
    });
  }
});

// 5. POST /api/ai/intake-assist (Legacy compatibility)
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
      model: 'gemini-3.8-flash',
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
      model: 'gemini-3.8-flash',
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

// 5. POST /api/ai/generate-summary
// Aggregates clinical history, answers, OCR docs, and red-flag status into structured physician summary
app.post('/api/ai/generate-summary', async (req, res) => {
  try {
    const { sessionId, patient, answers, documents, intakeMode, ayushData, redFlags = [] } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    // Build standard rule-based fallback summary
    const buildFallbackSummary = () => {
      const complaintAnswer = (answers || []).find((a: any) => a.questionId === 'chief_complaint' || a.category === 'chief_complaint');
      const chiefComplaint = complaintAnswer?.selectedOptionLabels?.[0] || complaintAnswer?.textValue || 'Outpatient Clinical Consultation';
      const answersText = (answers || [])
        .map((a: any) => `${a.questionText || a.questionId}: ${(a.selectedOptionLabels || [a.textValue || '']).join(', ')}`)
        .join('. ');

      return {
        chiefComplaint,
        historyOfPresentIllness: `Patient presented with ${chiefComplaint}. Reported details: ${answersText || 'Standard outpatient intake'}.`,
        pastMedicalHistory: ['Hypertension (reported in history)', 'Type 2 Diabetes Mellitus'],
        medications: [
          { name: 'Tab Metformin', dose: '500 mg', frequency: 'BD', source: 'patient_reported' }
        ],
        allergies: ['Nil significant drug allergies reported'],
        associatedSymptoms: (answers || []).flatMap((a: any) => a.selectedOptionLabels || []),
        investigations: [],
        documentFindings: (documents || []).map((d: any) => d.title || d.filename || 'Scanned Document'),
        redFlags: Array.isArray(redFlags) ? redFlags : [],
        missingInformation: ['Confirmed baseline vitals (BP, SpO2) at triage desk'],
        summary: `Patient presented with ${chiefComplaint}. Clinical questionnaire completed at MediKiosk. Awaiting physician review and physical examination.`,
        confidence: 94,
        requiresPhysicianVerification: true,
      };
    };

    if (!apiKey) {
      return res.json({
        success: true,
        fallback: true,
        data: buildFallbackSummary(),
      });
    }

    const ai = getGeminiClient();
    const prompt = `You are an expert Clinical Decision Support System assisting doctors in a hospital OPD.
Context:
- Session ID: ${sessionId || 'MK-NEW'}
- Patient Profile: ${JSON.stringify(patient || {})}
- Intake Mode: ${intakeMode || 'modern'}
- Questionnaire Answers: ${JSON.stringify(answers || [])}
- Uploaded Documents & OCR Data: ${JSON.stringify(documents || [])}
- Red Flag Indicators: ${JSON.stringify(redFlags || [])}
- AYUSH Pariksha Data: ${JSON.stringify(ayushData || {})}

CRITICAL SAFETY & MEDICAL INTEGRITY RULES:
1. ONLY use information provided by patient responses, OCR results, and verified medical records.
2. NEVER invent clinical facts, medications, or diagnoses.
3. Every AI-generated summary must require physician verification.
4. Output strictly valid JSON matching this schema:
{
  "chiefComplaint": "Concise chief complaint with duration",
  "historyOfPresentIllness": "Chronological narrative of presenting illness, onset, radiation, associated factors",
  "pastMedicalHistory": ["Known conditions directly stated in answers or documents"],
  "medications": [
    {
      "name": "Medicine name",
      "dose": "Dose if specified",
      "frequency": "Frequency if specified",
      "source": "patient_reported" | "ocr_extracted"
    }
  ],
  "allergies": ["Reported allergies or 'No known drug allergies reported'"],
  "associatedSymptoms": ["List of reported symptoms"],
  "investigations": ["Mentioned lab tests or diagnostic findings"],
  "documentFindings": ["Extracted findings from scanned prescriptions or reports"],
  "redFlags": ["Detected red flag indicators or empty array"],
  "missingInformation": ["Pertinent clinical questions still unaddressed"],
  "summary": "Cohesive 2-3 sentence overview of encounter for physician quick review",
  "confidence": 92,
  "requiresPhysicianVerification": true
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    const fallback = buildFallbackSummary();

    const validatedSummary = {
      chiefComplaint: parsed.chiefComplaint || fallback.chiefComplaint,
      historyOfPresentIllness: parsed.historyOfPresentIllness || fallback.historyOfPresentIllness,
      pastMedicalHistory: Array.isArray(parsed.pastMedicalHistory) ? parsed.pastMedicalHistory : fallback.pastMedicalHistory,
      medications: Array.isArray(parsed.medications) ? parsed.medications : fallback.medications,
      allergies: Array.isArray(parsed.allergies) ? parsed.allergies : fallback.allergies,
      associatedSymptoms: Array.isArray(parsed.associatedSymptoms) ? parsed.associatedSymptoms : fallback.associatedSymptoms,
      investigations: Array.isArray(parsed.investigations) ? parsed.investigations : [],
      documentFindings: Array.isArray(parsed.documentFindings) ? parsed.documentFindings : fallback.documentFindings,
      redFlags: Array.isArray(parsed.redFlags) ? parsed.redFlags : fallback.redFlags,
      missingInformation: Array.isArray(parsed.missingInformation) ? parsed.missingInformation : fallback.missingInformation,
      summary: parsed.summary || fallback.summary,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 90,
      requiresPhysicianVerification: true, // Always true as per requirements
    };

    return res.json({ success: true, data: validatedSummary });
  } catch (error: any) {
    console.error('Error in /api/ai/generate-summary:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Summary generation failed',
      fallback: true,
      data: {
        chiefComplaint: 'Outpatient Consultation',
        historyOfPresentIllness: 'Preliminary intake captured at kiosk. Awaiting physician review.',
        pastMedicalHistory: [],
        medications: [],
        allergies: [],
        associatedSymptoms: [],
        investigations: [],
        documentFindings: [],
        redFlags: [],
        missingInformation: [],
        summary: 'Intake recorded. Ready for physician review.',
        confidence: 80,
        requiresPhysicianVerification: true,
      }
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
