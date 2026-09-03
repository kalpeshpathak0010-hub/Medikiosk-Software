import React, { useState } from 'react';
import { Clock, Calendar, FileText, CheckCircle2, AlertTriangle, Activity, Stethoscope, ChevronRight, ArrowLeft } from 'lucide-react';
import { MedicalTimelineEvent, Patient } from '../../types';
import { DEMO_TIMELINE_EVENTS } from '../../data/demoPatients';

interface DoctorTimelineViewProps {
  patient: Patient;
  events?: MedicalTimelineEvent[];
  onBack: () => void;
}

export const DoctorTimelineView: React.FC<DoctorTimelineViewProps> = ({
  patient,
  events = DEMO_TIMELINE_EVENTS,
  onBack,
}) => {
  const [selectedEventId, setSelectedEventId] = useState<string>(events[0]?.id || 'evt-001');

  const selectedEvent = events.find((e) => e.id === selectedEventId) || events[0];

  const getCategoryBadge = (category: MedicalTimelineEvent['category'] | string) => {
    switch (category) {
      case 'surgery':
        return { bg: 'bg-rose-100 text-rose-800 border-rose-200', label: 'Procedure / Surgery' };
      case 'diagnosis':
        return { bg: 'bg-amber-100 text-amber-800 border-amber-200', label: 'Chronic Diagnosis' };
      case 'lab_report':
      case 'investigation':
        return { bg: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Lab Investigation' };
      case 'prescription':
        return { bg: 'bg-teal-100 text-teal-800 border-teal-200', label: 'Prescription' };
      case 'hospitalization':
        return { bg: 'bg-purple-100 text-purple-800 border-purple-200', label: 'Hospitalization' };
      default:
        return { bg: 'bg-indigo-100 text-indigo-800 border-indigo-200', label: 'Clinical Intake' };
    }
  };

  return (
    <div className="flex-1 text-slate-800 p-4 sm:p-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-200/80">
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/80 hover:bg-white text-slate-700 text-xs font-bold border border-white/80 shadow-xs transition mb-2 active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Clinical Workspace</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-black text-blue-950 tracking-tight flex items-center gap-2">
            <Clock className="w-7 h-7 text-indigo-600" />
            <span>Longitudinal Medical Timeline</span>
          </h1>
          <p className="text-xs text-slate-600 font-medium">
            Patient: <strong className="text-slate-900 font-bold">{patient.name}</strong> ({patient.age}y / {patient.gender}) • Synthesized from OCR documents & previous records
          </p>
        </div>
      </div>

      {/* Main Grid: Left Timeline list, Right Event Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Timeline Spine */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="text-xs uppercase font-black text-slate-500 tracking-wider mb-2">
            Chronological Events ({events.length})
          </h3>

          <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-300 space-y-6">
            {events.map((evt) => {
              const badge = getCategoryBadge(evt.category);
              const isSelected = evt.id === selectedEventId;

              return (
                <div
                  key={evt.id}
                  onClick={() => setSelectedEventId(evt.id)}
                  className={`relative p-5 rounded-[28px] border-2 transition-all cursor-pointer group active:scale-[0.99] backdrop-blur-md ${
                    isSelected
                      ? 'bg-indigo-50/90 border-indigo-500 shadow-xl ring-2 ring-indigo-400/40'
                      : 'bg-white/80 border-white/80 hover:border-indigo-300 hover:bg-white shadow-xs'
                  }`}
                >
                  {/* Timeline Dot on Spine */}
                  <div
                    className={`absolute -left-[31px] sm:-left-[39px] top-6 w-4 h-4 rounded-full border-2 transition ${
                      isSelected
                        ? 'bg-indigo-600 border-white ring-4 ring-indigo-500/40 scale-125'
                        : 'bg-slate-300 border-white'
                    }`}
                  ></div>

                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-mono font-bold text-teal-700 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {evt.date}
                    </span>
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${badge.bg}`}>
                      {badge.label}
                    </span>
                  </div>

                  <h4 className="text-base font-black text-slate-900 group-hover:text-indigo-600 transition">
                    {evt.title}
                  </h4>
                  <p className="text-xs text-slate-600 font-medium mt-1 line-clamp-2 leading-relaxed">
                    {evt.description}
                  </p>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 font-medium pt-2 border-t border-slate-200/80">
                    <span>Facility: {evt.hospital || 'Hospital OPD'}</span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Event Deep Dive Card */}
        <div className="lg:col-span-5">
          <div className="sticky top-20 p-6 rounded-[32px] bg-white/85 backdrop-blur-xl border-2 border-white/60 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
              <span className="text-xs font-mono text-indigo-700 font-bold flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {selectedEvent.date}
              </span>
              <span
                className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border ${
                  getCategoryBadge(selectedEvent.category).bg
                }`}
              >
                {getCategoryBadge(selectedEvent.category).label}
              </span>
            </div>

            <div>
              <h3 className="text-xl font-black text-blue-950">{selectedEvent.title}</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Recorded at: <strong className="text-slate-900">{selectedEvent.hospital || 'AIIMS Cardiology'}</strong>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/70 border border-slate-200/80 text-xs text-slate-700 font-medium leading-relaxed shadow-xs">
              <span className="text-[10px] uppercase font-black text-slate-500 block mb-1">Clinical Details</span>
              {selectedEvent.description}
            </div>

            {selectedEvent.extractedEntities && selectedEvent.extractedEntities.length > 0 && (
              <div>
                <span className="text-xs uppercase font-black text-slate-600 block mb-2">
                  Linked Extracted Entities ({selectedEvent.extractedEntities.length}):
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedEvent.extractedEntities.map((ent, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-xl bg-blue-50 border border-blue-200 text-xs font-mono font-bold text-blue-900 shadow-xs"
                    >
                      {ent}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedEvent.documentSourceId && (
              <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200 flex items-center justify-between gap-3 text-xs shadow-xs">
                <div className="flex items-center gap-2 text-indigo-900 font-bold">
                  <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Source Document: {selectedEvent.documentSourceId}</span>
                </div>
                <span className="text-[10px] font-black text-indigo-800 px-2 py-0.5 rounded bg-indigo-100 border border-indigo-200">
                  OCR Verified
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
