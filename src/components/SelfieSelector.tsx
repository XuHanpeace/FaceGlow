import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Modal,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { useUserSelfies } from '../hooks/useUser';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { authService } from '../services/auth/authService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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
  const { selfies, defaultSelfieUrl, setDefaultSelfieUrl } = useUserSelfies();
  const [showPanel, setShowPanel] = useState(false);
  const [currentSelectedSelfie, setCurrentSelectedSelfie] = useState<string | null>(selectedSelfieUrl || null);
  const [tempSelectedSelfie, setTempSelectedSelfie] = useState<string | null>(null);

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
      // 没有自拍，检查登录态后跳转到自拍引导页
      const authResult = await authService.requireRealUser();
      
      if (!authResult.success) {
        if (authResult.error?.code === 'ANONYMOUS_USER' || 
            authResult.error?.code === 'NOT_LOGGED_IN') {
              navigation.navigate('NewAuth') 
        }
        return;
      }
      
      navigation.navigate('SelfieGuide');
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
    setShowPanel(false);
    
    // 检查登录态
    const authResult = await authService.requireRealUser();
    
    if (!authResult.success) {
      if (authResult.error?.code === 'ANONYMOUS_USER' || 
          authResult.error?.code === 'NOT_LOGGED_IN') {
            navigation.navigate('NewAuth') 
      }
      return;
    }
    
    navigation.navigate('SelfieGuide');
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
            <Text style={[styles.addIcon, { fontSize: size * 0.3 }]}>+</Text>
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
        <Image
          source={{ uri: currentSelectedSelfie || selfies[0]?.url }}
          style={[styles.selfieImage, { width: size, height: size, borderRadius: size / 2 }]}
          resizeMode="cover"
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
        <View style={styles.panelContainer}>
            {/* 面板标题 */}
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>选择自拍</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowPanel(false)}
              >
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* 自拍列表 */}
            <ScrollView style={styles.selfieList} showsVerticalScrollIndicator={false}>
              {selfies.map((selfie, index) => (
                <TouchableOpacity
                  key={selfie.id}
                  style={[
                    styles.selfieItem,
                    tempSelectedSelfie === selfie.url && styles.selectedSelfieItem
                  ]}
                  onPress={() => handleTempSelfieSelect(selfie.url)}
                >
                  <Image
                    source={selfie.source}
                    style={styles.selfieItemImage}
                    resizeMode="cover"
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
            <TouchableOpacity
              style={[
                styles.confirmButton,
                !tempSelectedSelfie && styles.confirmButtonDisabled
              ]}
              onPress={handleConfirm}
              disabled={!tempSelectedSelfie}
            >
              <Text style={styles.confirmButtonText}>确认选择</Text>
            </TouchableOpacity>
        </View>
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
    borderColor: '#fff',
  },
  selfieImage: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  addButton: {
    backgroundColor: 'rgba(94, 231, 223, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(94, 231, 223, 0.4)',
    borderStyle: 'dashed',
  },
  addIcon: {
    color: '#5EE7DF',
    fontWeight: 'bold',
  },
  selectIndicator: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#5EE7DF',
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
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
  },
  selectedSelfieItem: {
    backgroundColor: 'rgba(94, 231, 223, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(94, 231, 223, 0.3)',
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
    backgroundColor: '#5EE7DF',
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
    backgroundColor: '#5EE7DF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  defaultText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  confirmButton: {
    backgroundColor: '#5EE7DF',
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#666',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SelfieSelector;
