import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import {
  AnimatedModal,
  FadeSwitchView,
  PressableScale,
  WaveItem,
} from "@/components/ui/Motion";

import {
  HABIT_CATEGORIES,
  HABIT_COLOR_OPTIONS,
  HABIT_ICON_OPTIONS,
  HABIT_PRIORITY_XP,
  HABIT_UNIT_GROUP_LABELS,
  getDefaultUnitOption,
  getHabitCategory,
  isUnitValidForCategory,
  parseHabitDecimal,
  type HabitCategoryId,
  type HabitEvaluationType,
  type HabitFrequency,
  type HabitGoalCondition,
  type HabitItem,
  type HabitPriority,
  type HabitSaveData,
  type HabitUnitOption,
} from "@/constants/habits";
import { UI_COLORS } from "@/constants/gamification";
import { fontSize, fontWeight, radii, spacing } from "@/constants/tokens";
import { localDateKey, parseTaskDate, parseTaskTime } from "@/utils/taskDates";
import {
  DAY_LABELS_SHORT,
  addDays,
  formatFrequencyLabel,
} from "@/utils/habitLogic";

export type { HabitItem, HabitSaveData };

export interface AddHabitModalProps {
  visible: boolean;
  editingHabit: HabitItem | null;
  saving?: boolean;
  onClose: () => void;
  onSave: (habitData: HabitSaveData) => void | Promise<boolean | void>;
}

const WIZARD_TITLES = [
  "Select a category for your habit",
  "How do you want to evaluate your progress?",
  "Define your habit",
  "How often do you want to do it?",
  "When do you want to do it?",
] as const;

const GOAL_CONDITIONS: { id: HabitGoalCondition; label: string }[] = [
  { id: "at_least", label: "At least" },
  { id: "less_than", label: "Less than" },
  { id: "exactly", label: "Exactly" },
];

const TIME_PRESETS = ["08:00 AM", "01:00 PM", "06:00 PM", "10:00 PM"] as const;

function AddHabitModalForm({
  editingHabit,
  saving = false,
  onClose,
  onSave,
}: Omit<AddHabitModalProps, "visible">) {
  const isEditing = editingHabit !== null;
  const defaultCat = HABIT_CATEGORIES[0];
  const initialCategoryId = editingHabit?.categoryId ?? defaultCat.id;
  const initialCat = getHabitCategory(initialCategoryId);
  const initialDefaultUnit = getDefaultUnitOption(initialCategoryId);

  const [stepIndex, setStepIndex] = useState(0);
  const [showCustomPalette, setShowCustomPalette] = useState(false);
  const [nameError, setNameError] = useState(false);
  const [numericError, setNumericError] = useState<string | null>(null);

  const [titleTouched, setTitleTouched] = useState(Boolean(editingHabit));
  const [evalTouched, setEvalTouched] = useState(Boolean(editingHabit));

  // Habit customization state initialized from `editingHabit` on mount
  const [categoryId, setCategoryId] = useState<HabitCategoryId>(initialCategoryId);
  const [icon, setIcon] = useState<string>(editingHabit?.icon ?? initialCat.icon);
  const [color, setColor] = useState<string>(editingHabit?.color ?? initialCat.color);

  const [evaluationType, setEvaluationType] = useState<HabitEvaluationType>(
    editingHabit?.evaluationType ?? initialCat.defaultEvaluation
  );
  const [goalCondition, setGoalCondition] = useState<HabitGoalCondition>(
    editingHabit?.goalCondition ?? "at_least"
  );
  const [unit, setUnit] = useState<string>(() => {
    if (
      editingHabit?.evaluationType === "numeric" &&
      editingHabit.unit &&
      isUnitValidForCategory(initialCategoryId, editingHabit.unit)
    ) {
      return editingHabit.unit;
    }
    return initialDefaultUnit.unit;
  });
  const [goalStr, setGoalStr] = useState<string>(() =>
    editingHabit?.evaluationType === "numeric"
      ? String(editingHabit.goal)
      : String(initialDefaultUnit.defaultGoal)
  );
  const [stepStr, setStepStr] = useState<string>(() =>
    editingHabit?.evaluationType === "numeric"
      ? String(editingHabit.step)
      : String(initialDefaultUnit.defaultStep)
  );

  const [title, setTitle] = useState<string>(
    editingHabit?.title ?? initialCat.suggestedTitle
  );
  const [description, setDescription] = useState<string>(
    editingHabit?.description ?? ""
  );

  // Frequency state
  const [freqMode, setFreqMode] = useState<HabitFrequency["type"]>(
    editingHabit?.frequency.type ?? "daily"
  );
  const [selectedDays, setSelectedDays] = useState<number[]>(
    editingHabit?.frequency.type === "days_of_week"
      ? editingHabit.frequency.days
      : [1, 2, 3, 4, 5]
  );
  const [daysPerWeek, setDaysPerWeek] = useState<number>(
    editingHabit?.frequency.type === "days_per_week"
      ? editingHabit.frequency.count
      : 3
  );
  const [intervalDays, setIntervalDays] = useState<number>(
    editingHabit?.frequency.type === "interval"
      ? editingHabit.frequency.everyDays
      : 2
  );

  // Schedule & Priority state
  const [startDateObj, setStartDateObj] = useState<Date>(
    () =>
      (editingHabit ? parseTaskDate(editingHabit.startDate) : null) ??
      new Date()
  );
  const [hasEndDate, setHasEndDate] = useState(Boolean(editingHabit?.endDate));
  const [endDateObj, setEndDateObj] = useState<Date>(
    () =>
      (editingHabit?.endDate ? parseTaskDate(editingHabit.endDate) : null) ??
      addDays(new Date(), 30)
  );
  const [hasReminder, setHasReminder] = useState(
    Boolean(editingHabit?.reminderTime)
  );
  const [reminderTimeObj, setReminderTimeObj] = useState<Date>(() =>
    parseTaskTime(editingHabit?.reminderTime || "08:00 AM")
  );
  const [priority, setPriority] = useState<HabitPriority>(
    editingHabit?.priority ?? "medium"
  );

  const [pickerTarget, setPickerTarget] = useState<
    "start" | "end" | "time" | null
  >(null);

  const currentCategory = getHabitCategory(categoryId);

  const handleSelectCategory = (catId: HabitCategoryId) => {
    const found = getHabitCategory(catId);
    setCategoryId(catId);
    setIcon(found.icon);
    setColor(found.color);
    setNumericError(null);

    if (!isEditing && !evalTouched) {
      setEvaluationType(found.defaultEvaluation);
    }

    if (!isEditing || !isUnitValidForCategory(catId, unit)) {
      const defOpt = getDefaultUnitOption(catId);
      setUnit(defOpt.unit);
      setGoalStr(String(defOpt.defaultGoal));
      setStepStr(String(defOpt.defaultStep));
    }

    if (!isEditing && !titleTouched) {
      setTitle(found.suggestedTitle);
      setNameError(false);
    }
  };

  const handleSelectUnitOption = (opt: HabitUnitOption) => {
    setUnit(opt.unit);
    setGoalStr(String(opt.defaultGoal));
    setStepStr(String(opt.defaultStep));
    setNumericError(null);
  };

  const toggleDayOfWeek = (dayIdx: number) => {
    setSelectedDays((prev) => {
      if (prev.includes(dayIdx)) {
        return prev.length > 1 ? prev.filter((d) => d !== dayIdx) : prev;
      }
      return [...prev, dayIdx].sort((a, b) => a - b);
    });
  };

  const buildFrequency = (): HabitFrequency => {
    if (freqMode === "days_of_week") {
      return {
        type: "days_of_week",
        days: selectedDays.length > 0 ? selectedDays : [1, 2, 3, 4, 5],
      };
    }
    if (freqMode === "days_per_week") {
      return { type: "days_per_week", count: daysPerWeek };
    }
    if (freqMode === "interval") {
      return { type: "interval", everyDays: Math.max(2, intervalDays) };
    }
    return { type: "daily" };
  };

  const formatTimeLabel = (date: Date): string =>
    date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

  const validateNumericStep = (): { goal: number; step: number; unit: string } | null => {
    if (evaluationType !== "numeric") {
      return { goal: 1, step: 1, unit: "" };
    }
    const trimmedUnit = unit.trim();
    if (!isUnitValidForCategory(categoryId, trimmedUnit)) {
      setNumericError(
        currentCategory.allowCustomUnit
          ? "Enter a unit between 1 and 20 characters."
          : `Select one of the ${currentCategory.label.toLowerCase()} units above.`
      );
      return null;
    }
    const parsedGoal = parseHabitDecimal(goalStr);
    if (parsedGoal === null) {
      setNumericError("Enter a daily goal greater than 0 (up to 2 decimal places).");
      return null;
    }
    const parsedStep = parseHabitDecimal(stepStr);
    if (parsedStep === null) {
      setNumericError("Enter a step increment greater than 0 (up to 2 decimal places).");
      return null;
    }
    setNumericError(null);
    return { goal: parsedGoal, step: parsedStep, unit: trimmedUnit };
  };

  const handleFinalSave = () => {
    if (saving) return;

    if (!title.trim()) {
      setNameError(true);
      if (!isEditing) setStepIndex(2);
      return;
    }

    const numericValidated = validateNumericStep();
    if (!numericValidated) {
      if (!isEditing) setStepIndex(1);
      return;
    }

    void onSave({
      title: title.trim(),
      description: description.trim(),
      categoryId,
      icon,
      color,
      evaluationType,
      goalCondition,
      goal: numericValidated.goal,
      unit: numericValidated.unit,
      step: numericValidated.step,
      frequency: buildFrequency(),
      startDate: localDateKey(startDateObj),
      endDate: hasEndDate ? localDateKey(endDateObj) : null,
      reminderTime: hasReminder ? formatTimeLabel(reminderTimeObj) : "",
      priority,
    });
  };

  const handleNextStep = () => {
    if (stepIndex === 1 && evaluationType === "numeric") {
      if (!validateNumericStep()) return;
    }
    if (stepIndex === 2 && !title.trim()) {
      setNameError(true);
      return;
    }
    setNameError(false);
    setNumericError(null);
    if (stepIndex < WIZARD_TITLES.length - 1) {
      setStepIndex((s) => s + 1);
    } else {
      handleFinalSave();
    }
  };

  const handlePrevStep = () => {
    setNameError(false);
    setNumericError(null);
    if (stepIndex > 0) {
      setStepIndex((s) => s - 1);
    } else {
      onClose();
    }
  };

  /* -------------------- Reusable Customization Sections -------------------- */

  const renderCategorySection = () => (
    <View style={styles.sectionBlock}>
      {isEditing && <Text style={styles.sectionHeading}>Category & Appearance</Text>}

      <View style={styles.categoryGrid}>
        {HABIT_CATEGORIES.map((cat, idx) => {
          const selected = categoryId === cat.id;
          const isCustomCat = cat.id === "custom";
          return (
            <WaveItem
              key={cat.id}
              index={idx}
              waveKey={isEditing ? "edit" : `step-${stepIndex}`}
              stepMs={48}
              distance={16}
              style={
                isCustomCat
                  ? styles.categoryCardFullWidth
                  : styles.categoryCellHalf
              }
            >
              <PressableScale
                style={[
                  styles.categoryCard,
                  styles.categoryCardFullWidth,
                  selected && {
                    borderColor: color,
                    backgroundColor: `${color}15`,
                  },
                ]}
                scaleTo={0.97}
                haptic="selection"
                onPress={() => handleSelectCategory(cat.id)}
              >
                <View style={styles.categoryCardTextWrap}>
                  <Text
                    style={[
                      styles.categoryLabel,
                      selected && {
                        color: UI_COLORS.textPrimary,
                        fontWeight: fontWeight.extrabold,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {cat.label}
                  </Text>
                  <Text style={styles.categorySubtitle} numberOfLines={1}>
                    {cat.subtitle}
                  </Text>
                </View>
                <View
                  style={[
                    styles.categoryBadge,
                    { backgroundColor: selected ? color : cat.color },
                  ]}
                >
                  <Ionicons
                    name={
                      (selected ? icon : cat.icon) as keyof typeof Ionicons.glyphMap
                    }
                    size={17}
                    color={UI_COLORS.textOnAccent}
                  />
                </View>
              </PressableScale>
            </WaveItem>
          );
        })}
      </View>

      <TouchableOpacity
        style={styles.customizeToggleBtn}
        onPress={() => setShowCustomPalette((v) => !v)}
        activeOpacity={0.7}
      >
        <Ionicons
          name="color-palette-outline"
          size={16}
          color={UI_COLORS.textSecondary}
        />
        <Text style={styles.customizeToggleText}>
          {showCustomPalette
            ? "Hide custom icon & color"
            : "Customize icon & color"}
        </Text>
        <Ionicons
          name={showCustomPalette ? "chevron-up" : "chevron-down"}
          size={15}
          color={UI_COLORS.textMuted}
        />
      </TouchableOpacity>

      {showCustomPalette && (
        <View style={styles.palettePanel}>
          <Text style={styles.subLabel}>Accent Color</Text>
          <View style={styles.colorRow}>
            {HABIT_COLOR_OPTIONS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: c },
                  color === c && styles.colorSwatchActive,
                ]}
                onPress={() => setColor(c)}
              >
                {color === c && (
                  <Ionicons
                    name="checkmark"
                    size={15}
                    color={UI_COLORS.textOnAccent}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.subLabel, { marginTop: spacing.md }]}>Icon</Text>
          <View style={styles.iconGrid}>
            {HABIT_ICON_OPTIONS.map((ic) => {
              const active = icon === ic;
              return (
                <TouchableOpacity
                  key={ic}
                  style={[
                    styles.iconOptionBtn,
                    active && {
                      backgroundColor: color,
                      borderColor: color,
                    },
                  ]}
                  onPress={() => setIcon(ic)}
                >
                  <Ionicons
                    name={ic as keyof typeof Ionicons.glyphMap}
                    size={18}
                    color={active ? UI_COLORS.textOnAccent : UI_COLORS.textSecondary}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );

  const renderEvaluationSection = () => {
    const previewGoal = parseHabitDecimal(goalStr) ?? 1;
    const previewUnit = unit.trim() || getDefaultUnitOption(categoryId).unit;

    return (
      <View style={styles.sectionBlock}>
        {isEditing && <Text style={styles.sectionHeading}>Evaluation Method</Text>}

        <WaveItem index={0} waveKey={isEditing ? "edit-eval" : `eval-${stepIndex}`} distance={16}>
          <PressableScale
            style={[
              styles.evalOptionCard,
              evaluationType === "boolean" && {
                borderColor: color,
                backgroundColor: `${color}14`,
              },
            ]}
            scaleTo={0.98}
            haptic="selection"
            onPress={() => {
              setEvalTouched(true);
              setEvaluationType("boolean");
              setNumericError(null);
            }}
          >
            <View style={styles.evalCardTop}>
              <View
                style={[
                  styles.radioOuter,
                  evaluationType === "boolean" && { borderColor: color },
                ]}
              >
                {evaluationType === "boolean" && (
                  <View style={[styles.radioInner, { backgroundColor: color }]} />
                )}
              </View>
              <Text
                style={[
                  styles.evalTitle,
                  evaluationType === "boolean" && { color },
                ]}
              >
                WITH A YES OR NO
              </Text>
            </View>
            <Text style={styles.evalDesc}>
              Record whether you succeeded with the activity or not each day.
            </Text>
          </PressableScale>
        </WaveItem>

        <WaveItem index={1} waveKey={isEditing ? "edit-eval" : `eval-${stepIndex}`} distance={16}>
          <PressableScale
            style={[
              styles.evalOptionCard,
              evaluationType === "numeric" && {
                borderColor: color,
                backgroundColor: `${color}14`,
              },
            ]}
            scaleTo={0.98}
            haptic="selection"
            onPress={() => {
              setEvalTouched(true);
              setEvaluationType("numeric");
              if (!isUnitValidForCategory(categoryId, unit)) {
                const defOpt = getDefaultUnitOption(categoryId);
                setUnit(defOpt.unit);
                setGoalStr(String(defOpt.defaultGoal));
                setStepStr(String(defOpt.defaultStep));
              }
            }}
          >
            <View style={styles.evalCardTop}>
              <View
                style={[
                  styles.radioOuter,
                  evaluationType === "numeric" && { borderColor: color },
                ]}
              >
                {evaluationType === "numeric" && (
                  <View style={[styles.radioInner, { backgroundColor: color }]} />
                )}
              </View>
              <Text
                style={[
                  styles.evalTitle,
                  evaluationType === "numeric" && { color },
                ]}
              >
                WITH A NUMERIC VALUE
              </Text>
            </View>
            <Text style={styles.evalDesc}>
              Establish a daily target value using {currentCategory.label.toLowerCase()} units.
            </Text>
          </PressableScale>
        </WaveItem>

        {evaluationType === "numeric" && (
          <View style={styles.numericConfigBox}>
            <Text style={styles.subLabel}>Goal Condition</Text>
            <View style={styles.conditionRow}>
              {GOAL_CONDITIONS.map((cond) => {
                const active = goalCondition === cond.id;
                return (
                  <TouchableOpacity
                    key={cond.id}
                    style={[
                      styles.conditionPill,
                      active && { backgroundColor: color, borderColor: color },
                    ]}
                    onPress={() => setGoalCondition(cond.id)}
                  >
                    <Text
                      style={[
                        styles.conditionPillText,
                        active && { color: UI_COLORS.textOnAccent },
                      ]}
                    >
                      {cond.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Domain-Grouped Unit Chips */}
            {currentCategory.allowedUnitGroups.map((group) => {
              const optionsInGroup = currentCategory.unitOptions.filter(
                (o) => o.group === group
              );
              if (optionsInGroup.length === 0) return null;
              return (
                <View key={group} style={styles.unitGroupSection}>
                  <Text style={styles.subLabel}>
                    {HABIT_UNIT_GROUP_LABELS[group]}
                  </Text>
                  <View style={styles.unitChipsWrap}>
                    {optionsInGroup.map((opt) => {
                      const active = unit.trim() === opt.unit;
                      return (
                        <TouchableOpacity
                          key={opt.unit}
                          style={[
                            styles.unitChip,
                            active && {
                              backgroundColor: color,
                              borderColor: color,
                            },
                          ]}
                          activeOpacity={0.75}
                          onPress={() => handleSelectUnitOption(opt)}
                        >
                          <Text
                            style={[
                              styles.unitChipText,
                              active && { color: UI_COLORS.textOnAccent },
                            ]}
                          >
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              );
            })}

            {currentCategory.allowCustomUnit && (
              <View style={styles.unitGroupSection}>
                <Text style={styles.subLabel}>Custom Unit</Text>
                <TextInput
                  style={[styles.input, styles.whiteInput]}
                  value={unit}
                  onChangeText={(txt) => {
                    setUnit(txt);
                    if (numericError) setNumericError(null);
                  }}
                  maxLength={20}
                  placeholder="e.g., problems, flashcards, chapters"
                  placeholderTextColor={UI_COLORS.textMuted}
                />
              </View>
            )}

            <View style={styles.numericInputsRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.subLabel}>
                  Daily Goal ({previewUnit})
                </Text>
                <TextInput
                  style={[styles.input, styles.whiteInput]}
                  keyboardType="decimal-pad"
                  value={goalStr}
                  onChangeText={(txt) => {
                    setGoalStr(txt);
                    if (numericError) setNumericError(null);
                  }}
                  placeholder="8"
                  placeholderTextColor={UI_COLORS.textMuted}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.subLabel}>
                  Step (+/- {previewUnit})
                </Text>
                <TextInput
                  style={[styles.input, styles.whiteInput]}
                  keyboardType="decimal-pad"
                  value={stepStr}
                  onChangeText={(txt) => {
                    setStepStr(txt);
                    if (numericError) setNumericError(null);
                  }}
                  placeholder="1"
                  placeholderTextColor={UI_COLORS.textMuted}
                />
              </View>
            </View>

            {numericError && (
              <Text style={styles.errorText}>{numericError}</Text>
            )}

            <Text style={styles.numericPreviewHint}>
              Target:{" "}
              {GOAL_CONDITIONS.find((c) => c.id === goalCondition)?.label}{" "}
              {previewGoal} {previewUnit} a day.
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderDefinitionSection = () => (
    <View style={styles.sectionBlock}>
      {isEditing && <Text style={styles.sectionHeading}>Habit Details</Text>}

      {/* Live Preview Header */}
      <View style={styles.previewCard}>
        <View style={{ flex: 1, paddingRight: spacing.md }}>
          <Text style={styles.previewTitle} numberOfLines={1}>
            {title.trim() || "Your Habit Name"}
          </Text>
          <View style={styles.previewBadgeRow}>
            <View
              style={[
                styles.previewFreqBadge,
                { backgroundColor: `${color}1E` },
              ]}
            >
              <Text style={[styles.previewFreqText, { color }]}>
                {formatFrequencyLabel(buildFrequency())}
              </Text>
            </View>
            {evaluationType === "numeric" && (
              <View style={styles.previewUnitBadge}>
                <Text style={styles.previewUnitText}>
                  {parseHabitDecimal(goalStr) ?? 1} {unit.trim() || "units"}
                </Text>
              </View>
            )}
          </View>
        </View>
        <View style={[styles.categoryBadge, { backgroundColor: color }]}>
          <Ionicons
            name={icon as keyof typeof Ionicons.glyphMap}
            size={18}
            color={UI_COLORS.textOnAccent}
          />
        </View>
      </View>

      <Text style={styles.subLabel}>Habit Name *</Text>
      <TextInput
        style={[
          styles.input,
          nameError && { borderColor: UI_COLORS.cmuRed, borderWidth: 1.5 },
        ]}
        maxLength={80}
        placeholder={currentCategory.examplePlaceholder}
        placeholderTextColor={UI_COLORS.textMuted}
        value={title}
        onChangeText={(txt) => {
          setTitle(txt);
          setTitleTouched(true);
          if (nameError && txt.trim()) setNameError(false);
        }}
      />
      {nameError && (
        <Text style={styles.errorText}>Please enter a name for your habit.</Text>
      )}

      <Text style={[styles.subLabel, { marginTop: spacing.md }]}>
        Description (Optional)
      </Text>
      <TextInput
        style={[styles.input, styles.multilineInput]}
        maxLength={400}
        placeholder="e.g., Why this habit matters or how you'll stick to it"
        placeholderTextColor={UI_COLORS.textMuted}
        value={description}
        onChangeText={setDescription}
        multiline
      />
    </View>
  );

  const renderFrequencySection = () => (
    <View style={styles.sectionBlock}>
      {isEditing && <Text style={styles.sectionHeading}>Frequency</Text>}

      {/* 1. Every day */}
      <TouchableOpacity
        style={[
          styles.freqOptionRow,
          freqMode === "daily" && { borderColor: color, backgroundColor: `${color}12` },
        ]}
        onPress={() => setFreqMode("daily")}
      >
        <View style={[styles.radioOuter, freqMode === "daily" && { borderColor: color }]}>
          {freqMode === "daily" && (
            <View style={[styles.radioInner, { backgroundColor: color }]} />
          )}
        </View>
        <Text style={styles.freqOptionTitle}>Every day</Text>
      </TouchableOpacity>

      {/* 2. Specific days of the week */}
      <View
        style={[
          styles.freqOptionContainer,
          freqMode === "days_of_week" && {
            borderColor: color,
            backgroundColor: `${color}12`,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.freqOptionHeaderTouch}
          onPress={() => setFreqMode("days_of_week")}
        >
          <View
            style={[
              styles.radioOuter,
              freqMode === "days_of_week" && { borderColor: color },
            ]}
          >
            {freqMode === "days_of_week" && (
              <View style={[styles.radioInner, { backgroundColor: color }]} />
            )}
          </View>
          <Text style={styles.freqOptionTitle}>Specific days of the week</Text>
        </TouchableOpacity>

        {freqMode === "days_of_week" && (
          <View style={styles.freqExpandedBody}>
            <View style={styles.weekdaySelectRow}>
              {DAY_LABELS_SHORT.map((lbl, idx) => {
                const active = selectedDays.includes(idx);
                return (
                  <TouchableOpacity
                    key={lbl}
                    style={[
                      styles.weekdayChip,
                      active && { backgroundColor: color, borderColor: color },
                    ]}
                    onPress={() => toggleDayOfWeek(idx)}
                  >
                    <Text
                      style={[
                        styles.weekdayChipText,
                        active && { color: UI_COLORS.textOnAccent },
                      ]}
                    >
                      {lbl}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.presetChipRow}>
              <TouchableOpacity
                style={styles.presetMiniBtn}
                onPress={() => setSelectedDays([1, 2, 3, 4, 5])}
              >
                <Text style={styles.presetMiniText}>Weekdays</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.presetMiniBtn}
                onPress={() => setSelectedDays([0, 6])}
              >
                <Text style={styles.presetMiniText}>Weekends</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* 3. Days per week */}
      <View
        style={[
          styles.freqOptionContainer,
          freqMode === "days_per_week" && {
            borderColor: color,
            backgroundColor: `${color}12`,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.freqOptionHeaderTouch}
          onPress={() => setFreqMode("days_per_week")}
        >
          <View
            style={[
              styles.radioOuter,
              freqMode === "days_per_week" && { borderColor: color },
            ]}
          >
            {freqMode === "days_per_week" && (
              <View style={[styles.radioInner, { backgroundColor: color }]} />
            )}
          </View>
          <Text style={styles.freqOptionTitle}>Days per week</Text>
        </TouchableOpacity>

        {freqMode === "days_per_week" && (
          <View style={styles.freqExpandedBody}>
            <View style={styles.weekdaySelectRow}>
              {[1, 2, 3, 4, 5, 6].map((cnt) => {
                const active = daysPerWeek === cnt;
                return (
                  <TouchableOpacity
                    key={cnt}
                    style={[
                      styles.countChip,
                      active && { backgroundColor: color, borderColor: color },
                    ]}
                    onPress={() => setDaysPerWeek(cnt)}
                  >
                    <Text
                      style={[
                        styles.weekdayChipText,
                        active && { color: UI_COLORS.textOnAccent },
                      ]}
                    >
                      {cnt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={styles.freqHintText}>
              Complete on any {daysPerWeek} {daysPerWeek === 1 ? "day" : "days"} each week.
            </Text>
          </View>
        )}
      </View>

      {/* 4. Repeat interval */}
      <View
        style={[
          styles.freqOptionContainer,
          freqMode === "interval" && {
            borderColor: color,
            backgroundColor: `${color}12`,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.freqOptionHeaderTouch}
          onPress={() => setFreqMode("interval")}
        >
          <View
            style={[
              styles.radioOuter,
              freqMode === "interval" && { borderColor: color },
            ]}
          >
            {freqMode === "interval" && (
              <View style={[styles.radioInner, { backgroundColor: color }]} />
            )}
          </View>
          <Text style={styles.freqOptionTitle}>Repeat every N days</Text>
        </TouchableOpacity>

        {freqMode === "interval" && (
          <View style={[styles.freqExpandedBody, styles.intervalRow]}>
            <Text style={styles.intervalLabel}>Every</Text>
            <TouchableOpacity
              style={styles.intervalStepBtn}
              onPress={() => setIntervalDays((d) => Math.max(2, d - 1))}
            >
              <Ionicons name="remove" size={16} color={UI_COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.intervalCountText, { color }]}>
              {intervalDays}
            </Text>
            <TouchableOpacity
              style={styles.intervalStepBtn}
              onPress={() => setIntervalDays((d) => Math.min(30, d + 1))}
            >
              <Ionicons name="add" size={16} color={UI_COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.intervalLabel}>days</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderScheduleSection = () => (
    <View style={styles.sectionBlock}>
      {isEditing && <Text style={styles.sectionHeading}>Schedule & Priority</Text>}

      {/* Start Date */}
      <View style={styles.scheduleRow}>
        <View style={styles.scheduleRowLeft}>
          <Ionicons name="calendar-outline" size={18} color={color} />
          <Text style={styles.scheduleRowLabel}>Start Date</Text>
        </View>

        {Platform.OS === "web" ? (
          <View style={styles.webDateStepper}>
            <TouchableOpacity
              onPress={() => setStartDateObj((d) => addDays(d, -1))}
              style={styles.webStepBtn}
            >
              <Ionicons name="chevron-back" size={15} color={UI_COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.schedulePillText}>
              {localDateKey(startDateObj) === localDateKey(new Date())
                ? "Today"
                : startDateObj.toLocaleDateString()}
            </Text>
            <TouchableOpacity
              onPress={() => setStartDateObj((d) => addDays(d, 1))}
              style={styles.webStepBtn}
            >
              <Ionicons name="chevron-forward" size={15} color={UI_COLORS.textPrimary} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.scheduleValuePill}
            onPress={() => setPickerTarget("start")}
          >
            <Text style={styles.schedulePillText}>
              {localDateKey(startDateObj) === localDateKey(new Date())
                ? "Today"
                : startDateObj.toLocaleDateString()}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* End Date Toggle */}
      <View style={styles.scheduleRow}>
        <View style={styles.scheduleRowLeft}>
          <Ionicons name="flag-outline" size={18} color={color} />
          <Text style={styles.scheduleRowLabel}>Target End Date</Text>
        </View>
        <Switch
          value={hasEndDate}
          onValueChange={setHasEndDate}
          trackColor={{ false: UI_COLORS.border, true: `${color}88` }}
          thumbColor={hasEndDate ? color : UI_COLORS.bgCard}
        />
      </View>

      {hasEndDate && (
        <View style={styles.indentedRow}>
          {Platform.OS === "web" ? (
            <View style={styles.webDateStepper}>
              <TouchableOpacity
                onPress={() => setEndDateObj((d) => addDays(d, -7))}
                style={styles.webStepBtn}
              >
                <Text style={styles.presetMiniText}>-1w</Text>
              </TouchableOpacity>
              <Text style={styles.schedulePillText}>
                {endDateObj.toLocaleDateString()}
              </Text>
              <TouchableOpacity
                onPress={() => setEndDateObj((d) => addDays(d, 7))}
                style={styles.webStepBtn}
              >
                <Text style={styles.presetMiniText}>+1w</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.scheduleValuePill}
              onPress={() => setPickerTarget("end")}
            >
              <Text style={styles.schedulePillText}>
                {endDateObj.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Time & Reminders */}
      <View style={styles.scheduleRow}>
        <View style={styles.scheduleRowLeft}>
          <Ionicons name="notifications-outline" size={18} color={color} />
          <Text style={styles.scheduleRowLabel}>Time & Reminder</Text>
        </View>
        <Switch
          value={hasReminder}
          onValueChange={setHasReminder}
          trackColor={{ false: UI_COLORS.border, true: `${color}88` }}
          thumbColor={hasReminder ? color : UI_COLORS.bgCard}
        />
      </View>

      {hasReminder && (
        <View style={styles.indentedColumn}>
          {Platform.OS !== "web" && (
            <TouchableOpacity
              style={styles.scheduleValuePill}
              onPress={() => setPickerTarget("time")}
            >
              <Text style={styles.schedulePillText}>
                ⏰ {formatTimeLabel(reminderTimeObj)}
              </Text>
            </TouchableOpacity>
          )}
          <View style={styles.presetChipRow}>
            {TIME_PRESETS.map((preset) => {
              const active = formatTimeLabel(reminderTimeObj) === preset;
              return (
                <TouchableOpacity
                  key={preset}
                  style={[
                    styles.presetMiniBtn,
                    active && { borderColor: color, backgroundColor: `${color}18` },
                  ]}
                  onPress={() => setReminderTimeObj(parseTaskTime(preset))}
                >
                  <Text
                    style={[
                      styles.presetMiniText,
                      active && { color, fontWeight: fontWeight.extrabold },
                    ]}
                  >
                    {preset}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {pickerTarget && Platform.OS !== "web" && (
        <DateTimePicker
          themeVariant="light"
          accentColor={UI_COLORS.cmuRed}
          value={
            pickerTarget === "start"
              ? startDateObj
              : pickerTarget === "end"
              ? endDateObj
              : reminderTimeObj
          }
          mode={pickerTarget === "time" ? "time" : "date"}
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(_ev: DateTimePickerEvent, selected?: Date) => {
            const currentTarget = pickerTarget;
            setPickerTarget(null);
            if (!selected) return;
            if (currentTarget === "start") setStartDateObj(selected);
            else if (currentTarget === "end") setEndDateObj(selected);
            else setReminderTimeObj(selected);
          }}
        />
      )}

      {/* Priority & Gamification Reward */}
      <Text style={[styles.subLabel, { marginTop: spacing.md }]}>
        Priority & Daily Reward
      </Text>
      <View style={styles.priorityRow}>
        {(["low", "medium", "high"] as const).map((p) => {
          const active = priority === p;
          const pColor =
            p === "high"
              ? UI_COLORS.priorityHigh
              : p === "medium"
              ? UI_COLORS.priorityMedium
              : UI_COLORS.priorityLow;
          return (
            <TouchableOpacity
              key={p}
              style={[
                styles.priorityBtn,
                active && {
                  borderColor: pColor,
                  backgroundColor: `${pColor}1A`,
                },
              ]}
              onPress={() => setPriority(p)}
            >
              <Text
                style={[
                  styles.priorityBtnTitle,
                  active && { color: pColor, fontWeight: fontWeight.extrabold },
                ]}
              >
                {p === "medium" ? "NORMAL" : p.toUpperCase()}
              </Text>
              <Text style={styles.priorityXpSub}>+{HABIT_PRIORITY_XP[p]} XP</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.rewardCallout}>
        <Text style={styles.rewardCalloutText}>
          Completing this habit feeds Scotty & awards{" "}
          <Text style={{ color: UI_COLORS.cmuGold, fontWeight: fontWeight.extrabold }}>
            +{HABIT_PRIORITY_XP[priority]} XP ⚡ +2 🪙
          </Text>
        </Text>
      </View>
    </View>
  );

  return (
    <>
      {/* Header */}
      <View style={styles.topHeader}>
        <View style={{ flex: 1, paddingRight: spacing.sm }}>
          {!isEditing && (
            <Text style={[styles.stepTag, { color }]}>
              STEP {stepIndex + 1} OF {WIZARD_TITLES.length}
            </Text>
          )}
          <Text style={styles.modalTitle}>
            {isEditing ? "Edit Habit" : WIZARD_TITLES[stepIndex]}
          </Text>
        </View>
        <PressableScale
          onPress={onClose}
          disabled={saving}
          scaleTo={0.9}
          style={styles.closeIconBtn}
        >
          <Ionicons name="close" size={22} color={UI_COLORS.textMuted} />
        </PressableScale>
      </View>

      {/* Wizard Progress Bar */}
      {!isEditing && (
        <View style={styles.stepDotsRow}>
          {WIZARD_TITLES.map((_, idx) => {
            const completedOrCurrent = idx <= stepIndex;
            return (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.stepSegment,
                  completedOrCurrent && { backgroundColor: color },
                ]}
                disabled={idx > stepIndex && !title.trim() && idx > 2}
                onPress={() => {
                  if (idx <= stepIndex) setStepIndex(idx);
                }}
              />
            );
          })}
        </View>
      )}

      {/* Body */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollBody}
        keyboardShouldPersistTaps="handled"
      >
        {isEditing ? (
          <>
            {renderDefinitionSection()}
            {renderCategorySection()}
            {renderEvaluationSection()}
            {renderFrequencySection()}
            {renderScheduleSection()}
          </>
        ) : (
          <FadeSwitchView viewKey={stepIndex}>
            {stepIndex === 0 && renderCategorySection()}
            {stepIndex === 1 && renderEvaluationSection()}
            {stepIndex === 2 && renderDefinitionSection()}
            {stepIndex === 3 && renderFrequencySection()}
            {stepIndex === 4 && renderScheduleSection()}
          </FadeSwitchView>
        )}
      </ScrollView>

      {/* Footer Navigation */}
      <View style={styles.footerBar}>
        {isEditing ? (
          <>
            <PressableScale
              style={styles.secondaryBtn}
              scaleTo={0.96}
              disabled={saving}
              onPress={onClose}
            >
              <Text style={styles.secondaryBtnText}>Cancel</Text>
            </PressableScale>
            <PressableScale
              style={[
                styles.primaryBtn,
                { backgroundColor: UI_COLORS.cmuRed },
                saving && { opacity: 0.55 },
              ]}
              scaleTo={0.96}
              haptic="light"
              disabled={saving}
              onPress={handleFinalSave}
            >
              <Text style={styles.primaryBtnText}>
                {saving ? "Saving..." : "Save Changes"}
              </Text>
            </PressableScale>
          </>
        ) : (
          <>
            <PressableScale
              style={styles.secondaryBtn}
              scaleTo={0.96}
              disabled={saving}
              onPress={handlePrevStep}
            >
              <Text style={styles.secondaryBtnText}>
                {stepIndex === 0 ? "Cancel" : "Back"}
              </Text>
            </PressableScale>

            <PressableScale
              style={[
                styles.primaryBtn,
                {
                  backgroundColor:
                    stepIndex === WIZARD_TITLES.length - 1
                      ? UI_COLORS.cmuRed
                      : color,
                },
                saving && { opacity: 0.55 },
              ]}
              scaleTo={0.96}
              haptic={stepIndex === WIZARD_TITLES.length - 1 ? "light" : "selection"}
              disabled={saving}
              onPress={handleNextStep}
            >
              <Text style={styles.primaryBtnText}>
                {stepIndex === WIZARD_TITLES.length - 1
                  ? saving
                    ? "Creating..."
                    : "Create Habit"
                  : "Next"}
              </Text>
            </PressableScale>
          </>
        )}
      </View>
    </>
  );
}

export default function AddHabitModal({
  visible,
  editingHabit,
  saving = false,
  onClose,
  onSave,
}: AddHabitModalProps) {
  const [wasVisible, setWasVisible] = useState(visible);
  const [sessionId, setSessionId] = useState(0);
  const [activeEditingHabit, setActiveEditingHabit] =
    useState<HabitItem | null>(editingHabit);

  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setSessionId((n) => n + 1);
      setActiveEditingHabit(editingHabit);
    }
  } else if (visible && editingHabit !== activeEditingHabit) {
    setActiveEditingHabit(editingHabit);
  }

  return (
    <AnimatedModal
      visible={visible}
      variant="dialog"
      dismissOnBackdropPress={!saving}
      onClose={() => {
        if (!saving) onClose();
      }}
      cardStyle={styles.modalCard}
    >
      <AddHabitModalForm
        key={`${sessionId}:${activeEditingHabit?.id ?? "new"}`}
        editingHabit={activeEditingHabit}
        saving={saving}
        onClose={onClose}
        onSave={onSave}
      />
    </AnimatedModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: UI_COLORS.overlay,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg + 2,
  },
  modalCard: {
    width: "100%",
    maxWidth: 460,
    maxHeight: "90%",
    backgroundColor: UI_COLORS.bgCard,
    borderColor: UI_COLORS.border,
    borderWidth: 1,
    borderRadius: 14,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  stepTag: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.extrabold,
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  modalTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.black,
    color: UI_COLORS.textPrimary,
    lineHeight: 24,
  },
  closeIconBtn: {
    padding: spacing.xs,
  },
  stepDotsRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: spacing.lg,
  },
  stepSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: UI_COLORS.bgElevated,
  },
  scrollBody: {
    paddingBottom: spacing.md,
  },
  sectionBlock: {
    marginBottom: spacing.lg,
  },
  sectionHeading: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.extrabold,
    color: UI_COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: spacing.sm + 2,
    marginTop: spacing.xs,
  },
  subLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: UI_COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },

  /* Step 1: Categories & Palette */
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8,
  },
  categoryCard: {
    width: "48.5%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: UI_COLORS.bgWarm,
    borderWidth: 1,
    borderColor: UI_COLORS.border,
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 10,
  },
  categoryCellHalf: {
    width: "48.5%",
  },
  categoryCardFullWidth: {
    width: "100%",
  },
  categoryCardTextWrap: {
    flex: 1,
    paddingRight: 6,
  },
  categoryLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: UI_COLORS.textSecondary,
  },
  categorySubtitle: {
    fontSize: fontSize.xxs + 1,
    color: UI_COLORS.textMuted,
    marginTop: 1,
  },
  categoryBadge: {
    width: 32,
    height: 32,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
  customizeToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: spacing.md,
    paddingVertical: 8,
    borderRadius: radii.xl,
    backgroundColor: UI_COLORS.bgWarm,
    borderWidth: 1,
    borderColor: UI_COLORS.border,
  },
  customizeToggleText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: UI_COLORS.textSecondary,
  },
  palettePanel: {
    marginTop: spacing.sm + 2,
    padding: spacing.md,
    borderRadius: 10,
    backgroundColor: UI_COLORS.bgWarm,
    borderWidth: 1,
    borderColor: UI_COLORS.border,
  },
  colorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  colorSwatch: {
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  colorSwatchActive: {
    borderWidth: 2.5,
    borderColor: UI_COLORS.textPrimary,
  },
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  iconOptionBtn: {
    width: 38,
    height: 38,
    borderRadius: 9,
    backgroundColor: UI_COLORS.bgCard,
    borderWidth: 1,
    borderColor: UI_COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },

  /* Step 2: Evaluation & Unit Picker */
  evalOptionCard: {
    backgroundColor: UI_COLORS.bgWarm,
    borderWidth: 1.5,
    borderColor: UI_COLORS.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  evalCardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: UI_COLORS.borderLight,
    justifyContent: "center",
    alignItems: "center",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  evalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.extrabold,
    color: UI_COLORS.textPrimary,
    letterSpacing: 0.3,
  },
  evalDesc: {
    fontSize: fontSize.md,
    color: UI_COLORS.textSecondary,
    lineHeight: 17,
    paddingLeft: 30,
  },
  numericConfigBox: {
    backgroundColor: UI_COLORS.bgWarm,
    borderWidth: 1,
    borderColor: UI_COLORS.border,
    borderRadius: 10,
    padding: spacing.md,
    marginTop: 2,
  },
  conditionRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: spacing.md,
  },
  conditionPill: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: UI_COLORS.border,
    backgroundColor: UI_COLORS.bgCard,
    alignItems: "center",
  },
  conditionPillText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: UI_COLORS.textSecondary,
  },
  unitGroupSection: {
    marginBottom: spacing.md,
  },
  unitChipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  unitChip: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: radii.xl,
    backgroundColor: UI_COLORS.bgCard,
    borderWidth: 1,
    borderColor: UI_COLORS.border,
  },
  unitChipText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: UI_COLORS.textSecondary,
  },
  numericInputsRow: {
    flexDirection: "row",
    gap: 8,
  },
  whiteInput: {
    backgroundColor: UI_COLORS.bgCard,
  },
  numericPreviewHint: {
    marginTop: spacing.sm,
    fontSize: fontSize.md,
    fontStyle: "italic",
    color: UI_COLORS.textMuted,
  },

  /* Step 3: Name & Preview */
  previewCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: UI_COLORS.bgWarm,
    borderWidth: 1,
    borderColor: UI_COLORS.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: spacing.md,
  },
  previewTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.extrabold,
    color: UI_COLORS.textPrimary,
  },
  previewBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  previewFreqBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  previewFreqText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  previewUnitBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: UI_COLORS.bgCard,
    borderWidth: 1,
    borderColor: UI_COLORS.border,
  },
  previewUnitText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: UI_COLORS.textSecondary,
  },
  input: {
    backgroundColor: UI_COLORS.bgWarm,
    borderColor: UI_COLORS.border,
    borderWidth: 1,
    borderRadius: radii.xl,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: UI_COLORS.textPrimary,
    fontSize: fontSize.lg,
  },
  multilineInput: {
    minHeight: 64,
    textAlignVertical: "top",
  },
  errorText: {
    color: UI_COLORS.cmuRed,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    marginTop: 5,
  },

  /* Step 4: Frequency */
  freqOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: UI_COLORS.bgWarm,
    borderWidth: 1.5,
    borderColor: UI_COLORS.border,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  freqOptionContainer: {
    backgroundColor: UI_COLORS.bgWarm,
    borderWidth: 1.5,
    borderColor: UI_COLORS.border,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  freqOptionHeaderTouch: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  freqOptionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: UI_COLORS.textPrimary,
  },
  freqExpandedBody: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: UI_COLORS.border,
  },
  weekdaySelectRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 4,
  },
  weekdayChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: UI_COLORS.bgCard,
    borderWidth: 1,
    borderColor: UI_COLORS.border,
    alignItems: "center",
  },
  countChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: UI_COLORS.bgCard,
    borderWidth: 1,
    borderColor: UI_COLORS.border,
    alignItems: "center",
  },
  weekdayChipText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: UI_COLORS.textSecondary,
  },
  presetChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  presetMiniBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: UI_COLORS.bgCard,
    borderWidth: 1,
    borderColor: UI_COLORS.border,
  },
  presetMiniText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: UI_COLORS.textSecondary,
  },
  freqHintText: {
    fontSize: fontSize.sm,
    color: UI_COLORS.textMuted,
    marginTop: 8,
  },
  intervalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  intervalLabel: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: UI_COLORS.textSecondary,
  },
  intervalStepBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: UI_COLORS.bgCard,
    borderWidth: 1,
    borderColor: UI_COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },
  intervalCountText: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.black,
    minWidth: 28,
    textAlign: "center",
  },

  /* Step 5: Schedule & Priority */
  scheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: UI_COLORS.bgWarm,
    borderWidth: 1,
    borderColor: UI_COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  scheduleRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  scheduleRowLabel: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: UI_COLORS.textPrimary,
  },
  scheduleValuePill: {
    backgroundColor: UI_COLORS.bgCard,
    borderWidth: 1,
    borderColor: UI_COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  schedulePillText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: UI_COLORS.textPrimary,
  },
  indentedRow: {
    alignItems: "flex-end",
    marginTop: -2,
    marginBottom: 8,
  },
  indentedColumn: {
    marginTop: -2,
    marginBottom: 10,
    gap: 4,
  },
  webDateStepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: UI_COLORS.bgCard,
    borderWidth: 1,
    borderColor: UI_COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  webStepBtn: {
    padding: 3,
  },
  priorityRow: {
    flexDirection: "row",
    gap: 8,
  },
  priorityBtn: {
    flex: 1,
    backgroundColor: UI_COLORS.bgWarm,
    borderWidth: 1.5,
    borderColor: UI_COLORS.border,
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: "center",
    gap: 2,
  },
  priorityBtnTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: UI_COLORS.textSecondary,
  },
  priorityXpSub: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: UI_COLORS.textMuted,
  },
  rewardCallout: {
    backgroundColor: UI_COLORS.goldTint,
    borderColor: UI_COLORS.borderLight,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginTop: spacing.md,
    alignItems: "center",
  },
  rewardCalloutText: {
    fontSize: fontSize.md,
    color: UI_COLORS.textPrimary,
    fontWeight: fontWeight.semibold,
    textAlign: "center",
  },

  /* Footer */
  footerBar: {
    flexDirection: "row",
    gap: 10,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: UI_COLORS.border,
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: UI_COLORS.bgElevated,
    borderRadius: radii.xl,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryBtnText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: UI_COLORS.textSecondary,
  },
  primaryBtn: {
    flex: 1.8,
    borderRadius: radii.xl,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryBtnText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.extrabold,
    color: UI_COLORS.textOnAccent,
  },
});
