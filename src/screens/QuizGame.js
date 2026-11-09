import React, { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import { useApp } from "../context";
import { speakText, playSfx, buzz, speakSequence } from "../audio";
import { ROW, PALETTE, SHADOW_SOFT, gridItemWidth, useResponsive  } from "../theme";
import {
  AppText,
  Card,
  GhostButton,
  Page,
  PrimaryButton,
  ProgressBar,
  ScreenHeader,
} from "../components/UI";

const PRAISE = ["أحسنت!", "رائع جدًا!", "ممتاز!", "أنت بطل!", "إجابة صحيحة!", "مذهل!"];

function ChoiceButton({ choice, width, state, onPress, children }) {
  const shake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (state.isWrong) {
      shake.setValue(0);
      Animated.sequence([
        Animated.timing(shake, { toValue: 1, duration: 60, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -1, duration: 60, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 1, duration: 60, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();
    }
  }, [shake, state.isWrong]);

  const translateX = shake.interpolate({ inputRange: [-1, 1], outputRange: [-9, 9] });

  return (
    <Animated.View style={{ width, transform: [{ translateX }] }}>
      <Pressable
        onPress={onPress}
        disabled={state.disabled}
        accessibilityRole="button"
        accessibilityLabel={choice.label}
        style={({ pressed }) => [
          styles.choice,
          state.isSpeaking && styles.choiceSpeaking,
          state.isCorrect && styles.choiceCorrect,
          state.isWrong && styles.choiceWrong,
          pressed && !state.disabled && styles.choicePressed,
        ]}
      >
        {children}
        {state.isSpeaking && <AppText style={styles.choiceSpeakingMark}>🔊</AppText>}
        {state.isCorrect && <AppText style={styles.choiceMark}>✓</AppText>}
        {state.isWrong && <AppText style={styles.choiceMarkWrong}>✕</AppText>}
      </Pressable>
    </Animated.View>
  );
}

/**
 * محرّك لعبة الأسئلة الموحّد.
 * يستخدمه أكثر من عشر ألعاب تعليمية لتقليل التكرار وتوحيد التجربة.
 */
export default function QuizGame({
  activityId,
  title,
  subtitle,
  accent = PALETTE.primary,
  generate,
  totalRounds = 10,
  timeLimit = 0,
  choiceColumns = 2,
  renderPrompt,
  renderChoice,
  promptSpeech,
  renderTop,
  finishLabel = "العودة إلى الألعاب",
}) {
  const { navigate, addStars, recordActivity, celebrate, profile } = useApp();
  const { contentWidth, gutter } = useResponsive();

  const [index, setIndex] = useState(0);
  const [round, setRound] = useState(() => generate());
  const [correctCount, setCorrectCount] = useState(0);
  const [solvedKey, setSolvedKey] = useState(null);
  const [wrongKey, setWrongKey] = useState(null);
  const [done, setDone] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timeLimit);

  const correctRef = useRef(0);
  const doneRef = useRef(false);
  const solvedRef = useRef(false);
  const advancingRef = useRef(false);
  const advanceTimer = useRef(null);
  const wrongTimer = useRef(null);
  const readAllRef = useRef(null);
  const [speakingKey, setSpeakingKey] = useState(null);

  const clearTimers = useCallback(() => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    if (wrongTimer.current) clearTimeout(wrongTimer.current);
    advanceTimer.current = null;
    wrongTimer.current = null;
  }, []);

  const cancelReading = useCallback(() => {
    if (readAllRef.current) {
      readAllRef.current();
      readAllRef.current = null;
    }
    setSpeakingKey(null);
  }, []);

  /** إيقاف القراءة عند مغادرة الشاشة */
  useEffect(() => cancelReading, [cancelReading]);

  /** القارئ الكامل: يقرأ السؤال ثم كل خيار بالتدريج مع تظليل الخيار أثناء نطقه */
  const speakRound = useCallback(() => {
    if (doneRef.current) return;
    cancelReading();
    const promptText = (promptSpeech ? promptSpeech(round) : round?.speech) || round?.prompt;
    const items = [];
    if (promptText) items.push({ key: "prompt", text: promptText });
    (round?.choices || []).forEach((choice) => {
      if (choice.speech || choice.label) {
        items.push({ key: choice.key, text: choice.speech || choice.label });
      }
    });
    if (!items.length) return;
    readAllRef.current = speakSequence(items, {
      startDelayMs: 380,
      gapMs: 640,
      onStartItem: (item) => setSpeakingKey(item.key),
      onDone: () => setSpeakingKey(null),
    });
  }, [cancelReading, promptSpeech, round]);

  // إلغاء القراءة عند مغادرة الشاشة (مرة أخيرة كحماية مزدوجة)
  useEffect(() => {
    return () => {
      if (readAllRef.current) {
        readAllRef.current();
        readAllRef.current = null;
      }
    };
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  // جولة جديدة عند تغيّر المؤشر
  useEffect(() => {
    setRound(generate());
    setSolvedKey(null);
    setWrongKey(null);
    solvedRef.current = false;
    advancingRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  // قراءة السؤال ثم الخيارات تلقائيًا عند ظهور كل جولة
  useEffect(() => {
    if (doneRef.current) return undefined;
    speakRound();
    return () => {
      if (readAllRef.current) {
        readAllRef.current();
        readAllRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round?.key]);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    clearTimers();
    cancelReading();

    const score = correctRef.current;
    let stars = 0;
    if (timeLimit) {
      stars = score >= 12 ? 3 : score >= 6 ? 2 : score >= 1 ? 1 : 0;
    } else {
      stars = score >= totalRounds ? 3 : score >= Math.ceil(totalRounds * 0.6) ? 2 : score >= 1 ? 1 : 0;
    }

    setDone(true);
    recordActivity(activityId, score, totalRounds);
    if (stars > 0) addStars(stars);
    celebrate({
      title: stars >= 3 ? "أداء مثالي! 🏆" : "أحسنت!",
      detail: `أجبت إجابة صحيحة على ${score} سؤالًا وحصلت على ${stars} نجوم`,
      emoji: stars >= 3 ? "🏆" : "🎉",
      confetti: true,
    });
    if (stars >= 2) speakText("أحسنت! لقد أكملت اللعبة بنجاح.");
  }, [activityId, addStars, celebrate, clearTimers, cancelReading, recordActivity, timeLimit, totalRounds]);

  // مؤقت التحدي السريع
  useEffect(() => {
    if (!timeLimit || done) return undefined;
    const interval = setInterval(() => {
      setTimeLeft((current) => (current > 0 ? current - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [done, timeLimit]);

  useEffect(() => {
    if (timeLimit && timeLeft === 0 && !doneRef.current) {
      finish();
    }
  }, [finish, timeLeft, timeLimit]);

  const advance = useCallback(() => {
    if (doneRef.current || advancingRef.current) return;
    advancingRef.current = true;
    // منع الانتقال مرتين إذا ضغط الطفل زر "السؤال التالي" قبل انتهاء المؤقت.
    if (advanceTimer.current) {
      clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
    }
    if (!timeLimit && index + 1 >= totalRounds) {
      finish();
      return;
    }
    setIndex((current) => current + 1);
  }, [finish, index, timeLimit, totalRounds]);

  const choose = (choice) => {
    if (done || solvedRef.current) return;
    // يتوقف القارئ فورًا عند لمس الخيار
    cancelReading();

    if (choice.key === round.correctKey) {
      solvedRef.current = true;
      setSolvedKey(choice.key);
      setWrongKey(null);
      const nextScore = correctRef.current + 1;
      correctRef.current = nextScore;
      setCorrectCount(nextScore);
      playSfx("success");
      buzz(16);
      speakText(PRAISE[nextScore % PRAISE.length], { rate: 0.9, pitch: 1.2 });
      celebrate({
        title: "إجابة صحيحة",
        detail: round.correctLabel || choice.label,
        emoji: "⭐",
        confetti: false,
      });
      advanceTimer.current = setTimeout(advance, 1050);
      return;
    }

    setWrongKey(choice.key);
    playSfx("error");
    buzz(40);
    if (wrongTimer.current) clearTimeout(wrongTimer.current);
    wrongTimer.current = setTimeout(() => setWrongKey(null), 700);
  };

  const restart = () => {
    clearTimers();
    cancelReading();
    doneRef.current = false;
    correctRef.current = 0;
    solvedRef.current = false;
    advancingRef.current = false;
    setDone(false);
    setCorrectCount(0);
    setSolvedKey(null);
    setWrongKey(null);
    setTimeLeft(timeLimit);
    setIndex(0);
    setRound(generate());
  };

  const columns = choiceColumns;
  const gap = 10;
  const choiceWidth =
    columns === 1 ? contentWidth - gutter * 2 : gridItemWidth(contentWidth, gutter, columns, gap);

  const progress = timeLimit
    ? Math.round((timeLeft / timeLimit) * 100)
    : Math.round((index / totalRounds) * 100);

  if (done) {
    const stars = timeLimit
      ? correctCount >= 12
        ? 3
        : correctCount >= 6
          ? 2
          : correctCount >= 1
            ? 1
            : 0
      : correctCount >= totalRounds
        ? 3
        : correctCount >= Math.ceil(totalRounds * 0.6)
          ? 2
          : correctCount >= 1
            ? 1
            : 0;

    return (
      <Page contentStyle={styles.resultPage}>
        <ScreenHeader title={title} subtitle="نتيجة اللعبة" onBack={() => navigate("games")} />
        <Card style={[styles.resultCard, { borderColor: accent }]}>
          <AppText style={styles.resultEmoji}>{stars >= 3 ? "🏆" : stars >= 2 ? "🎉" : stars >= 1 ? "🌟" : "🌱"}</AppText>
          <AppText style={styles.resultTitle}>
            {stars >= 3 ? "مذهل! نتيجة مثالية" : stars >= 1 ? "أحسنت! أكملت اللعبة" : "لا بأس، حاول مرة أخرى"}
          </AppText>
          <View style={styles.starsRow}>
            {[0, 1, 2].map((item) => (
              <AppText key={item} style={[styles.resultStar, item < stars ? styles.starOn : styles.starOff]}>
                ⭐
              </AppText>
            ))}
          </View>
          <View style={styles.resultStats}>
            <View style={styles.resultStat}>
              <AppText style={styles.resultStatValue}>{correctCount}</AppText>
              <AppText style={styles.resultStatLabel}>إجابة صحيحة</AppText>
            </View>
            <View style={styles.resultStat}>
              <AppText style={styles.resultStatValue}>
                {timeLimit ? `${timeLimit} ث` : totalRounds}
              </AppText>
              <AppText style={styles.resultStatLabel}>
                {timeLimit ? "مدة التحدي" : "أسئلة الجولة"}
              </AppText>
            </View>
            <View style={styles.resultStat}>
              <AppText style={styles.resultStatValue}>{stars}</AppText>
              <AppText style={styles.resultStatLabel}>نجوم</AppText>
            </View>
          </View>
          <PrimaryButton label="العب مرة أخرى" emoji="🔄" onPress={restart} color={accent} />
          <GhostButton label={finishLabel} emoji="🏠" onPress={() => navigate("games")} />
        </Card>
      </Page>
    );
  }

  return (
    <Page>
      <ScreenHeader
        title={title}
        subtitle={subtitle}
        onBack={() => navigate("games")}
        right={
          <View style={styles.scorePill}>
            <AppText style={styles.scoreText}>⭐ {profile.stars}</AppText>
          </View>
        }
      />

      <View style={styles.progressRow}>
        <AppText style={styles.progressLabel}>
          {timeLimit ? `⏱️ ${timeLeft} ثانية` : `السؤال ${index + 1} من ${totalRounds}`}
        </AppText>
        <AppText style={styles.progressLabel}>✅ {correctCount}</AppText>
      </View>
      <ProgressBar
        value={timeLimit ? progress : progress}
        color={timeLimit && timeLeft <= 10 ? PALETTE.coral : accent}
        height={10}
      />

      {renderTop ? renderTop(round, index) : null}

      <Card
        style={[
          styles.promptCard,
          speakingKey === "prompt" && styles.promptCardSpeaking,
        ]}
      >
        {renderPrompt ? (
          renderPrompt(round, { speak: speakRound })
        ) : (
          <View style={styles.defaultPrompt}>
            {round.meta?.letter ? (
              <AppText style={styles.defaultLetter}>{round.meta.letter.letter}</AppText>
            ) : (
              <AppText style={styles.defaultEmoji}>{round.meta?.word?.emoji || round.meta?.pair?.emoji || "❓"}</AppText>
            )}
            <AppText style={styles.promptText}>{round.prompt}</AppText>
          </View>
        )}
      </Card>

      <View style={[styles.choices, { gap }]}>
        {round.choices.map((choice) => {
          const state = {
            isCorrect: solvedKey === choice.key,
            isWrong: wrongKey === choice.key,
            isSpeaking: speakingKey === choice.key,
            disabled: !!solvedKey,
          };
          return (
            <ChoiceButton
              key={choice.key}
              choice={choice}
              width={choiceWidth}
              state={state}
              onPress={() => choose(choice)}
            >
              {renderChoice ? (
                renderChoice(choice, state, round)
              ) : (
                <AppText style={styles.choiceLetter} numberOfLines={1} adjustsFontSizeToFit>
                  {choice.emoji ? `${choice.emoji}\n${choice.label}` : choice.label}
                </AppText>
              )}
            </ChoiceButton>
          );
        })}
      </View>

      <View style={styles.feedbackArea}>
        {!!solvedKey && (
          <AppText style={styles.feedbackOk}>✅ إجابة صحيحة! {round.correctLabel}</AppText>
        )}
        {!!wrongKey && <AppText style={styles.feedbackTry}>حاول مرة أخرى، أنت تستطيع 💪</AppText>}
        {!solvedKey && !wrongKey && (
          <AppText style={styles.feedbackHint}>اختر الإجابة الصحيحة من البطاقات</AppText>
        )}
      </View>

      {!!solvedKey && (
        <PrimaryButton label="السؤال التالي" emoji="➜" onPress={advance} color={accent} />
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  scorePill: {
    backgroundColor: "#FFF4C6",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "#F0D787",
  },
  scoreText: { fontSize: 13, fontWeight: "900", color: PALETTE.ink },
  progressRow: { flexDirection: ROW, justifyContent: "space-between", marginTop: 6, marginBottom: 6 },
  progressLabel: { fontSize: 12, fontWeight: "800", color: PALETTE.inkSoft },
  promptCard: { marginTop: 14, alignItems: "center", backgroundColor: "rgba(255,255,255,0.92)" },
  promptCardSpeaking: { borderColor: "#ECB64F", borderWidth: 2, backgroundColor: "#FFFDF3" },
  defaultPrompt: { alignItems: "center" },
  defaultLetter: { fontSize: 96, fontWeight: "900", color: PALETTE.primary, lineHeight: 112 },
  defaultEmoji: { fontSize: 78, lineHeight: 92 },
  promptText: { fontSize: 14, fontWeight: "800", color: PALETTE.inkSoft, textAlign: "center", marginTop: 6 },
  choices: { flexDirection: ROW, flexWrap: "wrap", justifyContent: "center", marginTop: 16 },
  choice: {
    minHeight: 86,
    borderRadius: 20,
    backgroundColor: "#F3EEFF",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 2,
    borderColor: "rgba(108, 92, 231, 0.12)",
    ...SHADOW_SOFT,
  },
  choiceCorrect: { backgroundColor: "#DFF7E8", borderColor: "#2FA37B" },
  choiceWrong: { backgroundColor: "#FFE7E2", borderColor: "#E8604C" },
  choiceSpeaking: { backgroundColor: "#FFF6D8", borderColor: "#ECB64F", borderWidth: 3 },
  choiceSpeakingMark: { position: "absolute", top: 6, right: 8, fontSize: 13 },
  choicePressed: { transform: [{ scale: 0.97 }], opacity: 0.9 },
  choiceLetter: { fontSize: 34, fontWeight: "900", color: PALETTE.ink, textAlign: "center" },
  choiceMark: {
    position: "absolute",
    top: 4,
    left: 8,
    fontSize: 14,
    fontWeight: "900",
    color: "#2FA37B",
  },
  choiceMarkWrong: {
    position: "absolute",
    top: 4,
    left: 8,
    fontSize: 14,
    fontWeight: "900",
    color: "#E8604C",
  },
  feedbackArea: { minHeight: 44, justifyContent: "center", marginTop: 10 },
  feedbackOk: { textAlign: "center", color: "#1F7A56", fontWeight: "900", fontSize: 15 },
  feedbackTry: { textAlign: "center", color: "#B4442F", fontWeight: "900", fontSize: 15 },
  feedbackHint: { textAlign: "center", color: PALETTE.inkMuted, fontWeight: "700", fontSize: 12 },
  resultPage: { paddingTop: 10 },
  resultCard: { alignItems: "center", borderWidth: 3, marginTop: 10 },
  resultEmoji: { fontSize: 76 },
  resultTitle: { fontSize: 20, fontWeight: "900", color: PALETTE.ink, textAlign: "center", marginTop: 8 },
  starsRow: { flexDirection: "row", gap: 6, marginTop: 10 },
  resultStar: { fontSize: 38 },
  starOn: { opacity: 1 },
  starOff: { opacity: 0.22 },
  resultStats: { flexDirection: ROW, gap: 8, marginTop: 16, marginBottom: 8, width: "100%" },
  resultStat: { flex: 1, alignItems: "center", backgroundColor: "#F7F3FF", borderRadius: 16, paddingVertical: 10 },
  resultStatValue: { fontSize: 22, fontWeight: "900", color: PALETTE.ink },
  resultStatLabel: { fontSize: 10, color: PALETTE.inkSoft, marginTop: 2, textAlign: "center" },
});
