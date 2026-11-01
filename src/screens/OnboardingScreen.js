import React, { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { useApp } from "../context";
import { CHARACTERS, getCharacterById } from "../data/games";
import { AVATAR_COLORS, PALETTE, SHADOW_SOFT, gridItemWidth, useResponsive } from "../theme";
import { todayKey } from "../utils";
import { AppText, Card, GhostButton, Page, PrimaryButton } from "../components/UI";

export default function OnboardingScreen() {
  const { profile, updateProfile, navigate, speak } = useApp();
  const { contentWidth, gutter } = useResponsive();

  const [name, setName] = useState(profile.name || "");
  const [avatarColor, setAvatarColor] = useState(profile.avatarColor || AVATAR_COLORS[0]);
  const [characterId, setCharacterId] = useState(profile.characterId || CHARACTERS[0].id);

  const character = getCharacterById(characterId);
  const cardWidth = gridItemWidth(contentWidth, gutter, 2, 10);

  const start = () => {
    const cleanName = name.trim() || "صديقي";
    updateProfile({
      name: cleanName,
      avatarColor,
      characterId,
      onboarded: true,
      streak: profile.streak > 0 ? profile.streak : 1,
      lastPlayed: todayKey(),
    });
    navigate("home");
    speak(`مرحبًا ${cleanName}! هيا نبدأ رحلة تعلم الحروف.`, { rate: 0.82 });
  };

  return (
    <Page contentStyle={styles.page}>
      <View style={styles.hero}>
        <AppText style={styles.heroEmoji}>🎉</AppText>
        <AppText style={styles.heroTitle}>مرحبًا بك في حروفي المرحة</AppText>
        <AppText style={styles.heroText}>
          لعبة عربية ممتعة لتعلّم الحروف والكلمات مع 15 نشاطًا تعليميًا.
        </AppText>
      </View>

      <Card style={styles.formCard}>
        <AppText style={styles.label}>✏️ اسم الطفل</AppText>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="اكتب اسمك هنا"
          placeholderTextColor="#9A93B0"
          style={styles.input}
          maxLength={20}
          maxFontSizeMultiplier={1.35}
          returnKeyType="done"
          accessibilityLabel="اسم الطفل"
        />

        <AppText style={styles.label}>🎨 لون الملف الشخصي</AppText>
        <View style={styles.colorRow}>
          {AVATAR_COLORS.map((value) => (
            <Pressable
              key={value}
              onPress={() => setAvatarColor(value)}
              accessibilityRole="button"
              accessibilityLabel={`اختيار اللون ${value}`}
              hitSlop={6}
              style={[
                styles.colorDot,
                { backgroundColor: value },
                avatarColor === value && styles.colorDotActive,
              ]}
            />
          ))}
        </View>
      </Card>

      <AppText style={styles.sectionTitle}>اختر بطل رحلتك</AppText>
      <View style={styles.characterGrid}>
        {CHARACTERS.map((item) => {
          const active = item.id === characterId;
          return (
            <Pressable
              key={item.id}
              onPress={() => {
                setCharacterId(item.id);
                speak(`أنا ${item.name}، صديقك في التعلم`);
              }}
              accessibilityRole="button"
              accessibilityLabel={`الشخصية ${item.name}`}
              style={({ pressed }) => [
                styles.characterCard,
                { width: cardWidth },
                active && styles.characterCardActive,
                pressed && styles.pressed,
              ]}
            >
              <View style={[styles.characterFace, { backgroundColor: item.accent }]}>
                <AppText style={styles.characterEmoji}>{item.emoji}</AppText>
              </View>
              <AppText style={styles.characterName}>{item.name}</AppText>
              <AppText style={styles.characterDesc} numberOfLines={2}>
                {item.description}
              </AppText>
              {active && <AppText style={styles.selectedMark}>✓ مختار</AppText>}
            </Pressable>
          );
        })}
      </View>

      <Card style={styles.previewCard}>
        <View style={[styles.previewAvatar, { backgroundColor: avatarColor }]}>
          <AppText style={styles.previewEmoji}>{character.emoji}</AppText>
        </View>
        <View style={styles.previewText}>
          <AppText style={styles.previewName}>{name.trim() || "صديقي"}</AppText>
          <AppText style={styles.previewRole}>بطل الحروف مع {character.name}</AppText>
        </View>
      </Card>

      <PrimaryButton label="ابدأ اللعب" emoji="🚀" onPress={start} />
      <PrimaryButton
        label="تجربة الصوت"
        emoji="🔊"
        onPress={() => speak("مرحبًا! أنا صديقك في تعلم الحروف العربية.")}
        color="#2FA37B"
      />
      {profile.onboarded && (
        <GhostButton label="رجوع بدون حفظ" emoji="↩️" onPress={() => navigate("home")} />
      )}
      <AppText style={styles.note}>
        يمكنك تغيير الاسم والشخصية لاحقًا من لوحة الوالدين.
      </AppText>
    </Page>
  );
}

const styles = StyleSheet.create({
  page: { paddingTop: 14 },
  hero: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.85)", borderRadius: 28, padding: 22, ...SHADOW_SOFT },
  heroEmoji: { fontSize: 58 },
  heroTitle: { fontSize: 25, fontWeight: "900", color: PALETTE.ink, textAlign: "center", marginTop: 6 },
  heroText: { fontSize: 13, lineHeight: 21, color: PALETTE.inkSoft, textAlign: "center", marginTop: 8 },
  formCard: { marginTop: 16 },
  label: { fontSize: 12, fontWeight: "900", color: PALETTE.inkSoft, textAlign: "right", marginBottom: 8, marginTop: 6 },
  input: {
    backgroundColor: "#F7F4FF",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 18,
    color: PALETTE.ink,
    borderWidth: 1,
    borderColor: "#E7DFFF",
    textAlign: "right",
  },
  colorRow: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 9, marginTop: 2 },
  colorDot: { width: 38, height: 38, borderRadius: 13, borderWidth: 3, borderColor: "transparent" },
  colorDotActive: { borderColor: PALETTE.ink, transform: [{ scale: 1.08 }] },
  sectionTitle: { fontSize: 19, fontWeight: "900", color: PALETTE.ink, textAlign: "center", marginTop: 20, marginBottom: 10 },
  characterGrid: { flexDirection: "row-reverse", flexWrap: "wrap", justifyContent: "center", gap: 10 },
  characterCard: {
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 20,
    padding: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
    ...SHADOW_SOFT,
  },
  characterCardActive: { borderColor: PALETTE.primary, backgroundColor: "#F3EFFF" },
  characterFace: { width: 60, height: 60, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  characterEmoji: { fontSize: 34 },
  characterName: { fontSize: 15, fontWeight: "900", color: PALETTE.ink, marginTop: 7 },
  characterDesc: { fontSize: 10, color: PALETTE.inkSoft, textAlign: "center", marginTop: 4, lineHeight: 14 },
  selectedMark: { fontSize: 10, fontWeight: "900", color: PALETTE.primary, marginTop: 4 },
  pressed: { opacity: 0.8 },
  previewCard: { marginTop: 16, flexDirection: "row-reverse", alignItems: "center", gap: 12 },
  previewAvatar: { width: 60, height: 60, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  previewEmoji: { fontSize: 32 },
  previewText: { flex: 1 },
  previewName: { fontSize: 19, fontWeight: "900", color: PALETTE.ink, textAlign: "right" },
  previewRole: { fontSize: 12, color: PALETTE.inkSoft, textAlign: "right", marginTop: 3 },
  note: { fontSize: 11, color: PALETTE.inkMuted, textAlign: "center", marginTop: 14, lineHeight: 17 },
});
