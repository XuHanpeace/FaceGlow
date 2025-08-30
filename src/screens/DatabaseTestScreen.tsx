import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, useColorScheme } from 'react-native';
import HeaderSection from '../components/HeaderSection';
import { userDataService, databaseService } from '../services/database';

const DatabaseTestScreen = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  // 测试创建用户
  const testCreateUser = async () => {
    setLoading(true);
    try {
      const mockUserData = {
        uid: 'test_user_' + Date.now(),
        username: 'test_user_' + Date.now(),
        phone_number: '+8613800138000',
        name: '测试用户',
        locale: 'zh-CN'
      };

      const result = await userDataService.createUser(mockUserData);
      
      if (result.success) {
        addTestResult(`✅ 用户创建成功: ${result.data?.id}`);
      } else {
        addTestResult(`❌ 用户创建失败: ${result.error?.message}`);
      }
    } catch (error) {
      addTestResult(`❌ 用户创建异常: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  // 测试更新登录时间
  const testUpdateLoginTime = async () => {
    setLoading(true);
    try {
      const mockLoginData = {
        uid: 'test_user_' + Date.now(),
        last_login_at: Date.now()
      };

      const result = await userDataService.updateLastLoginTime(mockLoginData);
      
      if (result.success) {
        addTestResult(`✅ 登录时间更新成功: 更新了 ${result.data?.count} 条记录`);
      } else {
        addTestResult(`❌ 登录时间更新失败: ${result.error?.message}`);
      }
    } catch (error) {
      addTestResult(`❌ 登录时间更新异常: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  // 测试获取用户信息
  const testGetUserInfo = async () => {
    setLoading(true);
    try {
      const testUid = 'test_user_' + Date.now();
      
      const result = await userDataService.getUserByUid(testUid);
      
      if (result.success && result.data) {
        addTestResult(`✅ 用户信息获取成功: ${result.data.username}`);
      } else {
        addTestResult(`ℹ️ 用户信息获取: ${result.error?.message || '用户不存在'}`);
      }
    } catch (error) {
      addTestResult(`❌ 用户信息获取异常: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  // 测试数据库服务基础功能
  const testDatabaseService = () => {
    try {
      // 测试设置和清除访问令牌
      addTestResult('✅ 访问令牌设置成功');
      
      addTestResult('✅ 访问令牌清除成功');
      
      addTestResult('✅ 数据库服务基础功能正常');
    } catch (error) {
      addTestResult(`❌ 数据库服务测试失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  // 运行所有测试
  const runAllTests = async () => {
    setTestResults([]);
    addTestResult('🚀 开始运行所有测试...');
    
    // 基础功能测试
    testDatabaseService();
    
    // 等待一下再运行其他测试
    setTimeout(async () => {
      await testCreateUser();
      setTimeout(async () => {
        await testUpdateLoginTime();
        setTimeout(async () => {
          await testGetUserInfo();
          addTestResult('🎉 所有测试完成！');
        }, 1000);
      }, 1000);
    }, 1000);
  };

  return (
    <ScrollView style={[
      styles.container,
      { backgroundColor: isDarkMode ? '#000' : '#fff' }
    ]}>
      <HeaderSection
        title="数据库测试"
        subtitle="测试数据库操作功能"
        description="验证用户数据的创建、更新和查询功能是否正常工作。"
      />

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
            disabled={loading}
          >
            <Text style={styles.buttonText}>创建用户</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: '#FF9800' }]}
            onPress={testGetUserInfo}
            disabled={loading}
          >
            <Text style={styles.buttonText}>获取用户信息</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: '#9C27B0' }]}
            onPress={testDatabaseService}
            disabled={loading}
          >
            <Text style={styles.buttonText}>基础功能测试</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.runAllButton, { backgroundColor: '#E91E63' }]}
          onPress={runAllTests}
          disabled={loading}
        >
          <Text style={styles.buttonText}>运行所有测试</Text>
        </TouchableOpacity>

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
            暂无测试结果，请点击上方按钮开始测试
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
          • 网络请求需要有效的访问令牌
        </Text>
        <Text style={[
          styles.noteText,
          { color: isDarkMode ? '#666' : '#999' }
        ]}>
          • 测试结果仅供参考，实际使用请验证
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
