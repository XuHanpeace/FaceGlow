import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

type TestCenterScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface TestItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: keyof RootStackParamList;
  color: string;
}

const testItems: TestItem[] = [
  {
    id: 'cos',
    title: 'COS 功能测试',
    description: '测试腾讯云对象存储功能',
    icon: '☁️',
    route: 'COSUploadTest',
    color: '#4A90E2',
  },
  {
    id: 'database',
    title: '云数据库测试',
    description: '测试云数据库增删改查功能',
    icon: '🗄️',
    route: 'DatabaseTest',
    color: '#7ED321',
  },
  {
    id: 'auth',
    title: '认证功能测试',
    description: '测试用户登录注册功能',
    icon: '🔐',
    route: 'Login',
    color: '#F5A623',
  },
  {
    id: 'newAuth',
    title: '新登录注册页面',
    description: '测试新的手机号验证码登录注册流程',
    icon: '📱',
    route: 'NewAuth',
    color: '#FF6B6B',
  },
  {
    id: 'subscription',
    title: '苹果订阅支付',
    description: '测试苹果支付订阅功能',
    icon: '🍎',
    route: 'Subscription',
    color: '#007AFF',
  },
  {
    id: 'serviceTest',
    title: 'Service单元测试',
    description: '测试数据库操作完整流程',
    icon: '🧪',
    route: 'ServiceTest',
    color: '#FF6B35',
  },
  {
    id: 'navigation',
    title: '导航功能测试',
    description: '测试页面导航和路由功能',
    icon: '🧭',
    route: 'Detail',
    color: '#9013FE',
  },
  {
    id: 'ui',
    title: 'UI 组件测试',
    description: '测试各种UI组件和样式',
    icon: '🎨',
    route: 'Settings',
    color: '#FF6B9D',
  },
  {
    id: 'api',
    title: 'API 接口测试',
    description: '测试网络请求和API调用',
    icon: '🌐',
    route: 'NewHome',
    color: '#50E3C2',
  },
];

const TestCenterScreen: React.FC = () => {
  const navigation = useNavigation<TestCenterScreenNavigationProp>();

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleTestPress = (item: TestItem) => {
    if (item.route === 'Detail') {
      navigation.navigate('Detail', {
        id: 'test',
        title: item.title,
        content: item.description,
      });
    } else {
      navigation.navigate(item.route as any);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>测试中心</Text>
        <View style={styles.placeholder} />
      </View>

      {/* 内容区域 */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.descriptionContainer}>
          <Text style={styles.description}>
            这里是开发测试中心，包含各种功能的测试入口。点击任意测试项进入对应的测试页面。
          </Text>
        </View>

        <View style={styles.testGrid}>
          {testItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.testCard, { borderLeftColor: item.color }]}
              onPress={() => handleTestPress(item)}
            >
              <View style={styles.testCardHeader}>
                <Text style={styles.testIcon}>{item.icon}</Text>
                <View style={styles.testInfo}>
                  <Text style={styles.testTitle}>{item.title}</Text>
                  <Text style={styles.testDescription}>{item.description}</Text>
                </View>
              </View>
              <View style={styles.testCardFooter}>
                <Text style={styles.testAction}>点击测试 →</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* 未来扩展区域 */}
        <View style={styles.futureSection}>
          <Text style={styles.futureTitle}>未来扩展</Text>
          <Text style={styles.futureDescription}>
            这里可以添加更多测试功能，如：
          </Text>
          <View style={styles.futureList}>
            <Text style={styles.futureItem}>• 性能测试</Text>
            <Text style={styles.futureItem}>• 兼容性测试</Text>
            <Text style={styles.futureItem}>• 安全测试</Text>
            <Text style={styles.futureItem}>• 自动化测试</Text>
            <Text style={styles.futureItem}>• 压力测试</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
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
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  testGrid: {
    gap: 16,
  },
  testCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
  },
  testCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  testIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  testInfo: {
    flex: 1,
  },
  testTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  testDescription: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
  testCardFooter: {
    alignItems: 'flex-end',
  },
  testAction: {
    color: '#4A90E2',
    fontSize: 14,
    fontWeight: '600',
  },
  futureSection: {
    marginTop: 40,
    marginBottom: 40,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
  },
  futureTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  futureDescription: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginBottom: 16,
  },
  futureList: {
    gap: 8,
  },
  futureItem: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
  },
});

export default TestCenterScreen;
