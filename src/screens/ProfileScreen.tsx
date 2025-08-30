import React from 'react';
import { View, Text, StyleSheet, Image, useColorScheme, TouchableOpacity, Alert, ScrollView } from 'react-native';
import HeaderSection from '../components/HeaderSection';
import { useAuthState } from '../hooks/useAuthState';

const ProfileScreen = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const { isLoggedIn, user, logout, isLoading } = useAuthState();

  const handleLogout = async () => {
    Alert.alert(
      '确认登出',
      '确定要退出登录吗？',
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '确定', 
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              Alert.alert('成功', '已退出登录');
            } catch (error) {
              Alert.alert('错误', '退出登录失败');
            }
          }
        }
      ]
    );
  };

  const handleMenuPress = (menuName: string) => {
    if (!isLoggedIn) {
      Alert.alert('提示', '请先登录');
      return;
    }
    Alert.alert('功能提示', `${menuName}功能开发中...`);
  };

  const getAvatarSource = () => {
    if (user?.uid) {
      // 如果有用户ID，可以生成基于用户ID的默认头像
      // 这里使用一个简单的占位符，实际项目中可以使用Gravatar等服务
      return { uri: `https://via.placeholder.com/100/4A90E2/FFFFFF?text=${user.uid.slice(0, 2).toUpperCase()}` };
    }
    return { uri: 'https://via.placeholder.com/100/CCCCCC/666666?text=?' };
  };

  const getUserDisplayName = () => {
    if (user?.uid) {
      // 如果有用户名，显示用户名，否则显示用户ID的前8位
      return user.uid.length > 8 ? user.uid.slice(0, 8) + '...' : user.uid;
    }
    return '未登录';
  };

  return (
    <ScrollView style={[
      styles.container,
      { backgroundColor: isDarkMode ? '#000' : '#fff' }
    ]}>
      <HeaderSection
        title="个人中心"
        subtitle="我的资料"
        description="管理您的个人信息、收藏和设置。"
      />
      
      {/* 用户信息卡片 */}
      <View style={[
        styles.userCard,
        { 
          backgroundColor: isDarkMode ? '#1a1a1a' : '#f8f9fa',
          borderColor: isDarkMode ? '#333' : '#e9ecef'
        }
      ]}>
        <Image
          style={styles.avatar}
          source={getAvatarSource()}
        />
        <View style={styles.userInfo}>
          <Text style={[
            styles.name,
            { color: isDarkMode ? '#fff' : '#333' }
          ]}>
            {getUserDisplayName()}
          </Text>
          <Text style={[
            styles.userStatus,
            { color: isDarkMode ? '#888' : '#666' }
          ]}>
            {isLoggedIn ? '已登录' : '未登录'}
          </Text>
          {isLoggedIn && user && (
            <Text style={[
              styles.userId,
              { color: isDarkMode ? '#666' : '#999' }
            ]}>
              ID: {user.uid}
            </Text>
          )}
        </View>
      </View>

      {/* 功能菜单 */}
      <View style={[
        styles.menuContainer,
        { backgroundColor: isDarkMode ? '#1a1a1a' : '#f8f9fa' }
      ]}>
        <TouchableOpacity 
          style={[
            styles.menuItem,
            { borderBottomColor: isDarkMode ? '#333' : '#e9ecef' }
          ]}
          onPress={() => handleMenuPress('我的收藏')}
        >
          <View style={styles.menuContent}>
            <Text style={[
              styles.menuText,
              { color: isDarkMode ? '#fff' : '#333' }
            ]}>我的收藏</Text>
            <Text style={[
              styles.menuSubtext,
              { color: isDarkMode ? '#666' : '#999' }
            ]}>查看收藏的内容</Text>
          </View>
          <Text style={[
            styles.menuArrow,
            { color: isDarkMode ? '#666' : '#999' }
          ]}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.menuItem,
            { borderBottomColor: isDarkMode ? '#333' : '#e9ecef' }
          ]}
          onPress={() => handleMenuPress('我的发布')}
        >
          <View style={styles.menuContent}>
            <Text style={[
              styles.menuText,
              { color: isDarkMode ? '#fff' : '#333' }
            ]}>我的发布</Text>
            <Text style={[
              styles.menuSubtext,
              { color: isDarkMode ? '#666' : '#999' }
            ]}>管理发布的内容</Text>
          </View>
          <Text style={[
            styles.menuArrow,
            { color: isDarkMode ? '#666' : '#999' }
          ]}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.menuItem,
            { borderBottomColor: isDarkMode ? '#333' : '#e9ecef' }
          ]}
          onPress={() => handleMenuPress('设置')}
        >
          <View style={styles.menuContent}>
            <Text style={[
              styles.menuText,
              { color: isDarkMode ? '#fff' : '#333' }
            ]}>设置</Text>
            <Text style={[
              styles.menuSubtext,
              { color: isDarkMode ? '#666' : '#999' }
            ]}>应用设置和偏好</Text>
          </View>
          <Text style={[
            styles.menuArrow,
            { color: isDarkMode ? '#666' : '#999' }
          ]}>›</Text>
        </TouchableOpacity>
      </View>

      {/* 登录/登出按钮 */}
      <View style={styles.actionContainer}>
        {isLoggedIn ? (
          <TouchableOpacity 
            style={[styles.logoutButton, { backgroundColor: '#ff6b6b' }]}
            onPress={handleLogout}
          >
            <Text style={styles.buttonText}>退出登录</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.loginButton, { backgroundColor: '#4A90E2' }]}
            onPress={() => Alert.alert('提示', '请到首页进行登录')}
          >
            <Text style={styles.buttonText}>去登录</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 底部信息 */}
      <View style={styles.footer}>
        <Text style={[
          styles.footerText,
          { color: isDarkMode ? '#666' : '#999' }
        ]}>
          FaceGlow v1.0.0
        </Text>
      </View>
    </ScrollView>
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
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 10,
    marginHorizontal: 15,
    marginTop: 15,
    marginBottom: 15,
  },
  userInfo: {
    marginLeft: 15,
  },
  userStatus: {
    fontSize: 14,
    marginTop: 5,
  },
  userId: {
    fontSize: 14,
    marginTop: 5,
  },
  menuContainer: {
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 10,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
  },
  menuContent: {
    flex: 1,
  },
  menuText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  menuSubtext: {
    fontSize: 12,
    marginTop: 5,
  },
  menuArrow: {
    fontSize: 20,
  },
  actionContainer: {
    marginHorizontal: 15,
    marginBottom: 20,
  },
  loginButton: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutButton: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 12,
  },
});

export default ProfileScreen; 