import React, { useState } from 'react';
import { FileText, Sparkles, CheckCircle2, AlertTriangle, Cpu, Layers, Eye, RefreshCw, ArrowRight } from 'lucide-react';
import { DocumentRecord } from '../../types';

interface DocumentProcessingViewProps {
  documents?: DocumentRecord[];
}

const SPECIMEN_DOCUMENTS: DocumentRecord[] = [
  {
    id: 'DOC-SPECIMEN-01',
    patientId: 'pat-specimen-01',
    type: 'Prescription',
    title: 'OPD Clinical Prescription (Cardiology)',
    date: '2026-03-01',
    fileUrl: '',
    ocrStatus: 'completed',
    confidenceScore: 94,
    extractedEntities: [
      {
        id: 'ENT-01',
        name: 'Amlodipine 5mg',
        type: 'medication',
        confidence: 96,
        value: '5mg OD',
        rawText: 'Tab Amlodipine 5mg OD',
      },
      {
        id: 'ENT-02',
        name: 'Essential Hypertension',
        type: 'diagnosis',
        confidence: 98,
        value: 'Grade 1',
        rawText: 'Diagnosis: Essential HTN',
      },
      {
        id: 'ENT-03',
        name: 'Clopidogrel 75mg',
        type: 'medication',
        confidence: 64,
        value: '75mg 0-1-0',
        rawText: 'Tab Clopido... 75mg',
      },
    ],
    rawOcrText: 'AIIMS Cardiology OPD - Rx: Tab Amlodipine 5mg OD x 30 days. Tab Telmisartan 40mg OD.',
    hospitalName: 'All India Institute of Medical Sciences',
  },
];

export const DocumentProcessingView: React.FC<DocumentProcessingViewProps> = ({
  documents = [],
}) => {
  const activeDocs = documents.length > 0 ? documents : SPECIMEN_DOCUMENTS;
  const [selectedDoc, setSelectedDoc] = useState<DocumentRecord>(activeDocs[0]);
  const [activeStage, setActiveStage] = useState<number>(3); // 1: Image, 2: OCR Text, 3: Entities, 4: FHIR

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 p-4 sm:p-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <FileText className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              OCR & Document AI Pipeline Inspector
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Multi-stage document extraction engine: Raw Image → OCR → Clinical NER → Confidence Scoring → FHIR Resource
          </p>
        </div>

        {/* Document Selector */}
        <div className="flex items-center gap-2">
          {activeDocs.map((doc) => (
            <button
              key={doc.id}
              onClick={() => setSelectedDoc(doc)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                selectedDoc.id === doc.id
                  ? 'bg-amber-600 border-amber-500 text-white'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              {doc.type}
            </button>
          ))}
        </div>
      </div>

      {/* Pipeline 4-Stage Stepper */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { step: 1, title: '1. Image Preprocessing', subtitle: 'Deskew, Binarization & CLAHE' },
          { step: 2, title: '2. Optical Text OCR', subtitle: 'Indian Script & English Recognition' },
          { step: 3, title: '3. Medical Entity NER', subtitle: 'Drugs, Dosages & Lab Normalization' },
          { step: 4, title: '4. Confidence Calibration', subtitle: 'High vs Low Confidence Triage' },
        ].map((s) => (
          <button
            key={s.step}
            onClick={() => setActiveStage(s.step)}
            className={`p-4 rounded-2xl border-2 text-left transition-all ${
              activeStage === s.step
                ? 'bg-amber-950/40 border-amber-500 text-white ring-1 ring-amber-400'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <span className="text-xs font-mono font-bold text-amber-400 block">{s.title}</span>
            <span className="text-[11px] text-slate-300 mt-1 block">{s.subtitle}</span>
          </button>
        ))}
      </div>

      {/* Main Interactive Stage Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Raw Document & Simulated Bounding Box Viewport */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Document Viewport: {selectedDoc.title}
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Confidence: {selectedDoc.confidenceScore}%
            </span>
          </div>

          {/* Document Canvas Preview with Simulated Bounding Boxes */}
          <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800 min-h-[360px] relative overflow-hidden font-mono text-xs">
            <div className="text-center pb-4 mb-4 border-b border-slate-800">
              <span className="font-bold text-teal-400 text-sm block">{selectedDoc.hospitalName}</span>
              <span className="text-slate-500 text-[10px]">{selectedDoc.date} • OPD Record</span>
            </div>

            <div className="space-y-3 text-slate-300">
              <div className="p-2 rounded border border-teal-500/50 bg-teal-500/10 relative">
                <span className="absolute -top-2 right-2 text-[9px] bg-teal-600 text-white px-1 rounded">
                  Diagnosis BBox (98%)
                </span>
                <p>Rx: Type 2 Diabetes Mellitus / Post-PCI LAD</p>
              </div>

              <div className="p-2 rounded border border-teal-500/50 bg-teal-500/10 relative">
                <span className="absolute -top-2 right-2 text-[9px] bg-teal-600 text-white px-1 rounded">
                  Medication BBox (96%)
                </span>
                <p>1. Tab. Metformin 500mg - 1-0-1 (After Meals)</p>
              </div>

              <div className="p-2 rounded border border-amber-500/70 bg-amber-500/15 relative">
                <span className="absolute -top-2 right-2 text-[9px] bg-amber-500 text-slate-950 font-bold px-1 rounded">
                  Low-Confidence BBox (64%)
                </span>
                <p className="italic text-amber-200">2. Tab. [Clopido... 75mg] - 0-1-0</p>
              </div>

              <div className="p-2 rounded border border-teal-500/50 bg-teal-500/10 relative">
                <span className="absolute -top-2 right-2 text-[9px] bg-teal-600 text-white px-1 rounded">
                  Medication BBox (94%)
                </span>
                <p>3. Tab. Telmisartan 40mg - 1-0-0 (Morning)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Extracted Entities and Quality Calibration */}
        <div className="lg:col-span-6 space-y-6">
          {/* Extracted Entities List */}
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider pb-3 border-b border-slate-800">
              Extracted Medical Entities ({selectedDoc.extractedEntities.length})
            </h3>

            <div className="space-y-3">
              {selectedDoc.extractedEntities.map((ent) => {
                const isLow = ent.confidence < 75;
                return (
                  <div
                    key={ent.id}
                    className={`p-4 rounded-2xl border ${
                      isLow
                        ? 'bg-amber-950/40 border-amber-500 text-amber-200'
                        : 'bg-slate-950 border-slate-800 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-white">{ent.name}</span>
                        <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                          {ent.type}
                        </span>
                      </div>
                      <span
                        className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                          isLow ? 'bg-amber-500 text-slate-950' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {ent.confidence}% Confidence
                      </span>
                    </div>

                    <div className="text-xs text-slate-300 mt-1">
                      {ent.dose && <span><strong>Dose:</strong> {ent.dose} • </span>}
                      {ent.frequency && <span><strong>Frequency:</strong> {ent.frequency} • </span>}
                      {ent.value && <span><strong>Value:</strong> {ent.value} {ent.unit}</span>}
                    </div>

                    {isLow && (
                      <div className="mt-2.5 pt-2 border-t border-amber-800/60 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-amber-300">
                          ⚠️ Flagged for Doctor Confirmation
                        </span>
                        <span className="text-[11px] font-bold text-emerald-400">
                          Verified by Dr. A. Varma ✓
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
