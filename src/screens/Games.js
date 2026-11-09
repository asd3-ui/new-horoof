import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useApp } from "../context";
import { PALETTE, ROW, SHADOW_SOFT  } from "../theme";
import { AppText, MissingSlotWord } from "../components/UI";
import ShapeIcon from "../components/ShapeIcon";
import QuizGame from "./QuizGame";
import {
  makeListenRound,
  makeWordMatchRound,
  makeMissingRound,
  makeSoundRound,
  makePositionRound,
  makeOppositeRound,
  makeCountingRound,
  makeShapeRound,
  makeTrainRound,
  makeQuickRound,
} from "../data/rounds";
import { TRAIN_STATIONS } from "../data/games";

/* ------------------------------ عناصر العرض ------------------------------ */

function ReplayButton({ text, label = "أعد السماع" }) {
  const { speak } = useApp();
  return (
    <Pressable
      onPress={() => speak(text)}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={({ pressed }) => [styles.replay, pressed && styles.pressed]}
    >
      <AppText style={styles.replayIcon}>🔊</AppText>
      <AppText style={styles.replayText}>{label}</AppText>
    </Pressable>
  );
}

function ListenPrompt({ round, helpers }) {
  return (
    <View style={styles.promptCenter}>
      <Pressable
        onPress={() => helpers.speak()}
        style={({ pressed }) => [styles.bigSpeaker, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="استمع إلى الحرف"
      >
        <AppText style={styles.bigSpeakerIcon}>🔊</AppText>
      </Pressable>
      <AppText style={styles.promptTitle}>استمع جيدًا</AppText>
      <AppText style={styles.promptHint}>ثم اختر الحرف الذي سمعته</AppText>
    </View>
  );
}

function WordMatchPrompt({ round }) {
  const letter = round.meta?.letter;
  return (
    <View style={styles.promptCenter}>
      <AppText style={styles.bigLetter}>{letter?.letter}</AppText>
      <AppText style={styles.promptTitle}>حرف {letter?.name}</AppText>
      <AppText style={styles.promptHint}>أي كلمة تبدأ بهذا الحرف؟</AppText>
      <ReplayButton text={`حرف ${letter?.name}`} label="استمع إلى الحرف" />
    </View>
  );
}

function MissingPrompt({ round, helpers }) {
  const word = round.meta?.word;
  return (
    <View style={styles.promptCenter}>
      <AppText style={styles.bigEmoji}>{word?.emoji}</AppText>
      {/* مربع الحرف المفقود في بداية الكلمة (أقصى اليمين) */}
      <MissingSlotWord
        word={word?.word}
        rowStyle={styles.missingRow}
        restStyle={styles.missingRest}
      />
      <AppText style={styles.promptHint}>ما الحرف الأول في هذه الكلمة؟</AppText>
      <ReplayButton text={`كلمة ${word?.word}`} label="استمع إلى الكلمة" />
    </View>
  );
}

function SoundPrompt({ round, helpers }) {
  const word = round.meta?.word;
  return (
    <View style={styles.promptCenter}>
      <AppText style={styles.bigEmoji}>{word?.emoji}</AppText>
      <AppText style={styles.promptTitle}>ما الحرف الأول؟</AppText>
      <ReplayButton text={`كلمة ${word?.word}`} label="أعد سماع الكلمة" />
    </View>
  );
}

function PositionPrompt({ round, helpers }) {
  const target = round.meta?.target;
  if (!target) return null;

  return (
    <View style={styles.promptCenter}>
      <AppText style={styles.bigEmoji}>{target.emoji}</AppText>
      {/* الكلمة كاملة في سطر واحد وبحروف متصلة (نص واحد بلا تقسيم) */}
      <AppText style={styles.positionWord} numberOfLines={1} adjustsFontSizeToFit>
        {target.word}
      </AppText>
      {/* الحرف المقصود بالأحمر في بطاقة مستقلة تحت الكلمة */}
      <View style={styles.positionLetterRow}>
        <View style={styles.positionLetterChip}>
          <AppText style={styles.positionLetterBig}>{target.letter}</AppText>
        </View>
        <AppText style={styles.positionLetterLabel}>الحرف المطلوب</AppText>
      </View>
      <AppText style={styles.promptHint}>أين يقع هذا الحرف في الكلمة؟</AppText>
      <ReplayButton text={`أين يقع حرف ${target.letter} في كلمة ${target.word}؟`} label="استمع إلى السؤال" />
    </View>
  );
}

function OppositePrompt({ round, helpers }) {
  const pair = round.meta?.pair;
  return (
    <View style={styles.promptCenter}>
      <AppText style={styles.bigEmoji}>{pair?.emoji}</AppText>
      <AppText style={styles.oppositeWord}>{pair?.word}</AppText>
      <AppText style={styles.promptHint}>ما الكلمة التي تعني العكس؟</AppText>
      <ReplayButton text={`ما ضد كلمة ${pair?.word}؟`} label="استمع إلى السؤال" />
    </View>
  );
}

function CountingPrompt({ round, helpers }) {
  const { set, count } = round.meta || {};
  return (
    <View style={styles.promptCenter}>
      <View style={styles.countGrid}>
        {Array.from({ length: count || 0 }).map((_, index) => (
          <AppText key={index} style={styles.countEmoji}>
            {set?.emoji}
          </AppText>
        ))}
      </View>
      <AppText style={styles.promptHint}>كم عدد {set?.name}؟</AppText>
      <ReplayButton text={`كم عدد ${set?.name}؟`} label="استمع إلى السؤال" />
    </View>
  );
}

function ShapePrompt({ round, helpers }) {
  const { shape, color, mode } = round.meta || {};
  // في السؤال عن الاسم يظهر الشكل بلون ثابت وواضح، وفي السؤال عن اللون يظهر باللون المطلوب.
  const fill = mode === "color" ? color?.hex || "#7C6FD8" : "#7C6FD8";
  return (
    <View style={styles.promptCenter}>
      {/* الشكل يظهر دائمًا داخل بطاقة بيضاء حتى لو تغيّرت البيانات */}
      <View style={styles.shapeWrap}>
        <ShapeIcon shapeId={shape?.id || "circle"} color={fill} size={132} />
      </View>
      <AppText style={styles.promptHint}>
        {mode === "color" ? "ما لون هذا الشكل؟" : "ما اسم هذا الشكل؟"}
      </AppText>
      <ReplayButton text={mode === "color" ? "ما لون هذا الشكل؟" : "ما اسم هذا الشكل؟"} label="استمع إلى السؤال" />
    </View>
  );
}

function LetterChoice({ choice }) {
  return (
    <AppText style={styles.letterChoice} numberOfLines={1} adjustsFontSizeToFit>
      {choice.label}
    </AppText>
  );
}

function WordChoice({ choice }) {
  return (
    <View style={styles.wordChoiceInner}>
      <AppText style={styles.wordChoiceEmoji}>{choice.emoji || "🔤"}</AppText>
      <AppText style={styles.wordChoiceLabel} numberOfLines={1} adjustsFontSizeToFit>
        {choice.label}
      </AppText>
    </View>
  );
}

function NumberChoice({ choice }) {
  return <AppText style={styles.numberChoice}>{choice.label}</AppText>;
}

function TextChoice({ choice, emoji }) {
  return (
    <View style={styles.textChoiceInner}>
      {!!emoji && <AppText style={styles.textChoiceEmoji}>{emoji}</AppText>}
      <AppText style={styles.textChoiceLabel} numberOfLines={2} adjustsFontSizeToFit>
        {choice.label}
      </AppText>
    </View>
  );
}

/* خيارات نصية فقط — لا شكل ولا مربع لون داخل الخيارات */
function ShapeNameChoice({ choice }) {
  return (
    <AppText style={styles.textChoiceLabel} numberOfLines={1} adjustsFontSizeToFit>
      {choice.label}
    </AppText>
  );
}

function ColorNameChoice({ choice }) {
  return (
    <AppText style={styles.textChoiceLabel} numberOfLines={1} adjustsFontSizeToFit>
      {choice.label}
    </AppText>
  );
}

/* ------------------------------ ألعاب جاهزة ------------------------------ */

export function ListenGame() {
  return (
    <QuizGame
      activityId="listen"
      title="استمع واختر"
      subtitle="طوّر مهارة الاستماع للحروف"
      accent={PALETTE.sky}
      generate={makeListenRound}
      totalRounds={10}
      renderPrompt={(round, helpers) => <ListenPrompt round={round} helpers={helpers} />}
      renderChoice={(choice) => <LetterChoice choice={choice} />}
    />
  );
}

export function WordMatchGame() {
  return (
    <QuizGame
      activityId="wordMatch"
      title="اربط الكلمة"
      subtitle="اختر الكلمة التي تبدأ بالحرف"
      accent={PALETTE.mint}
      generate={makeWordMatchRound}
      totalRounds={10}
      renderPrompt={(round) => <WordMatchPrompt round={round} />}
      renderChoice={(choice) => <WordChoice choice={choice} />}
    />
  );
}

export function MissingGame() {
  return (
    <QuizGame
      activityId="missing"
      title="الحرف المفقود"
      subtitle="أكمل أول حرف في الكلمة"
      accent={PALETTE.amber}
      generate={makeMissingRound}
      totalRounds={10}
      renderPrompt={(round, helpers) => <MissingPrompt round={round} helpers={helpers} />}
      renderChoice={(choice) => <LetterChoice choice={choice} />}
    />
  );
}

export function SoundGame() {
  return (
    <QuizGame
      activityId="sound"
      title="طابق الصوت"
      subtitle="استمع إلى الكلمة وحدّد حرفها الأول"
      accent={PALETTE.lilac}
      generate={makeSoundRound}
      totalRounds={10}
      renderPrompt={(round, helpers) => <SoundPrompt round={round} helpers={helpers} />}
      renderChoice={(choice) => <LetterChoice choice={choice} />}
    />
  );
}

export function FormsGame() {
  return (
    <QuizGame
      activityId="forms"
      title="موقع الحرف"
      subtitle="أول الكلمة، وسطها أم آخرها؟"
      accent={PALETTE.rose}
      generate={makePositionRound}
      totalRounds={10}
      choiceColumns={1}
      renderPrompt={(round, helpers) => <PositionPrompt round={round} helpers={helpers} />}
      renderChoice={(choice) => <TextChoice choice={choice} emoji="📍" />}
    />
  );
}

export function OppositesGame() {
  return (
    <QuizGame
      activityId="opposites"
      title="الأضداد"
      subtitle="اكتشف الكلمة المعاكسة"
      accent={PALETTE.coral}
      generate={makeOppositeRound}
      totalRounds={10}
      renderPrompt={(round, helpers) => <OppositePrompt round={round} helpers={helpers} />}
      renderChoice={(choice) => <WordChoice choice={choice} />}
    />
  );
}

export function CountingGame() {
  return (
    <QuizGame
      activityId="counting"
      title="العدّ الممتع"
      subtitle="عُدّ الأشياء واختر الرقم"
      accent={PALETTE.mint}
      generate={makeCountingRound}
      totalRounds={10}
      renderPrompt={(round, helpers) => <CountingPrompt round={round} helpers={helpers} />}
      renderChoice={(choice) => <NumberChoice choice={choice} />}
    />
  );
}

export function ShapesGame() {
  return (
    <QuizGame
      activityId="shapes"
      title="الأشكال والألوان"
      subtitle="تعرّف على الأشكال والألوان"
      accent={PALETTE.sky}
      generate={makeShapeRound}
      totalRounds={10}
      renderPrompt={(round, helpers) => <ShapePrompt round={round} helpers={helpers} />}
      renderChoice={(choice) =>
        choice.shapeId ? <ShapeNameChoice choice={choice} /> : <ColorNameChoice choice={choice} />
      }
    />
  );
}

function TrainTrack({ index, total }) {
  const trackLeft = (value) => 7 + (value / Math.max(1, total)) * 84;
  return (
    <View style={styles.trackWrap}>
      <View style={styles.track}>
        <View style={styles.trackLine} />
        <View style={[styles.train, { left: `${Math.min(88, trackLeft(index))}%` }]}>
          <AppText style={styles.trainEmoji}>🚂</AppText>
        </View>
        {TRAIN_STATIONS.slice(0, total).map((station, stationIndex) => (
          <View
            key={`${station.word}-${stationIndex}`}
            style={[styles.station, { left: `${trackLeft(stationIndex)}%` }]}
          >
            <AppText style={styles.stationEmoji}>{stationIndex < index ? "✅" : station.emoji}</AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

export function TrainGame() {
  return (
    <QuizGame
      activityId="train"
      title="رحلة القطار"
      subtitle="أجب لتتحرك محطات القطار"
      accent={PALETTE.mint}
      generate={makeTrainRound}
      totalRounds={12}
      renderTop={(round, index) => <TrainTrack index={index} total={12} />}
      renderPrompt={(round, helpers) => (
        <View style={styles.promptCenter}>
          <AppText style={styles.bigEmoji}>{round.meta?.station?.emoji}</AppText>
          <AppText style={styles.trainWord}>{round.meta?.station?.word}</AppText>
          <AppText style={styles.promptHint}>اختر الحرف الأول لهذه الكلمة</AppText>
          <ReplayButton
            text={`أي حرف تبدأ به كلمة ${round.meta?.station?.word}؟`}
            label="استمع إلى الكلمة"
          />
        </View>
      )}
      renderChoice={(choice) => <LetterChoice choice={choice} />}
    />
  );
}

function MixedPrompt({ round }) {
  const { speak } = useApp();
  const helpers = { speak: () => speak(round.speech) };
  if (round.kind === "letters") return <ListenPrompt round={round} helpers={helpers} />;
  if (round.kind === "words") {
    return round.meta?.pair ? <OppositePrompt round={round} /> : <WordMatchPrompt round={round} />;
  }
  if (round.kind === "missing") return <MissingPrompt round={round} helpers={helpers} />;
  if (round.kind === "sound") return <SoundPrompt round={round} helpers={helpers} />;
  if (round.kind === "position") return <PositionPrompt round={round} />;
  if (round.kind === "count") return <CountingPrompt round={round} />;
  if (round.kind === "shapes") return <ShapePrompt round={round} />;
  return null;
}

function MixedChoice({ choice, round }) {
  if (round.kind === "count") return <NumberChoice choice={choice} />;
  if (round.kind === "position") return <TextChoice choice={choice} emoji="📍" />;
  if (round.kind === "shapes") {
    return choice.shapeId ? <ShapeNameChoice choice={choice} /> : <ColorNameChoice choice={choice} />;
  }
  if (round.kind === "words") return <WordChoice choice={choice} />;
  return <LetterChoice choice={choice} />;
}

export function QuickQuizGame() {
  return (
    <QuizGame
      activityId="quiz"
      title="التحدي السريع"
      subtitle="60 ثانية من الأسئلة المتنوعة"
      accent={PALETTE.coral}
      generate={makeQuickRound}
      totalRounds={60}
      timeLimit={60}
      renderPrompt={(round) => <MixedPrompt round={round} />}
      renderChoice={(choice, state, round) => <MixedChoice choice={choice} round={round} />}
    />
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.75 },
  promptCenter: { alignItems: "center", width: "100%" },
  promptTitle: { fontSize: 20, fontWeight: "900", color: PALETTE.ink, textAlign: "center", marginTop: 6 },
  promptHint: { fontSize: 13, color: PALETTE.inkSoft, fontWeight: "700", textAlign: "center", marginTop: 6 },
  bigSpeaker: {
    width: 104,
    height: 104,
    borderRadius: 34,
    backgroundColor: "#E1F2FF",
    alignItems: "center",
    justifyContent: "center",
    ...SHADOW_SOFT,
  },
  bigSpeakerIcon: { fontSize: 50 },
  bigLetter: { fontSize: 110, lineHeight: 126, fontWeight: "900", color: PALETTE.primary },
  bigEmoji: { fontSize: 84, lineHeight: 98 },
  replay: {
    flexDirection: ROW,
    alignItems: "center",
    backgroundColor: "#F2EEFF",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    marginTop: 10,
    gap: 6,
  },
  replayIcon: { fontSize: 17 },
  replayText: { fontSize: 12, fontWeight: "800", color: PALETTE.primaryDark },
  missingRow: { flexDirection: ROW, alignItems: "center", marginTop: 6, gap: 6 },
  missingRest: { fontSize: 52, fontWeight: "900", color: PALETTE.ink },
  positionWord: { fontSize: 46, fontWeight: "900", color: PALETTE.ink, marginTop: 6, textAlign: "center", width: "100%" },
  positionLetterRow: { flexDirection: ROW, alignItems: "center", gap: 8, marginTop: 8 },
  positionLetterChip: {
    minWidth: 52,
    height: 52,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: "#FFE7E2",
    borderWidth: 2,
    borderColor: PALETTE.coral,
    alignItems: "center",
    justifyContent: "center",
  },
  positionLetterBig: { fontSize: 32, fontWeight: "900", color: PALETTE.coral, textAlign: "center" },
  positionLetterLabel: { fontSize: 12, fontWeight: "800", color: PALETTE.inkSoft },
  oppositeWord: { fontSize: 40, fontWeight: "900", color: PALETTE.ink, marginTop: 4 },
  countGrid: {
    flexDirection: ROW,
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
    maxWidth: 300,
    minHeight: 60,
  },
  countEmoji: { fontSize: 34 },
  shapeWrap: { padding: 10, borderRadius: 28, backgroundColor: "#F7F3FF" },
  letterChoice: { fontSize: 40, fontWeight: "900", color: PALETTE.ink, textAlign: "center" },
  wordChoiceInner: { alignItems: "center", width: "100%" },
  wordChoiceEmoji: { fontSize: 34 },
  wordChoiceLabel: { fontSize: 17, fontWeight: "900", color: PALETTE.ink, marginTop: 4, textAlign: "center" },
  numberChoice: { fontSize: 44, fontWeight: "900", color: PALETTE.ink },
  textChoiceInner: { flexDirection: ROW, alignItems: "center", justifyContent: "center", gap: 8, width: "100%" },
  textChoiceEmoji: { fontSize: 18 },
  textChoiceLabel: { fontSize: 17, fontWeight: "900", color: PALETTE.ink, textAlign: "center", flexShrink: 1 },
  trackWrap: { marginTop: 12 },
  track: {
    height: 74,
    borderRadius: 18,
    backgroundColor: "#E8F7D9",
    borderWidth: 2,
    borderColor: "#B3D58D",
    position: "relative",
    overflow: "hidden",
  },
  trackLine: { position: "absolute", left: 10, right: 10, top: 42, height: 7, borderRadius: 999, backgroundColor: "#A9D676" },
  train: { position: "absolute", top: 6, marginLeft: -18 },
  trainEmoji: { fontSize: 30 },
  station: { position: "absolute", bottom: 4, marginLeft: -12 },
  stationEmoji: { fontSize: 17 },
  trainWord: { fontSize: 32, fontWeight: "900", color: PALETTE.ink, marginTop: 2 },
});
