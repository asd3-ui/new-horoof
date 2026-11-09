import React, { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useApp } from "../context";
import { FORM_NAMES, LETTERS, getLetterById } from "../data/letters";
import { ROW, LETTER_COLORS, PALETTE, SHADOW_SOFT, useResponsive  } from "../theme";
import {
  AppText,
  Card,
  GhostButton,
  Page,
  PrimaryButton,
  ScreenHeader,
} from "../components/UI";

export default function LetterScreen() {
  const { params, navigate, speak, markLearned, profile } = useApp();
  const { contentWidth, gutter } = useResponsive();

  const requestedId = Number(params?.letterId);
  const letterId = Number.isFinite(requestedId) ? requestedId : 0;
  const letter = getLetterById(letterId);
  const color = LETTER_COLORS[letter.id % LETTER_COLORS.length];
  // البطاقة الداخلية تضيف هامشًا 16 من كل جهة، لذا نحسب العرض المتاح لها فقط.
  const innerWidth = contentWidth - gutter * 2 - 32;
  const formWidth = Math.max(46, Math.floor((innerWidth - 8 * 3) / 4));

  useEffect(() => {
    markLearned(letterId);
    const timer = setTimeout(() => speak(`حرف ${letter.name}`), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [letterId]);

  const next = () => navigate("letter", { letterId: (letterId + 1) % LETTERS.length });
  const previous = () => navigate("letter", { letterId: (letterId + LETTERS.length - 1) % LETTERS.length });

  return (
    <Page>
      <ScreenHeader
        title={`حرف ${letter.name}`}
        subtitle={profile.learned?.includes(letterId) ? "⭐ حرف تعلمته" : "حرف جديد"}
        onBack={() => navigate("letters")}
        right={
          <Pressable
            onPress={() => speak(`حرف ${letter.name}. ${letter.words.map((item) => item.word).join("، ")}`)}
            style={({ pressed }) => [styles.speakerButton, pressed && styles.pressed]}
          >
            <AppText style={styles.speakerIcon}>🔊</AppText>
          </Pressable>
        }
      />

      <Card style={styles.heroCard}>
        <View style={[styles.letterCircle, { backgroundColor: `${color}18`, borderColor: `${color}55` }]}>
          <AppText style={[styles.bigLetter, { color }]}>{letter.letter}</AppText>
        </View>
        <AppText style={styles.letterName}>حرف {letter.name}</AppText>
        <AppText style={styles.tip}>{letter.tip}</AppText>

        <PrimaryButton
          label="استمع إلى الحرف"
          emoji="🔊"
          color={color}
          onPress={() => speak(`حرف ${letter.name}. ${letter.sound}`)}
        />
        <GhostButton
          label="اكتب الحرف بإصبعك"
          emoji="✍️"
          onPress={() => navigate("tracing", { mode: "letter", letterId })}
        />
      </Card>

      <AppText style={styles.sectionTitle}>أمثلة على حرف {letter.name}</AppText>
      <View style={styles.wordsRow}>
        {letter.words.map((entry) => (
          <Pressable
            key={entry.word}
            onPress={() => speak(`${entry.word}. يبدأ بحرف ${letter.name}`)}
            accessibilityRole="button"
            accessibilityLabel={`كلمة ${entry.word}`}
            style={({ pressed }) => [styles.wordCard, pressed && styles.pressed]}
          >
            <AppText style={styles.wordEmoji}>{entry.emoji}</AppText>
            <AppText style={styles.wordText} numberOfLines={1} adjustsFontSizeToFit>
              {entry.word}
            </AppText>
            <AppText style={styles.wordHint}>اضغط للسماع</AppText>
          </Pressable>
        ))}
      </View>

      <AppText style={styles.sectionTitle}>أشكال الحرف</AppText>
      <Card style={styles.formsCard}>
        <View style={styles.formsGrid}>
          {letter.forms.map((form, index) => (
            <View key={`${form}-${index}`} style={[styles.formCell, { width: formWidth }]}>
              <AppText style={[styles.formChar, { color }]}>{form}</AppText>
              <AppText style={styles.formLabel} numberOfLines={2}>
                {FORM_NAMES[index]}
              </AppText>
            </View>
          ))}
        </View>
        <AppText style={styles.formsHint}>
          يتغير شكل الحرف حسب موقعه في الكلمة: منفردًا، في البداية، في الوسط، أو في النهاية.
        </AppText>
        <GhostButton
          label="تدرّب على موقع الحرف"
          emoji="📍"
          onPress={() => navigate("forms")}
          color="#FFE8D6"
          textColor="#A45B12"
        />
      </Card>

      <View style={styles.pager}>
        <Pressable style={styles.navButton} onPress={previous}>
          <AppText style={styles.navText}>→ السابق</AppText>
        </Pressable>
        <Pressable style={styles.navButton} onPress={next}>
          <AppText style={styles.navText}>التالي ←</AppText>
        </Pressable>
      </View>

      <GhostButton label="العودة إلى كل الحروف" emoji="🔤" onPress={() => navigate("letters")} />
    </Page>
  );
}

const styles = StyleSheet.create({
  speakerButton: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: "#EDE9FF",
    alignItems: "center",
    justifyContent: "center",
  },
  speakerIcon: { fontSize: 20 },
  pressed: { opacity: 0.75 },
  heroCard: { alignItems: "center", marginTop: 8 },
  letterCircle: {
    width: 170,
    height: 170,
    borderRadius: 52,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  bigLetter: { fontSize: 118, lineHeight: 138, fontWeight: "900", includeFontPadding: false },
  letterName: { fontSize: 22, fontWeight: "900", color: PALETTE.ink, marginTop: 8 },
  tip: { fontSize: 12, color: PALETTE.inkSoft, textAlign: "center", marginTop: 6, lineHeight: 19 },
  sectionTitle: { fontSize: 18, fontWeight: "900", color: PALETTE.ink, textAlign: "center", marginTop: 20, marginBottom: 10 },
  wordsRow: { flexDirection: ROW, gap: 8 },
  wordCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EDE7F6",
    ...SHADOW_SOFT,
  },
  wordEmoji: { fontSize: 34 },
  wordText: { fontSize: 15, fontWeight: "900", color: PALETTE.ink, marginTop: 4, textAlign: "center" },
  wordHint: { fontSize: 8, color: PALETTE.inkMuted, marginTop: 2 },
  formsCard: { backgroundColor: "rgba(255,255,255,0.92)" },
  formsGrid: { flexDirection: ROW, flexWrap: "wrap", justifyContent: "center", gap: 8 },
  formCell: {
    backgroundColor: "#F8F5FF",
    borderRadius: 16,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EDE7F6",
  },
  formChar: { fontSize: 38, fontWeight: "900", lineHeight: 46 },
  formLabel: { fontSize: 9, fontWeight: "800", color: PALETTE.inkSoft, textAlign: "center", marginTop: 2 },
  formsHint: { fontSize: 11, color: PALETTE.inkSoft, textAlign: "center", lineHeight: 17, marginTop: 12 },
  pager: { flexDirection: ROW, gap: 10, marginTop: 14 },
  navButton: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingVertical: 13,
    borderRadius: 16,
    alignItems: "center",
    ...SHADOW_SOFT,
  },
  navText: { color: PALETTE.primaryDark, fontWeight: "800", fontSize: 12 },
});
