import React from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ScottyText";
import { PressableScale } from "@/components/ui/Motion";
import { UI_COLORS } from "@/constants/gamification";
import { addDays } from "@/utils/habitLogic";
import { localDateKey } from "@/utils/taskDates";

export default function DayNavigation({ selectedDate, today, onSelectDate }: {
  selectedDate: Date;
  today: Date;
  onSelectDate: (date: Date) => void;
}) {
  const selectedKey = localDateKey(selectedDate);
  const isToday = selectedKey === localDateKey(today);
  const relativeTitle = isToday ? "Today"
    : selectedKey === localDateKey(addDays(today, 1)) ? "Tomorrow"
    : selectedKey === localDateKey(addDays(today, -1)) ? "Yesterday"
    : null;
  const dateLabel = selectedDate.toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
    ...(selectedDate.getFullYear() !== today.getFullYear() ? { year: "numeric" as const } : {}),
  });
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <PressableScale style={styles.arrow} hitSlop={6} onPress={() => onSelectDate(addDays(selectedDate, -1))} accessibilityRole="button" accessibilityLabel="Previous day">
          <Ionicons name="chevron-back" size={22} color={UI_COLORS.textPrimary} />
        </PressableScale>
        <View style={styles.heading}>
          <Text variant="heading" style={styles.title}>{relativeTitle ?? dateLabel}</Text>
          {relativeTitle ? <Text style={styles.date}> · {dateLabel}</Text> : null}
        </View>
        <PressableScale style={styles.arrow} hitSlop={6} onPress={() => onSelectDate(addDays(selectedDate, 1))} accessibilityRole="button" accessibilityLabel="Next day">
          <Ionicons name="chevron-forward" size={22} color={UI_COLORS.textPrimary} />
        </PressableScale>
      </View>
      <View style={styles.jumpSlot}>
        {!isToday && (
          <PressableScale onPress={() => onSelectDate(today)} style={styles.jump} accessibilityRole="button" accessibilityLabel="Jump to today">
            <Text style={styles.jumpText}>Jump to today</Text>
          </PressableScale>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", marginBottom: 8 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center", maxWidth: "100%", gap: 4 },
  arrow: { width: 32, height: 36, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 20, fontWeight: "700", color: UI_COLORS.textPrimary },
  date: { fontSize: 12, lineHeight: 18, color: UI_COLORS.textMuted },
  heading: { flexShrink: 1, flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "center", minHeight: 28 },
  jumpSlot: { height: 28, justifyContent: "center" },
  jump: { borderWidth: 1, borderColor: UI_COLORS.cmuRed, backgroundColor: UI_COLORS.redTint, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  jumpText: { fontSize: 11, fontWeight: "600", color: UI_COLORS.cmuRed },
});
