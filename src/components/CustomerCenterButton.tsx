import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import Purchases from 'react-native-purchases';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

/**
 * Customer Center 按钮组件
 * 用于打开 RevenueCat Customer Center，让用户管理订阅
 */
interface CustomerCenterButtonProps {
  onError?: (error: Error) => void;
  style?: object;
  textStyle?: object;
  buttonText?: string;
}

const CustomerCenterButton: React.FC<CustomerCenterButtonProps> = ({
  onError,
  style,
  textStyle,
  buttonText = '管理订阅',
}) => {
  const handlePress = async () => {
    try {
      // 打开 Customer Center
      await Purchases.presentCodeRedemptionSheet();
    } catch (error: unknown) {
      const errorObj = error instanceof Error ? error : new Error('打开订阅管理失败');
      console.error('❌ 打开 Customer Center 失败:', errorObj);
      
      if (onError) {
        onError(errorObj);
      } else {
        Alert.alert('错误', '无法打开订阅管理，请稍后重试');
      }
    }
  };

  return (
    <TouchableOpacity style={[styles.button, style]} onPress={handlePress}>
      <FontAwesome name="cog" size={14} color="#fff" style={styles.icon} />
      <Text style={[styles.buttonText, textStyle]}>{buttonText}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
  },
  icon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default CustomerCenterButton;

