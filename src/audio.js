import * as Speech from "expo-speech";
import { Audio } from "expo-av";
import { Vibration } from "react-native";

const soundCache = new Map();

const prefs = { sound: true, haptics: true, voiceId: "wafy" };

/** القارئان المتاحان في التطبيق (ولا يعتمد أي منهما على تعداد أصوات الجهاز الأصلية) */
export const VOICES = [
  {
    id: "wafy",
    name: "وافي المبهج",
    subtitle: "صوت مرح وسرعته تصلح للأطفال الصغار",
    rate: 0.9,
    pitch: 1.25,
    emoji: "🐤",
  },
  {
    id: "noor",
    name: "نور الهادئ",
    subtitle: "صوت بطيء وواضح تلتقطه الأذن بسهولة",
    rate: 0.62,
    pitch: 1.0,
    emoji: "🌙",
  },
];

const getVoiceProfile = () => VOICES.find((voice) => voice.id === prefs.voiceId) || VOICES[0];

export function setAudioPrefs(next = {}) {
  Object.assign(prefs, next);
  if (!prefs.sound) stopSpeaking();
}

/** يضبط وضع الصوت ليعمل النطق والمؤثرات حتى مع كتم الجرس على iOS */
export async function initAudio() {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: false,
    });
  } catch (error) {
    // بعض المنصات لا تدعم كل الخيارات؛ نتجاهل الخطأ.
  }
}

/**
 * إعدادات النطق الأساسية.
 *
 * مهم: لا نستدعي `Speech.getAvailableVoicesAsync()` إطلاقًا.
 * في إصدارات expo-speech الحالية يوجد خطأ أصلي (NullPointerException) داخل
 * LanguageUtils أثناء تهيئة محرك النطق على بعض أجهزة أندرويد، وكان يؤدي إلى
 * إغلاق التطبيق فور أول محاولة نطق. الاعتماد على `language` فقط يجعل محرك
 * النطق يختار الصوت العربي المناسب تلقائيًا ويتجنب هذا الانهيار تمامًا.
 */
function speakOptions(options = {}) {
  const voice = getVoiceProfile();
  return {
    language: "ar-SA",
    rate: options.rate ?? voice.rate,
    pitch: options.pitch ?? voice.pitch,
    volume: options.volume ?? 1,
    onError: () => {},
  };
}

/** ينطق نصًا عربيًا واحدًا */
export async function speakText(text, options = {}) {
  if (!prefs.sound || !text) return;
  try {
    stopSpeaking();
    Speech.speak(String(text), speakOptions(options));
  } catch (error) {
    // التطبيق يستمر بالعمل حتى لو لم يتوفر محرك النطق.
  }
}

/** المتابِعات النشطة لسلاسل النطق (تُلغى جميعًا عند stopSpeaking أو الخروج) */
const activeSequences = new Set();

/**
 * ينطق عناصر متتابعة (السؤال ثم كل خيار على حدة مثاليًا) وينبّه الواجهة بالعنصر
 * الجاري نطقه حاليًا حتى يُظلل الاختيار المقروء.
 *
 * يعيد دالة `cancel()` التي توقف السلسلة فورًا وتمنع أي متابَع لاحق.
 * يعتمد الدوران على حدث onDone مع مؤقت أمان تقديري يضمن التقدم حتى لو
 * كان محرك النطق لا يرسل أحداث الاكتمال على بعض الأجهزة.
 */
export function speakSequence(items, opts = {}) {
  const startDelayMs = opts.startDelayMs ?? 380;
  const gapMs = opts.gapMs ?? 620;
  let stopped = false;
  let idx = -1;
  let timer = null;
  let firedForCurrent = false;

  const cancel = () => {
    if (stopped) return;
    stopped = true;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    activeSequences.delete(cancel);
  };

  const schedule = (fn, ms) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(fn, ms);
  };

  const next = () => {
    if (stopped) return;
    idx += 1;
    if (idx >= items.length) {
      cancel();
      if (opts.onDone) opts.onDone();
      return;
    }
    const item = items[idx];
    const text = String(item.text || item);
    if (!text) return next();
    firedForCurrent = false;
    if (opts.onStartItem) opts.onStartItem(item);

    if (!prefs.sound) {
      cancel();
      if (opts.onDone) opts.onDone();
      return;
    }

    const advance = () => {
      if (stopped || firedForCurrent) return;
      firedForCurrent = true;
      schedule(next, gapMs);
    };

    try {
      Speech.speak(text, { ...speakOptions(), onDone: advance, onError: advance });
    } catch (error) {
      advance();
      return;
    }
    // مؤقت أمان: مدة تقديرية كافية لنطق السطر الحالي حتى لو انقطعت أحداث المحرك.
    const estimate = Math.min(12000, 1050 + text.length * 175);
    schedule(advance, estimate);
  };

  activeSequences.add(cancel);
  schedule(next, startDelayMs);
  return cancel;
}

/** يوقف كل النطق الفوري ويلغي كل السلاسل النشطة */
export function stopSpeaking() {
  for (const cancel of [...activeSequences]) {
    cancel();
  }
  activeSequences.clear();
  try {
    const result = Speech.stop();
    if (result && typeof result.catch === "function") {
      result.catch(() => {});
    }
  } catch (error) {
    // تجاهل أخطاء إيقاف النطق.
  }
}

/* مؤثرات محلية قصيرة تعمل بدون إنترنت وتحافظ على خصوصية الطفل */
const SFX = {
  pop: require("../assets/sounds/pop.wav"),
  success: require("../assets/sounds/success.wav"),
  error: require("../assets/sounds/error.wav"),
  clap: require("../assets/sounds/clap.wav"),
};

/** يشغّل مؤثرًا صوتيًا قصيرًا مع تخزين مؤقت لتقليل التأخير */
export async function playSfx(name = "pop") {
  if (!prefs.sound || !SFX[name]) return;
  try {
    let sound = soundCache.get(name);
    if (!sound) {
      const result = await Audio.Sound.createAsync(SFX[name], { volume: 0.55 });
      sound = result.sound;
      soundCache.set(name, sound);
    }
    await sound.replayAsync();
  } catch (error) {
    // بعض الأجهزة قد تمنع تشغيل الروابط الصوتية؛ نتجاهل الخطأ بهدوء.
  }
}

export function buzz(pattern = 14) {
  if (!prefs.haptics) return;
  try {
    Vibration.vibrate(pattern);
  } catch (error) {
    // تجاهل فشل الاهتزاز.
  }
}

/** يفرغ كل الموارد عند إغلاق التطبيق نهائيًا */
export async function releaseAudio() {
  stopSpeaking();
  for (const sound of soundCache.values()) {
    sound?.unloadAsync?.().catch?.(() => {});
  }
  soundCache.clear();
}
