import { TextStyle, ViewStyle } from 'react-native';

export const Theme = {
  colors: {
    // Primary colors - Modern blue gradient
    primary: '#667eea',
    primaryDark: '#5a67d8',
    primaryLight: '#9f7aea',
    
    // Secondary colors - Warm accent
    secondary: '#f093fb',
    secondaryDark: '#f093fb',
    secondaryLight: '#fbb6ce',
    
    // Success, warning, error
    success: '#48bb78',
    warning: '#ed8936',
    error: '#f56565',
    
    // Neutral colors
    background: '#f7fafc',
    surface: '#ffffff',
    card: '#ffffff',
    border: '#e2e8f0',
    borderLight: '#f1f5f9',
    
    // Text colors
    text: '#1a202c',
    textSecondary: '#4a5568',
    textLight: '#718096',
    textMuted: '#a0aec0',
    
    // Dark mode support
    dark: {
      background: '#0f0f23',
      surface: '#1a1a2e',
      card: '#16213e',
      text: '#edf2f7',
      textSecondary: '#cbd5e0',
      border: '#2d3748',
    }
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  borderRadius: {
    sm: 6,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: '700' as TextStyle['fontWeight'],
      lineHeight: 40,
    },
    h2: {
      fontSize: 24,
      fontWeight: '600' as TextStyle['fontWeight'],
      lineHeight: 32,
    },
    h3: {
      fontSize: 20,
      fontWeight: '600' as TextStyle['fontWeight'],
      lineHeight: 28,
    },
    body: {
      fontSize: 16,
      fontWeight: '400' as TextStyle['fontWeight'],
      lineHeight: 24,
    },
    bodySmall: {
      fontSize: 14,
      fontWeight: '400' as TextStyle['fontWeight'],
      lineHeight: 20,
    },
    caption: {
      fontSize: 12,
      fontWeight: '500' as TextStyle['fontWeight'],
      lineHeight: 16,
    },
  },
  
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
    },
  },
};