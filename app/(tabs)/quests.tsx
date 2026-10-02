import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import ScreenContainer from "@/components/ui/ScreenContainer";
import ScreenTitle from "@/components/ui/ScreenTitle";
import FilterRow from "@/components/ui/FilterRow";
import QuestHeroBanner from "@/components/quests/QuestHeroBanner";
import QuestCard from "@/components/quests/QuestCard";
import XPFloat from "@/components/XPFloat";
import { useQuests } from "@/hooks/useQuests";
import { UI_COLORS } from "@/constants/gamification";
import { spacing } from "@/constants/tokens";

const CATEGORY_OPTIONS = [
  { id: "all" as const, label: "All" },
  { id: "cmu" as const, label: "🏫 CMU" },
  { id: "academic" as const, label: "📚 Academic" },
  { id: "social" as const, label: "👥 Social" },
  { id: "wellness" as const, label: "💚 Wellness" },
];

export default function QuestsScreen() {
  const {
    filter,
    setFilter,
    filteredQuests,
    totalActive,
    totalXpAvailable,
    totalCoinsAvailable,
    activeFloat,
    setActiveFloat,
    handleClaim,
  } = useQuests();

  return (
    <ScreenContainer>
      <ScreenTitle title="Campus Quests" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Active Quests Hero Banner */}
        <QuestHeroBanner
          totalActive={totalActive}
          totalXpAvailable={totalXpAvailable}
          totalCoinsAvailable={totalCoinsAvailable}
        />

        {/* Category Filter Pills */}
        <FilterRow
          options={CATEGORY_OPTIONS}
          selected={filter}
          onSelect={setFilter}
          activeColor={UI_COLORS.questPurple}
          scrollable
          style={styles.filterRow}
        />

        {/* Quests List */}
        <View style={styles.questList}>
          {filteredQuests.map((quest) => (
            <QuestCard
              key={quest.id}
              quest={quest}
              onClaim={handleClaim}
            />
          ))}
        </View>
      </ScrollView>

      {activeFloat && (
        <XPFloat
          amount={activeFloat.xp}
          coins={activeFloat.coins}
          onDone={() => setActiveFloat(null)}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: 100,
  },
  filterRow: {
    marginBottom: spacing.lg,
  },
  questList: {
    gap: spacing.lg + 2,
  },
});
