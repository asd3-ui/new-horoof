import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import { useApp } from "../context";
import { speakText, playSfx, buzz } from "../audio";
import { LETTERS } from "../data/letters";
import { ROW, PALETTE, gridItemWidth, useResponsive  } from "../theme";
import { sample, shuffled } from "../utils";
import {
  AppText,
  Card,
  GhostButton,
  Page,
  PrimaryButton,
  ProgressBar,
  ScreenHeader,
} from "../components/UI";

const PAIRS = 8;

function buildDeck() {
  const letters = sample(LETTERS, PAIRS);
  const cards = letters.flatMap((letter) => [
    { key: `a-${letter.id}`, pair: `p-${letter.id}`, letter: letter.letter, name: letter.name },
    { key: `b-${letter.id}`, pair: `p-${letter.id}`, letter: letter.letter, name: letter.name },
  ]);
  return shuffled(cards);
}

function MemoryCard({ card, faceUp, matched, onPress, width }) {
  const flip = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(flip, {
      toValue: faceUp ? 1 : 0,
      duration: 260,
      useNativeDriver: true,
    }).start();
  }, [faceUp, flip]);

  const frontRotate = flip.interpolate({ inputRange: [0, 1], outputRange: ["180deg", "360deg"] });
  const backRotate = flip.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] });
  const frontOpacity = flip.interpolate({ inputRange: [0, 0.49, 0.5, 1], outputRange: [0, 0, 1, 1] });
  const backOpacity = flip.interpolate({ inputRange: [0, 0.49, 0.5, 1], outputRange: [1, 1, 0, 0] });

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={faceUp ? `حرف ${card.name}` : "بطاقة مقلوبة"}
      style={({ pressed }) => [{ width, height: width }, pressed && !faceUp && styles.pressed]}
    >
      <Animated.View
        style={[
          styles.cardFace,
          styles.cardBack,
          { opacity: backOpacity, transform: [{ perspective: 900 }, { rotateY: backRotate }] },
        ]}
      >
        <AppText style={styles.cardBackText}>؟</AppText>
      </Animated.View>
      <Animated.View
        style={[
          styles.cardFace,
          styles.cardFront,
          matched && styles.cardMatched,
          { opacity: frontOpacity, transform: [{ perspective: 900 }, { rotateY: frontRotate }] },
        ]}
      >
        <AppText style={styles.cardLetter} numberOfLines={1} adjustsFontSizeToFit>
          {card.letter}
        </AppText>
      </Animated.View>
    </Pressable>
  );
}

export default function MemoryGame() {
  const { navigate, addStars, recordActivity, celebrate } = useApp();
  const { contentWidth, gutter } = useResponsive();

  const [deck, setDeck] = useState(buildDeck);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [locked, setLocked] = useState(false);
  const [done, setDone] = useState(false);

  const flippedRef = useRef([]);
  const timeoutRef = useRef(null);
  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const found = matched.length;

  useEffect(() => {
    if (found !== PAIRS || done) return;
    setDone(true);
    const stars = moves <= 10 ? 3 : moves <= 16 ? 2 : 1;
    recordActivity("memory", PAIRS, PAIRS);
    addStars(stars);
    celebrate({
      title: "أكملت لعبة الذاكرة! 🧠",
      detail: `وجدت كل الأزواج في ${moves} محاولة وحصلت على ${stars} نجوم`,
      emoji: "🏆",
      confetti: true,
    });
    speakText("رائع! لقد وجدت كل الأزواج.");
  }, [addStars, celebrate, done, found, moves, recordActivity]);

  const pressCard = (card, index) => {
    if (locked || done) return;
    if (flippedRef.current.includes(index) || matched.includes(card.pair)) return;
    if (flippedRef.current.length >= 2) return;

    const next = [...flippedRef.current, index];
    flippedRef.current = next;
    setFlipped(next);
    playSfx("pop");
    buzz(8);

    if (next.length < 2) return;

    setMoves((value) => value + 1);
    const first = deck[next[0]];
    const second = deck[next[1]];

    if (first.pair === second.pair) {
      setMatched((current) => [...current, first.pair]);
      flippedRef.current = [];
      setFlipped([]);
      playSfx("success");
      speakText(`حرف ${first.name}`);
      return;
    }

    setLocked(true);
    timeoutRef.current = setTimeout(() => {
      flippedRef.current = [];
      setFlipped([]);
      setLocked(false);
    }, 820);
  };

  const restart = () => {
    clearTimeout(timeoutRef.current);
    flippedRef.current = [];
    setDeck(buildDeck());
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setLocked(false);
    setDone(false);
  };

  const gap = 8;
  const columns = 4;
  const cardWidth = Math.min(96, gridItemWidth(contentWidth, gutter, columns, gap));

  return (
    <Page>
      <ScreenHeader
        title="لعبة الذاكرة"
        subtitle="اقلب البطاقات وطابق الحروف المتشابهة"
        onBack={() => navigate("games")}
        right={
          <View style={styles.movesPill}>
            <AppText style={styles.movesText}>🔄 {moves}</AppText>
          </View>
        }
      />

      <View style={styles.progressRow}>
        <AppText style={styles.progressText}>الأزواج: {found} من {PAIRS}</AppText>
        <AppText style={styles.progressText}>⭐ {found * 2}</AppText>
      </View>
      <ProgressBar value={(found / PAIRS) * 100} color={PALETTE.lilac} />

      {done ? (
        <Card style={styles.doneCard}>
          <AppText style={styles.doneEmoji}>🧠</AppText>
          <AppText style={styles.doneTitle}>ذاكرة رائعة!</AppText>
          <AppText style={styles.doneText}>وجدت كل الأزواج في {moves} محاولة.</AppText>
          <View style={styles.starsRow}>
            {[0, 1, 2].map((item) => (
              <AppText
                key={item}
                style={[styles.star, item < (moves <= 10 ? 3 : moves <= 16 ? 2 : 1) ? styles.starOn : styles.starOff]}
              >
                ⭐
              </AppText>
            ))}
          </View>
          <PrimaryButton label="العب مرة أخرى" emoji="🔄" onPress={restart} color={PALETTE.lilac} />
          <GhostButton label="العودة إلى الألعاب" emoji="🎮" onPress={() => navigate("games")} />
        </Card>
      ) : (
        <View style={[styles.grid, { gap }]}>
          {deck.map((card, index) => (
            <MemoryCard
              key={card.key}
              card={card}
              width={cardWidth}
              faceUp={flipped.includes(index) || matched.includes(card.pair)}
              matched={matched.includes(card.pair)}
              onPress={() => pressCard(card, index)}
            />
          ))}
        </View>
      )}

      {!done && (
        <View style={styles.actions}>
          <GhostButton label="خلط البطاقات" emoji="🔀" onPress={restart} style={styles.flexButton} />
          <GhostButton
            label="العودة"
            emoji="🎮"
            onPress={() => navigate("games")}
            style={styles.flexButton}
            color="#FFF1E2"
            textColor="#A45B12"
          />
        </View>
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  movesPill: { backgroundColor: "#F1E8FF", borderRadius: 14, paddingHorizontal: 10, paddingVertical: 7 },
  movesText: { fontSize: 13, fontWeight: "900", color: PALETTE.lilac },
  progressRow: { flexDirection: ROW, justifyContent: "space-between", marginTop: 6, marginBottom: 6 },
  progressText: { fontSize: 12, fontWeight: "800", color: PALETTE.inkSoft },
  grid: { flexDirection: ROW, flexWrap: "wrap", justifyContent: "center", marginTop: 16 },
  cardFace: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backfaceVisibility: "hidden",
    borderWidth: 2,
  },
  cardBack: { backgroundColor: "#8A5BD6", borderColor: "#7450B8" },
  cardBackText: { fontSize: 30, fontWeight: "900", color: "#E9DEFF" },
  cardFront: { backgroundColor: "#FFFFFF", borderColor: "#DCCFF8" },
  cardMatched: { backgroundColor: "#DFF7E8", borderColor: "#2FA37B" },
  cardLetter: { fontSize: 36, fontWeight: "900", color: PALETTE.ink },
  pressed: { opacity: 0.8 },
  actions: { flexDirection: ROW, gap: 10, marginTop: 10 },
  flexButton: { flex: 1 },
  doneCard: { alignItems: "center", marginTop: 18 },
  doneEmoji: { fontSize: 70 },
  doneTitle: { fontSize: 22, fontWeight: "900", color: PALETTE.ink, marginTop: 6 },
  doneText: { fontSize: 13, color: PALETTE.inkSoft, marginTop: 6, textAlign: "center" },
  starsRow: { flexDirection: "row", gap: 6, marginTop: 10, marginBottom: 8 },
  star: { fontSize: 38 },
  starOn: { opacity: 1 },
  starOff: { opacity: 0.2 },
});
