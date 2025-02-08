import React from 'react';
import { View, StyleSheet } from 'react-native';

const BlurBackground: React.FC = () => {
  return (
    <View style={styles.blurContainer}>
      <View style={styles.yellowBlur} />
      <View style={styles.blueBlur} />
      <View style={styles.purpleBlur} />
    </View>
  );
};

const styles = StyleSheet.create({
  blurContainer: {
    position: 'absolute',
    top: 200,
    left: 0,
    right: 0,
    height: 200,
    width: 400,
  },
  yellowBlur: {
    position: 'absolute',
    width: 150,
    height: 150,
    backgroundColor: 'rgba(255, 220, 0, 0.3)',
    borderRadius: 75,
    bottom: 20,
    left: '10%',
    transform: [{ scale: 1.5 }],
    opacity: 0.2,
  },
  blueBlur: {
    position: 'absolute',
    width: 150,
    height: 150,
    backgroundColor: 'rgba(0, 120, 255, 0.3)',
    borderRadius: 75,
    bottom: 0,
    right: '15%',
    transform: [{ scale: 1.3 }],
    opacity: 0.3,
  },
  purpleBlur: {
    position: 'absolute',
    width: 120,
    height: 120,
    backgroundColor: 'rgba(128, 0, 255, 0.3)',
    borderRadius: 60,
    bottom: 40,
    left: '40%',
    transform: [{ scale: 1.4 }],
    opacity: 0.2,
  },
});

export default BlurBackground; 