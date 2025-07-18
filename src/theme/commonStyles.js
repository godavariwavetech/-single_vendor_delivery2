import { StyleSheet, Platform } from 'react-native';
import { colors } from './colors';

// Common spacing values
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Common border radius values
export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 999,
};

// Typography scale
export const typography = {
  h1: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700',
  },
  h2: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
  },
  h3: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
  },
  body1: {
    fontSize: 16,
    lineHeight: 24,
  },
  body2: {
    fontSize: 14,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
  },
};

// Shadow styles
export const shadows = Platform.select({
  ios: {
    sm: {
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.15,
      shadowRadius: 2,
    },
    md: {
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
    },
    lg: {
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
    },
  },
  android: {
    sm: { elevation: 2 },
    md: { elevation: 4 },
    lg: { elevation: 8 },
  },
});

export const commonStyles = StyleSheet.create({
  // Layout containers
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: spacing.md,
  },

  // Cards
  card: {
    backgroundColor: colors.surfaceLight,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginVertical: spacing.sm,
    ...shadows.md,
  },
  cardPressed: {
    opacity: 0.95,
  },

  // Typography
  h1: {
    ...typography.h1,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  h2: {
    ...typography.h2,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  h3: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  body1: {
    ...typography.body1,
    color: colors.text.primary,
  },
  body2: {
    ...typography.body2,
    color: colors.text.secondary,
  },
  caption: {
    ...typography.caption,
    color: colors.text.tertiary,
  },

  // Buttons
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    ...shadows.sm,
  },
  buttonSecondary: {
    backgroundColor: colors.secondary,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  buttonText: {
    ...typography.body1,
    color: colors.text.inverse,
    fontWeight: '600',
  },
  buttonTextOutline: {
    color: colors.primary,
  },
  buttonIcon: {
    marginRight: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },

  // Form inputs
  input: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: radius.md,
    padding: spacing.md,
    ...typography.body1,
    color: colors.text.primary,
  },
  inputFocused: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  inputError: {
    borderColor: colors.error,
  },
  inputLabel: {
    ...typography.body2,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  inputHelper: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
  inputErrorText: {
    ...typography.caption,
    color: colors.text.error,
    marginTop: spacing.xs,
  },

  // Lists
  list: {
    paddingVertical: spacing.sm,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  listItemLast: {
    borderBottomWidth: 0,
  },

  // Status badges
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.round,
    alignSelf: 'flex-start',
  },
  badgeText: {
    ...typography.caption,
    color: colors.text.inverse,
    fontWeight: '600',
  },

  // Utility classes
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceBetween: {
    justifyContent: 'space-between',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mt: { marginTop: spacing.md },
  mb: { marginBottom: spacing.md },
  ml: { marginLeft: spacing.md },
  mr: { marginRight: spacing.md },
  p: { padding: spacing.md },
}); 