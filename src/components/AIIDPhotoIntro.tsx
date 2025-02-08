import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Dimensions,
  ImageBackground,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import PagerView from 'react-native-pager-view';
import FastImage from 'react-native-fast-image';
import { LinearGradient } from 'react-native-linear-gradient';
import ImageCarousel from './ImagePager';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.min(360, SCREEN_WIDTH - 32);

interface AIIDPhotoIntroProps {
  onPress?: () => void;
}

const templates = [
  { id: 1, source: require('../assets/sp1.webp') },
  { id: 2, source: require('../assets/sp2.webp') },
  { id: 3, source: require('../assets/sp3.webp') },
];

export const AIIDPhotoIntro: React.FC<AIIDPhotoIntroProps> = ({ onPress }) => {
  return (
    <View style={styles.container}>
      {/* 模糊背景 */}
      <ImageBackground
        source={require('../assets/sp1.webp')}
        style={styles.backgroundImage}
        blurRadius={65}
      >
        <LinearGradient colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.6)']} style={styles.gradient} />
      </ImageBackground>

      {/* 模板轮播 */}
      <View style={styles.templateContainer}>
        <PagerView
          style={styles.pagerView}
          initialPage={1}
          pageMargin={-60} // 使用负边距让页面互相重叠
          offscreenPageLimit={2}
          orientation="horizontal"
        >
          {templates.map(template => (
            <View key={template.id} style={styles.templateWrapper}>
              <FastImage source={template.source} style={styles.templateImage} resizeMode="cover" />
            </View>
          ))}
        </PagerView>
      </View>

      {/* 文案区域 */}
      <View style={styles.content}>
        <Text style={styles.title}>AI证件照生成</Text>
        <Text style={styles.subtitle}>
          上传照片，智能生成标准证件照{'\n'}支持简历、社交平台等多种规格
        </Text>
        <TouchableOpacity style={styles.button} onPress={onPress} activeOpacity={0.8}>
          <Text style={styles.buttonText}>选择模板</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: 600,
    overflow: 'hidden',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  templateContainer: {
    height: 340,
    marginTop: 20,
  },
  pagerView: {
    height: 340,
  },
  templateWrapper: {
    width: SCREEN_WIDTH, // 使用屏幕宽度
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateImage: {
    width: 260,
    height: 320,
    borderRadius: 20,
    // 添加阴影效果使卡片更突出
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  button: {
    width: CARD_WIDTH - 32,
    height: 50,
    backgroundColor: '#5EE7DF',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
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
