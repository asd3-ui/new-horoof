import { CARD_COLORS } from "../theme";

/** كل أنشطة التطبيق في مكان واحد */
export const ACTIVITIES = [
  {
    id: "letters",
    title: "تعلّم الحروف",
    subtitle: "28 حرفًا مع 3 أمثلة لكل حرف",
    emoji: "🔤",
    color: CARD_COLORS.sky,
    screen: "letters",
    tag: "تعلّم",
    category: "الحروف",
  },
  {
    id: "tracing",
    title: "لوّن واكتب",
    subtitle: "ارسم الحرف بإصبعك",
    emoji: "🎨",
    color: CARD_COLORS.lilac,
    screen: "tracing",
    params: { mode: "letter" },
    tag: "كتابة",
    category: "الحروف",
  },
  {
    id: "listen",
    title: "استمع واختر",
    subtitle: "استمع لاسم الحرف ثم اختره",
    emoji: "🔊",
    color: CARD_COLORS.sky,
    screen: "listen",
    tag: "استماع",
    category: "الحروف",
  },
  {
    id: "sound",
    title: "طابق الصوت",
    subtitle: "استمع للكلمة وحدّد حرفها",
    emoji: "🎵",
    color: CARD_COLORS.rose,
    screen: "sound",
    tag: "استماع",
    category: "الحروف",
  },
  {
    id: "forms",
    title: "موقع الحرف",
    subtitle: "أول الكلمة أم وسطها أم آخرها؟",
    emoji: "📍",
    color: CARD_COLORS.peach,
    screen: "forms",
    tag: "تحليل",
    category: "الحروف",
  },
  {
    id: "wordMatch",
    title: "اربط الكلمة",
    subtitle: "اختر الكلمة التي تبدأ بالحرف",
    emoji: "🧩",
    color: CARD_COLORS.mint,
    screen: "wordMatch",
    tag: "كلمات",
    category: "الكلمات",
  },
  {
    id: "missing",
    title: "الحرف المفقود",
    subtitle: "أكمل الحرف الأول في الكلمة",
    emoji: "🔎",
    color: CARD_COLORS.lemon,
    screen: "missing",
    tag: "كلمات",
    category: "الكلمات",
  },
  {
    id: "buildWord",
    title: "بنّاء الكلمات",
    subtitle: "رتّب الحروف لتكوين الكلمة",
    emoji: "🧱",
    color: CARD_COLORS.sand,
    screen: "buildWord",
    tag: "كلمات",
    category: "الكلمات",
  },
  {
    id: "opposites",
    title: "الأضداد",
    subtitle: "اكتشف الكلمة المعاكسة",
    emoji: "↔️",
    color: CARD_COLORS.rose,
    screen: "opposites",
    tag: "مفردات",
    category: "الكلمات",
  },
  {
    id: "counting",
    title: "العدّ الممتع",
    subtitle: "عُدّ الأشياء واختر الرقم",
    emoji: "🔢",
    color: CARD_COLORS.mint,
    screen: "counting",
    tag: "أرقام",
    category: "المرح",
  },
  {
    id: "shapes",
    title: "الأشكال والألوان",
    subtitle: "تعرّف على 10 أشكال و10 ألوان",
    emoji: "🔷",
    color: CARD_COLORS.aqua,
    screen: "shapes",
    tag: "أشكال",
    category: "المرح",
  },
  {
    id: "shapesTracing",
    title: "لوّن الأشكال",
    subtitle: "ارسم الأشكال الهندسية",
    emoji: "🖍️",
    color: CARD_COLORS.lemon,
    screen: "tracing",
    params: { mode: "shape" },
    tag: "رسم",
    category: "المرح",
  },
  {
    id: "memory",
    title: "لعبة الذاكرة",
    subtitle: "طابق أزواج الحروف",
    emoji: "🧠",
    color: CARD_COLORS.lilac,
    screen: "memory",
    tag: "ذاكرة",
    category: "المرح",
  },
  {
    id: "train",
    title: "رحلة القطار",
    subtitle: "أجب لتتحرك بين المحطات",
    emoji: "🚂",
    color: CARD_COLORS.mint,
    screen: "train",
    tag: "مغامرة",
    category: "المرح",
  },
  {
    id: "quiz",
    title: "التحدي السريع",
    subtitle: "60 ثانية من الأسئلة المتنوعة",
    emoji: "⚡",
    color: CARD_COLORS.peach,
    screen: "quiz",
    tag: "تحدٍّ",
    category: "المرح",
  },
];

export const FEATURED_IDS = ["letters", "listen", "memory", "train", "buildWord", "quiz"];

export const getActivity = (id) => ACTIVITIES.find((item) => item.id === id);

export const ACTIVITY_CATEGORIES = ["الحروف", "الكلمات", "المرح"];

/** نشاط اليوم يتغيّر تلقائيًا كل يوم */
export const dailyActivity = () => {
  const now = new Date();
  const day = now.getFullYear() * 1000 + now.getMonth() * 40 + now.getDate();
  const pool = ACTIVITIES.filter((item) => item.id !== "letters");
  return pool[day % pool.length];
};
