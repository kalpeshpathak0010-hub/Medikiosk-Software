import { ChiefComplaintId, ClinicalQuestion, Language, RedFlagAlert } from '../types';

export interface ComplaintCategory {
  id: ChiefComplaintId;
  label: Record<Language, string>;
  icon: string;
  department: string;
}

export const CHIEF_COMPLAINT_CATEGORIES: ComplaintCategory[] = [
  {
    id: 'chest_pain',
    label: {
      en: 'Chest Pain / Discomfort',
      hi: 'छाती में दर्द / भारीपन',
      mr: 'छातीत दुखणे / जडपणा',
    },
    icon: 'HeartPulse',
    department: 'Cardiology / General Medicine',
  },
  {
    id: 'fever',
    label: {
      en: 'Fever / Chills',
      hi: 'बुखार / कंपकंपी',
      mr: 'ताप / थंडी वाजणे',
    },
    icon: 'Thermometer',
    department: 'General Medicine',
  },
  {
    id: 'breathing_problem',
    label: {
      en: 'Breathing Difficulty',
      hi: 'सांस लेने में तकलीफ',
      mr: 'श्वास घेण्यास त्रास',
    },
    icon: 'Wind',
    department: 'Pulmonology / Emergency',
  },
  {
    id: 'cough',
    label: {
      en: 'Cough & Cold',
      hi: 'खांसी व जुकाम',
      mr: 'खोकला आणि सर्दी',
    },
    icon: 'Activity',
    department: 'Pulmonology / General Medicine',
  },
  {
    id: 'headache',
    label: {
      en: 'Severe Headache / Dizziness',
      hi: 'सिरदर्द / चक्कर आना',
      mr: 'डोकेदुखी / चक्कर येणे',
    },
    icon: 'Brain',
    department: 'Neurology / General Medicine',
  },
  {
    id: 'stomach_problem',
    label: {
      en: 'Stomach Pain / Acidity',
      hi: 'पेट दर्द / गैस / उल्टी',
      mr: 'पोटदुखी / अपचन / उलटी',
    },
    icon: 'Pill',
    department: 'Gastroenterology',
  },
  {
    id: 'joint_pain',
    label: {
      en: 'Joint / Body Pain',
      hi: 'जोड़ों व बदन का दर्द',
      mr: 'सांधेदुखी / अंगदुखी',
    },
    icon: 'Bone',
    department: 'Orthopedics / Rheumatology',
  },
  {
    id: 'other',
    label: {
      en: 'Other Symptoms',
      hi: 'अन्य कोई तकलीफ',
      mr: 'इतर कोणतीही समस्या',
    },
    icon: 'Stethoscope',
    department: 'General OPD',
  },
];

export const QUESTION_FLOWS: Record<ChiefComplaintId, ClinicalQuestion[]> = {
  chest_pain: [
    {
      id: 'cp_onset',
      complaintId: 'chest_pain',
      category: 'hpi',
      type: 'single_choice',
      questionText: {
        en: 'When did the chest pain start?',
        hi: 'छाती में दर्द कब से शुरू हुआ?',
        mr: 'छातीत दुखणे कधीपासून सुरू झाले?',
      },
      audioPrompt: {
        en: 'When did your chest discomfort begin?',
        hi: 'आपकी छाती में दर्द कब से हो रहा है?',
        mr: 'तुमच्या छातीत दुखणे कधी सुरू झाले?',
      },
      options: [
        {
          id: 'cp_onset_minutes',
          label: { en: 'Less than 1 hour ago (Sudden)', hi: '1 घंटे से कम (अचानक)', mr: '1 तासापेक्षा कमी (अचानक)' },
          isRedFlagTrigger: true,
        },
        {
          id: 'cp_onset_hours',
          label: { en: 'A few hours ago (Today)', hi: 'कुछ घंटे पहले (आज ही)', mr: 'काही तासांपूर्वी (आजच)' },
        },
        {
          id: 'cp_onset_days',
          label: { en: '1 to 3 days ago', hi: '1 से 3 दिन पहले', mr: '1 ते 3 दिवसांपूर्वी' },
        },
        {
          id: 'cp_onset_weeks',
          label: { en: 'More than a week (Recurrent)', hi: '1 सप्ताह से अधिक समय से', mr: '1 आठवड्यापेक्षा जास्त काळापासून' },
        },
      ],
    },
    {
      id: 'cp_location',
      complaintId: 'chest_pain',
      category: 'hpi',
      type: 'single_choice',
      questionText: {
        en: 'Where exactly is the pain located?',
        hi: 'दर्द ठीक किस जगह पर हो रहा है?',
        mr: 'दुखणे नक्की कोणत्या भागात होत आहे?',
      },
      options: [
        {
          id: 'cp_loc_center',
          label: { en: 'Center of chest (Heavy pressure)', hi: 'छाती के बीच में (दबाव / भारीपन)', mr: 'छातीच्या मध्यभागी (दाब / जडपणा)' },
          isRedFlagTrigger: true,
        },
        {
          id: 'cp_loc_left',
          label: { en: 'Left side of chest', hi: 'छाती की बाईं ओर', mr: 'छातीच्या डाव्या बाजूला' },
          isRedFlagTrigger: true,
        },
        {
          id: 'cp_loc_right',
          label: { en: 'Right side of chest', hi: 'छाती की दाईं ओर', mr: 'छातीच्या उजव्या बाजूला' },
        },
        {
          id: 'cp_loc_upper_stomach',
          label: { en: 'Upper abdomen / Heartburn area', hi: 'ऊपरी पेट / जलन का स्थान', mr: 'पोटाच्या वरच्या भागात / जळजळ' },
        },
      ],
    },
    {
      id: 'cp_radiation',
      complaintId: 'chest_pain',
      category: 'hpi',
      type: 'single_choice',
      questionText: {
        en: 'Does the pain spread to another area?',
        hi: 'क्या यह दर्द कहीं और फैल रहा है?',
        mr: 'हे दुखणे इतर कोठे पसरत आहे का?',
      },
      options: [
        {
          id: 'cp_rad_left_arm',
          label: { en: 'Spreads to Left Arm or Shoulder', hi: 'बाएं हाथ या कंधे में फैलता है', mr: 'डाव्या हाताकडे किंवा खांद्याकडे पसरते' },
          isRedFlagTrigger: true,
        },
        {
          id: 'cp_rad_jaw_neck',
          label: { en: 'Spreads to Jaw, Neck or Back', hi: 'जबड़े, गर्दन या पीठ में फैलता है', mr: 'जबडा, मान किंवा पाठीकडे पसरते' },
          isRedFlagTrigger: true,
        },
        {
          id: 'cp_rad_none',
          label: { en: 'No, stays in one place', hi: 'नहीं, केवल एक ही जगह रहता है', mr: 'नाही, एकाच जागी राहते' },
        },
      ],
    },
    {
      id: 'cp_severity',
      complaintId: 'chest_pain',
      category: 'severity',
      type: 'scale',
      minScale: 1,
      maxScale: 10,
      questionText: {
        en: 'How severe is the chest discomfort right now? (1 = Mild, 10 = Unbearable)',
        hi: 'दर्द की तीव्रता कितनी है? (1 = हल्का, 10 = असहनीय)',
        mr: 'वेदना किती तीव्र आहेत? (1 = सौम्य, 10 = असह्य)',
      },
      scaleLabels: {
        min: { en: '1 - Mild Discomfort', hi: '1 - हल्का', mr: '1 - सौम्य' },
        max: { en: '10 - Worst Pain of Life', hi: '10 - असहनीय', mr: '10 - असह्य' },
      },
    },
    {
      id: 'cp_redflag_symptoms',
      complaintId: 'chest_pain',
      category: 'associated_symptoms',
      type: 'multi_choice',
      questionText: {
        en: 'Do you also have any of these critical symptoms right now?',
        hi: 'क्या आपको इनमें से कोई अन्य गंभीर लक्षण भी है?',
        mr: 'तुम्हाला सध्या यापैकी कोणतीही लक्षणे जाणवत आहेत का?',
      },
      options: [
        {
          id: 'cp_sweating',
          label: { en: 'Cold Sweating (पसीना आना)', hi: 'अत्यधिक ठंडा पसीना आना', mr: 'थंड घाम येणे' },
          isRedFlagTrigger: true,
        },
        {
          id: 'cp_breathlessness',
          label: { en: 'Shortness of breath / Gasping', hi: 'सांस फूलना या घबराहट', mr: 'श्वास घेण्यास त्रास / धाप लागणे' },
          isRedFlagTrigger: true,
        },
        {
          id: 'cp_dizziness',
          label: { en: 'Feeling faint or dizzy', hi: 'चक्कर आना या बेहोशी जैसा लगना', mr: 'चक्कर येणे किंवा भोवळ येणे' },
          isRedFlagTrigger: true,
        },
        {
          id: 'cp_nausea',
          label: { en: 'Nausea or vomiting', hi: 'जी मिचलाना या उल्टी', mr: 'मळमळ किंवा उलटी' },
        },
        {
          id: 'cp_none_assoc',
          label: { en: 'None of the above', hi: 'उपरोक्त में से कोई नहीं', mr: 'यापैकी काहीही नाही' },
        },
      ],
    },
    {
      id: 'cp_past_cardiac',
      complaintId: 'chest_pain',
      category: 'history',
      type: 'multi_choice',
      questionText: {
        en: 'Do you have any existing medical conditions?',
        hi: 'क्या आपको पहले से इनमें से कोई बीमारी है?',
        mr: 'तुम्हाला आधीपासून यापैकी कोणते आजार आहेत का?',
      },
      options: [
        { id: 'hist_dm', label: { en: 'Diabetes (शुगर)', hi: 'मधुमेह (डायबिटीज)', mr: 'मधुमेह' } },
        { id: 'hist_htn', label: { en: 'High Blood Pressure (बीपी)', hi: 'उच्च रक्तचाप (बीपी)', mr: 'उच्च रक्तदाब' } },
        { id: 'hist_prev_angio', label: { en: 'Previous Stent / Heart Attack', hi: 'पूर्व हार्ट अटैक या स्टेंट', mr: 'मागील हृदयविकाराचा झटका / स्टेंट' }, isRedFlagTrigger: true },
        { id: 'hist_smoking', label: { en: 'Tobacco / Bidi / Smoking habit', hi: 'तम्बाकू / बीड़ी / सिगरेट', mr: 'तंबाखू / सिगारेट सवय' } },
        { id: 'hist_none', label: { en: 'No known prior illness', hi: 'कोई पुरानी बीमारी नहीं', mr: 'कोणताही जुना आजार नाही' } },
      ],
    },
  ],

  fever: [
    {
      id: 'fv_duration',
      complaintId: 'fever',
      category: 'hpi',
      type: 'single_choice',
      questionText: {
        en: 'How many days have you had fever?',
        hi: 'बुखार कितने दिनों से है?',
        mr: 'ताप किती दिवसांपासून येत आहे?',
      },
      options: [
        { id: 'fv_1_2', label: { en: '1 to 2 days', hi: '1 से 2 दिन', mr: '1 ते 2 दिवस' } },
        { id: 'fv_3_5', label: { en: '3 to 5 days', hi: '3 से 5 दिन', mr: '3 ते 5 दिवस' } },
        { id: 'fv_gt_7', label: { en: 'More than 7 days (Prolonged)', hi: '7 दिनों से अधिक समय से', mr: '7 दिवसांपेक्षा जास्त दिवस' } },
      ],
    },
    {
      id: 'fv_pattern',
      complaintId: 'fever',
      category: 'hpi',
      type: 'single_choice',
      questionText: {
        en: 'Is the fever accompanied by shivering/chills or body rash?',
        hi: 'क्या बुखार के साथ ठंड लगकर कंपकंपी या दाने हैं?',
        mr: 'तापासोबत थंडी वाजून येते का किंवा अंगावर पुरळ आहे का?',
      },
      options: [
        { id: 'fv_chills', label: { en: 'High fever with severe chills (कंपकंपी)', hi: 'कंपकंपी के साथ तेज बुखार', mr: 'थंडी वाजून तीव्र ताप' } },
        { id: 'fv_continuous', label: { en: 'Continuous dull fever', hi: 'लगातार बना रहने वाला बुखार', mr: 'सतत राहणारा सौम्य ताप' } },
        { id: 'fv_evening_rise', label: { en: 'Rises specifically in the evening', hi: 'शाम के समय ज्यादा बढ़ता है', mr: 'संध्याकाळी जास्त वाढणारा ताप' } },
      ],
    },
    {
      id: 'fv_redflags',
      complaintId: 'fever',
      category: 'associated_symptoms',
      type: 'multi_choice',
      questionText: {
        en: 'Do you have any of these warning signs with fever?',
        hi: 'क्या बुखार के साथ इनमें से कोई चेतावनी लक्षण है?',
        mr: 'तापासोबत खालीलपैकी कोणतीही लक्षणे आहेत का?',
      },
      options: [
        { id: 'fv_stiff_neck', label: { en: 'Stiff neck or confusion / altered senses', hi: 'गर्दन में अकड़न या बेहोशी जैसी स्थिति', mr: 'मानेमध्ये ताठरपणा किंवा गोंधळलेली अवस्था' }, isRedFlagTrigger: true },
        { id: 'fv_bleeding', label: { en: 'Bleeding gums or reddish spots on skin', hi: 'मसूड़ों से खून या त्वचा पर लाल चकत्ते', mr: 'हिरड्यांतून रक्त किंवा त्वचेवर लाल ठिपके' }, isRedFlagTrigger: true },
        { id: 'fv_severe_breathless', label: { en: 'Severe breathlessness', hi: 'अत्यधिक सांस फूलना', mr: 'तीव्र धाप लागणे' }, isRedFlagTrigger: true },
        { id: 'fv_body_ache', label: { en: 'Severe body/eye ache & joint pain', hi: 'आंखों के पीछे व बदन में तेज दर्द', mr: 'डोळ्यांच्या मागे व अंगात तीव्र वेदना' } },
        { id: 'fv_none_rf', label: { en: 'None of these warning signs', hi: 'इनमें से कोई नहीं', mr: 'यापैकी काहीही नाही' } },
      ],
    },
  ],

  breathing_problem: [
    {
      id: 'br_onset',
      complaintId: 'breathing_problem',
      category: 'hpi',
      type: 'single_choice',
      questionText: {
        en: 'When and how did your breathing difficulty start?',
        hi: 'सांस लेने में तकलीफ कब और कैसे शुरू हुई?',
        mr: 'श्वास घेण्यास त्रास कधी आणि कसा सुरू झाला?',
      },
      options: [
        { id: 'br_sudden', label: { en: 'Suddenly within minutes/hours', hi: 'अचानक कुछ मिनटों या घंटों में', mr: 'अचानक काही मिनिटांत किंवा तासांत' }, isRedFlagTrigger: true },
        { id: 'br_gradual', label: { en: 'Gradually worsening over days', hi: 'धीरे-धीरे कुछ दिनों में बढ़ा', mr: 'हळूहळू काही दिवसांत वाढला' } },
        { id: 'br_chronic', label: { en: 'Known chronic asthma / COPD problem', hi: 'पुरानी दमा या सांस की बीमारी', mr: 'दम्याचा किंवा फुफ्फुसांचा जुना आजार' } },
      ],
    },
    {
      id: 'br_rest_vs_exertion',
      complaintId: 'breathing_problem',
      category: 'severity',
      type: 'single_choice',
      questionText: {
        en: 'Are you breathless even while resting or lying down flat?',
        hi: 'क्या आपको बैठे-बैठे या सीधे लेटने पर भी सांस फूल रही है?',
        mr: 'तुम्हाला शांत बसल्यावर किंवा झोपल्यावरही धाप लागते का?',
      },
      options: [
        { id: 'br_at_rest', label: { en: 'Yes, breathless even while sitting quietly', hi: 'हाँ, चुपचाप बैठे रहने पर भी सांस फूलती है', mr: 'होय, शांत बसल्यावरही धाप लागते' }, isRedFlagTrigger: true },
        { id: 'br_orthopnea', label: { en: 'Cannot lie flat (Need 2-3 pillows)', hi: 'सीधे नहीं लेट सकते (तकिया लगाना पड़ता है)', mr: 'सपाट झोपू शकत नाही (उशा लागतात)' }, isRedFlagTrigger: true },
        { id: 'br_only_walking', label: { en: 'Only when walking or climbing stairs', hi: 'केवल चलने या सीढ़ी चढ़ने पर', mr: 'फक्त चालताना किंवा जिने चढताना' } },
      ],
    },
    {
      id: 'br_associated',
      complaintId: 'breathing_problem',
      category: 'associated_symptoms',
      type: 'multi_choice',
      questionText: {
        en: 'Are there any other symptoms present?',
        hi: 'क्या इनमें से कोई अन्य लक्षण भी है?',
        mr: 'इतर कोणती लक्षणे आहेत का?',
      },
      options: [
        { id: 'br_blue_lips', label: { en: 'Bluish lips or fingertips', hi: 'होंठ या नाखूनों का नीला पड़ना', mr: 'ओठ किंवा नखे निळसर पडणे' }, isRedFlagTrigger: true },
        { id: 'br_wheeze', label: { en: 'Whistling sound (Wheezing) in chest', hi: 'छाती में सीटी जैसी आवाज (घरघराहट)', mr: 'छातीत शिटीसारखा आवाज (घरघर)' } },
        { id: 'br_leg_swelling', label: { en: 'Swelling on feet/ankles', hi: 'पैरों या टखनों में सूजन', mr: 'पायांवर किंवा घोट्यांवर सूज' } },
      ],
    },
  ],

  headache: [
    {
      id: 'ha_onset',
      complaintId: 'headache',
      category: 'hpi',
      type: 'single_choice',
      questionText: {
        en: 'How did the headache begin?',
        hi: 'सिरदर्द की शुरुआत कैसे हुई?',
        mr: 'डोकेदुखी कशी सुरू झाली?',
      },
      options: [
        { id: 'ha_thunderclap', label: { en: 'Sudden explosive pain (Worst of my life)', hi: 'बिजली की तरह अचानक अत्यधिक तेज दर्द', mr: 'अचानक विजेसारखी तीव्र वेदना (आयुष्यातील सर्वात वाईट)' }, isRedFlagTrigger: true },
        { id: 'ha_gradual', label: { en: 'Gradual throbbing pain over hours/days', hi: 'धीरे-धीरे शुरू हुआ टीस मारने वाला दर्द', mr: 'हळूहळू सुरू झालेली ठणक' } },
        { id: 'ha_chronic_recurrent', label: { en: 'Frequent recurrent migraine episodes', hi: 'माइग्रेन का पुराना दर्द जो बार-बार आता है', mr: 'मायग्रेनचा वारंवार होणारा त्रास' } },
      ],
    },
    {
      id: 'ha_redflags',
      complaintId: 'headache',
      category: 'associated_symptoms',
      type: 'multi_choice',
      questionText: {
        en: 'Do you notice any neurological signs?',
        hi: 'क्या आपको इनमें से कोई गंभीर लक्षण महसूस हो रहा है?',
        mr: 'तुम्हाला खालीलपैकी काही जाणवत आहे का?',
      },
      options: [
        { id: 'ha_weakness', label: { en: 'Weakness / numbness on one side of body', hi: 'शरीर के एक तरफ कमजोरी या सुन्नपन', mr: 'एका बाजूच्या शरीरामध्ये अशक्तपणा किंवा बधीरता' }, isRedFlagTrigger: true },
        { id: 'ha_speech', label: { en: 'Difficulty speaking or slurred speech', hi: 'बोलने में तुतलाहट या कठिनाई', mr: 'बोलताना अडखळणे किंवा जीभ जड होणे' }, isRedFlagTrigger: true },
        { id: 'ha_vision', label: { en: 'Sudden double or lost vision in one eye', hi: 'अचानक एक आंख से धुंधला दिखना', mr: 'अचानक एका डोळ्याने अंधुक दिसणे' }, isRedFlagTrigger: true },
        { id: 'ha_projectile_vomit', label: { en: 'Sudden vomiting with headache', hi: 'सिरदर्द के साथ तेज उल्टी', mr: 'डोकेदुखीसोबत उलटी होणे' } },
        { id: 'ha_none_rf', label: { en: 'None of the above', hi: 'उपरोक्त में से कोई नहीं', mr: 'यापैकी काहीही नाही' } },
      ],
    },
  ],

  cough: [
    {
      id: 'cg_duration',
      complaintId: 'cough',
      category: 'hpi',
      type: 'single_choice',
      questionText: {
        en: 'How long have you had this cough?',
        hi: 'यह खांसी कितने समय से है?',
        mr: 'हा खोकला किती दिवसांपासून आहे?',
      },
      options: [
        { id: 'cg_acute', label: { en: 'Less than 1 week', hi: '1 हफ्ते से कम', mr: '1 आठवड्यापेक्षा कमी' } },
        { id: 'cg_subacute', label: { en: '1 to 2 weeks', hi: '1 से 2 हफ्ते', mr: '1 ते 2 आठवडे' } },
        { id: 'cg_chronic', label: { en: 'More than 2-3 weeks (Chronic)', hi: '2 से 3 हफ्ते से ज्यादा (पुरानी)', mr: '2 ते 3 आठवड्यांपेक्षा जास्त (जुना खोकला)' } },
      ],
    },
    {
      id: 'cg_type',
      complaintId: 'cough',
      category: 'hpi',
      type: 'single_choice',
      questionText: {
        en: 'What kind of cough is it?',
        hi: 'खांसी किस प्रकार की है?',
        mr: 'खोकला कोणत्या प्रकारचा आहे?',
      },
      options: [
        { id: 'cg_dry', label: { en: 'Dry irritating cough (सूखी खांसी)', hi: 'सूखी खांसी बिना बलगम', mr: 'कोरडा खोकला' } },
        { id: 'cg_phlegm', label: { en: 'Wet cough with phlegm/sputum (बलगम वाली)', hi: 'बलगम/कफ वाली खांसी', mr: 'कफयुक्त खोकला' } },
        { id: 'cg_blood', label: { en: 'Blood in sputum (खून आना)', hi: 'बलगम में खून के अंश', mr: 'कफातून रक्त येणे' }, isRedFlagTrigger: true },
      ],
    },
    {
      id: 'cg_assoc',
      complaintId: 'cough',
      category: 'associated_symptoms',
      type: 'multi_choice',
      questionText: {
        en: 'Any of the following associated symptoms?',
        hi: 'क्या साथ में इनमें से कोई समस्या है?',
        mr: 'सोबत इतर कोणती लक्षणे आहेत का?',
      },
      options: [
        { id: 'cg_night_sweat', label: { en: 'Night sweats & weight loss', hi: 'रात में पसीना व वजन कम होना', mr: 'रात्री घाम येणे आणि वजन कमी होणे' } },
        { id: 'cg_fever', label: { en: 'Associated fever', hi: 'साथ में बुखार', mr: 'सोबत ताप' } },
        { id: 'cg_chest_pain', label: { en: 'Sharp pain when coughing or breathing in', hi: 'खांसते समय छाती में चुभन', mr: 'खोकताना छातीत टोचल्यासारखे दुखणे' } },
      ],
    },
  ],

  stomach_problem: [
    {
      id: 'st_location',
      complaintId: 'stomach_problem',
      category: 'hpi',
      type: 'single_choice',
      questionText: {
        en: 'Where in your stomach is the problem located?',
        hi: 'पेट में दर्द या तकलीफ किस भाग में है?',
        mr: 'पोटात नक्की कोणत्या भागात त्रास आहे?',
      },
      options: [
        { id: 'st_upper', label: { en: 'Upper abdomen / Heartburn (खट्टी डकार)', hi: 'ऊपरी पेट / सीने में जलन / एसिडिटी', mr: 'वरच्या पोटात / छातीत जळजळ' } },
        { id: 'st_lower_right', label: { en: 'Lower right side (Appendicitis area)', hi: 'पेट के निचले दाहिने हिस्से में तीव्र दर्द', mr: 'पोटाच्या उजव्या बाजूला खाली तीव्र वेदना' } },
        { id: 'st_general_cramps', label: { en: 'General cramping all over', hi: 'पूरे पेट में मरोड़ या ऐंठन', mr: 'संपूर्ण पोटात मुरडा' } },
      ],
    },
    {
      id: 'st_redflags',
      complaintId: 'stomach_problem',
      category: 'associated_symptoms',
      type: 'multi_choice',
      questionText: {
        en: 'Do you have any severe gastrointestinal warning signs?',
        hi: 'क्या आपको इनमें से कोई गंभीर लक्षण है?',
        mr: 'पोटाच्या त्रासासोबत खालीलपैकी काही होत आहे का?',
      },
      options: [
        { id: 'st_vomit_blood', label: { en: 'Vomiting blood or coffee-ground vomit', hi: 'उल्टी में खून या काला पदार्थ', mr: 'उलटीतून रक्त किंवा काळे पाणी' }, isRedFlagTrigger: true },
        { id: 'st_black_stool', label: { en: 'Black tarry stools (काला मल)', hi: 'काले रंग का मल आना', mr: 'काळ्या रंगाचे शौचास होणे' }, isRedFlagTrigger: true },
        { id: 'st_jaundice', label: { en: 'Yellowing of eyes / skin (पीलिया)', hi: 'आंखों या त्वचा का पीला होना', mr: 'डोळे किंवा त्वचा पिवळी होणे' } },
        { id: 'st_severe_vomiting', label: { en: 'Inability to keep liquids down', hi: 'पानी भी न पचना / लगातार उल्टी', mr: 'पाणीही न पचणे / सतत उलटी' } },
        { id: 'st_none_rf', label: { en: 'None of these warning signs', hi: 'इनमें से कोई नहीं', mr: 'यापैकी काहीही नाही' } },
      ],
    },
  ],

  joint_pain: [
    {
      id: 'jp_joints',
      complaintId: 'joint_pain',
      category: 'hpi',
      type: 'multi_choice',
      questionText: {
        en: 'Which joints are primarily affected?',
        hi: 'मुख्य रूप से कौन से जोड़ों में दर्द है?',
        mr: 'मुख्यतः कोणत्या सांध्यांमध्ये वेदना आहेत?',
      },
      options: [
        { id: 'jp_knees', label: { en: 'Knees (घुटना)', hi: 'घुटनों में', mr: 'गुडघ्यांमध्ये' } },
        { id: 'jp_lower_back', label: { en: 'Lower Back (कमर दर्द)', hi: 'कमर व रीढ़ की हड्डी में', mr: 'कंबर आणि पाठीचा कणा' } },
        { id: 'jp_small_joints', label: { en: 'Small hand/finger joints (सुबह की अकड़न)', hi: 'हाथों और उंगलियों के जोड़ों में', mr: 'हातांच्या आणि बोटांच्या सांध्यात' } },
        { id: 'jp_shoulder_neck', label: { en: 'Shoulder / Neck (कंधा व गर्दन)', hi: 'कंधा और गर्दन', mr: 'खांदा आणि मान' } },
      ],
    },
    {
      id: 'jp_morning_stiff',
      complaintId: 'joint_pain',
      category: 'severity',
      type: 'single_choice',
      questionText: {
        en: 'Do you experience morning stiffness lasting more than 30 minutes?',
        hi: 'क्या सुबह उठने पर जोड़ों में 30 मिनट से अधिक अकड़न रहती है?',
        mr: 'सकाळी उठल्यावर सांध्यांमध्ये 30 मिनिटांपेक्षा जास्त ताठरपणा जाणवतो का?',
      },
      options: [
        { id: 'jp_stiff_yes', label: { en: 'Yes, prolonged morning stiffness', hi: 'हाँ, सुबह काफी देर अकड़न रहती है', mr: 'होय, सकाळी जास्त वेळ ताठरपणा राहतो' } },
        { id: 'jp_stiff_no', label: { en: 'No, pain worsens with walking/activity', hi: 'नहीं, चलने-फिरने पर दर्द बढ़ता है', mr: 'नाही, चालण्याने त्रास वाढतो' } },
      ],
    },
  ],

  skin_rash: [
    {
      id: 'sr_duration',
      complaintId: 'skin_rash',
      category: 'hpi',
      type: 'single_choice',
      questionText: {
        en: 'How long has the skin condition or rash been present?',
        hi: 'त्वचा की समस्या या दाने कितने समय से हैं?',
        mr: 'त्वचेची समस्या किंवा पुरळ किती दिवसांपासून आहे?',
      },
      options: [
        { id: 'sr_acute', label: { en: 'Sudden onset today (acute allergic)', hi: 'आज अचानक शुरू हुआ (एलर्जी)', mr: 'आज अचानक सुरू झाली (अलर्जी)' } },
        { id: 'sr_days', label: { en: 'Few days', hi: 'कुछ दिनों से', mr: 'काही दिवसांपासून' } },
        { id: 'sr_chronic', label: { en: 'Long-standing chronic itch/patch', hi: 'काफी समय से पुराना खुजली/दाग', mr: 'खूप दिवसांपासूनची जुनी खाज/डाग' } },
      ],
    },
  ],

  ayush_general: [
    {
      id: 'ay_digestion',
      complaintId: 'ayush_general',
      category: 'ayush',
      type: 'single_choice',
      questionText: {
        en: 'How is your appetite and digestive power (Agni)?',
        hi: 'आपकी भूख और पाचन शक्ति (अग्नि) कैसी है?',
        mr: 'तुमची भूक आणि पचनशक्ती (अग्नी) कशी आहे?',
      },
      options: [
        { id: 'ay_agni_sama', label: { en: 'Samagni: Normal appetite & smooth digestion', hi: 'समाग्नि: समय पर भूख व सही पाचन', mr: 'समाग्नी: वेळेवर भूक व योग्य पचन' } },
        { id: 'ay_agni_vishama', label: { en: 'Vishamagni: Irregular appetite, gas & bloating', hi: 'विषमाग्नि: कभी भूख कभी नहीं, गैस', mr: 'विषमाग्नी: कधी भूक तर कधी नाही, गॅस' } },
        { id: 'ay_agni_tikshna', label: { en: 'Tikshnagni: Excessive burning hunger & acidity', hi: 'तीक्ष्णाग्नि: अत्यधिक भूख व एसिडिटी/जलन', mr: 'तीक्ष्णाग्नी: जास्त भूक व आम्लपित्त/जळजळ' } },
        { id: 'ay_agni_manda', label: { en: 'Mandagni: Weak appetite, heaviness after food', hi: 'मंदाग्नि: भूख न लगना, खाने के बाद भारीपन', mr: 'मंदाग्नी: भूक मंद असणे, खाल्ल्यावर जडपणा' } },
      ],
    },
  ],

  other: [
    {
      id: 'oth_description',
      complaintId: 'other',
      category: 'hpi',
      type: 'voice_prompt',
      questionText: {
        en: 'Please speak or describe your primary symptom or reason for OPD visit:',
        hi: 'कृपया बोलकर या लिखकर अपनी तकलीफ का विवरण दें:',
        mr: 'कृपया बोलून किंवा लिहून तुमच्या त्रासाचे वर्णन करा:',
      },
    },
  ],
};

/**
 * Clinical Red-Flag Evaluation Engine
 */
export function evaluateRedFlags(
  complaintId: ChiefComplaintId,
  selectedOptionIds: string[],
  scaleValues: Record<string, number>,
  patientId: string,
  tokenNumber: string
): RedFlagAlert | null {
  const redFlagSymptoms: string[] = [];

  // Chest Pain Red-Flags
  if (complaintId === 'chest_pain') {
    if (selectedOptionIds.includes('cp_onset_minutes')) redFlagSymptoms.push('Acute Sudden Chest Pain onset (< 1hr)');
    if (selectedOptionIds.includes('cp_rad_left_arm')) redFlagSymptoms.push('Radiation to Left Arm / Shoulder');
    if (selectedOptionIds.includes('cp_rad_jaw_neck')) redFlagSymptoms.push('Radiation to Jaw / Neck');
    if (selectedOptionIds.includes('cp_sweating')) redFlagSymptoms.push('Diaphoresis / Cold Sweating');
    if (selectedOptionIds.includes('cp_breathlessness')) redFlagSymptoms.push('Acute Breathlessness & Dyspnea');
    if (selectedOptionIds.includes('cp_dizziness')) redFlagSymptoms.push('Presyncope / Dizziness');
    if (scaleValues['cp_severity'] && scaleValues['cp_severity'] >= 8) redFlagSymptoms.push('High Severity Score (>= 8/10)');
  }

  // Fever Red-Flags
  if (complaintId === 'fever') {
    if (selectedOptionIds.includes('fv_stiff_neck')) redFlagSymptoms.push('Meningeal Sign: Stiff neck & confusion');
    if (selectedOptionIds.includes('fv_bleeding')) redFlagSymptoms.push('Hemorrhagic Sign: Gum bleeding / Petechiae');
    if (selectedOptionIds.includes('fv_severe_breathless')) redFlagSymptoms.push('Severe Respiratory Distress with Fever');
  }

  // Breathing Red-Flags
  if (complaintId === 'breathing_problem') {
    if (selectedOptionIds.includes('br_sudden')) redFlagSymptoms.push('Acute Sudden Breathlessness');
    if (selectedOptionIds.includes('br_at_rest')) redFlagSymptoms.push('Dyspnea at Rest');
    if (selectedOptionIds.includes('br_orthopnea')) redFlagSymptoms.push('Severe Orthopnea');
    if (selectedOptionIds.includes('br_blue_lips')) redFlagSymptoms.push('Cyanosis (Bluish discoloration)');
  }

  // Headache Red-Flags
  if (complaintId === 'headache') {
    if (selectedOptionIds.includes('ha_thunderclap')) redFlagSymptoms.push('Thunderclap Sudden Severe Headache');
    if (selectedOptionIds.includes('ha_weakness')) redFlagSymptoms.push('Focal Neurological Deficit (Unilateral Weakness)');
    if (selectedOptionIds.includes('ha_speech')) redFlagSymptoms.push('Acute Dysphasia / Slurred Speech');
    if (selectedOptionIds.includes('ha_vision')) redFlagSymptoms.push('Sudden Vision Loss / Diplopia');
  }

  // Cough Red-Flags
  if (complaintId === 'cough') {
    if (selectedOptionIds.includes('cg_blood')) redFlagSymptoms.push('Hemoptysis (Blood in sputum)');
  }

  // Stomach Red-Flags
  if (complaintId === 'stomach_problem') {
    if (selectedOptionIds.includes('st_vomit_blood')) redFlagSymptoms.push('Hematemesis (Vomiting blood)');
    if (selectedOptionIds.includes('st_black_stool')) redFlagSymptoms.push('Melena (Black tarry stools)');
  }

  if (redFlagSymptoms.length > 0) {
    const isUrgent =
      redFlagSymptoms.some(
        (s) =>
          s.includes('Cold Sweating') ||
          s.includes('Left Arm') ||
          s.includes('Focal Neurological') ||
          s.includes('Slurred Speech') ||
          s.includes('Thunderclap') ||
          s.includes('Hematemesis') ||
          s.includes('Cyanosis') ||
          s.includes('Stiff neck')
      );

    const msgText = `Rule-based triage detected ${redFlagSymptoms.length} clinical red-flag indicator(s): ${redFlagSymptoms.join(', ')}.`;
    return {
      id: `RF-${Date.now()}`,
      patientId,
      tokenNumber,
      symptoms: redFlagSymptoms,
      description: msgText,
      message: {
        en: msgText,
        hi: `ट्राइएज अलर्ट: ${redFlagSymptoms.length} गंभीर लक्षण पाए गए: ${redFlagSymptoms.join(', ')}।`,
        mr: `ट्रायज इशारा: ${redFlagSymptoms.length} गंभीर लक्षणे आढळली: ${redFlagSymptoms.join(', ')}.`,
      },
      suggestedAction: {
        en: 'Immediate emergency physician assessment & priority triage routing required.',
        hi: 'तत्काल आपातकालीन चिकित्सक मूल्यांकन एवं प्राथमिकता ट्राइएज आवश्यक।',
        mr: 'त्वरित आपत्कालीन डॉक्टर मूल्यांकन आणि प्राधान्य ट्रायज आवश्यक.',
      },
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      priority: isUrgent ? 'URGENT' : 'HIGH',
      department: CHIEF_COMPLAINT_CATEGORIES.find((c) => c.id === complaintId)?.department || 'Emergency / OPD',
      isAcknowledged: false,
    };
  }

  return null;
}

export function generateClinicalSummaryFromAnswers(
  patient: any,
  answers: any[],
  docs: any[],
  intakeMode: any = 'modern',
  ayushData?: any,
  complaintId?: any
): any {
  const chiefAnswers = answers.filter((a) => a.questionId.includes('complaint') || a.selectedOptionLabels?.length);
  const complaintText =
    chiefAnswers.flatMap((a) => a.selectedOptionLabels || []).join('; ') || 'Clinical consultation check-in';

  // Extract medicines from OCR docs
  const ocrMeds = docs.flatMap((d) =>
    (d.extractedEntities || [])
      .filter((e: any) => e.type === 'medication')
      .map((e: any) => ({
        name: e.name,
        dose: e.dose || 'Standard',
        frequency: e.frequency || 'Daily',
        source: 'ocr_extracted' as const,
      }))
  );

  return {
    id: `SUM-${Date.now()}`,
    patientId: patient.id,
    visitId: `VISIT-${Date.now()}`,
    tokenNumber: `A-${((Date.now() % 900) + 100).toString()}`,
    timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    isDraft: true,
    status: 'DRAFT_PENDING_REVIEW',
    intakeMode: intakeMode || 'modern',
    patientInfo: {
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      abhaId: patient.abhaId,
      phone: patient.phone,
      department: CHIEF_COMPLAINT_CATEGORIES.find((c) => c.id === complaintId)?.department || 'General Medicine',
    },
    chiefComplaint: complaintText,
    historyOfPresentIllness: `Patient reports ${complaintText}. Intake gathered via touch/voice MediKiosk workflow with verified patient consent.`,
    pastMedicalHistory: patient.age > 50 ? ['Known hypertension under evaluation'] : ['No chronic history stated'],
    pastSurgicalHistory: ['Nil major surgeries reported'],
    currentMedications: ocrMeds.length > 0 ? ocrMeds : [{ name: 'None reported prior', dose: '-', frequency: '-', source: 'patient_reported' }],
    drugAllergies: ['No known drug allergies reported (NKDA)'],
    familyHistory: ['Non-contributory'],
    personalHistory: {
      diet: 'Normal Indian diet',
      smoking: 'Non-smoker',
      alcohol: 'Non-drinker',
      sleep: '7-8 hours / night',
      bowelBladder: 'Regular and normal',
    },
    reviewOfSystems: [
      { system: 'Cardiovascular', positiveFindings: complaintId === 'chest_pain' ? ['Chest discomfort'] : [], negativeFindings: ['Syncope'] },
      { system: 'Respiratory', positiveFindings: complaintId === 'cough' || complaintId === 'breathing_problem' ? ['Cough / Breathlessness'] : [], negativeFindings: ['Hemoptysis'] },
    ],
    previousInvestigations: [],
    documentSummary: docs.length > 0 ? `${docs.length} previous medical document(s) uploaded & OCR processed.` : 'No physical documents provided today.',
    redFlags: [],
    importantNotes: 'Draft clinical intake summary generated automatically from MediKiosk session. Requires physician review and sign-off.',
    ayushData: ayushData,
  };
}

