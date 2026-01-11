import React, { useMemo, useState } from "react";
import { View } from "react-native";
import { ScoreHistoryChart, ChartRange } from "./ScoreHistoryChart";
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

type UserGamePerformanceHistory =
  Database["public"]["Tables"]["user_game_performance_history"]["Row"];

interface CategoryPerformanceChartProps {
  history: UserGamePerformanceHistory[];
}

export function CategoryPerformanceChart({
  history,
}: CategoryPerformanceChartProps) {
  const [range, setRange] = useState<ChartRange>("90D");

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

    // Convert to array and sort by date
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

    return filteredDates.map((date) => {
      const { totalScore, gamesPlayed } = groupedByDate[date];
      const avgScore =
        gamesPlayed > 0 ? Math.round(totalScore / gamesPlayed) : 0;

      return {
        value: avgScore,
        label: format(parseISO(date), "MM/dd"),
        date: date, // Keep original date for robust tooltip if needed
      };
    });
  }, [history, range]);

  return (
    <View>
      <ScoreHistoryChart
        data={chartData}
        range={range}
        onRangeChange={setRange}
      />
    </View>
  );
}
