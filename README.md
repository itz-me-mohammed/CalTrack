# CalTrack — Mobile Nutrition Tracker (Expo + Supabase)

Log meals, track calories/macros, and visualize daily progress. Built with Expo Router, TypeScript, and Supabase.

## Features
- Email auth (Supabase)
- Log meals (name, calories, protein, carbs, fat)
- Dashboard: Today’s Overview + recent meals
- History list
- Profile (display name)
- Camera screen (dev build recommended on Android)
- Themed UI components + haptic tab bar (iOS)

## Tech
- Expo (React Native, TypeScript, Expo Router)
- Supabase (Auth + PostgREST)
- Expo Camera, Haptics, Blur

## Environment variables
Create .env in the project root (don’t commit it). Expo public vars must start with EXPO_PUBLIC_.

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_NUTRITIONIX_APP_ID=your_app_id
EXPO_PUBLIC_NUTRITIONIX_API_KEY=your_api_key
```

Tip: Copy template on Windows
```
copy .env.example .env
```

## Getting started
1) Install dependencies
```
npm install
```
2) Start the app
```
npx expo start
```
3) Run on device/emulator
- Press a (Android), i (iOS), w (web).

## Camera on Android (Expo Go limits)
For full media-library access, use a development build:
```
npm i -g @expo/eas-cli
eas build:configure
eas build --platform android --profile development
# or iOS
eas build --platform ios --profile development
```

## Supabase schema (required)
Profiles table (with RLS) and meal_logs:
```sql
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE TABLE IF NOT EXISTS meal_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  food_name TEXT NOT NULL,
  calories INTEGER DEFAULT 0,
  protein NUMERIC DEFAULT 0,
  carbs NUMERIC DEFAULT 0,
  fat NUMERIC DEFAULT 0,
  logged_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE meal_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their meals" ON meal_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their meals" ON meal_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their meals" ON meal_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their meals" ON meal_logs FOR DELETE USING (auth.uid() = user_id);
```

## Project structure
```
app/(tabs)/  Home, History, Profile, FoodCamera, tabs layout
components/  UI components, HapticTab, icons
constants/   Colors, Theme
contexts/    AuthContext
services/    supabase client, nutritionix API
```

## Troubleshooting
- Tab icons invisible: adjust tabBarActiveTintColor/tabBarInactiveTintColor in app/(tabs)/_layout.tsx.
- CameraView children warning: don’t render children inside CameraView; overlay via absolute positioning.
- RLS errors: ensure queries filter profiles.id = auth.uid() and meal_logs.user_id = auth.uid().

## Security
- .env is ignored. If you committed it before:
```
git rm --cached .env
git commit -m "chore: stop tracking .env"
```
Rotate any exposed keys in dashboards.
