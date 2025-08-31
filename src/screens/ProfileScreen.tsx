import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  useColorScheme,
  Alert 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import HeaderSection from '../components/HeaderSection';
import { useAuthState } from '../hooks/useAuthState';
import { userWorkService } from '../services/database/userWorkService';
import UserWorkItem from '../components/UserWorkItem';
import { UserWork } from '../types/auth';

const ProfileScreen = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const { isLoggedIn, user, logout, isLoading } = useAuthState();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  // 作品相关状态
  const [userWorks, setUserWorks] = useState<UserWork[]>([]);
  const [worksLoading, setWorksLoading] = useState(false);
  const [worksError, setWorksError] = useState<string | null>(null);
  const [showWorks, setShowWorks] = useState(false);

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

  // 获取用户作品列表
  const fetchUserWorks = async () => {
    if (!user?.uid) {
      setWorksError('用户ID不存在');
      return;
    }

    setWorksLoading(true);
    setWorksError(null);

    try {
      const result = await userWorkService.getUserWorks({
        uid: user.uid,
        limit: 20 // 限制返回20个作品
      });

      if (result.success && result.data) {
        setUserWorks(result.data);
        console.log('获取用户作品成功:', result.data); // 打印返回数据到控制台
      } else {
        setWorksError(result.error?.message || '获取作品失败');
        console.error('获取用户作品失败:', result.error); // 打印错误信息到控制台
      }
    } catch (error) {
      console.error('获取用户作品异常:', error);
      setWorksError('获取作品时发生异常');
    } finally {
      setWorksLoading(false);
    }
  };

  // 切换作品显示状态
  const toggleWorks = () => {
    if (!showWorks && userWorks.length === 0) {
      fetchUserWorks();
    }
    setShowWorks(!showWorks);
  };

  // 处理作品点赞
  const handleWorkLike = async (workId: string) => {
    try {
      const result = await userWorkService.incrementLikes(workId);
      if (result.success) {
        // 刷新作品列表
        fetchUserWorks();
        Alert.alert('成功', '点赞成功！');
      } else {
        Alert.alert('失败', result.error?.message || '点赞失败');
      }
    } catch (error) {
      console.error('点赞失败:', error);
      Alert.alert('错误', '点赞时发生错误');
    }
  };

  // 处理作品下载
  const handleWorkDownload = async (workId: string) => {
    try {
      const result = await userWorkService.incrementDownloadCount(workId);
      if (result.success) {
        // 刷新作品列表
        fetchUserWorks();
        Alert.alert('成功', '下载记录已更新！');
      } else {
        Alert.alert('失败', result.error?.message || '更新下载记录失败');
      }
    } catch (error) {
      console.error('更新下载记录失败:', error);
      Alert.alert('错误', '更新下载记录时发生错误');
    }
  };

  // 处理作品点击
  const handleWorkPress = (work: UserWork) => {
    Alert.alert(
      '作品详情',
      `作品ID: ${work._id}\n模板ID: ${work.template_id}\n状态: ${work.status}\n创建时间: ${new Date(work.created_at).toLocaleString()}`,
      [{ text: '确定' }]
    );
  };

  const handleMenuPress = (menuName: string) => {
    if (menuName === '数据库测试') {
      // 跳转到数据库测试页面
      navigation.navigate('DatabaseTest');
      return;
    }
    
    Alert.alert('功能提示', `${menuName}功能开发中...`);
  };

  const getAvatarSource = () => {
    // 使用存在的图标文件作为默认头像
    return require('../assets/icons/profile.png');
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
        title="个人中心 Profile"
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
          onPress={() => handleMenuPress('数据库测试')}
        >
          <View style={styles.menuContent}>
            <Text style={[
              styles.menuText,
              { color: isDarkMode ? '#fff' : '#333' }
            ]}>数据库测试</Text>
            <Text style={[
              styles.menuSubtext,
              { color: isDarkMode ? '#666' : '#999' }
            ]}>测试数据库连接和操作</Text>
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
          onPress={toggleWorks}
        >
          <View style={styles.menuContent}>
            <Text style={[
              styles.menuText,
              { color: isDarkMode ? '#fff' : '#333' }
            ]}>我的作品</Text>
            <Text style={[
              styles.menuSubtext,
              { color: isDarkMode ? '#666' : '#999' }
            ]}>
              {showWorks ? '隐藏作品列表' : '查看我的作品'}
              {userWorks.length > 0 && ` (${userWorks.length})`}
            </Text>
          </View>
          <Text style={[
            styles.menuArrow,
            { color: isDarkMode ? '#666' : '#999' }
          ]}>
            {showWorks ? '▼' : '›'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 作品列表 */}
      {showWorks && (
        <View style={[
          styles.worksContainer,
          { backgroundColor: isDarkMode ? '#1a1a1a' : '#f8f9fa' }
        ]}>
          <View style={styles.worksHeader}>
            <Text style={[
              styles.worksTitle,
              { color: isDarkMode ? '#fff' : '#333' }
            ]}>我的作品</Text>
          </View>

          {worksLoading ? (
            <View style={styles.worksLoading}>
              <Text style={[
                styles.worksLoadingText,
                { color: isDarkMode ? '#666' : '#999' }
              ]}>加载中...</Text>
            </View>
          ) : worksError ? (
            <View style={styles.worksError}>
              <Text style={[
                styles.worksErrorText,
                { color: isDarkMode ? '#ff6b6b' : '#dc3545' }
              ]}>{worksError}</Text>
            </View>
          ) : userWorks.length === 0 ? (
            <View style={styles.worksEmpty}>
              <Text style={[
                styles.worksEmptyText,
                { color: isDarkMode ? '#666' : '#999' }
              ]}>暂无作品</Text>
            </View>
          ) : (
            <View style={styles.worksList}>
              {userWorks.map((work) => (
                <UserWorkItem
                  key={work._id}
                  work={work}
                  onPress={handleWorkPress}
                  onLike={handleWorkLike}
                  onDownload={handleWorkDownload}
                />
              ))}
            </View>
          )}
        </View>
      )}

      {/* 登录/登出按钮 */}
      {isLoggedIn ? (
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: '#dc3545' }]}
          onPress={handleLogout}
        >
          <Text style={styles.buttonText}>退出登录</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.loginButton, { backgroundColor: '#4A90E2' }]}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.buttonText}>去登录</Text>
        </TouchableOpacity>
      )}
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
  // 作品相关样式
  worksContainer: {
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 10,
    padding: 16,
  },
  worksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  worksTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  worksLoading: {
    padding: 32,
    alignItems: 'center',
  },
  worksLoadingText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  worksError: {
    padding: 16,
    alignItems: 'center',
  },
  worksErrorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  worksEmpty: {
    padding: 32,
    alignItems: 'center',
  },
  worksEmptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  worksList: {
    // 作品列表容器
  },
});

export default ProfileScreen; 