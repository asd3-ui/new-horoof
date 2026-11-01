import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useApp } from "../context";
import { LETTERS, LETTER_PACKS } from "../data/letters";
import { PALETTE, SHADOW_SOFT, gridItemWidth, useResponsive } from "../theme";
import { AppText, Page, ProgressBar, ScreenHeader } from "../components/UI";

export default function LettersScreen() {
  const { profile, navigate } = useApp();
  const { contentWidth, gutter } = useResponsive();
  const [packId, setPackId] = useState("all");

  const pack = LETTER_PACKS.find((item) => item.id === packId) || LETTER_PACKS[0];
  const letters = useMemo(
    () => LETTERS.filter((letter) => pack.letters.includes(letter.letter)),
    [pack]
  );

  const tileWidth = gridItemWidth(contentWidth, gutter, 4, 9);
  const learnedCount = profile.learned?.length || 0;

  return (
    <Page>
      <ScreenHeader
        title="تعلّم الحروف"
        subtitle="اختر حرفًا لتسمع اسمه وكلماته"
        onBack={() => navigate("home")}
      />

      <View style={styles.progressRow}>
        <AppText style={styles.progressText}>تعلمت {learnedCount} من 28 حرفًا</AppText>
        <AppText style={styles.progressText}>{Math.round((learnedCount / 28) * 100)}%</AppText>
      </View>
      <ProgressBar value={(learnedCount / 28) * 100} color={PALETTE.mint} />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.packRow}
        style={styles.packScroll}
      >
        {LETTER_PACKS.map((item) => {
          const active = item.id === packId;
          return (
            <Pressable
              key={item.id}
              onPress={() => setPackId(item.id)}
              style={[styles.packChip, active && styles.packChipActive]}
            >
              <AppText style={styles.packEmoji}>{item.emoji}</AppText>
              <AppText style={[styles.packText, active && styles.packTextActive]}>{item.name}</AppText>
            </Pressable>
          );
        })}
      </ScrollView>

      <AppText style={styles.packDescription}>{pack.description}</AppText>

      <View style={styles.grid}>
        {letters.map((letter) => {
          const learned = profile.learned?.includes(letter.id);
          return (
            <Pressable
              key={letter.id}
              onPress={() => navigate("letter", { letterId: letter.id })}
              accessibilityRole="button"
              accessibilityLabel={`حرف ${letter.name}`}
              style={({ pressed }) => [
                styles.tile,
                { width: tileWidth },
                learned && styles.tileLearned,
                pressed && styles.pressed,
              ]}
            >
              <AppText style={styles.tileLetter}>{letter.letter}</AppText>
              <AppText style={styles.tileName} numberOfLines={1} adjustsFontSizeToFit>
                {letter.name}
              </AppText>
              <AppText style={styles.tileStar}>{learned ? "⭐" : "○"}</AppText>
            </Pressable>
          );
        })}
      </View>

      <AppText style={styles.hint}>اضغط على أي حرف لتسمع نطقه وتشاهد أمثلته.</AppText>
    </Page>
  );
}

const styles = StyleSheet.create({
  progressRow: { flexDirection: "row-reverse", justifyContent: "space-between", marginTop: 6, marginBottom: 6 },
  progressText: { fontSize: 12, fontWeight: "800", color: PALETTE.inkSoft },
  packScroll: { marginTop: 14 },
  packRow: { gap: 8, paddingVertical: 2, paddingHorizontal: 2 },
  packChip: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderWidth: 2,
    borderColor: "transparent",
    ...SHADOW_SOFT,
  },
  packChipActive: { backgroundColor: "#EDE9FF", borderColor: PALETTE.primary },
  packEmoji: { fontSize: 16 },
  packText: { fontSize: 12, fontWeight: "800", color: PALETTE.inkSoft },
  packTextActive: { color: PALETTE.primaryDark },
  packDescription: { fontSize: 11, color: PALETTE.inkMuted, textAlign: "center", marginTop: 8 },
  grid: { flexDirection: "row-reverse", flexWrap: "wrap", justifyContent: "center", gap: 9, marginTop: 12 },
  tile: {
    minHeight: 88,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: "#EDE7F6",
    ...SHADOW_SOFT,
  },
  tileLearned: { backgroundColor: "#FFF8DC", borderColor: "#F0D787" },
  tileLetter: { fontSize: 32, fontWeight: "900", color: PALETTE.ink },
  tileName: { fontSize: 10, color: PALETTE.inkSoft, marginTop: 1, fontWeight: "700" },
  tileStar: { fontSize: 10, marginTop: 2 },
  pressed: { opacity: 0.75, transform: [{ scale: 0.97 }] },
  hint: { fontSize: 11, color: PALETTE.inkMuted, textAlign: "center", marginTop: 16 },
});
