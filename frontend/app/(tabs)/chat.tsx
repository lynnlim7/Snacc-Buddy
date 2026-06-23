/**
 * Chat Tab — AI Nutrition Coach conversation.
 *
 * A real chat: the thread starts empty, the user asks questions, and the coach
 * answers (with optional recipe suggestions) grounded in their own profile +
 * logged meals via POST /api/v1/nutrition-coach/chat. Layout follows the Figma
 * coach design using the app's existing wine/blush palette (constants/theme).
 */
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
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
import { coachApi } from "../../services/api";
import { CoachMessage, CoachRecipe } from "../../types/coach";

const COACH_AVATAR = require("../../assets/icon.png");

const SUGGESTIONS = [
  "What should I eat tonight?",
  "How can I increase my protein?",
  "Why am I not losing weight?",
  "Give me a quick high-protein lunch",
];

interface Message {
  id: string;
  role: "coach" | "user";
  text: string;
  recipes?: CoachRecipe[];
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const scrollToEnd = () =>
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));

  const send = async (questionText?: string) => {
    const text = (questionText ?? draft).trim();
    if (!text || sending) return;

    const userMsg: Message = { id: `u${Date.now()}`, role: "user", text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setDraft("");
    setSending(true);
    scrollToEnd();

    // Send the full conversation so the coach has context for the latest turn.
    const history: CoachMessage[] = nextMessages.map((m) => ({
      role: m.role,
      content: m.text,
    }));

    try {
      const res = await coachApi.chat(history);
      setMessages((prev) => [
        ...prev,
        {
          id: `c${Date.now()}`,
          role: "coach",
          text: res.reply,
          recipes: res.recipes?.length ? res.recipes : undefined,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `e${Date.now()}`,
          role: "coach",
          text: "Sorry — I couldn't reach the coach just now. Please try again in a moment.",
        },
      ]);
    } finally {
      setSending(false);
      scrollToEnd();
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <PaperBackground>
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <Image source={COACH_AVATAR} style={styles.headerAvatar} />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Snacc Buddy</Text>
            <Text style={styles.headerSubtitle}>AI Nutrition Coach</Text>
          </View>
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
        >
          {/* ── Message thread ── */}
          <ScrollView
            ref={scrollRef}
            style={styles.thread}
            contentContainerStyle={[
              styles.threadContent,
              isEmpty && styles.threadContentEmpty,
            ]}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={scrollToEnd}
            keyboardShouldPersistTaps="handled"
          >
            {isEmpty ? (
              <EmptyState onPick={(q) => send(q)} disabled={sending} />
            ) : (
              messages.map((m) =>
                m.role === "coach" ? (
                  <CoachMessageView key={m.id} message={m} />
                ) : (
                  <UserMessageView key={m.id} message={m} />
                ),
              )
            )}

            {sending && <TypingBubble />}
          </ScrollView>

          {/* ── Composer ── */}
          <View style={styles.composer}>
            <TextInput
              style={styles.composerInput}
              placeholder="Ask Snacc Buddy…"
              placeholderTextColor={colors.textLight}
              value={draft}
              onChangeText={setDraft}
              onSubmitEditing={() => send()}
              returnKeyType="send"
              editable={!sending}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendButton, (!draft.trim() || sending) && styles.sendButtonDisabled]}
              onPress={() => send()}
              activeOpacity={0.8}
              disabled={!draft.trim() || sending}
            >
              <Ionicons name="send" size={18} color={colors.white} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </PaperBackground>
  );
}

/* ── Empty state: intro + suggested questions ── */
function EmptyState({ onPick, disabled }: { onPick: (q: string) => void; disabled: boolean }) {
  return (
    <View style={styles.emptyWrap}>
      <Image source={COACH_AVATAR} style={styles.emptyAvatar} />
      <Text style={styles.emptyTitle}>Hey! I'm your nutrition coach</Text>
      <Text style={styles.emptyBody}>
        Ask me anything about your meals, macros, or goals — I'll give advice based on what
        you've logged.
      </Text>
      <View style={styles.suggestions}>
        {SUGGESTIONS.map((q) => (
          <TouchableOpacity
            key={q}
            style={styles.suggestionChip}
            onPress={() => onPick(q)}
            activeOpacity={0.75}
            disabled={disabled}
          >
            <Text style={styles.suggestionText}>{q}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

/* ── Coach message (left, avatar + blush card) ── */
function CoachMessageView({ message }: { message: Message }) {
  return (
    <View style={styles.coachRow}>
      <Image source={COACH_AVATAR} style={styles.bubbleAvatar} />
      <View style={styles.coachColumn}>
        {message.text ? (
          <View style={styles.coachBubble}>
            <Text style={styles.coachText}>{message.text}</Text>
          </View>
        ) : null}
        {message.recipes?.map((r, i) => (
          <RecipeCardView key={`${r.title}-${i}`} recipe={r} />
        ))}
      </View>
    </View>
  );
}

/* ── User message (right, wine fill) ── */
function UserMessageView({ message }: { message: Message }) {
  return (
    <View style={styles.userRow}>
      <View style={styles.userBubble}>
        <Text style={styles.userText}>{message.text}</Text>
      </View>
    </View>
  );
}

/* ── Typing indicator while the coach is thinking ── */
function TypingBubble() {
  return (
    <View style={styles.coachRow}>
      <Image source={COACH_AVATAR} style={styles.bubbleAvatar} />
      <View style={[styles.coachBubble, styles.typingBubble]}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.typingText}>thinking…</Text>
      </View>
    </View>
  );
}

/* ── Inline recipe card ── */
function RecipeCardView({ recipe }: { recipe: CoachRecipe }) {
  const minutes = recipe.time_minutes != null ? `${recipe.time_minutes} min` : null;
  return (
    <View style={styles.recipeCard}>
      <View style={styles.recipeImage}>
        <Ionicons name="restaurant" size={32} color={colors.primaryBorder} />
        {minutes ? (
          <View style={styles.timeBadge}>
            <Ionicons name="time-outline" size={12} color={colors.white} />
            <Text style={styles.timeBadgeText}>{minutes}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.recipeBody}>
        <Text style={styles.recipeTitle}>{recipe.title}</Text>

        {recipe.tags?.length ? (
          <View style={styles.tagRow}>
            {recipe.tags.map((t) => (
              <View key={t} style={styles.tag}>
                <Text style={styles.tagText}>{t}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.macroRow}>
          {recipe.calories != null && <Macro value={`${recipe.calories}`} label="kcal" />}
          {recipe.protein_g != null && <Macro value={`${recipe.protein_g}g`} label="protein" />}
          {recipe.carbs_g != null && <Macro value={`${recipe.carbs_g}g`} label="carbs" />}
          {recipe.fat_g != null && <Macro value={`${recipe.fat_g}g`} label="fat" />}
        </View>

        {recipe.reason ? <Text style={styles.recipeReason}>{recipe.reason}</Text> : null}

        <TouchableOpacity style={styles.viewRecipeButton} activeOpacity={0.8}>
          <Text style={styles.viewRecipeText}>View Full Recipe →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Macro({ value, label }: { value: string; label: string }) {
  return (
    <Text style={styles.macroText}>
      <Text style={styles.macroValue}>{value}</Text>
      <Text style={styles.macroLabel}> {label}</Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },

  // ── Header ──
  header: {
    flexDirection:     "row",
    alignItems:        "center",
    gap:               spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingTop:        spacing.sm,
    paddingBottom:     spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerAvatar: {
    width:        44,
    height:       44,
    borderRadius: 22,
    borderWidth:  1,
    borderColor:  colors.primaryBorder,
  },
  headerText: { flex: 1 },
  headerTitle: {
    fontFamily: fonts.heading700,
    fontSize:   24,
    color:      colors.text,
    fontStyle:  "italic",
  },
  headerSubtitle: {
    fontFamily: fonts.body500,
    fontSize:   12,
    color:      colors.textMuted,
    marginTop:  -2,
  },
  onlineRow: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           6,
  },
  onlineDot: {
    width:           8,
    height:          8,
    borderRadius:    4,
    backgroundColor: "#4CAF50",
  },
  onlineText: {
    fontFamily: fonts.body500,
    fontSize:   12,
    color:      colors.textMuted,
  },

  // ── Thread ──
  thread:        { flex: 1 },
  threadContent: {
    paddingHorizontal: spacing.xl,
    paddingTop:        spacing.lg,
    paddingBottom:     spacing.lg,
    gap:               spacing.md,
  },
  threadContentEmpty: {
    flexGrow:       1,
    justifyContent: "center",
  },

  // ── Empty state ──
  emptyWrap: {
    alignItems: "center",
    gap:        spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  emptyAvatar: {
    width:        72,
    height:       72,
    borderRadius: 36,
    borderWidth:  1,
    borderColor:  colors.primaryBorder,
    marginBottom: spacing.xs,
  },
  emptyTitle: {
    fontFamily: fonts.heading700,
    fontSize:   24,
    color:      colors.text,
    fontStyle:  "italic",
    textAlign:  "center",
  },
  emptyBody: {
    fontFamily: fonts.body400,
    fontSize:   14,
    lineHeight: 21,
    color:      colors.textMuted,
    textAlign:  "center",
    marginBottom: spacing.md,
  },
  suggestions: {
    width: "100%",
    gap:   spacing.sm,
  },
  suggestionChip: {
    backgroundColor:   colors.bgCard,
    borderRadius:      radius.pill,
    borderWidth:       1,
    borderColor:       colors.primaryBorder,
    paddingHorizontal: spacing.md,
    paddingVertical:   12,
    alignItems:        "center",
  },
  suggestionText: {
    fontFamily: fonts.body600,
    fontSize:   14,
    color:      colors.primary,
  },

  // ── Coach message ──
  coachRow: {
    flexDirection: "row",
    alignItems:    "flex-start",
    gap:           spacing.sm,
    maxWidth:      "92%",
  },
  bubbleAvatar: {
    width:        28,
    height:       28,
    borderRadius: 14,
    borderWidth:  1,
    borderColor:  colors.primaryBorder,
    marginTop:    2,
  },
  coachColumn: {
    flex: 1,
    gap:  spacing.sm,
  },
  coachBubble: {
    backgroundColor:     colors.bgCard,
    borderRadius:        radius.md,
    borderTopLeftRadius: radius.sm,
    borderWidth:         1,
    borderColor:         colors.border,
    paddingHorizontal:   spacing.md,
    paddingVertical:     spacing.sm + 2,
    alignSelf:           "flex-start",
  },
  coachText: {
    fontFamily: fonts.body400,
    fontSize:   15,
    lineHeight: 22,
    color:      colors.text,
  },
  typingBubble: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           spacing.sm,
  },
  typingText: {
    fontFamily: fonts.body400,
    fontSize:   14,
    color:      colors.textMuted,
    fontStyle:  "italic",
  },

  // ── User message ──
  userRow: {
    flexDirection:  "row",
    justifyContent: "flex-end",
  },
  userBubble: {
    backgroundColor:      colors.primary,
    borderRadius:         radius.md,
    borderTopRightRadius: radius.sm,
    paddingHorizontal:    spacing.md,
    paddingVertical:      spacing.sm + 2,
    maxWidth:             "85%",
  },
  userText: {
    fontFamily: fonts.body600,
    fontSize:   15,
    lineHeight: 22,
    color:      colors.white,
  },

  // ── Recipe card ──
  recipeCard: {
    backgroundColor: colors.bgCard,
    borderRadius:    radius.md,
    borderWidth:     1,
    borderColor:     colors.border,
    overflow:        "hidden",
    alignSelf:       "stretch",
  },
  recipeImage: {
    height:          150,
    backgroundColor: colors.primaryLight,
    alignItems:      "center",
    justifyContent:  "center",
  },
  timeBadge: {
    position:          "absolute",
    bottom:            spacing.sm,
    right:             spacing.sm,
    flexDirection:     "row",
    alignItems:        "center",
    gap:               4,
    backgroundColor:   colors.accentDark,
    borderRadius:      radius.pill,
    paddingHorizontal: 10,
    paddingVertical:   4,
    opacity:           0.92,
  },
  timeBadgeText: {
    fontFamily: fonts.body600,
    fontSize:   11,
    color:      colors.white,
  },
  recipeBody: {
    padding: spacing.md,
    gap:     spacing.sm,
  },
  recipeTitle: {
    fontFamily: fonts.body700,
    fontSize:   18,
    color:      colors.text,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap:      "wrap",
    gap:           spacing.sm,
  },
  tag: {
    backgroundColor:   colors.primaryLight,
    borderRadius:      radius.pill,
    paddingHorizontal: 12,
    paddingVertical:   5,
  },
  tagText: {
    fontFamily: fonts.body600,
    fontSize:   12,
    color:      colors.primary,
  },
  macroRow: {
    flexDirection: "row",
    flexWrap:      "wrap",
    gap:           spacing.md,
    marginTop:     2,
  },
  macroText: {
    fontFamily: fonts.body400,
    fontSize:   13,
  },
  macroValue: {
    fontFamily: fonts.body700,
    fontSize:   13,
    color:      colors.text,
  },
  macroLabel: {
    fontFamily: fonts.body400,
    fontSize:   13,
    color:      colors.textMuted,
  },
  recipeReason: {
    fontFamily: fonts.body400,
    fontSize:   13,
    lineHeight: 19,
    color:      colors.textMuted,
    fontStyle:  "italic",
  },
  viewRecipeButton: {
    backgroundColor: colors.primaryLight,
    borderRadius:    radius.pill,
    paddingVertical: 12,
    alignItems:      "center",
    justifyContent:  "center",
    marginTop:       4,
  },
  viewRecipeText: {
    fontFamily: fonts.body700,
    fontSize:   14,
    color:      colors.primary,
  },

  // ── Composer ──
  composer: {
    flexDirection:     "row",
    alignItems:        "flex-end",
    gap:               spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingTop:        spacing.sm,
    paddingBottom:     spacing.sm,
  },
  composerInput: {
    flex:              1,
    backgroundColor:   colors.bgSecondary,
    borderRadius:      radius.pill,
    borderWidth:       1,
    borderColor:       colors.primaryBorder,
    paddingHorizontal: spacing.md,
    paddingTop:        Platform.OS === "ios" ? 12 : 8,
    paddingBottom:     Platform.OS === "ios" ? 12 : 8,
    fontFamily:        fonts.body400,
    fontSize:          15,
    color:             colors.text,
    maxHeight:         120,
  },
  sendButton: {
    width:           48,
    height:          48,
    borderRadius:    24,
    backgroundColor: colors.primary,
    alignItems:      "center",
    justifyContent:  "center",
  },
  sendButtonDisabled: {
    opacity: 0.45,
  },
});
