import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useUserSelfies } from '../hooks/useUser';

interface SelfieModuleProps {
  onAddSelfiePress: () => void;
}

const SelfieModule: React.FC<SelfieModuleProps> = ({ onAddSelfiePress }) => {
  const { selfies } = useUserSelfies();

  // 最多6个头像（useUserSelfies已经倒序了）
  const displaySelfies = selfies.slice(0, 6);

  return (
    <View style={styles.selfieModule}>
      <Text style={styles.selfieTitle}>我的自拍</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.selfieContent}
        style={styles.selfieScrollView}
      >
        {/* 添加自拍按钮 */}
        <TouchableOpacity style={styles.addSelfieButton} onPress={onAddSelfiePress}>
          <Text style={styles.addIcon}>+</Text>
        </TouchableOpacity>
        
        {/* 自拍照列表 */}
        {displaySelfies.map((selfie) => (
          <Image 
            key={selfie.id} 
            source={selfie.source} 
            style={styles.selfieImage} 
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  selfieModule: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    padding: 16,
  },
  selfieTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
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
    backgroundColor: 'rgba(94, 231, 223, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(94, 231, 223, 0.4)',
    borderStyle: 'dashed',
  },
  addIcon: {
    color: '#5EE7DF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  selfieImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
});

export default SelfieModule;
