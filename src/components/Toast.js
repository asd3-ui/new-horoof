import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { ROW, PALETTE, SHADOW  } from "../theme";

/** شريط إنجاز يظهر أعلى الشاشة ثم يختفي */
export default function Toast({ toast }) {
  const slide = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!toast) return undefined;
    slide.setValue(-120);
    opacity.setValue(0);
    Animated.parallel([
      Animated.spring(slide, { toValue: 0, useNativeDriver: true, friction: 7, tension: 70 }),
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();

    const hide = setTimeout(() => {
      Animated.parallel([
        Animated.timing(slide, { toValue: -120, duration: 260, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 260, useNativeDriver: true }),
      ]).start();
    }, 2400);

    return () => clearTimeout(hide);
  }, [toast, opacity, slide]);

  if (!toast) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.wrap, { opacity, transform: [{ translateY: slide }] }]}
    >
      <View style={styles.card}>
        <Text maxFontSizeMultiplier={1.3} style={styles.emoji}>{toast.emoji || "🎉"}</Text>
        <View style={styles.textWrap}>
          <Text maxFontSizeMultiplier={1.3} style={styles.title} numberOfLines={1}>{toast.title}</Text>
          {!!toast.detail && (
            <Text maxFontSizeMultiplier={1.3} style={styles.detail} numberOfLines={2}>{toast.detail}</Text>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    top: 10,
    left: 14,
    right: 14,
    zIndex: 50,
    alignItems: "center",
  },
  card: {
    flexDirection: ROW,
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 14,
    maxWidth: 520,
    width: "100%",
    borderWidth: 2,
    borderColor: "#FFE29A",
    ...SHADOW,
  },
  emoji: { fontSize: 28 },
  textWrap: { flex: 1 },
  title: { color: PALETTE.ink, fontWeight: "900", fontSize: 15, textAlign: "right" },
  detail: { color: PALETTE.inkSoft, fontSize: 12, marginTop: 2, textAlign: "right" },
});
