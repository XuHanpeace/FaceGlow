import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import SubscriptionTester, { SubscriptionTestResult } from '../utils/subscriptionTest';
import SubscriptionTesterSimulator from '../utils/subscriptionTestSimulator';
import { Platform } from 'react-native';
import BackButton from '../components/BackButton';

type SubscriptionTestScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const SubscriptionTestScreen: React.FC = () => {
  const navigation = useNavigation<SubscriptionTestScreenNavigationProp>();
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<SubscriptionTestResult[]>([]);

  const handleBackPress = () => {
    navigation.goBack();
  };

  // 检查是否在模拟器环境
  const isSimulator = Platform.OS === 'ios' && __DEV__;

  const runTest = async (testFunction: () => Promise<SubscriptionTestResult>) => {
    setIsLoading(true);
    try {
      const result = await testFunction();
      setTestResults(prev => [...prev, result]);
      
      Alert.alert(
        result.success ? '✅ 测试成功' : '❌ 测试失败',
        result.message,
        [{ text: '确定' }]
      );
    } catch (error: any) {
      Alert.alert('❌ 测试异常', error.message || '测试过程中出现未知错误');
    } finally {
      setIsLoading(false);
    }
  };

  const runFullTest = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    try {
      const results = isSimulator 
        ? await SubscriptionTesterSimulator.runFullTest()
        : await SubscriptionTester.runFullTest();
      setTestResults(results);
      
      const successCount = results.filter(r => r.success).length;
      const totalCount = results.length;
      
      Alert.alert(
        '📊 测试完成',
        `成功: ${successCount}/${totalCount} 项测试通过${isSimulator ? ' (模拟器模式)' : ''}`,
        [{ text: '确定' }]
      );
    } catch (error: any) {
      Alert.alert('❌ 测试异常', error.message || '测试过程中出现未知错误');
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const renderTestResult = (result: SubscriptionTestResult, index: number) => (
    <View key={index} style={styles.resultItem}>
      <View style={styles.resultHeader}>
        <Text style={styles.resultIcon}>{result.success ? '✅' : '❌'}</Text>
        <Text style={styles.resultMessage}>{result.message}</Text>
      </View>
      {result.error && (
        <Text style={styles.errorText}>错误: {result.error}</Text>
      )}
      {result.data && (
        <Text style={styles.dataText}>
          数据: {JSON.stringify(result.data, null, 2)}
        </Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* 头部 */}
      <View style={styles.header}>
        <BackButton iconType="arrow" onPress={handleBackPress} absolute={false} />
        <Text style={styles.title}>订阅功能测试</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 环境提示 */}
        {isSimulator && (
          <View style={styles.environmentNotice}>
            <Text style={styles.environmentNoticeText}>
              📱 当前运行在iOS模拟器中，使用模拟数据进行测试
            </Text>
            <Text style={styles.environmentNoticeSubText}>
              真实的应用内购买功能需要在真机上测试
            </Text>
          </View>
        )}
        
        {/* 环境检查 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔍 环境检查</Text>
          <TouchableOpacity
            style={styles.testButton}
            onPress={() => runTest(() => Promise.resolve(
              isSimulator 
                ? SubscriptionTesterSimulator.checkSimulatorEnvironment()
                : SubscriptionTester.checkSandboxEnvironment()
            ))}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isSimulator ? '检查模拟器环境' : '检查沙盒环境'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 基础功能测试 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧪 基础功能测试</Text>
          
          <TouchableOpacity
            style={styles.testButton}
            onPress={() => runTest(() => 
              isSimulator 
                ? SubscriptionTesterSimulator.testGetProducts()
                : SubscriptionTester.testGetProducts()
            )}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>获取产品信息</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.testButton}
            onPress={() => runTest(() => 
              isSimulator 
                ? SubscriptionTesterSimulator.testSubscriptionStatus()
                : SubscriptionTester.testSubscriptionStatus()
            )}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>检查订阅状态</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.testButton}
            onPress={() => runTest(() => 
              isSimulator 
                ? SubscriptionTesterSimulator.testRestorePurchases()
                : SubscriptionTester.testRestorePurchases()
            )}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>恢复购买</Text>
          </TouchableOpacity>
        </View>

        {/* 购买测试 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💳 购买测试</Text>
          
          <TouchableOpacity
            style={styles.testButton}
            onPress={() => runTest(() => 
              isSimulator 
                ? SubscriptionTesterSimulator.testPurchaseProduct('com.faceglow.weekly')
                : SubscriptionTester.testPurchaseProduct('com.faceglow.weekly')
            )}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>测试周付购买</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.testButton}
            onPress={() => runTest(() => 
              isSimulator 
                ? SubscriptionTesterSimulator.testPurchaseProduct('com.faceglow.yearly')
                : SubscriptionTester.testPurchaseProduct('com.faceglow.yearly')
            )}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>测试年付购买</Text>
          </TouchableOpacity>
        </View>

        {/* 完整测试 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚀 完整测试</Text>
          
          <TouchableOpacity
            style={[styles.testButton, styles.fullTestButton]}
            onPress={runFullTest}
            disabled={isLoading}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.buttonText}>测试中...</Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>运行完整测试套件</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.testButton, styles.clearButton]}
            onPress={clearResults}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>清除结果</Text>
          </TouchableOpacity>
        </View>

        {/* 测试结果 */}
        {testResults.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 测试结果</Text>
            {testResults.map(renderTestResult)}
          </View>
        )}

        {/* 使用说明 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📖 使用说明</Text>
          <Text style={styles.instructionText}>
            1. 确保在沙盒环境中测试{'\n'}
            2. 使用沙盒测试账户登录{'\n'}
            3. 产品ID需要在App Store Connect中配置{'\n'}
            4. 测试购买会使用沙盒环境，不会产生真实费用
          </Text>
        </View>
      </ScrollView>
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
  section: {
    marginTop: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  testButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  fullTestButton: {
    backgroundColor: '#007AFF',
  },
  clearButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  resultItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  resultMessage: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    marginBottom: 8,
  },
  dataText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  instructionText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    lineHeight: 20,
  },
  environmentNotice: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderColor: '#FFC107',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  environmentNoticeText: {
    color: '#FFC107',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  environmentNoticeSubText: {
    color: 'rgba(255, 193, 7, 0.8)',
    fontSize: 14,
  },
});

export default SubscriptionTestScreen;
