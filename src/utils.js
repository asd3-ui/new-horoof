/** خلط عشوائي موثوق (Fisher–Yates) */
export function shuffled(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export const pick = (items) => items[Math.floor(Math.random() * items.length)];

/** يختار عددًا من العناصر دون تكرار، مع استبعاد عناصر محددة */
export function sample(items, count, excludeKeys = [], keyOf = (item) => item) {
  const excluded = new Set(excludeKeys);
  const pool = items.filter((item) => !excluded.has(keyOf(item)));
  return shuffled(pool).slice(0, count);
}

export const toArabicDigits = (value) =>
  String(value).replace(/\d/g, (digit) => "٠١٢٣٤٥٦٧٨٩"[Number(digit)]);

export const todayKey = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
};

export const daysBetween = (firstKey, secondKey) => {
  if (!firstKey || !secondKey) return null;
  const first = new Date(`${firstKey}T00:00:00`);
  const second = new Date(`${secondKey}T00:00:00`);
  if (Number.isNaN(first.getTime()) || Number.isNaN(second.getTime())) return null;
  return Math.round((second - first) / 86400000);
};

export const percent = (value, total) => {
  if (!total) return 0;
  return Math.max(0, Math.min(100, Math.round((value / total) * 100)));
};

export const range = (count) => Array.from({ length: count }, (_, index) => index);

export const formatDateArabic = (date = new Date()) => {
  try {
    return date.toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch (error) {
    return date.toISOString().slice(0, 10);
  }
};

/** يبني مفتاحًا فريدًا لكل جولة */
let roundCounter = 0;
export const nextRoundKey = (prefix = "round") => {
  roundCounter += 1;
  return `${prefix}-${roundCounter}-${Math.floor(Math.random() * 9999)}`;
};
