import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  ActivityIndicator,
  BackHandler,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { subscriptionDataService } from '../services/subscriptionDataService';
import { useAuthState } from '../hooks/useAuthState';
import { useUser } from '../hooks/useUser';
import { subscriptionPlans, SubscriptionPlan } from '../config/subscriptionConfig';
import { useRevenueCat } from '../hooks/useRevenueCat';
import { ENTITLEMENTS } from '../config/revenueCatConfig';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import GradientButton from '../components/GradientButton';
import { showSuccessToast, showInfoToast } from '../utils/toast';
import Video from 'react-native-video';

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
    loadAvailablePlans();
  }, [membershipStatus?.type, membershipStatus?.expiresAt]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isLoading) return true;
      return false;
    });
    return () => backHandler.remove();
  }, [isLoading]);

  const loadAvailablePlans = async () => {
    try {
      let localPlans = subscriptionPlans.map(plan => ({
        ...plan,
        canPurchase: true,
        isActive: false,
      }));
      
      if (membershipStatus) {
        if (membershipStatus.type === 'monthly') {
          localPlans = localPlans.filter(plan => plan.id !== 'monthly');
        } else if (membershipStatus.type === 'yearly') {
          localPlans = [];
        }
      }
      
      setAvailablePlans(localPlans);
      
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
    }
  };

  const handleBackPress = () => {
    if (isLoading) {
      showInfoToast('订阅处理中，请稍候...');
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

      const offering = await getOfferings();
      const availablePackages = offering?.availablePackages ?? [];
      const matchedPackage = availablePackages.find(pkg =>
        pkg.product.identifier === selectedPlan.productId
      );

      if (!matchedPackage) {
        Alert.alert('产品不可用', '当前订阅产品暂不可用');
        return;
      }

      const customerInfo = await purchasePackage(matchedPackage);
      const entitlement = customerInfo.entitlements.active[ENTITLEMENTS.PRO];
      const isProActive = typeof entitlement !== 'undefined';

      if (isProActive && user?.uid) {
        const subscriptionType = subscriptionDataService.parseSubscriptionType(selectedPlan.productId);
        let expirationDate: Date;
        if (entitlement?.expirationDate) {
          expirationDate = new Date(entitlement.expirationDate);
        } else if (subscriptionType) {
          expirationDate = subscriptionDataService.calculateExpirationDate(subscriptionType);
        } else {
          expirationDate = new Date();
        }

        await subscriptionDataService.handleSubscriptionSuccess(
          user.uid,
          {
            subscriptionType: subscriptionType ?? 'monthly',
            productId: selectedPlan.productId,
            expirationDate,
            willRenew: entitlement?.willRenew ?? true,
          }
        );
      }

      showSuccessToast(`恭喜您成功订阅${selectedPlan.title}！`);
      setTimeout(() => {
        loadAvailablePlans();
        navigation.goBack();
      }, 500);
    } catch (error) {
      if (isPurchaseCancelled(error)) return;
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
        showSuccessToast('已恢复您的购买记录');
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

  const handleOpenSubscriptionAgreement = () => {
    navigation.navigate('WebView', {
      url: 'https://xuhanpeace.github.io/facegolow-support/subscription-agreement.html',
      title: '订阅协议',
    });
  };

  // 辅助函数：从价格字符串中解析数字
  const getMonthlyPrice = (price: string, period: string) => {
    const match = price.match(/[\d.]+/);
    if (match) {
      const amount = parseFloat(match[0]);
      if (period === 'year') {
        return `¥${(amount / 12).toFixed(1)}/月`;
      }
    }
    return price; // 如果无法解析，返回原价
  };

  // 获取按钮显示的文案
  const getButtonText = () => {
    if (!selectedPlan) return '立即开启';
    
    // 移除价格中的 /月 或 /年 后缀，只保留金额部分用于按钮显示
    const cleanPrice = selectedPlan.price.replace(/\/[月年]/, '');
    
    if (selectedPlan.period === 'year') {
      return `开启 年度会员 ${cleanPrice}`;
    }
    return `开启 月度会员 ${cleanPrice}`;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* 背景视频 */}
      <Video
        source={require('../assets/v3.mp4')}
        style={styles.backgroundVideo}
        muted={true}
        repeat={true}
        resizeMode="cover"
        rate={1.0}
        ignoreSilentSwitch="obey"
      />

      {/* 遮罩层 */}
      <View style={styles.overlay} />

      {/* AI 生成提示文本 */}
      <Text style={styles.aiGeneratedText}>本视频由万相AI生成</Text>

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          {/* PREMIUM 徽章 */}
          <View style={styles.premiumBadgeContainer}>
            <FontAwesome name="star" size={12} color="#fff" style={{marginRight: 4}} />
            <Text style={styles.premiumBadgeText}>美颜换换会员</Text>
          </View>
          
          {/* 关闭按钮 */}
          <TouchableOpacity style={styles.closeButton} onPress={handleBackPress}>
             <FontAwesome name="times" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.contentContainer}>
          {/* 标题区域 */}
          <View style={styles.textSection}>
            <Text style={styles.mainTitle}>解锁全部权益</Text>
            <Text style={styles.subTitle}>
              立即升级，解锁所有AI高级写真模版，享受无限次创作与高清导出！
            </Text>
          </View>

          {/* 订阅卡片区域 */}
          {membershipStatus?.type === 'yearly' ? (
            <View style={styles.premiumStatusCard}>
              <FontAwesome name="check-circle" size={32} color="#fff" style={styles.premiumIcon} />
              <Text style={styles.premiumStatusTitle}>您已是尊贵的年度会员</Text>
              {membershipStatus.expiresAt && (
                <Text style={styles.premiumStatusDate}>
                  到期日：{new Date(membershipStatus.expiresAt).toLocaleDateString()}
                </Text>
              )}
            </View>
          ) : (
            <View style={styles.plansSection}>
              {availablePlans.map((plan) => {
                const isSelected = selectedPlan?.id === plan.id;
                const isYearly = plan.period === 'year';

                return (
                  <TouchableOpacity
                    key={plan.id}
                    style={[
                      styles.planCard,
                      isSelected && styles.planCardSelected
                    ]}
                    onPress={() => handlePlanSelect(plan)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.planContent}>
                      <View style={styles.planLeft}>
                        <View style={styles.radioButton}>
                          {isSelected && <View style={styles.radioButtonInner} />}
                        </View>
                        <View style={{marginLeft: 12}}>
                           <Text style={styles.planName}>{plan.title}</Text>
                           <Text style={styles.planDetailText}>
                             {isYearly ? '12个月' : '1个月'} • {plan.price}
                           </Text>
                        </View>
                      </View>

                      <View style={styles.planRight}>
                        {isYearly && plan.savePercent && (
                          <View style={styles.discountBadge}>
                            <Text style={styles.discountText}>{plan.savePercent} OFF</Text>
                          </View>
                        )}
                        <Text style={styles.planPricePerMonth}>
                           {isYearly ? getMonthlyPrice(plan.price, plan.period) : plan.price + '/月'}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

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

          {/* 底部按钮 */}
          {membershipStatus?.type !== 'yearly' && (
            <View style={styles.footer}>
              <GradientButton
                title={getButtonText()}
                onPress={handleSubscribe}
                disabled={!selectedPlan || !agreeToTerms || isLoading}
                loading={isLoading}
                variant="primary"
                style={styles.continueButton}
                textStyle={{ fontWeight: 'bold', fontSize: 18 }}
              />
              
              <TouchableOpacity onPress={handleRestorePurchases} style={styles.restoreButton}>
                <Text style={styles.restoreText}>恢复购买</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundVideo: {
    position: 'absolute',
    top: -20, // 稍微上移，配合放大
    left: 0,
    bottom: 0,
    right: 0,
    height: '110%', // 放大高度，确保移动后不会露出黑边
    transform: [{ translateY: 40 }], // 向下平移，将顶部内容挤下来
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)', // 加深一点遮罩确保文字可读性
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 10,
    position: 'relative',
    height: 50,
  },
  premiumBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  premiumBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 1,
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    top: Platform.OS === 'android' ? 40 : 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  textSection: {
    marginBottom: 40,
  },
  mainTitle: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 12,
    letterSpacing: 1,
  },
  subTitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  plansSection: {
    marginBottom: 24,
    gap: 12,
  },
  planCard: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  planCardSelected: {
    borderColor: '#fff',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  planContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  planName: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  planDetailText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    marginTop: 3,
  },
  planRight: {
    alignItems: 'flex-end',
  },
  discountBadge: {
    backgroundColor: '#FF4500',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 4,
  },
  discountText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  planPricePerMonth: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  footer: {
    marginTop: 10,
  },
  continueButton: {
    width: '100%',
    height: 56,
    marginBottom: 16,
    shadowColor: "#FF512F",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  restoreButton: {
    alignItems: 'center',
    padding: 10,
  },
  restoreText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  premiumStatusCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    marginBottom: 40,
  },
  premiumIcon: {
    marginBottom: 16,
    opacity: 0.9,
  },
  premiumStatusTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  premiumStatusDate: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  agreementContainer: {
    paddingHorizontal: 0,
    marginBottom: 10,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    marginRight: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  checkboxChecked: {
    backgroundColor: '#FF4500',
    borderColor: '#FF4500',
  },
  checkmark: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  agreementText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
  },
  linkText: {
    color: '#FF4500',
    textDecorationLine: 'underline',
  },
  aiGeneratedText: {
    position: 'absolute',
    bottom: 14, // 位于顶部区域
    alignSelf: 'center',
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: 10,
    letterSpacing: 1,
    zIndex: 1,
  },
});

export default SubscriptionScreen;
