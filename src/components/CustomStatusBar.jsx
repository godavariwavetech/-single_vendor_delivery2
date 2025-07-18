import React from 'react';
import { StatusBar, View, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

const CustomStatusBar = ({ backgroundColor = colors.primary, barStyle = "light-content" }) => {
  return (
    <View style={[styles.statusBar, { backgroundColor }]}>
      <StatusBar 
        animated={true}
        backgroundColor={backgroundColor}
        barStyle={barStyle}
      />
    </View>
  );
};

const STATUSBAR_HEIGHT = StatusBar.currentHeight;

const styles = StyleSheet.create({
  statusBar: {
    // height: STATUSBAR_HEIGHT,
  },
});

export default CustomStatusBar; 