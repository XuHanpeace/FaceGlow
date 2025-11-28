import React, { useState } from 'react';
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
import GradientButton from './GradientButton';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface DefaultSelfieSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (selfieUrl: string) => void;
}

const DefaultSelfieSelector: React.FC<DefaultSelfieSelectorProps> = ({
  visible,
  onClose,
  onSelect,
}) => {
  const { selfies, defaultSelfieUrl, setDefaultSelfieUrl } = useUserSelfies();
  const [tempSelectedSelfie, setTempSelectedSelfie] = useState<string | null>(defaultSelfieUrl);

  const handleConfirm = () => {
    if (tempSelectedSelfie) {
      // 设置新的默认自拍
      setDefaultSelfieUrl(tempSelectedSelfie);
      onSelect(tempSelectedSelfie);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.panelContainer}>
        {/* 面板标题 */}
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>选择默认自拍</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
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
              onPress={() => setTempSelectedSelfie(selfie.url)}
            >
              <FastImage
                source={selfie.source}
                style={[
                  styles.selfieItemImage,
                  selfie.url === defaultSelfieUrl && styles.defaultSelfieImage
                ]}
                resizeMode={FastImage.resizeMode.cover}
              />
              {tempSelectedSelfie === selfie.url && (
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkIcon}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* 确认按钮 */}
        <GradientButton
          title="设为默认自拍"
          onPress={handleConfirm}
          disabled={!tempSelectedSelfie}
          variant="primary"
          size="large"
          style={styles.confirmButton}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
  closeIcon: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
  defaultSelfieImage: {
    borderWidth: 2,
    borderColor: '#FF6B9D',
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
  confirmButton: {
    marginHorizontal: 20,
    marginTop: 20,
  },
});

export default DefaultSelfieSelector;
