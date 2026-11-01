import { Platform, StatusBar, useWindowDimensions } from "react-native";

/**
 * لوحة الألوان الموحّدة للتطبيق.
 * ألوان فاتحة ومبهجة مع تباين كافٍ للنصوص.
 */
export const PALETTE = {
  bg: "#FFF8F0",
  bgAlt: "#FFF1F7",
  ink: "#2E2A4F",
  inkSoft: "#615C80",
  inkMuted: "#8A84A3",
  white: "#FFFFFF",
  primary: "#6C5CE7",
  primaryDark: "#4B3FC4",
  primarySoft: "#EDE9FF",
  mint: "#2FA37B",
  mintSoft: "#E3F8EE",
  coral: "#E8604C",
  coralSoft: "#FFE7E2",
  amber: "#D99000",
  amberSoft: "#FFF4CE",
  sky: "#2E7CC4",
  skySoft: "#E1F2FF",
  rose: "#D6558E",
  roseSoft: "#FFE4F0",
  lilac: "#8A5BD6",
  lilacSoft: "#F1E8FF",
  border: "#EDE7F6",
};

/** ألوان بطاقات الأنشطة */
export const CARD_COLORS = {
  sky: "#E1F2FF",
  mint: "#E4F8E9",
  peach: "#FFE8D6",
  lilac: "#EFE7FF",
  lemon: "#FFF6C9",
  rose: "#FFE4EF",
  aqua: "#DFF8F6",
  sand: "#F8EEDD",
};

/** ألوان الحروف */
export const LETTER_COLORS = ["#E8604C", "#D99000", "#2FA37B", "#2E7CC4", "#8A5BD6", "#D6558E"];

/** ألوان الفرشاة */
export const BRUSH_COLORS = [
  "#E8604C",
  "#F59E0B",
  "#2FA37B",
  "#2E7CC4",
  "#8A5BD6",
  "#D6558E",
  "#0F766E",
  "#B45309",
  "#1E3A8A",
  "#2E2A4F",
];

/** ألوان اختيار الملف الشخصي */
export const AVATAR_COLORS = ["#FFB5D9", "#BFE6FF", "#D7F5C7", "#FDE9A8", "#EAD9FF", "#FFD4C4", "#C7F0EA", "#FFE0B2"];

/** ظلال متوافقة مع iOS و Android */
export const SHADOW = Platform.select({
  ios: {
    shadowColor: "#3B315D",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  android: { elevation: 3 },
  default: {},
});

export const SHADOW_SOFT = Platform.select({
  ios: {
    shadowColor: "#3B315D",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  android: { elevation: 2 },
  default: {},
});

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/**
 * قياسات متجاوبة مع جميع الهواتف (صغيرة، متوسطة، كبيرة، أجهزة لوحية).
 */
export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const shortest = Math.min(width, height);
  const scale = clamp(width / 390, 0.84, 1.24);
  const gutter = width < 340 ? 10 : width < 380 ? 14 : width < 440 ? 18 : 24;
  const contentWidth = Math.min(width, 820);
  return {
    width,
    height,
    scale,
    gutter,
    contentWidth,
    isSmall: width < 360,
    isTablet: width >= 760,
    isLandscape: width > height,
    isShort: shortest < 620,
  };
}

/** يحسب عرض عنصر داخل شبكة مع مراعاة الهوامش والفواصل */
export function gridItemWidth(contentWidth, gutter, columns, gap = 10) {
  const usable = contentWidth - gutter * 2 - gap * (columns - 1);
  return Math.max(40, Math.floor(usable / columns));
}

/** المسافة العلوية الآمنة على Android (الوضع edge-to-edge) */
export const TOP_INSET = Platform.OS === "android" ? StatusBar.currentHeight || 24 : 0;

/** أحجام خطوط متجاوبة */
export const font = (size, scale = 1) => Math.round(size * scale);
