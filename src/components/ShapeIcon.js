import React from "react";
import Svg, { Circle, Ellipse, Path, Polygon, Rect } from "react-native-svg";

const STAR_POINTS =
  "50,4 61.76,33.82 93.75,35.79 69.02,56.18 77.04,87.21 50,70 22.96,87.21 30.98,56.18 6.25,35.79 38.24,33.82";
const HEART_PATH =
  "M50 88 C20 66 6 48 6 32 C6 18 17 8 30 8 C39 8 46 13 50 21 C54 13 61 8 70 8 C83 8 94 18 94 32 C94 48 80 66 50 88 Z";
const CRESCENT_PATH = "M62 6 A44 44 0 1 0 62 94 A34 34 0 1 1 62 6 Z";

/** يرسم شكلًا هندسيًا داخل مربع 100×100 */
export default function ShapeIcon({
  shapeId = "circle",
  color = "#6C5CE7",
  size = 90,
  stroke,
  strokeWidth = 0,
  dashed = false,
}) {
  const outline = stroke
    ? { fill: "none", stroke, strokeWidth: strokeWidth || 3, strokeDasharray: dashed ? "6 7" : undefined }
    : { fill: color };

  const content = (() => {
    switch (shapeId) {
      case "square":
        return <Rect x="8" y="8" width="84" height="84" rx="8" {...outline} />;
      case "triangle":
        return <Polygon points="50,8 94,88 6,88" {...outline} />;
      case "rectangle":
        return <Rect x="5" y="22" width="90" height="56" rx="8" {...outline} />;
      case "star":
        return <Polygon points={STAR_POINTS} {...outline} />;
      case "heart":
        return <Path d={HEART_PATH} {...outline} />;
      case "crescent":
        return <Path d={CRESCENT_PATH} {...outline} />;
      case "diamond":
        return <Polygon points="50,4 96,50 50,96 4,50" {...outline} />;
      case "hexagon":
        return <Polygon points="95,50 72.5,88.97 27.5,88.97 5,50 27.5,11.03 72.5,11.03" {...outline} />;
      case "oval":
        return <Ellipse cx="50" cy="50" rx="46" ry="31" {...outline} />;
      case "circle":
      default:
        return <Circle cx="50" cy="50" r="43" {...outline} />;
    }
  })();

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityLabel="شكل هندسي">
      {content}
    </Svg>
  );
}
