// app/(tabs)/history.tsx
import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, TextStyle } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from "../../services/supabase";
import { useAuth } from '@/contexts/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import { Theme } from '@/constants/Theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Meal {
  id: string;
  food_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  serving_qty: number;
  serving_unit: string;
  logged_at: string;
}

interface GroupedMeals {
  [date: string]: {
    meals: Meal[];
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
  };
}

export default function History() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [groupedMeals, setGroupedMeals] = useState<GroupedMeals>({});
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('week');
  const { user } = useAuth();

  const fetchMeals = async () => {
    if (!user) return;

    setLoading(true);
    
    let query = supabase
      .from("meal_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("logged_at", { ascending: false });

    // Apply date filtering based on selected period
    if (selectedPeriod === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      query = query.gte("logged_at", weekAgo.toISOString());
    } else if (selectedPeriod === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      query = query.gte("logged_at", monthAgo.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching meals:", error);
      Alert.alert("Error", "Failed to load meal history");
    } else {
      setMeals(data || []);
      groupMealsByDate(data || []);
    }
    setLoading(false);
  };

  const groupMealsByDate = (meals: Meal[]) => {
    const grouped = meals.reduce((acc: GroupedMeals, meal) => {
      const date = new Date(meal.logged_at).toDateString();
      
      if (!acc[date]) {
        acc[date] = {
          meals: [],
          totalCalories: 0,
          totalProtein: 0,
          totalCarbs: 0,
          totalFat: 0,
        };
      }
      
      acc[date].meals.push(meal);
      acc[date].totalCalories += meal.calories || 0;
      acc[date].totalProtein += meal.protein || 0;
      acc[date].totalCarbs += meal.carbs || 0;
      acc[date].totalFat += meal.fat || 0;
      
      return acc;
    }, {});
    
    setGroupedMeals(grouped);
  };

  const deleteMeal = async (mealId: string) => {
    Alert.alert(
      "Delete Meal",
      "Are you sure you want to delete this meal?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase
              .from("meal_logs")
              .delete()
              .eq("id", mealId);

            if (error) {
              Alert.alert("Error", "Failed to delete meal");
            } else {
              fetchMeals(); // Refresh the list
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    fetchMeals();
  }, [user, selectedPeriod]);

  useFocusEffect(
    React.useCallback(() => {
      fetchMeals();
    }, [user, selectedPeriod])
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const PeriodSelector = () => (
    <View style={styles.periodSelector}>
      {(['week', 'month', 'all'] as const).map((period) => (
        <TouchableOpacity
          key={period}
          style={[
            styles.periodButton,
            selectedPeriod === period && styles.periodButtonActive
          ]}
          onPress={() => setSelectedPeriod(period)}
        >
          <Text style={[
            styles.periodButtonText,
            selectedPeriod === period && styles.periodButtonTextActive
          ]}>
            {period === 'week' ? 'This Week' : period === 'month' ? 'This Month' : 'All Time'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const MealItem = ({ meal }: { meal: Meal }) => (
    <Card style={styles.mealItem}>
      <View style={styles.mealHeader}>
        <View style={styles.mealInfo}>
          <Text style={styles.mealName}>{meal.food_name}</Text>
          <Text style={styles.mealServing}>
            {meal.serving_qty} {meal.serving_unit}
          </Text>
          <Text style={styles.mealTime}>
            {new Date(meal.logged_at).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteMeal(meal.id)}
        >
          <Ionicons name="trash-outline" size={18} color={Theme.colors.error} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.nutritionGrid}>
        <View style={styles.nutritionItem}>
          <Text style={styles.nutritionValue}>{meal.calories}</Text>
          <Text style={styles.nutritionLabel}>cal</Text>
        </View>
        <View style={styles.nutritionItem}>
          <Text style={styles.nutritionValue}>{meal.protein.toFixed(1)}g</Text>
          <Text style={styles.nutritionLabel}>protein</Text>
        </View>
        <View style={styles.nutritionItem}>
          <Text style={styles.nutritionValue}>{meal.carbs.toFixed(1)}g</Text>
          <Text style={styles.nutritionLabel}>carbs</Text>
        </View>
        <View style={styles.nutritionItem}>
          <Text style={styles.nutritionValue}>{meal.fat.toFixed(1)}g</Text>
          <Text style={styles.nutritionLabel}>fat</Text>
        </View>
      </View>
    </Card>
  );

  const DayGroup = ({ date, dayData }: { date: string, dayData: GroupedMeals[string] }) => (
    <View style={styles.dayGroup}>
      <View style={styles.dayHeader}>
        <Text style={styles.dayTitle}>{formatDate(date)}</Text>
        <View style={styles.dayStats}>
          <Text style={styles.dayStatsText}>
            {dayData.totalCalories} cal • {dayData.meals.length} meals
          </Text>
        </View>
      </View>
      
      <View style={styles.dayNutritionSummary}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: Theme.colors.error }]}>
            {dayData.totalCalories}
          </Text>
          <Text style={styles.summaryLabel}>Calories</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: Theme.colors.success }]}>
            {dayData.totalProtein.toFixed(1)}g
          </Text>
          <Text style={styles.summaryLabel}>Protein</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: Theme.colors.warning }]}>
            {dayData.totalCarbs.toFixed(1)}g
          </Text>
          <Text style={styles.summaryLabel}>Carbs</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: Theme.colors.primary }]}>
            {dayData.totalFat.toFixed(1)}g
          </Text>
          <Text style={styles.summaryLabel}>Fat</Text>
        </View>
      </View>
      
      {dayData.meals.map((meal) => (
        <MealItem key={meal.id} meal={meal} />
      ))}
    </View>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>Loading history...</Text>
        </Card>
      );
    }

    if (Object.keys(groupedMeals).length === 0) {
      return (
        <Card style={styles.emptyCard}>
          <Ionicons name="time-outline" size={48} color={Theme.colors.textMuted} />
          <Text style={styles.emptyText}>No meals found</Text>
          <Text style={styles.emptySubtext}>
            {selectedPeriod === 'week' 
              ? "No meals logged this week" 
              : selectedPeriod === 'month'
              ? "No meals logged this month"
              : "Start tracking your meals!"}
          </Text>
        </Card>
      );
    }

    return (
      <FlatList
        data={Object.entries(groupedMeals)}
        keyExtractor={([date]) => date}
        renderItem={({ item: [date, dayData] }) => (
          <DayGroup date={date} dayData={dayData} />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[Theme.colors.primary, Theme.colors.primaryDark]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Meal History</Text>
        <Text style={styles.headerSubtitle}>
          Track your nutrition journey
        </Text>
      </LinearGradient>

      <View style={styles.content}>
        <PeriodSelector />
        {renderContent()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    paddingTop: 50,
    paddingBottom: Theme.spacing.xl,
    paddingHorizontal: Theme.spacing.lg,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Theme.typography.h1.fontSize,
    fontWeight: Theme.typography.h1.fontWeight,
    lineHeight: Theme.typography.h1.lineHeight,
    color: '#fff',
    marginBottom: Theme.spacing.xs,
  },
  headerSubtitle: {
    fontSize: Theme.typography.body.fontSize,
    fontWeight: Theme.typography.body.fontWeight,
    lineHeight: Theme.typography.body.lineHeight,
    color: 'rgba(255,255,255,0.8)',
  },
  content: {
    flex: 1,
    marginTop: -Theme.spacing.lg,
    paddingHorizontal: Theme.spacing.lg,
  },
  periodSelector: {
    flexDirection: 'row',
    marginBottom: Theme.spacing.lg,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.md,
    padding: 4,
    ...Theme.shadows.sm,
  },
  periodButton: {
    flex: 1,
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.md,
    borderRadius: Theme.borderRadius.sm,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: Theme.colors.primary,
  },
  periodButtonText: {
    fontSize: Theme.typography.bodySmall.fontSize,
    fontWeight: '500' as TextStyle['fontWeight'],
    lineHeight: Theme.typography.bodySmall.lineHeight,
    color: Theme.colors.textSecondary,
  },
  periodButtonTextActive: {
    color: '#fff',
    fontWeight: '600' as TextStyle['fontWeight'],
  },
  listContent: {
    paddingBottom: Theme.spacing.xl,
  },
  dayGroup: {
    marginBottom: Theme.spacing.lg,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  dayTitle: {
    fontSize: Theme.typography.h3.fontSize,
    fontWeight: Theme.typography.h3.fontWeight,
    lineHeight: Theme.typography.h3.lineHeight,
    color: Theme.colors.text,
  },
  dayStats: {
    backgroundColor: Theme.colors.primary + '20',
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: Theme.borderRadius.sm,
  },
  dayStatsText: {
    fontSize: Theme.typography.caption.fontSize,
    fontWeight: '500' as TextStyle['fontWeight'],
    lineHeight: Theme.typography.caption.lineHeight,
    color: Theme.colors.primary,
  },
  dayNutritionSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.md,
    ...Theme.shadows.sm,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: Theme.typography.body.fontSize,
    fontWeight: '600' as TextStyle['fontWeight'],
    lineHeight: Theme.typography.body.lineHeight,
  },
  summaryLabel: {
    fontSize: Theme.typography.caption.fontSize,
    fontWeight: Theme.typography.caption.fontWeight,
    lineHeight: Theme.typography.caption.lineHeight,
    color: Theme.colors.textMuted,
    marginTop: 2,
  },
  mealItem: {
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Theme.spacing.md,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: Theme.typography.body.fontSize,
    fontWeight: '600' as TextStyle['fontWeight'],
    lineHeight: Theme.typography.body.lineHeight,
    color: Theme.colors.text,
    marginBottom: 2,
  },
  mealServing: {
    fontSize: Theme.typography.bodySmall.fontSize,
    fontWeight: Theme.typography.bodySmall.fontWeight,
    lineHeight: Theme.typography.bodySmall.lineHeight,
    color: Theme.colors.textSecondary,
    marginBottom: 2,
  },
  mealTime: {
    fontSize: Theme.typography.caption.fontSize,
    fontWeight: Theme.typography.caption.fontWeight,
    lineHeight: Theme.typography.caption.lineHeight,
    color: Theme.colors.textMuted,
  },
  deleteButton: {
    padding: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.sm,
    backgroundColor: Theme.colors.error + '10',
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: Theme.typography.bodySmall.fontSize,
    fontWeight: '600' as TextStyle['fontWeight'],
    lineHeight: Theme.typography.bodySmall.lineHeight,
    color: Theme.colors.text,
  },
  nutritionLabel: {
    fontSize: Theme.typography.caption.fontSize,
    fontWeight: Theme.typography.caption.fontWeight,
    lineHeight: Theme.typography.caption.lineHeight,
    color: Theme.colors.textMuted,
  },
  emptyCard: {
    padding: Theme.spacing.xl,
    alignItems: 'center',
    marginTop: Theme.spacing.xl,
  },
  emptyText: {
    fontSize: Theme.typography.body.fontSize,
    fontWeight: Theme.typography.body.fontWeight,
    lineHeight: Theme.typography.body.lineHeight,
    color: Theme.colors.textSecondary,
    marginTop: Theme.spacing.md,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: Theme.typography.bodySmall.fontSize,
    fontWeight: Theme.typography.bodySmall.fontWeight,
    lineHeight: Theme.typography.bodySmall.lineHeight,
    color: Theme.colors.textMuted,
    marginTop: Theme.spacing.xs,
    textAlign: 'center',
  },
});