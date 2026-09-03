import React, { useState } from 'react';
import { FileUp, Camera, CheckCircle2, AlertTriangle, ArrowRight, ArrowLeft, FileText, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { DocumentRecord, ExtractedEntity, Language, MedicalTimelineEvent, Patient } from '../../types';
import { translations } from '../../locales/translations';
import { processDocumentFile, SAMPLE_DOCUMENTS } from '../../services/ocrService';

interface KioskDocumentScannerProps {
  language: Language;
  patient: Patient;
  onDocumentsConfirmed: (documents: DocumentRecord[], timelineEvents: MedicalTimelineEvent[]) => void;
  onSkip: () => void;
  onBack: () => void;
  highContrast: boolean;
}

export const KioskDocumentScanner: React.FC<KioskDocumentScannerProps> = ({
  language,
  patient,
  onDocumentsConfirmed,
  onSkip,
  onBack,
  highContrast,
}) => {
  const t = translations[language];

  const [uploadedDocs, setUploadedDocs] = useState<DocumentRecord[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<MedicalTimelineEvent[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<'upload' | 'image_prep' | 'ocr' | 'entity_extraction' | 'done'>('upload');
  const [selectedDocType, setSelectedDocType] = useState<DocumentRecord['type']>('Prescription');

  // Simulated live scanner
  const handleTriggerSimulatedScan = async (sampleIndex = 0) => {
    setIsProcessing(true);
    setProcessingStage('image_prep');

    setTimeout(() => {
      setProcessingStage('ocr');
    }, 500);

    setTimeout(() => {
      setProcessingStage('entity_extraction');
    }, 1000);

    const sample = SAMPLE_DOCUMENTS[sampleIndex] || SAMPLE_DOCUMENTS[0];
    const { document, newTimelineEvents } = await processDocumentFile(
      { name: sample.title },
      patient.id,
      sample.type
    );

    setProcessingStage('done');
    setIsProcessing(false);
    setUploadedDocs((prev) => [...prev, document]);
    setTimelineEvents((prev) => [...prev, ...newTimelineEvents]);
  };

  // Manual File Upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setProcessingStage('image_prep');

    setTimeout(() => setProcessingStage('ocr'), 500);
    setTimeout(() => setProcessingStage('entity_extraction'), 1000);

    const { document, newTimelineEvents } = await processDocumentFile(
      file,
      patient.id,
      selectedDocType
    );

    setProcessingStage('done');
    setIsProcessing(false);
    setUploadedDocs((prev) => [...prev, document]);
    setTimelineEvents((prev) => [...prev, ...newTimelineEvents]);
  };

  const handleVerifyEntity = (docId: string, entityId: string) => {
    setUploadedDocs((prev) =>
      prev.map((doc) => {
        if (doc.id === docId) {
          return {
            ...doc,
            extractedEntities: doc.extractedEntities.map((ent) =>
              ent.id === entityId ? { ...ent, isVerified: true, confidence: 95 } : ent
            ),
          };
        }
        return doc;
      })
    );
  };

  return (
    <div className="flex-1 flex flex-col justify-center p-4 sm:p-6 max-w-4xl mx-auto w-full">
      <div
        className={`w-full rounded-[36px] p-6 sm:p-8 shadow-2xl transition-all ${
          highContrast
            ? 'bg-black border-4 border-yellow-400 text-white'
            : 'bg-white/80 backdrop-blur-xl border-2 border-white/60 text-slate-900 shadow-2xl ring-1 ring-slate-900/5'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200/80">
          <div>
            <span className="text-xs uppercase tracking-widest text-blue-600 font-black">Step 5 of 6</span>
            <h2 className="text-2xl sm:text-4xl font-black text-blue-950">{t.documentsTitle}</h2>
            <p className="text-slate-600 text-sm mt-1 font-medium">{t.documentsSubtitle}</p>
          </div>

          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/80 hover:bg-white text-slate-700 text-sm font-bold border border-white/80 shadow-xs transition active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.back}</span>
          </button>
        </div>

        {/* OCR Pipeline Status Bar - Frosted Glass Bar */}
        <div className="mb-6 bg-white/70 backdrop-blur-md p-4 rounded-2xl border border-white/80 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-2">
            <span className="tracking-wide">OCR & DOCUMENT AI PIPELINE</span>
            <span className="text-blue-600 font-mono font-bold">
              {isProcessing ? `Processing: ${processingStage.toUpperCase()}...` : `${uploadedDocs.length} Document(s) Extracted`}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center text-[11px] font-bold">
            <div className={`p-2 rounded-xl transition ${isProcessing && processingStage === 'image_prep' ? 'bg-blue-600 text-white animate-pulse shadow-sm' : 'bg-slate-100/80 text-slate-600'}`}>
              1. Image Prep
            </div>
            <div className={`p-2 rounded-xl transition ${isProcessing && processingStage === 'ocr' ? 'bg-blue-600 text-white animate-pulse shadow-sm' : 'bg-slate-100/80 text-slate-600'}`}>
              2. OCR Extraction
            </div>
            <div className={`p-2 rounded-xl transition ${isProcessing && processingStage === 'entity_extraction' ? 'bg-blue-600 text-white animate-pulse shadow-sm' : 'bg-slate-100/80 text-slate-600'}`}>
              3. Entity NER
            </div>
            <div className={`p-2 rounded-xl transition ${uploadedDocs.length > 0 ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100/80 text-slate-600'}`}>
              4. Timeline Sync
            </div>
          </div>
        </div>

        {/* Scan & Upload Action Buttons - Frosted Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {/* Quick Demo Scan 1 (Prescription with Metformin & Low-confidence Clopidogrel) */}
          <button
            id="btn-scan-doc-demo"
            disabled={isProcessing}
            onClick={() => handleTriggerSimulatedScan(0)}
            className="p-5 rounded-[24px] bg-white/70 hover:bg-white border-2 border-white/80 hover:border-blue-400 text-left transition-all active:scale-95 group cursor-pointer shadow-md hover:shadow-xl flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shadow-xs">
                <Camera className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-black text-blue-950 text-base mb-1 group-hover:text-blue-600">Scan Prescription</h4>
              <p className="text-xs text-slate-600 font-medium">Extracts Metformin 500mg, Telmisartan & flags uncertain handwriting.</p>
            </div>
          </button>

          {/* Quick Demo Scan 2 (Lab Report: HbA1c 9.1%) */}
          <button
            id="btn-scan-lab-demo"
            disabled={isProcessing}
            onClick={() => handleTriggerSimulatedScan(1)}
            className="p-5 rounded-[24px] bg-white/70 hover:bg-white border-2 border-white/80 hover:border-blue-400 text-left transition-all active:scale-95 group cursor-pointer shadow-md hover:shadow-xl flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-sky-100 border border-sky-200 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shadow-xs">
                <FileText className="w-6 h-6 text-sky-600" />
              </div>
              <h4 className="font-black text-blue-950 text-base mb-1 group-hover:text-sky-600">Scan Lab Report</h4>
              <p className="text-xs text-slate-600 font-medium">Extracts HbA1c 9.1%, Fasting Blood Sugar 168 mg/dL.</p>
            </div>
          </button>

          {/* Manual File / Camera Upload */}
          <label className="p-5 rounded-[24px] bg-white/60 hover:bg-white border-2 border-dashed border-slate-300 hover:border-blue-400 text-left transition-all active:scale-95 group cursor-pointer flex flex-col justify-between shadow-md hover:shadow-xl">
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-100 border border-purple-200 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shadow-xs">
                <FileUp className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="font-black text-blue-950 text-base mb-1 group-hover:text-purple-600">Upload Your File</h4>
              <p className="text-xs text-slate-600 font-medium">Choose image / PDF from device storage.</p>
            </div>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isProcessing}
            />
          </label>
        </div>

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="p-6 rounded-2xl bg-white/90 backdrop-blur-md border border-blue-300 text-center mb-6 shadow-md">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
            <h4 className="text-lg font-black text-blue-950 mb-1">{t.ocrProcessing}</h4>
            <p className="text-xs text-slate-600 font-medium">Extracting diagnosis, drugs, dosages, frequencies & lab values...</p>
          </div>
        )}

        {/* Uploaded Documents List & Entity Inspector */}
        {uploadedDocs.length > 0 && (
          <div className="space-y-4 mb-8">
            <h3 className="text-sm font-black text-blue-950 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              <span>{t.uploadedDocsLabel} ({uploadedDocs.length})</span>
            </h3>

            {uploadedDocs.map((doc) => (
              <div key={doc.id} className="p-5 rounded-2xl bg-white/70 backdrop-blur-md border border-white/80 space-y-3 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shadow-xs">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{doc.title}</h4>
                      <p className="text-xs text-slate-500 font-medium">{doc.hospitalName} • {doc.date}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-black">
                      OCR Score: {doc.confidenceScore}% ✓
                    </span>
                  </div>
                </div>

                {/* Extracted Medical Entities */}
                <div>
                  <span className="text-xs uppercase text-slate-500 font-bold block mb-2">
                    Extracted Medical Entities:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {doc.extractedEntities.map((ent) => {
                      const isLowConfidence = ent.confidence < 75 && !ent.isVerified;
                      return (
                        <div
                          key={ent.id}
                          className={`p-2.5 rounded-xl text-xs flex items-center gap-2 border shadow-xs ${
                            isLowConfidence
                              ? 'bg-amber-50 border-amber-300 text-amber-950'
                              : 'bg-white border-slate-200 text-slate-800'
                          }`}
                        >
                          <div>
                            <span className="font-bold">{ent.name}</span>
                            {ent.dose && <span className="ml-1 text-slate-600">({ent.dose} {ent.frequency})</span>}
                            {ent.value && <span className="ml-1 text-blue-600 font-bold">{ent.value} {ent.unit}</span>}
                            <span
                              className={`ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                                isLowConfidence ? 'bg-amber-400 text-slate-950' : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {ent.confidence}%
                            </span>
                          </div>

                          {isLowConfidence && (
                            <button
                              type="button"
                              onClick={() => handleVerifyEntity(doc.id, ent.id)}
                              className="px-2 py-0.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] transition cursor-pointer shadow-xs"
                            >
                              {t.verify}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bottom Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onSkip}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white/80 hover:bg-white text-slate-700 text-sm font-bold border border-white/80 shadow-xs transition cursor-pointer"
          >
            {t.skipDocuments}
          </button>

          <button
            id="btn-confirm-documents"
            type="button"
            onClick={() => onDocumentsConfirmed(uploadedDocs, timelineEvents)}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-base shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
          >
            <span>{uploadedDocs.length > 0 ? 'Review Clinical Summary' : 'Continue to Review'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
