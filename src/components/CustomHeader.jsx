import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../theme/colors';

const CustomHeader = ({ title, showBack, onBackPress, rightComponent }) => {
  return (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        {showBack && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBackPress}
            activeOpacity={0.7}
          >
            <Icon name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
        )}
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.rightContainer}>
          {rightComponent || <View style={styles.rightPlaceholder} />}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.primary,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  headerContent: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
    textAlign: 'center',
  },
  rightContainer: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightPlaceholder: {
    width: 40,
  },
});

export default CustomHeader; 