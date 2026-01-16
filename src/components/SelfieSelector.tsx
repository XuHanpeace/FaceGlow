import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { useUserSelfies } from '../hooks/useUser';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { authService } from '../services/auth/authService';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import GradientButton from './GradientButton';
import { useAppDispatch } from '../store/hooks';
import { fetchUserProfile } from '../store/middleware/asyncMiddleware';

const { height: screenHeight } = Dimensions.get('window');

type SelfieSelectorNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface SelfieSelectorProps {
  selectedSelfieUrl?: string;
  onSelfieSelect: (selfieUrl: string) => void;
  size?: number;
}

const SelfieSelector: React.FC<SelfieSelectorProps> = ({
  selectedSelfieUrl,
  onSelfieSelect,
  size = 100,
}) => {
  const navigation = useNavigation<SelfieSelectorNavigationProp>();
  const dispatch = useAppDispatch();
  const { selfies, defaultSelfieUrl } = useUserSelfies();
  const [showPanel, setShowPanel] = useState(false);
  const [currentSelectedSelfie, setCurrentSelectedSelfie] = useState<string | null>(selectedSelfieUrl || null);
  const [tempSelectedSelfie, setTempSelectedSelfie] = useState<string | null>(null);

  // 当页面获得焦点时，刷新用户自拍列表
  useFocusEffect(
    React.useCallback(() => {
      // 刷新用户数据以更新自拍列表
      dispatch(fetchUserProfile());
    }, [dispatch])
  );

  // 初始化选中的自拍
  useEffect(() => {
    if (!currentSelectedSelfie && selfies.length > 0) {
      // 优先使用默认自拍，如果没有则使用第一张
      const targetSelfie = defaultSelfieUrl 
        ? selfies.find(selfie => selfie.url === defaultSelfieUrl) || selfies[0]
        : selfies[0];
      
      setCurrentSelectedSelfie(targetSelfie.url);
      onSelfieSelect(targetSelfie.url);
    }
  }, [selfies, currentSelectedSelfie, onSelfieSelect, defaultSelfieUrl]);

  const handleSelfiePress = async () => {
    if (selfies.length === 0) {
      // 没有自拍，允许匿名用户选择照片，不需要登录
      const isNewUser = selfies.length === 0;
      navigation.navigate('SelfieGuide', { isNewUser });
    } else {
      // 有自拍，显示选择面板
      setTempSelectedSelfie(currentSelectedSelfie);
      setShowPanel(true);
    }
  };

  const handleTempSelfieSelect = (selfieUrl: string) => {
    setTempSelectedSelfie(selfieUrl);
  };

  const handleConfirm = () => {
    if (tempSelectedSelfie) {
      setCurrentSelectedSelfie(tempSelectedSelfie);
      onSelfieSelect(tempSelectedSelfie);
      setShowPanel(false);
    }
  };

  const handleAddSelfie = async () => {
    // 允许匿名用户选择照片，不需要登录
    setShowPanel(false);
    const isNewUser = selfies.length === 0;
    navigation.navigate('SelfieGuide', { isNewUser });
  };

  const renderSelfieContent = () => {
    if (selfies.length === 0) {
      // 没有自拍，显示上传按钮
      return (
        <View style={[styles.selfieContainer, { width: size, height: size, borderRadius: size / 2 }]}>
          <TouchableOpacity
            style={[styles.addButton, { width: size * 0.6, height: size * 0.6, borderRadius: size * 0.3 }]}
            onPress={handleSelfiePress}
          >
            <FontAwesome name="plus" size={size * 0.3} color="#fff" />
          </TouchableOpacity>
        </View>
      );
    }

    // 有自拍，显示选中的自拍
    return (
      <TouchableOpacity
        style={[styles.selfieContainer, { width: size, height: size, borderRadius: size / 2 }]}
        onPress={handleSelfiePress}
      >
        <FastImage
          source={{ uri: currentSelectedSelfie || selfies[0]?.url }}
          style={[styles.selfieImage, { width: size, height: size, borderRadius: size / 2 }]}
          resizeMode={FastImage.resizeMode.cover}
        />
        {/* 选择指示器 */}
        <View style={styles.selectIndicator}>
          <Text style={styles.selectIcon}>✓</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      {renderSelfieContent()}
      
      {/* 半屏选择面板 */}
      <Modal
        visible={showPanel}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPanel(false)}
      >
        {/* 外部遮罩层，点击可关闭 */}
        <TouchableOpacity
          style={styles.mask}
          activeOpacity={1}
          onPress={() => setShowPanel(false)}
        >
          <View 
            style={styles.panelContainer}
            onStartShouldSetResponder={() => true}
          >
            {/* 面板标题 */}
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>选择自拍</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddSelfie}
              >
                <FontAwesome name="plus" size={18} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* 自拍列表 */}
            <ScrollView style={styles.selfieList} showsVerticalScrollIndicator={false}>
              {selfies.map((selfie) => (
                <TouchableOpacity
                  key={selfie.id}
                  style={[
                    styles.selfieItem,
                    tempSelectedSelfie === selfie.url && styles.selectedSelfieItem
                  ]}
                  onPress={() => handleTempSelfieSelect(selfie.url)}
                >
                  <FastImage
                    source={selfie.source}
                    style={styles.selfieItemImage}
                    resizeMode={FastImage.resizeMode.cover}
                  />
                  {tempSelectedSelfie === selfie.url && (
                    <View style={styles.checkmark}>
                      <Text style={styles.checkmarkIcon}>✓</Text>
                    </View>
                  )}
                  {/* 默认自拍标记 */}
                  {selfie.url === defaultSelfieUrl && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultText}>默认</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* 确认按钮 */}
            <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
              <GradientButton
                title="确认选择"
                onPress={handleConfirm}
                disabled={!tempSelectedSelfie}
                variant="primary"
                size="large"
                style={{ width: '100%' }}
                borderRadius={28}
              />
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  selfieContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 3,
    borderColor: '#FF6B9D',
  },
  selfieImage: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  selectIndicator: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF6B9D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectIcon: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  panelContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: screenHeight * 0.6,
    paddingBottom: 40,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  panelTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  mask: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  addButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selfieList: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  selfieItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedSelfieItem: {
    backgroundColor: 'rgba(255, 107, 157, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 157, 0.3)',
  },
  selfieItemImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  checkmark: {
    position: 'absolute',
    right: 16,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF6B9D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkIcon: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  defaultBadge: {
    position: 'absolute',
    top: 5,
    left: 5,
    backgroundColor: '#FF6B9D',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  defaultText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default SelfieSelector;
