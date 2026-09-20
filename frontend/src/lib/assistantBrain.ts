// Voice assistant brain. Matches a farmer's free-text question (any phrasing)
// against live app data and composes an answer in the selected language.
// All answers are spoken with the same text that is displayed.

import type {
  Crop,
  LibraryEntry,
  RiskAlert,
  WeatherResponse,
} from '../types';
import type { ForecastResponse } from '../pages/SprayAdvisory';

export type Lang = 'en' | 'hi' | 'kn' | 'mr';

export interface AssistantContext {
  lang: Lang;
  userName: string;
  crops: Crop[];
  alerts: RiskAlert[];
  weather: WeatherResponse | null;
  forecast: ForecastResponse | null;
  library: LibraryEntry[];
}

export interface AssistantAnswer {
  text: string;
  link?: string; // in-app route for a "view" action
}

type Dict = Record<string, string[]>;

// ---------- keyword dictionaries (any-of matching, lowercase) ----------

const KEYWORDS: Record<string, Dict> = {
  greeting: {
    en: ['hello', 'hi', 'hey', 'namaste', 'good morning', 'good evening'],
    hi: ['नमस्ते', 'नमस्कार', 'हेलो', 'हाय'],
    kn: ['ನಮಸ್ಕಾರ', 'ಹಲೋ', 'ನಮಸ್ತೆ'],
    mr: ['नमस्कार', 'हॅलो', 'नमस्ते'],
  },
  weather: {
    en: ['weather', 'temperature', 'rain', 'raining', 'humidity', 'hot', 'cold', 'forecast', 'climate'],
    hi: ['मौसम', 'तापमान', 'बारिश', 'गर्मी', 'ठंड', 'आर्द्रता'],
    kn: ['ಹವಾಮಾನ', 'ತಾಪಮಾನ', 'ಮಳೆ', 'ಶಾಖ', 'ತಂಪು'],
    mr: ['हवामान', 'तापमान', 'पाऊस', 'उष्णता', 'थंडी'],
  },
  spray: {
    en: ['spray', 'spraying', 'medicine', 'pesticide', 'insecticide', 'when to spray', 'window'],
    hi: ['छिड़काव', 'दवा', 'कीटनाशक', 'फव्वार'],
    kn: ['ಸಿಂಪರಣೆ', 'ಔಷಧ', 'ಕೀಟನಾಶಕ'],
    mr: ['फवारणी', 'औषध', 'कीटकनाशक'],
  },
  disease: {
    en: ['disease', 'diseases', 'blight', 'fungus', 'infection', 'spots', 'sick', 'pest', 'pests', 'insect', 'aphid', 'borer', 'library'],
    hi: ['रोग', 'बीमारी', 'फफूंद', 'संक्रमण', 'धब्बे', 'कीट', 'इलाज'],
    kn: ['ರೋಗ', 'ಕಾಯಿಲೆ', 'ಶಿಲೀಂಧ್ರ', 'ಕೀಟ', 'ಚಿಕಿತ್ಸೆ'],
    mr: ['रोग', 'आजार', 'बुरशी', 'किडे', 'उपचार'],
  },
  crops: {
    en: ['crop', 'crops', 'my crop', 'field', 'fields', 'tomato', 'rice', 'chilli', 'cotton', 'paddy', 'acres'],
    hi: ['फसल', 'खेत', 'टमाटर', 'चावल', 'मिर्च', 'कपास'],
    kn: ['ಬೆಳೆ', 'ಹೊಲ', 'ಟೊಮ್ಯಾಟೊ', 'ಭತ್ತ', 'ಮೆಣಸು'],
    mr: ['पीक', 'शेत', 'टोमॅटो', 'भात', 'मिरची'],
  },
  alerts: {
    en: ['alert', 'alerts', 'warning', 'risk', 'danger'],
    hi: ['चेतावनी', 'जोखिम', 'खतरा', 'अलर्ट'],
    kn: ['ಎಚ್ಚರಿಕೆ', 'ಅಪಾಯ', 'ಎಚ್ಚರ'],
    mr: ['सूचना', 'जोखीम', 'धोका', 'इशारा'],
  },
  health: {
    en: ['health', 'healthy', 'score', 'condition', 'how is my', 'how are my', 'status'],
    hi: ['स्वास्थ्य', 'सेहत', 'स्कोर', 'हालत', 'कैसी है'],
    kn: ['ಆರೋಗ್ಯ', 'ಸ್ಥಿತಿ', 'ಹೇಗಿದೆ'],
    mr: ['आरोग्य', 'स्थिती', 'कशी आहे'],
  },
  help: {
    en: ['help', 'how to', 'what can you', 'guide', 'use this app', 'scan'],
    hi: ['मदद', 'कैसे', 'क्या कर सकते', 'स्कैन'],
    kn: ['ಸಹಾಯ', 'ಹೇಗೆ', 'ಸ್ಕ್ಯಾನ್'],
    mr: ['मदत', 'कसे', 'स्कॅन'],
  },
};

function normalize(s: string): string {
  return s.toLowerCase().trim();
}

function matchesUtterance(utterance: string, topic: string, lang: Lang): boolean {
  const words = KEYWORDS[topic]?.[lang] ?? KEYWORDS[topic]?.en ?? [];
  return words.some((w) => utterance.includes(w));
}

function detectLang(utterance: string): Lang | null {
  // Devanagari => hi or mr; Kannada script => kn. Latin => null (keep current).
  if (/[\u0A00-\u0A7F]/.test(utterance)) return 'mr';
  if (/[\u0900-\u097F]/.test(utterance)) {
    // rough marathi markers
    return /आहे|मला|काय|तुमचा|शेत/.test(utterance) ? 'mr' : 'hi';
  }
  if (/[\u0C80-\u0CFF]/.test(utterance)) return 'kn';
  return null;
}

// ---------- answer builders ----------

const T = {
  greeting: {
    en: (n: string) => `Hello ${n}. Ask me about the weather, your crops, disease risks, or when to spray.`,
    hi: (n: string) => `नमस्ते ${n}. मौसम, फसल, रोग जोखिम या छिड़काव के बारे में पूछें।`,
    kn: (n: string) => `ನಮಸ್ಕಾರ ${n}. ಹವಾಮಾನ, ಬೆಳೆ, ರೋಗ ಅಪಾಯ ಅಥವಾ ಸಿಂಪರಣೆಯ ಬಗ್ಗೆ ಕೇಳಿ.`,
    mr: (n: string) => `नमस्कार ${n}. हवामान, पीक, रोग जोखीम किंवा फवारणीबद्दल विचारा.`,
  },
  weather: {
    en: (w: WeatherResponse) => {
      const c = w.weather.current;
      const rain = c.rainfallMm > 0 ? `, with about ${Math.round(c.rainfallMm)} millimetres of rain` : ', no rain right now';
      return `Today ${c.temperature} degrees with ${c.humidity} percent humidity${rain}. Disease risk from weather is ${w.risk.level.toLowerCase()}.`;
    },
    hi: (w: WeatherResponse) => {
      const c = w.weather.current;
      const rain = c.rainfallMm > 0 ? `, लगभग ${Math.round(c.rainfallMm)} मिमी बारिश` : ', अभी बारिश नहीं';
      return `आज ${c.temperature} डिग्री और ${c.humidity} प्रतिशत नमी${rain}. मौसम से रोग जोखिम ${w.risk.level === 'HIGH' ? 'अधिक' : w.risk.level === 'MEDIUM' ? 'मध्यम' : 'कम'} है।`;
    },
    kn: (w: WeatherResponse) => {
      const c = w.weather.current;
      const rain = c.rainfallMm > 0 ? `, ಸುಮಾರು ${Math.round(c.rainfallMm)} ಮಿಮೀ ಮಳೆ` : ', ಈಗ ಮಳೆಯಿಲ್ಲ';
      return `ಇಂದು ${c.temperature} ಡಿಗ್ರಿ ಮತ್ತು ${c.humidity} ಶತಕೋಟಿ ಆರ್ದ್ರತೆ${rain}. ಹವಾಮಾನದಿಂದ ರೋಗ ಅಪಾಯ ${w.risk.level === 'HIGH' ? 'ಹೆಚ್ಚು' : w.risk.level === 'MEDIUM' ? 'ಮಧ್ಯಮ' : 'ಕಡಿಮೆ'}.`;
    },
    mr: (w: WeatherResponse) => {
      const c = w.weather.current;
      const rain = c.rainfallMm > 0 ? `, जवळपास ${Math.round(c.rainfallMm)} मिमी पाऊस` : ', सध्या पाऊस नाही';
      return `आज ${c.temperature} अंश आणि ${c.humidity} टक्के ओलावा${rain}. हवामानामुळे रोग जोखीम ${w.risk.level === 'HIGH' ? 'जास्त' : w.risk.level === 'MEDIUM' ? 'मध्यम' : 'कमी'} आहे.`;
    },
  },
  spray: {
    en: (f: ForecastResponse | null) =>
      f?.sprayWindows?.[0]
        ? `Spray window: ${f.sprayWindows[0].day}, 6 to 9 in the morning. ${f.sprayWindows[0].note}`
        : 'No suitable spray window in the next three days. Check again tomorrow.',
    hi: (f: ForecastResponse | null) =>
      f?.sprayWindows?.[0]
        ? `छिड़काव का समय: ${f.sprayWindows[0].day === 'Tuesday' ? 'मंगलवार' : f.sprayWindows[0].day === 'Monday' ? 'सोमवार' : f.sprayWindows[0].day === 'Wednesday' ? 'बुधवार' : f.sprayWindows[0].day === 'Thursday' ? 'गुरुवार' : f.sprayWindows[0].day === 'Friday' ? 'शुक्रवार' : f.sprayWindows[0].day === 'Saturday' ? 'शनिवार' : 'रविवार'}, सुबह 6 से 9 बजे। छिड़काव से पहले खेत में जांच लें।`
        : 'अगले तीन दिनों में उपयुक्त समय नहीं। कल फिर पूछें।',
    kn: (f: ForecastResponse | null) =>
      f?.sprayWindows?.[0]
        ? `ಸಿಂಪರಣೆ ಸಮಯ: ${f.sprayWindows[0].day}, ಬೆಳಿಗ್ಗೆ 6 ರಿಂದ 9. ಸಿಂಪರಣೆ ಮಾಡುವ ಮೊದಲು ಹೊಲದಲ್ಲಿ ಖಚಿತಪಡಿಸಿ.`
        : 'ಮುಂದಿನ ಮೂರು ದಿನಗಳಲ್ಲಿ ಸೂಕ್ತ ಸಮಯವಿಲ್ಲ. ನಾಳೆ ಮತ್ತೆ ಕೇಳಿ.',
    mr: (f: ForecastResponse | null) =>
      f?.sprayWindows?.[0]
        ? `फवारणीची वेळ: ${f.sprayWindows[0].day}, सकाळी 6 ते 9. फवारणी करण्यापूर्वी शेतात खात्री करा.`
        : 'पुढील तीन दिवसांत योग्य वेळ नाही. उद्या पुन्हा विचारा.',
  },
  crops: {
    en: (crops: Crop[]) =>
      crops.length === 0
        ? 'You have not added any crops yet. Open My Crops and add your first crop.'
        : `You have ${crops.length} crop${crops.length > 1 ? 's' : ''}: ${crops.map((c) => `${c.name}, ${c.areaValue} ${c.areaUnit}`).join('; ')}.`,
    hi: (crops: Crop[]) =>
      crops.length === 0
        ? 'अभी कोई फसल नहीं जोड़ी गई है। मेरी फसल खोलकर पहली फसल जोड़ें।'
        : `आपके पास ${crops.length} फसलें हैं: ${crops.map((c) => `${c.name}, ${c.areaValue} ${c.areaUnit}`).join('; ')}।`,
    kn: (crops: Crop[]) =>
      crops.length === 0
        ? 'ಇನ್ನೂ ಯಾವುದೇ ಬೆಳೆ ಸೇರಿಸಲಾಗಿಲ್ಲ. ನನ್ನ ಬೆಳೆ ತೆರೆದು ಮೊದಲ ಬೆಳೆ ಸೇರಿಸಿ.'
        : `ನಿಮಗೆ ${crops.length} ಬೆಳೆಗಳಿವೆ: ${crops.map((c) => `${c.name}, ${c.areaValue} ${c.areaUnit}`).join('; ')}.`,
    mr: (crops: Crop[]) =>
      crops.length === 0
        ? 'अजून कोणतेही पीक जोडलेले नाही. माझे पीक उघडून पहिले पीक जोडा.'
        : `तुमच्याकडे ${crops.length} पिके आहेत: ${crops.map((c) => `${c.name}, ${c.areaValue} ${c.areaUnit}`).join('; ')}.`,
  },
  health: {
    en: (crops: Crop[]) =>
      crops.length === 0
        ? 'Add a crop first, then I can tell you its health.'
        : crops.map((c) => `${c.name} is ${c.healthScore} out of 100, risk ${c.riskLevel.toLowerCase()}`).join('. '),
    hi: (crops: Crop[]) =>
      crops.length === 0
        ? 'पहले फसल जोड़ें, फिर मैं उसकी स्थिति बता सकता हूं।'
        : crops.map((c) => `${c.name} 100 में से ${c.healthScore}, जोखिम ${c.riskLevel === 'HIGH' ? 'अधिक' : c.riskLevel === 'MEDIUM' ? 'मध्यम' : 'कम'}`).join('. '),
    kn: (crops: Crop[]) =>
      crops.length === 0
        ? 'ಮೊದಲು ಬೆಳೆ ಸೇರಿಸಿ, ನಂತರ ಅದರ ಆರೋಗ್ಯ ಹೇಳಬಲ್ಲೆ.'
        : crops.map((c) => `${c.name} 100 ರಲ್ಲಿ ${c.healthScore}, ಅಪಾಯ ${c.riskLevel === 'HIGH' ? 'ಹೆಚ್ಚು' : c.riskLevel === 'MEDIUM' ? 'ಮಧ್ಯಮ' : 'ಕಡಿಮೆ'}`).join('. '),
    mr: (crops: Crop[]) =>
      crops.length === 0
        ? 'आधी पीक जोडा, मग मी त्याची स्थिती सांगू शकतो.'
        : crops.map((c) => `${c.name} 100 पैकी ${c.healthScore}, जोखीम ${c.riskLevel === 'HIGH' ? 'जास्त' : c.riskLevel === 'MEDIUM' ? 'मध्यम' : 'कमी'}`).join('. '),
  },
  alerts: {
    en: (alerts: RiskAlert[]) => {
      const active = alerts.filter((a) => !a.isRead || a.riskLevel === 'HIGH');
      if (active.length === 0) return 'No active alerts. Your crops look clear.';
      const high = active.filter((a) => a.riskLevel === 'HIGH').length;
      return `${active.length} active alert${active.length > 1 ? 's' : ''}${high > 0 ? `, ${high} high risk` : ''}. First: ${active[0].title}.`;
    },
    hi: (alerts: RiskAlert[]) => {
      const active = alerts.filter((a) => !a.isRead || a.riskLevel === 'HIGH');
      if (active.length === 0) return 'कोई सक्रिय चेतावनी नहीं। फसल ठीक दिख रही है।';
      return `${active.length} सक्रिय चेतावनियां हैं। पहली: ${active[0].title}.`;
    },
    kn: (alerts: RiskAlert[]) => {
      const active = alerts.filter((a) => !a.isRead || a.riskLevel === 'HIGH');
      if (active.length === 0) return 'ಸಕ್ರಿಯ ಎಚ್ಚರಿಕೆಗಳಿಲ್ಲ. ಬೆಳೆ ಚೆನ್ನಾಗಿದೆ.';
      return `${active.length} ಸಕ್ರಿಯ ಎಚ್ಚರಿಕೆಗಳಿವೆ. ಮೊದಲನೆಯದು: ${active[0].title}.`;
    },
    mr: (alerts: RiskAlert[]) => {
      const active = alerts.filter((a) => !a.isRead || a.riskLevel === 'HIGH');
      if (active.length === 0) return 'सक्रिय सूचना नाहीत. पीक व्यवस्थित दिसते.';
      return `${active.length} सक्रिय सूचना आहेत. पहिली: ${active[0].title}.`;
    },
  },
  disease: {
    en: (lib: LibraryEntry[], utterance: string) => {
      const hit = lib.find((e) => utterance.split(' ').some((w) => w.length > 3 && normalize(e.name).includes(w) || normalize(e.name).includes(utterance)));
      if (hit) return `${hit.name} affects ${hit.cropName}. ${hit.symptoms[0] ?? ''} Open the library for prevention and management.`;
      return `I know about ${lib.length} diseases and pests, including ${lib.slice(0, 3).map((e) => e.name).join(', ')}. Name one, or open the library.`;
    },
    hi: (lib: LibraryEntry[], utterance: string) => {
      const hit = lib.find((e) => utterance.split(' ').some((w) => w.length > 3 && normalize(e.name).includes(w)));
      if (hit) return `${hit.name} मुख्यतः ${hit.cropName} को प्रभावित करता है। पुस्तकालय में रोकथाम और प्रबंधन देखें।`;
      return `मुझे ${lib.length} रोगों और कीटों के बारे में पता है, जैसे ${lib.slice(0, 3).map((e) => e.name).join(', ')}. किसी एक का नाम लें।`;
    },
    kn: (lib: LibraryEntry[], utterance: string) => {
      const hit = lib.find((e) => utterance.split(' ').some((w) => w.length > 3 && normalize(e.name).includes(w)));
      if (hit) return `${hit.name} ಮುಖ್ಯವಾಗಿ ${hit.cropName} ಬೆಳೆಯ ಮೇಲೆ ಪರಿಣಾಮ ಬೀರುತ್ತದೆ. ಗ್ರಂಥಾಲಯದಲ್ಲಿ ತಡೆಗಟ್ಟುವಿಕೆ ನೋಡಿ.`;
      return `ನನಗೆ ${lib.length} ರೋಗ ಮತ್ತು ಕೀಟಗಳ ಬಗ್ಗೆ ಗೊತ್ತು, ಉದಾಹರಣೆ ${lib.slice(0, 3).map((e) => e.name).join(', ')}.`;
    },
    mr: (lib: LibraryEntry[], utterance: string) => {
      const hit = lib.find((e) => utterance.split(' ').some((w) => w.length > 3 && normalize(e.name).includes(w)));
      if (hit) return `${hit.name} प्रामुख्याने ${hit.cropName} पीक प्रभावित करते. ग्रंथालयात प्रतिबंध पहा.`;
      return `मला ${lib.length} रोग आणि किड्यांबद्दल माहिती आहे, जसे ${lib.slice(0, 3).map((e) => e.name).join(', ')}.`;
    },
  },
  help: {
    en: () => 'You can ask: what is the weather, how are my crops, any alerts, when should I spray, or tell me about a disease. To check a sick leaf, open Scan and photograph it.',
    hi: () => 'आप पूछ सकते हैं: मौसम कैसा है, मेरी फसल कैसी है, कोई चेतावनी है, छिड़काव कब करें, या किसी रोग के बारे में बताएं। बीमार पत्ती जांचने के लिए स्कैन खोलें।',
    kn: () => 'ನೀವು ಕೇಳಬಹುದು: ಹವಾಮಾನ ಹೇಗಿದೆ, ನನ್ನ ಬೆಳೆ ಹೇಗಿದೆ, ಎಚ್ಚರಿಕೆ ಇದೆಯಾ, ಯಾವಾಗ ಸಿಂಪರಣೆ ಮಾಡಬೇಕು. ಅನಾರೋಗ್ಯ ಎಲೆ ಪರಿಶೀಲಿಸಲು ಸ್ಕ್ಯಾನ್ ತೆರೆಯಿರಿ.',
    mr: () => 'तुम्ही विचारू शकता: हवामान कसे आहे, माझे पीक कसे आहे, सूचना आहे का, फवारणी कधी करावी. आजारी पान तपासण्यासाठी स्कॅन उघडा.',
  },
  fallback: {
    en: () => 'Sorry, I did not understand. Ask about weather, crops, alerts, spray timing, or a disease.',
    hi: () => 'क्षमा करें, समझ नहीं आया। मौसम, फसल, चेतावनी, छिड़काव या रोग के बारे में पूछें।',
    kn: () => 'ಕ್ಷಮಿಸಿ, ಅರ್ಥವಾಗಲಿಲ್ಲ. ಹವಾಮಾನ, ಬೆಳೆ, ಎಚ್ಚರಿಕೆ, ಸಿಂಪರಣೆ ಅಥವಾ ರೋಗದ ಬಗ್ಗೆ ಕೇಳಿ.',
    mr: () => 'क्षमस्व, समजले नाही. हवामान, पीक, सूचना, फवारणी किंवा रोगाबद्दल विचारा.',
  },
};

const LINKS: Partial<Record<string, string>> = {
  weather: '/weather',
  spray: '/spray',
  crops: '/crops',
  health: '/crops',
  alerts: '/alerts',
  disease: '/library',
  help: '/help',
};

export function answerQuestion(utterance: string, ctx: AssistantContext): AssistantAnswer {
  const u = normalize(utterance);

  // If the farmer speaks another language, adopt it for this answer onward.
  const spoken = detectLang(utterance);
  const lang: Lang = spoken ?? ctx.lang;

  // Priority order: greeting, spray (specific), weather, alerts, disease,
  // health, crops, help. First match wins.
  if (matchesUtterance(u, 'greeting', lang)) {
    return { text: T.greeting[lang](ctx.userName) };
  }
  if (matchesUtterance(u, 'spray', lang) && !matchesUtterance(u, 'crops', lang)) {
    return { text: T.spray[lang](ctx.forecast), link: LINKS.spray };
  }
  if (matchesUtterance(u, 'weather', lang)) {
    if (ctx.weather) return { text: T.weather[lang](ctx.weather), link: LINKS.weather };
    return { text: T.fallback[lang](), link: LINKS.weather };
  }
  if (matchesUtterance(u, 'alerts', lang)) {
    return { text: T.alerts[lang](ctx.alerts), link: LINKS.alerts };
  }
  if (matchesUtterance(u, 'disease', lang)) {
    return { text: T.disease[lang](ctx.library, u), link: LINKS.disease };
  }
  if (matchesUtterance(u, 'health', lang)) {
    return { text: T.health[lang](ctx.crops), link: LINKS.health };
  }
  if (matchesUtterance(u, 'crops', lang)) {
    return { text: T.crops[lang](ctx.crops), link: LINKS.crops };
  }
  if (matchesUtterance(u, 'help', lang)) {
    return { text: T.help[lang](), link: LINKS.help };
  }

  // Try disease-by-name without explicit "disease" keyword (e.g. "early blight").
  const libHit = ctx.library.find((e) => u.includes(normalize(e.name)) || normalize(e.name).includes(u));
  if (libHit) {
    return {
      text: `${libHit.name}: ${libHit.symptoms[0] ?? ''} ${libHit.cropName ? 'It usually affects ' + libHit.cropName + '.' : ''}`.trim(),
      link: `/library/${libHit.id}`,
    };
  }

  return { text: T.fallback[lang]() };
}
