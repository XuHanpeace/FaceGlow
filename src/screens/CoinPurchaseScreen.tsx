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
import { subscriptionDataService } from '../services/subscriptionDataService';
import { useAuthState } from '../hooks/useAuthState';
import { coinPackages, coinConfig, CoinPackage } from '../config/subscriptionConfig';

const { ApplePayModule } = NativeModules;

type CoinPurchaseScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// 错误消息处理函数
const getCoinPurchaseErrorMessage = (errorCode: string, errorMessage: string): string => {
  switch (errorCode) {
    case 'purchase_cancelled':
      return '您取消了购买，如需购买美美币请重新选择';
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
      return errorMessage || '购买失败，请重试';
  }
};


const CoinPurchaseScreen: React.FC = () => {
  const navigation = useNavigation<CoinPurchaseScreenNavigationProp>();
  const { user } = useAuthState();
  const [selectedPackage, setSelectedPackage] = useState<CoinPackage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);

  useEffect(() => {
    // 初始化时获取可用产品
    fetchAvailableProducts();
  }, []);

  const fetchAvailableProducts = async () => {
    try {
      const products = await ApplePayModule.getAvailableProducts([
        'com.digitech.faceglow.assets.coins',
      ]);
      setAvailableProducts(products);
      console.log('可用金币产品:', products);
    } catch (error) {
      console.error('获取金币产品失败:', error);
    }
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handlePackageSelect = (coinPackage: CoinPackage) => {
    setSelectedPackage(coinPackage);
  };

  const handlePurchase = async () => {
    if (!selectedPackage) {
      Alert.alert('请选择金币包');
      return;
    }

    try {
      setIsLoading(true);
      
      // 调用原生支付模块
      const result = await ApplePayModule.purchaseProduct(selectedPackage.productId);
      
      if (result.success) {
        // 更新用户数据库中的金币信息
        if (user?.uid && selectedPackage.coins) {
          const updateSuccess = await subscriptionDataService.handleCoinPurchaseSuccess(
            user.uid,
            selectedPackage.coins
          );

          if (updateSuccess) {
            console.log('用户金币数据已更新到数据库');
          } else {
            console.error('用户金币数据更新失败');
          }
        }

        Alert.alert(
          '购买成功',
          `恭喜您成功购买${selectedPackage.coins}金币！`,
          [
            {
              text: '确定',
              onPress: () => navigation.navigate('NewHome'),
            },
          ]
        );
      } else {
        // 根据错误类型显示不同提示
        const errorMessage = getCoinPurchaseErrorMessage(result.errorCode, result.error);
        Alert.alert('购买失败', errorMessage);
      }
    } catch (error: any) {
      // 根据错误类型显示不同提示
      const errorMessage = getCoinPurchaseErrorMessage(error.code, error.message);
      Alert.alert('购买失败', errorMessage);
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
        <Text style={styles.headerTitle}>{coinConfig.title}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 介绍区域 */}
        <View style={styles.introSection}>
          <Text style={styles.introTitle}>{coinConfig.title}</Text>
          <Text style={styles.introSubtitle}>{coinConfig.description}</Text>
        </View>

        {/* 金币包列表 */}
        <View style={styles.packagesContainer}>
          {coinPackages.map((coinPackage) => (
            <TouchableOpacity
              key={coinPackage.id}
              style={[
                styles.packageCard,
                selectedPackage?.id === coinPackage.id && styles.packageCardSelected,
                coinPackage.isBestValue && styles.packageCardBestValue,
              ]}
              onPress={() => handlePackageSelect(coinPackage)}
            >
              {coinPackage.bonusPercent && (
                <View style={styles.bonusBadge}>
                  <Text style={styles.bonusText}>额外{coinPackage.bonusPercent}</Text>
                </View>
              )}
              
              {coinPackage.isPopular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>热门</Text>
                </View>
              )}
              
              <View style={styles.packageHeader}>
                <Text style={styles.packageTitle}>{coinPackage.title}</Text>
                <View style={styles.coinsContainer}>
                  <Text style={styles.coinsAmount}>{coinPackage.coins}</Text>
                  <Text style={styles.coinsLabel}>金币</Text>
                </View>
              </View>
              
              <View style={styles.packageFooter}>
                <Text style={styles.packageDescription}>{coinPackage.description}</Text>
                <Text style={styles.packagePrice}>{coinPackage.price}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* 其他链接 */}
        <View style={styles.linksSection}>
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
            styles.purchaseButton,
            (!selectedPackage || isLoading) && styles.purchaseButtonDisabled,
          ]}
          onPress={handlePurchase}
          disabled={!selectedPackage || isLoading}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.loadingText}>处理中...</Text>
            </View>
          ) : (
            <Text style={styles.purchaseButtonText}>
              购买 {selectedPackage?.coins} 金币
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
  headerTitle: {
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
  introSection: {
    marginTop: 20,
    marginBottom: 30,
    alignItems: 'center',
  },
  introTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  introSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    textAlign: 'center',
  },
  packagesContainer: {
    gap: 16,
    marginBottom: 30,
  },
  packageCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  packageCardSelected: {
    borderColor: '#FF6B35',
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
  },
  packageCardBestValue: {
    borderColor: '#FF6B35',
  },
  bonusBadge: {
    position: 'absolute',
    top: -10,
    left: 20,
    backgroundColor: '#FF6B35',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bonusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  packageHeader: {
    marginBottom: 16,
  },
  packageTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  coinsContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  coinsAmount: {
    color: '#FFD700',
    fontSize: 32,
    fontWeight: 'bold',
  },
  coinsLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    marginLeft: 8,
  },
  packageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  packageDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  packagePrice: {
    color: '#FF6B35',
    fontSize: 18,
    fontWeight: 'bold',
  },
  linksSection: {
    marginBottom: 30,
  },
  legalLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  legalLink: {
    paddingVertical: 8,
  },
  legalLinkText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  purchaseButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  purchaseButtonDisabled: {
    backgroundColor: '#666',
  },
  purchaseButtonText: {
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
});

export default CoinPurchaseScreen;
