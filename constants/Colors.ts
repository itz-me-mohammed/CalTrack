/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#2563EB'; // Blue
const tintColorDark = '#60A5FA'; // Light blue

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#6B7280', // Gray for inactive tabs
    tabIconSelected: tintColorLight, // Blue for active tabs
    tabBarBackground: '#FFFFFF',
    tabBarBorder: '#E5E7EB',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9CA3AF', // Light gray for inactive tabs
    tabIconSelected: tintColorDark, // Light blue for active tabs
    tabBarBackground: '#1F2937',
    tabBarBorder: '#374151',
  },
};
