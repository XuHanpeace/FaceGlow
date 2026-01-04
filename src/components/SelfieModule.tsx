import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { useUserSelfies } from '../hooks/useUser';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import LinearGradient from 'react-native-linear-gradient';
import { themeColors } from '../config/theme';

interface SelfieModuleProps {
  onAddSelfiePress: () => void;
  onSelfieSelect?: () => void;
}

const SelfieModule: React.FC<SelfieModuleProps> = ({ onAddSelfiePress, onSelfieSelect }) => {
  const { selfies, defaultSelfieUrl, hasSelfies } = useUserSelfies();

  // 判断是否为新用户（自拍数为0）
  const isNewUser = !hasSelfies || selfies.length === 0;

  // 最多6个头像（useUserSelfies已经倒序了）
  const displaySelfies = selfies.slice(0, 6);

  const handleSelfiePress = () => {
    // 如果没有自拍，点击整个模块都拉起自拍页面
    if (isNewUser) {
      onAddSelfiePress();
      return;
    }
    // 如果有自拍，点击自拍区域，调用回调函数
    if (onSelfieSelect) {
      onSelfieSelect();
    }
  };

  return (
    <TouchableOpacity 
      style={styles.selfieModule} 
      onPress={handleSelfiePress} 
      activeOpacity={0.8}
    >
      <View style={styles.titleContainer}>
        <Text style={styles.selfieTitle}>我的自拍</Text>
        {/* 新用户促销标签 */}
        {isNewUser && (
          <View style={styles.promoBadge}>
            <LinearGradient
              colors={themeColors.primary.gradient}
              start={themeColors.primary.start}
              end={themeColors.primary.end}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.badgeContent}>
              <Text style={styles.badgeText}>立即获得</Text>
              <Image
                source={require('../assets/mm-coins.png')}
                style={styles.badgeCoinIcon}
                resizeMode="contain"
              />
              <Text style={styles.badgeText}>10美美币</Text>
            </View>
          </View>
        )}
      </View>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.selfieContent}
        style={styles.selfieScrollView}
      >
        {/* 添加自拍按钮 */}
        <TouchableOpacity 
          style={styles.addSelfieButton} 
          onPress={(e) => {
            e.stopPropagation(); // 阻止事件冒泡
            onAddSelfiePress();
          }}
        >
          <FontAwesome name="plus" size={20} color="rgba(255,255,255,0.4)" />
        </TouchableOpacity>
        
        {/* 自拍照列表 */}
        {displaySelfies.map((selfie) => (
          <View key={selfie.id} style={styles.selfieContainer}>
            <FastImage 
              source={selfie.source} 
              style={[
                styles.selfieImage,
                selfie.url === defaultSelfieUrl && styles.defaultSelfieImage
              ]}
              resizeMode={FastImage.resizeMode.cover}
            />
          </View>
        ))}

      </ScrollView>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  selfieModule: {
    marginHorizontal: 10,
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    padding: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  promoBadge: {
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 20,
  },
  badgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  badgeCoinIcon: {
    width: 12,
    height: 12,
    marginRight: 2,
  },
  selfieTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  selfieScrollView: {
    // 不需要额外的padding，因为外层已经有padding
  },
  selfieContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 12,
  },
  addSelfieButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 107, 157, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selfieContainer: {
    position: 'relative',
  },
  selfieImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  defaultSelfieImage: {
    borderWidth: 2,
    borderColor: '#FF6B9D',
  },
});

export default SelfieModule;
