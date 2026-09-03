import { Language } from '../types';

const rawTranslations: Record<Language, Record<string, string>> = {
  en: {
    appName: 'MEDIKIOSK',
    appTagline: 'Patient Clinical Intake System',
    appTaglineSub: 'Digital Clinical History & Document Assistance',
    appSubheading: 'Complete your basic health information before meeting the doctor.',
    govInfoBar: 'Patient services • Clinical history • Document assistance',
    kioskStation: 'Kiosk Terminal #04 – General OPD (Ground Floor)',
    hospitalContext: 'Central OPD Network • AIIMS New Delhi',
    kioskReadyStatus: 'Kiosk 04 · Ready',
    
    // Homepage Clinical Content
    homeContextLabel: 'SELF-SERVICE OPD INTAKE',
    homeMainHeading: 'Before you see the doctor,\ntell us about your health.',
    homeSupportingText: 'Share your symptoms, medical history and previous reports. MediKiosk prepares a structured summary for your doctor.',
    startPatientIntake: 'Start Patient Intake',
    continueExistingSession: 'Continue Existing Session',
    scanTokenOrAbha: 'Scan Token QR or ABHA ID',
    staffLogin: 'Staff Login',
    callStaff: 'Call Staff',
    accessibility: 'Accessibility',
    
    // Accessibility
    audioAssistance: 'Audio Guide',
    audioPlaying: 'Playing Audio...',
    audioStopped: 'Listen',
    textSize: 'Text Size',
    highContrast: 'High Contrast',
    help: 'Need Help',
    emergencyCallStaff: 'Call Nurse / Staff',
    normalText: 'A',
    largeText: 'A+',
    extraLargeText: 'A++',
    
    // Actions
    startNewVisit: 'START NEW VISIT',
    continueExistingVisit: 'CONTINUE EXISTING VISIT',
    back: 'Go Back',
    next: 'Continue',
    cancel: 'Cancel',
    edit: 'Edit',
    save: 'Save Changes',
    confirm: 'Confirm & Proceed',
    submitToDoctor: 'SUBMIT TO DOCTOR',
    skip: 'Skip this step',
    retake: 'Record Again',
    verify: 'Verify',
    
    // Identification
    identifyTitle: "Let's identify you",
    identifySubtitle: 'Please select an option to access or create your hospital visit record.',
    scanAbhaQr: 'Scan ABHA QR Code',
    enterAbhaNumber: 'Enter ABHA / Mobile Number',
    scanIdCard: 'Scan Hospital / Govt ID Card',
    newPatientReg: 'New Patient (Quick Check-in)',
    abhaPlaceholder: 'Enter 14-digit ABHA (e.g. 91-4589-2341-9874)',
    phonePlaceholder: 'Enter 10-digit Mobile Number',
    patientName: 'Patient Name',
    age: 'Age',
    gender: 'Gender',
    abhaIdLabel: 'ABHA Address / ID',
    phoneLabel: 'Phone Number',
    bloodGroupLabel: 'Blood Group',
    statusExisting: 'Verified Existing Patient',
    statusNew: 'New Patient Registration',
    
    // Consent
    consentTitle: 'Before we begin',
    consentSubtitle: 'Please review and authorize your clinical history intake.',
    consentBody:
      'We will ask questions about your health and may scan your previous medical documents. This information will be securely organized into a draft medical history summary strictly for your consulting healthcare professional. AI does not diagnose or prescribe.',
    consentAudioText:
      'Hello. This kiosk will help record your symptoms and documents before you see the doctor. Your information is kept completely private and will only be shown to your doctor.',
    privacyNotice: 'Data is protected under ABDM data privacy guidelines. All AI summaries require mandatory doctor verification.',
    consentCheckbox: 'I understand and agree to provide my health details and previous documents.',
    agreeAndContinue: 'I AGREE & CONTINUE',
    doNotAgree: 'I DO NOT AGREE',
    
    // Intake Mode
    modeTitle: 'Choose Intake Stream',
    modeSubtitle: 'Select the consultation department framework for your visit.',
    modeModern: 'Modern Allopathic Medicine',
    modeModernDesc: 'General Medicine, Cardiology, Pulmonology, Pediatrics, Surgery & Specialist OPD.',
    modeAyush: 'AYUSH / Ayurveda Medicine',
    modeAyushDesc: 'Ayurvedic Dashavidha Pariksha, Prakriti, Agni, Koshtha & Doshic Clinical Intake.',
    
    // History Engine
    historyHeader: 'Clinical History',
    stepIndicator: 'Step',
    of: 'of',
    chiefComplaintPrompt: 'What primary problem or discomfort are you experiencing today?',
    tapToSpeak: 'TAP TO SPEAK',
    listening: 'Listening to your voice... Speak clearly',
    transcribedLabel: 'Recognized Voice Input',
    typeOrSelect: 'Or tap one of the common complaints below:',
    durationPrompt: 'Since how many days or hours have you had this issue?',
    severityPrompt: 'On a scale of 1 to 10, how severe is your discomfort?',
    mild: 'Mild',
    moderate: 'Moderate',
    severe: 'Very Severe',
    associatedSymptomsPrompt: 'Are you experiencing any of these associated symptoms?',
    
    // Red-Flag
    redFlagTitle: 'PRIORITY TRIAGE ALERT',
    redFlagMessage:
      'Your responses indicate symptoms that may require urgent medical evaluation. Our triage nursing staff has been automatically alerted.',
    redFlagDisclaimer: 'MediKiosk is an intake assistant and does not provide an autonomous diagnosis. Please proceed to the emergency triage counter if you feel faint or breathless.',
    callTriageStaff: 'CALL TRIAGE STAFF NOW',
    dismissAlert: 'Acknowledge & Continue Intake',
    
    // Documents & OCR
    documentsTitle: 'Do you have previous medical documents?',
    documentsSubtitle: 'Upload or scan previous prescriptions, lab reports, discharge summaries or X-ray reports to auto-extract past history.',
    scanDocument: 'Scan Document (Camera / Scanner)',
    uploadDocument: 'Upload Image / PDF',
    skipDocuments: 'I do not have documents with me',
    uploadedDocsLabel: 'Scanned & Uploaded Documents',
    ocrProcessing: 'Extracting medical entities with OCR...',
    ocrCompleted: 'OCR Extracted Successfully',
    ocrConfidenceLabel: 'OCR Confidence',
    verifiedEntity: 'Verified',
    needsReview: 'Needs Review',
    
    // Review Screen
    reviewTitle: 'Please review your intake details',
    reviewSubtitle: 'Check the information below before creating your OPD consultation token.',
    tokenGeneratedTitle: 'Your Consultation Token is Ready!',
    tokenSubtitle: 'Please collect your printed token slip or show this screen at Room #',
    estimatedWaitTime: 'Estimated Wait Time',
    minutes: 'mins',
    tokenNumberLabel: 'Token Number',
    departmentLabel: 'Department',
    roomLabel: 'Consulting Room',
    printSlip: 'Print Token Slip',
    returnHome: 'Finish & Reset Kiosk',
    
    // Doctor Portal
    doctorPortal: 'Doctor Clinical Workspace',
    patientQueue: 'OPD Patient Queue',
    todaysPatients: "Today's Patients",
    redFlagAlerts: 'Red-Flag Alerts',
    medicalRecords: 'Medical Records',
    aiDraftNotice: 'AI-GENERATED DRAFT — MANDATORY PHYSICIAN VERIFICATION REQUIRED',
    physicianVerifiedBadge: 'Physician Verified',
    editSummary: 'Edit Clinical Summary',
    confirmSummary: 'Verify & Confirm Summary',
    rejectSummary: 'Reject AI Summary',
    viewOriginalDocs: 'View Source Documents',
    consultationNotes: 'Doctor Consultation & Prescription Notes',
    
    // AYUSH Specific
    prakritiLabel: 'Prakriti (Body Constitution)',
    agniLabel: 'Agni (Digestive Fire)',
    koshthaLabel: 'Koshtha (Bowel Habit)',
    saraLabel: 'Dhatu Sara (Tissue Integrity)',
    aharaViharaLabel: 'Ahara-Vihara (Diet & Lifestyle)',
  },
  
  hi: {
    appName: 'मेडीकियोस्क',
    appTagline: 'मरीज़ क्लिनिकल इनटेक प्रणाली',
    appTaglineSub: 'डिजिटल क्लिनिकल इतिहास एवं दस्तावेज़ सहायता',
    appSubheading: 'डॉक्टर से मिलने से पहले अपनी बुनियादी स्वास्थ्य जानकारी दर्ज करें।',
    govInfoBar: 'रोगी सेवाएं • क्लिनिकल इतिहास • दस्तावेज़ सहायता',
    kioskStation: 'कियोस्क टर्मिनल #04 – सामान्य ओपीडी (भूतल)',
    hospitalContext: 'केंद्रीय ओपीडी नेटवर्क • एम्स नई दिल्ली',
    kioskReadyStatus: 'कियोस्क 04 · तैयार',
    
    // Homepage Clinical Content
    homeContextLabel: 'सेल्फ-सर्विस ओपीडी इंटेक',
    homeMainHeading: 'डॉक्टर से मिलने से पहले,\nअपने स्वास्थ्य के बारे में बताएं।',
    homeSupportingText: 'अपने लक्षण, पिछला मेडिकल इतिहास और पिछली रिपोर्ट साझा करें। मेडीकियोस्क आपके डॉक्टर के लिए संरचित सारांश तैयार करता है।',
    startPatientIntake: 'मरीज इंटेक शुरू करें',
    continueExistingSession: 'मौजूदा सत्र जारी रखें',
    scanTokenOrAbha: 'टोकन क्यूआर या आभा आईडी स्कैन करें',
    staffLogin: 'स्टाफ लॉगिन',
    callStaff: 'स्टाफ को बुलाएं',
    accessibility: 'सुगमता',
    
    // Accessibility
    audioAssistance: 'ऑडियो सहायता',
    audioPlaying: 'ऑडियो चल रहा है...',
    audioStopped: 'सुनें',
    textSize: 'अक्षर का आकार',
    highContrast: 'उच्च कंट्रास्ट',
    help: 'सहायता चाहिए',
    emergencyCallStaff: 'नर्स / स्टाफ को बुलाएं',
    normalText: 'अ',
    largeText: 'अ+',
    extraLargeText: 'अ++',
    
    // Actions
    startNewVisit: 'नया पंजीकरण शुरू करें',
    continueExistingVisit: 'मौजूदा पर्ची जारी रखें',
    back: 'पीछे जाएं',
    next: 'आगे बढ़ें',
    cancel: 'रद्द करें',
    edit: 'संशोधित करें',
    save: 'सहेजें',
    confirm: 'पुष्टि करें',
    submitToDoctor: 'डॉक्टर को सबमिट करें',
    skip: 'छोड़ें',
    retake: 'पुनः बोलें',
    verify: 'सत्यापित करें',
    
    // Identification
    identifyTitle: 'अपनी पहचान चुनें',
    identifySubtitle: 'अस्पताल रिकॉर्ड खोजने या बनाने के लिए कोई एक विकल्प चुनें।',
    scanAbhaQr: 'आभा (ABHA) QR कोड स्कैन करें',
    enterAbhaNumber: 'आभा नंबर या मोबाइल दर्ज करें',
    scanIdCard: 'अस्पताल / सरकारी आईडी स्कैन करें',
    newPatientReg: 'नया मरीज (त्वरित पंजीकरण)',
    abhaPlaceholder: '14 अंकों का आभा नंबर दर्ज करें (उदा. 91-4589-2341-9874)',
    phonePlaceholder: '10 अंकों का मोबाइल नंबर दर्ज करें',
    patientName: 'मरीज का नाम',
    age: 'आयु',
    gender: 'लिंग',
    abhaIdLabel: 'आभा (ABHA) पता',
    phoneLabel: 'मोबाइल नंबर',
    bloodGroupLabel: 'रक्त समूह',
    statusExisting: 'सत्यापित पंजीकृत मरीज',
    statusNew: 'नया मरीज पंजीकरण',
    
    // Consent
    consentTitle: 'शुरू करने से पहले सहमति',
    consentSubtitle: 'कृपया अपनी सहमति और स्वास्थ्य जानकारी की पुष्टि करें।',
    consentBody:
      'हम आपके स्वास्थ्य और लक्षणों के बारे में प्रश्न पूछेंगे और आपकी पुरानी पर्चियों को स्कैन कर सकते हैं। यह जानकारी केवल आपके डॉक्टर के लिए सारांश तैयार करने हेतु सुरक्षित रूप से उपयोग की जाएगी। एआई कोई स्वतंत्र निदान या दवा नहीं लिखता।',
    consentAudioText:
      'नमस्ते। यह कियोस्क डॉक्टर से मिलने से पहले आपके लक्षणों और पुरानी पर्चियों को दर्ज करने में मदद करेगा। आपकी जानकारी पूरी तरह सुरक्षित रहेगी।',
    privacyNotice: 'डेटा राष्ट्रीय स्वास्थ्य मिशन (ABDM) नियमों के तहत सुरक्षित है। डॉक्टर द्वारा अंतिम सत्यापन अनिवार्य है।',
    consentCheckbox: 'मैं समझता/समझती हूँ और अपनी स्वास्थ्य जानकारी साझा करने की सहमति देता/देती हूँ।',
    agreeAndContinue: 'मैं सहमत हूँ और आगे बढ़ें',
    doNotAgree: 'मैं सहमत नहीं हूँ',
    
    // Intake Mode
    modeTitle: 'चिकित्सा पद्धति चुनें',
    modeSubtitle: 'अपनी परामर्श पद्धति का चयन करें।',
    modeModern: 'एलोपैथिक आधुनिक चिकित्सा (Modern Medicine)',
    modeModernDesc: 'सामान्य चिकित्सा, हृदय रोग, फेफड़े, बाल रोग, सर्जरी एवं विशेषज्ञ ओपीडी।',
    modeAyush: 'आयुष / आयुर्वेद चिकित्सा (AYUSH)',
    modeAyushDesc: 'आयुर्वेदिक दशविध परीक्षा, प्रकृति, अग्नि, कोष्ठ एवं त्रिदोष परीक्षण।',
    
    // History Engine
    historyHeader: 'स्वास्थ्य इतिहास',
    stepIndicator: 'चरण',
    of: 'का',
    chiefComplaintPrompt: 'आज आपको मुख्य रूप से क्या समस्या या तकलीफ हो रही है?',
    tapToSpeak: 'बोलने के लिए माइक दबाएं',
    listening: 'सुन रहे हैं... कृपया स्पष्ट बोलें',
    transcribedLabel: 'पहचानी गई आवाज',
    typeOrSelect: 'या नीचे दिए गए प्रमुख लक्षणों में से चुनें:',
    durationPrompt: 'यह तकलीफ कितने दिनों या घंटों से है?',
    severityPrompt: '1 से 10 के पैमाने पर दर्द या तकलीफ कितनी तीव्र है?',
    mild: 'हल्का',
    moderate: 'मध्यम',
    severe: 'अत्यधिक तीव्र',
    associatedSymptomsPrompt: 'क्या आपको इनमें से कोई अन्य लक्षण भी महसूस हो रहा है?',
    
    // Red-Flag
    redFlagTitle: 'आपातकालीन चेतावनी (Red Flag)',
    redFlagMessage:
      'आपके लक्षणों से लगता है कि आपको तुरंत डॉक्टरी देखभाल की आवश्यकता हो सकती है। हमारी ट्रायज नर्सिंग टीम को सतर्क कर दिया गया है।',
    redFlagDisclaimer: 'मेडीकियोस्क केवल इतिहास दर्ज करता है, निदान नहीं देता। यदि आपको चक्कर या सांस में अत्यधिक तकलीफ हो तो तुरंत इमरजेंसी काउंटर पर जाएं।',
    callTriageStaff: 'तुरंत मेडिकल स्टाफ को बुलाएं',
    dismissAlert: 'समझ गया, आगे बढ़ें',
    
    // Documents & OCR
    documentsTitle: 'क्या आपके पास पुरानी मेडिकल पर्चियां या रिपोर्ट हैं?',
    documentsSubtitle: 'अपनी पुरानी दवा की पर्चियां, लैब रिपोर्ट, या डिस्चार्ज समरी स्कैन या अपलोड करें।',
    scanDocument: 'दस्तावेज़ स्कैन करें (कैमरा)',
    uploadDocument: 'फोटो / पीडीएफ अपलोड करें',
    skipDocuments: 'मेरे पास कोई दस्तावेज़ नहीं है',
    uploadedDocsLabel: 'स्कैन किए गए दस्तावेज़',
    ocrProcessing: 'दवाइयों और जांचों का ऑटो-विश्लेषण हो रहा है...',
    ocrCompleted: 'दस्तावेज़ सफलतापूर्वक पढ़ा गया',
    ocrConfidenceLabel: 'सटीकता दर',
    verifiedEntity: 'सत्यापित',
    needsReview: 'पुनरावलोकन आवश्यक',
    
    // Review Screen
    reviewTitle: 'कृपया अपनी दर्ज जानकारी की जांच करें',
    reviewSubtitle: 'टोकन जारी करने से पहले नीचे दिए गए विवरण की जांच करें।',
    tokenGeneratedTitle: 'आपका ओपीडी टोकन तैयार है!',
    tokenSubtitle: 'कृपया अपनी पर्ची प्राप्त करें और कक्ष संख्या पर प्रतीक्षा करें:',
    estimatedWaitTime: 'अनुमानित प्रतीक्षा समय',
    minutes: 'मिनट',
    tokenNumberLabel: 'टोकन क्रमांक',
    departmentLabel: 'विभाग',
    roomLabel: 'परामर्श कक्ष',
    printSlip: 'टोकन पर्ची प्रिंट करें',
    returnHome: 'समाप्त करें एवं रीसेट करें',
    
    // Doctor Portal
    doctorPortal: 'डॉक्टर क्लिनिकल पोर्टल',
    patientQueue: 'ओपीडी मरीज कतार',
    todaysPatients: 'आज के मरीज',
    redFlagAlerts: 'रेड-फ्लैग अलर्ट',
    medicalRecords: 'मेडिकल रिकॉर्ड्स',
    aiDraftNotice: 'एआई द्वारा तैयार ड्राफ्ट — डॉक्टर द्वारा सत्यापन अनिवार्य',
    physicianVerifiedBadge: 'डॉक्टर द्वारा सत्यापित',
    editSummary: 'समरी संपादित करें',
    confirmSummary: 'सत्यापित एवं स्वीकृत करें',
    rejectSummary: 'एआई सारांश अस्वीकार करें',
    viewOriginalDocs: 'मूल दस्तावेज़ देखें',
    consultationNotes: 'डॉक्टर परामर्श एवं दवा पर्ची',
    
    // AYUSH Specific
    prakritiLabel: 'प्रकृति (देह प्रकृति)',
    agniLabel: 'अग्नि (पाचन शक्ति)',
    koshthaLabel: 'कोष्ठ (मल प्रवृत्ति)',
    saraLabel: 'धातु सारता',
    aharaViharaLabel: 'आहार-विहार',
  },
  
  mr: {
    appName: 'मेडीकियोस्क',
    appTagline: 'रुग्ण क्लिनिकल इनटेक प्रणाली',
    appTaglineSub: 'डिजिटल क्लिनिकल इतिहास आणि कागदपत्र सहाय्य',
    appSubheading: 'डॉक्टरांना भेटण्यापूर्वी आपली मूलभूत आरोग्य माहिती नोंदवा.',
    govInfoBar: 'रुग्ण सेवा • क्लिनिकल इतिहास • कागदपत्र सहाय्य',
    kioskStation: 'कियोस्क टर्मिनल #04 – सामान्य ओपीडी (तळमजला)',
    hospitalContext: 'मध्यवर्ती ओपीडी नेटवर्क • एम्स नवी दिल्ली',
    kioskReadyStatus: 'कियोस्क 04 · सज्ज',
    
    // Homepage Clinical Content
    homeContextLabel: 'सेल्फ-सर्व्हिस ओपीडी इनटेक',
    homeMainHeading: 'डॉक्टरांना भेटण्यापूर्वी,\nआपल्या आरोग्याविषयी माहिती द्या.',
    homeSupportingText: 'आपली लक्षणे, मागील वैद्यकीय इतिहास आणि जुने रिपोर्ट्स नोंदवा. मेडीकियोस्क आपल्या डॉक्टरांसाठी वैद्यकीय सारांश तयार करतो.',
    startPatientIntake: 'रुग्ण इनटेक सुरू करा',
    continueExistingSession: 'चालू सत्र पुढे सुरू ठेवा',
    scanTokenOrAbha: 'टोकन क्यूआर किंवा आभा आयडी स्कॅन करा',
    staffLogin: 'स्टाफ लॉगिन',
    callStaff: 'स्टाफला बोलवा',
    accessibility: 'सुलभता',
    
    // Accessibility
    audioAssistance: 'ऑडिओ मदत',
    audioPlaying: 'ऑडिओ चालू आहे...',
    audioStopped: 'ऐका',
    textSize: 'अक्षरांचा आकार',
    highContrast: 'हाय कॉन्ट्रास्ट',
    help: 'मदत हवी आहे',
    emergencyCallStaff: 'नर्स / कर्मचाऱ्यांना बोलवा',
    normalText: 'अ',
    largeText: 'अ+',
    extraLargeText: 'अ++',
    
    // Actions
    startNewVisit: 'नवीन नोंदणी सुरू करा',
    continueExistingVisit: 'मागील नोंदणी सुरू ठेवा',
    back: 'मागे जा',
    next: 'पुढे चला',
    cancel: 'रद्द करा',
    edit: 'बदल करा',
    save: 'जतन करा',
    confirm: 'निश्चित करा',
    submitToDoctor: 'डॉक्टरांना सबमिट करा',
    skip: 'वगळा',
    retake: 'पुन्हा बोला',
    verify: 'तपासा',
    
    // Identification
    identifyTitle: 'तुमची ओळख निवडा',
    identifySubtitle: 'हॉस्पिटल रेकॉर्ड शोधण्यासाठी किंवा तयार करण्यासाठी एक पर्याय निवडा.',
    scanAbhaQr: 'आभा (ABHA) QR कोड स्कॅन करा',
    enterAbhaNumber: 'आभा किंवा मोबाईल क्रमांक टाका',
    scanIdCard: 'हॉस्पिटल / शासकीय ओळखपत्र स्कॅन करा',
    newPatientReg: 'नवीन रुग्ण (त्वरित नोंदणी)',
    abhaPlaceholder: '14 अंकी आभा क्रमांक टाका (उदा. 91-4589-2341-9874)',
    phonePlaceholder: '10 अंकी मोबाईल क्रमांक टाका',
    patientName: 'रुग्णाचे नाव',
    age: 'वय',
    gender: 'लिंग',
    abhaIdLabel: 'आभा (ABHA) पत्ता',
    phoneLabel: 'मोबाईल क्रमांक',
    bloodGroupLabel: 'रक्तगट',
    statusExisting: 'नोंदणीकृत रुग्ण',
    statusNew: 'नवीन रुग्ण नोंदणी',
    
    // Consent
    consentTitle: 'सुरुवात करण्यापूर्वी संमती',
    consentSubtitle: 'कृपया तुमची संमती आणि आरोग्य माहिती तपासा.',
    consentBody:
      'आम्ही तुमच्या आरोग्याबद्दल प्रश्न विचारू आणि तुमची जुनी कागदपत्रे स्कॅन करू. ही माहिती केवळ तुमच्या डॉक्टरांसाठी संक्षिप्त इतिहास तयार करण्यासाठी वापरली जाईल. एआय कोणताही स्वतंत्र रोगनिदान करत नाही.',
    consentAudioText:
      'नमस्कार. हे किओस्क डॉक्टरांना भेटण्यापूर्वी तुमची लक्षणे आणि औषधोपचार नोंदवण्यास मदत करेल. तुमची माहिती पूर्णपणे सुरक्षित ठेवली जाईल.',
    privacyNotice: 'माहिती राष्ट्रीय डिजिटल आरोग्य नियमावलीनुसार सुरक्षित आहे. डॉक्टरांचे अंतिम प्रमाणीकरण आवश्यक आहे.',
    consentCheckbox: 'मी समजून घेतले आहे आणि माझी आरोग्य माहिती देण्यास संमती देतो/देते.',
    agreeAndContinue: 'मी सहमत आहे व पुढे चला',
    doNotAgree: 'मी सहमत नाही',
    
    // Intake Mode
    modeTitle: 'वैद्यकीय पद्धती निवडा',
    modeSubtitle: 'तुमच्या तपासणीसाठी योग्य पद्धत निवडा.',
    modeModern: 'अ‍ॅलोपॅथिक आधुनिक वैद्यकशास्त्र (Modern Medicine)',
    modeModernDesc: 'जनरल मेडिसिन, हृदयरोग, छातीचे विकार, बालरोग, शस्त्रक्रिया ओपीडी.',
    modeAyush: 'आयुष / आयुर्वेद वैद्यकशास्त्र (AYUSH)',
    modeAyushDesc: 'आयुर्वेदिक दशविध परीक्षा, प्रकृती, अग्नी, कोष्ठ आणि त्रिदोष तपासणी.',
    
    // History Engine
    historyHeader: 'वैद्यकीय इतिहास',
    stepIndicator: 'टप्पा',
    of: 'पैकी',
    chiefComplaintPrompt: 'आज तुम्हाला प्रामुख्याने काय त्रास किंवा समस्या होत आहे?',
    tapToSpeak: 'बोलण्यासाठी माइक दाबा',
    listening: 'ऐकत आहोत... कृपया स्पष्ट बोला',
    transcribedLabel: 'नोंदवलेला आवाज',
    typeOrSelect: 'किंवा खालीलपैकी प्रमुख लक्षण निवडा:',
    durationPrompt: 'हा त्रास किती दिवसांपासून किंवा तासांपासून होत आहे?',
    severityPrompt: '1 ते 10 च्या प्रमाणात त्रासाची तीव्रता किती आहे?',
    mild: 'कमी',
    moderate: 'मध्यम',
    severe: 'अति तीव्र',
    associatedSymptomsPrompt: 'तुम्हाला यापैकी इतर काही लक्षणे जाणवत आहेत का?',
    
    // Red-Flag
    redFlagTitle: 'तातडीचा इशारा (Red Flag)',
    redFlagMessage:
      'तुमच्या लक्षणांवरून त्वरित वैद्यकीय उपचारांची गरज असू शकते. आमच्या ट्रायज नर्सिंग पथकाला सूचित केले गेले आहे.',
    redFlagDisclaimer: 'मेडीकियोस्क केवळ माहिती नोंदवतो, निदान करत नाही. चक्कर किंवा धाप लागत असल्यास तात्काळ इमर्जन्सी कक्षात जा.',
    callTriageStaff: 'तातडीने वैद्यकीय कर्मचाऱ्यांना बोलवा',
    dismissAlert: 'समजले, पुढे चला',
    
    // Documents & OCR
    documentsTitle: 'तुमच्याकडे मागील वैद्यकीय कागदपत्रे आहेत का?',
    documentsSubtitle: 'तुमची जुनी औषध चिठ्ठी, लॅब रिपोर्ट किंवा डिस्चार्ज समरी स्कॅन अथवा अपलोड करा.',
    scanDocument: 'कागदपत्र स्कॅन करा (कॅमेरा)',
    uploadDocument: 'फोटो / पीडीएफ अपलोड करा',
    skipDocuments: 'माझ्याकडे कागदपत्रे नाहीत',
    uploadedDocsLabel: 'स्कॅन केलेली कागदपत्रे',
    ocrProcessing: 'औषधे व तपासणी आपोआप वाचली जात आहेत...',
    ocrCompleted: 'कागदपत्र यशस्वीरीत्या वाचले गेले',
    ocrConfidenceLabel: 'अचूकता प्रमाण',
    verifiedEntity: 'तपासलेले',
    needsReview: 'तपासणी आवश्यक',
    
    // Review Screen
    reviewTitle: 'कृपया नोंदवलेल्या माहितीची खात्री करा',
    reviewSubtitle: 'टोकन मिळण्यापूर्वी खालील माहिती तपासून घ्या.',
    tokenGeneratedTitle: 'तुमचा ओपीडी टोकन तयार आहे!',
    tokenSubtitle: 'कृपया तुमची टोकन पावती घ्या आणि खोली क्रमांक वर प्रतीक्षा करा:',
    estimatedWaitTime: 'अंदाजे प्रतीक्षा वेळ',
    minutes: 'मिनिटे',
    tokenNumberLabel: 'टोकन क्रमांक',
    departmentLabel: 'विभाग',
    roomLabel: 'तपासणी कक्ष',
    printSlip: 'टोकन पावती प्रिंट करा',
    returnHome: 'पूर्ण करा व रीसेट करा',
    
    // Doctor Portal
    doctorPortal: 'डॉक्टर क्लिनिकल पोर्टल',
    patientQueue: 'ओपीडी रुग्ण रांग',
    todaysPatients: 'आजचे रुग्ण',
    redFlagAlerts: 'रेड-फ्लॅग अलर्ट',
    medicalRecords: 'वैद्यकीय नोंदी',
    aiDraftNotice: 'एआय द्वारे तयार मसुदा — डॉक्टरांचे प्रमाणीकरण अनिवार्य',
    physicianVerifiedBadge: 'डॉक्टरांनी प्रमाणित केलेले',
    editSummary: 'मसुदा संपादित करा',
    confirmSummary: 'प्रमाणित व मंजूर करा',
    rejectSummary: 'एआय मसुदा नाकारा',
    viewOriginalDocs: 'मूळ कागदपत्रे पहा',
    consultationNotes: 'डॉक्टर सल्ला व औषधोपचार',
    
    // AYUSH Specific
    prakritiLabel: 'प्रकृती',
    agniLabel: 'अग्नी (पचनशक्ती)',
    koshthaLabel: 'कोष्ठ (पचन प्रवृत्ती)',
    saraLabel: 'धातु सारता',
    aharaViharaLabel: 'आहार-विहार',
  },
};

export const translations: Record<Language, Record<string, string>> = new Proxy(rawTranslations, {
  get(target, prop: string) {
    if (prop in target) {
      return target[prop as Language];
    }
    return target.en;
  },
});
