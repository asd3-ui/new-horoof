import React from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { useApp } from "../context";
import { ACTIVITIES } from "../data/activities";
import { PARENT_TIPS } from "../data/games";
import { VOICES, setAudioPrefs } from "../audio";
import { LETTERS } from "../data/letters";
import { getLevelInfo, unlockedBadges } from "../data/rewards";
import { ROW, PALETTE, SHADOW_SOFT, useResponsive  } from "../theme";
import {
  AppText,
  Card,
  GhostButton,
  Page,
  PrimaryButton,
  ProgressBar,
  ScreenHeader,
  SectionTitle,
} from "../components/UI";

function ToggleRow({ emoji, title, subtitle, value, onToggle }) {
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      style={({ pressed }) => [styles.toggleRow, pressed && styles.pressed]}
    >
      <AppText style={styles.toggleEmoji}>{emoji}</AppText>
      <View style={styles.toggleText}>
        <AppText style={styles.toggleTitle}>{title}</AppText>
        <AppText style={styles.toggleSubtitle}>{subtitle}</AppText>
      </View>
      <View style={[styles.switch, value && styles.switchOn]}>
        <View style={[styles.switchKnob, value && styles.switchKnobOn]} />
      </View>
    </Pressable>
  );
}

export default function DashboardScreen() {
  const { profile, navigate, updateProfile, resetProgress, speak } = useApp();
  const { contentWidth, gutter } = useResponsive();

  const level = getLevelInfo(profile.stars);
  const learned = profile.learned?.length || 0;
  const badges = unlockedBadges(profile);
  const innerWidth = contentWidth - gutter * 2 - 32;
  const letterWidth = Math.max(28, Math.floor((innerWidth - 6 * 6) / 7));
  const tips = PARENT_TIPS.slice(0, 3);

  const confirmReset = () => {
    Alert.alert(
      "إعادة ضبط التقدم",
      "سيتم حذف النجوم والحروف المكتسبة والمكافآت. هل أنت متأكد؟",
      [
        { text: "إلغاء", style: "cancel" },
        { text: "إعادة الضبط", style: "destructive", onPress: resetProgress },
      ]
    );
  };

  return (
    <Page>
      <ScreenHeader
        title="لوحة الوالدين والمعلم"
        subtitle="متابعة التقدم وإعدادات التطبيق"
        onBack={() => navigate("home")}
      />

      <Card style={styles.profileCard}>
        <View style={[styles.avatar, { backgroundColor: profile.avatarColor }]}>
          <AppText style={styles.avatarEmoji}>👤</AppText>
        </View>
        <View style={styles.profileInfo}>
          <AppText style={styles.profileName}>{profile.name || "غير محدد"}</AppText>
          <AppText style={styles.profileLevel}>
            {level.unlocked.emoji} {level.unlocked.name} · المستوى {level.unlocked.level}
          </AppText>
          <AppText style={styles.profileMeta}>
            ⭐ {profile.stars} نجمة · 🔤 {learned}/28 حرفًا · 🏅 {badges.length} شارة
          </AppText>
        </View>
      </Card>

      <View style={styles.summaryRow}>
        <View style={[styles.summary, { backgroundColor: "#E1F2FF" }]}>
          <AppText style={styles.summaryValue}>{learned}/28</AppText>
          <AppText style={styles.summaryLabel}>حروف مكتسبة</AppText>
        </View>
        <View style={[styles.summary, { backgroundColor: "#FFF4CE" }]}>
          <AppText style={styles.summaryValue}>{profile.stars}</AppText>
          <AppText style={styles.summaryLabel}>إجمالي النجوم</AppText>
        </View>
        <View style={[styles.summary, { backgroundColor: "#E4F8E9" }]}>
          <AppText style={styles.summaryValue}>{profile.streak || 0}</AppText>
          <AppText style={styles.summaryLabel}>أيام متتالية</AppText>
        </View>
      </View>

      <SectionTitle emoji="📊">تقدم الأنشطة</SectionTitle>
      <Card style={styles.activitiesCard}>
        {ACTIVITIES.filter((activity) => activity.id !== "letters" && activity.id !== "shapesTracing").map((activity) => {
          const completed = profile.completed?.[activity.id] || 0;
          const bestScore = profile.best?.[activity.id] || 0;
          const value = Math.min(100, (completed / 5) * 100);
          return (
            <View key={activity.id} style={styles.activityRow}>
              <AppText style={styles.activityEmoji}>{activity.emoji}</AppText>
              <View style={styles.activityInfo}>
                <View style={styles.activityTop}>
                  <AppText style={styles.activityName} numberOfLines={1}>
                    {activity.title}
                  </AppText>
                  <AppText style={styles.activityCount}>
                    {completed > 0 ? `${completed} جلسات` : "لم تُلعب بعد"}
                  </AppText>
                </View>
                <ProgressBar value={value} color={PALETTE.mint} height={7} />
                {bestScore > 0 && (
                  <AppText style={styles.activityBest}>أفضل نتيجة: {bestScore}</AppText>
                )}
              </View>
            </View>
          );
        })}
      </Card>

      <SectionTitle emoji="🔤">خريطة الحروف</SectionTitle>
      <Card style={styles.lettersCard}>
        <View style={styles.lettersGrid}>
          {LETTERS.map((letter) => {
            const isLearned = profile.learned?.includes(letter.id);
            return (
              <Pressable
                key={letter.id}
                onPress={() => navigate("letter", { letterId: letter.id })}
                hitSlop={3}
                style={[styles.letterCell, { width: letterWidth }, isLearned && styles.letterCellLearned]}
              >
                <AppText style={styles.letterCellText}>{letter.letter}</AppText>
              </Pressable>
            );
          })}
        </View>
        <AppText style={styles.lettersHint}>
          الحروف الملونة بالذهبي هي التي استكشفها طفلك. اضغط على أي حرف لمراجعته.
        </AppText>
      </Card>

      <SectionTitle emoji="⚙️">الإعدادات</SectionTitle>
      <Card style={styles.settingsCard}>
        <ToggleRow
          emoji="🔊"
          title="الصوت والنطق"
          subtitle="تشغيل أصوات الحروف والمؤثرات"
          value={profile.soundOn !== false}
          onToggle={() => updateProfile({ soundOn: !profile.soundOn })}
        />
        <ToggleRow
          emoji="📳"
          title="الاهتزاز"
          subtitle="اهتزاز خفيف عند الإجابة الصحيحة"
          value={profile.hapticsOn !== false}
          onToggle={() => updateProfile({ hapticsOn: !profile.hapticsOn })}
        />
        <ToggleRow
          emoji="🎉"
          title="الاحتفالات"
          subtitle="إظهار النجوم عند الإنجاز"
          value={profile.celebrationsOn !== false}
          onToggle={() => updateProfile({ celebrationsOn: !profile.celebrationsOn })}
        />
      </Card>

      {/* اختيار القارئ: صوتان مختلفان لتقليل أخطاء النطق الآلي */}
      <SectionTitle emoji="🎙️">قارئ التطبيق</SectionTitle>
      <Card style={styles.settingsCard}>
        <AppText style={styles.voiceIntro}>اختر الصوت الأنسب لطفلك — اضغط للتجربة والاختيار:</AppText>
        {VOICES.map((voice) => {
          const isActive = profile.ttsVoice === voice.id;
          return (
            <Pressable
              key={voice.id}
              onPress={() => {
                setAudioPrefs({ voiceId: voice.id });
                updateProfile({ ttsVoice: voice.id });
                speak(`هذا صوت ${voice.name}. ألف، باء، تاء.`);
              }}
              accessibilityRole="radio"
              accessibilityState={{ checked: isActive }}
              accessibilityLabel={`القارئ ${voice.name}`}
              style={({ pressed }) => [
                styles.voiceOption,
                isActive && styles.voiceOptionActive,
                pressed && styles.pressed,
              ]}
            >
              <AppText style={styles.voiceEmoji}>{voice.emoji}</AppText>
              <View style={styles.toggleText}>
                <AppText style={styles.voiceName}>{voice.name}</AppText>
                <AppText style={styles.voiceSubtitle}>{voice.subtitle}</AppText>
              </View>
              <AppText style={styles.voiceCheck}>{isActive ? "✅ مُختار" : "🎧 تجربة"}</AppText>
            </Pressable>
          );
        })}
      </Card>

      <View style={styles.actions}>
        <GhostButton
          label="تعديل ملف الطفل"
          emoji="✏️"
          style={styles.flexButton}
          onPress={() => navigate("onboarding")}
        />
        <GhostButton
          label="اختبار الصوت"
          emoji="🎤"
          style={styles.flexButton}
          onPress={() => speak("تجربة النطق العربي: ألف، باء، تاء، ثاء.")}
        />
      </View>

      <SectionTitle emoji="💡">نصائح للوالدين</SectionTitle>
      <Card style={styles.tipsCard}>
        {tips.map((tip, index) => (
          <View key={tip} style={styles.tipRow}>
            <AppText style={styles.tipNumber}>{index + 1}</AppText>
            <AppText style={styles.tipText}>{tip}</AppText>
          </View>
        ))}
      </Card>

      <PrimaryButton label="عرض الشهادة" emoji="🎖️" color="#D99000" onPress={() => navigate("certificate")} />
      <GhostButton
        label="إعادة ضبط كل التقدم"
        emoji="🗑️"
        onPress={confirmReset}
        color="#FFE7E2"
        textColor="#B4442F"
      />
      <AppText style={styles.note}>
        تُحفظ البيانات على هذا الجهاز فقط. لا يتم إرسال أي معلومات إلى الإنترنت.
      </AppText>
    </Page>
  );
}

const styles = StyleSheet.create({
  profileCard: { flexDirection: ROW, alignItems: "center", gap: 12, marginTop: 8 },
  avatar: { width: 64, height: 64, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  avatarEmoji: { fontSize: 32 },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 19, fontWeight: "900", color: PALETTE.ink, textAlign: "right" },
  profileLevel: { fontSize: 12, fontWeight: "800", color: PALETTE.primary, textAlign: "right", marginTop: 2 },
  profileMeta: { fontSize: 10, color: PALETTE.inkSoft, textAlign: "right", marginTop: 4 },
  summaryRow: { flexDirection: ROW, gap: 8, marginTop: 12 },
  summary: { flex: 1, borderRadius: 18, paddingVertical: 12, alignItems: "center" },
  summaryValue: { fontSize: 20, fontWeight: "900", color: PALETTE.ink },
  summaryLabel: { fontSize: 9, color: PALETTE.inkSoft, marginTop: 2, textAlign: "center" },
  activitiesCard: { backgroundColor: "rgba(255,255,255,0.92)", paddingVertical: 8 },
  activityRow: { flexDirection: ROW, alignItems: "center", gap: 10, paddingVertical: 8 },
  activityEmoji: { fontSize: 24 },
  activityInfo: { flex: 1 },
  activityTop: { flexDirection: ROW, justifyContent: "space-between", marginBottom: 4 },
  activityName: { fontSize: 12, fontWeight: "900", color: PALETTE.ink, textAlign: "right", flex: 1 },
  activityCount: { fontSize: 9, color: PALETTE.inkMuted, fontWeight: "700" },
  activityBest: { fontSize: 9, color: PALETTE.mint, marginTop: 3, textAlign: "right", fontWeight: "800" },
  lettersCard: { backgroundColor: "rgba(255,255,255,0.92)" },
  lettersGrid: { flexDirection: ROW, flexWrap: "wrap", justifyContent: "center", gap: 6 },
  letterCell: {
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: "#F5F2FA",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E9E3F3",
  },
  letterCellLearned: { backgroundColor: "#FFF4CE", borderColor: "#F0D787" },
  letterCellText: { fontSize: 18, fontWeight: "900", color: PALETTE.ink },
  lettersHint: { fontSize: 10, color: PALETTE.inkMuted, textAlign: "center", marginTop: 10, lineHeight: 16 },
  settingsCard: { backgroundColor: "rgba(255,255,255,0.92)", paddingVertical: 4 },
  toggleRow: { flexDirection: ROW, alignItems: "center", gap: 10, paddingVertical: 10 },
  toggleEmoji: { fontSize: 22 },
  toggleText: { flex: 1 },
  toggleTitle: { fontSize: 13, fontWeight: "900", color: PALETTE.ink, textAlign: "right" },
  toggleSubtitle: { fontSize: 10, color: PALETTE.inkMuted, textAlign: "right", marginTop: 2 },
  switch: {
    width: 48,
    height: 28,
    borderRadius: 999,
    backgroundColor: "#DCD6EA",
    padding: 3,
    justifyContent: "center",
  },
  switchOn: { backgroundColor: PALETTE.mint },
  switchKnob: { width: 22, height: 22, borderRadius: 11, backgroundColor: "#FFFFFF" },
  switchKnobOn: { alignSelf: "flex-end" },
  actions: { flexDirection: ROW, gap: 10, marginTop: 6 },
  flexButton: { flex: 1 },
  voiceIntro: { fontSize: 12, fontWeight: "800", color: PALETTE.inkSoft, textAlign: "right", marginBottom: 6 },
  voiceOption: { flexDirection: ROW, alignItems: "center", gap: 10, paddingVertical: 10, paddingHorizontal: 10, borderRadius: 16, borderWidth: 2, borderColor: "transparent" },
  voiceOptionActive: { backgroundColor: "#F1ECFF", borderColor: PALETTE.primary },
  voiceEmoji: { fontSize: 26 },
  voiceName: { fontSize: 14, fontWeight: "900", color: PALETTE.ink, textAlign: "right" },
  voiceSubtitle: { fontSize: 10, color: PALETTE.inkMuted, textAlign: "right", marginTop: 2 },
  voiceCheck: { fontSize: 11, fontWeight: "900", color: PALETTE.primaryDark },
  tipsCard: { backgroundColor: "#FFF4CE", paddingVertical: 8 },
  tipRow: { flexDirection: ROW, alignItems: "flex-start", gap: 8, paddingVertical: 5 },
  tipNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#F5C518",
    textAlign: "center",
    textAlignVertical: "center",
    fontSize: 11,
    fontWeight: "900",
    color: "#6B4E00",
    overflow: "hidden",
  },
  tipText: { flex: 1, fontSize: 11, color: "#6B4E00", textAlign: "right", lineHeight: 17 },
  note: { fontSize: 10, color: PALETTE.inkMuted, textAlign: "center", marginTop: 16, lineHeight: 16 },
  pressed: { opacity: 0.75 },
});
