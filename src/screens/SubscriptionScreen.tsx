import React, { useState, useEffect, useMemo } from 'react';
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
  Linking,
  BackHandler,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { NativeModules } from 'react-native';
import { subscriptionDataService } from '../services/subscriptionDataService';
import { useAuthState } from '../hooks/useAuthState';
import { useUser } from '../hooks/useUser';
import { subscriptionPlans, subscriptionConfig, SubscriptionPlan } from '../config/subscriptionConfig';
import { useRevenueCat } from '../hooks/useRevenueCat';
import { ENTITLEMENTS } from '../config/revenueCatConfig';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import GradientButton from '../components/GradientButton';


type SubscriptionScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;



const SubscriptionScreen: React.FC = () => {
  const navigation = useNavigation<SubscriptionScreenNavigationProp>();
  const { user } = useAuthState();
  const { userProfile } = useUser();
  const {
    getOfferings,
    purchasePackage,
    restorePurchases,
    isPurchaseCancelled,
  } = useRevenueCat(user?.uid);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  
  // 获取当前会员状态
  const getCurrentMembershipStatus = () => {
    if (!userProfile) return null;
    
    const isPremium = userProfile.is_premium || false;
    const premiumExpiresAt = userProfile.premium_expires_at;
    const subscriptionType = userProfile.subscription_type;
    
    if (isPremium && premiumExpiresAt) {
      const now = Date.now();
      if (now < premiumExpiresAt) {
        return {
          isActive: true,
          type: subscriptionType,
          expiresAt: premiumExpiresAt,
        };
      }
    }
    return null;
  };
  
  const membershipStatus = useMemo(() => getCurrentMembershipStatus(), [userProfile]);
  
  useEffect(() => {
    // 当会员状态变化时重新加载计划
    loadAvailablePlans();
    // 只在会员类型或到期时间变化时重新加载，避免无限循环
  }, [membershipStatus?.type, membershipStatus?.expiresAt]);

  // 在订阅Loading时禁用返回按钮
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isLoading) {
        // 正在加载时阻止返回
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [isLoading]);

  const loadAvailablePlans = async () => {
    try {
      // 使用本地配置的订阅计划作为 UI 数据源，保持原有样式
      let localPlans = subscriptionPlans.map(plan => ({
        ...plan,
        canPurchase: true,
        isActive: false,
      }));
      
      // 根据当前会员状态过滤计划
      if (membershipStatus) {
        if (membershipStatus.type === 'monthly') {
          // 月度会员：不显示月度选项
          localPlans = localPlans.filter(plan => plan.id !== 'monthly');
        } else if (membershipStatus.type === 'yearly') {
          // 年度会员：不显示任何选项
          localPlans = [];
        }
      }
      
      setAvailablePlans(localPlans);
      
      // 默认选中年会员（如果可用）
      if (localPlans.length > 0) {
        const yearlyPlan = localPlans.find(plan => plan.id === 'yearly');
        if (yearlyPlan) {
          setSelectedPlan(yearlyPlan);
        } else {
          setSelectedPlan(localPlans[0]);
        }
      }
    } catch (error) {
      console.error('加载订阅计划失败:', error);
      // 兜底：使用默认计划
      let defaultPlans = subscriptionPlans.map(plan => ({
        ...plan,
        canPurchase: true,
        isActive: false,
      }));
      
      // 根据当前会员状态过滤计划
      if (membershipStatus) {
        if (membershipStatus.type === 'monthly') {
          defaultPlans = defaultPlans.filter(plan => plan.id !== 'monthly');
        } else if (membershipStatus.type === 'yearly') {
          defaultPlans = [];
        }
      }
      
      setAvailablePlans(defaultPlans);
      
      // 默认选中年会员（如果可用）
      if (defaultPlans.length > 0) {
        const yearlyPlan = defaultPlans.find(plan => plan.id === 'yearly');
        if (yearlyPlan) {
          setSelectedPlan(yearlyPlan);
        } else {
          setSelectedPlan(defaultPlans[0]);
        }
      }
    }
  };

  const handleBackPress = () => {
    if (isLoading) {
      // 正在加载时阻止返回
      Alert.alert('提示', '订阅处理中，请稍候...');
      return;
    }
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

    if (!agreeToTerms) {
      Alert.alert('请先同意用户协议', '订阅前需要阅读并同意《会员订阅用户协议》');
      return;
    }

    try {
      setIsLoading(true);

      // 从 RevenueCat Offerings 中查找与当前订阅计划匹配的 package
      const offering = await getOfferings();
      const availablePackages = offering?.availablePackages ?? [];

      // 打印一下 Offerings 和当前选择，方便你验证配置
      console.log('🧾 RevenueCat Offerings 当前可用包:', availablePackages.map(p => ({
        identifier: p.identifier,
        packageType: p.packageType,
        productId: p.product.identifier,
        price: p.product.priceString,
      })));
      console.log('🧾 当前选中方案:', {
        id: selectedPlan.id,
        productId: selectedPlan.productId,
        title: selectedPlan.title,
      });

      const matchedPackage = availablePackages.find(pkg =>
        pkg.product.identifier === selectedPlan.productId
      );

      if (!matchedPackage) {
        Alert.alert('产品不可用', '当前订阅产品暂不可用，请检查 RevenueCat 产品配置是否与本地 productId 一致');
        return;
      }

      // 再次打印实际用于购买的 package
      console.log('🧾 准备购买的 RevenueCat Package:', {
        identifier: matchedPackage.identifier,
        packageType: matchedPackage.packageType,
        productId: matchedPackage.product.identifier,
        price: matchedPackage.product.priceString,
      });

      // 使用 RevenueCat SDK 购买订阅（基于 package）
      const customerInfo = await purchasePackage(matchedPackage);

      // 从 RevenueCat 的 entitlement 中读取真实的到期时间和续订状态
      const entitlement = customerInfo.entitlements.active[ENTITLEMENTS.PRO];
      const isProActive = typeof entitlement !== 'undefined';

      if (isProActive && user?.uid) {
        // 解析订阅类型
        const subscriptionType = subscriptionDataService.parseSubscriptionType(selectedPlan.productId);

        // 优先使用 RevenueCat 返回的 expirationDate（服务器时间）
        let expirationDate: Date;
        if (entitlement?.expirationDate) {
          expirationDate = new Date(entitlement.expirationDate);
        } else if (subscriptionType) {
          // 兜底：如果服务端没有给到期时间，仍使用本地计算
          expirationDate = subscriptionDataService.calculateExpirationDate(subscriptionType);
        } else {
          // 极端兜底，避免传入无效时间
          expirationDate = new Date();
        }

        const updateSuccess = await subscriptionDataService.handleSubscriptionSuccess(
          user.uid,
          {
            subscriptionType: subscriptionType ?? 'monthly',
            productId: selectedPlan.productId,
            expirationDate,
            willRenew: entitlement?.willRenew ?? true,
          }
        );

        if (updateSuccess) {
          console.log('用户订阅数据已更新到数据库');
        } else {
          console.error('用户订阅数据更新失败');
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
              navigation.popToTop();
            },
          },
        ]
      );
    } catch (error) {
      if (isPurchaseCancelled(error)) {
        // 用户取消，不弹错误
        return;
      }

      const message = error instanceof Error ? error.message : '订阅失败，请重试';
      Alert.alert('订阅失败', message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestorePurchases = async () => {
    try {
      setIsLoading(true);
      const customerInfo = await restorePurchases();

      const isProActive = typeof customerInfo.entitlements.active[ENTITLEMENTS.PRO] !== 'undefined';

      if (isProActive) {
        Alert.alert('恢复成功', '已恢复您的购买记录');
      } else {
        Alert.alert('恢复失败', '没有找到可恢复的购买记录');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '恢复购买时出现错误';
      Alert.alert('恢复失败', message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenPrivacyPolicy = () => {
    Linking.openURL('https://xuhanpeace.github.io/facegolow-support/privacy-policy.html');
  };

  const handleOpenTermsOfUse = () => {
    Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/');
  };

  const handleOpenSubscriptionAgreement = () => {
    Linking.openURL('https://xuhanpeace.github.io/facegolow-support/subscription-agreement.html');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <FontAwesome name="chevron-left" size={14} color="#fff" />
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
        {membershipStatus?.type === 'yearly' ? (
          <View style={styles.premiumStatusContainer}>
            <View style={styles.premiumStatusCard}>
              <FontAwesome name="check-circle" size={48} color="#FF6B35" style={styles.premiumIcon} />
              <Text style={styles.premiumTitle}>您已是年度会员</Text>
              <Text style={styles.premiumDescription}>
                恭喜您已拥有最高级别的会员权益！{'\n'}
                享受所有高级功能和专属特权
              </Text>
              {membershipStatus.expiresAt && (
                <View style={styles.expiresInfo}>
                  <Text style={styles.expiresLabel}>会员到期时间：</Text>
                  <Text style={styles.expiresDate}>
                    {new Date(membershipStatus.expiresAt).toLocaleDateString('zh-CN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.plansContainer}>
            {availablePlans.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planCard,
                selectedPlan?.id === plan.id && styles.planCardSelected,
                !plan.canPurchase && styles.planCardDisabled,
              ]}
              onPress={() => plan.canPurchase && handlePlanSelect(plan)}
              disabled={!plan.canPurchase}
            >
              {plan.savePercent && (
                <View style={styles.saveBadge}>
                  <Text style={styles.saveText}>{plan.savePercent}</Text>
                </View>
              )}
              
              <View style={styles.planHeader}>
                <Text style={styles.planTitle}>{plan.title}</Text>
                <View style={styles.priceContainer}>
                  <Text style={styles.price}>{plan.price}</Text>
                  <Text style={styles.period}> / {plan.period === 'month' ? '月' : '年'}</Text>
                  {plan.weeklyPrice && (
                    <Text style={styles.weeklyPrice}>{plan.weeklyPrice} / 周</Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
          </View>
        )}

        {/* 年度会员时不显示订阅按钮 */}
        {membershipStatus?.type === 'yearly' && (
          <View style={styles.premiumNotice}>
            <Text style={styles.premiumNoticeText}>
              您可以在 Apple ID 账户设置中管理订阅
            </Text>
          </View>
        )}

        {/* 订阅信息详情 */}
        {selectedPlan && (
          <View style={styles.subscriptionInfoSection}>
            <Text style={styles.infoSectionTitle}>订阅详情</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>订阅标题：</Text>
              <Text style={styles.infoValue}>美颜换换Pro - {selectedPlan.title}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>订阅时长：</Text>
              <Text style={styles.infoValue}>{selectedPlan.period === 'month' ? '1个月' : '1年'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>订阅价格：</Text>
              <Text style={styles.infoValue}>{selectedPlan.price}</Text>
            </View>
            {selectedPlan.weeklyPrice && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>每周价格：</Text>
                <Text style={styles.infoValue}>{selectedPlan.weeklyPrice}</Text>
              </View>
            )}
          </View>
        )}

        {/* 法律链接 */}
        <View style={styles.legalLinksContainer}>
          <TouchableOpacity onPress={handleOpenPrivacyPolicy}>
            <Text style={styles.legalLinkText}>隐私政策</Text>
          </TouchableOpacity>
          <Text style={styles.legalLinkDivider}>•</Text>
          <TouchableOpacity onPress={handleOpenTermsOfUse}>
            <Text style={styles.legalLinkText}>服务条款</Text>
          </TouchableOpacity>
          <Text style={styles.legalLinkDivider}>•</Text>
          <TouchableOpacity onPress={handleRestorePurchases}>
            <Text style={styles.legalLinkText}>恢复购买</Text>
          </TouchableOpacity>
        </View>

        {/* 订阅说明 */}
        <View style={styles.subscriptionNotice}>
          <Text style={styles.noticeText}>
            • 订阅将自动续订，除非在当前订阅期结束前至少24小时取消{'\n'}
            • 您可以在Apple ID账户设置中管理订阅{'\n'}
            • 付款将在确认购买时从Apple ID账户扣除
          </Text>
        </View>

      </ScrollView>

      {/* 协议勾选 - 年度会员时不显示 */}
      {membershipStatus?.type !== 'yearly' && (
        <View style={styles.agreementContainer}>
          <TouchableOpacity 
            style={styles.checkboxContainer}
            onPress={() => setAgreeToTerms(!agreeToTerms)}
          >
            <View style={[styles.checkbox, agreeToTerms && styles.checkboxChecked]}>
              {agreeToTerms && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.agreementText}>
              我已阅读并同意
              <Text style={styles.linkText} onPress={handleOpenSubscriptionAgreement}>《会员订阅用户协议》</Text>
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 底部按钮 - 年度会员时不显示 */}
      {membershipStatus?.type !== 'yearly' && (
        <View style={styles.bottomContainer}>
          <GradientButton
            title={selectedPlan ? `订阅 ${selectedPlan.title}` : '选择套餐'}
            onPress={handleSubscribe}
            disabled={!selectedPlan || !agreeToTerms || isLoading}
            loading={isLoading}
            variant="primary"
            size="medium"
            fontSize={16}
            borderRadius={22}
            style={styles.subscribeButton}
          />
        </View>
      )}
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
    marginLeft: 8,
    fontSize: 12,
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
    marginBottom: 12,
    width: '100%',
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
  premiumStatusContainer: {
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  premiumStatusCard: {
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  premiumIcon: {
    marginBottom: 16,
  },
  premiumTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  premiumDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  expiresInfo: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    width: '100%',
    alignItems: 'center',
  },
  expiresLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    marginBottom: 4,
  },
  expiresDate: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '600',
  },
  premiumNotice: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    marginBottom: 20,
  },
  premiumNoticeText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
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
  legalLinksContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
    gap: 10,
  },
  legalLinkText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  legalLinkDivider: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 13,
  },
  subscriptionInfoSection: {
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.3)',
  },
  infoSectionTitle: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
    minWidth: 90,
  },
  infoValue: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  subscriptionNotice: {
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  noticeText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
  agreementContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  checkboxChecked: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  checkmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  agreementText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    flex: 1,
    lineHeight: 20,
  },
  linkText: {
    color: '#FF6B35',
    textDecorationLine: 'underline',
  },
});

export default SubscriptionScreen;
