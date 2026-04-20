import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Svg, { Path, Circle } from "react-native-svg";
import { useColors } from "@/hooks/useColors";

export type MealKey = "breakfast" | "lunch" | "dinner" | "snacks";

export interface FoodEntry {
  id: string;
  label: string;
  emoji: string;
  meal: MealKey;
  kcal: number;
  carbs: number;
  protein: number;
  fat: number;
  date: string;
  timestamp: string;
}

interface FoodPreset {
  id: string;
  label: string;
  emoji: string;
  serving: string;
  kcal: number;
  carbs: number;
  protein: number;
  fat: number;
}

const FOOD_PRESETS: FoodPreset[] = [
  { id: "pb_ball", label: "Peanut butter protein ball", emoji: "🍪", serving: "1 ball", kcal: 140, carbs: 12, protein: 8, fat: 8 },
  { id: "apple", label: "Apple", emoji: "🍎", serving: "1 medium", kcal: 95, carbs: 25, protein: 0, fat: 0 },
  { id: "banana", label: "Banana", emoji: "🍌", serving: "1 medium", kcal: 105, carbs: 27, protein: 1, fat: 0 },
  { id: "orange", label: "Orange", emoji: "🍊", serving: "1 medium", kcal: 62, carbs: 15, protein: 1, fat: 0 },
  { id: "berries", label: "Mixed berries", emoji: "🫐", serving: "1 cup", kcal: 80, carbs: 19, protein: 1, fat: 0 },
  { id: "egg", label: "Egg", emoji: "🥚", serving: "1 large", kcal: 70, carbs: 0, protein: 6, fat: 5 },
  { id: "oatmeal", label: "Oatmeal", emoji: "🥣", serving: "1 cup", kcal: 150, carbs: 27, protein: 5, fat: 3 },
  { id: "greek_yogurt", label: "Greek yogurt", emoji: "🥛", serving: "1 cup", kcal: 100, carbs: 6, protein: 17, fat: 0 },
  { id: "coffee", label: "Coffee, black", emoji: "☕", serving: "1 cup", kcal: 5, carbs: 0, protein: 0, fat: 0 },
  { id: "tea", label: "Green tea", emoji: "🍵", serving: "1 cup", kcal: 2, carbs: 0, protein: 0, fat: 0 },
  { id: "toast", label: "Toast", emoji: "🍞", serving: "1 slice", kcal: 80, carbs: 15, protein: 3, fat: 1 },
  { id: "avocado_toast", label: "Avocado toast", emoji: "🥑", serving: "1 slice", kcal: 195, carbs: 18, protein: 5, fat: 12 },
  { id: "pancakes", label: "Pancakes", emoji: "🥞", serving: "2 medium", kcal: 350, carbs: 44, protein: 8, fat: 14 },
  { id: "chicken", label: "Chicken breast", emoji: "🍗", serving: "100 g", kcal: 165, carbs: 0, protein: 31, fat: 4 },
  { id: "salmon", label: "Salmon", emoji: "🐟", serving: "100 g", kcal: 208, carbs: 0, protein: 22, fat: 13 },
  { id: "tuna", label: "Tuna", emoji: "🐟", serving: "100 g", kcal: 132, carbs: 0, protein: 28, fat: 1 },
  { id: "rice", label: "Rice, cooked", emoji: "🍚", serving: "1 cup", kcal: 205, carbs: 45, protein: 4, fat: 0 },
  { id: "pasta", label: "Pasta, cooked", emoji: "🍝", serving: "1 cup", kcal: 220, carbs: 43, protein: 8, fat: 1 },
  { id: "salad", label: "Garden salad", emoji: "🥗", serving: "1 bowl", kcal: 120, carbs: 12, protein: 4, fat: 7 },
  { id: "sandwich", label: "Sandwich", emoji: "🥪", serving: "1 whole", kcal: 320, carbs: 35, protein: 18, fat: 12 },
  { id: "wrap", label: "Wrap", emoji: "🌯", serving: "1 whole", kcal: 350, carbs: 38, protein: 16, fat: 14 },
  { id: "soup", label: "Soup", emoji: "🍲", serving: "1 bowl", kcal: 180, carbs: 22, protein: 8, fat: 6 },
  { id: "burger", label: "Burger", emoji: "🍔", serving: "1 whole", kcal: 354, carbs: 30, protein: 20, fat: 17 },
  { id: "pizza", label: "Pizza", emoji: "🍕", serving: "1 slice", kcal: 285, carbs: 36, protein: 12, fat: 10 },
  { id: "tacos", label: "Tacos", emoji: "🌮", serving: "2 tacos", kcal: 340, carbs: 32, protein: 18, fat: 16 },
  { id: "sushi", label: "Sushi roll", emoji: "🍣", serving: "1 roll", kcal: 250, carbs: 38, protein: 9, fat: 7 },
  { id: "steak", label: "Steak", emoji: "🥩", serving: "150 g", kcal: 380, carbs: 0, protein: 38, fat: 25 },
  { id: "tofu", label: "Tofu", emoji: "🍱", serving: "100 g", kcal: 144, carbs: 3, protein: 17, fat: 9 },
  { id: "potato", label: "Baked potato", emoji: "🥔", serving: "1 medium", kcal: 160, carbs: 37, protein: 4, fat: 0 },
  { id: "broccoli", label: "Broccoli", emoji: "🥦", serving: "1 cup", kcal: 55, carbs: 11, protein: 4, fat: 1 },
  { id: "almonds", label: "Almonds", emoji: "🌰", serving: "28 g", kcal: 160, carbs: 6, protein: 6, fat: 14 },
  { id: "peanut_butter", label: "Peanut butter", emoji: "🥜", serving: "2 tbsp", kcal: 190, carbs: 6, protein: 8, fat: 16 },
  { id: "cheese", label: "Cheese", emoji: "🧀", serving: "28 g", kcal: 110, carbs: 1, protein: 7, fat: 9 },
  { id: "milk", label: "Milk", emoji: "🥛", serving: "1 cup", kcal: 150, carbs: 12, protein: 8, fat: 8 },
  { id: "smoothie", label: "Smoothie", emoji: "🥤", serving: "16 oz", kcal: 250, carbs: 45, protein: 8, fat: 4 },
  { id: "protein_shake", label: "Protein shake", emoji: "🥤", serving: "1 scoop", kcal: 120, carbs: 3, protein: 24, fat: 2 },
  { id: "chocolate", label: "Dark chocolate", emoji: "🍫", serving: "1 oz", kcal: 170, carbs: 13, protein: 2, fat: 12 },
  { id: "ice_cream", label: "Ice cream", emoji: "🍦", serving: "1 scoop", kcal: 140, carbs: 17, protein: 2, fat: 7 },
  { id: "cookie", label: "Cookie", emoji: "🍪", serving: "1 cookie", kcal: 150, carbs: 22, protein: 2, fat: 7 },
  { id: "donut", label: "Donut", emoji: "🍩", serving: "1 donut", kcal: 250, carbs: 31, protein: 3, fat: 13 },
  { id: "fries", label: "French fries", emoji: "🍟", serving: "1 medium", kcal: 365, carbs: 48, protein: 4, fat: 17 },
  { id: "popcorn", label: "Popcorn", emoji: "🍿", serving: "3 cups", kcal: 95, carbs: 19, protein: 3, fat: 1 },
  { id: "wine", label: "Wine", emoji: "🍷", serving: "5 oz", kcal: 125, carbs: 4, protein: 0, fat: 0 },
  { id: "beer", label: "Beer", emoji: "🍺", serving: "12 oz", kcal: 150, carbs: 13, protein: 2, fat: 0 },
  { id: "water", label: "Water", emoji: "💧", serving: "1 cup", kcal: 0, carbs: 0, protein: 0, fat: 0 },
];

const MEALS: { key: MealKey; label: string; emoji: string; share: number }[] = [
  { key: "breakfast", label: "Breakfast", emoji: "☕", share: 0.3 },
  { key: "lunch", label: "Lunch", emoji: "🍝", share: 0.4 },
  { key: "dinner", label: "Dinner", emoji: "🥗", share: 0.25 },
  { key: "snacks", label: "Snacks", emoji: "🍎", share: 0.05 },
];

const DEFAULT_GOAL = 2926;
const DEFAULT_CARBS = 357;
const DEFAULT_PROTEIN = 143;
const DEFAULT_FAT = 94;

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface Props {
  burned: number;
}

export function NutritionTracker({ burned }: Props) {
  const colors = useColors();
  const [foods, setFoods] = useState<FoodEntry[]>([]);
  const [goal, setGoal] = useState(DEFAULT_GOAL);
  const [pickerMeal, setPickerMeal] = useState<MealKey | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [goalEditOpen, setGoalEditOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const today = todayStr();

  useEffect(() => {
    (async () => {
      try {
        const [f, g] = await Promise.all([
          AsyncStorage.getItem("nutrition_log"),
          AsyncStorage.getItem("calorie_goal"),
        ]);
        if (f) setFoods(JSON.parse(f));
        if (g) setGoal(Number(g) || DEFAULT_GOAL);
      } catch {}
      setLoaded(true);
    })();
  }, []);

  async function persistFoods(next: FoodEntry[]) {
    setFoods(next);
    await AsyncStorage.setItem("nutrition_log", JSON.stringify(next.slice(0, 1000)));
  }

  async function persistGoal(v: number) {
    setGoal(v);
    await AsyncStorage.setItem("calorie_goal", String(v));
  }

  const todayFoods = useMemo(() => foods.filter((f) => f.date === today), [foods, today]);

  const totals = useMemo(() => {
    const t = { kcal: 0, carbs: 0, protein: 0, fat: 0 };
    for (const f of todayFoods) {
      t.kcal += f.kcal;
      t.carbs += f.carbs;
      t.protein += f.protein;
      t.fat += f.fat;
    }
    return t;
  }, [todayFoods]);

  const remaining = Math.max(0, goal - totals.kcal + burned);
  const consumedRatio = goal > 0 ? Math.min(1, totals.kcal / (goal + burned)) : 0;

  function handleAddFood(preset: FoodPreset, servings: number, meal: MealKey) {
    const entry: FoodEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      label: preset.label,
      emoji: preset.emoji,
      meal,
      kcal: Math.round(preset.kcal * servings),
      carbs: Math.round(preset.carbs * servings),
      protein: Math.round(preset.protein * servings),
      fat: Math.round(preset.fat * servings),
      date: today,
      timestamp: new Date().toISOString(),
    };
    persistFoods([entry, ...foods]);
  }

  function handleRemoveFood(id: string) {
    persistFoods(foods.filter((f) => f.id !== id));
  }

  if (!loaded) return null;

  return (
    <View style={{ gap: 16 }}>
      <View style={styles.headerRow}>
        <Text style={[styles.sectionHeading, { color: colors.foreground }]}>Summary</Text>
        <Pressable onPress={() => setDetailsOpen(true)} hitSlop={10}>
          <Text style={[styles.linkBtn, { color: colors.primary }]}>Details</Text>
        </Pressable>
      </View>

      <Pressable
        onLongPress={() => setGoalEditOpen(true)}
        style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <View style={styles.summaryTopRow}>
          <View style={styles.statBlock}>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{totals.kcal}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Eaten</Text>
          </View>

          <View style={styles.gaugeWrap}>
            <Gauge
              progress={consumedRatio}
              trackColor={colors.muted}
              fillColor={colors.primary}
            />
            <View style={styles.gaugeTextWrap} pointerEvents="none">
              <Text style={[styles.gaugeValue, { color: colors.foreground }]}>
                {remaining.toLocaleString()}
              </Text>
              <Text style={[styles.gaugeLabel, { color: colors.mutedForeground }]}>Remaining</Text>
            </View>
          </View>

          <View style={styles.statBlock}>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{burned}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Burned</Text>
          </View>
        </View>

        <View style={styles.macrosRow}>
          <MacroCol label="Carbs" current={totals.carbs} goal={DEFAULT_CARBS} colors={colors} />
          <MacroCol label="Protein" current={totals.protein} goal={DEFAULT_PROTEIN} colors={colors} />
          <MacroCol label="Fat" current={totals.fat} goal={DEFAULT_FAT} colors={colors} />
        </View>
      </Pressable>

      <View style={styles.headerRow}>
        <Text style={[styles.sectionHeading, { color: colors.foreground }]}>Nutrition</Text>
        <Pressable onPress={() => setDetailsOpen(true)} hitSlop={10}>
          <Text style={[styles.linkBtn, { color: colors.primary }]}>More</Text>
        </Pressable>
      </View>

      <View style={[styles.mealsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {MEALS.map((m, i) => {
          const mealFoods = todayFoods.filter((f) => f.meal === m.key);
          const consumed = mealFoods.reduce((sum, f) => sum + f.kcal, 0);
          const mealGoal = Math.round(goal * m.share);
          const ratio = mealGoal > 0 ? Math.min(1, consumed / mealGoal) : 0;
          const lastFood = mealFoods[0];
          return (
            <View
              key={m.key}
              style={[
                styles.mealRow,
                i < MEALS.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
              ]}
            >
              <View style={styles.mealIconWrap}>
                <View style={[styles.mealIconBg, { backgroundColor: colors.muted }]}>
                  <Text style={styles.mealEmoji}>{m.emoji}</Text>
                </View>
                {ratio > 0 && (
                  <View style={styles.mealRingWrap} pointerEvents="none">
                    <RingProgress progress={ratio} color={colors.primary} trackColor="transparent" size={56} />
                  </View>
                )}
              </View>

              <View style={styles.mealText}>
                <View style={styles.mealTitleRow}>
                  <Text style={[styles.mealTitle, { color: colors.foreground }]}>{m.label}</Text>
                  <Feather name="arrow-right" size={14} color={colors.foreground} style={{ marginLeft: 4 }} />
                </View>
                <Text style={[styles.mealKcal, { color: colors.mutedForeground }]}>
                  {consumed} / {mealGoal.toLocaleString()} kcal
                </Text>
                {lastFood && (
                  <Text style={[styles.mealLast, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {lastFood.label}
                  </Text>
                )}
              </View>

              <Pressable
                onPress={() => setPickerMeal(m.key)}
                hitSlop={6}
                style={({ pressed }) => [
                  styles.addBtn,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Feather name="plus" size={20} color="#1a1a2e" />
              </Pressable>
            </View>
          );
        })}
      </View>

      <FoodPicker
        meal={pickerMeal}
        onClose={() => setPickerMeal(null)}
        onAdd={handleAddFood}
      />

      <DetailsSheet
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        foods={todayFoods}
        onRemove={handleRemoveFood}
      />

      <GoalEditor
        open={goalEditOpen}
        onClose={() => setGoalEditOpen(false)}
        goal={goal}
        onSave={persistGoal}
      />
    </View>
  );
}

function Gauge({ progress, trackColor, fillColor }: { progress: number; trackColor: string; fillColor: string }) {
  const size = 180;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  // Semi-arc from 220deg → 320deg sweep (clockwise 280°, opening at bottom)
  const startAngle = 140;
  const endAngle = 400;
  const sweep = endAngle - startAngle;
  const polarToCartesian = (a: number) => {
    const rad = ((a - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };
  const start = polarToCartesian(startAngle);
  const end = polarToCartesian(endAngle);
  const largeArc = sweep > 180 ? 1 : 0;
  const trackPath = `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;

  const fillEndAngle = startAngle + sweep * Math.max(0.001, progress);
  const fillEnd = polarToCartesian(fillEndAngle);
  const fillSweep = fillEndAngle - startAngle;
  const fillLargeArc = fillSweep > 180 ? 1 : 0;
  const fillPath = `M ${start.x} ${start.y} A ${r} ${r} 0 ${fillLargeArc} 1 ${fillEnd.x} ${fillEnd.y}`;

  return (
    <Svg width={size} height={size}>
      <Path d={trackPath} stroke={trackColor} strokeWidth={stroke} strokeLinecap="round" fill="none" />
      {progress > 0 && (
        <Path d={fillPath} stroke={fillColor} strokeWidth={stroke} strokeLinecap="round" fill="none" />
      )}
    </Svg>
  );
}

function RingProgress({ progress, color, trackColor, size }: { progress: number; color: string; trackColor: string; size: number }) {
  const stroke = 3;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <Svg width={size} height={size} style={{ transform: [{ rotate: "-90deg" }] }}>
      <Circle cx={size / 2} cy={size / 2} r={r} stroke={trackColor} strokeWidth={stroke} fill="none" />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={color}
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - progress)}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function MacroCol({ label, current, goal, colors }: { label: string; current: number; goal: number; colors: ReturnType<typeof useColors> }) {
  const ratio = goal > 0 ? Math.min(1, current / goal) : 0;
  return (
    <View style={styles.macroCol}>
      <Text style={[styles.macroLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <View style={[styles.macroTrack, { backgroundColor: colors.muted }]}>
        <View style={[styles.macroFill, { width: `${Math.max(4, ratio * 100)}%`, backgroundColor: colors.primary }]} />
      </View>
      <Text style={[styles.macroValue, { color: colors.foreground }]}>
        {current} / {goal} g
      </Text>
    </View>
  );
}

interface PickerProps {
  meal: MealKey | null;
  onClose: () => void;
  onAdd: (preset: FoodPreset, servings: number, meal: MealKey) => void;
}

function FoodPicker({ meal, onClose, onAdd }: PickerProps) {
  const colors = useColors();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<FoodPreset | null>(null);
  const [servings, setServings] = useState("1");

  const open = meal !== null;
  const mealLabel = MEALS.find((m) => m.key === meal)?.label ?? "";

  const filtered = useMemo(() => {
    if (!search.trim()) return FOOD_PRESETS;
    const q = search.toLowerCase();
    return FOOD_PRESETS.filter((p) => p.label.toLowerCase().includes(q));
  }, [search]);

  function reset() {
    setSearch("");
    setSelected(null);
    setServings("1");
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleConfirm() {
    if (!selected || !meal) return;
    const s = Math.max(0.25, Math.min(20, Number(servings) || 1));
    onAdd(selected, s, meal);
    reset();
    onClose();
  }

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.card }]} onPress={(e) => e.stopPropagation?.()}>
          <View style={styles.sheetHandle} />
          <View style={styles.pickerHeader}>
            <Pressable onPress={selected ? () => setSelected(null) : handleClose} hitSlop={10}>
              <Feather name="chevron-left" size={22} color={colors.primary} />
            </Pressable>
            <Text style={[styles.pickerTitle, { color: colors.foreground }]} numberOfLines={1}>
              {selected ? "Servings" : `Add to ${mealLabel}`}
            </Text>
            <View style={{ width: 22 }} />
          </View>

          {selected ? (
            <View style={styles.servingsWrap}>
              <View style={styles.selectedSummary}>
                <Text style={styles.selectedEmoji}>{selected.emoji}</Text>
                <Text style={[styles.selectedLabel, { color: colors.foreground }]}>{selected.label}</Text>
              </View>
              <Text style={[styles.servingHint, { color: colors.mutedForeground }]}>
                Per serving: {selected.serving} · {selected.kcal} kcal
              </Text>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Servings</Text>
              <TextInput
                value={servings}
                onChangeText={setServings}
                keyboardType="decimal-pad"
                style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border }]}
                maxLength={5}
              />
              <View style={styles.totalRow}>
                <TotalCol label="kcal" value={Math.round(selected.kcal * (Number(servings) || 0))} colors={colors} />
                <TotalCol label="carbs" value={`${Math.round(selected.carbs * (Number(servings) || 0))}g`} colors={colors} />
                <TotalCol label="protein" value={`${Math.round(selected.protein * (Number(servings) || 0))}g`} colors={colors} />
                <TotalCol label="fat" value={`${Math.round(selected.fat * (Number(servings) || 0))}g`} colors={colors} />
              </View>
              <Pressable
                onPress={handleConfirm}
                style={({ pressed }) => [
                  styles.confirmBtn,
                  { backgroundColor: colors.primary },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Text style={styles.confirmBtnText}>Add to {mealLabel}</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View style={[styles.searchWrap, { backgroundColor: colors.muted }]}>
                <Feather name="search" size={16} color={colors.mutedForeground} />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search food"
                  placeholderTextColor={colors.mutedForeground}
                  style={[styles.searchInput, { color: colors.foreground }]}
                />
              </View>
              <ScrollView style={styles.pickerScroll} keyboardShouldPersistTaps="handled">
                {filtered.map((p) => (
                  <Pressable
                    key={p.id}
                    onPress={() => setSelected(p)}
                    style={({ pressed }) => [
                      styles.foodRow,
                      { borderBottomColor: colors.border },
                      pressed && { backgroundColor: colors.muted },
                    ]}
                  >
                    <Text style={styles.foodEmoji}>{p.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.foodLabel, { color: colors.foreground }]}>{p.label}</Text>
                      <Text style={[styles.foodSub, { color: colors.mutedForeground }]}>
                        {p.serving} · {p.kcal} kcal
                      </Text>
                    </View>
                    <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
                  </Pressable>
                ))}
              </ScrollView>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function TotalCol({ label, value, colors }: { label: string; value: number | string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={styles.totalCol}>
      <Text style={[styles.totalValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

function DetailsSheet({ open, onClose, foods, onRemove }: { open: boolean; onClose: () => void; foods: FoodEntry[]; onRemove: (id: string) => void }) {
  const colors = useColors();
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.card }]} onPress={(e) => e.stopPropagation?.()}>
          <View style={styles.sheetHandle} />
          <View style={styles.pickerHeader}>
            <Pressable onPress={onClose} hitSlop={10}>
              <Feather name="chevron-left" size={22} color={colors.primary} />
            </Pressable>
            <Text style={[styles.pickerTitle, { color: colors.foreground }]}>Today's food</Text>
            <View style={{ width: 22 }} />
          </View>
          <ScrollView style={styles.pickerScroll}>
            {foods.length === 0 && (
              <Text style={[styles.empty, { color: colors.mutedForeground }]}>
                Nothing logged yet today. Tap + on any meal to add food.
              </Text>
            )}
            {MEALS.map((m) => {
              const mealFoods = foods.filter((f) => f.meal === m.key);
              if (mealFoods.length === 0) return null;
              return (
                <View key={m.key} style={{ marginBottom: 16 }}>
                  <Text style={[styles.detailMeal, { color: colors.mutedForeground }]}>
                    {m.label.toUpperCase()}
                  </Text>
                  {mealFoods.map((f) => (
                    <Pressable
                      key={f.id}
                      onLongPress={() => {
                        Alert.alert("Remove food", `Remove ${f.label}?`, [
                          { text: "Cancel", style: "cancel" },
                          { text: "Remove", style: "destructive", onPress: () => onRemove(f.id) },
                        ]);
                      }}
                      style={[styles.foodRow, { borderBottomColor: colors.border }]}
                    >
                      <Text style={styles.foodEmoji}>{f.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.foodLabel, { color: colors.foreground }]}>{f.label}</Text>
                        <Text style={[styles.foodSub, { color: colors.mutedForeground }]}>
                          {f.kcal} kcal · {f.carbs}c / {f.protein}p / {f.fat}f
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function GoalEditor({ open, onClose, goal, onSave }: { open: boolean; onClose: () => void; goal: number; onSave: (n: number) => void }) {
  const colors = useColors();
  const [draft, setDraft] = useState(String(goal));
  useEffect(() => {
    if (open) setDraft(String(goal));
  }, [open, goal]);
  function handleSave() {
    const n = Math.max(500, Math.min(10000, Number(draft) || DEFAULT_GOAL));
    onSave(n);
    onClose();
  }
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.smallSheet, { backgroundColor: colors.card }]} onPress={(e) => e.stopPropagation?.()}>
          <Text style={[styles.smallSheetTitle, { color: colors.foreground }]}>Daily calorie goal</Text>
          <Text style={[styles.smallSheetDesc, { color: colors.mutedForeground }]}>
            Set your daily target on eat days.
          </Text>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            keyboardType="number-pad"
            style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border }]}
            maxLength={5}
          />
          <View style={styles.smallSheetActions}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.smallSheetBtn, { backgroundColor: colors.muted }, pressed && { opacity: 0.7 }]}
            >
              <Text style={[styles.smallSheetBtnText, { color: colors.foreground }]}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              style={({ pressed }) => [styles.smallSheetBtn, { backgroundColor: colors.primary }, pressed && { opacity: 0.8 }]}
            >
              <Text style={[styles.smallSheetBtnText, { color: "#fff" }]}>Save</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionHeading: { fontSize: 22, fontFamily: "Inter_700Bold", letterSpacing: -0.4 },
  linkBtn: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  summaryCard: {
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    gap: 18,
  },
  summaryTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 180,
  },
  statBlock: { alignItems: "center", gap: 4, width: 70 },
  statValue: { fontSize: 22, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
  gaugeWrap: {
    width: 180,
    height: 180,
    alignItems: "center",
    justifyContent: "center",
  },
  gaugeTextWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  gaugeValue: { fontSize: 30, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  gaugeLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  macrosRow: {
    flexDirection: "row",
    gap: 14,
  },
  macroCol: { flex: 1, gap: 6, alignItems: "center" },
  macroLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  macroTrack: {
    alignSelf: "stretch",
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  macroFill: { height: "100%", borderRadius: 3 },
  macroValue: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginTop: 2 },
  mealsCard: {
    borderRadius: 22,
    borderWidth: 1,
    overflow: "hidden",
  },
  mealRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 14,
  },
  mealIconWrap: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  mealIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  mealEmoji: { fontSize: 22 },
  mealRingWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 56,
    height: 56,
  },
  mealText: { flex: 1, gap: 2 },
  mealTitleRow: { flexDirection: "row", alignItems: "center" },
  mealTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  mealKcal: { fontSize: 13, fontFamily: "Inter_500Medium" },
  mealLast: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
    gap: 14,
    maxHeight: "85%",
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#999",
    opacity: 0.3,
    alignSelf: "center",
  },
  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pickerTitle: { fontSize: 17, fontFamily: "Inter_700Bold", flex: 1, textAlign: "center" },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    height: 42,
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium" },
  pickerScroll: { maxHeight: 460 },
  foodRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  foodEmoji: { fontSize: 24 },
  foodLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  foodSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  servingsWrap: { gap: 12 },
  selectedSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    justifyContent: "center",
  },
  selectedEmoji: { fontSize: 32 },
  selectedLabel: { fontSize: 18, fontFamily: "Inter_700Bold" },
  servingHint: { fontSize: 13, fontFamily: "Inter_500Medium", textAlign: "center" },
  fieldLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginTop: 4,
  },
  input: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    textAlign: "center",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 8,
  },
  totalCol: { alignItems: "center", gap: 2 },
  totalValue: { fontSize: 16, fontFamily: "Inter_700Bold" },
  totalLabel: { fontSize: 11, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 0.4 },
  confirmBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
  },
  confirmBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  empty: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingVertical: 32,
  },
  detailMeal: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  smallSheet: {
    margin: 20,
    borderRadius: 20,
    padding: 22,
    gap: 12,
    alignSelf: "center",
    minWidth: 280,
  },
  smallSheetTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  smallSheetDesc: { fontSize: 13, fontFamily: "Inter_400Regular" },
  smallSheetActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  smallSheetBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  smallSheetBtnText: { fontSize: 14, fontFamily: "Inter_700Bold" },
});
