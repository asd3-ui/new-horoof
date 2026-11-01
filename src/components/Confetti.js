import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, useWindowDimensions, View } from "react-native";

const EMOJIS = ["⭐", "✨", "🎉", "🌟", "💫", "🎊", "🏅", "💛"];

function Piece({ piece }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: piece.duration,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [piece.duration, progress]);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-30, piece.travel],
  });
  const translateX = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, piece.drift, piece.drift * 0.4],
  });
  const opacity = progress.interpolate({
    inputRange: [0, 0.15, 0.75, 1],
    outputRange: [0, 1, 1, 0],
  });
  const rotate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", `${piece.spin}deg`],
  });
  const scale = progress.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: [0.4, 1.15, 0.9],
  });

  return (
    <Animated.Text
      style={[
        styles.piece,
        {
          left: piece.left,
          top: piece.top,
          fontSize: piece.size,
          opacity,
          transform: [{ translateY }, { translateX }, { rotate }, { scale }],
        },
      ]}
    >
      {piece.emoji}
    </Animated.Text>
  );
}

/** انفجار نجوم واحتفال عند الإجابة الصحيحة */
export default function Confetti({ burst }) {
  const { width, height } = useWindowDimensions();

  const pieces = useMemo(() => {
    if (!burst || !burst.id) return [];
    return Array.from({ length: 18 }, (_, index) => ({
      id: `${burst.id}-${index}`,
      emoji: EMOJIS[index % EMOJIS.length],
      left: `${8 + ((index * 37) % 84)}%`,
      top: `${10 + ((index * 23) % 40)}%`,
      size: 18 + (index % 4) * 5,
      drift: (index % 2 === 0 ? 1 : -1) * (20 + (index % 5) * 14),
      travel: Math.min(height * 0.7, 420) + (index % 3) * 40,
      spin: 180 + index * 22,
      duration: 1300 + (index % 4) * 180,
    }));
  }, [burst, height]);

  if (!pieces.length) return null;

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { width }]}>
      {pieces.map((piece) => (
        <Piece key={piece.id} piece={piece} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  piece: { position: "absolute" },
});
