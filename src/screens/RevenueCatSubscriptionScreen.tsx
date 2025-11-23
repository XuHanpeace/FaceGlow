import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  ActivityIndicator,
  ScrollView,
  Linking,
  BackHandler,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useRevenueCat } from '../hooks/useRevenueCat';
import { useAuthState } from '../hooks/useAuthState';
import { PurchasesPackage, PurchasesStoreProduct } from 'react-native-purchases';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import GradientButton from '../components/GradientButton';

type RevenueCatSubscriptionScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

/**
 * RevenueCat 订阅屏幕
 * 使用 RevenueCat Paywall UI 和手动实现的订阅界面
 */
const RevenueCatSubscriptionScreen: React.FC = () => {
  const navigation = useNavigation<RevenueCatSubscriptionScreenNavigationProp>();
  const { user } = useAuthState();
  const {
    isInitialized,
    subscriptionStatus,
    loading,
    error,
    isPro,
    hasActiveSubscription,
    refreshStatus,
    purchasePackage,
    restorePurchases,
    getAvailablePackages,
    getProductInfo,
    isPurchaseCancelled,
    isNetworkError,
  } = useRevenueCat(user?.uid);

  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [loadingPackages, setLoadingPackages] = useState(true);

  // 获取可用的订阅包
  useEffect(() => {
    const loadPackages = async () => {
      try {
        setLoadingPackages(true);
        const availablePackages = await getAvailablePackages();
        setPackages(availablePackages);

        // 默认选择年度订阅（如果可用）
        const yearlyPackage = availablePackages.find((pkg) => 
          pkg.identifier === 'annual' || pkg.identifier === 'yearly' || pkg.packageType === 'ANNUAL'
        );
        const monthlyPackage = availablePackages.find((pkg) => 
          pkg.identifier === 'monthly' || pkg.packageType === 'MONTHLY'
        );

        if (yearlyPackage) {
          setSelectedPackage(yearlyPackage);
        } else if (monthlyPackage) {
          setSelectedPackage(monthlyPackage);
        } else if (availablePackages.length > 0) {
          setSelectedPackage(availablePackages[0]);
        }
      } catch (err) {
        console.error('❌ 加载订阅包失败:', err);
        Alert.alert('错误', '加载订阅选项失败，请稍后重试');
      } finally {
        setLoadingPackages(false);
      }
    };

    if (isInitialized && !hasActiveSubscription) {
      loadPackages();
    }
  }, [isInitialized, hasActiveSubscription, getAvailablePackages]);

  // 在购买Loading时禁用返回按钮
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isPurchasing) {
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [isPurchasing]);

  const handleBackPress = () => {
    if (isPurchasing) {
      Alert.alert('提示', '订阅处理中，请稍候...');
      return;
    }
    navigation.goBack();
  };

  const handlePurchase = async () => {
    if (!selectedPackage) {
      Alert.alert('请选择订阅方案');
      return;
    }

    try {
      setIsPurchasing(true);

      // 购买订阅包
      await purchasePackage(selectedPackage);

      Alert.alert(
        '订阅成功',
        '恭喜您成功订阅 FaceGlow Pro！',
        [
          {
            text: '确定',
            onPress: () => {
              refreshStatus();
              navigation.popToTop();
            },
          },
        ]
      );
    } catch (err: unknown) {
      if (isPurchaseCancelled(err)) {
        // 用户取消购买，不显示错误
        console.log('ℹ️ 用户取消了购买');
        return;
      }

      // 使用 RevenueCat 服务的友好错误消息
      const errorMessage = revenueCatService.getFriendlyErrorMessage(err);
      Alert.alert('订阅失败', errorMessage);
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestorePurchases = async () => {
    try {
      setIsPurchasing(true);
      await restorePurchases();

      if (hasActiveSubscription) {
        Alert.alert('恢复成功', '已恢复您的购买记录');
        refreshStatus();
        navigation.popToTop();
      } else {
        Alert.alert('未找到购买记录', '没有找到可恢复的购买记录');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '恢复购买失败';
      Alert.alert('恢复失败', errorMessage);
    } finally {
      setIsPurchasing(false);
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

  // 如果已经有活跃订阅，显示状态
  if (hasActiveSubscription && subscriptionStatus.isPro) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <FontAwesome name="chevron-left" size={14} color="#fff" />
          </TouchableOpacity>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.premiumStatusContainer}>
            <View style={styles.premiumStatusCard}>
              <FontAwesome name="check-circle" size={48} color="#FF6B35" style={styles.premiumIcon} />
              <Text style={styles.premiumTitle}>您已是 FaceGlow Pro 会员</Text>
              <Text style={styles.premiumDescription}>
                恭喜您已拥有最高级别的会员权益！{'\n'}
                享受所有高级功能和专属特权
              </Text>
              {subscriptionStatus.expirationDate && (
                <View style={styles.expiresInfo}>
                  <Text style={styles.expiresLabel}>会员到期时间：</Text>
                  <Text style={styles.expiresDate}>
                    {new Date(subscriptionStatus.expirationDate).toLocaleDateString('zh-CN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Text>
                  {subscriptionStatus.willRenew && (
                    <Text style={styles.renewInfo}>将自动续订</Text>
                  )}
                </View>
              )}
            </View>
          </View>

          <View style={styles.premiumNotice}>
            <Text style={styles.premiumNoticeText}>
              您可以在 Apple ID 账户设置中管理订阅
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  // 加载中状态
  if (loading || loadingPackages || !isInitialized) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <FontAwesome name="chevron-left" size={14} color="#fff" />
          </TouchableOpacity>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>加载订阅选项...</Text>
        </View>
      </View>
    );
  }

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
          <Text style={styles.introTitle}>FaceGlow Pro</Text>
        </View>

        {/* 功能列表 */}
        <View style={styles.featuresSection}>
          <Text style={styles.featureText}>• 无限次AI换脸</Text>
          <Text style={styles.featureText}>• 高清图片导出</Text>
          <Text style={styles.featureText}>• 每日100张PRO级别照片</Text>
        </View>

        {/* 订阅方案 */}
        {packages.length > 0 ? (
          <View style={styles.plansContainer}>
            {packages.map((pkg) => {
              const productInfo = getProductInfo(pkg);
              const isSelected = selectedPackage?.identifier === pkg.identifier;
              const isAnnual = pkg.packageType === 'ANNUAL' || pkg.identifier === 'annual' || pkg.identifier === 'yearly';

              return (
                <TouchableOpacity
                  key={pkg.identifier}
                  style={[
                    styles.planCard,
                    isSelected && styles.planCardSelected,
                  ]}
                  onPress={() => setSelectedPackage(pkg)}
                >
                  {isAnnual && (
                    <View style={styles.saveBadge}>
                      <Text style={styles.saveText}>最优惠</Text>
                    </View>
                  )}
                  
                  <View style={styles.planHeader}>
                    <Text style={styles.planTitle}>
                      {isAnnual ? '年度会员' : '月度会员'}
                    </Text>
                    <View style={styles.priceContainer}>
                      <Text style={styles.price}>{productInfo.priceString}</Text>
                      <Text style={styles.period}>
                        / {isAnnual ? '年' : '月'}
                      </Text>
                    </View>
                    {productInfo.introPrice && (
                      <Text style={styles.introPriceText}>
                        首期 {productInfo.introPrice.price}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.noPackagesContainer}>
            <Text style={styles.noPackagesText}>暂无可用订阅选项</Text>
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

      {/* 底部按钮 */}
      <View style={styles.bottomContainer}>
        <GradientButton
          title={selectedPackage ? `订阅 ${selectedPackage.identifier === 'annual' || selectedPackage.packageType === 'ANNUAL' ? '年度会员' : '月度会员'}` : '选择套餐'}
          onPress={handlePurchase}
          disabled={!selectedPackage || isPurchasing}
          loading={isPurchasing}
          variant="primary"
          size="medium"
          fontSize={16}
          borderRadius={22}
          style={styles.subscribeButton}
        />
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
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
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
  introPriceText: {
    color: '#FF6B35',
    fontSize: 14,
    marginTop: 4,
  },
  noPackagesContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noPackagesText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
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
  bottomContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  subscribeButton: {
    marginBottom: 12,
    width: '100%',
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
  renewInfo: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    marginTop: 4,
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
});

export default RevenueCatSubscriptionScreen;

