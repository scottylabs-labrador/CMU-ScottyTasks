import { useOptionalSettings } from "@/hooks/useSettings";
import React, { useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ScottyText";
import { PressableScale } from "@/components/ui/Motion";
import { UI_COLORS } from "@/constants/gamification";
import { getMonthGridCells, localDateKey } from "@/utils/taskDates";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const WHEEL_ROW_HEIGHT = 40;
const WHEEL_PADDING = WHEEL_ROW_HEIGHT * 2;

function DateWheel({ options, selectedIndex, onChange, label }: {
  options: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
  label: string;
}) {
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const initialized = useRef(false);
  const [initialIndex] = useState(selectedIndex);
  const clamp = (index: number) => Math.max(0, Math.min(options.length - 1, index));
  const select = (index: number) => {
    const next = clamp(index);
    onChange(next);
    scrollRef.current?.scrollTo({ y: next * WHEEL_ROW_HEIGHT, animated: false });
  };
  return (
    <View style={styles.wheel} accessible accessibilityRole="adjustable" accessibilityLabel={label}
      accessibilityValue={{ text: options[selectedIndex], min: 0, max: options.length - 1, now: selectedIndex }}
      accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
      onAccessibilityAction={(event) => select(selectedIndex + (event.nativeEvent.actionName === "increment" ? 1 : -1))}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.wheelScroll}
        contentOffset={{ x: 0, y: initialIndex * WHEEL_ROW_HEIGHT }}
        contentContainerStyle={styles.wheelContent}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        bounces={false}
        decelerationRate="fast"
        snapToInterval={WHEEL_ROW_HEIGHT}
        scrollEventThrottle={16}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        onLayout={() => {
          if (!initialized.current) {
            initialized.current = true;
            scrollRef.current?.scrollTo({ y: initialIndex * WHEEL_ROW_HEIGHT, animated: false });
          }
        }}
        onScroll={(event) => onChange(clamp(Math.round(event.nativeEvent.contentOffset.y / WHEEL_ROW_HEIGHT)))}
      >
        {options.map((option, index) => (
          <PressableScale key={option} style={styles.wheelRow} onPress={() => select(index)}>
            <Text style={[styles.wheelText, selectedIndex === index && styles.wheelTextSelected]}>{option}</Text>
          </PressableScale>
        ))}
      </ScrollView>
    </View>
  );
}

/** Browsing a month never commits a deadline; only a day press does. */
export default function TaskDueDatePicker({ value, onSelect }: { value: Date; onSelect: (date: Date) => void }) {
  const { settings } = useOptionalSettings();
  const firstWeekday = settings.weekStartsOn === "monday" ? 1 : 0;
  const weekdayLabels = [...WEEKDAYS.slice(firstWeekday), ...WEEKDAYS.slice(0, firstWeekday)];
  const [month, setMonth] = useState(value.getMonth());
  const [year, setYear] = useState(value.getFullYear());
  const [choosingMonth, setChoosingMonth] = useState(false);
  const [draftMonth, setDraftMonth] = useState(month);
  const [draftYear, setDraftYear] = useState(year);
  const years = useMemo(() => {
    const first = Math.min(1900, value.getFullYear());
    const last = Math.max(2200, value.getFullYear() + 100);
    return Array.from({ length: last - first + 1 }, (_, index) => String(first + index));
  }, [value]);
  const toggleMonthPicker = () => {
    if (choosingMonth) {
      setMonth(draftMonth);
      setYear(draftYear);
    } else {
      setDraftMonth(month);
      setDraftYear(year);
    }
    setChoosingMonth((current) => !current);
  };
  const selectedKey = localDateKey(value);
  const todayKey = localDateKey(new Date());
  const monthRows = useMemo(() => {
    const cells = getMonthGridCells(year, month, firstWeekday);
    const rows: (Date | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      rows.push(cells.slice(i, i + 7));
    }
    return rows;
  }, [firstWeekday, month, year]);
  const step = (delta: number) => {
    const next = new Date(year, month + delta, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
  };
  return (
    <View style={styles.calendar}>
      <View style={styles.header}>
        <PressableScale style={[styles.arrow, choosingMonth && styles.hiddenArrow]} disabled={choosingMonth} onPress={() => step(-1)} accessibilityRole="button" accessibilityLabel={choosingMonth ? "Previous year" : "Previous month"}>
          <Ionicons name="chevron-back" size={18} color={UI_COLORS.textPrimary} />
        </PressableScale>
        <PressableScale style={styles.heading} onPress={toggleMonthPicker} accessibilityRole="button" accessibilityState={{ expanded: choosingMonth }} accessibilityLabel={choosingMonth ? `Confirm ${MONTHS[draftMonth]} ${draftYear} and return to calendar` : "Choose month and year"}>
          <Text style={styles.headingText}>{`${MONTHS[choosingMonth ? draftMonth : month]} ${choosingMonth ? draftYear : year}`}</Text>
          <Ionicons name={choosingMonth ? "chevron-up" : "chevron-down"} size={14} color={UI_COLORS.cmuRed} />
        </PressableScale>
        <PressableScale style={[styles.arrow, choosingMonth && styles.hiddenArrow]} disabled={choosingMonth} onPress={() => step(1)} accessibilityRole="button" accessibilityLabel={choosingMonth ? "Next year" : "Next month"}>
          <Ionicons name="chevron-forward" size={18} color={UI_COLORS.textPrimary} />
        </PressableScale>
      </View>
      {choosingMonth ? (
        <View style={styles.wheels}>
          <View pointerEvents="none" style={styles.wheelSelection} />
          <DateWheel label="Month" options={MONTHS} selectedIndex={draftMonth} onChange={setDraftMonth} />
          <DateWheel label="Year" options={years} selectedIndex={years.indexOf(String(draftYear))} onChange={(index) => setDraftYear(Number(years[index]))} />
        </View>
      ) : (
        <>
          <View style={styles.row}>
            {weekdayLabels.map((day) => <Text key={day} style={styles.weekday}>{day}</Text>)}
          </View>
          {monthRows.map((week, rowIdx) => (
            <View key={`week-${rowIdx}`} style={styles.row}>
              {week.map((date, colIdx) => {
                if (!date) return <View key={`blank-${rowIdx}-${colIdx}`} style={styles.dayCell} />;
                const key = localDateKey(date);
                const selected = key === selectedKey;
                return (
                  <PressableScale key={key} style={styles.dayCell} onPress={() => onSelect(date)} accessibilityRole="button" accessibilityLabel={date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })} accessibilityState={{ selected }}>
                    <View style={[styles.dayCircle, key === todayKey && styles.today, selected && styles.selected]}>
                      <Text style={[styles.dayText, selected && styles.selectedText]}>{date.getDate()}</Text>
                    </View>
                  </PressableScale>
                );
              })}
            </View>
          ))}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  calendar: { width: "100%", marginTop: 10, padding: 4, borderRadius: 10, backgroundColor: UI_COLORS.bgWarm },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  arrow: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  heading: { minHeight: 44, flex: 1, flexDirection: "row", gap: 6, alignItems: "center", justifyContent: "center" },
  headingText: { fontSize: 15, fontWeight: "700", color: UI_COLORS.textPrimary },
  row: { flexDirection: "row" },
  weekday: { flex: 1, textAlign: "center", fontSize: 11, color: UI_COLORS.textSecondary, paddingVertical: 6 },
  dayCell: { flex: 1, height: 40, alignItems: "center", justifyContent: "center" },
  dayCircle: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  today: { borderWidth: 1, borderColor: UI_COLORS.cmuRed },
  selected: { backgroundColor: UI_COLORS.cmuRed },
  dayText: { fontSize: 14, color: UI_COLORS.textPrimary },
  selectedText: { color: UI_COLORS.textOnAccent, fontWeight: "700" },
  hiddenArrow: { opacity: 0 },
  wheels: { flexDirection: "row", gap: 4 },
  wheel: { flex: 1, height: WHEEL_ROW_HEIGHT * 5, overflow: "hidden" },
  wheelScroll: { flex: 1 },
  wheelContent: { paddingVertical: WHEEL_PADDING },
  wheelSelection: { position: "absolute", left: 0, right: 0, top: WHEEL_PADDING, height: WHEEL_ROW_HEIGHT, borderRadius: 8, borderWidth: 1, borderColor: UI_COLORS.cmuRed, backgroundColor: UI_COLORS.redTint },
  wheelRow: { height: WHEEL_ROW_HEIGHT, justifyContent: "center", alignItems: "center" },
  wheelText: { fontSize: 17, color: UI_COLORS.textMuted },
  wheelTextSelected: { color: UI_COLORS.textPrimary, fontWeight: "700" },
});
