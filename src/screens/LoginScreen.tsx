import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { loginWithWechat } from '../services/tcb';

export const LoginScreen = () => {
  const navigation = useNavigation();

  const handleWechatLogin = async () => {
    try {
      const result = await loginWithWechat();
      //   if (result.success) {
      //     navigation.goBack();
      //   }
    } catch (error) {
      console.error('微信登录失败:', error);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.wechatButton} onPress={handleWechatLogin}>
        <Image source={require('../assets/icons/home-active.png')} style={styles.wechatIcon} />
        <Text style={styles.buttonText}>微信登录</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  wechatButton: {
    flexDirection: 'row',
    backgroundColor: '#07C160',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  wechatIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
