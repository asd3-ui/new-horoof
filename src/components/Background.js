import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

const DECORATIONS = [
  { emoji: "☁️", left: "6%", top: 70, size: 30, duration: 5200 },
  { emoji: "☁️", left: "72%", top: 130, size: 26, duration: 6400 },
  { emoji: "⭐", left: "88%", top: 60, size: 20, duration: 4200 },
  { emoji: "✨", left: "14%", top: 210, size: 18, duration: 4800 },
  { emoji: "🌟", left: "82%", top: 300, size: 22, duration: 5600 },
  { emoji: "🎈", left: "4%", top: 360, size: 24, duration: 6000 },
  { emoji: "☁️", left: "44%", top: 30, size: 22, duration: 7000 },
];

function FloatingItem({ item, index }) {
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: item.duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: item.duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    const delay = setTimeout(() => loop.start(), index * 180);
    return () => {
      clearTimeout(delay);
      loop.stop();
    };
  }, [float, index, item.duration]);

  const translateY = float.interpolate({ inputRange: [0, 1], outputRange: [6, -14] });
  const rotate = float.interpolate({ inputRange: [0, 1], outputRange: ["-4deg", "6deg"] });
  const opacity = float.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0.9] });

  return (
    <Animated.Text
      style={[
        styles.item,
        {
          left: item.left,
          top: item.top,
          fontSize: item.size,
          opacity,
          transform: [{ translateY }, { rotate }],
        },
      ]}
    >
      {item.emoji}
    </Animated.Text>
  );
}

/** خلفية مرحة متحركة لا تعترض اللمس */
export default function Background() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={styles.orbOne} />
      <View style={styles.orbTwo} />
      <View style={styles.orbThree} />
      <View style={styles.orbFour} />
      {DECORATIONS.map((item, index) => (
        <FloatingItem key={`${item.emoji}-${index}`} item={item} index={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  item: { position: "absolute" },
  orbOne: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "#FFD7E9",
    opacity: 0.45,
    top: -90,
    right: -70,
  },
  orbTwo: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "#D6EEFF",
    opacity: 0.5,
    bottom: 90,
    left: -80,
  },
  orbThree: {
    position: "absolute",
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: "#FFF0AE",
    opacity: 0.4,
    top: "38%",
    right: -70,
  },
  orbFour: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#DFF7E8",
    opacity: 0.55,
    bottom: -40,
    right: "30%",
  },
});
