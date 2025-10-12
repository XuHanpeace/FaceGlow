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
import { subscriptionManager } from '../services/subscriptionManager';
import { subscriptionDataService } from '../services/subscriptionDataService';
import { useAuthState } from '../hooks/useAuthState';
import { subscriptionPlans, subscriptionConfig, SubscriptionPlan } from '../config/subscriptionConfig';

const { ApplePayModule } = NativeModules;

type SubscriptionScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// 错误消息处理函数
const getSubscriptionErrorMessage = (errorCode: string, errorMessage: string): string => {
  switch (errorCode) {
    case 'purchase_cancelled':
      return '您取消了订阅，如需订阅请重新选择套餐';
    case 'payment_not_allowed':
      return '设备不允许进行支付，请检查设备设置';
    case 'payment_invalid':
      return '支付信息无效，请重试';
    case 'client_invalid':
      return '客户端无效，请重新启动应用';
    case 'product_not_available':
      return '产品暂不可用，请稍后再试';
    case 'network_connection_failed':
      return '网络连接失败，请检查网络设置';
    case 'cloud_service_denied':
      return '云服务权限被拒绝，请检查设置';
    case 'cloud_service_revoked':
      return '云服务被撤销，请联系客服';
    default:
      return errorMessage || '订阅失败，请重试';
  }
};


const SubscriptionScreen: React.FC = () => {
  const navigation = useNavigation<SubscriptionScreenNavigationProp>();
  const { user } = useAuthState();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
  useEffect(() => {
    // 初始化时获取可用产品
    fetchAvailableProducts();
    loadAvailablePlans();
  }, []);

  const loadAvailablePlans = async () => {
    try {
      const plans = await subscriptionManager.getAvailableSubscriptionPlans();
      // 将manager的plan转换为本地plan格式
      const localPlans = subscriptionPlans.map(plan => {
        const managerPlan = plans.find(p => p.id === plan.id);
        return {
          ...plan,
          canPurchase: managerPlan?.canPurchase ?? true,
          isActive: managerPlan?.isActive ?? false,
        };
      });
      setAvailablePlans(localPlans);
    } catch (error) {
      console.error('加载订阅计划失败:', error);
      // 使用默认计划
      setAvailablePlans(subscriptionPlans.map(plan => ({ ...plan, canPurchase: true, isActive: false })));
    }
  };

  const fetchAvailableProducts = async () => {
    try {
      const products = await ApplePayModule.getAvailableProducts([
        'com.digitech.faceglow.subscribe.monthly',
        'com.digitech.faceglow.subscribe.yearly',
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

    // 检查是否允许购买
    const canPurchase = await subscriptionManager.canPurchaseProduct(selectedPlan.productId);
    if (!canPurchase.canPurchase) {
      Alert.alert('无法购买', canPurchase.reason || '您已有有效订阅');
      return;
    }

    try {
      setIsLoading(true);
      
      // 调用原生支付模块
      const result = await ApplePayModule.purchaseProduct(selectedPlan.productId);
      
      if (result.success) {
        // 更新用户数据库中的订阅信息
        if (user?.uid) {
          const subscriptionType = subscriptionDataService.parseSubscriptionType(selectedPlan.productId);
          if (subscriptionType) {
            const expirationDate = subscriptionDataService.calculateExpirationDate(subscriptionType);
            
            const updateSuccess = await subscriptionDataService.handleSubscriptionSuccess(
              user.uid,
              {
                subscriptionType,
                productId: selectedPlan.productId,
                expirationDate,
              }
            );

            if (updateSuccess) {
              console.log('用户订阅数据已更新到数据库');
            } else {
              console.error('用户订阅数据更新失败');
            }
          }
        }

        Alert.alert(
          '订阅成功',
          `恭喜您成功订阅${selectedPlan.title}！`,
          [
            {
              text: '确定',
              onPress: () => {
                // 重新加载订阅状态
                loadAvailablePlans();
                navigation.navigate('NewHome');
              },
            },
          ]
        );
      } else {
        // 根据错误类型显示不同提示
        const errorMessage = getSubscriptionErrorMessage(result.errorCode, result.error);
        Alert.alert('订阅失败', errorMessage);
      }
    } catch (error: any) {
      // 根据错误类型显示不同提示
      const errorMessage = getSubscriptionErrorMessage(error.code, error.message);
      Alert.alert('订阅失败', errorMessage);
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
          <Text style={styles.introTitle}>{subscriptionConfig.title}</Text>
        </View>

        {/* 功能列表 */}
        <View style={styles.featuresSection}>
          {subscriptionConfig.features.map((feature, index) => (
            <Text key={index} style={styles.featureText}>{feature}</Text>
          ))}
        </View>

        {/* 订阅方案 */}

        <View style={styles.plansContainer}>
          {availablePlans.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planCard,
                selectedPlan?.id === plan.id && styles.planCardSelected,
                plan.isBestValue && styles.planCardBestValue,
                !plan.canPurchase && styles.planCardDisabled,
              ]}
              onPress={() => plan.canPurchase && handlePlanSelect(plan)}
              disabled={!plan.canPurchase}
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
              {selectedPlan ? `订阅 ${selectedPlan.title}` : '选择套餐'}
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
    backgroundColor: '#131313',
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
  weeklyPrice: {
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
  planCardDisabled: {
    opacity: 0.5,
    backgroundColor: '#f5f5f5',
  },
  statusContainer: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
});

export default SubscriptionScreen;
