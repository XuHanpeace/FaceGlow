import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, FlatList, ListRenderItem, useColorScheme, TouchableOpacity, Text, Alert } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import AIToolsetSection from '../components/AIToolsetSection';
import RecommendationSection from '../components/RecommendationSection';
import { RecommendationSectionRef } from '../components/RecommendationSection';
import BlurBackground from '../components/BlurBackground';
import { useAuthState } from '../hooks/useAuthState';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

type Props = {
  navigation: HomeScreenNavigationProp;
};

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const [sections] = React.useState(['AI工具集', '推荐']);
  const { isLoggedIn, user, logout, isLoading } = useAuthState();
  const recommendationRef = useRef<RecommendationSectionRef>(null);
  const isDarkMode = useColorScheme() === 'dark';

  const loadMoreSections = () => {
    recommendationRef.current?.fetchData();
  };

  const handleTestLogin = () => {
    navigation.navigate('Login');
  };

  const handleLogout = async () => {
    try {
      await logout();
      Alert.alert('成功', '已登出');
    } catch (error) {
      Alert.alert('错误', '登出失败');
    }
  };

  const renderSection: ListRenderItem<string> = ({ item }) => {
    if (item === 'AI工具集') {
      return <AIToolsetSection />;
    } else if (item === '推荐') {
      return <RecommendationSection ref={recommendationRef} />;
    }
    return null;
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#000' : '#fff' }]}>
      <BlurBackground />
      
      {/* 认证状态显示 */}
      <View style={styles.authStatusContainer}>
        <View style={styles.authInfo}>
          <Text style={styles.authStatusText}>
            认证状态: {isLoading ? '检查中...' : (isLoggedIn ? '已登录' : '未登录')}
          </Text>
          {isLoggedIn && user && (
            <Text style={styles.userInfoText}>
              用户ID: {user.uid}
            </Text>
          )}
        </View>
        
        <View style={styles.authButtons}>
          {!isLoggedIn ? (
            <TouchableOpacity style={styles.loginButton} onPress={handleTestLogin}>
              <Text style={styles.buttonText}>测试登录</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.buttonText}>登出</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={sections}
        renderItem={renderSection}
        keyExtractor={(item, index) => item + index}
        onEndReached={loadMoreSections}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  authStatusContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  authInfo: {
    flex: 1,
  },
  authStatusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  userInfoText: {
    fontSize: 14,
    color: '#666',
  },
  authButtons: {
    marginLeft: 16,
  },
  loginButton: {
    backgroundColor: '#2196f3',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  logoutButton: {
    backgroundColor: '#f44336',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default HomeScreen;
