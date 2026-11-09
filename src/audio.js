import * as Speech from "expo-speech";
import { Audio } from "expo-av";
import { Vibration } from "react-native";
import { VOICE_CLIPS } from "./voice-clips";

const soundCache = new Map();

const prefs = { sound: true, haptics: true, voiceId: "app" };

/**
 * القرّاء المتاحون في التطبيق.
 *
 * `app` هو صوت التطبيق الخاص: مقاطع mp3 عربية مسجّلة مسبقًا ومدمجة داخل
 * التطبيق (مجلد assets/voice) تعمل دون إنترنت ولا تعتمد على محرك نطق الجهاز.
 * عند عدم توفّر مقطع لنصٍّ ما يرجع التطبيق تلقائيًا إلى محرك نطق الجهاز
 * بالقارئين `wafy` و`noor` (نفس الصوت مع سرعة وطبقة مختلفتين).
 */
export const VOICES = [
  {
    id: "app",
    name: "حروفي",
    subtitle: "صوت التطبيق الأصلي — واضح ومسجّل خصيصًا للحروف والكلمات",
    rate: 1,
    pitch: 1,
    emoji: "🎙️",
    builtin: true,
  },
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

/* --------------------------- صوت التطبيق (مقاطع mp3) --------------------------- */

const clipCache = new Map();
let clipSound = null;
let clipToken = 0;

/** يوقف المقطع الجاري ويتجاهل أي مقطع قيد التحميل */
function haltClip() {
  clipToken += 1;
  const sound = clipSound;
  clipSound = null;
  if (sound) {
    try {
      const result = sound.stopAsync();
      if (result && typeof result.catch === "function") result.catch(() => {});
    } catch (error) {
      // تجاهل أخطاء الإيقاف.
    }
  }
}

/**
 * يشغّل مقطع التطبيق المطابق للنص إن وُجد.
 * يعيد `true` إذا شُغّل المقطع، و`false` إذا لم يوجد (ليستخدم المنادي محرك الجهاز).
 * `onDone` يُستدعى عند انتهاء التشغيل أو إلغائه.
 */
async function playClip(text, onDone) {
  const source = VOICE_CLIPS[text];
  if (!source) return false;

  const token = clipToken + 1;
  haltClip();
  clipToken = token;

  try {
    let sound = clipCache.get(text);
    if (!sound) {
      const created = await Audio.Sound.createAsync(source, { volume: 1, shouldPlay: false });
      sound = created.sound;
      clipCache.set(text, sound);
    }
    if (token !== clipToken) {
      // أُلغي الطلب أثناء تحميل المقطع.
      onDone?.();
      return true;
    }

    clipSound = sound;
    sound.setOnPlaybackStatusUpdate((status) => {
      if (!status || !status.didJustFinish) return;
      sound.setOnPlaybackStatusUpdate(null);
      if (clipSound === sound) clipSound = null;
      onDone?.();
    });
    await sound.replayAsync();
    return true;
  } catch (error) {
    // مقطع تالف أو غير مدعوم: نرجع إلى محرك الجهاز.
    return false;
  }
}

/** يشغّل مقطع التطبيق لنص واحد (للاستخدام المباشر عند الحاجة) */
export function hasAppClip(text) {
  return Boolean(VOICE_CLIPS[String(text)]);
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
    rate: options.rate ?? (voice.builtin ? 0.85 : voice.rate),
    pitch: options.pitch ?? (voice.builtin ? 1.05 : voice.pitch),
    volume: options.volume ?? 1,
    onError: () => {},
  };
}

/** ينطق نصًا عربيًا واحدًا (صوت التطبيق أولًا ثم صوت الجهاز) */
export async function speakText(text, options = {}) {
  if (!prefs.sound || !text) return;
  const value = String(text);
  stopSpeaking();

  const voice = getVoiceProfile();
  if (voice.builtin) {
    const played = await playClip(value);
    if (played) return;
  }

  try {
    Speech.speak(value, speakOptions(options));
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
 * يعتمد الدوران على حدث انتهاء المقطع أو onDone مع مؤقت أمان تقديري يضمن
 * التقدم حتى لو كان محرك النطق لا يرسل أحداث الاكتمال على بعض الأجهزة.
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

    const speakWithDevice = () => {
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

    const voice = getVoiceProfile();
    if (voice.builtin) {
      playClip(text, advance).then((played) => {
        if (stopped) return;
        if (!played) {
          speakWithDevice();
          return;
        }
        // مؤقت أمان أطول لأن المقاطع المسجّلة أبطأ من النطق الآلي.
        const estimate = Math.min(20000, 1400 + text.length * 210);
        schedule(advance, estimate);
      });
      return;
    }

    speakWithDevice();
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
  haltClip();
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
  for (const sound of clipCache.values()) {
    sound?.unloadAsync?.().catch?.(() => {});
  }
  clipCache.clear();
}
