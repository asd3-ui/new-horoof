import React from "react";
import { StyleSheet, View } from "react-native";
import { useApp } from "../context";
import { getLevelInfo, unlockedBadges } from "../data/rewards";
import { formatDateArabic } from "../utils";
import { PALETTE, SHADOW, useResponsive } from "../theme";
import { AppText, Card, Page, PrimaryButton, ScreenHeader } from "../components/UI";

export default function CertificateScreen() {
  const { profile, navigate, speak } = useApp();
  const { contentWidth } = useResponsive();
  const level = getLevelInfo(profile.stars);
  const learned = profile.learned?.length || 0;
  const badges = unlockedBadges(profile);
  const isUnlocked = profile.stars >= 25 || learned >= 20;

  if (!isUnlocked) {
    return (
      <Page>
        <ScreenHeader title="شهادة الإنجاز" onBack={() => navigate("home")} />
        <Card style={styles.lockedCard}>
          <AppText style={styles.lockEmoji}>🔒</AppText>
          <AppText style={styles.lockTitle}>الشهادة ما زالت مغلقة</AppText>
          <AppText style={styles.lockText}>
            اجمع 25 نجمة أو استكشف 20 حرفًا لتفتح شهادة الإنجاز.
          </AppText>
          <AppText style={styles.lockProgress}>
            ⭐ {profile.stars}/25 · 🔤 {learned}/20
          </AppText>
          <PrimaryButton label="اذهب إلى الألعاب" emoji="🎮" onPress={() => navigate("games")} />
        </Card>
      </Page>
    );
  }

  return (
    <Page>
      <ScreenHeader
        title="شهادة الإنجاز"
        subtitle="هدية لطفلك بعد رحلة رائعة"
        onBack={() => navigate("home")}
      />

      <View style={[styles.certificate, { maxWidth: Math.min(contentWidth - 20, 560) }]}>
        <View style={styles.innerBorder}>
          <AppText style={styles.medal}>🏆</AppText>
          <AppText style={styles.certTitle}>شهادة إنجاز</AppText>
          <AppText style={styles.certSubtitle}>حروفي المرحة</AppText>

          <AppText style={styles.presentedTo}>تُمنح هذه الشهادة إلى</AppText>
          <AppText style={styles.childName} numberOfLines={1} adjustsFontSizeToFit>
            {profile.name || "طفلي العزيز"}
          </AppText>

          <AppText style={styles.certBody}>
            تقديرًا لجهوده في تعلّم الحروف العربية، واستكشاف الكلمات، وإكمال الألعاب
            التعليمية بحماس ومثابرة.
          </AppText>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <AppText style={styles.statValue}>⭐ {profile.stars}</AppText>
              <AppText style={styles.statLabel}>نجمة</AppText>
            </View>
            <View style={styles.stat}>
              <AppText style={styles.statValue}>{learned}/28</AppText>
              <AppText style={styles.statLabel}>حرفًا</AppText>
            </View>
            <View style={styles.stat}>
              <AppText style={styles.statValue}>{badges.length}</AppText>
              <AppText style={styles.statLabel}>شارة</AppText>
            </View>
          </View>

          <View style={styles.footerRow}>
            <View style={styles.footerBlock}>
              <AppText style={styles.footerValue}>{level.unlocked.emoji} {level.unlocked.name}</AppText>
              <AppText style={styles.footerLabel}>المستوى</AppText>
            </View>
            <View style={styles.seal}>
              <AppText style={styles.sealEmoji}>🌟</AppText>
            </View>
            <View style={styles.footerBlock}>
              <AppText style={styles.footerValue}>{formatDateArabic()}</AppText>
              <AppText style={styles.footerLabel}>التاريخ</AppText>
            </View>
          </View>
        </View>
      </View>

      <PrimaryButton
        label="استمع إلى الشهادة"
        emoji="🔊"
        onPress={() =>
          speak(
            `شهادة إنجاز. تُمنح إلى ${profile.name || "طفلي العزيز"} تقديرًا لجهوده في تعلم الحروف العربية. ${profile.stars} نجمة.`
          )
        }
      />
      <PrimaryButton
        label="العودة إلى الرئيسية"
        emoji="🏠"
        color={PALETTE.primary}
        onPress={() => navigate("home")}
      />
    </Page>
  );
}

const styles = StyleSheet.create({
  certificate: {
    width: "100%",
    alignSelf: "center",
    backgroundColor: "#FFFDF4",
    borderRadius: 24,
    padding: 10,
    borderWidth: 5,
    borderColor: "#D4AF37",
    marginTop: 10,
    ...SHADOW,
  },
  innerBorder: {
    borderWidth: 2,
    borderColor: "#E8D48B",
    borderRadius: 16,
    paddingVertical: 22,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  medal: { fontSize: 62 },
  certTitle: { fontSize: 28, fontWeight: "900", color: "#7A5B00", marginTop: 4 },
  certSubtitle: { fontSize: 12, fontWeight: "800", color: "#B08A2E", letterSpacing: 1, marginTop: 2 },
  presentedTo: { fontSize: 11, color: "#8A7A50", marginTop: 18 },
  childName: {
    fontSize: 32,
    fontWeight: "900",
    color: PALETTE.primaryDark,
    marginTop: 4,
    textAlign: "center",
    maxWidth: "100%",
  },
  certBody: {
    fontSize: 12,
    lineHeight: 20,
    color: "#6B5E3C",
    textAlign: "center",
    marginTop: 12,
    maxWidth: 400,
  },
  statsRow: { flexDirection: "row-reverse", gap: 8, marginTop: 16, width: "100%" },
  stat: { flex: 1, alignItems: "center", backgroundColor: "#FFF7DB", borderRadius: 14, paddingVertical: 8 },
  statValue: { fontSize: 14, fontWeight: "900", color: "#7A5B00" },
  statLabel: { fontSize: 9, color: "#9A8447", marginTop: 2 },
  footerRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 18,
    gap: 8,
  },
  footerBlock: { flex: 1, alignItems: "center" },
  footerValue: { fontSize: 10, fontWeight: "800", color: "#7A5B00", textAlign: "center" },
  footerLabel: { fontSize: 8, color: "#9A8447", marginTop: 3 },
  seal: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#FFE9A8",
    borderWidth: 2,
    borderColor: "#D4AF37",
    alignItems: "center",
    justifyContent: "center",
  },
  sealEmoji: { fontSize: 28 },
  lockedCard: { alignItems: "center", marginTop: 20 },
  lockEmoji: { fontSize: 66 },
  lockTitle: { fontSize: 20, fontWeight: "900", color: PALETTE.ink, marginTop: 8, textAlign: "center" },
  lockText: { fontSize: 13, color: PALETTE.inkSoft, textAlign: "center", marginTop: 8, lineHeight: 20 },
  lockProgress: { fontSize: 13, fontWeight: "900", color: PALETTE.primary, marginTop: 12 },
});
