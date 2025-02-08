import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';

interface AIFaceSwapIntroProps {
  templateImage: string;
  onPress?: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.min(360, SCREEN_WIDTH - 32);

export const AIFaceSwapIntro: React.FC<AIFaceSwapIntroProps> = ({
  templateImage,
  onPress,
}) => {
  return (
    <View style={styles.container}>
      {/* 顶部模板图片 */}
      <Image source={{ uri: templateImage }} style={styles.templateImage} resizeMode="cover" />

      <Text style={styles.title}>AI个性写真</Text>
      <Text style={styles.subtitle}>上传自拍照，一键生成专属艺术照{'\n'}让AI为你打造独特个人魅力</Text>

      {/* 用户头像示例区域 */}
      <View style={styles.avatarsContainer}>
        <Image
          source={require('../assets/right_sample.webp')}
          style={styles.avatarsImage}
          resizeMode="contain"
        />
      </View>

      {/* 底部按钮 */}
      <TouchableOpacity style={styles.button} onPress={onPress} activeOpacity={0.8}>
        <Text style={styles.buttonText}>立即AI 換臉</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    alignItems: 'center',
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  templateImage: {
    marginTop: 20,
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.2,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 20,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  avatarsContainer: {
    width: SCREEN_WIDTH,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarsImage: {
    width: SCREEN_WIDTH,
    height: 100,
    resizeMode: 'cover',
  },
  button: {
    width: CARD_WIDTH - 32,
    height: 50,
    backgroundColor: '#5EE7DF',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    // 添加阴影效果
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
});
