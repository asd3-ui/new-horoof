/** المستويات والشارات والمكافآت */

export const LEVELS = [
  { level: 1, name: "مغامر صغير", required: 0, color: "#FFD9A8", emoji: "🐣" },
  { level: 2, name: "متعلّم نشيط", required: 8, color: "#BFE6FF", emoji: "🐥" },
  { level: 3, name: "صديق الحروف", required: 18, color: "#D7F5C7", emoji: "🦊" },
  { level: 4, name: "بطل الكلمات", required: 32, color: "#E4D6FF", emoji: "🦁" },
  { level: 5, name: "نجم القراءة", required: 50, color: "#FFC5DD", emoji: "🌟" },
  { level: 6, name: "أسطورة الحروف", required: 80, color: "#FFE9A8", emoji: "👑" },
];

export const getLevelInfo = (stars = 0) => {
  const unlockedLevels = LEVELS.filter((item) => stars >= item.required);
  const unlocked = unlockedLevels[unlockedLevels.length - 1] || LEVELS[0];
  const nextLevel = LEVELS.find((item) => item.required > stars) || null;
  const span = nextLevel ? nextLevel.required - unlocked.required : 1;
  const progress = nextLevel
    ? Math.max(0, Math.min(100, Math.round(((stars - unlocked.required) / span) * 100)))
    : 100;
  return { unlocked, nextLevel, progress, remaining: nextLevel ? nextLevel.required - stars : 0 };
};

const best = (profile, activityId) => Number(profile?.best?.[activityId] || 0);

export const BADGES = [
  { id: "starter", title: "مغامر اليوم", icon: "🚀", hint: "اجمع أول نجمة", check: (p) => (p.stars || 0) >= 1 },
  { id: "curious", title: "متعلّم فضولي", icon: "📚", hint: "استكشف 5 حروف", check: (p) => (p.learned?.length || 0) >= 5 },
  { id: "reader", title: "قارئ صغير", icon: "📖", hint: "استكشف 14 حرفًا", check: (p) => (p.learned?.length || 0) >= 14 },
  { id: "master", title: "سيد الحروف", icon: "🎓", hint: "استكشف كل الحروف", check: (p) => (p.learned?.length || 0) >= 28 },
  { id: "listener", title: "أذن ذكية", icon: "👂", hint: "أجب 5 إجابات صحيحة في الاستماع", check: (p) => best(p, "listen") >= 5 },
  { id: "words", title: "ساحر الكلمات", icon: "🪄", hint: "أجب 5 إجابات صحيحة في الكلمات", check: (p) => best(p, "wordMatch") >= 5 },
  { id: "memory", title: "بطل الذاكرة", icon: "🧠", hint: "أكمل لعبة الذاكرة", check: (p) => (p.completed?.memory || 0) >= 1 },
  { id: "train", title: "قائد القطار", icon: "🚂", hint: "أكمل رحلة القطار", check: (p) => (p.completed?.train || 0) >= 1 },
  { id: "builder", title: "بنّاء الكلمات", icon: "🧱", hint: "أكمل بناء كلمة", check: (p) => (p.completed?.buildWord || 0) >= 1 },
  { id: "quiz", title: "سريع كالبرق", icon: "⚡", hint: "أجب 8 إجابات في التحدي السريع", check: (p) => best(p, "quiz") >= 8 },
  { id: "streak3", title: "مثابر", icon: "🔥", hint: "العب 3 أيام متتالية", check: (p) => (p.streak || 0) >= 3 },
  { id: "streak7", title: "أسطورة المثابرة", icon: "💎", hint: "العب 7 أيام متتالية", check: (p) => (p.streak || 0) >= 7 },
  { id: "perfect", title: "علامة كاملة", icon: "💯", hint: "احصل على 10 من 10 في لعبة", check: (p) => Object.values(p.best || {}).some((value) => Number(value) >= 10) },
  { id: "collector", title: "جامع النجوم", icon: "🌟", hint: "اجمع 50 نجمة", check: (p) => (p.stars || 0) >= 50 },
];

export const STICKERS = [
  { id: "s1", emoji: "🌈", name: "قوس قزح", condition: (p) => (p.learned?.length || 0) >= 3 },
  { id: "s2", emoji: "🎈", name: "بالون", condition: (p) => (p.stars || 0) >= 3 },
  { id: "s3", emoji: "🍦", name: "آيس كريم", condition: (p) => (p.completed?.listen || 0) >= 1 },
  { id: "s4", emoji: "🦄", name: "يونيكورن", condition: (p) => (p.learned?.length || 0) >= 10 },
  { id: "s5", emoji: "🚀", name: "صاروخ", condition: (p) => (p.completed?.train || 0) >= 1 },
  { id: "s6", emoji: "🐬", name: "دولفين", condition: (p) => (p.completed?.memory || 0) >= 1 },
  { id: "s7", emoji: "🎨", name: "لوحة ألوان", condition: (p) => (p.completed?.tracing || 0) >= 3 },
  { id: "s8", emoji: "🏆", name: "كأس", condition: (p) => (p.stars || 0) >= 30 },
  { id: "s9", emoji: "🦋", name: "فراشة", condition: (p) => (p.completed?.shapes || 0) >= 1 },
  { id: "s10", emoji: "🍭", name: "مصاصة", condition: (p) => (p.completed?.counting || 0) >= 1 },
  { id: "s11", emoji: "🐉", name: "تنين لطيف", condition: (p) => (p.completed?.quiz || 0) >= 1 },
  { id: "s12", emoji: "👑", name: "تاج", condition: (p) => (p.learned?.length || 0) >= 28 },
];

export const unlockedBadges = (profile) => BADGES.filter((badge) => badge.check(profile));
export const unlockedStickers = (profile) => STICKERS.filter((sticker) => sticker.condition(profile));
