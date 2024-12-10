import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Dimensions} from 'react-native';

// 获取屏幕宽度
const screenWidth = Dimensions.get('window').width;
// 计算卡片宽度 (屏幕宽度 - 总内边距) / 3
const cardWidth = (screenWidth - 48) / 3; // 48 = 左右padding(16) * 2 + 卡片间距(8) * 2

interface FeatureCardProps {
  title: string;
  subtitle: string;
  backgroundColor?: string;
  onPress?: () => void;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  subtitle,
  backgroundColor = '#E8F4FF',
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={[styles.container, {backgroundColor}]}
      onPress={onPress}
      activeOpacity={0.7}>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        <Text style={styles.subtitle} numberOfLines={2}>{subtitle}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 12,
    margin: 4,
    minHeight: 120,
    width: cardWidth,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
});

export default FeatureCard; 