import { LETTERS, WORD_POOL } from "./letters";
import {
  OPPOSITES,
  COUNTING_SETS,
  SHAPES,
  COLOR_LIST,
  POSITION_WORDS,
  POSITION_LABELS,
  TRAIN_STATIONS,
} from "./games";
import { pick, sample, shuffled, toArabicDigits, nextRoundKey } from "../utils";

const NUMBER_WORDS = [
  "",
  "واحد",
  "اثنان",
  "ثلاثة",
  "أربعة",
  "خمسة",
  "ستة",
  "سبعة",
  "ثمانية",
  "تسعة",
  "عشرة",
];

const letterChoice = (letter) => ({
  key: `l-${letter.id}`,
  label: letter.letter,
  /** ننطق اسم الحرف وليس شكله فقط */
  speech: letter.name,
  letterId: letter.id,
  letterName: letter.name,
});

const letterChoices = (target, count = 3) => {
  const distractors = sample(
    LETTERS,
    count,
    [target.id],
    (item) => item.id
  );
  return shuffled([target, ...distractors]).map(letterChoice);
};

const numberChoices = (count) => {
  const pool = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].filter((value) => value !== count);
  const distractors = shuffled(pool).slice(0, 3);
  return shuffled([count, ...distractors]).map((value) => ({
    key: `n-${value}`,
    label: toArabicDigits(value),
    /** ننطق الرقم كلمة كاملة بدل الرقم المهضوم بصريًا */
    speech: NUMBER_WORDS[value] || toArabicDigits(value),
    value,
  }));
};

/** استمع واختر الحرف */
export function makeListenRound() {
  const target = pick(LETTERS);
  return {
    key: nextRoundKey("listen"),
    kind: "letters",
    prompt: "استمع جيدًا ثم اختر الحرف",
    speech: `حرف ${target.name}`,
    speechLabel: "استمع إلى الحرف",
    meta: { letter: target },
    choices: letterChoices(target),
    correctKey: `l-${target.id}`,
    correctLabel: target.letter,
  };
}

/** اربط الحرف بالكلمة */
export function makeWordMatchRound() {
  const target = pick(WORD_POOL);
  const distractors = sample(
    WORD_POOL,
    3,
    [target.letterId],
    (item) => item.letterId
  );
  const choices = shuffled([target, ...distractors]).map((item) => ({
    key: item.key,
    label: item.word,
    emoji: item.emoji,
  }));
  return {
    key: nextRoundKey("word"),
    kind: "words",
    prompt: "اختر الكلمة التي تبدأ بهذا الحرف",
    speech: `أي كلمة تبدأ بحرف ${target.letterName}؟`,
    speechLabel: "استمع إلى الحرف",
    meta: { letter: LETTERS[target.letterId] },
    choices,
    correctKey: target.key,
    correctLabel: target.word,
  };
}

/** الحرف المفقود */
export function makeMissingRound() {
  const target = pick(WORD_POOL);
  return {
    key: nextRoundKey("missing"),
    kind: "missing",
    prompt: "اختر الحرف الأول الناقص",
    speech: `ما الحرف الأول في كلمة ${target.word}؟`,
    speechLabel: "استمع إلى الكلمة",
    meta: { word: target },
    choices: letterChoices(LETTERS[target.letterId]),
    correctKey: `l-${target.letterId}`,
    correctLabel: target.letter,
  };
}

/** طابق الصوت بالحرف */
export function makeSoundRound() {
  const target = pick(WORD_POOL);
  return {
    key: nextRoundKey("sound"),
    kind: "sound",
    prompt: "استمع إلى الكلمة واختر حرفها الأول",
    speech: `كلمة ${target.word}`,
    speechLabel: "أعد سماع الكلمة",
    meta: { word: target },
    choices: letterChoices(LETTERS[target.letterId]),
    correctKey: `l-${target.letterId}`,
    correctLabel: target.letter,
  };
}

/** موقع الحرف في الكلمة */
export function makePositionRound() {
  const target = pick(POSITION_WORDS);
  const positions = ["first", "middle", "last"];
  return {
    key: nextRoundKey("position"),
    kind: "position",
    prompt: "أين يقع الحرف الملوّن في الكلمة؟",
    speech: `أين يقع حرف ${target.letter} في كلمة ${target.word}؟`,
    speechLabel: "استمع إلى السؤال",
    meta: { target },
    choices: positions.map((position) => ({
      key: `p-${position}`,
      label: POSITION_LABELS[position],
      position,
    })),
    correctKey: `p-${target.position}`,
    correctLabel: POSITION_LABELS[target.position],
  };
}

/** الأضداد */
export function makeOppositeRound() {
  const target = pick(OPPOSITES);
  const distractors = sample(
    OPPOSITES.filter((item) => item.opposite !== target.opposite),
    3,
    [],
    (item) => item.opposite
  );
  const choices = shuffled([
    { key: "op-correct", label: target.opposite, emoji: target.oppositeEmoji },
    ...distractors.map((item) => ({
      key: `op-${item.opposite}`,
      label: item.opposite,
      emoji: item.oppositeEmoji,
    })),
  ]);
  return {
    key: nextRoundKey("opposite"),
    kind: "words",
    prompt: "اختر الكلمة التي تعني العكس",
    speech: `ما ضد كلمة ${target.word}؟`,
    speechLabel: "استمع إلى الكلمة",
    meta: { pair: target },
    choices,
    correctKey: "op-correct",
    correctLabel: target.opposite,
  };
}

/** العدّ */
export function makeCountingRound() {
  const set = pick(COUNTING_SETS);
  const count = 1 + Math.floor(Math.random() * 10);
  return {
    key: nextRoundKey("count"),
    kind: "count",
    prompt: "عُدّ الأشياء ثم اختر العدد الصحيح",
    speech: `كم عدد ${set.name}؟`,
    speechLabel: "استمع إلى السؤال",
    meta: { set, count },
    choices: numberChoices(count),
    correctKey: `n-${count}`,
    correctLabel: toArabicDigits(count),
  };
}

/** الأشكال والألوان */
export function makeShapeRound() {
  const mode = Math.random() < 0.5 ? "shape" : "color";
  const shape = pick(SHAPES);
  const color = pick(COLOR_LIST.filter((item) => item.id !== "white"));

  if (mode === "shape") {
    const distractors = sample(
      SHAPES,
      3,
      [shape.id],
      (item) => item.id
    );
    return {
      key: nextRoundKey("shape"),
      kind: "shapes",
      prompt: "ما اسم هذا الشكل؟",
      speech: "ما اسم هذا الشكل؟",
      speechLabel: "استمع إلى السؤال",
      meta: { shape, color, mode },
      choices: shuffled([shape, ...distractors]).map((item) => ({
        key: `s-${item.id}`,
        label: item.name,
        shapeId: item.id,
      })),
      correctKey: `s-${shape.id}`,
      correctLabel: shape.name,
    };
  }

  const distractors = sample(
    COLOR_LIST,
    3,
    [color.id],
    (item) => item.id
  );
  return {
    key: nextRoundKey("color"),
    kind: "shapes",
    prompt: "ما لون هذا الشكل؟",
    speech: "ما لون هذا الشكل؟",
    speechLabel: "استمع إلى السؤال",
    meta: { shape, color, mode },
    choices: shuffled([color, ...distractors]).map((item) => ({
      key: `c-${item.id}`,
      label: item.name,
      colorHex: item.hex,
    })),
    correctKey: `c-${color.id}`,
    correctLabel: color.name,
  };
}

/** محطة القطار */
export function makeTrainRound() {
  const station = pick(TRAIN_STATIONS);
  const target = LETTERS.find((item) => item.letter === station.letter) || LETTERS[0];
  return {
    key: nextRoundKey("train"),
    kind: "letters",
    prompt: "اختر الحرف الذي تبدأ به الكلمة",
    speech: `أي حرف تبدأ به كلمة ${station.word}؟`,
    speechLabel: "استمع إلى الكلمة",
    meta: { station },
    choices: letterChoices(target),
    correctKey: `l-${target.id}`,
    correctLabel: target.letter,
  };
}

const QUICK_FACTORIES = [
  makeListenRound,
  makeWordMatchRound,
  makeMissingRound,
  makeSoundRound,
  makePositionRound,
  makeOppositeRound,
  makeCountingRound,
  makeShapeRound,
];

export const makeQuickRound = () => pick(QUICK_FACTORIES)();
