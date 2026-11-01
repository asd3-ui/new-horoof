import * as Speech from "expo-speech";
import { Audio } from "expo-av";
import { Vibration } from "react-native";

const soundCache = new Map();
const prefs = { sound: true, haptics: true };

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
 * ينطق نصًا عربيًا.
 *
 * مهم: لا نستدعي `Speech.getAvailableVoicesAsync()` إطلاقًا.
 * في إصدارات expo-speech الحالية يوجد خطأ أصلي (NullPointerException) داخل
 * LanguageUtils أثناء تهيئة محرك النطق على بعض أجهزة أندرويد، وكان يؤدي إلى
 * إغلاق التطبيق فور أول محاولة نطق. الاعتماد على `language` فقط يجعل محرك
 * النطق يختار الصوت العربي المناسب تلقائيًا ويتجنب هذا الانهيار تمامًا.
 */
export async function speakText(text, options = {}) {
  if (!prefs.sound || !text) return;
  try {
    stopSpeaking();
    Speech.speak(String(text), {
      language: options.language || "ar-SA",
      rate: options.rate ?? 0.82,
      pitch: options.pitch ?? 1.15,
      volume: options.volume ?? 1,
      onError: () => {},
    });
  } catch (error) {
    // التطبيق يستمر بالعمل حتى لو لم يتوفر محرك النطق.
  }
}

export function stopSpeaking() {
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
    // الاهتزاز غير متاح على بعض الأجهزة.
  }
}

export async function releaseAudio() {
  stopSpeaking();
  for (const sound of soundCache.values()) {
    sound.unloadAsync().catch(() => {});
  }
  soundCache.clear();
}
