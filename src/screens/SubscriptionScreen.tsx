import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Dimensions,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { NativeModules } from 'react-native';

const { ApplePayModule } = NativeModules;

type SubscriptionScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface SubscriptionPlan {
  id: string;
  title: string;
  price: string;
  originalPrice?: string;
  period: string;
  description: string;
  isPopular?: boolean;
  isBestValue?: boolean;
  savePercent?: string;
  weeklyPrice?: string;
  productId: string;
}

const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'weekly',
    title: 'Weekly',
    price: 'HK$58',
    period: 'week',
    description: '体验AI头像创作',
    productId: 'com.faceglow.weekly',
  },
  {
    id: 'yearly',
    title: 'Yearly',
    price: 'HK$288',
    originalPrice: 'HK$3016',
    period: 'year',
    description: '最优惠的选择',
    isBestValue: true,
    savePercent: '90%',
    weeklyPrice: 'HK$5.52',
    productId: 'com.faceglow.yearly',
  },
];

const SubscriptionScreen: React.FC = () => {
  const navigation = useNavigation<SubscriptionScreenNavigationProp>();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);

  useEffect(() => {
    // 初始化时获取可用产品
    fetchAvailableProducts();
  }, []);

  const fetchAvailableProducts = async () => {
    try {
      const products = await ApplePayModule.getAvailableProducts([
        'com.faceglow.weekly',
        'com.faceglow.monthly',
        'com.faceglow.yearly',
      ]);
      setAvailableProducts(products);
      console.log('可用产品:', products);
    } catch (error) {
      console.error('获取产品失败:', error);
    }
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handlePlanSelect = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
  };

  const handleSubscribe = async () => {
    if (!selectedPlan) {
      Alert.alert('请选择订阅方案');
      return;
    }

    try {
      setIsLoading(true);
      
      // 调用原生支付模块
      const result = await ApplePayModule.purchaseProduct(selectedPlan.productId);
      
      if (result.success) {
        Alert.alert(
          '订阅成功',
          `恭喜您成功订阅${selectedPlan.title}！`,
          [
            {
              text: '确定',
              onPress: () => navigation.navigate('NewHome'),
            },
          ]
        );
      } else {
        Alert.alert('订阅失败', result.error || '支付失败，请重试');
      }
    } catch (error: any) {
      Alert.alert('订阅失败', error.message || '支付过程中出现错误');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestorePurchases = async () => {
    try {
      setIsLoading(true);
      const result = await ApplePayModule.restorePurchases();
      
      if (result.success) {
        Alert.alert('恢复成功', '已恢复您的购买记录');
      } else {
        Alert.alert('恢复失败', result.error || '没有找到可恢复的购买记录');
      }
    } catch (error: any) {
      Alert.alert('恢复失败', error.message || '恢复购买时出现错误');
    } finally {
      setIsLoading(false);
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
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 介绍区域 */}
        <View style={styles.introSection}>
          <Text style={styles.introTitle}>Join Glam Pro</Text>
        </View>

        {/* 功能列表 */}
        <View style={styles.featuresSection}>
          <Text style={styles.featureText}>• Priority access to all AI features</Text>
          <Text style={styles.featureText}>• Advanced editing tools</Text>
          <Text style={styles.featureText}>• Unlock 400+ AI styles</Text>
          <Text style={styles.featureText}>• New filters every day</Text>
          <Text style={styles.featureText}>• High resolution</Text>
          <Text style={styles.featureText}>• No watermarks</Text>
          <Text style={styles.featureText}>• 100 PRO photos daily</Text>
          <Text style={styles.featureText}>• 3000 bonus coins for videos</Text>
        </View>

        {/* 订阅方案 */}
        <View style={styles.plansContainer}>
          {subscriptionPlans.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planCard,
                selectedPlan?.id === plan.id && styles.planCardSelected,
                plan.isBestValue && styles.planCardBestValue,
              ]}
              onPress={() => handlePlanSelect(plan)}
            >
              {plan.savePercent && (
                <View style={styles.saveBadge}>
                  <Text style={styles.saveText}>节省{plan.savePercent}</Text>
                </View>
              )}
              
              <View style={styles.planHeader}>
                <Text style={styles.planTitle}>{plan.title}</Text>
                <View style={styles.priceContainer}>
                  <Text style={styles.price}>{plan.price}</Text>
                  <Text style={styles.period}> / {plan.period}</Text>
                  {plan.weeklyPrice && (
                    <Text style={styles.weeklyPrice}>{plan.weeklyPrice} / week</Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* 其他链接 */}
        <View style={styles.linksSection}>
          <TouchableOpacity style={styles.linkButton}>
            <Text style={styles.linkText}>See all plans</Text>
          </TouchableOpacity>
          <View style={styles.legalLinks}>
            <TouchableOpacity style={styles.legalLink}>
              <Text style={styles.legalLinkText}>条款</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.legalLink}>
              <Text style={styles.legalLinkText}>隐私</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.legalLink} onPress={handleRestorePurchases}>
              <Text style={styles.legalLinkText}>恢复</Text>
            </TouchableOpacity>
          </View>
        </View>


      </ScrollView>

      {/* 底部按钮 */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[
            styles.subscribeButton,
            (!selectedPlan || isLoading) && styles.subscribeButtonDisabled,
          ]}
          onPress={handleSubscribe}
          disabled={!selectedPlan || isLoading}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.loadingText}>处理中...</Text>
            </View>
          ) : (
            <Text style={styles.subscribeButtonText}>
              Continue
            </Text>
          )}
        </TouchableOpacity>
      </View>
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
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  introSection: {
    marginTop: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  introTitle: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  featuresSection: {
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  featureText: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
    lineHeight: 22,
  },
  plansContainer: {
    gap: 16,
    marginBottom: 30,
  },
  planCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  planCardSelected: {
    borderColor: '#FF6B35',
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
  },
  planCardBestValue: {
    borderColor: '#FF6B35',
  },
  saveBadge: {
    position: 'absolute',
    top: -10,
    left: 20,
    backgroundColor: '#FF6B35',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  saveText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  planHeader: {
    marginBottom: 12,
  },
  planTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    color: '#FF6B6B',
    fontSize: 24,
    fontWeight: 'bold',
  },
  period: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    marginLeft: 4,
  },
  originalPrice: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    textDecorationLine: 'line-through',
    marginLeft: 8,
  },
  planDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginBottom: 16,
  },
  planFeatures: {
    gap: 8,
  },
  featureText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
  },
  termsSection: {
    marginBottom: 30,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
  },
  termsTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  termsText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 8,
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  subscribeButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  subscribeButtonDisabled: {
    backgroundColor: '#666',
  },
  subscribeButtonText: {
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
  restoreButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  restoreButtonText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

export default SubscriptionScreen;
