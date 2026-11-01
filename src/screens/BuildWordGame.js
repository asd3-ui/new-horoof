import React, { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useApp } from "../context";
import { speakText, playSfx, buzz } from "../audio";
import { BUILD_WORDS } from "../data/games";
import { PALETTE, SHADOW_SOFT, gridItemWidth, useResponsive } from "../theme";
import { shuffled } from "../utils";
import {
  AppText,
  Card,
  GhostButton,
  Page,
  PrimaryButton,
  ProgressBar,
  ScreenHeader,
} from "../components/UI";

const SESSION_SIZE = 6;

function makeTiles(word) {
  return shuffled(
    Array.from(word).map((char, index) => ({
      id: `tile-${index}-${Math.random().toString(36).slice(2, 7)}`,
      char,
    }))
  );
}

export default function BuildWordGame() {
  const { navigate, addStars, recordActivity, celebrate } = useApp();
  const { contentWidth, gutter } = useResponsive();

  const [session, setSession] = useState(() => shuffled(BUILD_WORDS).slice(0, SESSION_SIZE));
  const [index, setIndex] = useState(0);
  const [placed, setPlaced] = useState([]);
  const [tiles, setTiles] = useState(() => makeTiles(session[0].word));
  const [wrongId, setWrongId] = useState(null);
  const [mistakes, setMistakes] = useState(0);
  const [done, setDone] = useState(false);
  const [flash, setFlash] = useState(false);

  const timeoutRef = useRef(null);
  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const current = session[index];
  const letters = Array.from(current?.word || "");
  const complete = placed.length === letters.length;

  useEffect(() => {
    if (!complete || done) return;
    setFlash(true);
    playSfx("success");
    buzz(20);
    speakText(`أحسنت! كلمة ${current.word}`);
    timeoutRef.current = setTimeout(() => {
      setFlash(false);
      if (index + 1 >= session.length) {
        const stars = mistakes <= 1 ? 3 : mistakes <= 4 ? 2 : 1;
        setDone(true);
        recordActivity("buildWord", session.length, session.length);
        addStars(stars);
        celebrate({
          title: "بنيت كل الكلمات! 🧱",
          detail: `أكملت ${session.length} كلمات وحصلت على ${stars} نجوم`,
          emoji: "🏆",
          confetti: true,
        });
      } else {
        setIndex((value) => value + 1);
        setPlaced([]);
        setTiles(makeTiles(session[index + 1].word));
        setWrongId(null);
      }
    }, 1100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complete]);

  const pressTile = (tile) => {
    if (complete || done) return;
    const expected = letters[placed.length];

    if (tile.char === expected) {
      setPlaced((value) => [...value, tile.char]);
      setTiles((value) => value.filter((item) => item.id !== tile.id));
      setWrongId(null);
      playSfx("pop");
      buzz(8);
      speakText(tile.char, { rate: 0.9 });
      return;
    }

    setMistakes((value) => value + 1);
    setWrongId(tile.id);
    playSfx("error");
    buzz(35);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setWrongId(null), 650);
  };

  const restart = () => {
    clearTimeout(timeoutRef.current);
    const fresh = shuffled(BUILD_WORDS).slice(0, SESSION_SIZE);
    setSession(fresh);
    setDone(false);
    setIndex(0);
    setPlaced([]);
    setTiles(makeTiles(fresh[0].word));
    setMistakes(0);
    setWrongId(null);
    setFlash(false);
  };

  const gap = 10;
  const tileWidth = Math.min(72, gridItemWidth(contentWidth, gutter, 5, gap));

  return (
    <Page>
      <ScreenHeader
        title="بنّاء الكلمات"
        subtitle="رتّب الحروف لتكوين الكلمة"
        onBack={() => navigate("games")}
        right={
          <View style={styles.counterPill}>
            <AppText style={styles.counterText}>{index + 1}/{session.length}</AppText>
          </View>
        }
      />

      <ProgressBar value={((index + (complete ? 1 : 0)) / session.length) * 100} color={PALETTE.amber} />

      {done ? (
        <Card style={styles.doneCard}>
          <AppText style={styles.doneEmoji}>🧱</AppText>
          <AppText style={styles.doneTitle}>بنّاء ماهر!</AppText>
          <AppText style={styles.doneText}>
            أكملت {session.length} كلمات. الأخطاء: {mistakes}
          </AppText>
          <PrimaryButton label="العب مرة أخرى" emoji="🔄" onPress={restart} color={PALETTE.amber} />
          <GhostButton label="العودة إلى الألعاب" emoji="🎮" onPress={() => navigate("games")} />
        </Card>
      ) : (
        <>
          <Card style={styles.wordCard}>
            <AppText style={styles.wordEmoji}>{current.emoji}</AppText>
            <AppText style={styles.wordHint}>ما هذه الكلمة؟</AppText>
            <Pressable
              onPress={() => speakText(current.word)}
              hitSlop={6}
              style={({ pressed }) => [styles.speaker, pressed && styles.pressed]}
            >
              <AppText style={styles.speakerText}>🔊 استمع إلى الكلمة</AppText>
            </Pressable>
          </Card>

          <View style={styles.slots}>
            {letters.map((char, position) => (
              <View
                key={`slot-${position}`}
                style={[
                  styles.slot,
                  placed[position] && styles.slotFilled,
                  flash && styles.slotFlash,
                ]}
              >
                <AppText style={styles.slotText}>{placed[position] || ""}</AppText>
              </View>
            ))}
          </View>

          <View style={[styles.tiles, { gap }]}>
            {tiles.map((tile) => (
              <Pressable
                key={tile.id}
                onPress={() => pressTile(tile)}
                disabled={complete}
                accessibilityRole="button"
                accessibilityLabel={`حرف ${tile.char}`}
                style={({ pressed }) => [
                  styles.tile,
                  { width: tileWidth, height: tileWidth },
                  wrongId === tile.id && styles.tileWrong,
                  pressed && styles.tilePressed,
                ]}
              >
                <AppText style={styles.tileText}>{tile.char}</AppText>
              </Pressable>
            ))}
          </View>

          {complete && (
            <AppText style={styles.successText}>✅ أحسنت! الكلمة صحيحة</AppText>
          )}

          <View style={styles.actions}>
            <GhostButton
              label="إعادة الكلمة"
              emoji="🔁"
              onPress={() => {
                clearTimeout(timeoutRef.current);
                setFlash(false);
                setPlaced([]);
                setTiles(makeTiles(current.word));
              }}
              style={styles.flexButton}
            />
            <GhostButton
              label="تخطّي"
              emoji="⏭️"
              onPress={() => {
                clearTimeout(timeoutRef.current);
                setFlash(false);
                const nextIndex = (index + 1) % session.length;
                setIndex(nextIndex);
                setPlaced([]);
                setTiles(makeTiles(session[nextIndex].word));
              }}
              style={styles.flexButton}
              color="#FFF1E2"
              textColor="#A45B12"
            />
          </View>
        </>
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  counterPill: { backgroundColor: "#FFF4CE", borderRadius: 14, paddingHorizontal: 10, paddingVertical: 7 },
  counterText: { fontSize: 13, fontWeight: "900", color: "#8A6200" },
  wordCard: { alignItems: "center", marginTop: 16 },
  wordEmoji: { fontSize: 74, lineHeight: 88 },
  wordHint: { fontSize: 14, fontWeight: "800", color: PALETTE.inkSoft, marginTop: 4 },
  speaker: {
    backgroundColor: "#F2EEFF",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 10,
  },
  speakerText: { fontSize: 12, fontWeight: "800", color: PALETTE.primaryDark },
  pressed: { opacity: 0.75 },
  slots: { flexDirection: "row-reverse", justifyContent: "center", flexWrap: "wrap", gap: 8, marginTop: 18 },
  slot: {
    width: 54,
    height: 62,
    borderRadius: 14,
    borderWidth: 3,
    borderStyle: "dashed",
    borderColor: "#D8CCF5",
    backgroundColor: "rgba(255,255,255,0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  slotFilled: { backgroundColor: "#E4F8E9", borderColor: "#2FA37B", borderStyle: "solid" },
  slotFlash: { backgroundColor: "#FFF4CE", borderColor: "#D99000" },
  slotText: { fontSize: 30, fontWeight: "900", color: PALETTE.ink },
  tiles: { flexDirection: "row-reverse", flexWrap: "wrap", justifyContent: "center", marginTop: 20 },
  tile: {
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#E7DFFF",
    ...SHADOW_SOFT,
  },
  tileWrong: { backgroundColor: "#FFE7E2", borderColor: "#E8604C" },
  tilePressed: { transform: [{ scale: 0.94 }] },
  tileText: { fontSize: 30, fontWeight: "900", color: PALETTE.ink },
  successText: { textAlign: "center", color: "#1F7A56", fontWeight: "900", fontSize: 16, marginTop: 14 },
  actions: { flexDirection: "row-reverse", gap: 10, marginTop: 6 },
  flexButton: { flex: 1 },
  doneCard: { alignItems: "center", marginTop: 18 },
  doneEmoji: { fontSize: 70 },
  doneTitle: { fontSize: 22, fontWeight: "900", color: PALETTE.ink, marginTop: 6 },
  doneText: { fontSize: 13, color: PALETTE.inkSoft, marginTop: 6, textAlign: "center" },
});
