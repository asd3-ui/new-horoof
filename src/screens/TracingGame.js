import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Svg, { Circle, Path, Polyline } from "react-native-svg";
import { useApp } from "../context";
import { speakText, playSfx, buzz } from "../audio";
import { LETTERS, getLetterById } from "../data/letters";
import { SHAPES } from "../data/games";
import { getLetterGuide, getShapeGuide } from "../data/trace";
import { BRUSH_COLORS, PALETTE, ROW, SHADOW_SOFT, useResponsive } from "../theme";
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
 * لعبة «لوّن واكتب» بنظام «المس النقطة المضيئة».
 *
 * بدلًا من الرسم الحر (الذي كان يتأثر بإحداثيات اللمس وينحرف عن الحرف)،
 * يلمس الطفل النقاط الإرشادية بالترتيب نفسه الموجود في بطاقات تعليم الكتابة:
 * نقطة البداية الخضراء، ثم كل نقطة مضيئة، حتى آخر نقطة. يُرسم الجزء المكتمل
 * من الحرف بلون الطفل، فلا يمكن أبدًا التلوين خارج خط الحرف.
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
  const [drawn, setDrawn] = useState([]);
  const [hitIndex, setHitIndex] = useState(0);
  const [done, setDone] = useState(false);
  const [color, setColor] = useState(BRUSH_COLORS[0]);
  const [brush, setBrush] = useState(14);
  const doneRef = useRef(false);
  const hintAtRef = useRef(0);

  /* ------------------------------ المسار الإرشادي ------------------------------ */
  const guide = useMemo(
    () => (mode === "shape" ? getShapeGuide(shape?.id) : getLetterGuide(letter?.letter)),
    [mode, shape?.id, letter?.letter]
  );

  /** تحويل نقاط الشبكة 0..100 إلى بكسل داخل مساحة الرسم */
  const toPx = useCallback(
    (point, box) => ({
      x: size.width / 2 + ((point[0] - 50) / 100) * box,
      y: size.height / 2 + ((point[1] - 50) / 100) * box,
    }),
    [size.width, size.height]
  );

  const box = Math.min(size.width, size.height) * 0.86;

  const waypoints = useMemo(() => {
    if (!guide) return [];
    const result = [];
    guide.strokes.forEach((stroke, strokeIndex) => {
      stroke.forEach((point) => {
        const pixel = toPx(point, box);
        result.push({
          ...pixel,
          strokeIndex,
          isDot: stroke.length === 1,
          index: result.length,
        });
      });
    });
    return result;
  }, [guide, toPx, box]);

  const total = waypoints.length;
  const progress = total ? Math.round((hitIndex / total) * 100) : 0;
  const nextIndex = hitIndex < total ? hitIndex : -1;

  const reset = useCallback(() => {
    setDrawn([]);
    setHitIndex(0);
    setDone(false);
    doneRef.current = false;
    hintAtRef.current = 0;
  }, []);

  const complete = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    setDone(true);
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
  }, [addStars, celebrate, letter.name, mode, recordActivity, shape.name]);

  /** لمس نقطة: يُقبل فقط الترتيب الصحيح */
  const tapWaypoint = (point) => {
    if (doneRef.current) return;

    if (point.index !== hitIndex) {
      // لمسة خارج الترتيب: تنبيه لطيف دون عقاب
      if (Date.now() - hintAtRef.current > 2200) {
        hintAtRef.current = Date.now();
        speakText("ابدأ من النقطة الخضراء واتبع الترتيب");
        buzz(16);
      }
      return;
    }

    const previous = hitIndex > 0 ? waypoints[hitIndex - 1] : null;
    const sameStroke = previous && previous.strokeIndex === point.strokeIndex;
    const segment = sameStroke
      ? { type: "line", a: previous, b: point, color, brush }
      : { type: "dot", p: point, color, brush };

    const nextDrawn = [...drawn, segment];
    const nextHit = hitIndex + 1;
    setDrawn(nextDrawn);
    setHitIndex(nextHit);
    playSfx("pop");
    buzz(8);

    if (nextHit >= total) complete();
  };

  const undo = () => {
    if (!drawn.length) return;
    setDrawn(drawn.slice(0, -1));
    setHitIndex(Math.max(0, hitIndex - 1));
    doneRef.current = false;
    setDone(false);
  };

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

  const startPoint = waypoints[0];
  const endPoint = total > 1 ? waypoints[total - 1] : null;

  return (
    <Page>
      <ScreenHeader
        title={mode === "shape" ? "لوّن الأشكال" : "لوّن الحروف"}
        subtitle="المس النقاط المضيئة بالترتيب من نقطة البداية"
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
            setSize({ width, height: layoutHeight });
          }}
        >
          {/*
            لا نعرض الحرف بخطّ عادي في الخلفية: أي اختلاف بين موضع الخط وموضع
            النقاط كان يجعل الرسم يبدو منحرفًا. بدلًا من ذلك يُرسم المسار
            الإرشادي نفسه بخط عريض باهت، فالنقاط تقع دائمًا على الحرف المرئي
            تمامًا ولا يمكن للرسم أن يخرج عنه.
          */}
          <Svg pointerEvents="none" style={StyleSheet.absoluteFill} viewBox={`0 0 ${size.width} ${size.height}`}>
            {(guide?.strokes || []).map((stroke, strokeIndex) =>
              stroke.length > 1 ? (
                <Polyline
                  key={`guide-${strokeIndex}`}
                  points={stroke.map((p) => {
                    const px = toPx(p, box);
                    return `${px.x.toFixed(1)},${px.y.toFixed(1)}`;
                  }).join(" ")}
                  stroke="#EDE7F9"
                  strokeWidth={brush + 26}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              ) : null
            )}
            {(guide?.strokes || []).map((stroke, strokeIndex) =>
              stroke.length > 1 ? (
                <Polyline
                  key={`guide-${strokeIndex}`}
                  points={stroke.map((p) => {
                    const px = toPx(p, box);
                    return `${px.x.toFixed(1)},${px.y.toFixed(1)}`;
                  }).join(" ")}
                  stroke="#CFC5EA"
                  strokeWidth={brush + 10}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              ) : null
            )}
            {(guide?.strokes || []).map((stroke, strokeIndex) =>
              stroke.length > 1 ? (
                <Polyline
                  key={`dashes-${strokeIndex}`}
                  points={stroke.map((p) => {
                    const px = toPx(p, box);
                    return `${px.x.toFixed(1)},${px.y.toFixed(1)}`;
                  }).join(" ")}
                  stroke="#B9AEE0"
                  strokeWidth={4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="0.1 14"
                  fill="none"
                />
              ) : null
            )}
          </Svg>

          {/* الأجزاء الملوّنة التي أكملها الطفل */}
          <Svg pointerEvents="none" style={StyleSheet.absoluteFill} viewBox={`0 0 ${size.width} ${size.height}`}>
            {drawn.map((item, index) =>
              item.type === "line" ? (
                <Path
                  key={`drawn-${index}`}
                  d={`M ${item.a.x.toFixed(1)} ${item.a.y.toFixed(1)} L ${item.b.x.toFixed(1)} ${item.b.y.toFixed(1)}`}
                  stroke={item.color}
                  strokeWidth={item.brush}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              ) : (
                <Circle
                  key={`drawn-${index}`}
                  cx={item.p.x}
                  cy={item.p.y}
                  r={item.brush / 2 + 2}
                  fill={item.color}
                />
              )
            )}
          </Svg>

          {/*
            ترتيب العرض مهم: النقاط المكتملة لا تستقبل اللمس، والنقطة التالية
            تُرسم آخرًا فتكون فوق كل النقاط المتجاورة (وإلا ابتلعت لمسة النقطة
            التالية لأن مساحات اللمس متقاربة).
          */}
          {[
            ...waypoints.filter((point) => point.index < hitIndex),
            ...waypoints.filter((point) => point.index > nextIndex && nextIndex >= 0),
            ...waypoints.filter((point) => point.index === nextIndex),
          ].map((point) => {
            const isNext = point.index === nextIndex;
            const isHit = point.index < hitIndex;
            const isStart = point.index === 0 && !isHit;
            return (
              <Pressable
                key={`wp-${point.index}`}
                onPress={() => tapWaypoint(point)}
                pointerEvents={isHit ? "none" : "auto"}
                accessibilityRole="button"
                accessibilityLabel={
                  isHit
                    ? `نقطة ${point.index + 1} مكتملة`
                    : isNext
                      ? `النقطة التالية ${point.index + 1}`
                      : `نقطة ${point.index + 1}`
                }
                style={[
                  styles.dotTouch,
                  { left: point.x - 22, top: point.y - 22 },
                  isNext && styles.dotTouchNext,
                ]}
              >
                <View
                  style={[
                    styles.dot,
                    isHit && styles.dotHit,
                    isNext && styles.dotNext,
                    isStart && styles.dotStart,
                  ]}
                >
                  {isStart ? (
                    <AppText style={styles.dotStartMark}>▶</AppText>
                  ) : isHit ? (
                    <AppText style={styles.dotHitMark}>✓</AppText>
                  ) : null}
                </View>
              </Pressable>
            );
          })}

          {/* شارة البداية والنهاية */}
          {startPoint && !done && (
            <View pointerEvents="none" style={[styles.startTag, { left: startPoint.x + 18, top: startPoint.y - 34 }]}>
              <AppText style={styles.startTagText}>ابدأ هنا</AppText>
            </View>
          )}
          {endPoint && !done && (
            <View pointerEvents="none" style={[styles.endTag, { left: endPoint.x + 16, top: endPoint.y - 10 }]}>
              <AppText style={styles.endTagText}>النهاية 🏁</AppText>
            </View>
          )}

          {done && (
            <View pointerEvents="none" style={styles.doneBadge}>
              <AppText style={styles.doneBadgeText}>✅ تم</AppText>
            </View>
          )}
        </View>

        <View style={styles.progressRow}>
          <AppText style={styles.progressText}>
            {done ? "أكملت الرسم بشكل صحيح" : "المس النقطة المضيئة بالترتيب"}
          </AppText>
          <AppText style={styles.progressText}>
            {hitIndex}/{total || 0}
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

        <AppText style={styles.toolsTitle}>🖌️ حجم القلم</AppText>
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
    color: "#F0EBF8",
    fontWeight: "900",
    textAlign: "center",
    textAlignVertical: "center",
    includeFontPadding: false,
  },
  guideShape: { position: "absolute", alignItems: "center", justifyContent: "center" },
  dotTouch: {
    position: "absolute",
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  dotTouchNext: { zIndex: 20, elevation: 20 },
  dot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderWidth: 3,
    borderColor: "#B9AEE0",
    alignItems: "center",
    justifyContent: "center",
  },
  dotNext: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFF4CE",
    borderColor: "#D99000",
    borderWidth: 4,
  },
  dotStart: { borderColor: "#2FA37B", borderWidth: 4, backgroundColor: "#E3F8EE" },
  dotHit: { backgroundColor: "#2FA37B", borderColor: "#1F7A56", width: 26, height: 26, borderRadius: 13 },
  dotStartMark: { fontSize: 12, color: "#1F7A56", marginLeft: 2 },
  dotHitMark: { fontSize: 13, color: "#FFFFFF", fontWeight: "900" },
  startTag: {
    position: "absolute",
    backgroundColor: "rgba(47,163,123,0.16)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  startTagText: { fontSize: 11, fontWeight: "900", color: "#1F7A56" },
  endTag: {
    position: "absolute",
    backgroundColor: "rgba(108,92,231,0.12)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  endTagText: { fontSize: 11, fontWeight: "900", color: PALETTE.primaryDark },
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
