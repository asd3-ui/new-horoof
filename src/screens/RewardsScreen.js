import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useApp } from "../context";
import { BADGES, STICKERS, getLevelInfo, unlockedStickers } from "../data/rewards";
import { PALETTE, SHADOW_SOFT, useResponsive } from "../theme";
import {
  AppText,
  Card,
  Page,
  PrimaryButton,
  ProgressBar,
  ScreenHeader,
  SectionTitle,
} from "../components/UI";

export default function RewardsScreen() {
  const { profile, navigate, speak } = useApp();
  const { contentWidth, gutter } = useResponsive();
  const level = getLevelInfo(profile.stars);
  const unlocked = BADGES.filter((badge) => badge.check(profile));
  const stickers = unlockedStickers(profile);
  const badgeWidth = Math.min(118, Math.floor((contentWidth - gutter * 2 - 18) / 3));

  return (
    <Page>
      <ScreenHeader
        title="المكافآت"
        subtitle="شارات وملصقات تجمعها مع كل إنجاز"
        onBack={() => navigate("home")}
        right={
          <View style={styles.starPill}>
            <AppText style={styles.starPillText}>⭐ {profile.stars}</AppText>
          </View>
        }
      />

      <Card style={[styles.levelCard, { backgroundColor: level.unlocked.color }]}>
        <AppText style={styles.levelEmoji}>{level.unlocked.emoji}</AppText>
        <AppText style={styles.levelName}>{level.unlocked.name}</AppText>
        <AppText style={styles.levelLevel}>المستوى {level.unlocked.level}</AppText>
        <ProgressBar value={level.progress} color={PALETTE.primary} height={12} trackColor="rgba(255,255,255,0.6)" />
        <AppText style={styles.levelHint}>
          {level.nextLevel ? `${level.remaining} نجمة حتى المستوى التالي` : "وصلت إلى القمة! 🎉"}
        </AppText>
      </Card>

      <SectionTitle emoji="🏅">
        الشارات ({unlocked.length}/{BADGES.length})
      </SectionTitle>
      <View style={styles.badgesGrid}>
        {BADGES.map((badge) => {
          const isUnlocked = badge.check(profile);
          return (
            <Pressable
              key={badge.id}
              onPress={() =>
                speak(isUnlocked ? `شارة ${badge.title}` : `لتفتح شارة ${badge.title}، ${badge.hint}`)
              }
              style={[styles.badgeCard, { width: badgeWidth }, !isUnlocked && styles.locked]}
            >
              <AppText style={styles.badgeIcon}>{isUnlocked ? badge.icon : "🔒"}</AppText>
              <AppText style={styles.badgeTitle} numberOfLines={2}>
                {badge.title}
              </AppText>
              <AppText style={styles.badgeHint} numberOfLines={2}>
                {badge.hint}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      <SectionTitle emoji="✨">
        ألبوم الملصقات ({stickers.length}/{STICKERS.length})
      </SectionTitle>
      <View style={styles.stickersGrid}>
        {STICKERS.map((sticker) => {
          const isUnlocked = sticker.condition(profile);
          return (
            <View key={sticker.id} style={[styles.sticker, !isUnlocked && styles.lockedSticker]}>
              <AppText style={[styles.stickerEmoji, !isUnlocked && styles.stickerLockedEmoji]}>
                {isUnlocked ? sticker.emoji : "❔"}
              </AppText>
              <AppText style={styles.stickerName} numberOfLines={1}>
                {isUnlocked ? sticker.name : "؟؟؟"}
              </AppText>
            </View>
          );
        })}
      </View>

      <Card style={styles.tipCard}>
        <AppText style={styles.tipEmoji}>💡</AppText>
        <AppText style={styles.tipText}>
          كل لعبة جديدة تمنحك نجومًا. اجمع 25 نجمة أو استكشف 20 حرفًا لتفتح شهادة الإنجاز!
        </AppText>
      </Card>

      <PrimaryButton
        label="عرض شهادة الإنجاز"
        emoji="🎖️"
        color="#D99000"
        onPress={() => navigate("certificate")}
      />
      <PrimaryButton
        label="العودة إلى الألعاب"
        emoji="🎮"
        onPress={() => navigate("games")}
        color={PALETTE.primary}
      />
    </Page>
  );
}

const styles = StyleSheet.create({
  starPill: { backgroundColor: "#FFF4C6", borderRadius: 14, paddingHorizontal: 10, paddingVertical: 7 },
  starPillText: { fontSize: 13, fontWeight: "900", color: PALETTE.ink },
  levelCard: { alignItems: "center", marginTop: 8, paddingVertical: 20 },
  levelEmoji: { fontSize: 60 },
  levelName: { fontSize: 22, fontWeight: "900", color: PALETTE.ink, marginTop: 4 },
  levelLevel: { fontSize: 12, fontWeight: "800", color: PALETTE.inkSoft, marginTop: 2, marginBottom: 10 },
  levelHint: { fontSize: 11, fontWeight: "700", color: PALETTE.inkSoft, marginTop: 8, textAlign: "center" },
  badgesGrid: { flexDirection: "row-reverse", flexWrap: "wrap", justifyContent: "center", gap: 9 },
  badgeCard: {
    backgroundColor: "#FFF8DC",
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F3E3AC",
    ...SHADOW_SOFT,
  },
  locked: { backgroundColor: "#F3F0F9", borderColor: "#E5E0EF", opacity: 0.6 },
  badgeIcon: { fontSize: 30 },
  badgeTitle: { fontSize: 11, fontWeight: "900", color: PALETTE.ink, textAlign: "center", marginTop: 4 },
  badgeHint: { fontSize: 8, color: PALETTE.inkMuted, textAlign: "center", marginTop: 3, lineHeight: 12 },
  stickersGrid: { flexDirection: "row-reverse", flexWrap: "wrap", justifyContent: "center", gap: 9 },
  sticker: {
    width: "22%",
    minWidth: 66,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EDE7F6",
    ...SHADOW_SOFT,
  },
  lockedSticker: { backgroundColor: "#F5F2FA", borderStyle: "dashed" },
  stickerEmoji: { fontSize: 28 },
  stickerLockedEmoji: { opacity: 0.35 },
  stickerName: { fontSize: 9, fontWeight: "800", color: PALETTE.inkSoft, marginTop: 3, textAlign: "center" },
  tipCard: { flexDirection: "row-reverse", alignItems: "center", gap: 10, marginTop: 20, backgroundColor: "#FFF4CE" },
  tipEmoji: { fontSize: 24 },
  tipText: { flex: 1, fontSize: 12, color: "#7A5B00", textAlign: "right", lineHeight: 18, fontWeight: "700" },
});
