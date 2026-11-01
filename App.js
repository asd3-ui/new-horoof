import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AppState,
  BackHandler,
  StyleSheet,
  View,
  Pressable,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { AppContext } from "./src/context";
import { initAudio, releaseAudio, setAudioPrefs, speakText, stopSpeaking } from "./src/audio";
import { CHARACTERS, getCharacterById } from "./src/data/games";
import { todayKey, daysBetween } from "./src/utils";
import { PALETTE } from "./src/theme";

import Background from "./src/components/Background";
import Confetti from "./src/components/Confetti";
import Toast from "./src/components/Toast";
import { AppText } from "./src/components/UI";

import OnboardingScreen from "./src/screens/OnboardingScreen";
import HomeScreen from "./src/screens/HomeScreen";
import LettersScreen from "./src/screens/LettersScreen";
import LetterScreen from "./src/screens/LetterScreen";
import GamesScreen from "./src/screens/GamesScreen";
import RewardsScreen from "./src/screens/RewardsScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import CertificateScreen from "./src/screens/CertificateScreen";
import TracingGame from "./src/screens/TracingGame";
import MemoryGame from "./src/screens/MemoryGame";
import BuildWordGame from "./src/screens/BuildWordGame";
import QuizGame from "./src/screens/QuizGame";
import {
  ListenGame,
  WordMatchGame,
  MissingGame,
  SoundGame,
  FormsGame,
  OppositesGame,
  CountingGame,
  ShapesGame,
  TrainGame,
  QuickQuizGame,
} from "./src/screens/Games";

const STORAGE_KEY = "haroofi-al-marah:profile:v2";
const LEGACY_KEY = "haroofi-al-marah-profile";

const DEFAULT_PROFILE = {
  version: 2,
  name: "",
  characterId: CHARACTERS[0].id,
  avatarColor: "#FFB5D9",
  stars: 0,
  learned: [],
  completed: {},
  best: {},
  streak: 0,
  lastPlayed: "",
  onboarded: false,
  soundOn: true,
  hapticsOn: true,
  celebrationsOn: true,
  createdAt: Date.now(),
};

const SCREENS = {
  onboarding: OnboardingScreen,
  home: HomeScreen,
  letters: LettersScreen,
  letter: LetterScreen,
  games: GamesScreen,
  rewards: RewardsScreen,
  dashboard: DashboardScreen,
  certificate: CertificateScreen,
  tracing: TracingGame,
  memory: MemoryGame,
  buildWord: BuildWordGame,
  listen: ListenGame,
  wordMatch: WordMatchGame,
  missing: MissingGame,
  sound: SoundGame,
  forms: FormsGame,
  opposites: OppositesGame,
  counting: CountingGame,
  shapes: ShapesGame,
  train: TrainGame,
  quiz: QuickQuizGame,
};

const GAME_SCREENS = new Set([
  "listen",
  "wordMatch",
  "missing",
  "sound",
  "forms",
  "opposites",
  "counting",
  "shapes",
  "memory",
  "buildWord",
  "train",
  "quiz",
]);

const NAV_ITEMS = [
  { id: "home", label: "الرئيسية", emoji: "🏠" },
  { id: "games", label: "الألعاب", emoji: "🎮" },
  { id: "rewards", label: "المكافآت", emoji: "🏅" },
  { id: "dashboard", label: "الوالدين", emoji: "👨‍👩‍👧" },
];

function BottomNav({ active, onNavigate, bottomInset = 0 }) {
  return (
    <View style={[styles.nav, { paddingBottom: Math.max(8, bottomInset) }]}>
      {NAV_ITEMS.map((item) => {
        const isActive = active === item.id;
        return (
          <Pressable
            key={item.id}
            onPress={() => onNavigate(item.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={item.label}
            style={({ pressed }) => [
              styles.navItem,
              isActive && styles.navItemActive,
              pressed && styles.navPressed,
            ]}
          >
            <AppText style={styles.navEmoji}>{item.emoji}</AppText>
            <AppText style={[styles.navLabel, isActive && styles.navLabelActive]} numberOfLines={1}>
              {item.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

function withDailyStreak(profile) {
  const today = todayKey();
  if (profile.lastPlayed === today) return profile;
  const gap = daysBetween(profile.lastPlayed, today);
  const streak = gap === 1 ? (profile.streak || 0) + 1 : 1;
  return { ...profile, streak, lastPlayed: today };
}

function safeCount(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.floor(number)) : fallback;
}

function normalizeCounts(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.entries(value).reduce((result, [key, raw]) => {
    const number = Number(raw);
    if (Number.isFinite(number)) result[key] = Math.max(0, Math.floor(number));
    return result;
  }, {});
}

function normalizeProfile(raw) {
  const safe = raw && typeof raw === "object" ? raw : {};
  const learned = Array.isArray(safe.learned)
    ? [...new Set(safe.learned.map((id) => Number(id)).filter((id) => Number.isFinite(id)))]
    : [];

  return withDailyStreak({
    ...DEFAULT_PROFILE,
    ...safe,
    stars: safeCount(safe.stars),
    streak: safeCount(safe.streak),
    learned,
    completed: normalizeCounts(safe.completed),
    best: normalizeCounts(safe.best),
    soundOn: safe.soundOn !== false,
    hapticsOn: safe.hapticsOn !== false,
    celebrationsOn: safe.celebrationsOn !== false,
    onboarded: Boolean(safe.onboarded),
  });
}

export default function App() {
  return (
    <SafeAreaProvider style={styles.provider}>
      <AppShell />
    </SafeAreaProvider>
  );
}

function AppShell() {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [loaded, setLoaded] = useState(false);
  const [screen, setScreen] = useState("onboarding");
  const [params, setParams] = useState({});
  const [toast, setToast] = useState(null);
  const [burst, setBurst] = useState(null);

  const profileRef = useRef(profile);
  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  /* --------------------------- تحميل وحفظ البيانات --------------------------- */
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      let nextProfile = null;
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          nextProfile = normalizeProfile(JSON.parse(raw));
        } else {
          const legacyRaw = await AsyncStorage.getItem(LEGACY_KEY);
          if (legacyRaw) {
            const legacy = JSON.parse(legacyRaw);
            const legacyCharacter =
              CHARACTERS.find((item) => item.name === legacy?.selectedCharacter?.name) || CHARACTERS[0];
            nextProfile = normalizeProfile({
              name: legacy.childName || "",
              characterId: legacyCharacter.id,
              avatarColor: legacy.avatarColor || DEFAULT_PROFILE.avatarColor,
              stars: Number(legacy.score) || 0,
              learned: Array.isArray(legacy.learned) ? legacy.learned : [],
              soundOn: legacy.soundOn !== false,
              onboarded: Boolean(legacy.childName),
            });
          }
        }
      } catch (error) {
        console.log("Profile load failed", error);
      }

      if (!mounted) return;
      const finalProfile = nextProfile || DEFAULT_PROFILE;
      setProfile(finalProfile);
      setScreen(finalProfile.onboarded ? "home" : "onboarding");
      setLoaded(true);
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!loaded) return undefined;
    const timer = setTimeout(() => {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profile)).catch((error) =>
        console.log("Profile save failed", error)
      );
    }, 350);
    return () => clearTimeout(timer);
  }, [profile, loaded]);

  // حفظ فوري عند مغادرة التطبيق حتى لا يضيع آخر تقدم.
  useEffect(() => {
    if (!loaded) return undefined;
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") return;
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profileRef.current)).catch(() => {});
    });
    return () => subscription.remove();
  }, [loaded]);

  useEffect(() => {
    initAudio();
    setAudioPrefs({
      sound: profile.soundOn !== false,
      haptics: profile.hapticsOn !== false,
    });
  }, [profile.hapticsOn, profile.soundOn]);

  useEffect(
    () => () => {
      releaseAudio();
    },
    []
  );

  useEffect(() => {
    if (!burst) return undefined;
    const timer = setTimeout(() => setBurst(null), 2800);
    return () => clearTimeout(timer);
  }, [burst]);

  /* ------------------------------- التنقل ------------------------------- */
  const navigate = useCallback((nextScreen, nextParams = {}) => {
    stopSpeaking();
    setParams(nextParams || {});
    setScreen(SCREENS[nextScreen] ? nextScreen : "home");
  }, []);

  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (screen === "home") return false;
      if (screen === "onboarding") {
        if (profileRef.current.onboarded) {
          navigate("home");
          return true;
        }
        return false;
      }
      if (GAME_SCREENS.has(screen)) {
        navigate("games");
        return true;
      }
      if (screen === "letter") {
        navigate("letters");
        return true;
      }
      if (screen === "tracing") {
        navigate(params?.mode === "shape" ? "games" : "letters");
        return true;
      }
      navigate("home");
      return true;
    });
    return () => subscription.remove();
  }, [navigate, params?.mode, screen]);

  /* ------------------------------- الإجراءات ------------------------------- */
  const updateProfile = useCallback((patch) => {
    setProfile((previous) => ({
      ...previous,
      ...(typeof patch === "function" ? patch(previous) : patch),
    }));
  }, []);

  const addStars = useCallback((count) => {
    if (!count) return;
    setProfile((previous) => ({
      ...previous,
      stars: Math.max(0, (previous.stars || 0) + count),
    }));
  }, []);

  const recordActivity = useCallback((activityId, score, total) => {
    setProfile((previous) => ({
      ...previous,
      completed: {
        ...(previous.completed || {}),
        [activityId]: (previous.completed?.[activityId] || 0) + 1,
      },
      best: {
        ...(previous.best || {}),
        [activityId]: Math.max(previous.best?.[activityId] || 0, Number(score) || 0),
      },
    }));
  }, []);

  const markLearned = useCallback((letterId) => {
    setProfile((previous) => {
      if (previous.learned?.includes(letterId)) return previous;
      return {
        ...previous,
        learned: [...(previous.learned || []), letterId],
        stars: (previous.stars || 0) + 1,
      };
    });
  }, []);

  const celebrate = useCallback((payload = {}) => {
    const message = {
      id: Date.now() + Math.random(),
      title: payload.title || "أحسنت!",
      detail: payload.detail || "",
      emoji: payload.emoji || "🎉",
    };
    setToast(message);
    if (payload.confetti !== false && profileRef.current.celebrationsOn !== false) {
      setBurst({ id: message.id });
    }
  }, []);

  const speak = useCallback((text, options) => {
    speakText(text, options);
  }, []);

  const resetProgress = useCallback(() => {
    setProfile((previous) => ({
      ...DEFAULT_PROFILE,
      name: previous.name,
      characterId: previous.characterId,
      avatarColor: previous.avatarColor,
      onboarded: previous.onboarded,
      soundOn: previous.soundOn,
      hapticsOn: previous.hapticsOn,
      celebrationsOn: previous.celebrationsOn,
      createdAt: previous.createdAt,
      streak: 1,
      lastPlayed: todayKey(),
    }));
    setToast({
      id: Date.now(),
      title: "تمت إعادة الضبط",
      detail: "يمكنك البدء من جديد",
      emoji: "🔄",
    });
  }, []);

  const character = useMemo(() => getCharacterById(profile.characterId), [profile.characterId]);

  const contextValue = useMemo(
    () => ({
      profile,
      params,
      screen,
      character,
      navigate,
      updateProfile,
      addStars,
      recordActivity,
      markLearned,
      celebrate,
      speak,
      resetProgress,
    }),
    [
      addStars,
      celebrate,
      character,
      markLearned,
      navigate,
      params,
      profile,
      recordActivity,
      resetProgress,
      screen,
      speak,
      updateProfile,
    ]
  );

  const ActiveScreen = SCREENS[screen] || HomeScreen;
  const showNav = ["home", "games", "rewards", "dashboard"].includes(screen);
  const screenKey = `${screen}-${params?.letterId ?? ""}-${params?.mode ?? ""}-${params?.shapeId ?? ""}`;

  return (
    <AppContext.Provider value={contextValue}>
      <View style={[styles.safe, { paddingTop: insets.top }]}>
        <StatusBar style="dark" />
        <Background />

        <View style={styles.container}>
          <View style={styles.screenArea}>
            {loaded ? (
              <ActiveScreen key={screenKey} />
            ) : (
              <View style={styles.loading}>
                <AppText style={styles.loadingEmoji}>🌈</AppText>
                <AppText style={styles.loadingText}>حروفي المرحة</AppText>
                <AppText style={styles.loadingHint}>نُجهّز رحلة الحروف...</AppText>
              </View>
            )}
          </View>

          {loaded && showNav && (
            <BottomNav active={screen} onNavigate={navigate} bottomInset={insets.bottom} />
          )}
          <Toast toast={toast} />
        </View>

        <Confetti burst={burst} />
      </View>
    </AppContext.Provider>
  );
}

const styles = StyleSheet.create({
  provider: { flex: 1 },
  safe: { flex: 1, backgroundColor: PALETTE.bg },
  container: { flex: 1 },
  screenArea: { flex: 1 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingEmoji: { fontSize: 64 },
  loadingText: { fontSize: 24, fontWeight: "900", color: PALETTE.ink, marginTop: 10 },
  loadingHint: { fontSize: 12, color: PALETTE.inkSoft, marginTop: 6 },
  nav: {
    flexDirection: "row-reverse",
    backgroundColor: "rgba(255,255,255,0.97)",
    borderTopWidth: 1,
    borderTopColor: "#F0EAF8",
    paddingHorizontal: 8,
    paddingTop: 6,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    borderRadius: 16,
    gap: 2,
  },
  navItemActive: { backgroundColor: "#F1ECFF" },
  navPressed: { opacity: 0.7 },
  navEmoji: { fontSize: 20 },
  navLabel: { fontSize: 9, fontWeight: "800", color: PALETTE.inkMuted, textAlign: "center" },
  navLabelActive: { color: PALETTE.primaryDark },
});
