import React, { useLayoutEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Text } from "@/components/ScottyText";
import { PressableScale } from "@/components/ui/Motion";
import { UI_COLORS } from "@/constants/gamification";
import { fontWeight, spacing } from "@/constants/tokens";
import { addDays, DAY_LABELS_SHORT } from "@/utils/habitLogic";
import { useOptionalSettings } from "@/hooks/useSettings";
import { getCalendarWeekDays, localDateKey } from "@/utils/taskDates";

export default function WeekSelector({ selectedDate, today, onSelectDate }: {
  selectedDate: Date;
  today: Date;
  onSelectDate: (date: Date) => void;
}) {
  const { settings } = useOptionalSettings();
  const firstWeekday = settings.weekStartsOn === "monday" ? 1 : 0;
  const selectedKey = localDateKey(selectedDate);
  const todayKey = localDateKey(today);
  const [browsedWeek, setBrowsedWeek] = useState({ selectionKey: selectedKey, offset: 0 });
  // Browsing is independent of the selected day. Explicit date changes bring it back into view.
  const weekOffset = browsedWeek.selectionKey === selectedKey ? browsedWeek.offset : 0;
  const weekStart = addDays(getCalendarWeekDays(selectedDate, firstWeekday)[0], weekOffset * 7);
  const [width, setWidth] = useState(0);
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const swipeHandled = useRef(true);

  // Keep the browsed week in the middle, with real dates on either side.
  // Recenter without animation after a page change so swiping can continue indefinitely.
  useLayoutEffect(() => {
    swipeHandled.current = true;
    if (width > 0) scroll.current?.scrollTo({ x: width, animated: false });
  }, [selectedKey, width, weekOffset, firstWeekday]);

  return (
    <View style={styles.weekPicker} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      {width > 0 && (
        <ScrollView
          ref={scroll}
          horizontal
          pagingEnabled
          directionalLockEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          decelerationRate="fast"
          contentOffset={{ x: width, y: 0 }}
          onScrollBeginDrag={() => { swipeHandled.current = false; }}
          onMomentumScrollEnd={(event) => {
            if (swipeHandled.current) return;
            swipeHandled.current = true;
            const page = Math.max(0, Math.min(2, Math.round(event.nativeEvent.contentOffset.x / width)));
            if (page !== 1) {
              setBrowsedWeek({ selectionKey: selectedKey, offset: weekOffset + page - 1 });
            }
          }}
        >
          {[-1, 0, 1].map((weekOffset) => (
            <View
              key={weekOffset}
              style={[styles.weekRow, { width }]}
              accessibilityElementsHidden={weekOffset !== 0}
              importantForAccessibility={weekOffset === 0 ? "auto" : "no-hide-descendants"}
            >
              {Array.from({ length: 7 }, (_, index) => addDays(weekStart, weekOffset * 7 + index)).map((date) => {
                const key = localDateKey(date);
                const selected = key === selectedKey;
                return (
                  <PressableScale
                    key={key}
                    onPress={() => onSelectDate(date)}
                    style={[styles.weekDay, selected && styles.weekDaySelected]}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={date.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                  >
                    <Text style={[styles.weekDayLabel, selected && styles.weekSelectedText]}>{DAY_LABELS_SHORT[date.getDay()]}</Text>
                    <Text style={[styles.weekDayNumber, selected && styles.weekSelectedText]}>{date.getDate()}</Text>
                    <View style={[styles.todayDot, key === todayKey && { backgroundColor: selected ? UI_COLORS.textOnAccent : UI_COLORS.cmuRed }]} />
                  </PressableScale>
                );
              })}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  weekPicker: { marginBottom: spacing.md, overflow: "hidden" },
  weekRow: { flexDirection: "row", alignItems: "center" },
  weekDay: { flex: 1, alignItems: "center", paddingVertical: 6, borderRadius: 12, gap: 3 },
  weekDaySelected: { backgroundColor: UI_COLORS.cmuRed },
  weekDayLabel: { fontSize: 11, color: UI_COLORS.textMuted },
  weekDayNumber: { fontSize: 16, fontWeight: fontWeight.bold, color: UI_COLORS.textPrimary },
  weekSelectedText: { color: UI_COLORS.textOnAccent },
  todayDot: { width: 4, height: 4, borderRadius: 2 },
});
