import React, { useState } from 'react';
import { QrCode, CreditCard, UserPlus, Hash, ArrowRight, ArrowLeft, CheckCircle2, Sparkles, Camera, Search, User } from 'lucide-react';
import { Language, Patient } from '../../types';
import { translations } from '../../locales/translations';
import { abdmService } from '../../services/abdmService';

interface KioskIdentificationProps {
  language: Language;
  onPatientIdentified: (patient: Patient) => void;
  onBack: () => void;
  textSize: 'normal' | 'large' | 'extraLarge';
  highContrast: boolean;
}

type IdTab = 'select_method' | 'scan_qr' | 'enter_number' | 'scan_id' | 'new_patient' | 'patient_found';

export const KioskIdentification: React.FC<KioskIdentificationProps> = ({
  language,
  onPatientIdentified,
  onBack,
  textSize,
  highContrast,
}) => {
  const t = translations[language];
  const [activeTab, setActiveTab] = useState<IdTab>('select_method');
  const [abhaInput, setAbhaInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [identifiedPatient, setIdentifiedPatient] = useState<Patient | null>(null);
  const [isScanningAnimation, setIsScanningAnimation] = useState(false);

  // New patient state
  const [newPatientForm, setNewPatientForm] = useState({
    name: '',
    age: '',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    phone: '',
    bloodGroup: 'B+',
  });

  const handleScanPreset = async (presetAbha: string, demoPatient: Partial<Patient>) => {
    setIsLoading(true);
    setIsScanningAnimation(true);
    
    // Simulate optical scan delay
    setTimeout(async () => {
      const res = await abdmService.authenticatePatient(presetAbha);
      setIsLoading(false);
      setIsScanningAnimation(false);
      
      const patient: Patient = {
        id: demoPatient.id || `PAT-${Date.now().toString().slice(-4)}`,
        name: res.profile?.name || demoPatient.name || 'Rajesh Sharma',
        age: demoPatient.age || 56,
        gender: demoPatient.gender || 'Male',
        phone: res.profile?.mobile || demoPatient.phone || '9820145892',
        abhaId: res.profile?.abhaAddress ? `${res.profile.abhaAddress} (${res.profile.abhaNumber})` : presetAbha,
        isExistingPatient: true,
        bloodGroup: demoPatient.bloodGroup || 'B+',
      };

      setIdentifiedPatient(patient);
      setActiveTab('patient_found');
    }, 1200);
  };

  const handleLookupAbha = async () => {
    if (!abhaInput.trim()) return;
    setIsLoading(true);
    const res = await abdmService.authenticatePatient(abhaInput.trim());
    setIsLoading(false);

    if (res.success && res.profile) {
      const patient: Patient = {
        id: `PAT-${Date.now().toString().slice(-4)}`,
        name: res.profile.name,
        age: 2026 - parseInt(res.profile.dateOfBirth.slice(0, 4) || '1975', 10),
        gender: res.profile.gender === 'M' ? 'Male' : res.profile.gender === 'F' ? 'Female' : 'Other',
        phone: res.profile.mobile,
        abhaId: `${res.profile.abhaAddress} (${res.profile.abhaNumber})`,
        isExistingPatient: true,
        bloodGroup: 'O+',
      };
      setIdentifiedPatient(patient);
      setActiveTab('patient_found');
    }
  };

  const handleRegisterNewPatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientForm.name || !newPatientForm.age || !newPatientForm.phone) return;

    const patient: Patient = {
      id: `PAT-NEW-${Date.now().toString().slice(-4)}`,
      name: newPatientForm.name,
      age: parseInt(newPatientForm.age, 10) || 30,
      gender: newPatientForm.gender,
      phone: newPatientForm.phone,
      bloodGroup: newPatientForm.bloodGroup,
      abhaId: `new.${newPatientForm.phone.slice(-4)}@abdm`,
      isExistingPatient: false,
    };

    setIdentifiedPatient(patient);
    setActiveTab('patient_found');
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
        {/* Header bar */}
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-200/80">
          <div>
            <span className="text-xs uppercase tracking-widest text-blue-600 font-black">Step 1 of 6</span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-blue-950">{t.identifyTitle}</h2>
            <p className="text-slate-600 text-sm mt-1 font-medium">{t.identifySubtitle}</p>
          </div>
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/80 hover:bg-white text-slate-700 text-sm font-bold border border-white/80 shadow-xs transition active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.back}</span>
          </button>
        </div>

        {/* Demo Fast Preset Bar for Hackathon judges */}
        <div className="mb-6 p-3 rounded-2xl bg-blue-50/80 border border-blue-200/80 flex flex-wrap items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Quick Demo Verification:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleScanPreset('91-4589-2341-9874', { name: 'Rajesh Sharma', age: 56, gender: 'Male', phone: '9820145892', bloodGroup: 'B+' })}
              className="text-xs px-3 py-1.5 rounded-xl bg-white/90 hover:bg-blue-600 hover:text-white text-blue-950 font-bold border border-blue-200 shadow-xs transition cursor-pointer"
            >
              1. Rajesh Sharma (Chest Pain Red-Flag)
            </button>
            <button
              onClick={() => handleScanPreset('12-8874-1234-5678', { name: 'Sunita Patel', age: 38, gender: 'Female', phone: '9765412345', bloodGroup: 'O+' })}
              className="text-xs px-3 py-1.5 rounded-xl bg-white/90 hover:bg-blue-600 hover:text-white text-blue-950 font-bold border border-blue-200 shadow-xs transition cursor-pointer"
            >
              2. Sunita Patel (Fever)
            </button>
            <button
              onClick={() => handleScanPreset('78-9012-3456-7890', { name: 'Priya Sharma', age: 29, gender: 'Female', phone: '9819034567', bloodGroup: 'A+' })}
              className="text-xs px-3 py-1.5 rounded-xl bg-white/90 hover:bg-blue-600 hover:text-white text-blue-950 font-bold border border-blue-200 shadow-xs transition cursor-pointer"
            >
              3. Priya Sharma (AYUSH Mode)
            </button>
          </div>
        </div>

        {/* Tab 1: Select Identification Method */}
        {activeTab === 'select_method' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Scan ABHA QR */}
            <button
              id="btn-method-scan-qr"
              onClick={() => {
                setActiveTab('scan_qr');
                handleScanPreset('91-4589-2341-9874', { name: 'Rajesh Sharma', age: 56, gender: 'Male', phone: '9820145892' });
              }}
              className="p-6 rounded-[24px] bg-white/70 hover:bg-white border-2 border-white/80 hover:border-blue-400 text-left transition-all active:scale-95 group cursor-pointer shadow-md hover:shadow-xl"
            >
              <div className="w-14 h-14 rounded-2xl bg-blue-100 border border-blue-200 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <QrCode className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-blue-950 mb-1 group-hover:text-blue-600">{t.scanAbhaQr}</h3>
              <p className="text-xs text-slate-500 font-medium">Scan digital ABHA QR from Aarogya Setu or ABDM health card on kiosk camera.</p>
            </button>

            {/* Enter ABHA Number */}
            <button
              id="btn-method-enter-number"
              onClick={() => setActiveTab('enter_number')}
              className="p-6 rounded-[24px] bg-white/70 hover:bg-white border-2 border-white/80 hover:border-blue-400 text-left transition-all active:scale-95 group cursor-pointer shadow-md hover:shadow-xl"
            >
              <div className="w-14 h-14 rounded-2xl bg-sky-100 border border-sky-200 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Hash className="w-8 h-8 text-sky-600" />
              </div>
              <h3 className="text-xl font-bold text-blue-950 mb-1 group-hover:text-blue-600">{t.enterAbhaNumber}</h3>
              <p className="text-xs text-slate-500 font-medium">Type 14-digit ABHA ID or registered 10-digit mobile number using keypad.</p>
            </button>

            {/* Scan Hospital / Govt ID */}
            <button
              id="btn-method-scan-id"
              onClick={() => {
                setActiveTab('scan_id');
                handleScanPreset('45-2319-9012-3456', { name: 'Ramesh Deshmukh', age: 64, gender: 'Male', phone: '9422019012' });
              }}
              className="p-6 rounded-[24px] bg-white/70 hover:bg-white border-2 border-white/80 hover:border-blue-400 text-left transition-all active:scale-95 group cursor-pointer shadow-md hover:shadow-xl"
            >
              <div className="w-14 h-14 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <CreditCard className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-blue-950 mb-1 group-hover:text-blue-600">{t.scanIdCard}</h3>
              <p className="text-xs text-slate-500 font-medium">Place previous hospital OPD card, Ayushman Bharat Card, or Govt ID on scanner tray.</p>
            </button>

            {/* New Patient Registration */}
            <button
              id="btn-method-new-patient"
              onClick={() => setActiveTab('new_patient')}
              className="p-6 rounded-[24px] bg-white/70 hover:bg-white border-2 border-white/80 hover:border-blue-400 text-left transition-all active:scale-95 group cursor-pointer shadow-md hover:shadow-xl"
            >
              <div className="w-14 h-14 rounded-2xl bg-purple-100 border border-purple-200 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <UserPlus className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-blue-950 mb-1 group-hover:text-purple-600">{t.newPatientReg}</h3>
              <p className="text-xs text-slate-500 font-medium">First time visiting hospital? Quick 30-second self-registration without queuing.</p>
            </button>
          </div>
        )}

        {/* Tab 2: Scanning QR / Scanner Viewport Animation */}
        {activeTab === 'scan_qr' && (
          <div className="text-center py-8">
            <div className="w-64 h-64 mx-auto mb-6 rounded-3xl bg-slate-900 border-4 border-blue-500 relative overflow-hidden flex items-center justify-center shadow-2xl">
              <Camera className="w-16 h-16 text-slate-500" />
              {/* Laser scanner effect */}
              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-scanline"></div>
              <div className="absolute inset-4 border-2 border-dashed border-blue-400/40 rounded-2xl"></div>
            </div>
            <h3 className="text-xl font-bold text-blue-950 mb-2">Align ABHA QR Code in Camera Frame</h3>
            <p className="text-sm text-slate-500 mb-6 font-medium">Scanning digital health ID... Please hold steady</p>
            <button
              onClick={() => setActiveTab('select_method')}
              className="px-6 py-2.5 rounded-xl bg-white/80 hover:bg-white text-slate-700 text-sm font-bold border border-white/80 shadow-xs transition"
            >
              Cancel Scan
            </button>
          </div>
        )}

        {/* Tab 3: Enter ABHA / Phone Number */}
        {activeTab === 'enter_number' && (
          <div className="max-w-lg mx-auto py-4">
            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-700 mb-2">
                ABHA Number or 10-digit Mobile Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={abhaInput}
                  onChange={(e) => setAbhaInput(e.target.value)}
                  placeholder="e.g. 91-4589-2341-9874 or 9820145892"
                  className="w-full text-lg sm:text-xl font-mono px-4 py-4 rounded-2xl bg-white border-2 border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600 tracking-wider shadow-inner"
                />
                <button
                  onClick={handleLookupAbha}
                  disabled={!abhaInput.trim() || isLoading}
                  className="absolute right-2 top-2 bottom-2 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm flex items-center gap-1.5 transition shadow-xs"
                >
                  <Search className="w-4 h-4" />
                  <span>Verify</span>
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2 font-medium">
                Tip: Enter any demo number (e.g. 9820145892) to verify instantly.
              </p>
            </div>

            {/* Simulated Touch Screen Keypad */}
            <div className="grid grid-cols-3 gap-2.5 mb-6">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '-', '0', 'Clear'].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => {
                    if (val === 'Clear') setAbhaInput('');
                    else setAbhaInput((prev) => prev + val);
                  }}
                  className="p-4 rounded-2xl bg-white/80 hover:bg-white active:bg-blue-600 active:text-white border border-white/80 text-xl font-bold font-mono text-slate-800 transition active:scale-95 shadow-xs cursor-pointer"
                >
                  {val}
                </button>
              ))}
            </div>

            <div className="flex justify-between items-center">
              <button
                onClick={() => setActiveTab('select_method')}
                className="px-5 py-2.5 rounded-xl bg-white/80 hover:bg-white text-slate-700 text-sm font-bold border border-white/80 shadow-xs transition"
              >
                Back to Methods
              </button>
            </div>
          </div>
        )}

        {/* Tab 4: New Patient Registration Form */}
        {activeTab === 'new_patient' && (
          <form onSubmit={handleRegisterNewPatient} className="max-w-xl mx-auto space-y-4 py-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name (मरीज का पूरा नाम)</label>
              <input
                required
                type="text"
                value={newPatientForm.name}
                onChange={(e) => setNewPatientForm({ ...newPatientForm, name: e.target.value })}
                placeholder="e.g. Ramesh Deshmukh"
                className="w-full text-base px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600 shadow-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Age (वर्ष)</label>
                <input
                  required
                  type="number"
                  min="1"
                  max="120"
                  value={newPatientForm.age}
                  onChange={(e) => setNewPatientForm({ ...newPatientForm, age: e.target.value })}
                  placeholder="e.g. 45"
                  className="w-full text-base px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600 shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Gender (लिंग)</label>
                <select
                  value={newPatientForm.gender}
                  onChange={(e) => setNewPatientForm({ ...newPatientForm, gender: e.target.value as any })}
                  className="w-full text-base px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600 shadow-xs"
                >
                  <option value="Male">Male (पुरुष)</option>
                  <option value="Female">Female (महिला)</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mobile Number</label>
                <input
                  required
                  type="tel"
                  maxLength={10}
                  value={newPatientForm.phone}
                  onChange={(e) => setNewPatientForm({ ...newPatientForm, phone: e.target.value })}
                  placeholder="10-digit mobile"
                  className="w-full text-base px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600 shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Blood Group (रक्त समूह)</label>
                <select
                  value={newPatientForm.bloodGroup}
                  onChange={(e) => setNewPatientForm({ ...newPatientForm, bloodGroup: e.target.value })}
                  className="w-full text-base px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600 shadow-xs"
                >
                  {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', 'Unknown'].map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4">
              <button
                type="button"
                onClick={() => setActiveTab('select_method')}
                className="px-5 py-2.5 rounded-xl bg-white/80 hover:bg-white text-slate-700 text-sm font-bold border border-white/80 shadow-xs transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-lg shadow-blue-600/30 flex items-center gap-2 transition active:scale-95 cursor-pointer"
              >
                <span>Register & Continue</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </form>
        )}

        {/* Tab 5: Patient Successfully Identified Display */}
        {activeTab === 'patient_found' && identifiedPatient && (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-500 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>

            <span className="text-xs uppercase tracking-widest px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-black inline-block mb-3">
              {identifiedPatient.isExistingPatient ? t.statusExisting : t.statusNew}
            </span>

            <h3 className="text-2xl sm:text-4xl font-black text-blue-950 mb-6">
              {identifiedPatient.name}
            </h3>

            {/* Identified Patient Summary Grid - Frosted Panel */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto mb-8 bg-white/70 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/80 shadow-sm text-left">
              <div>
                <span className="text-xs text-slate-500 font-semibold block">{t.age}</span>
                <span className="text-base font-black text-slate-900">{identifiedPatient.age} yrs</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 font-semibold block">{t.gender}</span>
                <span className="text-base font-black text-slate-900">{identifiedPatient.gender}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 font-semibold block">{t.phoneLabel}</span>
                <span className="text-base font-black text-slate-900">{identifiedPatient.phone}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 font-semibold block">{t.bloodGroupLabel}</span>
                <span className="text-base font-black text-blue-600">{identifiedPatient.bloodGroup || 'B+'}</span>
              </div>
              <div className="col-span-2 sm:col-span-4 pt-2 border-t border-slate-200">
                <span className="text-xs text-slate-500 font-semibold block">{t.abhaIdLabel}</span>
                <span className="text-xs sm:text-sm font-mono font-bold text-blue-800 break-all">{identifiedPatient.abhaId}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => setActiveTab('select_method')}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-white/80 hover:bg-white text-slate-700 font-bold text-sm border border-white/80 shadow-xs transition"
              >
                Not you? Change Patient
              </button>
              <button
                id="btn-confirm-patient-id"
                onClick={() => onPatientIdentified(identifiedPatient)}
                className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-lg shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 transition transform active:scale-95 cursor-pointer"
              >
                <span>{t.confirm}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
