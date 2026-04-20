import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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
import { BarcodeScannerModal, type ScannedProduct } from "./BarcodeScannerModal";

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
  category?: "food" | "beverage";
}

const FOOD_PRESETS: FoodPreset[] = [
  // ── Eggs & breakfast
  { id: "pb_ball", label: "Peanut butter protein ball", emoji: "🍪", serving: "1 ball", kcal: 140, carbs: 12, protein: 8, fat: 8 },
  { id: "egg", label: "Egg", emoji: "🥚", serving: "1 large", kcal: 70, carbs: 0, protein: 6, fat: 5 },
  { id: "egg_boiled", label: "Egg, boiled", emoji: "🥚", serving: "1 large (50 g)", kcal: 78, carbs: 1, protein: 6, fat: 5 },
  { id: "egg_fried", label: "Egg, fried", emoji: "🍳", serving: "1 large", kcal: 90, carbs: 0, protein: 6, fat: 7 },
  { id: "egg_scrambled", label: "Scrambled eggs", emoji: "🍳", serving: "2 eggs", kcal: 200, carbs: 2, protein: 14, fat: 14 },
  { id: "omelette", label: "Omelette, plain", emoji: "🍳", serving: "2 eggs", kcal: 220, carbs: 1, protein: 14, fat: 17 },
  { id: "oatmeal", label: "Oatmeal", emoji: "🥣", serving: "1 cup cooked", kcal: 150, carbs: 27, protein: 5, fat: 3 },
  { id: "porridge", label: "Porridge with milk", emoji: "🥣", serving: "1 bowl", kcal: 220, carbs: 36, protein: 9, fat: 5 },
  { id: "muesli", label: "Muesli", emoji: "🥣", serving: "1/2 cup", kcal: 290, carbs: 50, protein: 8, fat: 6 },
  { id: "granola", label: "Granola", emoji: "🥣", serving: "1/2 cup", kcal: 250, carbs: 36, protein: 6, fat: 10 },
  { id: "cereal_corn", label: "Corn flakes", emoji: "🥣", serving: "1 cup", kcal: 100, carbs: 24, protein: 2, fat: 0 },
  { id: "cereal_choco", label: "Chocolate cereal", emoji: "🥣", serving: "1 cup", kcal: 150, carbs: 32, protein: 2, fat: 2 },
  { id: "pancakes", label: "Pancakes", emoji: "🥞", serving: "2 medium", kcal: 350, carbs: 44, protein: 8, fat: 14 },
  { id: "waffles", label: "Waffles", emoji: "🧇", serving: "1 waffle", kcal: 220, carbs: 30, protein: 5, fat: 8 },
  { id: "french_toast", label: "French toast", emoji: "🍞", serving: "1 slice", kcal: 150, carbs: 16, protein: 5, fat: 7 },
  { id: "bagel", label: "Bagel, plain", emoji: "🥯", serving: "1 medium", kcal: 270, carbs: 53, protein: 11, fat: 2 },
  { id: "bagel_cc", label: "Bagel with cream cheese", emoji: "🥯", serving: "1 bagel", kcal: 370, carbs: 54, protein: 13, fat: 11 },
  { id: "croissant", label: "Croissant", emoji: "🥐", serving: "1 medium", kcal: 230, carbs: 26, protein: 5, fat: 12 },
  { id: "muffin_blueberry", label: "Blueberry muffin", emoji: "🧁", serving: "1 muffin", kcal: 380, carbs: 53, protein: 5, fat: 16 },
  { id: "danish", label: "Danish pastry", emoji: "🥐", serving: "1 piece", kcal: 280, carbs: 30, protein: 4, fat: 16 },

  // ── Bread, grains, pasta, rice
  { id: "toast", label: "Toast, white", emoji: "🍞", serving: "1 slice", kcal: 80, carbs: 15, protein: 3, fat: 1 },
  { id: "toast_wheat", label: "Toast, whole wheat", emoji: "🍞", serving: "1 slice", kcal: 70, carbs: 12, protein: 4, fat: 1 },
  { id: "baguette", label: "Baguette", emoji: "🥖", serving: "2 inch piece", kcal: 90, carbs: 18, protein: 3, fat: 1 },
  { id: "tortilla_corn", label: "Corn tortilla", emoji: "🫓", serving: "1 tortilla", kcal: 60, carbs: 12, protein: 2, fat: 1 },
  { id: "tortilla_flour", label: "Flour tortilla", emoji: "🫓", serving: "1 large", kcal: 140, carbs: 24, protein: 4, fat: 3 },
  { id: "rice_white", label: "Rice, white cooked", emoji: "🍚", serving: "1 cup", kcal: 205, carbs: 45, protein: 4, fat: 0 },
  { id: "rice_brown", label: "Rice, brown cooked", emoji: "🍚", serving: "1 cup", kcal: 215, carbs: 45, protein: 5, fat: 2 },
  { id: "rice_basmati", label: "Basmati rice", emoji: "🍚", serving: "1 cup", kcal: 200, carbs: 44, protein: 4, fat: 0 },
  { id: "rice_fried", label: "Fried rice", emoji: "🍚", serving: "1 cup", kcal: 230, carbs: 35, protein: 7, fat: 8 },
  { id: "quinoa", label: "Quinoa, cooked", emoji: "🥣", serving: "1 cup", kcal: 222, carbs: 39, protein: 8, fat: 4 },
  { id: "couscous", label: "Couscous, cooked", emoji: "🥣", serving: "1 cup", kcal: 175, carbs: 36, protein: 6, fat: 0 },
  { id: "pasta", label: "Pasta, cooked", emoji: "🍝", serving: "1 cup", kcal: 220, carbs: 43, protein: 8, fat: 1 },
  { id: "spaghetti_bolognese", label: "Spaghetti bolognese", emoji: "🍝", serving: "1 plate", kcal: 540, carbs: 65, protein: 28, fat: 18 },
  { id: "spaghetti_carbonara", label: "Spaghetti carbonara", emoji: "🍝", serving: "1 plate", kcal: 620, carbs: 60, protein: 26, fat: 30 },
  { id: "lasagna", label: "Lasagna", emoji: "🍝", serving: "1 piece", kcal: 410, carbs: 33, protein: 24, fat: 20 },
  { id: "mac_cheese", label: "Mac & cheese", emoji: "🧀", serving: "1 cup", kcal: 310, carbs: 41, protein: 13, fat: 11 },
  { id: "noodles_ramen", label: "Ramen noodles", emoji: "🍜", serving: "1 bowl", kcal: 380, carbs: 54, protein: 10, fat: 14 },
  { id: "noodles_pho", label: "Pho", emoji: "🍜", serving: "1 bowl", kcal: 350, carbs: 45, protein: 25, fat: 6 },
  { id: "noodles_lo_mein", label: "Lo mein", emoji: "🍜", serving: "1 cup", kcal: 290, carbs: 42, protein: 10, fat: 9 },

  // ── Fruits
  { id: "apple", label: "Apple", emoji: "🍎", serving: "1 medium", kcal: 95, carbs: 25, protein: 0, fat: 0 },
  { id: "banana", label: "Banana", emoji: "🍌", serving: "1 medium", kcal: 105, carbs: 27, protein: 1, fat: 0 },
  { id: "orange", label: "Orange", emoji: "🍊", serving: "1 medium", kcal: 62, carbs: 15, protein: 1, fat: 0 },
  { id: "pear", label: "Pear", emoji: "🍐", serving: "1 medium", kcal: 100, carbs: 27, protein: 1, fat: 0 },
  { id: "peach", label: "Peach", emoji: "🍑", serving: "1 medium", kcal: 60, carbs: 15, protein: 1, fat: 0 },
  { id: "plum", label: "Plum", emoji: "🍑", serving: "1 medium", kcal: 30, carbs: 8, protein: 0, fat: 0 },
  { id: "grapes", label: "Grapes", emoji: "🍇", serving: "1 cup", kcal: 104, carbs: 27, protein: 1, fat: 0 },
  { id: "strawberries", label: "Strawberries", emoji: "🍓", serving: "1 cup", kcal: 50, carbs: 12, protein: 1, fat: 0 },
  { id: "blueberries", label: "Blueberries", emoji: "🫐", serving: "1 cup", kcal: 84, carbs: 21, protein: 1, fat: 0 },
  { id: "raspberries", label: "Raspberries", emoji: "🫐", serving: "1 cup", kcal: 64, carbs: 15, protein: 1, fat: 1 },
  { id: "blackberries", label: "Blackberries", emoji: "🫐", serving: "1 cup", kcal: 62, carbs: 14, protein: 2, fat: 1 },
  { id: "berries_mix", label: "Mixed berries", emoji: "🫐", serving: "1 cup", kcal: 80, carbs: 19, protein: 1, fat: 0 },
  { id: "pineapple", label: "Pineapple", emoji: "🍍", serving: "1 cup", kcal: 82, carbs: 22, protein: 1, fat: 0 },
  { id: "mango", label: "Mango", emoji: "🥭", serving: "1 cup", kcal: 99, carbs: 25, protein: 1, fat: 1 },
  { id: "watermelon", label: "Watermelon", emoji: "🍉", serving: "1 cup", kcal: 46, carbs: 12, protein: 1, fat: 0 },
  { id: "melon", label: "Honeydew melon", emoji: "🍈", serving: "1 cup", kcal: 60, carbs: 16, protein: 1, fat: 0 },
  { id: "cantaloupe", label: "Cantaloupe", emoji: "🍈", serving: "1 cup", kcal: 53, carbs: 13, protein: 1, fat: 0 },
  { id: "kiwi", label: "Kiwi", emoji: "🥝", serving: "1 medium", kcal: 42, carbs: 10, protein: 1, fat: 0 },
  { id: "cherries", label: "Cherries", emoji: "🍒", serving: "1 cup", kcal: 87, carbs: 22, protein: 1, fat: 0 },
  { id: "lemon", label: "Lemon", emoji: "🍋", serving: "1 medium", kcal: 17, carbs: 5, protein: 1, fat: 0 },
  { id: "lime", label: "Lime", emoji: "🍋", serving: "1 medium", kcal: 20, carbs: 7, protein: 0, fat: 0 },
  { id: "avocado", label: "Avocado", emoji: "🥑", serving: "1/2 fruit", kcal: 160, carbs: 9, protein: 2, fat: 15 },
  { id: "pomegranate", label: "Pomegranate", emoji: "🍎", serving: "1 medium", kcal: 234, carbs: 53, protein: 5, fat: 3 },
  { id: "raisins", label: "Raisins", emoji: "🍇", serving: "1/4 cup", kcal: 108, carbs: 29, protein: 1, fat: 0 },
  { id: "dates", label: "Dates, dried", emoji: "🌴", serving: "2 dates", kcal: 133, carbs: 36, protein: 1, fat: 0 },
  { id: "fruit_salad", label: "Fruit salad", emoji: "🍓", serving: "1 cup", kcal: 130, carbs: 33, protein: 2, fat: 0 },
  { id: "honey", label: "Honey", emoji: "🍯", serving: "1 tbsp", kcal: 64, carbs: 17, protein: 0, fat: 0 },

  // ── Vegetables
  { id: "broccoli", label: "Broccoli", emoji: "🥦", serving: "1 cup", kcal: 55, carbs: 11, protein: 4, fat: 1 },
  { id: "cauliflower", label: "Cauliflower", emoji: "🥦", serving: "1 cup", kcal: 27, carbs: 5, protein: 2, fat: 0 },
  { id: "spinach", label: "Spinach", emoji: "🥬", serving: "1 cup raw", kcal: 7, carbs: 1, protein: 1, fat: 0 },
  { id: "kale", label: "Kale", emoji: "🥬", serving: "1 cup raw", kcal: 33, carbs: 7, protein: 3, fat: 1 },
  { id: "lettuce", label: "Lettuce", emoji: "🥬", serving: "1 cup", kcal: 8, carbs: 2, protein: 1, fat: 0 },
  { id: "cabbage", label: "Cabbage", emoji: "🥬", serving: "1 cup", kcal: 22, carbs: 5, protein: 1, fat: 0 },
  { id: "carrot", label: "Carrot", emoji: "🥕", serving: "1 medium", kcal: 25, carbs: 6, protein: 1, fat: 0 },
  { id: "celery", label: "Celery", emoji: "🥬", serving: "1 stalk", kcal: 6, carbs: 1, protein: 0, fat: 0 },
  { id: "cucumber", label: "Cucumber", emoji: "🥒", serving: "1 cup", kcal: 16, carbs: 4, protein: 1, fat: 0 },
  { id: "pickle", label: "Pickle", emoji: "🥒", serving: "1 medium", kcal: 12, carbs: 3, protein: 0, fat: 0 },
  { id: "tomato", label: "Tomato", emoji: "🍅", serving: "1 medium", kcal: 22, carbs: 5, protein: 1, fat: 0 },
  { id: "tomato_cherry", label: "Cherry tomatoes", emoji: "🍅", serving: "1 cup", kcal: 27, carbs: 6, protein: 1, fat: 0 },
  { id: "bell_pepper", label: "Bell pepper", emoji: "🫑", serving: "1 medium", kcal: 30, carbs: 7, protein: 1, fat: 0 },
  { id: "onion", label: "Onion", emoji: "🧅", serving: "1 medium", kcal: 44, carbs: 10, protein: 1, fat: 0 },
  { id: "garlic", label: "Garlic", emoji: "🧄", serving: "1 clove", kcal: 4, carbs: 1, protein: 0, fat: 0 },
  { id: "mushrooms", label: "Mushrooms", emoji: "🍄", serving: "1 cup", kcal: 21, carbs: 3, protein: 3, fat: 0 },
  { id: "zucchini", label: "Zucchini", emoji: "🥒", serving: "1 cup", kcal: 19, carbs: 4, protein: 1, fat: 0 },
  { id: "eggplant", label: "Eggplant", emoji: "🍆", serving: "1 cup", kcal: 35, carbs: 8, protein: 1, fat: 0 },
  { id: "asparagus", label: "Asparagus", emoji: "🌿", serving: "1 cup", kcal: 27, carbs: 5, protein: 3, fat: 0 },
  { id: "green_beans", label: "Green beans", emoji: "🌿", serving: "1 cup", kcal: 31, carbs: 7, protein: 2, fat: 0 },
  { id: "peas", label: "Peas", emoji: "🟢", serving: "1 cup", kcal: 117, carbs: 21, protein: 8, fat: 0 },
  { id: "corn", label: "Corn", emoji: "🌽", serving: "1 cup", kcal: 144, carbs: 31, protein: 5, fat: 2 },
  { id: "potato_baked", label: "Baked potato", emoji: "🥔", serving: "1 medium", kcal: 160, carbs: 37, protein: 4, fat: 0 },
  { id: "potato_mashed", label: "Mashed potatoes", emoji: "🥔", serving: "1 cup", kcal: 240, carbs: 35, protein: 4, fat: 9 },
  { id: "sweet_potato", label: "Sweet potato", emoji: "🍠", serving: "1 medium", kcal: 112, carbs: 26, protein: 2, fat: 0 },
  { id: "salad_garden", label: "Garden salad", emoji: "🥗", serving: "1 bowl", kcal: 120, carbs: 12, protein: 4, fat: 7 },
  { id: "salad_caesar", label: "Caesar salad", emoji: "🥗", serving: "1 bowl", kcal: 320, carbs: 12, protein: 8, fat: 27 },
  { id: "salad_greek", label: "Greek salad", emoji: "🥗", serving: "1 bowl", kcal: 220, carbs: 12, protein: 7, fat: 16 },
  { id: "salad_chicken", label: "Chicken salad", emoji: "🥗", serving: "1 bowl", kcal: 380, carbs: 14, protein: 28, fat: 22 },

  // ── Protein: meat, fish, seafood
  { id: "chicken_breast", label: "Chicken breast, grilled", emoji: "🍗", serving: "100 g", kcal: 165, carbs: 0, protein: 31, fat: 4 },
  { id: "chicken_thigh", label: "Chicken thigh", emoji: "🍗", serving: "100 g", kcal: 209, carbs: 0, protein: 26, fat: 11 },
  { id: "chicken_wings", label: "Chicken wings", emoji: "🍗", serving: "4 wings", kcal: 320, carbs: 0, protein: 30, fat: 22 },
  { id: "chicken_nuggets", label: "Chicken nuggets", emoji: "🍗", serving: "6 pieces", kcal: 280, carbs: 18, protein: 14, fat: 17 },
  { id: "turkey", label: "Turkey breast, sliced", emoji: "🦃", serving: "100 g", kcal: 135, carbs: 2, protein: 30, fat: 1 },
  { id: "beef_ground", label: "Ground beef, 90/10", emoji: "🥩", serving: "100 g", kcal: 217, carbs: 0, protein: 26, fat: 12 },
  { id: "steak", label: "Steak, ribeye", emoji: "🥩", serving: "150 g", kcal: 380, carbs: 0, protein: 38, fat: 25 },
  { id: "pork_chop", label: "Pork chop", emoji: "🥩", serving: "100 g", kcal: 231, carbs: 0, protein: 26, fat: 14 },
  { id: "bacon", label: "Bacon", emoji: "🥓", serving: "2 strips", kcal: 90, carbs: 0, protein: 6, fat: 7 },
  { id: "ham", label: "Ham, sliced", emoji: "🍖", serving: "2 slices", kcal: 70, carbs: 1, protein: 11, fat: 2 },
  { id: "sausage", label: "Sausage", emoji: "🌭", serving: "1 link", kcal: 170, carbs: 1, protein: 9, fat: 14 },
  { id: "hotdog", label: "Hot dog", emoji: "🌭", serving: "1 with bun", kcal: 290, carbs: 24, protein: 11, fat: 17 },
  { id: "salmon", label: "Salmon, grilled", emoji: "🐟", serving: "100 g", kcal: 208, carbs: 0, protein: 22, fat: 13 },
  { id: "tuna", label: "Tuna, canned in water", emoji: "🐟", serving: "100 g", kcal: 132, carbs: 0, protein: 28, fat: 1 },
  { id: "shrimp", label: "Shrimp", emoji: "🦐", serving: "100 g", kcal: 99, carbs: 1, protein: 24, fat: 0 },
  { id: "cod", label: "Cod, baked", emoji: "🐟", serving: "100 g", kcal: 105, carbs: 0, protein: 23, fat: 1 },
  { id: "tilapia", label: "Tilapia", emoji: "🐟", serving: "100 g", kcal: 128, carbs: 0, protein: 26, fat: 3 },
  { id: "fish_fingers", label: "Fish fingers", emoji: "🐟", serving: "4 pieces", kcal: 280, carbs: 24, protein: 12, fat: 14 },
  { id: "fish_chips", label: "Fish & chips", emoji: "🍟", serving: "1 plate", kcal: 840, carbs: 90, protein: 35, fat: 38 },
  { id: "tofu", label: "Tofu", emoji: "🍱", serving: "100 g", kcal: 144, carbs: 3, protein: 17, fat: 9 },
  { id: "tempeh", label: "Tempeh", emoji: "🍱", serving: "100 g", kcal: 192, carbs: 8, protein: 20, fat: 11 },
  { id: "beans_black", label: "Black beans", emoji: "🫘", serving: "1 cup cooked", kcal: 227, carbs: 41, protein: 15, fat: 1 },
  { id: "beans_kidney", label: "Kidney beans", emoji: "🫘", serving: "1 cup cooked", kcal: 215, carbs: 37, protein: 13, fat: 1 },
  { id: "beans_chickpeas", label: "Chickpeas", emoji: "🫘", serving: "1 cup cooked", kcal: 269, carbs: 45, protein: 15, fat: 4 },
  { id: "lentils", label: "Lentils, cooked", emoji: "🫘", serving: "1 cup", kcal: 230, carbs: 40, protein: 18, fat: 1 },
  { id: "hummus", label: "Hummus", emoji: "🫘", serving: "2 tbsp", kcal: 70, carbs: 6, protein: 2, fat: 5 },

  // ── Dairy
  { id: "milk_whole", label: "Milk, whole", emoji: "🥛", serving: "1 cup", kcal: 150, carbs: 12, protein: 8, fat: 8, category: "beverage" },
  { id: "milk_skim", label: "Milk, skim", emoji: "🥛", serving: "1 cup", kcal: 83, carbs: 12, protein: 8, fat: 0, category: "beverage" },
  { id: "milk_almond", label: "Almond milk", emoji: "🥛", serving: "1 cup", kcal: 39, carbs: 4, protein: 1, fat: 3, category: "beverage" },
  { id: "milk_oat", label: "Oat milk", emoji: "🥛", serving: "1 cup", kcal: 120, carbs: 16, protein: 3, fat: 5, category: "beverage" },
  { id: "milk_soy", label: "Soy milk", emoji: "🥛", serving: "1 cup", kcal: 100, carbs: 8, protein: 7, fat: 4, category: "beverage" },
  { id: "yogurt_greek", label: "Greek yogurt, plain", emoji: "🥛", serving: "1 cup", kcal: 100, carbs: 6, protein: 17, fat: 0 },
  { id: "yogurt_fruit", label: "Yogurt, flavored", emoji: "🥛", serving: "1 cup", kcal: 180, carbs: 33, protein: 9, fat: 2 },
  { id: "cottage_cheese", label: "Cottage cheese", emoji: "🥣", serving: "1/2 cup", kcal: 110, carbs: 5, protein: 12, fat: 5 },
  { id: "cream_cheese", label: "Cream cheese", emoji: "🧀", serving: "2 tbsp", kcal: 100, carbs: 1, protein: 2, fat: 10 },
  { id: "cheddar", label: "Cheddar cheese", emoji: "🧀", serving: "28 g", kcal: 113, carbs: 0, protein: 7, fat: 9 },
  { id: "mozzarella", label: "Mozzarella", emoji: "🧀", serving: "28 g", kcal: 85, carbs: 1, protein: 6, fat: 6 },
  { id: "parmesan", label: "Parmesan", emoji: "🧀", serving: "1 tbsp", kcal: 22, carbs: 0, protein: 2, fat: 1 },
  { id: "feta", label: "Feta", emoji: "🧀", serving: "28 g", kcal: 75, carbs: 1, protein: 4, fat: 6 },
  { id: "butter", label: "Butter", emoji: "🧈", serving: "1 tbsp", kcal: 102, carbs: 0, protein: 0, fat: 12 },

  // ── Snacks, nuts, seeds
  { id: "almonds", label: "Almonds", emoji: "🌰", serving: "28 g", kcal: 160, carbs: 6, protein: 6, fat: 14 },
  { id: "walnuts", label: "Walnuts", emoji: "🌰", serving: "28 g", kcal: 185, carbs: 4, protein: 4, fat: 18 },
  { id: "cashews", label: "Cashews", emoji: "🌰", serving: "28 g", kcal: 157, carbs: 9, protein: 5, fat: 12 },
  { id: "pistachios", label: "Pistachios", emoji: "🌰", serving: "28 g", kcal: 159, carbs: 8, protein: 6, fat: 13 },
  { id: "peanuts", label: "Peanuts", emoji: "🥜", serving: "28 g", kcal: 161, carbs: 5, protein: 7, fat: 14 },
  { id: "peanut_butter", label: "Peanut butter", emoji: "🥜", serving: "2 tbsp", kcal: 190, carbs: 6, protein: 8, fat: 16 },
  { id: "almond_butter", label: "Almond butter", emoji: "🥜", serving: "2 tbsp", kcal: 196, carbs: 6, protein: 7, fat: 18 },
  { id: "trail_mix", label: "Trail mix", emoji: "🥜", serving: "1/4 cup", kcal: 175, carbs: 16, protein: 5, fat: 11 },
  { id: "chia_seeds", label: "Chia seeds", emoji: "🌱", serving: "1 tbsp", kcal: 60, carbs: 5, protein: 2, fat: 4 },
  { id: "flax_seeds", label: "Flax seeds", emoji: "🌱", serving: "1 tbsp", kcal: 55, carbs: 3, protein: 2, fat: 4 },
  { id: "chips_potato", label: "Potato chips", emoji: "🍟", serving: "28 g", kcal: 152, carbs: 15, protein: 2, fat: 10 },
  { id: "chips_tortilla", label: "Tortilla chips", emoji: "🌽", serving: "28 g", kcal: 138, carbs: 18, protein: 2, fat: 7 },
  { id: "pretzels", label: "Pretzels", emoji: "🥨", serving: "28 g", kcal: 110, carbs: 23, protein: 3, fat: 1 },
  { id: "popcorn", label: "Popcorn, air-popped", emoji: "🍿", serving: "3 cups", kcal: 95, carbs: 19, protein: 3, fat: 1 },
  { id: "popcorn_butter", label: "Popcorn, buttered", emoji: "🍿", serving: "3 cups", kcal: 165, carbs: 19, protein: 3, fat: 9 },
  { id: "granola_bar", label: "Granola bar", emoji: "🍫", serving: "1 bar", kcal: 130, carbs: 22, protein: 2, fat: 5 },
  { id: "protein_bar", label: "Protein bar", emoji: "🍫", serving: "1 bar", kcal: 200, carbs: 22, protein: 20, fat: 7 },
  { id: "rice_cake", label: "Rice cake", emoji: "🍘", serving: "1 cake", kcal: 35, carbs: 7, protein: 1, fat: 0 },
  { id: "crackers", label: "Crackers", emoji: "🥨", serving: "5 crackers", kcal: 80, carbs: 11, protein: 2, fat: 4 },
  { id: "olives", label: "Olives", emoji: "🫒", serving: "10 olives", kcal: 50, carbs: 3, protein: 0, fat: 5 },

  // ── Sweets, desserts
  { id: "chocolate_dark", label: "Dark chocolate", emoji: "🍫", serving: "1 oz", kcal: 170, carbs: 13, protein: 2, fat: 12 },
  { id: "chocolate_milk_bar", label: "Milk chocolate bar", emoji: "🍫", serving: "1 bar (40 g)", kcal: 215, carbs: 24, protein: 3, fat: 12 },
  { id: "ice_cream", label: "Ice cream, vanilla", emoji: "🍦", serving: "1/2 cup", kcal: 140, carbs: 17, protein: 2, fat: 7 },
  { id: "ice_cream_choc", label: "Chocolate ice cream", emoji: "🍦", serving: "1/2 cup", kcal: 155, carbs: 19, protein: 3, fat: 8 },
  { id: "frozen_yogurt", label: "Frozen yogurt", emoji: "🍨", serving: "1/2 cup", kcal: 110, carbs: 19, protein: 3, fat: 3 },
  { id: "cookie", label: "Cookie, chocolate chip", emoji: "🍪", serving: "1 cookie", kcal: 150, carbs: 22, protein: 2, fat: 7 },
  { id: "brownie", label: "Brownie", emoji: "🍫", serving: "1 piece", kcal: 240, carbs: 36, protein: 3, fat: 11 },
  { id: "donut", label: "Donut, glazed", emoji: "🍩", serving: "1 donut", kcal: 250, carbs: 31, protein: 3, fat: 13 },
  { id: "cupcake", label: "Cupcake", emoji: "🧁", serving: "1 cupcake", kcal: 305, carbs: 50, protein: 3, fat: 11 },
  { id: "cake_choc", label: "Chocolate cake", emoji: "🍰", serving: "1 slice", kcal: 350, carbs: 50, protein: 5, fat: 15 },
  { id: "cheesecake", label: "Cheesecake", emoji: "🍰", serving: "1 slice", kcal: 401, carbs: 33, protein: 7, fat: 27 },
  { id: "pie_apple", label: "Apple pie", emoji: "🥧", serving: "1 slice", kcal: 296, carbs: 43, protein: 3, fat: 14 },
  { id: "candy_bar", label: "Candy bar", emoji: "🍫", serving: "1 standard", kcal: 240, carbs: 32, protein: 4, fat: 12 },
  { id: "gummy_bears", label: "Gummy bears", emoji: "🍬", serving: "10 pieces", kcal: 87, carbs: 22, protein: 1, fat: 0 },
  { id: "marshmallow", label: "Marshmallow", emoji: "🍡", serving: "1 large", kcal: 23, carbs: 6, protein: 0, fat: 0 },
  { id: "pancake_syrup", label: "Maple syrup", emoji: "🍯", serving: "1 tbsp", kcal: 52, carbs: 13, protein: 0, fat: 0 },

  // ── Sandwiches, wraps, common meals
  { id: "sandwich_pb_j", label: "Peanut butter & jelly", emoji: "🥪", serving: "1 sandwich", kcal: 380, carbs: 50, protein: 12, fat: 16 },
  { id: "sandwich_turkey", label: "Turkey sandwich", emoji: "🥪", serving: "1 sandwich", kcal: 320, carbs: 35, protein: 22, fat: 10 },
  { id: "sandwich_ham", label: "Ham & cheese sandwich", emoji: "🥪", serving: "1 sandwich", kcal: 340, carbs: 32, protein: 20, fat: 14 },
  { id: "sandwich_blt", label: "BLT sandwich", emoji: "🥪", serving: "1 sandwich", kcal: 410, carbs: 32, protein: 18, fat: 24 },
  { id: "sandwich_grilled_cheese", label: "Grilled cheese", emoji: "🧀", serving: "1 sandwich", kcal: 400, carbs: 35, protein: 14, fat: 23 },
  { id: "wrap_chicken", label: "Chicken wrap", emoji: "🌯", serving: "1 wrap", kcal: 420, carbs: 38, protein: 28, fat: 17 },
  { id: "wrap_veggie", label: "Veggie wrap", emoji: "🌯", serving: "1 wrap", kcal: 320, carbs: 42, protein: 11, fat: 12 },
  { id: "burrito_bean", label: "Bean burrito", emoji: "🌯", serving: "1 burrito", kcal: 380, carbs: 56, protein: 13, fat: 11 },
  { id: "quesadilla", label: "Cheese quesadilla", emoji: "🌮", serving: "1 large", kcal: 530, carbs: 41, protein: 22, fat: 30 },
  { id: "tacos", label: "Tacos, beef", emoji: "🌮", serving: "2 tacos", kcal: 340, carbs: 32, protein: 18, fat: 16 },
  { id: "burger", label: "Hamburger", emoji: "🍔", serving: "1 whole", kcal: 354, carbs: 30, protein: 20, fat: 17 },
  { id: "cheeseburger", label: "Cheeseburger", emoji: "🍔", serving: "1 whole", kcal: 450, carbs: 31, protein: 25, fat: 24 },
  { id: "pizza", label: "Pizza, cheese", emoji: "🍕", serving: "1 slice", kcal: 285, carbs: 36, protein: 12, fat: 10 },
  { id: "pizza_pepperoni", label: "Pizza, pepperoni", emoji: "🍕", serving: "1 slice", kcal: 313, carbs: 36, protein: 13, fat: 13 },
  { id: "sushi_roll", label: "Sushi roll", emoji: "🍣", serving: "1 roll (8 pcs)", kcal: 250, carbs: 38, protein: 9, fat: 7 },
  { id: "sushi_salmon_nigiri", label: "Salmon nigiri", emoji: "🍣", serving: "2 pieces", kcal: 100, carbs: 14, protein: 6, fat: 2 },
  { id: "soup_chicken_noodle", label: "Chicken noodle soup", emoji: "🍲", serving: "1 bowl", kcal: 175, carbs: 22, protein: 12, fat: 4 },
  { id: "soup_tomato", label: "Tomato soup", emoji: "🍲", serving: "1 bowl", kcal: 160, carbs: 28, protein: 4, fat: 4 },
  { id: "chili", label: "Chili con carne", emoji: "🌶️", serving: "1 cup", kcal: 280, carbs: 22, protein: 22, fat: 12 },
  { id: "stir_fry", label: "Chicken stir fry", emoji: "🥡", serving: "1 plate", kcal: 410, carbs: 32, protein: 30, fat: 18 },
  { id: "curry_chicken", label: "Chicken curry", emoji: "🍛", serving: "1 cup", kcal: 320, carbs: 14, protein: 28, fat: 17 },
  { id: "curry_veg", label: "Vegetable curry", emoji: "🍛", serving: "1 cup", kcal: 220, carbs: 28, protein: 7, fat: 10 },
  { id: "fried_rice_chicken", label: "Chicken fried rice", emoji: "🍚", serving: "1 cup", kcal: 333, carbs: 42, protein: 13, fat: 12 },
  { id: "dumplings", label: "Dumplings, steamed", emoji: "🥟", serving: "5 pieces", kcal: 220, carbs: 24, protein: 11, fat: 10 },
  { id: "spring_roll", label: "Spring roll", emoji: "🥢", serving: "1 roll", kcal: 100, carbs: 12, protein: 2, fat: 5 },
  { id: "kebab", label: "Kebab", emoji: "🥙", serving: "1 medium", kcal: 510, carbs: 40, protein: 28, fat: 28 },
  { id: "falafel", label: "Falafel", emoji: "🥙", serving: "3 balls", kcal: 200, carbs: 22, protein: 8, fat: 10 },
  { id: "shawarma", label: "Chicken shawarma", emoji: "🥙", serving: "1 wrap", kcal: 480, carbs: 42, protein: 30, fat: 20 },

  // ── Fast food
  { id: "ff_big_mac", label: "Big Mac", emoji: "🍔", serving: "1 burger", kcal: 563, carbs: 45, protein: 26, fat: 33 },
  { id: "ff_quarter_pounder", label: "Quarter Pounder w/ Cheese", emoji: "🍔", serving: "1 burger", kcal: 520, carbs: 42, protein: 30, fat: 26 },
  { id: "ff_whopper", label: "Whopper", emoji: "🍔", serving: "1 burger", kcal: 657, carbs: 49, protein: 28, fat: 40 },
  { id: "ff_chicken_sandwich", label: "Chicken sandwich (fast food)", emoji: "🥪", serving: "1 sandwich", kcal: 440, carbs: 38, protein: 28, fat: 19 },
  { id: "ff_mc_nuggets", label: "Chicken McNuggets", emoji: "🍗", serving: "10 pieces", kcal: 420, carbs: 26, protein: 23, fat: 25 },
  { id: "ff_fries_med", label: "French fries, medium", emoji: "🍟", serving: "1 medium", kcal: 365, carbs: 48, protein: 4, fat: 17 },
  { id: "ff_fries_large", label: "French fries, large", emoji: "🍟", serving: "1 large", kcal: 510, carbs: 67, protein: 6, fat: 24 },
  { id: "ff_onion_rings", label: "Onion rings", emoji: "🧅", serving: "1 medium", kcal: 410, carbs: 50, protein: 6, fat: 21 },
  { id: "ff_milkshake", label: "Milkshake, vanilla", emoji: "🥤", serving: "16 oz", kcal: 530, carbs: 86, protein: 12, fat: 15, category: "beverage" },
  { id: "ff_chipotle_bowl", label: "Burrito bowl (Chipotle-style)", emoji: "🥗", serving: "1 bowl", kcal: 700, carbs: 75, protein: 32, fat: 28 },
  { id: "ff_subway_6", label: "6\" Subway turkey sub", emoji: "🥪", serving: "1 sub", kcal: 280, carbs: 47, protein: 18, fat: 4 },

  // ── Beverages: coffee, tea, juices
  { id: "water", label: "Water", emoji: "💧", serving: "1 cup", kcal: 0, carbs: 0, protein: 0, fat: 0, category: "beverage" },
  { id: "sparkling_water", label: "Sparkling water", emoji: "💧", serving: "12 oz", kcal: 0, carbs: 0, protein: 0, fat: 0, category: "beverage" },
  { id: "coffee_black", label: "Coffee, black", emoji: "☕", serving: "1 cup", kcal: 5, carbs: 0, protein: 0, fat: 0, category: "beverage" },
  { id: "espresso", label: "Espresso", emoji: "☕", serving: "1 shot", kcal: 3, carbs: 0, protein: 0, fat: 0, category: "beverage" },
  { id: "latte", label: "Latte", emoji: "☕", serving: "12 oz", kcal: 180, carbs: 17, protein: 12, fat: 7, category: "beverage" },
  { id: "cappuccino", label: "Cappuccino", emoji: "☕", serving: "8 oz", kcal: 120, carbs: 12, protein: 8, fat: 4, category: "beverage" },
  { id: "mocha", label: "Mocha", emoji: "☕", serving: "12 oz", kcal: 290, carbs: 35, protein: 13, fat: 12, category: "beverage" },
  { id: "iced_coffee", label: "Iced coffee", emoji: "🧋", serving: "16 oz", kcal: 100, carbs: 20, protein: 4, fat: 2, category: "beverage" },
  { id: "tea_green", label: "Green tea", emoji: "🍵", serving: "1 cup", kcal: 2, carbs: 0, protein: 0, fat: 0, category: "beverage" },
  { id: "tea_black", label: "Black tea", emoji: "🍵", serving: "1 cup", kcal: 2, carbs: 1, protein: 0, fat: 0, category: "beverage" },
  { id: "tea_chai", label: "Chai latte", emoji: "🍵", serving: "12 oz", kcal: 200, carbs: 32, protein: 7, fat: 5, category: "beverage" },
  { id: "matcha_latte", label: "Matcha latte", emoji: "🍵", serving: "12 oz", kcal: 200, carbs: 26, protein: 9, fat: 7, category: "beverage" },
  { id: "boba", label: "Bubble tea", emoji: "🧋", serving: "16 oz", kcal: 350, carbs: 70, protein: 4, fat: 6, category: "beverage" },
  { id: "smoothie", label: "Fruit smoothie", emoji: "🥤", serving: "16 oz", kcal: 250, carbs: 45, protein: 8, fat: 4, category: "beverage" },
  { id: "protein_shake", label: "Protein shake", emoji: "🥤", serving: "1 scoop", kcal: 120, carbs: 3, protein: 24, fat: 2, category: "beverage" },
  { id: "oj", label: "Orange juice", emoji: "🧃", serving: "1 cup", kcal: 110, carbs: 26, protein: 2, fat: 0, category: "beverage" },
  { id: "apple_juice", label: "Apple juice", emoji: "🧃", serving: "1 cup", kcal: 114, carbs: 28, protein: 0, fat: 0, category: "beverage" },
  { id: "cranberry_juice", label: "Cranberry juice", emoji: "🧃", serving: "1 cup", kcal: 116, carbs: 31, protein: 0, fat: 0, category: "beverage" },
  { id: "lemonade", label: "Lemonade", emoji: "🧃", serving: "1 cup", kcal: 99, carbs: 26, protein: 0, fat: 0, category: "beverage" },
  { id: "soda_cola", label: "Cola", emoji: "🥤", serving: "12 oz", kcal: 140, carbs: 39, protein: 0, fat: 0, category: "beverage" },
  { id: "soda_diet", label: "Diet cola", emoji: "🥤", serving: "12 oz", kcal: 0, carbs: 0, protein: 0, fat: 0, category: "beverage" },
  { id: "energy_drink", label: "Energy drink", emoji: "⚡", serving: "8 oz", kcal: 110, carbs: 28, protein: 0, fat: 0, category: "beverage" },
  { id: "sports_drink", label: "Sports drink", emoji: "🥤", serving: "12 oz", kcal: 80, carbs: 21, protein: 0, fat: 0, category: "beverage" },
  { id: "kombucha", label: "Kombucha", emoji: "🥤", serving: "16 oz", kcal: 60, carbs: 14, protein: 0, fat: 0, category: "beverage" },
  { id: "coconut_water", label: "Coconut water", emoji: "🥥", serving: "1 cup", kcal: 46, carbs: 9, protein: 2, fat: 0, category: "beverage" },

  // ── Alcohol
  { id: "beer", label: "Beer, regular", emoji: "🍺", serving: "12 oz", kcal: 150, carbs: 13, protein: 2, fat: 0, category: "beverage" },
  { id: "beer_light", label: "Light beer", emoji: "🍺", serving: "12 oz", kcal: 103, carbs: 6, protein: 1, fat: 0, category: "beverage" },
  { id: "beer_ipa", label: "IPA beer", emoji: "🍺", serving: "12 oz", kcal: 200, carbs: 19, protein: 2, fat: 0, category: "beverage" },
  { id: "wine_red", label: "Red wine", emoji: "🍷", serving: "5 oz", kcal: 125, carbs: 4, protein: 0, fat: 0, category: "beverage" },
  { id: "wine_white", label: "White wine", emoji: "🍷", serving: "5 oz", kcal: 121, carbs: 4, protein: 0, fat: 0, category: "beverage" },
  { id: "champagne", label: "Champagne", emoji: "🍾", serving: "5 oz", kcal: 119, carbs: 5, protein: 0, fat: 0, category: "beverage" },
  { id: "cocktail_margarita", label: "Margarita", emoji: "🍹", serving: "1 standard", kcal: 280, carbs: 18, protein: 0, fat: 0, category: "beverage" },
  { id: "cocktail_mojito", label: "Mojito", emoji: "🍹", serving: "1 standard", kcal: 168, carbs: 12, protein: 0, fat: 0, category: "beverage" },
  { id: "cocktail_negroni", label: "Negroni", emoji: "🍸", serving: "1 standard", kcal: 215, carbs: 11, protein: 0, fat: 0, category: "beverage" },
  { id: "cocktail_old_fashioned", label: "Old fashioned", emoji: "🥃", serving: "1 standard", kcal: 154, carbs: 4, protein: 0, fat: 0, category: "beverage" },
  { id: "spirits_vodka", label: "Vodka shot", emoji: "🥃", serving: "1.5 oz", kcal: 97, carbs: 0, protein: 0, fat: 0, category: "beverage" },
  { id: "spirits_whiskey", label: "Whiskey", emoji: "🥃", serving: "1.5 oz", kcal: 105, carbs: 0, protein: 0, fat: 0, category: "beverage" },
  { id: "spirits_tequila", label: "Tequila shot", emoji: "🥃", serving: "1.5 oz", kcal: 96, carbs: 0, protein: 0, fat: 0, category: "beverage" },
  { id: "spirits_rum", label: "Rum", emoji: "🥃", serving: "1.5 oz", kcal: 97, carbs: 0, protein: 0, fat: 0, category: "beverage" },

  // ── Condiments, dressings, oils
  { id: "olive_oil", label: "Olive oil", emoji: "🫒", serving: "1 tbsp", kcal: 119, carbs: 0, protein: 0, fat: 14 },
  { id: "ketchup", label: "Ketchup", emoji: "🍅", serving: "1 tbsp", kcal: 17, carbs: 4, protein: 0, fat: 0 },
  { id: "mustard", label: "Mustard", emoji: "🟡", serving: "1 tsp", kcal: 3, carbs: 0, protein: 0, fat: 0 },
  { id: "mayo", label: "Mayonnaise", emoji: "🥚", serving: "1 tbsp", kcal: 94, carbs: 0, protein: 0, fat: 10 },
  { id: "soy_sauce", label: "Soy sauce", emoji: "🍱", serving: "1 tbsp", kcal: 8, carbs: 1, protein: 1, fat: 0 },
  { id: "sriracha", label: "Sriracha", emoji: "🌶️", serving: "1 tsp", kcal: 5, carbs: 1, protein: 0, fat: 0 },
  { id: "ranch", label: "Ranch dressing", emoji: "🥗", serving: "2 tbsp", kcal: 145, carbs: 2, protein: 1, fat: 15 },
  { id: "vinaigrette", label: "Vinaigrette", emoji: "🥗", serving: "2 tbsp", kcal: 80, carbs: 2, protein: 0, fat: 8 },
  { id: "guacamole", label: "Guacamole", emoji: "🥑", serving: "2 tbsp", kcal: 50, carbs: 3, protein: 1, fat: 4 },
  { id: "salsa", label: "Salsa", emoji: "🍅", serving: "2 tbsp", kcal: 10, carbs: 2, protein: 0, fat: 0 },
  { id: "sugar", label: "Sugar, granulated", emoji: "🍬", serving: "1 tsp", kcal: 16, carbs: 4, protein: 0, fat: 0 },
];

async function searchOpenFoodFacts(query: string, signal?: AbortSignal): Promise<FoodPreset[]> {
  const url =
    `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}` +
    `&search_simple=1&action=process&json=1&page_size=20` +
    `&fields=code,product_name,brands,nutriments,serving_size,categories_tags,image_small_url`;
  const res = await fetch(url, { signal });
  if (!res.ok) return [];
  const data = (await res.json()) as {
    products?: Array<{
      code?: string;
      product_name?: string;
      brands?: string;
      serving_size?: string;
      categories_tags?: string[];
      nutriments?: Record<string, number | string | undefined>;
    }>;
  };
  const products = data.products ?? [];
  const out: FoodPreset[] = [];
  const seen = new Set<string>();
  for (const p of products) {
    const name = (p.product_name || "").trim();
    if (!name) continue;
    const n = p.nutriments || {};
    const kcalServ = numFrom(n["energy-kcal_serving"]) ?? numFrom(n["energy-kcal_value"]);
    const kcal100 = numFrom(n["energy-kcal_100g"]);
    const kcal = kcalServ ?? kcal100;
    if (kcal == null || kcal <= 0 || kcal > 2000) continue;
    const useServing = kcalServ != null;
    const carbs = useServing
      ? numFrom(n["carbohydrates_serving"]) ?? 0
      : numFrom(n["carbohydrates_100g"]) ?? 0;
    const protein = useServing
      ? numFrom(n["proteins_serving"]) ?? 0
      : numFrom(n["proteins_100g"]) ?? 0;
    const fat = useServing
      ? numFrom(n["fat_serving"]) ?? 0
      : numFrom(n["fat_100g"]) ?? 0;
    const serving = useServing
      ? (p.serving_size?.trim() || "1 serving")
      : "100 g";
    const tags = (p.categories_tags ?? []).join(" ");
    const isBeverage =
      /beverages|drinks|sodas|waters|juices|coffees|teas|alcoholic/.test(tags);
    const label = p.brands ? `${name} · ${p.brands.split(",")[0].trim()}` : name;
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      id: `off_${p.code ?? key}`,
      label: label.length > 60 ? label.slice(0, 57) + "…" : label,
      emoji: isBeverage ? "🥤" : "🍽️",
      serving,
      kcal: Math.round(kcal),
      carbs: Math.round(carbs),
      protein: Math.round(protein),
      fat: Math.round(fat),
      category: isBeverage ? "beverage" : "food",
    });
    if (out.length >= 15) break;
  }
  return out;
}

function numFrom(v: number | string | undefined): number | null {
  if (v == null) return null;
  const n = typeof v === "number" ? v : parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

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
            <Text style={[styles.statValue, { color: "#ec4899" }]}>{totals.kcal}</Text>
            <Text style={[styles.statLabel, { color: "#ec4899" }]}>Eaten</Text>
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
              <Text style={[styles.gaugeLabel, { color: colors.mutedForeground }]}>To Eat</Text>
            </View>
          </View>

          <View style={styles.statBlock}>
            <Text style={[styles.statValue, { color: "#22c55e" }]}>{burned}</Text>
            <Text style={[styles.statLabel, { color: "#22c55e" }]}>Earnt</Text>
          </View>
        </View>

        <View style={styles.macrosRow}>
          <MacroCol label="Carbs" current={totals.carbs} goal={DEFAULT_CARBS} colors={colors} />
          <MacroCol label="Protein" current={totals.protein} goal={DEFAULT_PROTEIN} colors={colors} />
          <MacroCol label="Fat" current={totals.fat} goal={DEFAULT_FAT} colors={colors} />
        </View>
      </Pressable>

      <View style={styles.headerRow}>
        <Text style={[styles.sectionHeading, { color: colors.foreground }]}>Eaten</Text>
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
                <Feather name="plus" size={22} color="#a29bfe" />
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
        <View style={[styles.macroFill, { width: `${Math.max(4, ratio * 100)}%`, backgroundColor: "#22c55e" }]} />
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

type CategoryFilter = "foods" | "beverages";
type FrequencyFilter = "frequent" | "all";

function FoodPicker({ meal, onClose, onAdd }: PickerProps) {
  const colors = useColors();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<FoodPreset | null>(null);
  const [servings, setServings] = useState("1");
  const [catFilter, setCatFilter] = useState<CategoryFilter>("foods");
  const [freqFilter, setFreqFilter] = useState<FrequencyFilter>("frequent");
  const [pending, setPending] = useState<{ id: string; preset: FoodPreset; servings: number }[]>([]);
  const [frequency, setFrequency] = useState<Record<string, number>>({});
  const [catOpen, setCatOpen] = useState(false);
  const [freqOpen, setFreqOpen] = useState(false);
  const [barcodeOpen, setBarcodeOpen] = useState(false);
  const [cameraBusy, setCameraBusy] = useState(false);
  const [remoteResults, setRemoteResults] = useState<FoodPreset[]>([]);
  const [remoteLoading, setRemoteLoading] = useState(false);

  const open = meal !== null;
  const mealLabel = MEALS.find((m) => m.key === meal)?.label ?? "";

  useEffect(() => {
    if (open) {
      AsyncStorage.getItem("food_frequency").then((v) => {
        if (v) {
          try {
            setFrequency(JSON.parse(v));
          } catch {}
        }
      });
    }
  }, [open]);

  const filtered = useMemo(() => {
    let list = FOOD_PRESETS;
    if (catFilter === "foods") {
      list = list.filter((p) => p.category !== "beverage");
    } else {
      list = list.filter((p) => p.category === "beverage");
    }
    if (freqFilter === "frequent") {
      const sorted = [...list].sort((a, b) => (frequency[b.id] ?? 0) - (frequency[a.id] ?? 0));
      list = sorted.slice(0, Math.max(8, sorted.filter((p) => (frequency[p.id] ?? 0) > 0).length));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = FOOD_PRESETS.filter((p) => p.label.toLowerCase().includes(q));
    }
    return list;
  }, [catFilter, freqFilter, search, frequency]);

  useEffect(() => {
    const q = search.trim();
    if (q.length < 3) {
      setRemoteResults([]);
      setRemoteLoading(false);
      return;
    }
    setRemoteLoading(true);
    const controller = new AbortController();
    const handle = setTimeout(async () => {
      try {
        const results = await searchOpenFoodFacts(q, controller.signal);
        setRemoteResults(results);
      } catch {
        setRemoteResults([]);
      } finally {
        setRemoteLoading(false);
      }
    }, 450);
    return () => {
      controller.abort();
      clearTimeout(handle);
    };
  }, [search]);

  function reset() {
    setSearch("");
    setSelected(null);
    setServings("1");
    setPending([]);
    setCatOpen(false);
    setFreqOpen(false);
    setBarcodeOpen(false);
    setCameraBusy(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleQuickAdd(preset: FoodPreset) {
    setPending((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, preset, servings: 1 },
    ]);
  }

  function handleRemovePending(id: string) {
    setPending((prev) => prev.filter((p) => p.id !== id));
  }

  async function handleDone() {
    if (!meal) return;
    if (selected) {
      const s = Math.max(0.25, Math.min(20, Number(servings) || 1));
      onAdd(selected, s, meal);
      bumpFrequency(selected.id);
    }
    for (const p of pending) {
      onAdd(p.preset, p.servings, meal);
      bumpFrequency(p.preset.id);
    }
    const updated = { ...frequency };
    if (selected) updated[selected.id] = (updated[selected.id] ?? 0) + 1;
    for (const p of pending) updated[p.preset.id] = (updated[p.preset.id] ?? 0) + 1;
    await AsyncStorage.setItem("food_frequency", JSON.stringify(updated));
    reset();
    onClose();
  }

  function bumpFrequency(id: string) {
    setFrequency((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
  }

  async function handleCameraScan() {
    if (cameraBusy) return;
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Camera permission needed", "Allow camera access to scan a meal.");
      return;
    }
    const r = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.6,
      base64: true,
      allowsEditing: false,
    });
    if (r.canceled || !r.assets?.[0]?.base64) return;
    setCameraBusy(true);
    try {
      const domain = (process.env.EXPO_PUBLIC_DOMAIN as string | undefined) ?? "";
      const apiBase = domain
        ? domain.startsWith("http")
          ? `${domain.replace(/\/$/, "")}/api`
          : `https://${domain}/api`
        : "/api";
      const res = await fetch(`${apiBase}/scan-food`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: r.assets[0].base64,
          mimeType: r.assets[0].mimeType ?? "image/jpeg",
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as {
        items: { label: string; emoji: string; serving: string; kcal: number; carbs: number; protein: number; fat: number }[];
        note?: string;
      };
      if (!data.items || data.items.length === 0) {
        Alert.alert("No food detected", data.note || "Try another photo.");
        return;
      }
      const newPending = data.items.map((it, i) => ({
        id: `${Date.now()}-cam-${i}-${Math.random().toString(36).slice(2, 6)}`,
        preset: {
          id: `cam_${Date.now()}_${i}`,
          label: it.label,
          emoji: it.emoji || "🍽️",
          serving: it.serving || "1 serving",
          kcal: it.kcal,
          carbs: it.carbs,
          protein: it.protein,
          fat: it.fat,
        } as FoodPreset,
        servings: 1,
      }));
      setPending((prev) => [...prev, ...newPending]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not analyze photo.";
      Alert.alert("Scan failed", msg);
    } finally {
      setCameraBusy(false);
    }
  }

  function handleBarcodeResult(p: ScannedProduct) {
    setBarcodeOpen(false);
    setPending((prev) => [
      ...prev,
      {
        id: `${Date.now()}-bc-${Math.random().toString(36).slice(2, 6)}`,
        preset: {
          id: `bc_${p.barcode}`,
          label: p.label,
          emoji: p.emoji,
          serving: p.serving,
          kcal: p.kcal,
          carbs: p.carbs,
          protein: p.protein,
          fat: p.fat,
        } as FoodPreset,
        servings: 1,
      },
    ]);
  }

  const totalCount = pending.length + (selected ? 1 : 0);

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable style={[styles.sheet, styles.tallSheet, { backgroundColor: colors.card }]} onPress={(e) => e.stopPropagation?.()}>
          <View style={styles.sheetHandle} />
          <View style={styles.pickerHeader}>
            <View style={styles.countBadgeWrap}>
              <View style={[styles.countBadge, { borderColor: totalCount > 0 ? colors.primary : colors.border }]}>
                <Text style={[styles.countBadgeText, { color: totalCount > 0 ? colors.primary : colors.mutedForeground }]}>
                  {totalCount}
                </Text>
              </View>
            </View>
            <Text style={[styles.pickerTitle, { color: colors.foreground }]} numberOfLines={1}>
              {mealLabel}
            </Text>
            <Pressable onPress={handleClose} hitSlop={10} style={styles.headerCloseBtn}>
              <Feather name="x" size={22} color={colors.mutedForeground} />
            </Pressable>
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
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Pressable
                  onPress={() => setSelected(null)}
                  style={({ pressed }) => [
                    styles.confirmBtn,
                    { flex: 1, backgroundColor: colors.muted },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Text style={[styles.confirmBtnText, { color: colors.foreground }]}>Back</Text>
                </Pressable>
                <Pressable
                  onPress={handleDone}
                  style={({ pressed }) => [
                    styles.confirmBtn,
                    { flex: 1, backgroundColor: colors.primary },
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <Text style={styles.confirmBtnText}>Add to {mealLabel}</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <>
              <View style={styles.modeRow}>
                {([
                  { key: "camera", label: "Camera", icon: "camera", color: "#ec4899", onPress: handleCameraScan },
                  { key: "barcode", label: "Barcode", icon: "bar-chart-2", color: "#ef4444", onPress: () => setBarcodeOpen(true) },
                ] as const).map((m) => (
                  <Pressable
                    key={m.key}
                    onPress={m.onPress}
                    disabled={cameraBusy && m.key === "camera"}
                    style={styles.modeColumn}
                  >
                    <View
                      style={[
                        styles.modeTile,
                        { backgroundColor: colors.muted, borderColor: "transparent" },
                      ]}
                    >
                      <View style={[styles.modeIconBubble, { backgroundColor: m.color + "33" }]}>
                        {cameraBusy && m.key === "camera" ? (
                          <ActivityIndicator color={m.color} />
                        ) : (
                          <Feather name={m.icon} size={18} color={m.color} />
                        )}
                      </View>
                    </View>
                    <Text style={[styles.modeLabel, { color: colors.mutedForeground }]}>
                      {m.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View
                style={[
                  styles.searchWrap,
                  styles.searchWrapBordered,
                  { backgroundColor: colors.background, borderColor: colors.primary },
                ]}
              >
                <Feather name="search" size={16} color={colors.mutedForeground} />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder={`What did you have for ${mealLabel.toLowerCase()}?`}
                  placeholderTextColor={colors.mutedForeground}
                  style={[styles.searchInput, { color: colors.foreground }]}
                />
              </View>

              <View style={styles.dropRow}>
                <FilterDropdown
                  label={catFilter === "foods" ? "Foods" : "Beverages"}
                  open={catOpen}
                  onToggle={() => {
                    setCatOpen((v) => !v);
                    setFreqOpen(false);
                  }}
                  options={[
                    { key: "foods", label: "Foods" },
                    { key: "beverages", label: "Beverages" },
                  ]}
                  onSelect={(k) => {
                    setCatFilter(k as CategoryFilter);
                    setCatOpen(false);
                  }}
                  active={catFilter}
                  colors={colors}
                />
                <FilterDropdown
                  label={freqFilter === "frequent" ? "Frequent" : "All"}
                  open={freqOpen}
                  onToggle={() => {
                    setFreqOpen((v) => !v);
                    setCatOpen(false);
                  }}
                  options={[
                    { key: "frequent", label: "Frequent" },
                    { key: "all", label: "All" },
                  ]}
                  onSelect={(k) => {
                    setFreqFilter(k as FrequencyFilter);
                    setFreqOpen(false);
                  }}
                  active={freqFilter}
                  colors={colors}
                />
              </View>

              <ScrollView style={styles.pickerScroll} keyboardShouldPersistTaps="handled">
                {filtered.length === 0 && remoteResults.length === 0 && !remoteLoading && (
                  <Text style={[styles.empty, { color: colors.mutedForeground }]}>
                    {search.trim().length >= 3
                      ? "No results. Try another search."
                      : "Type at least 3 characters to search the food library."}
                  </Text>
                )}
                {filtered.map((p) => {
                  const pendingCount = pending.filter((x) => x.preset.id === p.id).length;
                  return (
                    <View
                      key={p.id}
                      style={[styles.foodRow, { borderBottomColor: colors.border }]}
                    >
                      <Pressable
                        onPress={() => setSelected(p)}
                        style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 14 }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.foodLabel, { color: colors.foreground }]}>
                            {p.label}
                            {pendingCount > 0 && (
                              <Text style={{ color: colors.primary }}> · {pendingCount} added</Text>
                            )}
                          </Text>
                          <Text style={[styles.foodSub, { color: colors.mutedForeground }]}>
                            {p.serving}
                          </Text>
                        </View>
                        <Text style={[styles.foodKcal, { color: colors.foreground }]}>{p.kcal} kcal</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleQuickAdd(p)}
                        onLongPress={() => {
                          if (pendingCount > 0) {
                            const last = [...pending].reverse().find((x) => x.preset.id === p.id);
                            if (last) handleRemovePending(last.id);
                          }
                        }}
                        hitSlop={6}
                        style={({ pressed }) => [
                          styles.plusBtn,
                          { borderColor: colors.primary },
                          pressed && { opacity: 0.6 },
                        ]}
                      >
                        <Feather name="plus" size={18} color={colors.primary} />
                      </Pressable>
                    </View>
                  );
                })}

                {search.trim().length >= 3 && (
                  <>
                    {(remoteResults.length > 0 || remoteLoading) && (
                      <Text
                        style={{
                          paddingHorizontal: 14,
                          paddingTop: 14,
                          paddingBottom: 6,
                          fontSize: 12,
                          fontWeight: "600",
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                          color: colors.mutedForeground,
                        }}
                      >
                        {remoteLoading ? "Searching food library…" : "More from food library"}
                      </Text>
                    )}
                    {remoteResults
                      .filter(
                        (r) =>
                          !filtered.some(
                            (f) => f.label.toLowerCase() === r.label.toLowerCase(),
                          ),
                      )
                      .map((p) => {
                        const pendingCount = pending.filter((x) => x.preset.id === p.id).length;
                        return (
                          <View
                            key={p.id}
                            style={[styles.foodRow, { borderBottomColor: colors.border }]}
                          >
                            <Pressable
                              onPress={() => setSelected(p)}
                              style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 14 }}
                            >
                              <View style={{ flex: 1 }}>
                                <Text style={[styles.foodLabel, { color: colors.foreground }]} numberOfLines={1}>
                                  {p.label}
                                  {pendingCount > 0 && (
                                    <Text style={{ color: colors.primary }}> · {pendingCount} added</Text>
                                  )}
                                </Text>
                                <Text style={[styles.foodSub, { color: colors.mutedForeground }]}>
                                  {p.serving}
                                </Text>
                              </View>
                              <Text style={[styles.foodKcal, { color: colors.foreground }]}>{p.kcal} kcal</Text>
                            </Pressable>
                            <Pressable
                              onPress={() => handleQuickAdd(p)}
                              hitSlop={6}
                              style={({ pressed }) => [
                                styles.plusBtn,
                                { borderColor: colors.primary },
                                pressed && { opacity: 0.6 },
                              ]}
                            >
                              <Feather name="plus" size={18} color={colors.primary} />
                            </Pressable>
                          </View>
                        );
                      })}
                  </>
                )}

                <View style={{ height: 80 }} />
              </ScrollView>

              <Pressable
                onPress={handleDone}
                disabled={totalCount === 0}
                style={({ pressed }) => [
                  styles.doneBtn,
                  { backgroundColor: totalCount === 0 ? colors.muted : "#fff" },
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Text style={[styles.doneBtnText, { color: totalCount === 0 ? colors.mutedForeground : "#1a1a2e" }]}>
                  Done{totalCount > 0 ? ` (${totalCount})` : ""}
                </Text>
              </Pressable>
            </>
          )}
        </Pressable>
      </Pressable>
      <BarcodeScannerModal
        visible={barcodeOpen}
        onClose={() => setBarcodeOpen(false)}
        onResult={handleBarcodeResult}
      />
    </Modal>
  );
}

function FilterDropdown({
  label,
  open,
  onToggle,
  options,
  onSelect,
  active,
  colors,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  options: { key: string; label: string }[];
  onSelect: (k: string) => void;
  active: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={{ flex: 1, position: "relative" }}>
      <Pressable
        onPress={onToggle}
        style={({ pressed }) => [
          styles.dropBtn,
          { borderColor: colors.border, backgroundColor: colors.background },
          pressed && { opacity: 0.7 },
        ]}
      >
        <Text style={[styles.dropBtnText, { color: colors.foreground }]}>{label}</Text>
        <Feather name={open ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} />
      </Pressable>
      {open && (
        <View style={[styles.dropMenu, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {options.map((o) => (
            <Pressable
              key={o.key}
              onPress={() => onSelect(o.key)}
              style={({ pressed }) => [
                styles.dropItem,
                pressed && { backgroundColor: colors.muted },
              ]}
            >
              <Text
                style={[
                  styles.dropItemText,
                  { color: o.key === active ? colors.primary : colors.foreground, fontFamily: o.key === active ? "Inter_700Bold" : "Inter_500Medium" },
                ]}
              >
                {o.label}
              </Text>
              {o.key === active && <Feather name="check" size={16} color={colors.primary} />}
            </Pressable>
          ))}
        </View>
      )}
    </View>
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
  tallSheet: { maxHeight: "92%", minHeight: "70%" },
  countBadgeWrap: { width: 36, alignItems: "flex-start" },
  countBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  countBadgeText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  headerCloseBtn: { width: 36, alignItems: "flex-end" },
  modeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    marginTop: 2,
  },
  modeColumn: {
    alignItems: "center",
    gap: 6,
    width: "48%",
  },
  modeTile: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  modeIconBubble: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  modeLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  searchWrapBordered: { borderWidth: 2 },
  dropRow: {
    flexDirection: "row",
    gap: 10,
    zIndex: 5,
  },
  dropBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  dropBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  dropMenu: {
    position: "absolute",
    top: 44,
    left: 0,
    right: 0,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 4,
    zIndex: 10,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  dropItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  dropItemText: { fontSize: 14 },
  foodKcal: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  plusBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  doneBtn: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  doneBtnText: { fontSize: 16, fontFamily: "Inter_700Bold" },
});
