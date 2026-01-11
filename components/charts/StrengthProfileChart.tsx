import React, { useMemo } from "react";
import { View, useColorScheme, Dimensions } from "react-native";
import Svg, {
  Polygon,
  Line,
  Circle,
  Text as SvgText,
  G,
} from "react-native-svg";
import { CategoryStats } from "~/contexts/UserStatsContext";

interface StrengthProfileChartProps {
  categoryStats: CategoryStats[];
  height?: number;
}

export function StrengthProfileChart({
  categoryStats,
  height = 300,
}: StrengthProfileChartProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const width = Dimensions.get("window").width - 48; // Padding

  // Colors
  const webColor = isDark ? "#374151" : "#e5e7eb"; // gray-700 / gray-200
  const textColor = isDark ? "#9ca3af" : "#6b7280"; // gray-400 / gray-500
  const fillColor = isDark
    ? "rgba(129, 140, 248, 0.4)"
    : "rgba(250, 139, 75, 0.2)"; // Primary with opacity
  const strokeColor = isDark ? "#818cf8" : "#fa8b4b"; // Primary
  const maxBPI = 600; // Normalized progress is 0-100

  // Chart configuration
  const size = Math.min(width, height);
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 40; // Leave room for labels
  const data = categoryStats;
  const count = data.length;

  const chartData = useMemo(() => {
    if (count < 3) return null; // Need at least 3 points for a polygon

    const angleStep = (Math.PI * 2) / count;

    // Calculate points for the data polygon
    const points = data
      .map((stat, i) => {
        const value = (stat.score || 0) / maxBPI;
        const angle = i * angleStep - Math.PI / 2; // Start from top (-90deg)
        const x = cx + radius * value * Math.cos(angle);
        const y = cy + radius * value * Math.sin(angle);
        return `${x},${y}`;
      })
      .join(" ");

    // Calculate points for the web (background grid)
    const webs = [0.2, 0.4, 0.6, 0.8, 1].map((scale) => {
      return data
        .map((_, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const x = cx + radius * scale * Math.cos(angle);
          const y = cy + radius * scale * Math.sin(angle);
          return `${x},${y}`;
        })
        .join(" ");
    });

    // Calculate label positions
    const labels = data.map((stat, i) => {
      const angle = i * angleStep - Math.PI / 2;
      // Push labels out a bit further than radius
      const labelRadius = radius + 20;
      const x = cx + labelRadius * Math.cos(angle);
      const y = cy + labelRadius * Math.sin(angle);
      return { x, y, text: stat.name, value: stat.progress };
    });

    // Calculate axes lines
    const axes = data.map((_, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      return { x1: cx, y1: cy, x2: x, y2: y };
    });

    return { points, webs, labels, axes };
  }, [categoryStats, count, cx, cy, radius]);

  if (!chartData || count < 3) {
    return (
      <View style={{ height, alignItems: "center", justifyContent: "center" }}>
        {/* Fallback for not enough categories */}
      </View>
    );
  }

  return (
    <View className="items-center justify-center">
      <Svg height={size} width={size}>
        {/* Web Grid */}
        {chartData.webs.map((points, i) => (
          <Polygon
            key={i}
            points={points}
            stroke={webColor}
            strokeWidth="1"
            fill="none"
          />
        ))}

        {/* Axes */}
        {chartData.axes.map((axis, i) => (
          <Line
            key={i}
            x1={axis.x1}
            y1={axis.y1}
            x2={axis.x2}
            y2={axis.y2}
            stroke={webColor}
            strokeWidth="1"
          />
        ))}

        {/* Data Polygon */}
        <Polygon
          points={chartData.points}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth="2"
        />

        {/* Data Points (Dots) */}
        {data.map((stat, i) => {
          const angle = i * ((Math.PI * 2) / count) - Math.PI / 2;
          const value = (stat.score || 0) / maxBPI;
          const x = cx + radius * value * Math.cos(angle);
          const y = cy + radius * value * Math.sin(angle);
          return <Circle key={i} cx={x} cy={y} r="4" fill={strokeColor} />;
        })}

        {/* Labels */}
        {chartData.labels.map((label, i) => (
          <SvgText
            key={i}
            x={label.x}
            y={label.y}
            fill={textColor}
            fontSize="10"
            fontWeight="bold"
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            {label.text}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}
