import React, { useMemo, useState } from "react";
import { View, useColorScheme, Dimensions } from "react-native";
import { BarChart } from "react-native-gifted-charts";
import { Database } from "~/lib/database.types";
import {
  format,
  parseISO,
  subDays,
  subMonths,
  subYears,
  isAfter,
  startOfDay,
} from "date-fns";
import { ChartRange, RangeTabs } from "./ScoreHistoryChart"; // Reuse RangeTabs

type UserGamePerformanceHistory =
  Database["public"]["Tables"]["user_game_performance_history"]["Row"];

interface OverallPerformanceChartProps {
  history: UserGamePerformanceHistory[];
}

export function OverallPerformanceChart({
  history,
}: OverallPerformanceChartProps) {
  const [range, setRange] = useState<ChartRange>("ALL");
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const width = Dimensions.get("window").width - 64; // Card padding (approx)

  // Colors
  const barColor = "#fa8b4b"; // Primary Orange
  const gradientColor = "#d925b5"; // Secondary Purple (for gradient effect)
  const axisColor = isDark ? "#374151" : "#e5e7eb";
  const labelColor = isDark ? "#9ca3af" : "#6b7280";

  const chartData = useMemo(() => {
    if (!history || history.length === 0) return [];

    // Group by snapshot_date
    const groupedByDate: Record<
      string,
      { totalScore: number; gamesPlayed: number }
    > = {};

    history.forEach((record) => {
      const date = record.snapshot_date;
      if (!date) return;

      if (!groupedByDate[date]) {
        groupedByDate[date] = { totalScore: 0, gamesPlayed: 0 };
      }

      groupedByDate[date].totalScore += record.total_score || 0;
      groupedByDate[date].gamesPlayed += record.games_played_count || 0;
    });

    const sortedDates = Object.keys(groupedByDate).sort();

    // Filter by Range
    const now = startOfDay(new Date());
    let cutoffDate: Date | null = null;

    if (range === "90D") cutoffDate = subDays(now, 90);
    else if (range === "6M") cutoffDate = subMonths(now, 6);
    else if (range === "1Y") cutoffDate = subYears(now, 1);

    const filteredDates = cutoffDate
      ? sortedDates.filter((d) => isAfter(parseISO(d), cutoffDate!))
      : sortedDates;

    // Format for Gifted Charts BarChart
    const bars = filteredDates.map((date, index) => {
      const { totalScore, gamesPlayed } = groupedByDate[date];
      const avgScore =
        gamesPlayed > 0 ? Math.round(totalScore / gamesPlayed) : 0;

      // Show label only for some bars to avoid clutter
      const showLabel =
        filteredDates.length < 10 ||
        index % Math.ceil(filteredDates.length / 5) === 0;

      return {
        value: avgScore,
        label: showLabel ? format(parseISO(date), "MM/dd") : "",
        frontColor: barColor,
        gradientColor: gradientColor,
        showGradient: true,
        topLabelComponent: () => null, // Clean look
        date: date, // Custom prop for potential tooltips
      };
    });

    // If no data in range, return empty container to avoid crash
    if (bars.length === 0) return [];

    // Fill with empty bars if few data points to maintain look?
    // Gifted charts handles sparse data okay, but visual density might vary.
    return bars;
  }, [history, range]);

  // Dynamic bar width based on data count
  const barWidth = useMemo(() => {
    const count = chartData.length;
    if (count < 5) return 40;
    if (count < 10) return 24;
    if (count < 20) return 12;
    return 6;
  }, [chartData.length]);

  const spacing = useMemo(() => {
    const count = chartData.length;
    if (count < 5) return 40;
    if (count < 10) return 20;
    if (count < 20) return 10;
    return 4;
  }, [chartData.length]);

  return (
    <View className="items-center w-full">
      <View style={{ width: "100%", height: 220, justifyContent: "center" }}>
        {chartData.length > 0 ? (
          <BarChart
            data={chartData}
            barWidth={barWidth}
            spacing={spacing}
            roundedTop
            roundedBottom={false}
            hideRules
            xAxisThickness={1}
            yAxisThickness={0}
            yAxisTextStyle={{ color: labelColor, fontSize: 10 }}
            xAxisColor={axisColor}
            noOfSections={4}
            maxValue={800} // Consistent max BPI
            isAnimated
            animationDuration={500}
            initialSpacing={10}
            yAxisLabelSuffix=""
            xAxisLabelTextStyle={{ color: labelColor, fontSize: 10, width: 40 }}
            width={width}
          />
        ) : (
          <View className="flex-1 items-center justifyContent-center">
            {/* Empty state handled gracefully */}
          </View>
        )}
      </View>

      <View className="mt-4 w-full">
        <RangeTabs range={range} onChange={setRange} />
      </View>
    </View>
  );
}
