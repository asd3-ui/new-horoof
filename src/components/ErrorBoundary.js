import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { PALETTE } from "../theme";

/**
 * حاجز أخطاء يمنع إغلاق التطبيق فجأة عند حدوث خطأ في واجهة React،
 * ويعرض رسالة لطيفة للطفل مع زر إعادة المحاولة.
 */
export default class ErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.log("App render error:", error, info?.componentStack);
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <View style={styles.wrap}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.emoji}>🙈</Text>
          <Text style={styles.title}>حدثت مشكلة صغيرة</Text>
          <Text style={styles.text}>
            لا تقلق! اضغط على الزر للمحاولة من جديد، وسيبقى تقدمك محفوظًا.
          </Text>
          <Pressable
            onPress={this.reset}
            accessibilityRole="button"
            accessibilityLabel="إعادة المحاولة"
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          >
            <Text style={styles.buttonText}>🔄 إعادة المحاولة</Text>
          </Pressable>
          <Text style={styles.debug} numberOfLines={4}>
            {String(this.state.error?.message || this.state.error || "")}
          </Text>
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: PALETTE.bg },
  content: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },
  emoji: { fontSize: 64 },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: PALETTE.ink,
    textAlign: "center",
    marginTop: 12,
  },
  text: {
    fontSize: 14,
    lineHeight: 22,
    color: PALETTE.inkSoft,
    textAlign: "center",
    marginTop: 10,
  },
  button: {
    marginTop: 22,
    backgroundColor: PALETTE.primary,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "900" },
  pressed: { opacity: 0.85 },
  debug: {
    marginTop: 26,
    fontSize: 10,
    color: PALETTE.inkMuted,
    textAlign: "center",
  },
});
