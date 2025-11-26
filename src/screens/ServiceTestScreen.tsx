import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { authService } from '../services/auth/authService';
import { userDataService } from '../services/database/userDataService';
import { userWorkService } from '../services/database/userWorkService';
import { UserWorkModel } from '../types/model/user_works';
import BackButton from '../components/BackButton';

type ServiceTestScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface TestStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
  duration?: number;
}

const ServiceTestScreen: React.FC = () => {
  const navigation = useNavigation<ServiceTestScreenNavigationProp>();
  const [isRunning, setIsRunning] = useState(false);
  const [testSteps, setTestSteps] = useState<TestStep[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  const testStepsConfig: Omit<TestStep, 'status' | 'message' | 'duration'>[] = [
    { id: 'login', name: '手动登录' },
    { id: 'create_user', name: '获取用户信息' },
    { id: 'update_user', name: '更新用户信息' },
    { id: 'create_work', name: '创建用户作品' },
    { id: 'get_works', name: '获取用户作品列表' },
  ];

  const handleBackPress = () => {
    navigation.goBack();
  };

  const updateStepStatus = (stepId: string, status: TestStep['status'], message?: string, duration?: number) => {
    setTestSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, status, message, duration }
        : step
    ));
  };

  const runCreateUserTest = async () => {
    setIsRunning(true);
    setTestSteps([{ id: 'create_user_only', name: '创建用户单元测试', status: 'pending', message: '', duration: 0 }]);

    try {
      // 创建用户单元测试
      updateStepStatus('create_user_only', 'running');


      const loginRequest = {
        username: 'processdontkill',
        password: 'thebestinme'
      };
      console.log('[手动登录] 请求数据:', JSON.stringify(loginRequest, null, 2));


      const loginResult = await authService.loginWithPassword(loginRequest.username, loginRequest.password);

      if (loginResult.success && loginResult.data) {
        const createUserStartTime = Date.now();

        const createUserRequest = {
          uid: loginResult.data.uid,
          username: 'test_user_' + Date.now(),
          phone_number: '13800138000',
          name: '测试用户',
          gender: 'male',
          picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=face'
        };
      
        console.log('[创建用户单元测试] 请求数据:', JSON.stringify(createUserRequest, null, 2));
        const createUserResult = await userDataService.createUser(createUserRequest);
        const createUserDuration = Date.now() - createUserStartTime;
        console.log('[创建用户单元测试] 返回', createUserResult);

        if (createUserResult.success && createUserResult.data) {
          updateStepStatus('create_user_only', 'success', '用户创建成功', createUserDuration);
           // 测试完成
          Alert.alert(
            '创建用户测试完成',
            '用户创建单元测试已成功完成！',
            [{ text: '确定' }]
          );
          return;
        } 
      updateStepStatus('create_user_only', 'error', '创建用户测试失败');
         // 测试完成
        Alert.alert(
          '创建用户测试失败',
          '用户创建单元测试已失败！',
          [{ text: '确定' }]
        );
      }

     
    } catch (error: any) {
      updateStepStatus('create_user_only', 'error', error.message || '创建用户测试失败');
      Alert.alert(
        '测试失败',
        error.message || '创建用户测试失败',
        [{ text: '确定' }]
      );
    } finally {
      setIsRunning(false);
    }
  };

  const runCompleteTest = async () => {
    setIsRunning(true);
    setTestSteps(testStepsConfig.map(step => ({ ...step, status: 'pending' as const })));

    try {
      // 步骤1: 手动登录
      updateStepStatus('login', 'running');
      const loginStartTime = Date.now();
      
      const loginRequest = {
        username: 'processdontkill',
        password: 'thebestinme'
      };
      console.log('[手动登录] 请求数据:', JSON.stringify(loginRequest, null, 2));


      const loginResult = await authService.loginWithPassword(loginRequest.username, loginRequest.password);
      const loginDuration = Date.now() - loginStartTime;
      console.log('[手动登录] 返回', loginResult);

      if (loginResult.success && loginResult.data) {
        setCurrentUserId(loginResult.data.uid);
        updateStepStatus('login', 'success', `登录成功，用户ID: ${loginResult.data.uid}`, loginDuration);
      } else {
        Alert.alert('登录失败', loginResult.error?.message || '登录失败');
        return
      }

      // 步骤2: 获取用户信息（验证用户是否存在）
      updateStepStatus('create_user', 'running');
      const getUserStartTime = Date.now();

      const getUserRequest = {
        uid: loginResult.data.uid
      };
      console.log('[获取用户信息] 请求数据:', JSON.stringify(getUserRequest, null, 2));

      const getUserResult = await userDataService.getUserByUid(loginResult.data.uid);
      const getUserDuration = Date.now() - getUserStartTime;
      console.log('[获取用户信息] 返回', getUserResult);

             if (getUserResult.success && getUserResult.data) {
         // 检查数据结构，可能是直接返回数据或包装在record中
         const userData = (getUserResult.data as any).record || getUserResult.data;
         if (userData && userData.username) {
           updateStepStatus('create_user', 'success', `用户信息获取成功: ${userData.name || userData.username}`, getUserDuration);
         } else {
           updateStepStatus('create_user', 'error', '用户不存在', getUserDuration);
           Alert.alert('用户不存在', '用户不存在，请先创建用户');
           return;
         }
       } else {
         updateStepStatus('create_user', 'error', '用户不存在', getUserDuration);
         Alert.alert('用户不存在', '用户不存在，请先创建用户');
         return;
       }

      // 步骤3: 更新用户信息
      updateStepStatus('update_user', 'running');
      const updateUserStartTime = Date.now();

      // 更新用户的多项信息
      const updateUserRequest = {
        uid: loginResult.data.uid,
        username: 'processdontkill',
        name: 'processdontkill',
        selfie_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
        selfie_list: [
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
          'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
          'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face'
        ],
        work_list: [
          'work_' + Date.now() + '_001',
          'work_' + Date.now() + '_002',
          'work_' + Date.now() + '_003'
        ],
        balance: 250,
        picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=face'
      };
      console.log('[更新用户信息] 请求数据:', JSON.stringify(updateUserRequest, null, 2));

      // 使用新的updateUserData方法更新用户信息
      const updateUserResult = await userDataService.updateUserData(updateUserRequest);
      const updateUserDuration = Date.now() - updateUserStartTime;
      console.log('[更新用户信息] 返回', updateUserResult);

      if (updateUserResult.success && updateUserResult.data && updateUserResult.data.count > 0) {
        updateStepStatus('update_user', 'success', `用户信息更新成功: ${updateUserRequest.name}`, updateUserDuration);
      } else {
        Alert.alert('更新用户信息失败');
        return;
      }

      // 步骤4: 创建用户作品
      updateStepStatus('create_work', 'running');
      const createWorkStartTime = Date.now();

      // 使用createWork方法创建用户作品
      
      const createWorkRequest = {
        uid: loginResult.data.uid,
        activity_id: 'test_activity_001',
        activity_title: '测试活动',
        activity_description: '测试活动描述',
        activity_image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=600&h=400&fit=crop',
        album_id: 'test_album_001',
        is_public: '1',
        download_count: '0',
        likes: '0',
        result_data: [],
        ext_data: '{}',
        created_at: Date.now(),
        updated_at: Date.now()
      } as Omit<UserWorkModel, '_id'>;
      console.log('[创建用户作品] 请求数据:', JSON.stringify(createWorkRequest, null, 2));

      const createWorkResult = await userWorkService.createWork(createWorkRequest);
      const createWorkDuration = Date.now() - createWorkStartTime;
      console.log('[创建用户作品] 返回', createWorkResult);

     if (createWorkResult.success && createWorkResult.data && createWorkResult.data.id) {
      updateStepStatus('create_work', 'success', '用户作品创建成功', createWorkDuration);
     } else {
      console.log('[创建用户作品] 返回', createWorkResult);
      Alert.alert('创建用户作品失败');
      return;
     }

      // 步骤5: 获取用户作品列表
      updateStepStatus('get_works', 'running');
      const getWorksStartTime = Date.now();

      const getWorksRequest = {
        uid: loginResult.data.uid,
        is_public: '1',
        limit: 10,
        offset: 0
      };
      console.log('[获取用户作品列表] 请求数据:', JSON.stringify(getWorksRequest, null, 2));

      const getWorksResult = await userWorkService.getUserWorks(getWorksRequest);
      const getWorksDuration = Date.now() - getWorksStartTime;
      console.log('[获取用户作品列表] 返回', getWorksResult);

        if (getWorksResult.success && getWorksResult.data && getWorksResult.data.record && getWorksResult.data.record.likes) {
          updateStepStatus('get_works', 'success', `获取到 ${getWorksResult.data.record.likes} 个作品`, getWorksDuration);
       } else {
         console.log('[获取用户作品列表] 返回', getWorksResult);
         Alert.alert('获取用户作品失败');
         return;
       }

      // 测试完成
      Alert.alert(
        '测试完成',
        '所有Service单元测试已成功完成！请查看控制台日志了解详细信息。',
        [{ text: '确定' }]
      );

    } catch (error: any) {
      console.error('Service测试失败:', error);
      console.log('[测试失败] 返回', error);
      Alert.alert('测试失败', error.message || '测试过程中出现错误');
      return;
    } finally {
      setIsRunning(false);
    }
  };

  const resetTest = () => {
    setTestSteps([]);
    setCurrentUserId('');
  };

  const getStatusColor = (status: TestStep['status']) => {
    switch (status) {
      case 'pending': return '#666';
      case 'running': return '#FF6B35';
      case 'success': return '#4CAF50';
      case 'error': return '#F44336';
      default: return '#666';
    }
  };

  const getStatusIcon = (status: TestStep['status']) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'running': return '🔄';
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '⏳';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* 头部 */}
      <View style={styles.header}>
        <BackButton iconType="arrow" onPress={handleBackPress} absolute={false} />
        <Text style={styles.title}>Service单元测试</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 测试说明 */}
        <View style={styles.descriptionContainer}>
          <Text style={styles.description}>
            此测试将验证完整的数据库操作流程：
          </Text>
          <Text style={styles.description}>
            1. 手动登录 → 2. 创建/更新用户 → 3. 更新用户信息 → 4. 创建作品 → 5. 获取作品列表
          </Text>
          <Text style={styles.description}>
            所有请求和响应数据将打印到控制台，请确保开发者工具已打开。
          </Text>
        </View>

        {/* 测试步骤 */}
        <View style={styles.stepsContainer}>
          <Text style={styles.sectionTitle}>测试步骤</Text>
          {testSteps.map((step, index) => (
            <View key={step.id} style={styles.stepItem}>
              <View style={styles.stepHeader}>
                <Text style={styles.stepNumber}>{index + 1}</Text>
                <Text style={styles.stepName}>{step.name}</Text>
                <Text style={[styles.stepStatus, { color: getStatusColor(step.status) }]}>
                  {getStatusIcon(step.status)}
                </Text>
              </View>
              {step.message && (
                <Text style={styles.stepMessage}>{step.message}</Text>
              )}
              {step.duration && (
                <Text style={styles.stepDuration}>耗时: {step.duration}ms</Text>
              )}
            </View>
          ))}
        </View>

        {/* 当前用户信息 */}
        {currentUserId && (
          <View style={styles.userInfoContainer}>
            <Text style={styles.sectionTitle}>当前用户</Text>
            <Text style={styles.userInfo}>用户ID: {currentUserId}</Text>
          </View>
        )}
      </ScrollView>

      {/* 底部按钮 */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.testButton, isRunning && styles.testButtonDisabled]}
          onPress={runCompleteTest}
          disabled={isRunning}
        >
          {isRunning ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.loadingText}>测试中...</Text>
            </View>
          ) : (
            <Text style={styles.testButtonText}>开始完整测试</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.testButton, styles.createUserButton, isRunning && styles.testButtonDisabled]}
          onPress={runCreateUserTest}
          disabled={isRunning}
        >
          {isRunning ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.loadingText}>测试中...</Text>
            </View>
          ) : (
            <Text style={styles.testButtonText}>创建用户单元测试</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resetButton}
          onPress={resetTest}
          disabled={isRunning}
        >
          <Text style={styles.resetButtonText}>重置测试</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131313',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  descriptionContainer: {
    marginTop: 20,
    marginBottom: 30,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
  },
  description: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  stepsContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  stepItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepNumber: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 12,
    width: 24,
  },
  stepName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  stepStatus: {
    fontSize: 18,
  },
  stepMessage: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginBottom: 4,
  },
  stepDuration: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
  },
  userInfoContainer: {
    marginBottom: 30,
    padding: 16,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.3)',
  },
  userInfo: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '500',
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  testButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  createUserButton: {
    backgroundColor: '#4CAF50',
  },
  testButtonDisabled: {
    backgroundColor: '#666',
  },
  testButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resetButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  resetButtonText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

export default ServiceTestScreen;
