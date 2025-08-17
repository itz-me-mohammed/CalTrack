import React from 'react';
import { TextInput, View, Text, StyleSheet, TextInputProps, TextStyle } from 'react-native';
import { Theme } from '@/constants/Theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Input({ label, error, leftIcon, rightIcon, style, ...props }: InputProps) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputContainer, error && styles.errorBorder]}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={Theme.colors.textMuted}
          {...props}
        />
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Theme.spacing.md,
  },
  label: {
    fontSize: Theme.typography.bodySmall.fontSize,
    fontWeight: '500' as TextStyle['fontWeight'],
    lineHeight: Theme.typography.bodySmall.lineHeight,
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
    minHeight: 48,
  },
  input: {
    flex: 1,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.md,
    fontSize: Theme.typography.body.fontSize,
    fontWeight: Theme.typography.body.fontWeight,
    lineHeight: Theme.typography.body.lineHeight,
    color: Theme.colors.text,
  },
  leftIcon: {
    paddingLeft: Theme.spacing.md,
  },
  rightIcon: {
    paddingRight: Theme.spacing.md,
  },
  errorBorder: {
    borderColor: Theme.colors.error,
  },
  error: {
    fontSize: Theme.typography.caption.fontSize,
    fontWeight: Theme.typography.caption.fontWeight,
    lineHeight: Theme.typography.caption.lineHeight,
    color: Theme.colors.error,
    marginTop: Theme.spacing.xs,
  },
});