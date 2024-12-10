import React from 'react';
import { View, Text, StyleSheet, Image, useColorScheme } from 'react-native';
import HeaderSection from '../components/HeaderSection';

const ProfileScreen = () => {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <View style={[
      styles.container,
      { backgroundColor: isDarkMode ? '#000' : '#fff' }
    ]}>
      <HeaderSection
        title="个人中心"
        subtitle="我的资料"
        description="管理您的个人信息、收藏和设置。"
      />
      <View style={[
        styles.header,
        { borderBottomColor: isDarkMode ? '#333' : '#eee' }
      ]}>
        <Image
          style={styles.avatar}
          source={{ uri: 'https://via.placeholder.com/100' }}
        />
        <Text style={[
          styles.name,
          { color: isDarkMode ? '#fff' : '#333' }
        ]}>用户名</Text>
      </View>
      <View style={[
        styles.menuItem,
        { borderBottomColor: isDarkMode ? '#333' : '#eee' }
      ]}>
        <Text style={[
          styles.menuText,
          { color: isDarkMode ? '#fff' : '#333' }
        ]}>我的收藏</Text>
      </View>
      <View style={[
        styles.menuItem,
        { borderBottomColor: isDarkMode ? '#333' : '#eee' }
      ]}>
        <Text style={[
          styles.menuText,
          { color: isDarkMode ? '#fff' : '#333' }
        ]}>我的发布</Text>
      </View>
      <View style={[
        styles.menuItem,
        { borderBottomColor: isDarkMode ? '#333' : '#eee' }
      ]}>
        <Text style={[
          styles.menuText,
          { color: isDarkMode ? '#fff' : '#333' }
        ]}>设置</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  menuItem: {
    padding: 15,
    borderBottomWidth: 1,
  },
  menuText: {
    fontSize: 16,
  },
});

export default ProfileScreen; 