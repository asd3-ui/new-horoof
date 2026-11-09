import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PanResponder, Pressable, StyleSheet, View } from "react-native";
import Svg, { Circle, Path, Polyline } from "react-native-svg";
import { useApp } from "../context";
import { speakText, playSfx, buzz } from "../audio";
import { LETTERS, getLetterById } from "../data/letters";
import { SHAPES } from "../data/games";
import { getLetterGuide, getShapeGuide } from "../data/trace";
import { BRUSH_COLORS, PALETTE, ROW, SHADOW_SOFT, clamp, useResponsive } from "../theme";
import {
  AppText,
  Card,
  GhostButton,
  Page,
  PrimaryButton,
  ProgressBar,
  ScreenHeader,
} from "../components/UI";
import ShapeIcon from "../components/ShapeIcon";

const BRUSH_SIZES = [8, 14, 22];

/**
 * لعبة «لوّن واكتب» المعدّلة.
 *
 * التلوين الصحيح لن يعتمد بعد الآن على طول الخط المسحوب — بل على ملامس نقاط
 * خط الحرف نفسه بالترتيب الصحيح (اتجاه الكتابة العربي: من اليمين إلى اليسار،
 * ومن الأعلى إلى الأسفل). الرسم في الفراغ المحيط لا يزيد التقدم، ولا تظهر
 * علامة «تم» إلا بعد اكتمال الحرف بشكله الصحيح.
 */
export default function TracingGame() {
  const { params, navigate, addStars, recordActivity, celebrate } = useApp();
  const { height } = useResponsive();

  const [mode, setMode] = useState(params?.mode === "shape" ? "shape" : "letter");
  const [letterId, setLetterId] = useState(() => {
    const requestedId = Number(params?.letterId);
    return Number.isFinite(requestedId) ? requestedId : 0;
  });
  const [shapeId, setShapeId] = useState(params?.shapeId || "circle");

  const letter = getLetterById(letterId);
  const shape = SHAPES.find((item) => item.id === shapeId) || SHAPES[0];

  const [size, setSize] = useState({ width: 300, height: 260 });
  const sizeRef = useRef(size);
  const [paths, setPaths] = useState([]);
  const pathsRef = useRef([]);
  const [current, setCurrent] = useState("");
  const currentRef = useRef("");
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);
  const [hitIndex, setHitIndex] = useState(0);
  const hitIndexRef = useRef(0);
  const [done, setDone] = useState(false);
  const doneRef = useRef(false);
  const [color, setColor] = useState(BRUSH_COLORS[0]);
  const [brush, setBrush] = useState(14);

  const completeRef = useRef(() => {});

  /* ------------------------------ المسار الإرشادي ------------------------------ */
  const guide = useMemo(
    () => (mode === "shape" ? getShapeGuide(shape?.id) : getLetterGuide(letter?.letter)),
    [mode, shape?.id, letter?.letter]
  );

  /** تحويل نقاط الشبكة 0..100 إلى بكسل الشاشة */
  const toPx = useCallback(
    (point) => {
      const { width, height: canvasHeight } = sizeRef.current;
      const box = Math.min(width, canvasHeight) * 0.86;
      return {
        x: width / 2 + ((point[0] - 50) / 100) * box,
        y: canvasHeight / 2 + ((point[1] - 50) / 100) * box,
      };
    },
    []
  );

  const waypoints = useMemo(() => {
    if (!guide) return [];
    const result = [];
    guide.strokes.forEach((stroke, strokeIndex) => {
      stroke.forEach((point, pointIndex) => {
        const pixel = toPx(point);
        result.push({ ...pixel, strokeIndex, isDot: stroke.length === 1, index: result.length });
      });
    });
    return result;
    // يعاد الحساب عند تغيّر الحجم أو المسار
  }, [guide, toPx, size.width, size.height]);

  const waypointsRef = useRef(waypoints);
  waypointsRef.current = waypoints;
  const totalWaypoints = waypoints.length;
  const totalWaypointsRef = useRef(totalWaypoints);
  totalWaypointsRef.current = totalWaypoints;
  const tolerance = Math.max(20, Math.min(size.width, size.height) * 0.13);
  const toleranceRef = useRef(tolerance);
  toleranceRef.current = tolerance;

  /* ------------------------------ مفاتيح الحالة ------------------------------ */

  const updateProgress = useCallback((newHit) => {
    const total = totalWaypointsRef.current || 1;
    const value = Math.min(100, (newHit / total) * 100);
    progressRef.current = value;
    setProgress(value);
  }, []);

  const reset = useCallback(() => {
    pathsRef.current = [];
    setPaths([]);
    currentRef.current = "";
    setCurrent("");
    hitIndexRef.current = 0;
    setHitIndex(0);
    updateProgress(0);
    doneRef.current = false;
    setDone(false);
  }, [updateProgress]);

  const complete = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    setDone(true);
    setProgress(100);
    progressRef.current = 100;
    addStars(1);
    recordActivity("tracing", 1, 1);
    playSfx("clap");
    buzz(22);
    celebrate({
      title: "لوحة فنية! 🎨",
      detail: mode === "shape" ? `أكملت رسم ${shape.name}` : `أكملت كتابة حرف ${letter.name}`,
      emoji: "🎨",
      confetti: true,
    });
    speakText(mode === "shape" ? `أحسنت! رسمت ${shape.name}` : `أحسنت! كتبت حرف ${letter.name}`);
  };
  completeRef.current = complete;

  /** فحص اللمسة: هل قرّبت من النقطة التالية بالترتيب؟ */
  const tryHit = useCallback(
    (x, y) => {
      if (doneRef.current) return false;
      const nextIndex = hitIndexRef.current;
      const list = waypointsRef.current;
      if (!list.length || nextIndex >= list.length) return false;
      const target = list[nextIndex];
      const distance = Math.hypot(x - target.x, y - target.y);
      if (distance > toleranceRef.current) return false;

      const nextIndex2 = nextIndex + 1;
      hitIndexRef.current = nextIndex2;
      setHitIndex(nextIndex2);
      updateProgress(nextIndex2);
      playSfx("pop");
      buzz(8);
      if (nextIndex2 >= list.length) {
        completeRef.current();
      }
      return true;
    },
    [updateProgress]
  );

  const panResponder = useMemo(() => {
    const finishStroke = () => {
      if (currentRef.current) {
        pathsRef.current = [...pathsRef.current, { d: currentRef.current, hitIndex: hitIndexRef.current }];
        setPaths(pathsRef.current);
      }
      currentRef.current = "";
      setCurrent("");
    };

    const point = (event) => ({
      x: clamp(event.nativeEvent.locationX, 0, sizeRef.current.width),
      y: clamp(event.nativeEvent.locationY, 0, sizeRef.current.height),
    });

    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: (event) => {
        if (doneRef.current) return;
        const { x, y } = point(event);
        tryHit(x, y);
        const next = `M ${x.toFixed(1)} ${y.toFixed(1)}`;
        currentRef.current = next;
        setCurrent(next);
      },
      onPanResponderMove: (event) => {
        if (doneRef.current) return;
        const { x, y } = point(event);
        tryHit(x, y);
        const parts = currentRef.current.split(" ");
        const lastX = Number(parts[parts.length - 2] || 0);
        const lastY = Number(parts[parts.length - 1] || 0);
        const distance = Math.hypot(x - lastX, y - lastY);
        if (distance < 1.5) return;
        currentRef.current = `${currentRef.current} L ${x.toFixed(1)} ${y.toFixed(1)}`;
        setCurrent(currentRef.current);
      },
      onPanResponderRelease: finishStroke,
      onPanResponderTerminate: finishStroke,
    });
  }, [tryHit]);

  const goLetter = (delta) => {
    const next = getLetterById((letterId + delta + LETTERS.length) % LETTERS.length);
    setLetterId(next.id);
    reset();
    speakText(`حرف ${next.name}`);
  };

  const chooseShape = (nextShape) => {
    setShapeId(nextShape.id);
    reset();
    speakText(nextShape.name);
  };

  const switchMode = (nextMode) => {
    if (nextMode === mode) return;
    setMode(nextMode);
    reset();
  };

  const canvasHeight = Math.max(240, Math.min(360, height * 0.36));

  const undo = () => {
    if (!pathsRef.current.length) return;
    const removed = pathsRef.current[pathsRef.current.length - 1];
    pathsRef.current = pathsRef.current.slice(0, -1);
    setPaths(pathsRef.current);
    const nextHit = removed?.hitIndex ?? 0;
    hitIndexRef.current = nextHit;
    setHitIndex(nextHit);
    updateProgress(nextHit);
    doneRef.current = false;
    setDone(false);
  };

  const nextWaypointIndex = Math.min(hitIndex, totalWaypoints - 1);

  return (
    <Page>
      <ScreenHeader
        title={mode === "shape" ? "لوّن الأشكال" : "لوّن الحروف"}
        subtitle="املأ نقاط الحرف نفسه بالترتيب من اليمين"
        onBack={() => navigate(mode === "shape" ? "games" : "letters")}
      />

      <View style={styles.modeRow}>
        <Pressable
          onPress={() => switchMode("letter")}
          style={[styles.modeChip, mode === "letter" && styles.modeChipActive]}
        >
          <AppText style={[styles.modeText, mode === "letter" && styles.modeTextActive]}>🔤 حروف</AppText>
        </Pressable>
        <Pressable
          onPress={() => switchMode("shape")}
          style={[styles.modeChip, mode === "shape" && styles.modeChipActive]}
        >
          <AppText style={[styles.modeText, mode === "shape" && styles.modeTextActive]}>🔷 أشكال</AppText>
        </Pressable>
      </View>

      <Card style={styles.stageCard}>
        <View style={styles.stageHeader}>
          <AppText style={styles.stageTitle}>
            {mode === "shape" ? `${shape.name} ${shape.id === "crescent" ? "🌙" : "🔷"}` : `حرف ${letter.name}`}
          </AppText>
          <Pressable
            onPress={() => speakText(mode === "shape" ? shape.name : `حرف ${letter.name}`)}
            hitSlop={6}
            style={({ pressed }) => [styles.miniSpeaker, pressed && styles.pressed]}
          >
            <AppText style={styles.miniSpeakerText}>🔊</AppText>
          </Pressable>
        </View>

        <View
          style={[styles.canvas, { height: canvasHeight }]}
          onLayout={(event) => {
            const { width, height: layoutHeight } = event.nativeEvent.layout;
            const nextSize = { width, height: layoutHeight };
            sizeRef.current = nextSize;
            setSize(nextSize);
          }}
          {...panResponder.panHandlers}
        >
          {/* الحرف الحقيقي الباهت خلف نقاط الإرشاد */}
          {mode === "letter" ? (
            <AppText
              pointerEvents="none"
              style={[
                styles.guideLetter,
                { fontSize: Math.min(size.height * 0.74, size.width * 0.9), lineHeight: size.height },
              ]}
            >
              {letter.letter}
            </AppText>
          ) : (
            <View pointerEvents="none" style={styles.guideShape}>
              <ShapeIcon
                shapeId={shapeId}
                stroke="#DAD2EE"
                strokeWidth={5}
                dashed
                size={Math.min(size.width, size.height) * 0.82}
              />
            </View>
          )}

          {/* نقاط الإرشاد: تتبع نفس خط الحرف بالترتيب العربي الصحيح */}
          <Svg pointerEvents="none" width={size.width} height={size.height} style={StyleSheet.absoluteFill}>
            {(guide?.strokes || []).map((stroke, strokeIndex) =>
              stroke.length > 1 ? (
                <Polyline
                  key={`guide-${strokeIndex}`}
                  points={stroke.map((p) => `${toPx(p).x.toFixed(1)},${toPx(p).y.toFixed(1)}`).join(" ")}
                  stroke="#B9AEE0"
                  strokeWidth={5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="0.1 15"
                  fill="none"
                />
              ) : null
            )}
          </Svg>

          {/* خطوط الأطفال */}
          <Svg pointerEvents="none" width={size.width} height={size.height} style={StyleSheet.absoluteFill}>
            {paths.map((item, index) => (
              <Path
                key={`path-${index}`}
                d={item.d}
                stroke={color}
                strokeWidth={brush}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            ))}
            {!!current && (
              <Path
                d={current}
                stroke={color}
                strokeWidth={brush}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            )}
          </Svg>

          {/* أجسام النقاط فوق كل شيء؛ النضرة البعدية المستهدفة أكبر */}
          <Svg pointerEvents="none" width={size.width} height={size.height} style={StyleSheet.absoluteFill}>
            {waypoints.map((point) => {
              const isUpcoming = point.index === nextWaypointIndex && !doneRef.current;
              const isHit = point.index < hitIndex;
              return (
                <Circle
                  key={`wp-${point.index}`}
                  cx={point.x}
                  cy={point.y}
                  r={isUpcoming ? 13 : 7.5}
                  fill={isHit ? "#2FA37B" : isUpcoming ? "#FFF4CE" : "rgba(255,255,255,0.9)"}
                  stroke={isHit ? "#1F7A56" : isUpcoming ? "#D99000" : "#B9AEE0"}
                  strokeWidth={isUpcoming ? 3.5 : 2.5}
                />
              );
            })}
          </Svg>

          {done && (
            <View pointerEvents="none" style={styles.doneBadge}>
              <AppText style={styles.doneBadgeText}>✅ تم</AppText>
            </View>
          )}
        </View>

        <View style={styles.progressRow}>
          <AppText style={styles.progressText}>
            {done ? "الحرف مكتمل بشكله الصحيح" : "أتبع النقاط الملونة بالترتيب ←"}
          </AppText>
          <AppText style={styles.progressText}>
            {hitIndex}/{totalWaypoints || 0}
          </AppText>
        </View>
        <ProgressBar value={progress} color={color} height={10} />
      </Card>

      <Card style={styles.toolsCard}>
        <AppText style={styles.toolsTitle}>🎨 اختر اللون</AppText>
        <View style={styles.colorsRow}>
          {BRUSH_COLORS.map((value) => (
            <Pressable
              key={value}
              onPress={() => {
                setColor(value);
                playSfx("pop");
              }}
              accessibilityRole="button"
              accessibilityLabel={`لون ${value}`}
              hitSlop={6}
              style={[
                styles.colorDot,
                { backgroundColor: value },
                color === value && styles.colorDotActive,
              ]}
            />
          ))}
        </View>

        <AppText style={styles.toolsTitle}>🖌️ حجم الفرشاة</AppText>
        <View style={styles.brushRow}>
          {BRUSH_SIZES.map((value) => (
            <Pressable
              key={value}
              onPress={() => setBrush(value)}
              style={[styles.brushButton, brush === value && styles.brushButtonActive]}
            >
              <View
                style={{
                  width: value + 4,
                  height: value + 4,
                  borderRadius: value,
                  backgroundColor: brush === value ? PALETTE.primary : "#B9B2D2",
                }}
              />
            </Pressable>
          ))}
        </View>

        <View style={styles.actions}>
          <GhostButton label="تراجع" emoji="↩️" style={styles.flexButton} onPress={undo} />
          <GhostButton
            label="مسح الكل"
            emoji="🧹"
            style={styles.flexButton}
            onPress={reset}
            color="#FFE7E2"
            textColor="#B4442F"
          />
        </View>
      </Card>

      {mode === "letter" ? (
        <View style={styles.pager}>
          <Pressable style={styles.navButton} onPress={() => goLetter(-1)}>
            <AppText style={styles.navText}>→ الحرف السابق</AppText>
          </Pressable>
          <Pressable style={styles.navButton} onPress={() => goLetter(1)}>
            <AppText style={styles.navText}>الحرف التالي ←</AppText>
          </Pressable>
        </View>
      ) : (
        <Card style={styles.shapePicker}>
          <AppText style={styles.toolsTitle}>🔷 اختر شكلًا لتلوينه</AppText>
          <View style={styles.shapeChips}>
            {SHAPES.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => chooseShape(item)}
                hitSlop={6}
                style={[styles.shapeChip, shapeId === item.id && styles.shapeChipActive]}
              >
                <ShapeIcon shapeId={item.id} color={shapeId === item.id ? PALETTE.primary : "#B7AECF"} size={28} />
                <AppText style={styles.shapeChipText} numberOfLines={1}>
                  {item.name}
                </AppText>
              </Pressable>
            ))}
          </View>
        </Card>
      )}

      <PrimaryButton
        label={mode === "shape" ? "انتهيت من الرسم" : "انتهيت من الكتابة"}
        emoji="✨"
        onPress={() => navigate("home")}
        color={PALETTE.primary}
      />
    </Page>
  );
}

const styles = StyleSheet.create({
  modeRow: { flexDirection: ROW, gap: 8, marginTop: 6 },
  modeChip: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 16,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  modeChipActive: { backgroundColor: "#EDE9FF", borderColor: PALETTE.primary },
  modeText: { fontSize: 13, fontWeight: "800", color: PALETTE.inkSoft },
  modeTextActive: { color: PALETTE.primaryDark },
  stageCard: { marginTop: 12 },
  stageHeader: { flexDirection: ROW, alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  stageTitle: { fontSize: 17, fontWeight: "900", color: PALETTE.ink },
  miniSpeaker: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: "#EDE9FF",
    alignItems: "center",
    justifyContent: "center",
  },
  miniSpeakerText: { fontSize: 18 },
  pressed: { opacity: 0.7 },
  canvas: {
    width: "100%",
    borderRadius: 22,
    backgroundColor: "#FFFDF7",
    borderWidth: 2,
    borderColor: "#E6E0F5",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  guideLetter: {
    position: "absolute",
    color: "#EFE9F5",
    fontWeight: "900",
    textAlign: "center",
    textAlignVertical: "center",
    includeFontPadding: false,
  },
  guideShape: { position: "absolute", alignItems: "center", justifyContent: "center" },
  doneBadge: {
    position: "absolute",
    right: 10,
    bottom: 10,
    backgroundColor: "rgba(47, 163, 123, 0.14)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  doneBadgeText: { color: "#1F7A56", fontWeight: "900", fontSize: 14 },
  progressRow: { flexDirection: ROW, justifyContent: "space-between", marginTop: 12, marginBottom: 6 },
  progressText: { fontSize: 12, fontWeight: "800", color: PALETTE.inkSoft },
  toolsCard: { marginTop: 12 },
  toolsTitle: { fontSize: 13, fontWeight: "900", color: PALETTE.ink, textAlign: "right", marginTop: 6 },
  colorsRow: { flexDirection: ROW, flexWrap: "wrap", gap: 9, marginTop: 8, justifyContent: "center" },
  colorDot: { width: 38, height: 38, borderRadius: 14, borderWidth: 3, borderColor: "transparent" },
  colorDotActive: { borderColor: PALETTE.ink, transform: [{ scale: 1.06 }] },
  brushRow: { flexDirection: ROW, gap: 10, marginTop: 8 },
  brushButton: {
    width: 52,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#F5F1FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  brushButtonActive: { borderColor: PALETTE.primary, backgroundColor: "#EDE9FF" },
  actions: { flexDirection: ROW, gap: 10, marginTop: 4 },
  flexButton: { flex: 1 },
  pager: { flexDirection: ROW, gap: 10, marginTop: 12 },
  navButton: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.85)",
    paddingVertical: 13,
    borderRadius: 16,
    alignItems: "center",
    ...SHADOW_SOFT,
  },
  navText: { color: PALETTE.primaryDark, fontWeight: "800", fontSize: 12, textAlign: "center" },
  shapePicker: { marginTop: 12 },
  shapeChips: { flexDirection: ROW, flexWrap: "wrap", gap: 8, marginTop: 10, justifyContent: "center" },
  shapeChip: {
    flexDirection: ROW,
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: "#F6F2FF",
    borderWidth: 2,
    borderColor: "transparent",
  },
  shapeChipActive: { borderColor: PALETTE.primary, backgroundColor: "#EDE9FF" },
  shapeChipText: { fontSize: 11, fontWeight: "800", color: PALETTE.inkSoft },
});
