import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PALETTE, SHADOW, SHADOW_SOFT, useResponsive } from "../theme";

/** نص موحّد يمنع تكبير الخط المفرط الذي يكسر التصميم */
export function AppText({ style, children, ...rest }) {
  return (
    <Text maxFontSizeMultiplier={1.35} style={style} {...rest}>
      {children}
    </Text>
  );
}

/** إطار صفحة متجاوب مع تمرير آمن لجميع الهواتف */
export function Page({ children, scroll = true, contentStyle, style, ...rest }) {
  const { gutter, contentWidth } = useResponsive();
  const insets = useSafeAreaInsets();
  const inner = {
    width: "100%",
    maxWidth: contentWidth,
    alignSelf: "center",
    paddingHorizontal: gutter,
    paddingTop: 6,
    paddingBottom: 36 + (insets.bottom || 0),
  };

  if (!scroll) {
    return (
      <View style={[{ flex: 1 }, style]}>
        <View style={[inner, { flex: 1 }, contentStyle]}>{children}</View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[{ flex: 1 }, style]}
      contentContainerStyle={[inner, contentStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      {...rest}
    >
      {children}
    </ScrollView>
  );
}

export function ScreenHeader({ title, subtitle, onBack, right, emoji }) {
  return (
    <View style={styles.header}>
      {onBack ? (
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="رجوع"
          hitSlop={10}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <AppText style={styles.backIcon}>→</AppText>
        </Pressable>
      ) : (
        <View style={styles.backSpacer} />
      )}

      <View style={styles.headerText}>
        <AppText style={styles.headerTitle} numberOfLines={2}>
          {emoji ? `${emoji} ` : ""}
          {title}
        </AppText>
        {!!subtitle && (
          <AppText style={styles.headerSubtitle} numberOfLines={2}>
            {subtitle}
          </AppText>
        )}
      </View>

      {right || <View style={styles.backSpacer} />}
    </View>
  );
}

export function SectionTitle({ children, emoji, action, onAction }) {
  return (
    <View style={styles.sectionRow}>
      <View style={styles.sectionTextWrap}>
        <AppText style={styles.sectionTitle}>
          {emoji ? `${emoji} ` : ""}
          {children}
        </AppText>
      </View>
      {!!action && (
        <Pressable onPress={onAction} hitSlop={8} style={({ pressed }) => [pressed && styles.pressed]}>
          <AppText style={styles.sectionAction}>{action}</AppText>
        </Pressable>
      )}
    </View>
  );
}

export function Card({ children, style, color = "#FFFFFF", onPress, accessibilityLabel }) {
  const content = (
    <View style={[styles.card, { backgroundColor: color }, style]}>{children}</View>
  );
  if (!onPress) return content;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

export function PrimaryButton({
  label,
  onPress,
  emoji,
  color = PALETTE.primary,
  disabled = false,
  loading = false,
  style,
}) {
  return (
    <Pressable
      onPress={disabled || loading ? undefined : onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading }}
      style={({ pressed }) => [
        styles.primaryButton,
        { backgroundColor: disabled ? "#C9C3DE" : color },
        pressed && !disabled && styles.buttonPressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <AppText style={styles.primaryButtonText} numberOfLines={2}>
          {emoji ? `${emoji} ` : ""}
          {label}
        </AppText>
      )}
    </Pressable>
  );
}

export function GhostButton({ label, onPress, emoji, style, color = PALETTE.primarySoft, textColor = PALETTE.primaryDark }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.ghostButton,
        { backgroundColor: color },
        pressed && styles.buttonPressed,
        style,
      ]}
    >
      <AppText style={[styles.ghostButtonText, { color: textColor }]} numberOfLines={2}>
        {emoji ? `${emoji} ` : ""}
        {label}
      </AppText>
    </Pressable>
  );
}

export function Pill({ children, color = PALETTE.primarySoft, textColor = PALETTE.primaryDark, style }) {
  return (
    <View style={[styles.pill, { backgroundColor: color }, style]}>
      <AppText style={[styles.pillText, { color: textColor }]} numberOfLines={1}>
        {children}
      </AppText>
    </View>
  );
}

export function ProgressBar({ value = 0, color = PALETTE.primary, height = 12, trackColor = "#F0EAFB" }) {
  const safe = Math.max(0, Math.min(100, value));
  return (
    <View
      style={[styles.progressTrack, { height, backgroundColor: trackColor }]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(safe) }}
    >
      <View style={[styles.progressFill, { width: `${safe}%`, backgroundColor: color }]} />
    </View>
  );
}

export function StatCard({ value, label, emoji, color = "#FFFFFF" }) {
  return (
    <View style={[styles.statCard, { backgroundColor: color }]}>
      {!!emoji && <AppText style={styles.statEmoji}>{emoji}</AppText>}
      <AppText style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </AppText>
      <AppText style={styles.statLabel} numberOfLines={2}>
        {label}
      </AppText>
    </View>
  );
}

export function MascotBubble({ character, text, actionLabel, onAction }) {
  return (
    <View style={styles.mascotRow}>
      <View style={[styles.mascotFace, { backgroundColor: character?.accent || "#FFD9A8" }]}>
        <AppText style={styles.mascotEmoji}>{character?.emoji || "🐰"}</AppText>
      </View>
      <View style={styles.bubble}>
        <AppText style={styles.bubbleName}>{character?.name || "روبن"}</AppText>
        <AppText style={styles.bubbleText}>{text}</AppText>
        {!!actionLabel && (
          <Pressable onPress={onAction} hitSlop={6} style={({ pressed }) => [pressed && styles.pressed]}>
            <AppText style={styles.bubbleAction}>{actionLabel}</AppText>
          </Pressable>
        )}
      </View>
    </View>
  );
}

export function ActivityCard({ emoji, title, subtitle, color, tag, onPress, width, locked = false }) {
  return (
    <Pressable
      onPress={locked ? undefined : onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle || ""}`}
      style={({ pressed }) => [
        styles.activityCard,
        { backgroundColor: color, width },
        locked && styles.locked,
        pressed && !locked && styles.cardPressed,
      ]}
    >
      {!!tag && (
        <View style={styles.activityTag}>
          <AppText style={styles.activityTagText} numberOfLines={1}>
            {tag}
          </AppText>
        </View>
      )}
      <AppText style={styles.activityEmoji}>{locked ? "🔒" : emoji}</AppText>
      <AppText style={styles.activityTitle} numberOfLines={2}>
        {title}
      </AppText>
      {!!subtitle && (
        <AppText style={styles.activitySubtitle} numberOfLines={2}>
          {subtitle}
        </AppText>
      )}
    </Pressable>
  );
}

export function EmptyState({ emoji = "🌱", title, text }) {
  return (
    <View style={styles.empty}>
      <AppText style={styles.emptyEmoji}>{emoji}</AppText>
      <AppText style={styles.emptyTitle}>{title}</AppText>
      {!!text && <AppText style={styles.emptyText}>{text}</AppText>}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingVertical: 8,
    gap: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
    ...SHADOW_SOFT,
  },
  backIcon: { fontSize: 22, fontWeight: "900", color: PALETTE.primaryDark, marginTop: -2 },
  backSpacer: { width: 44, height: 44 },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: "900", color: PALETTE.ink, textAlign: "right" },
  headerSubtitle: { fontSize: 12, color: PALETTE.inkSoft, textAlign: "right", marginTop: 2 },
  sectionRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 22,
    marginBottom: 12,
    gap: 10,
  },
  sectionTextWrap: { flex: 1 },
  sectionTitle: { fontSize: 19, fontWeight: "900", color: PALETTE.ink, textAlign: "right" },
  sectionAction: { fontSize: 13, fontWeight: "800", color: PALETTE.primary },
  card: {
    borderRadius: 24,
    padding: 16,
    ...SHADOW_SOFT,
  },
  pressed: { opacity: 0.7 },
  buttonPressed: { transform: [{ scale: 0.98 }], opacity: 0.92 },
  cardPressed: { transform: [{ scale: 0.985 }], opacity: 0.95 },
  primaryButton: {
    minHeight: 54,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    ...SHADOW,
  },
  primaryButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "900", textAlign: "center" },
  ghostButton: {
    minHeight: 50,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  ghostButtonText: { fontSize: 15, fontWeight: "900", textAlign: "center" },
  pill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillText: { fontSize: 12, fontWeight: "800" },
  progressTrack: { width: "100%", borderRadius: 999, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 999 },
  statCard: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOW_SOFT,
  },
  statEmoji: { fontSize: 18, marginBottom: 2 },
  statValue: { fontSize: 22, fontWeight: "900", color: PALETTE.ink },
  statLabel: { fontSize: 11, color: PALETTE.inkSoft, marginTop: 2, textAlign: "center" },
  mascotRow: { flexDirection: "row-reverse", alignItems: "flex-start", gap: 10, marginTop: 14 },
  mascotFace: {
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  mascotEmoji: { fontSize: 32 },
  bubble: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 20,
    borderTopRightRadius: 6,
    padding: 12,
    ...SHADOW_SOFT,
  },
  bubbleName: { fontSize: 11, fontWeight: "900", color: PALETTE.primary, textAlign: "right" },
  bubbleText: { fontSize: 13, color: PALETTE.inkSoft, lineHeight: 20, marginTop: 3, textAlign: "right" },
  bubbleAction: { fontSize: 13, fontWeight: "900", color: PALETTE.primary, marginTop: 6, textAlign: "right" },
  activityCard: {
    borderRadius: 22,
    padding: 12,
    minHeight: 142,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOW_SOFT,
  },
  locked: { opacity: 0.5 },
  activityTag: {
    alignSelf: "flex-end",
    backgroundColor: "rgba(255,255,255,0.75)",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 4,
  },
  activityTagText: { fontSize: 9, color: PALETTE.inkSoft, fontWeight: "800" },
  activityEmoji: { fontSize: 34 },
  activityTitle: { fontWeight: "900", color: PALETTE.ink, marginTop: 6, textAlign: "center", fontSize: 14 },
  activitySubtitle: { fontSize: 10, color: PALETTE.inkSoft, textAlign: "center", marginTop: 4, lineHeight: 15 },
  empty: { alignItems: "center", paddingVertical: 26 },
  emptyEmoji: { fontSize: 44 },
  emptyTitle: { fontSize: 16, fontWeight: "900", color: PALETTE.ink, marginTop: 8, textAlign: "center" },
  emptyText: { fontSize: 12, color: PALETTE.inkSoft, marginTop: 6, textAlign: "center", lineHeight: 18 },
});
