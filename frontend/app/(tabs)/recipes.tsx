/**
 * Recipes Tab — placeholder screen.
 * RAG-based recipe recommendations are planned for Phase 2.
 * This screen shows the intended layout with a "coming soon" state.
 */
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { PaperBackground } from "../../components/PaperBackground";
import { colors, fonts, radius, spacing } from "../../constants/theme";
import { useDiaryStore, MealEntry } from "../../stores/diaryStore";
import { useUserStore } from "../../stores/userStore";
import { computeNutritionTargets } from "../../utils/nutrition";

const FILTER_CHIPS = ["All", "Breakfast", "Lunch", "Dinner", "High Protein", "Quick & Easy"];

export default function RecipesScreen() {
  const [activeFilter, setActiveFilter] = useState("All");
  const profile = useUserStore((s) => s.profile);

  // Derive today's remaining calories for the budget banner
  const todayStr = new Date().toISOString().split("T")[0];
  const meals     = useDiaryStore((s) => s.mealsByDate[todayStr] ?? []);
  const consumed  = (meals as MealEntry[]).reduce((sum: number, m: MealEntry) => sum + m.totalCalories, 0);
  const targets   = computeNutritionTargets(profile);
  const remaining = Math.max(0, targets.calories - consumed);

  return (
    <PaperBackground>
      <SafeAreaView style={styles.safe}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ── */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.eyebrow}>AI-MATCHED RECIPES</Text>
              <Text style={styles.heading}>Recipe Planner</Text>
            </View>
            <View style={styles.headerIcon}>
              <Ionicons name="restaurant-outline" size={22} color={colors.primary} />
            </View>
          </View>

          {/* ── Budget banner ── */}
          <View style={styles.budgetBanner}>
            <View style={styles.budgetLeft}>
              <Ionicons name="flame-outline" size={18} color={colors.primary} />
              <View>
                <Text style={styles.budgetLabel}>Remaining today</Text>
                <Text style={styles.budgetValue}>{remaining.toLocaleString()} kcal</Text>
              </View>
            </View>
            <View style={styles.budgetGoal}>
              <Text style={styles.budgetGoalLabel}>Daily goal</Text>
              <Text style={styles.budgetGoalValue}>{targets.calories.toLocaleString()} kcal</Text>
            </View>
          </View>

          {/* ── Search bar ── */}
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={16} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search recipes…"
              placeholderTextColor={colors.textLight}
              editable={false}
            />
          </View>

          {/* ── Filter chips ── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {FILTER_CHIPS.map((chip) => (
              <TouchableOpacity
                key={chip}
                style={[styles.chip, activeFilter === chip && styles.chipActive]}
                onPress={() => setActiveFilter(chip)}
                activeOpacity={0.75}
              >
                <Text style={[styles.chipText, activeFilter === chip && styles.chipTextActive]}>
                  {chip}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* ── Coming soon state ── */}
          <View style={styles.comingSoonCard}>
            <View style={styles.comingSoonIcon}>
              <Ionicons name="sparkles-outline" size={36} color={colors.primary} />
            </View>
            <Text style={styles.comingSoonTitle}>AI Recipes Coming Soon</Text>
            <Text style={styles.comingSoonBody}>
              Snacc Buddy will soon suggest personalised recipes based on your nutrition goals,
              food diary, and macros — powered by an AI knowledge base of 10,000+ recipes.
            </Text>

            <View style={styles.featureList}>
              {[
                { icon: "nutrition-outline",     label: "Macro-matched to your daily targets" },
                { icon: "camera-outline",         label: "Log meals straight from a recipe" },
                { icon: "bookmarks-outline",      label: "Save favourites to your cookbook" },
                { icon: "calendar-outline",       label: "Weekly meal planning & prep lists" },
              ].map(({ icon, label }) => (
                <View key={label} style={styles.featureItem}>
                  <View style={styles.featureIconWrap}>
                    <Ionicons name={icon as any} size={16} color={colors.primary} />
                  </View>
                  <Text style={styles.featureLabel}>{label}</Text>
                </View>
              ))}
            </View>

            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonBadgeText}>Phase 2 · RAG-powered</Text>
            </View>
          </View>

          {/* ── Placeholder recipe cards ── */}
          <Text style={styles.sectionLabel}>Preview cards</Text>
          <View style={styles.recipeGrid}>
            {[
              { title: "Grilled Salmon Bowl",  cal: 520, tag: "Dinner",    time: "25 min" },
              { title: "Greek Yogurt Parfait", cal: 310, tag: "Breakfast", time: "5 min"  },
              { title: "Lentil Soup",          cal: 380, tag: "Lunch",     time: "30 min" },
              { title: "Chicken Stir-fry",     cal: 470, tag: "Dinner",    time: "20 min" },
            ].map((r) => (
              <View key={r.title} style={styles.recipeCard}>
                <View style={styles.recipeCardImg}>
                  <Ionicons name="restaurant-outline" size={28} color={colors.primaryBorder} />
                </View>
                <View style={styles.recipeCardBody}>
                  <View style={styles.recipeTagRow}>
                    <View style={styles.recipeTag}>
                      <Text style={styles.recipeTagText}>{r.tag}</Text>
                    </View>
                    <Text style={styles.recipeTime}>
                      <Ionicons name="time-outline" size={11} color={colors.textMuted} /> {r.time}
                    </Text>
                  </View>
                  <Text style={styles.recipeTitle} numberOfLines={2}>{r.title}</Text>
                  <Text style={styles.recipeCal}>{r.cal} kcal</Text>
                </View>
                <View style={styles.recipeLockOverlay}>
                  <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1 },
  scroll:        { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop:        spacing.lg,
    paddingBottom:     120,
  },

  // ── Header ──
  headerRow: {
    flexDirection:  "row",
    justifyContent: "space-between",
    alignItems:     "flex-start",
    marginBottom:   spacing.md,
  },
  eyebrow: {
    fontFamily:    fonts.body600,
    fontSize:      11,
    color:         colors.primary,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom:  2,
  },
  heading: {
    fontFamily: fonts.heading700,
    fontSize:   28,
    color:      colors.text,
    fontStyle:  "italic",
  },
  headerIcon: {
    width:           44,
    height:          44,
    borderRadius:    22,
    backgroundColor: colors.primaryLight,
    borderWidth:     1,
    borderColor:     colors.primaryBorder,
    alignItems:      "center",
    justifyContent:  "center",
    marginTop:       4,
  },

  // ── Budget banner ──
  budgetBanner: {
    backgroundColor: colors.primaryLight,
    borderRadius:    radius.md,
    borderWidth:     1,
    borderColor:     colors.primaryBorder,
    padding:         spacing.md,
    flexDirection:   "row",
    justifyContent:  "space-between",
    alignItems:      "center",
    marginBottom:    spacing.md,
  },
  budgetLeft: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           spacing.sm,
  },
  budgetLabel: {
    fontFamily: fonts.body400,
    fontSize:   11,
    color:      colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  budgetValue: {
    fontFamily: fonts.body700,
    fontSize:   18,
    color:      colors.primary,
  },
  budgetGoal: {
    alignItems: "flex-end",
  },
  budgetGoalLabel: {
    fontFamily: fonts.body400,
    fontSize:   11,
    color:      colors.textMuted,
  },
  budgetGoalValue: {
    fontFamily: fonts.body600,
    fontSize:   13,
    color:      colors.text,
  },

  // ── Search ──
  searchBar: {
    flexDirection:   "row",
    alignItems:      "center",
    backgroundColor: colors.bgCard,
    borderRadius:    radius.pill,
    borderWidth:     1,
    borderColor:     colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical:   10,
    gap:             spacing.sm,
    marginBottom:    spacing.md,
  },
  searchInput: {
    flex:       1,
    fontFamily: fonts.body400,
    fontSize:   14,
    color:      colors.text,
  },

  // ── Filter chips ──
  chipRow: {
    flexDirection: "row",
    gap:           spacing.sm,
    paddingBottom: spacing.md,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical:   7,
    borderRadius:      radius.pill,
    backgroundColor:   colors.bgCard,
    borderWidth:       1,
    borderColor:       colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor:     colors.primary,
  },
  chipText: {
    fontFamily: fonts.body500,
    fontSize:   13,
    color:      colors.textMuted,
  },
  chipTextActive: {
    color:      "#FFFFFF",
    fontFamily: fonts.body600,
  },

  // ── Coming soon card ──
  comingSoonCard: {
    backgroundColor: colors.bgCard,
    borderRadius:    radius.lg,
    borderWidth:     1,
    borderColor:     colors.border,
    padding:         spacing.lg,
    alignItems:      "center",
    gap:             spacing.md,
    marginBottom:    spacing.xl,
  },
  comingSoonIcon: {
    width:           72,
    height:          72,
    borderRadius:    36,
    backgroundColor: colors.primaryLight,
    alignItems:      "center",
    justifyContent:  "center",
  },
  comingSoonTitle: {
    fontFamily: fonts.heading700,
    fontSize:   22,
    color:      colors.text,
    fontStyle:  "italic",
    textAlign:  "center",
  },
  comingSoonBody: {
    fontFamily:  fonts.body400,
    fontSize:    14,
    color:       colors.textMuted,
    textAlign:   "center",
    lineHeight:  22,
  },
  featureList: {
    width:  "100%",
    gap:    spacing.sm,
  },
  featureItem: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           spacing.sm,
  },
  featureIconWrap: {
    width:           32,
    height:          32,
    borderRadius:    16,
    backgroundColor: colors.primaryLight,
    alignItems:      "center",
    justifyContent:  "center",
  },
  featureLabel: {
    fontFamily: fonts.body500,
    fontSize:   13,
    color:      colors.text,
    flex:       1,
  },
  comingSoonBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius:    radius.pill,
    paddingHorizontal: 16,
    paddingVertical:   6,
    borderWidth:     1,
    borderColor:     colors.primaryBorder,
  },
  comingSoonBadgeText: {
    fontFamily:    fonts.body600,
    fontSize:      11,
    color:         colors.primary,
    letterSpacing: 0.5,
  },

  // ── Recipe grid ──
  sectionLabel: {
    fontFamily:    fonts.body600,
    fontSize:      12,
    color:         colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom:  spacing.sm,
  },
  recipeGrid: {
    gap: spacing.md,
  },
  recipeCard: {
    backgroundColor: colors.bgCard,
    borderRadius:    radius.md,
    borderWidth:     1,
    borderColor:     colors.border,
    flexDirection:   "row",
    overflow:        "hidden",
    position:        "relative",
    opacity:         0.6,
  },
  recipeCardImg: {
    width:           90,
    height:          90,
    backgroundColor: colors.primaryLight,
    alignItems:      "center",
    justifyContent:  "center",
    flexShrink:      0,
  },
  recipeCardBody: {
    flex:    1,
    padding: spacing.sm,
    gap:     4,
  },
  recipeTagRow: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           spacing.sm,
  },
  recipeTag: {
    backgroundColor:  colors.primaryLight,
    borderRadius:     radius.pill,
    paddingHorizontal: 8,
    paddingVertical:   2,
  },
  recipeTagText: {
    fontFamily:    fonts.body600,
    fontSize:      10,
    color:         colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  recipeTime: {
    fontFamily: fonts.body400,
    fontSize:   11,
    color:      colors.textMuted,
  },
  recipeTitle: {
    fontFamily: fonts.body700,
    fontSize:   14,
    color:      colors.text,
  },
  recipeCal: {
    fontFamily: fonts.body400,
    fontSize:   12,
    color:      colors.textMuted,
  },
  recipeLockOverlay: {
    position:        "absolute",
    top:             spacing.sm,
    right:           spacing.sm,
  },
});
