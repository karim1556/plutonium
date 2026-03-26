/**
 * Internationalization (i18n) Support
 * Languages: English, Hindi, Marathi, Tamil, Telugu
 */

export type Locale = "en" | "hi" | "mr" | "ta" | "te";

export interface Translation {
  [key: string]: string | Translation;
}

// ============================================================================
// English Translations
// ============================================================================

const en: Translation = {
  common: {
    medassist: "MedAssist Pro",
    loading: "Loading...",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    submit: "Submit",
    back: "Back",
    next: "Next",
    yes: "Yes",
    no: "No",
    ok: "OK",
    error: "Error",
    success: "Success"
  },
  auth: {
    login: "Login",
    logout: "Logout",
    signup: "Sign Up",
    email: "Email",
    password: "Password",
    forgotPassword: "Forgot Password?",
    patient: "Patient",
    caregiver: "Caregiver"
  },
  dashboard: {
    title: "Dashboard",
    nextDose: "Next Dose",
    todaySchedule: "Today's Schedule",
    adherence: "Adherence",
    missedDoses: "Missed Doses",
    deviceStatus: "Device Status"
  },
  medications: {
    title: "Medications",
    add: "Add Medication",
    name: "Medicine Name",
    dosage: "Dosage",
    frequency: "Frequency",
    timing: "Timing",
    beforeFood: "Before Food",
    afterFood: "After Food",
    withFood: "With Food",
    anytime: "Anytime",
    morning: "Morning",
    afternoon: "Afternoon",
    evening: "Evening",
    night: "Night",
    refill: "Refill Required",
    remaining: "Remaining Pills"
  },
  schedule: {
    title: "Schedule",
    generate: "Generate Schedule",
    today: "Today",
    upcoming: "Upcoming",
    slot: "Slot",
    time: "Time",
    status: "Status",
    pending: "Pending",
    taken: "Taken",
    missed: "Missed",
    delayed: "Delayed"
  },
  notifications: {
    title: "Notifications",
    missedDose: "Missed Dose",
    upcomingDose: "Upcoming Dose",
    refillWarning: "Refill Warning",
    deviceOffline: "Device Offline",
    takeNow: "Please take your medication now",
    refillSoon: "Refill required soon"
  },
  device: {
    title: "Device",
    status: "Status",
    online: "Online",
    offline: "Offline",
    dispensing: "Dispensing",
    registerDevice: "Register Device",
    slots: "Slots",
    calibrate: "Calibrate",
    dispense: "Dispense"
  },
  chat: {
    title: "AI Assistant",
    askQuestion: "Ask a question...",
    send: "Send",
    canITakeNow: "Can I take my medicine now?",
    whatIfMissed: "What if I missed a dose?",
    refillStatus: "When do I need to refill?"
  }
};

// ============================================================================
// Hindi Translations (हिंदी)
// ============================================================================

const hi: Translation = {
  common: {
    medassist: "मेडअसिस्ट प्रो",
    loading: "लोड हो रहा है...",
    save: "सहेजें",
    cancel: "रद्द करें",
    delete: "हटाएं",
    edit: "संपादित करें",
    submit: "जमा करें",
    back: "वापस",
    next: "अगला",
    yes: "हां",
    no: "नहीं",
    ok: "ठीक है",
    error: "त्रुटि",
    success: "सफलता"
  },
  auth: {
    login: "लॉगिन",
    logout: "लॉगआउट",
    signup: "साइन अप",
    email: "ईमेल",
    password: "पासवर्ड",
    forgotPassword: "पासवर्ड भूल गए?",
    patient: "रोगी",
    caregiver: "देखभालकर्ता"
  },
  dashboard: {
    title: "डैशबोर्ड",
    nextDose: "अगली खुराक",
    todaySchedule: "आज का कार्यक्रम",
    adherence: "पालन",
    missedDoses: "छूटी हुई खुराक",
    deviceStatus: "डिवाइस स्थिति"
  },
  medications: {
    title: "दवाइयाँ",
    add: "दवा जोड़ें",
    name: "दवा का नाम",
    dosage: "खुराक",
    frequency: "आवृत्ति",
    timing: "समय",
    beforeFood: "खाने से पहले",
    afterFood: "खाने के बाद",
    withFood: "खाने के साथ",
    anytime: "कभी भी",
    morning: "सुबह",
    afternoon: "दोपहर",
    evening: "शाम",
    night: "रात",
    refill: "पुनर्भरण आवश्यक",
    remaining: "बाकी गोलियां"
  },
  schedule: {
    title: "कार्यक्रम",
    generate: "कार्यक्रम बनाएं",
    today: "आज",
    upcoming: "आगामी",
    slot: "स्लॉट",
    time: "समय",
    status: "स्थिति",
    pending: "लंबित",
    taken: "लिया गया",
    missed: "छूट गया",
    delayed: "देरी से"
  },
  notifications: {
    title: "सूचनाएं",
    missedDose: "छूटी हुई खुराक",
    upcomingDose: "आगामी खुराक",
    refillWarning: "पुनर्भरण चेतावनी",
    deviceOffline: "डिवाइस ऑफ़लाइन",
    takeNow: "कृपया अपनी दवा अभी लें",
    refillSoon: "जल्द ही पुनर्भरण की आवश्यकता"
  },
  device: {
    title: "डिवाइस",
    status: "स्थिति",
    online: "ऑनलाइन",
    offline: "ऑफ़लाइन",
    dispensing: "वितरण",
    registerDevice: "डिवाइस पंजीकृत करें",
    slots: "स्लॉट",
    calibrate: "कैलिब्रेट करें",
    dispense: "वितरण"
  },
  chat: {
    title: "AI सहायक",
    askQuestion: "एक सवाल पूछें...",
    send: "भेजें",
    canITakeNow: "क्या मैं अपनी दवा अभी ले सकता हूं?",
    whatIfMissed: "यदि मैं खुराक चूक गया तो क्या करूं?",
    refillStatus: "मुझे कब पुनर्भरण की आवश्यकता है?"
  }
};

// ============================================================================
// Marathi Translations (मराठी)
// ============================================================================

const mr: Translation = {
  common: {
    medassist: "मेडअसिस्ट प्रो",
    loading: "लोड होत आहे...",
    save: "जतन करा",
    cancel: "रद्द करा",
    delete: "हटवा",
    edit: "संपादन करा",
    submit: "सबमिट करा",
    back: "मागे",
    next: "पुढे",
    yes: "होय",
    no: "नाही",
    ok: "ठीक आहे",
    error: "त्रुटी",
    success: "यश"
  },
  auth: {
    login: "लॉगिन",
    logout: "लॉगआउट",
    signup: "साइन अप",
    email: "ईमेल",
    password: "पासवर्ड",
    forgotPassword: "पासवर्ड विसरलात?",
    patient: "रुग्ण",
    caregiver: "काळजीवाहक"
  },
  dashboard: {
    title: "डॅशबोर्ड",
    nextDose: "पुढील डोस",
    todaySchedule: "आजचे वेळापत्रक",
    adherence: "पालन",
    missedDoses: "चुकलेले डोस",
    deviceStatus: "उपकरण स्थिती"
  },
  medications: {
    title: "औषधे",
    add: "औषध जोडा",
    name: "औषधाचे नाव",
    dosage: "डोस",
    frequency: "वारंवारता",
    timing: "वेळ",
    beforeFood: "जेवणापूर्वी",
    afterFood: "जेवणानंतर",
    withFood: "जेवणासोबत",
    anytime: "कधीही",
    morning: "सकाळ",
    afternoon: "दुपार",
    evening: "संध्याकाळ",
    night: "रात्र",
    refill: "पुनर्भरण आवश्यक",
    remaining: "उर्वरित गोळ्या"
  },
  schedule: {
    title: "वेळापत्रक",
    generate: "वेळापत्रक तयार करा",
    today: "आज",
    upcoming: "आगामी",
    slot: "स्लॉट",
    time: "वेळ",
    status: "स्थिती",
    pending: "प्रलंबित",
    taken: "घेतले",
    missed: "चुकले",
    delayed: "विलंब"
  },
  notifications: {
    title: "सूचना",
    missedDose: "चुकलेला डोस",
    upcomingDose: "आगामी डोस",
    refillWarning: "पुनर्भरण चेतावणी",
    deviceOffline: "उपकरण ऑफलाइन",
    takeNow: "कृपया आपले औषध आता घ्या",
    refillSoon: "लवकरच पुनर्भरण आवश्यक"
  },
  device: {
    title: "उपकरण",
    status: "स्थिती",
    online: "ऑनलाइन",
    offline: "ऑफलाइन",
    dispensing: "वितरण",
    registerDevice: "उपकरण नोंदणी करा",
    slots: "स्लॉट्स",
    calibrate: "कॅलिब्रेट करा",
    dispense: "वितरण"
  },
  chat: {
    title: "AI सहाय्यक",
    askQuestion: "प्रश्न विचारा...",
    send: "पाठवा",
    canITakeNow: "मी माझे औषध आता घेऊ शकतो का?",
    whatIfMissed: "जर मी डोस चुकलो तर?",
    refillStatus: "मला पुनर्भरण कधी आवश्यक आहे?"
  }
};

// ============================================================================
// Tamil Translations (தமிழ்)
// ============================================================================

const ta: Translation = {
  common: {
    medassist: "மெட்அசிஸ்ட் ப்ரோ",
    loading: "ஏற்றுகிறது...",
    save: "சேமி",
    cancel: "ரத்து செய்",
    delete: "நீக்கு",
    edit: "திருத்து",
    submit: "சமர்ப்பி",
    back: "பின்",
    next: "அடுத்தது",
    yes: "ஆம்",
    no: "இல்லை",
    ok: "சரி",
    error: "பிழை",
    success: "வெற்றி"
  },
  auth: {
    login: "உள்நுழை",
    logout: "வெளியேறு",
    signup: "பதிவு செய்",
    email: "மின்னஞ்சல்",
    password: "கடவுச்சொல்",
    forgotPassword: "கடவுச்சொல் மறந்துவிட்டதா?",
    patient: "நோயாளி",
    caregiver: "பராமரிப்பாளர்"
  },
  dashboard: {
    title: "டாஷ்போர்டு",
    nextDose: "அடுத்த டோஸ்",
    todaySchedule: "இன்றைய அட்டவணை",
    adherence: "கடைபிடிப்பு",
    missedDoses: "தவறிய டோஸ்கள்",
    deviceStatus: "சாதன நிலை"
  },
  medications: {
    title: "மருந்துகள்",
    add: "மருந்து சேர்",
    name: "மருந்து பெயர்",
    dosage: "டோஸ்",
    frequency: "அதிர்வெண்",
    timing: "நேரம்",
    beforeFood: "உணவுக்கு முன்",
    afterFood: "உணவுக்கு பின்",
    withFood: "உணவுடன்",
    anytime: "எப்போது வேண்டுமானாலும்",
    morning: "காலை",
    afternoon: "மதியம்",
    evening: "மாலை",
    night: "இரவு",
    refill: "மறுநிரப்பல் தேவை",
    remaining: "மீதமுள்ள மாத்திரைகள்"
  },
  schedule: {
    title: "அட்டவணை",
    generate: "அட்டவணை உருவாக்கு",
    today: "இன்று",
    upcoming: "வரவிருக்கும்",
    slot: "ஸ்லாட்",
    time: "நேரம்",
    status: "நிலை",
    pending: "நிலுவையில்",
    taken: "எடுத்தது",
    missed: "தவறிய",
    delayed: "தாமதம்"
  },
  notifications: {
    title: "அறிவிப்புகள்",
    missedDose: "தவறிய டோஸ்",
    upcomingDose: "வரவிருக்கும் டோஸ்",
    refillWarning: "மறுநிரப்பல் எச்சரிக்கை",
    deviceOffline: "சாதனம் ஆஃப்லைன்",
    takeNow: "தயவுசெய்து உங்கள் மருந்தை இப்போது எடுத்துக்கொள்ளுங்கள்",
    refillSoon: "விரைவில் மறுநிரப்பல் தேவை"
  },
  device: {
    title: "சாதனம்",
    status: "நிலை",
    online: "ஆன்லைன்",
    offline: "ஆஃப்லைன்",
    dispensing: "விநியோகம்",
    registerDevice: "சாதனத்தை பதிவு செய்",
    slots: "ஸ்லாட்கள்",
    calibrate: "அளவீடு",
    dispense: "விநியோகம்"
  },
  chat: {
    title: "AI உதவியாளர்",
    askQuestion: "ஒரு கேள்வி கேளுங்கள்...",
    send: "அனுப்பு",
    canITakeNow: "நான் இப்போது என் மருந்தை எடுக்கலாமா?",
    whatIfMissed: "நான் டோஸ் தவறவிட்டால் என்ன?",
    refillStatus: "எனக்கு எப்போது மறுநிரப்பல் தேவை?"
  }
};

// ============================================================================
// Telugu Translations (తెలుగు)
// ============================================================================

const te: Translation = {
  common: {
    medassist: "మెడ్అసిస్ట్ ప్రో",
    loading: "లోడ్ అవుతోంది...",
    save: "సేవ్ చేయి",
    cancel: "రద్దు చేయి",
    delete: "తొలగించు",
    edit: "సవరించు",
    submit: "సమర్పించు",
    back: "వెనుకకు",
    next: "తదుపరి",
    yes: "అవును",
    no: "కాదు",
    ok: "సరే",
    error: "లోపం",
    success: "విజయం"
  },
  auth: {
    login: "లాగిన్",
    logout: "లాగౌట్",
    signup: "సైన్ అప్",
    email: "ఇమెయిల్",
    password: "పాస్‌వర్డ్",
    forgotPassword: "పాస్‌వర్డ్ మర్చిపోయారా?",
    patient: "రోగి",
    caregiver: "సంరక్షకుడు"
  },
  dashboard: {
    title: "డాష్‌బోర్డ్",
    nextDose: "తదుపరి డోస్",
    todaySchedule: "నేటి షెడ్యూల్",
    adherence: "కట్టుబాటు",
    missedDoses: "తప్పిన డోస్‌లు",
    deviceStatus: "పరికర స్థితి"
  },
  medications: {
    title: "మందులు",
    add: "మందు జోడించు",
    name: "మందు పేరు",
    dosage: "డోస్",
    frequency: "ఫ్రీక్వెన్సీ",
    timing: "సమయం",
    beforeFood: "ఆహారానికి ముందు",
    afterFood: "ఆహారం తర్వాత",
    withFood: "ఆహారంతో",
    anytime: "ఎప్పుడైనా",
    morning: "ఉదయం",
    afternoon: "మధ్యాహ్నం",
    evening: "సాయంత్రం",
    night: "రాత్రి",
    refill: "రీఫిల్ అవసరం",
    remaining: "మిగిలిన మాత్రలు"
  },
  schedule: {
    title: "షెడ్యూల్",
    generate: "షెడ్యూల్ రూపొందించు",
    today: "నేడు",
    upcoming: "రాబోయే",
    slot: "స్లాట్",
    time: "సమయం",
    status: "స్థితి",
    pending: "పెండింగ్",
    taken: "తీసుకున్నారు",
    missed: "తప్పిపోయారు",
    delayed: "ఆలస్యం"
  },
  notifications: {
    title: "నోటిఫికేషన్‌లు",
    missedDose: "తప్పిన డోస్",
    upcomingDose: "రాబోయే డోస్",
    refillWarning: "రీఫిల్ హెచ్చరిక",
    deviceOffline: "పరికరం ఆఫ్‌లైన్",
    takeNow: "దయచేసి మీ మందును ఇప్పుడు తీసుకోండి",
    refillSoon: "త్వరలో రీఫిల్ అవసరం"
  },
  device: {
    title: "పరికరం",
    status: "స్థితి",
    online: "ఆన్‌లైన్",
    offline: "ఆఫ్‌లైన్",
    dispensing: "పంపిణీ",
    registerDevice: "పరికరాన్ని నమోదు చేయండి",
    slots: "స్లాట్‌లు",
    calibrate: "క్యాలిబ్రేట్",
    dispense: "పంపిణీ"
  },
  chat: {
    title: "AI అసిస్టెంట్",
    askQuestion: "ప్రశ్న అడగండి...",
    send: "పంపించు",
    canITakeNow: "నేను ఇప్పుడు నా మందు తీసుకోవచ్చా?",
    whatIfMissed: "నేను డోస్ తప్పిస్తే ఏమి చేయాలి?",
    refillStatus: "నాకు ఎప్పుడు రీఫిల్ అవసరం?"
  }
};

// ============================================================================
// Translation Store
// ============================================================================

const translations: Record<Locale, Translation> = {
  en,
  hi,
  mr,
  ta,
  te
};

// ============================================================================
// Translation Functions
// ============================================================================

export function getTranslation(locale: Locale, key: string): string {
  const keys = key.split(".");
  let value: any = translations[locale] || translations.en;

  for (const k of keys) {
    if (value && typeof value === "object" && k in value) {
      value = value[k];
    } else {
      // Fallback to English
      value = translations.en;
      for (const fallbackKey of keys) {
        if (value && typeof value === "object" && fallbackKey in value) {
          value = value[fallbackKey];
        } else {
          return key; // Return key if not found
        }
      }
      break;
    }
  }

  return typeof value === "string" ? value : key;
}

export function t(locale: Locale, key: string): string {
  return getTranslation(locale, key);
}

// Get all translations for a locale
export function getLocaleTranslations(locale: Locale): Translation {
  return translations[locale] || translations.en;
}

// Get supported locales
export function getSupportedLocales(): Locale[] {
  return ["en", "hi", "mr", "ta", "te"];
}

// Get locale display names
export function getLocaleDisplayName(locale: Locale): string {
  const names: Record<Locale, string> = {
    en: "English",
    hi: "हिंदी (Hindi)",
    mr: "मराठी (Marathi)",
    ta: "தமிழ் (Tamil)",
    te: "తెలుగు (Telugu)"
  };

  return names[locale] || names.en;
}

// Format date for locale
export function formatDateForLocale(date: Date, locale: Locale): string {
  return date.toLocaleDateString(locale === "en" ? "en-US" : `${locale}-IN`);
}

// Format time for locale
export function formatTimeForLocale(time: string, locale: Locale): string {
  // Time format is generally consistent, but can be customized
  return time;
}
