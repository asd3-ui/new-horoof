/**
 * أدوات تشكيل النص العربي المتصل.
 *
 * عندما نريد تلوين حرف واحد داخل كلمة في React Native — عندنا مشكلة معروفة:
 * تقسيم الكلمة إلى أكثر من مكوّن <Text> يكسر تشكيل الحروف (تظر مفكّكة).
 * الحل المتبع هنا: إدخال U+200D (Zero Width Joiner) في حدود التقسيم فقط
 * عندما يكون الحرفان المتجاوران هناكان يتصلان في النص الحقيقي،
 * فينتج تشكيل صحيح تمامًا مع بقاء كلمة واحدة مدمجة.
 */

export const ZWJ = "\u200D";

/** حروف لا تتصل بالحرف التالي (يمينها مفتوح دائمًا) */
const NO_JOIN_NEXT = new Set(["ا", "أ", "إ", "آ", "ء", "د", "ذ", "ر", "ز", "و", "ة", "ى"]);

/** حروف لا تتصل بالحرف السابق (يسارها مفتوح دائمًا) */
const NO_JOIN_PREV = new Set(["ا", "أ", "إ", "آ", "ء", "د", "ذ", "ر", "ز", "و"]);

/** هل يتصل الحرف بالحرف التالي في الكلمة؟ */
export function joinsNext(char) {
  return !!char && !NO_JOIN_NEXT.has(char);
}

/** هل يتصل الحرف بالحرف السابق في الكلمة؟ */
export function joinsPrev(char) {
  return !!char && !NO_JOIN_PREV.has(char);
}

/** هل يتصل الحرفان متجاوران فعليًا في النص الحقيقي؟ */
export function isJoinPair(leftChar, rightChar) {
  return joinsNext(leftChar) && joinsPrev(rightChar);
}

/**
 * تقسيم كلمة عربية لعرض حرف واحد منها بلون مميّز.
 * يعيد القطع الثلاث + هل الحدود بحاجة إلى ZWJ للحفاظ على الاتصال.
 */
export function splitForHighlight(word, letter, letterIndex = -1) {
  const index = letterIndex >= 0 ? letterIndex : word.indexOf(letter);
  if (index < 0) return null;
  if (word.indexOf(letter) !== word.lastIndexOf(letter) && letterIndex < 0) return null;

  const before = word.slice(0, index);
  const target = word[index];
  const after = word.slice(index + 1);
  const preJoin = before.length > 0 && isJoinPair(before[before.length - 1], target);
  const postJoin = after.length > 0 && isJoinPair(target, after[0]);
  return { before, target, after, preJoin, postJoin };
}

/** يحسب اللاصقات التي تُدخل في كل قطعة للحفاظ على الاتصال */
export function highlightPieces(info) {
  if (!info) return null;
  return {
    before: info.before + (info.preJoin ? ZWJ : ""),
    red: (info.preJoin ? ZWJ : "") + info.target + (info.postJoin ? ZWJ : ""),
    after: (info.postJoin ? ZWJ : "") + info.after,
    preJoin: info.preJoin,
    postJoin: info.postJoin,
  };
}

/** نص ما بعد الحرف الأول المفقود مع لاصق الاتصال الصحيح */
export function restAfterFirstLetter(word) {
  const rest = word.slice(1);
  const leadJoin = rest.length > 0 && isJoinPair(word[0], word[1]);
  return (leadJoin ? ZWJ : "") + rest;
}
