import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Image } from 'react-native';
import GradientButton from './GradientButton';

// 获取屏幕宽度
const screenWidth = Dimensions.get('window').width;
// 计算卡片宽度 (屏幕宽度 - 总内边距) / 3
const cardWidth = (screenWidth - 48) / 3; // 48 = 左右padding(16) * 2 + 卡片间距(8) * 2

interface FeatureCardProps {
  title: string;
  imageSource: string;
  buttonText: string;
  backgroundColor?: string;
  onPress: () => void;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  imageSource,
  buttonText,
  backgroundColor = '#E8F4FF',
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.titleWrapper}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
        </View>

        <Image source={{ uri: imageSource }} style={styles.image} />
        {/* <GradientButton
          text={buttonText}
          onPress={onPress}
          colors={['#5EE7DF', '#B7F985']}
          style={styles.button}
        /> */}
        <TouchableOpacity style={styles.button} onPress={onPress} activeOpacity={0.7}>
          <Text style={styles.buttonText}>{buttonText}</Text>
        </TouchableOpacity>
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
    alignItems: 'center',
  },
  titleWrapper: {
    width: '100%',
  },
  title: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  button: {
    backgroundColor: '#10f8f5',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    width: '100%',
    marginTop: 8,
    alignSelf: 'center',
  },
  buttonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default FeatureCard;
