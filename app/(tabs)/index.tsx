import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ScrollView, TextStyle, ViewStyle } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from "../../services/supabase";
import { useAuth } from '@/contexts/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import { Theme } from '@/constants/Theme';
import { Card } from '@/components/ui/Card';

interface Meal {
  id: string;
  food_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  logged_at: string;
}

interface StatCardProps {
  title: string;
  value: string | number;
  unit: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

export default function Dashboard() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayStats, setTodayStats] = useState({
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
    mealCount: 0
  });

  const { user, signOut } = useAuth();

  const fetchMeals = async () => {
    if (!user) return;

    setLoading(true);
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

    const { data, error } = await supabase
      .from("meal_logs")
      .select("*")
      .eq("user_id", user.id)
      .gte("logged_at", startOfDay)
      .lte("logged_at", endOfDay)
      .order("logged_at", { ascending: false });

    if (error) {
      console.error("Error fetching meals:", error);
    } else {
      setMeals(data || []);
      
      const totals = (data || []).reduce((acc, meal) => ({
        totalCalories: acc.totalCalories + (meal.calories || 0),
        totalProtein: acc.totalProtein + (meal.protein || 0),
        totalCarbs: acc.totalCarbs + (meal.carbs || 0),
        totalFat: acc.totalFat + (meal.fat || 0),
        mealCount: acc.mealCount + 1
      }), {
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
        mealCount: 0
      });
      
      setTodayStats(totals);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMeals();
  }, [user]);

  useFocusEffect(
    React.useCallback(() => {
      fetchMeals();
    }, [user])
  );

  const StatCard = ({ title, value, unit, icon, color }: StatCardProps) => {
    const cardStyle: ViewStyle = {
      ...styles.statCard,
      borderLeftColor: color,
      borderLeftWidth: 4,
    };

    return (
      <Card style={cardStyle}>
        <View style={styles.statHeader}>
          <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
            <Ionicons name={icon} size={20} color={color} />
          </View>
          <Text style={styles.statTitle}>{title}</Text>
        </View>
        <Text style={[styles.statValue, { color }]}>{value}</Text>
        <Text style={styles.statUnit}>{unit}</Text>
      </Card>
    );
  };

  const MealCard = ({ item }: { item: Meal }) => (
    <Card style={styles.mealCard}>
      <View style={styles.mealHeader}>
        <Text style={styles.mealName}>{item.food_name}</Text>
        <Text style={styles.mealTime}>
          {new Date(item.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      <View style={styles.mealNutrition}>
        <View style={styles.nutritionItem}>
          <Text style={styles.nutritionValue}>{item.calories}</Text>
          <Text style={styles.nutritionLabel}>cal</Text>
        </View>
        <View style={styles.nutritionItem}>
          <Text style={styles.nutritionValue}>{item.protein.toFixed(1)}g</Text>
          <Text style={styles.nutritionLabel}>protein</Text>
        </View>
        <View style={styles.nutritionItem}>
          <Text style={styles.nutritionValue}>{item.carbs.toFixed(1)}g</Text>
          <Text style={styles.nutritionLabel}>carbs</Text>
        </View>
        <View style={styles.nutritionItem}>
          <Text style={styles.nutritionValue}>{item.fat.toFixed(1)}g</Text>
          <Text style={styles.nutritionLabel}>fat</Text>
        </View>
      </View>
    </Card>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header with gradient */}
      <LinearGradient
        colors={[Theme.colors.primary, Theme.colors.primaryDark]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Good day!</Text>
            <Text style={styles.userName}>
              {user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User'}
            </Text>
          </View>
          <TouchableOpacity onPress={signOut} style={styles.signOutButton}>
            <Ionicons name="log-out-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Stats Cards */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Today's Overview</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Calories"
              value={todayStats.totalCalories}
              unit="kcal"
              icon="flame"
              color={Theme.colors.error}
            />
            <StatCard
              title="Protein"
              value={todayStats.totalProtein.toFixed(1)}
              unit="grams"
              icon="fitness"
              color={Theme.colors.success}
            />
            <StatCard
              title="Carbs"
              value={todayStats.totalCarbs.toFixed(1)}
              unit="grams"
              icon="leaf"
              color={Theme.colors.warning}
            />
            <StatCard
              title="Fat"
              value={todayStats.totalFat.toFixed(1)}
              unit="grams"
              icon="water"
              color={Theme.colors.primary}
            />
          </View>
        </View>

        {/* Meals Section */}
        <View style={styles.mealsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Today's Meals ({todayStats.mealCount})
            </Text>
            {meals.length > 0 && (
              <TouchableOpacity style={styles.viewAllButton}>
                <Text style={styles.viewAllText}>View All</Text>
                <Ionicons name="arrow-forward" size={16} color={Theme.colors.primary} />
              </TouchableOpacity>
            )}
          </View>

          {loading ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>Loading meals...</Text>
            </Card>
          ) : meals.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="restaurant-outline" size={48} color={Theme.colors.textMuted} />
              <Text style={styles.emptyText}>No meals logged today</Text>
              <Text style={styles.emptySubtext}>Start tracking your nutrition!</Text>
            </Card>
          ) : (
            <View style={styles.mealsList}>
              {meals.slice(0, 3).map((meal) => (
                <MealCard key={meal.id} item={meal} />
              ))}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
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
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.9,
  },
  userName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700' as TextStyle['fontWeight'],
    marginTop: 4,
  },
  signOutButton: {
    padding: Theme.spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: Theme.borderRadius.md,
  },
  content: {
    flex: 1,
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: Theme.spacing.lg, // Added proper top padding instead of negative margin
  },
  statsSection: {
    marginBottom: Theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: Theme.typography.h3.fontSize,
    fontWeight: Theme.typography.h3.fontWeight,
    lineHeight: Theme.typography.h3.lineHeight,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: Theme.spacing.md,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: Theme.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.sm,
  },
  statTitle: {
    fontSize: Theme.typography.bodySmall.fontSize,
    fontWeight: '500' as TextStyle['fontWeight'],
    lineHeight: Theme.typography.bodySmall.lineHeight,
    color: Theme.colors.textSecondary,
  },
  statValue: {
    fontSize: Theme.typography.h2.fontSize,
    fontWeight: Theme.typography.h2.fontWeight,
    lineHeight: Theme.typography.h2.lineHeight,
    marginBottom: 2,
  },
  statUnit: {
    fontSize: Theme.typography.caption.fontSize,
    fontWeight: Theme.typography.caption.fontWeight,
    lineHeight: Theme.typography.caption.lineHeight,
    color: Theme.colors.textMuted,
  },
  mealsSection: {
    marginBottom: Theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: Theme.typography.bodySmall.fontSize,
    fontWeight: '500' as TextStyle['fontWeight'],
    lineHeight: Theme.typography.bodySmall.lineHeight,
    color: Theme.colors.primary,
  },
  mealsList: {
    gap: Theme.spacing.md,
  },
  mealCard: {
    padding: Theme.spacing.md,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  mealName: {
    fontSize: Theme.typography.body.fontSize,
    fontWeight: '600' as TextStyle['fontWeight'],
    lineHeight: Theme.typography.body.lineHeight,
    color: Theme.colors.text,
    flex: 1,
  },
  mealTime: {
    fontSize: Theme.typography.caption.fontSize,
    fontWeight: Theme.typography.caption.fontWeight,
    lineHeight: Theme.typography.caption.lineHeight,
    color: Theme.colors.textMuted,
  },
  mealNutrition: {
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
