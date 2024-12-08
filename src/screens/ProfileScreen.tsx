import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import HeaderSection from '../components/HeaderSection';

const ProfileScreen = () => {
  return (
    <View style={styles.container}>
      <HeaderSection
        title="个人中心"
        subtitle="我的资料"
        description="管理您的个人信息、收藏和设置。"
      />
      <View style={styles.header}>
        <Image
          style={styles.avatar}
          source={{ uri: 'https://via.placeholder.com/100' }}
        />
        <Text style={styles.name}>用户名</Text>
      </View>
      <View style={styles.menuItem}>
        <Text style={styles.menuText}>我的收藏</Text>
      </View>
      <View style={styles.menuItem}>
        <Text style={styles.menuText}>我的发布</Text>
      </View>
      <View style={styles.menuItem}>
        <Text style={styles.menuText}>设置</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  name: {
    fontSize: 18,
    color: '#333',
    fontWeight: 'bold',
  },
  menuItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuText: {
    fontSize: 16,
    color: '#333',
  },
});

export default ProfileScreen; 