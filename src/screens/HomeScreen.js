import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useApp } from "../context";
import { LETTERS } from "../data/letters";
import { getCharacterById } from "../data/games";
import { FEATURED_IDS, dailyActivity, getActivity } from "../data/activities";
import { BADGES, getLevelInfo } from "../data/rewards";
import { ROW, PALETTE, SHADOW_SOFT, gridItemWidth, useResponsive  } from "../theme";
import {
  ActivityCard,
  AppText,
  Card,
  MascotBubble,
  Page,
  PrimaryButton,
  ProgressBar,
  SectionTitle,
  StatCard,
} from "../components/UI";

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "صباح الخير";
  if (hour < 18) return "مساء الخير";
  return "مساء الخير";
};

export default function HomeScreen() {
  const { profile, navigate, speak } = useApp();
  const { contentWidth, gutter } = useResponsive();

  const character = getCharacterById(profile.characterId);
  const level = getLevelInfo(profile.stars);
  const learnedCount = profile.learned?.length || 0;
  const streak = profile.streak || 0;
  const daily = dailyActivity();
  const featured = FEATURED_IDS.map(getActivity).filter(Boolean);
  const cardWidth = gridItemWidth(contentWidth, gutter, 2, 10);
  const unlocked = BADGES.filter((badge) => badge.check(profile));
  const canCertificate = profile.stars >= 25 || learnedCount >= 20;

  const mascotText =
    learnedCount === 0
      ? "هيا نبدأ بحرف الألف! اضغط على تعلّم الحروف."
      : learnedCount >= 28
        ? "أنت تعرف كل الحروف! جرّب التحدي السريع لتثبيت ما تعلمته."
        : `أحسنت! تعلمت ${learnedCount} حرفًا. هل نجرب نشاطًا جديدًا معًا؟`;

  return (
    <Page>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigate("onboarding")}
          accessibilityRole="button"
          accessibilityLabel="تعديل الملف الشخصي"
          style={({ pressed }) => [pressed && styles.pressed]}
        >
          <View style={[styles.avatar, { backgroundColor: profile.avatarColor }]}>
            <AppText style={styles.avatarEmoji}>{character.emoji}</AppText>
          </View>
        </Pressable>

        <View style={styles.headerText}>
          <AppText style={styles.logo}>حروفي المرحة</AppText>
          <AppText style={styles.greeting} numberOfLines={1}>
            {greeting()}، {profile.name || "صديقي"}!
          </AppText>
        </View>

        <Pressable
          onPress={() => navigate("rewards")}
          style={({ pressed }) => [styles.scorePill, pressed && styles.pressed]}
          accessibilityLabel={`لديك ${profile.stars} نجمة`}
          hitSlop={8}
        >
          <AppText style={styles.scoreText}>⭐ {profile.stars}</AppText>
        </Pressable>
      </View>

      <MascotBubble
        character={character}
        text={mascotText}
        actionLabel="استمع إلى الشخصية 🔊"
        onAction={() => speak(`مرحبًا ${profile.name || "صديقي"}! ${mascotText}`)}
      />

      <Card style={styles.levelCard}>
        <View style={styles.levelTop}>
          <View style={[styles.levelEmoji, { backgroundColor: level.unlocked.color }]}>
            <AppText style={styles.levelEmojiText}>{level.unlocked.emoji}</AppText>
          </View>
          <View style={styles.levelInfo}>
            <AppText style={styles.levelLabel}>المستوى {level.unlocked.level}</AppText>
            <AppText style={styles.levelName}>{level.unlocked.name}</AppText>
            <AppText style={styles.levelHint}>
              {level.nextLevel
                ? `تحتاج ${level.remaining} نجمة للمستوى التالي`
                : "وصلت إلى أعلى مستوى! 🎉"}
            </AppText>
          </View>
          <AppText style={styles.levelPercent}>{level.progress}%</AppText>
        </View>
        <ProgressBar value={level.progress} color={level.unlocked.color} height={12} />
      </Card>

      <View style={styles.statsRow}>
        <StatCard value={`${learnedCount}/28`} label="حروف تعلمتها" emoji="🔤" color="#E1F2FF" />
        <StatCard value={profile.stars} label="نجومك" emoji="⭐" color="#FFF4CE" />
        <StatCard value={`${streak}🔥`} label="أيام متتالية" emoji="📅" color="#E4F8E9" />
      </View>

      <Card style={styles.dailyCard} color="#FFE8D6">
        <View style={styles.dailyTop}>
          <AppText style={styles.dailyBadge}>تحدي اليوم</AppText>
          <AppText style={styles.dailyEmoji}>{daily.emoji}</AppText>
        </View>
        <AppText style={styles.dailyTitle}>{daily.title}</AppText>
        <AppText style={styles.dailyText}>{daily.subtitle}</AppText>
        <PrimaryButton
          label="ابدأ التحدي"
          emoji="▶️"
          color={PALETTE.coral}
          onPress={() => navigate(daily.screen, daily.params)}
        />
      </Card>

      <SectionTitle emoji="🎮" action="كل الألعاب ←" onAction={() => navigate("games")}>
        العب وتعلّم
      </SectionTitle>
      <View style={styles.activityGrid}>
        {featured.map((activity) => (
          <ActivityCard
            key={activity.id}
            emoji={activity.emoji}
            title={activity.title}
            subtitle={activity.subtitle}
            color={activity.color}
            tag={activity.tag}
            width={cardWidth}
            onPress={() => navigate(activity.screen, activity.params)}
          />
        ))}
      </View>

      <SectionTitle emoji="🔤" action="كل الحروف ←" onAction={() => navigate("letters")}>
        بطاقات الحروف
      </SectionTitle>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.letterStrip}
      >
        {LETTERS.map((letter) => {
          const isLearned = profile.learned?.includes(letter.id);
          return (
            <Pressable
              key={letter.id}
              onPress={() => navigate("letter", { letterId: letter.id })}
              style={({ pressed }) => [
                styles.letterChip,
                isLearned && styles.letterChipLearned,
                pressed && styles.pressed,
              ]}
            >
              <AppText style={styles.letterChipText}>{letter.letter}</AppText>
              <AppText style={styles.letterChipStar}>{isLearned ? "⭐" : "·"}</AppText>
            </Pressable>
          );
        })}
      </ScrollView>

      <SectionTitle emoji="🏅" action="كل المكافآت ←" onAction={() => navigate("rewards")}>
        أوسمتي
      </SectionTitle>
      <View style={styles.badgesRow}>
        {BADGES.slice(0, 6).map((badge) => {
          const isUnlocked = unlocked.some((item) => item.id === badge.id);
          return (
            <Pressable
              key={badge.id}
              onPress={() => navigate("rewards")}
              style={[styles.badge, !isUnlocked && styles.badgeLocked]}
            >
              <AppText style={styles.badgeIcon}>{isUnlocked ? badge.icon : "🔒"}</AppText>
              <AppText style={styles.badgeText} numberOfLines={2}>
                {badge.title}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      <Card style={styles.parentCard} onPress={() => navigate("dashboard")} accessibilityLabel="لوحة الوالدين">
        <AppText style={styles.parentEmoji}>👨‍👩‍👧</AppText>
        <View style={styles.parentText}>
          <AppText style={styles.parentTitle}>لوحة الوالدين والمعلم</AppText>
          <AppText style={styles.parentSubtitle}>تابع التقدم، واضبط الصوت، وأعد ضبط الأنشطة</AppText>
        </View>
        <AppText style={styles.parentArrow}>←</AppText>
      </Card>

      {canCertificate && (
        <PrimaryButton
          label="عرض شهادة الإنجاز"
          emoji="🎖️"
          color="#D99000"
          onPress={() => navigate("certificate")}
        />
      )}

      <AppText style={styles.footer}>نتعلّم كل يوم شيئًا جديدًا 💛</AppText>
    </Page>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: ROW, alignItems: "center", marginTop: 10, gap: 10 },
  avatar: { width: 58, height: 58, borderRadius: 20, alignItems: "center", justifyContent: "center", ...SHADOW_SOFT },
  avatarEmoji: { fontSize: 32 },
  headerText: { flex: 1 },
  logo: { fontSize: 24, fontWeight: "900", color: PALETTE.ink, textAlign: "right" },
  greeting: { fontSize: 12, color: PALETTE.inkSoft, textAlign: "right", marginTop: 2 },
  scorePill: {
    backgroundColor: "#FFF4C6",
    borderRadius: 16,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#F0D787",
  },
  scoreText: { fontSize: 14, fontWeight: "900", color: PALETTE.ink },
  pressed: { opacity: 0.75 },
  levelCard: { marginTop: 14, backgroundColor: "rgba(255,255,255,0.9)" },
  levelTop: { flexDirection: ROW, alignItems: "center", gap: 10, marginBottom: 10 },
  levelEmoji: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  levelEmojiText: { fontSize: 26 },
  levelInfo: { flex: 1 },
  levelLabel: { fontSize: 11, fontWeight: "800", color: PALETTE.inkSoft, textAlign: "right" },
  levelName: { fontSize: 17, fontWeight: "900", color: PALETTE.ink, textAlign: "right" },
  levelHint: { fontSize: 10, color: PALETTE.inkMuted, textAlign: "right", marginTop: 2 },
  levelPercent: { fontSize: 15, fontWeight: "900", color: PALETTE.primary },
  statsRow: { flexDirection: ROW, gap: 8, marginTop: 12 },
  dailyCard: { marginTop: 16 },
  dailyTop: { flexDirection: ROW, justifyContent: "space-between", alignItems: "center" },
  dailyBadge: {
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 10,
    fontWeight: "900",
    color: PALETTE.coral,
  },
  dailyEmoji: { fontSize: 40 },
  dailyTitle: { fontSize: 20, fontWeight: "900", color: PALETTE.ink, textAlign: "right", marginTop: 6 },
  dailyText: { fontSize: 12, color: PALETTE.inkSoft, textAlign: "right", marginTop: 4 },
  activityGrid: { flexDirection: ROW, flexWrap: "wrap", justifyContent: "center", gap: 10 },
  letterStrip: { gap: 8, paddingVertical: 4, paddingHorizontal: 2 },
  letterChip: {
    width: 50,
    height: 62,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#EDE7F6",
    ...SHADOW_SOFT,
  },
  letterChipLearned: { backgroundColor: "#FFF8DC", borderColor: "#F0D787" },
  letterChipText: { fontSize: 24, fontWeight: "900", color: PALETTE.ink },
  letterChipStar: { fontSize: 9, marginTop: 1 },
  badgesRow: { flexDirection: ROW, flexWrap: "wrap", justifyContent: "center", gap: 8 },
  badge: {
    width: "30%",
    backgroundColor: "#FFF8DC",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F3E3AC",
  },
  badgeLocked: { opacity: 0.45, backgroundColor: "#F2EFF8", borderColor: "#E5E0EF" },
  badgeIcon: { fontSize: 24 },
  badgeText: { fontSize: 9, fontWeight: "800", color: PALETTE.inkSoft, textAlign: "center", marginTop: 4 },
  parentCard: {
    marginTop: 18,
    flexDirection: ROW,
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F1E8FF",
  },
  parentEmoji: { fontSize: 30 },
  parentText: { flex: 1 },
  parentTitle: { fontSize: 14, fontWeight: "900", color: PALETTE.ink, textAlign: "right" },
  parentSubtitle: { fontSize: 10, color: PALETTE.inkSoft, textAlign: "right", marginTop: 3, lineHeight: 15 },
  parentArrow: { fontSize: 18, color: PALETTE.primary },
  footer: { textAlign: "center", color: PALETTE.inkMuted, fontSize: 11, marginTop: 22 },
});
