import React from "react";
import { StyleSheet, View } from "react-native";
import { useApp } from "../context";
import { ACTIVITIES, ACTIVITY_CATEGORIES } from "../data/activities";
import { getCharacterById } from "../data/games";
import { PALETTE, gridItemWidth, useResponsive } from "../theme";
import {
  ActivityCard,
  AppText,
  MascotBubble,
  Page,
  ScreenHeader,
  SectionTitle,
} from "../components/UI";

const CATEGORY_META = {
  الحروف: { emoji: "🔤", text: "تعرّف على الحروف وأشكالها وأصواتها" },
  الكلمات: { emoji: "🧩", text: "كوّن الكلمات وافهم معانيها" },
  المرح: { emoji: "🎉", text: "ألعاب تنمّي الذاكرة والتركيز والعدّ" },
};

export default function GamesScreen() {
  const { profile, navigate } = useApp();
  const { contentWidth, gutter } = useResponsive();
  const character = getCharacterById(profile.characterId);
  const cardWidth = gridItemWidth(contentWidth, gutter, 2, 10);

  return (
    <Page>
      <ScreenHeader
        title="كل الألعاب"
        subtitle={`${ACTIVITIES.length} نشاطًا تعليميًا ممتعًا`}
        onBack={() => navigate("home")}
      />

      <MascotBubble
        character={character}
        text="اختر لعبة من أي قسم. كل لعبة تمنحك نجومًا وتفتح مكافآت جديدة!"
      />

      {ACTIVITY_CATEGORIES.map((category) => {
        const items = ACTIVITIES.filter((item) => item.category === category);
        const meta = CATEGORY_META[category] || {};
        return (
          <View key={category}>
            <SectionTitle emoji={meta.emoji}>{category}</SectionTitle>
            <AppText style={styles.categoryText}>{meta.text}</AppText>
            <View style={styles.grid}>
              {items.map((activity) => {
                const completed = profile.completed?.[activity.id] || 0;
                return (
                  <ActivityCard
                    key={activity.id}
                    emoji={activity.emoji}
                    title={activity.title}
                    subtitle={activity.subtitle}
                    color={activity.color}
                    tag={completed > 0 ? `لعبت ${completed}×` : activity.tag}
                    width={cardWidth}
                    onPress={() => navigate(activity.screen, activity.params)}
                  />
                );
              })}
            </View>
          </View>
        );
      })}

      <AppText style={styles.footer}>💡 جرّب لعبة جديدة كل يوم لتفتح المزيد من النجوم.</AppText>
    </Page>
  );
}

const styles = StyleSheet.create({
  categoryText: { fontSize: 11, color: PALETTE.inkMuted, textAlign: "right", marginTop: -6, marginBottom: 10 },
  grid: { flexDirection: "row-reverse", flexWrap: "wrap", justifyContent: "center", gap: 10 },
  footer: { fontSize: 11, color: PALETTE.inkMuted, textAlign: "center", marginTop: 22, lineHeight: 17 },
});
