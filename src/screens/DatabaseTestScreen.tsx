import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, useColorScheme } from 'react-native';
import { userDataService, databaseService } from '../services/database';
import { userWorkService } from '../services/database/userWorkService';
import { useAuthState } from '../hooks/useAuthState';
import { authService } from '../services/auth';

const DatabaseTestScreen = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const { isLoggedIn, user } = useAuthState();
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [lastCreatedUserId, setLastCreatedUserId] = useState<string>('');

  useEffect(() => {
    if (isLoggedIn && user?.uid) {
      setCurrentUserId(user.uid);
      addTestResult(`🔐 当前登录用户: ${user.uid}`);
    }
  }, [isLoggedIn, user]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const clearResults = () => {
    setTestResults([]);
    if (isLoggedIn && user?.uid) {
      addTestResult(`🔐 当前登录用户: ${user.uid}`);
    }
  };

  // 检查用户登录状态
  const checkUserLogin = () => {
    if (!isLoggedIn || !user?.uid) {
      addTestResult(`❌ 用户未登录，请先登录`);
      return false;
    }
    addTestResult(`✅ 用户已登录，UID: ${user.uid}`);
    return true;
  };

  // 测试创建用户
  const testCreateUser = async () => {
    if (!checkUserLogin()) return;
    
    setLoading(true);
    try {
      const mockUserData = {
        uid: 'test_user_' + Date.now(),
        username: 'test_user_' + Date.now(),
        phone_number: '+8613800138000',
        name: '测试用户',
        picture: 'https://via.placeholder.com/100x100/4A90E2/FFFFFF?text=Avatar',
        gender: '男'
      };

      const result = await userDataService.createUser(mockUserData);

      if (result.success) {
        // 记录创建的测试用户uid，用于后续操作
        setLastCreatedUserId(mockUserData.uid);
        addTestResult(`✅ 用户创建成功: ${mockUserData.uid}`);
        addTestResult(`📝 用户名: ${mockUserData.username}, 昵称: ${mockUserData.name}`);
        addTestResult(`📱 手机号: ${mockUserData.phone_number}, 性别: ${mockUserData.gender}`);
        addTestResult(`🔑 测试用户UID已记录: ${mockUserData.uid}`);
      } else {
        addTestResult(`❌ 用户创建失败: ${result.error?.message}`);
      }
    } catch (error) {
      addTestResult(`❌ 用户创建异常: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  // 测试获取用户信息
  const testGetUserInfo = async () => {
    if (!checkUserLogin()) return;
    
    setLoading(true);
    try {
      // 优先使用刚创建的用户ID，如果没有则使用当前登录用户ID
      const testUid = lastCreatedUserId || currentUserId;
      const result = await userDataService.getUserByUid(testUid);
      
      if (result.success && result.data) {
        addTestResult(`✅ 用户信息获取成功: ${result.data.username}`);
        addTestResult(`📋 用户详情: ID=${result.data.uid}, 昵称=${result.data.name || '未设置'}`);
        addTestResult(`📱 手机号: ${result.data.phone_number || '未设置'}`);
        addTestResult(`👤 性别: ${result.data.gender || '未设置'}`);
        addTestResult(`🖼️ 头像: ${result.data.picture || '未设置'}`);
      } else {
        addTestResult(`ℹ️ 用户信息获取: ${result.error?.message || '用户不存在'}`);
      }
    } catch (error) {
      addTestResult(`❌ 用户信息获取异常: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  // 测试创建用户作品
  const testCreateUserWork = async () => {
    if (!checkUserLogin()) return;
    
    setLoading(true);
    try {
      // 优先使用刚创建的用户ID，如果没有则使用当前登录用户ID
      const testUid = lastCreatedUserId || currentUserId;
      const mockWorkData = {
        uid: testUid,
        template_id: 'test_template_' + Date.now(),
        original_image: 'https://via.placeholder.com/400x400/FF6B6B/FFFFFF?text=Original',
        result_image: 'https://via.placeholder.com/400x400/4ECDC4/FFFFFF?text=Result',
        likes: '0',
        is_public: 'true',
        download_count: '0'
      };

      const result = await userWorkService.createWork(mockWorkData);

      if (result.success) {
        addTestResult(`✅ 用户作品创建成功: ${result.data?.id}`);
        addTestResult(`🎨 作品信息: 模板=${mockWorkData.template_id}`);
        addTestResult(`🖼️ 原始图片: ${mockWorkData.original_image}`);
        addTestResult(`✨ 结果图片: ${mockWorkData.result_image}`);
        addTestResult(`👤 关联用户UID: ${testUid}`);
      } else {
        addTestResult(`❌ 用户作品创建失败: ${result.error?.message}`);
      }
    } catch (error) {
      addTestResult(`❌ 用户作品创建异常: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  // 测试获取用户作品
  const testGetUserWorks = async () => {
    if (!checkUserLogin()) return;
    
    setLoading(true);
    try {
      // 优先使用刚创建的用户ID，如果没有则使用当前登录用户ID
      const testUid = lastCreatedUserId || currentUserId;
      const result = await userWorkService.getUserWorks({
        uid: testUid,
        limit: 10
      });    
      if (result.success && result.data) {
        addTestResult(`✅ 用户作品获取成功: 共 ${result.data.length} 个作品`);
        addTestResult(`🔍 查询用户UID: ${testUid}`);
        
        if (result.data.length > 0) {
          result.data.forEach((work, index) => {
            addTestResult(`📸 作品${index + 1}: ID=${work._id}, 模板=${work.template_id}`);
            addTestResult(`  点赞: ${work.likes}, 下载: ${work.download_count}, 公开: ${work.is_public}`);
          });
        } else {
          addTestResult(`ℹ️ 该用户暂无作品`);
        }
      } else {
        addTestResult(`ℹ️ 用户作品获取: ${result.error?.message || '获取失败'}`);
      }
    } catch (error) {
      addTestResult(`❌ 用户作品获取异常: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  // 测试更新用户信息
  const testUpdateUserInfo = async () => {
    if (!checkUserLogin()) return;
    
    setLoading(true);
    try {
      // 优先使用刚创建的用户ID，如果没有则使用当前登录用户ID
      const testUid = lastCreatedUserId || currentUserId;
      const newUsername = 'updated_user_' + Date.now();
      const updateData = {
        username: newUsername,
        name: '更新后的昵称',
        updated_at: Date.now()
      };

      // 使用upsert方法更新用户信息
      const result = await userDataService.createUser({
        uid: testUid,
        username: newUsername,
        phone_number: '+8613800138000',
        name: '更新后的昵称',
        gender: '女',
        picture: 'https://via.placeholder.com/100x100/E91E63/FFFFFF?text=Updated'
      }); 
      if (result.success) {
        addTestResult(`✅ 用户信息更新成功`);
        addTestResult(`📝 新用户名: ${newUsername}`);
        addTestResult(`🕐 更新时间: ${new Date(updateData.updated_at).toLocaleString()}`);
        addTestResult(`👤 更新用户UID: ${testUid}`);
        
        // 验证更新结果
        setTimeout(async () => {
          const verifyResult = await userDataService.getUserByUid(testUid);
          if (verifyResult.success && verifyResult.data) {
            addTestResult(`✅ 验证更新结果: 用户名=${verifyResult.data.username}, 昵称=${verifyResult.data.name}`);
          }
        }, 1000);
      } else {
        addTestResult(`❌ 用户信息更新失败: ${result.error?.message}`);
      }
    } catch (error) {
      addTestResult(`❌ 用户信息更新异常: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  // 测试Token状态检查
  const testTokenStatus = async () => {
    if (!checkUserLogin()) return;
    
    setLoading(true);
    try {
      addTestResult(`🔍 开始检查Token状态...`);
      
      // 检查当前登录状态
      const isLoggedIn = authService.isLoggedIn();
      addTestResult(`📊 当前登录状态: ${isLoggedIn ? '✅ 已登录' : '❌ 未登录'}`);
      
      // 检查Token是否即将过期
      const isExpiringSoon = authService.isTokenExpiringSoon();
      addTestResult(`⏰ Token即将过期检查: ${isExpiringSoon ? '⚠️ 即将过期' : '✅ 未即将过期'}`);
      
      // 获取当前Token信息
      const currentToken = authService.getCurrentAccessToken();
      const currentUserId = authService.getCurrentUserId();
      
      if (currentToken && currentUserId) {
        addTestResult(`🔑 当前Token: ${currentToken.substring(0, 20)}...`);
        addTestResult(`👤 当前用户ID: ${currentUserId}`);
      } else {
        addTestResult(`❌ 无法获取Token或用户ID`);
      }
      
    } catch (error) {
      addTestResult(`❌ Token状态检查异常: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  // 测试手动刷新Token
  const testRefreshToken = async () => {
    if (!checkUserLogin()) return;
    
    setLoading(true);
    try {
      addTestResult(`🔄 开始手动刷新Token...`);
      
      const result = await authService.checkAndRefreshToken();
      
      if (result.success && result.data) {
        addTestResult(`✅ Token刷新成功!`);
        addTestResult(`🔑 新Token: ${result.data.accessToken.substring(0, 20)}...`);
        addTestResult(`⏰ 过期时间: ${new Date(result.data.expiresAt).toLocaleString()}`);
        addTestResult(`📊 剩余时间: ${Math.round(result.data.expiresIn / 60)}分钟`);
        addTestResult(`👤 用户ID: ${result.data.uid}`);
      } else {
        addTestResult(`❌ Token刷新失败: ${result.error?.message}`);
      }
      
    } catch (error) {
      addTestResult(`❌ Token刷新异常: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  // 测试自动刷新Token
  const testAutoRefreshToken = async () => {
    if (!checkUserLogin()) return;
    
    setLoading(true);
    try {
      addTestResult(`🤖 开始自动刷新Token检查...`);
      
      const result = await authService.autoRefreshTokenIfNeeded();
      
      if (result) {
        addTestResult(`✅ 自动刷新检查完成: Token状态正常`);
      } else {
        addTestResult(`❌ 自动刷新检查失败: Token需要手动处理`);
      }
      
    } catch (error) {
      addTestResult(`❌ 自动刷新检查异常: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  // 测试修复后的Refresh Token实现
  const testFixedRefreshToken = async () => {
    if (!checkUserLogin()) return;
    
    setLoading(true);
    try {
      addTestResult(`🔧 测试修复后的Refresh Token实现...`);
      addTestResult(`📡 API端点: /auth/v1/token`);
      addTestResult(`🔑 包含参数: client_id, grant_type, refresh_token`);
      addTestResult(`📱 包含请求头: x-device-id`);
      
      const result = await authService.checkAndRefreshToken();
      
      if (result.success && result.data) {
        addTestResult(`✅ 修复后的Refresh Token测试成功!`);
        addTestResult(`🔑 新Token: ${result.data.accessToken.substring(0, 20)}...`);
        addTestResult(`⏰ 过期时间: ${new Date(result.data.expiresAt).toLocaleString()}`);
        addTestResult(`📊 剩余时间: ${Math.round(result.data.expiresIn / 60)}分钟`);
        addTestResult(`👤 用户ID: ${result.data.uid}`);
        addTestResult(`🎉 符合CloudBase官方规范!`);
      } else {
        addTestResult(`❌ 修复后的Refresh Token测试失败: ${result.error?.message}`);
      }
      
    } catch (error) {
      addTestResult(`❌ 修复后的Refresh Token测试异常: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[
      styles.container,
      { backgroundColor: isDarkMode ? '#131313' : '#fff' }
    ]}>

      {/* 用户状态显示 */}
      {!isLoggedIn ? (
        <View style={[
          styles.warningContainer,
          { backgroundColor: isDarkMode ? '#2d1b1b' : '#fff3cd' }
        ]}>
          <Text style={[
            styles.warningText,
            { color: isDarkMode ? '#ff6b6b' : '#856404' }
          ]}>
            ⚠️ 请先登录后再进行数据库测试
          </Text>
        </View>
      ) : (
        <View style={[
          styles.userInfoContainer,
          { backgroundColor: isDarkMode ? '#1a2d1a' : '#d4edda' }
        ]}>
          <Text style={[
            styles.userInfoText,
            { color: isDarkMode ? '#4caf50' : '#155724' }
          ]}>
            ✅ 已登录用户: {user?.uid}
          </Text>
          {lastCreatedUserId && (
            <Text style={[
              styles.userInfoText,
              { color: isDarkMode ? '#4caf50' : '#155724', marginTop: 5 }
            ]}>
              🆕 测试用户: {lastCreatedUserId}
            </Text>
          )}
        </View>
      )}

      {/* 测试按钮区域 */}
      <View style={[
        styles.testContainer,
        { backgroundColor: isDarkMode ? '#1a1a1a' : '#f8f9fa' }
      ]}>
        <Text style={[
          styles.sectionTitle,
          { color: isDarkMode ? '#fff' : '#333' }
        ]}>
          测试功能
        </Text>

        <View style={styles.buttonGrid}>
          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: '#4CAF50' }]}
            onPress={testCreateUser}
            disabled={loading || !isLoggedIn}
          >
            <Text style={styles.buttonText}>创建用户</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: '#FF9800' }]}
            onPress={testGetUserInfo}
            disabled={loading || !isLoggedIn}
          >
            <Text style={styles.buttonText}>获取用户信息</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: '#2196F3' }]}
            onPress={testCreateUserWork}
            disabled={loading || !isLoggedIn}
          >
            <Text style={styles.buttonText}>创建用户作品</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: '#9C27B0' }]}
            onPress={testGetUserWorks}
            disabled={loading || !isLoggedIn}
          >
            <Text style={styles.buttonText}>获取用户作品</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: '#607D8B' }]}
            onPress={testUpdateUserInfo}
            disabled={loading || !isLoggedIn}
          >
            <Text style={styles.buttonText}>更新用户信息</Text>
          </TouchableOpacity>
        </View>

        <Text style={[
          styles.sectionTitle,
          { color: isDarkMode ? '#fff' : '#333', marginTop: 20 }
        ]}>
          Token管理测试
        </Text>

        <View style={styles.buttonGrid}>
          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: '#E91E63' }]}
            onPress={testTokenStatus}
            disabled={loading || !isLoggedIn}
          >
            <Text style={styles.buttonText}>检查Token状态</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: '#FF5722' }]}
            onPress={testRefreshToken}
            disabled={loading || !isLoggedIn}
          >
            <Text style={styles.buttonText}>手动刷新Token</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: '#795548' }]}
            onPress={testAutoRefreshToken}
            disabled={loading || !isLoggedIn}
          >
            <Text style={styles.buttonText}>自动刷新检查</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: '#9C27B0' }]}
            onPress={testFixedRefreshToken}
            disabled={loading || !isLoggedIn}
          >
            <Text style={styles.buttonText}>测试修复后的Refresh Token</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.clearButton, { backgroundColor: '#607D8B' }]}
          onPress={clearResults}
        >
          <Text style={styles.buttonText}>清除结果</Text>
        </TouchableOpacity>
      </View>

      {/* 测试结果显示 */}
      <View style={[
        styles.resultsContainer,
        { backgroundColor: isDarkMode ? '#1a1a1a' : '#f8f9fa' }
      ]}>
        <Text style={[
          styles.sectionTitle,
          { color: isDarkMode ? '#fff' : '#333' }
        ]}>
          测试结果 ({testResults.length})
        </Text>

        {testResults.length === 0 ? (
          <Text style={[
            styles.noResults,
            { color: isDarkMode ? '#666' : '#999' }
          ]}>
            {isLoggedIn ? '暂无测试结果，请点击上方按钮开始测试' : '请先登录后再进行测试'}
          </Text>
        ) : (
          <View style={styles.resultsList}>
            {testResults.map((result, index) => (
              <Text
                key={index}
                style={[
                  styles.resultItem,
                  { color: isDarkMode ? '#fff' : '#333' }
                ]}
              >
                {result}
              </Text>
            ))}
          </View>
        )}
      </View>

      {/* 注意事项 */}
      <View style={[
        styles.noteContainer,
        { backgroundColor: isDarkMode ? '#1a1a1a' : '#f8f9fa' }
      ]}>
        <Text style={[
          styles.sectionTitle,
          { color: isDarkMode ? '#fff' : '#333' }
        ]}>
          注意事项
        </Text>
        <Text style={[
          styles.noteText,
          { color: isDarkMode ? '#666' : '#999' }
        ]}>
          • 这是模拟测试，使用模拟数据
        </Text>
        <Text style={[
          styles.noteText,
          { color: isDarkMode ? '#666' : '#999' }
        ]}>
          • 确保 CloudBase 配置正确
        </Text>
        <Text style={[
          styles.noteText,
          { color: isDarkMode ? '#666' : '#999' }
        ]}>
          • 必须先登录才能进行测试
        </Text>
        <Text style={[
          styles.noteText,
          { color: isDarkMode ? '#666' : '#999' }
        ]}>
          • 测试将使用当前登录用户的access token
        </Text>
        <Text style={[
          styles.noteText,
          { color: isDarkMode ? '#666' : '#999' }
        ]}>
          • 建议按顺序测试：创建用户 → 获取用户信息 → 创建作品 → 获取作品 → 更新用户信息
        </Text>
        <Text style={[
          styles.noteText,
          { color: isDarkMode ? '#666' : '#999' }
        ]}>
          • 创建测试用户后，后续操作将优先使用测试用户UID
        </Text>
        <Text style={[
          styles.noteText,
          { color: isDarkMode ? '#666' : '#999' }
        ]}>
          • Token管理测试会检查当前Token状态和过期时间
        </Text>
        <Text style={[
          styles.noteText,
          { color: isDarkMode ? '#666' : '#999' }
        ]}>
          • 手动刷新Token会调用CloudBase的refresh API
        </Text>
        <Text style={[
          styles.noteText,
          { color: isDarkMode ? '#666' : '#999' }
        ]}>
          • 自动刷新检查会在Token即将过期时自动刷新
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  warningContainer: {
    margin: 15,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  warningText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  userInfoContainer: {
    margin: 15,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  userInfoText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  testContainer: {
    margin: 15,
    padding: 15,
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  testButton: {
    width: '48%',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  runAllButton: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  clearButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  resultsContainer: {
    margin: 15,
    padding: 15,
    borderRadius: 10,
  },
  noResults: {
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 20,
  },
  resultsList: {
    maxHeight: 300,
  },
  resultItem: {
    fontSize: 12,
    paddingVertical: 2,
    fontFamily: 'monospace',
  },
  noteContainer: {
    margin: 15,
    padding: 15,
    borderRadius: 10,
    marginBottom: 30,
  },
  noteText: {
    fontSize: 12,
    marginBottom: 5,
    lineHeight: 18,
  },
});

export default DatabaseTestScreen;
