import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, TouchableOpacity, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/services/supabase';
import { Theme } from '@/constants/Theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface UserProfile {
  id: string;
  display_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at?: string;
}

interface UserStats {
  totalMeals: number;
  avgCaloriesPerDay: number;
  daysTracking: number;
  favoriteFood: string;
}

export default function Profile() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    display_name: '',
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchStats();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching profile:', error);
    } else if (data) {
      setProfile(data);
      setEditForm({
        display_name: data.display_name || '',
      });
    } else {
      // Create profile if it doesn't exist
      const newProfile = {
        id: user.id,
        display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || '',
        created_at: new Date().toISOString(),
      };
      
      const { data: createdProfile, error: createError } = await supabase
        .from('profiles')
        .insert(newProfile)
        .select()
        .single();

      if (createError) {
        console.error('Error creating profile:', createError);
      } else {
        setProfile(createdProfile);
      }
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    if (!user) return;

    try {
      // Get meal stats
      const { data: meals } = await supabase
        .from('meal_logs')
        .select('calories, food_name, logged_at')
        .eq('user_id', user.id);

      if (meals) {
        const totalMeals = meals.length;
        const totalCalories = meals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
        
        // Calculate unique days
        const uniqueDays = new Set(
          meals.map(meal => new Date(meal.logged_at).toDateString())
        ).size;
        
        const avgCaloriesPerDay = uniqueDays > 0 ? Math.round(totalCalories / uniqueDays) : 0;
        
        // Find most frequent food
        const foodCounts = meals.reduce((acc: { [key: string]: number }, meal) => {
          acc[meal.food_name] = (acc[meal.food_name] || 0) + 1;
          return acc;
        }, {});
        
        const favoriteFood = Object.keys(foodCounts).reduce((a, b) => 
          foodCounts[a] > foodCounts[b] ? a : b, 'None'
        );

        setStats({
          totalMeals,
          avgCaloriesPerDay,
          daysTracking: uniqueDays,
          favoriteFood: totalMeals > 0 ? favoriteFood : 'None',
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const updateProfile = async () => {
    if (!user) return;

    setLoading(true);
    
    const updates = {
      display_name: editForm.display_name || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (error) {
      Alert.alert('Error', 'Failed to update profile');
      console.error('Error updating profile:', error);
    } else {
      Alert.alert('Success', 'Profile updated successfully');
      await fetchProfile();
      setEditing(false);
    }
    
    setLoading(false);
  };

  if (loading && !profile) {
    return (
      <View style={styles.container}>
        <Card style={styles.loadingCard}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[Theme.colors.primary, Theme.colors.primaryDark]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(profile?.display_name || user?.email || 'U')[0].toUpperCase()}
              </Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>
                {profile?.display_name || user?.email?.split('@')[0] || 'User'}
              </Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
              <Text style={styles.memberSince}>
                Member since {new Date(profile?.created_at || '').toLocaleDateString()}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.editButton} onPress={() => setEditing(!editing)}>
            <Ionicons 
              name={editing ? "close" : "pencil"} 
              size={20} 
              color="#fff" 
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {editing ? (
          // Edit Form
          <Card style={styles.editCard}>
            <Text style={styles.editTitle}>Edit Profile</Text>
            
            <Input
              label="Display Name"
              value={editForm.display_name}
              onChangeText={(text) => setEditForm({ ...editForm, display_name: text })}
              placeholder="Enter your name"
            />
            
            <View style={styles.editActions}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setEditing(false)}
                style={styles.actionButton}
              />
              <Button
                title="Save"
                onPress={updateProfile}
                loading={loading}
                style={styles.actionButton}
              />
            </View>
          </Card>
        ) : (
          // Profile Display
          <>
            {/* Statistics */}
            {stats && (
              <Card style={styles.statsCard}>
                <Text style={styles.cardTitle}>Your Progress</Text>
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Ionicons name="restaurant" size={24} color={Theme.colors.primary} />
                    <Text style={styles.statValue}>{stats.totalMeals}</Text>
                    <Text style={styles.statLabel}>Meals Logged</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="calendar" size={24} color={Theme.colors.success} />
                    <Text style={styles.statValue}>{stats.daysTracking}</Text>
                    <Text style={styles.statLabel}>Days Tracking</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="flame" size={24} color={Theme.colors.error} />
                    <Text style={styles.statValue}>{stats.avgCaloriesPerDay}</Text>
                    <Text style={styles.statLabel}>Avg Calories/Day</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="heart" size={24} color={Theme.colors.warning} />
                    <Text style={styles.statValue} numberOfLines={1}>
                      {stats.favoriteFood}
                    </Text>
                    <Text style={styles.statLabel}>Favorite Food</Text>
                  </View>
                </View>
              </Card>
            )}

            {/* Account Information */}
            <Card style={styles.accountCard}>
              <Text style={styles.cardTitle}>Account Information</Text>
              <View style={styles.accountItem}>
                <View style={styles.accountInfo}>
                  <Ionicons name="person" size={20} color={Theme.colors.primary} />
                  <Text style={styles.accountLabel}>Display Name</Text>
                </View>
                <Text style={styles.accountValue}>
                  {profile?.display_name || 'Not set'}
                </Text>
              </View>
              <View style={styles.accountItem}>
                <View style={styles.accountInfo}>
                  <Ionicons name="mail" size={20} color={Theme.colors.success} />
                  <Text style={styles.accountLabel}>Email</Text>
                </View>
                <Text style={styles.accountValue}>
                  {user?.email}
                </Text>
              </View>
              <View style={styles.accountItem}>
                <View style={styles.accountInfo}>
                  <Ionicons name="calendar" size={20} color={Theme.colors.warning} />
                  <Text style={styles.accountLabel}>Member Since</Text>
                </View>
                <Text style={styles.accountValue}>
                  {new Date(profile?.created_at || '').toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Text>
              </View>
            </Card>

            {/* Quick Actions */}
            <Card style={styles.actionsCard}>
              <Text style={styles.cardTitle}>Quick Actions</Text>
              <TouchableOpacity style={styles.actionItem} onPress={() => setEditing(true)}>
                <View style={styles.actionInfo}>
                  <Ionicons name="pencil" size={20} color={Theme.colors.primary} />
                  <Text style={styles.actionLabel}>Edit Profile</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Theme.colors.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionItem}>
                <View style={styles.actionInfo}>
                  <Ionicons name="settings" size={20} color={Theme.colors.textSecondary} />
                  <Text style={styles.actionLabel}>Settings</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Theme.colors.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionItem}>
                <View style={styles.actionInfo}>
                  <Ionicons name="help-circle" size={20} color={Theme.colors.textSecondary} />
                  <Text style={styles.actionLabel}>Help & Support</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Theme.colors.textMuted} />
              </TouchableOpacity>
            </Card>

            {/* Sign Out */}
            <Card style={styles.signOutCard}>
              <Button
                title="Sign Out"
                onPress={signOut}
                variant="outline"
                style={styles.signOutButton}
              />
            </Card>
          </>
        )}
      </ScrollView>
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
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.md,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700' as TextStyle['fontWeight'],
    color: '#fff',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: Theme.typography.h3.fontSize,
    fontWeight: Theme.typography.h3.fontWeight,
    lineHeight: Theme.typography.h3.lineHeight,
    color: '#fff',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: Theme.typography.bodySmall.fontSize,
    fontWeight: Theme.typography.bodySmall.fontWeight,
    lineHeight: Theme.typography.bodySmall.lineHeight,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 2,
  },
  memberSince: {
    fontSize: Theme.typography.caption.fontSize,
    fontWeight: Theme.typography.caption.fontWeight,
    lineHeight: Theme.typography.caption.lineHeight,
    color: 'rgba(255,255,255,0.6)',
  },
  editButton: {
    padding: Theme.spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: Theme.borderRadius.md,
  },
  content: {
    flex: 1,
    marginTop: -Theme.spacing.lg,
    paddingHorizontal: Theme.spacing.lg,
  },
  loadingCard: {
    padding: Theme.spacing.xl,
    alignItems: 'center',
    marginTop: Theme.spacing.xl,
  },
  loadingText: {
    fontSize: Theme.typography.body.fontSize,
    fontWeight: Theme.typography.body.fontWeight,
    lineHeight: Theme.typography.body.lineHeight,
    color: Theme.colors.textSecondary,
  },
  editCard: {
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.lg,
  },
  editTitle: {
    fontSize: Theme.typography.h3.fontSize,
    fontWeight: Theme.typography.h3.fontWeight,
    lineHeight: Theme.typography.h3.lineHeight,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.lg,
    textAlign: 'center',
  },
  editActions: {
    flexDirection: 'row',
    gap: Theme.spacing.md,
    marginTop: Theme.spacing.lg,
  },
  actionButton: {
    flex: 1,
  },
  cardTitle: {
    fontSize: Theme.typography.h3.fontSize,
    fontWeight: Theme.typography.h3.fontWeight,
    lineHeight: Theme.typography.h3.lineHeight,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.md,
    textAlign: 'center',
  },
  statsCard: {
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.md,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: Theme.spacing.md,
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.borderRadius.md,
    gap: Theme.spacing.xs,
  },
  statValue: {
    fontSize: Theme.typography.body.fontSize,
    fontWeight: '600' as TextStyle['fontWeight'],
    lineHeight: Theme.typography.body.lineHeight,
    color: Theme.colors.text,
  },
  statLabel: {
    fontSize: Theme.typography.caption.fontSize,
    fontWeight: Theme.typography.caption.fontWeight,
    lineHeight: Theme.typography.caption.lineHeight,
    color: Theme.colors.textMuted,
    textAlign: 'center',
  },
  accountCard: {
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.lg,
  },
  accountItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.borderLight,
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    flex: 1,
  },
  accountLabel: {
    fontSize: Theme.typography.body.fontSize,
    fontWeight: Theme.typography.body.fontWeight,
    lineHeight: Theme.typography.body.lineHeight,
    color: Theme.colors.text,
  },
  accountValue: {
    fontSize: Theme.typography.bodySmall.fontSize,
    fontWeight: '500' as TextStyle['fontWeight'],
    lineHeight: Theme.typography.bodySmall.lineHeight,
    color: Theme.colors.textSecondary,
    flex: 1,
    textAlign: 'right',
  },
  actionsCard: {
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.lg,
  },
  actionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.borderLight,
  },
  actionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  actionLabel: {
    fontSize: Theme.typography.body.fontSize,
    fontWeight: Theme.typography.body.fontWeight,
    lineHeight: Theme.typography.body.lineHeight,
    color: Theme.colors.text,
  },
  signOutCard: {
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.xl,
  },
  signOutButton: {
    borderColor: Theme.colors.error,
  },
});