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
  BackHandler,
  Image,
  Platform,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { NativeModules } from 'react-native';
import { subscriptionDataService } from '../services/subscriptionDataService';
import { useAuthState } from '../hooks/useAuthState';
import { coinPackages, coinConfig, CoinPackage } from '../config/subscriptionConfig';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import GradientButton from '../components/GradientButton';
import { showSuccessToast } from '../utils/toast';
import Video from 'react-native-video';
import LinearGradient from 'react-native-linear-gradient';

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

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// 16:9 视频高度
const VIDEO_HEIGHT = SCREEN_WIDTH * (9 / 16);

const CoinPurchaseScreen: React.FC = () => {
  const navigation = useNavigation<CoinPurchaseScreenNavigationProp>();
  const { user } = useAuthState();
  const [selectedPackage, setSelectedPackage] = useState<CoinPackage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  useEffect(() => {
    // 初始化时获取可用产品
    fetchAvailableProducts();
    // 默认选中第一个美美币产品
    if (coinPackages.length > 0) {
      setSelectedPackage(coinPackages[0]);
    }
  }, []);

  // 在购买Loading时禁用返回按钮
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isLoading) {
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [isLoading]);

  const fetchAvailableProducts = async () => {
    try {
      const products = await ApplePayModule.getAvailableProducts([
        'com.digitech.faceglow.assets.coins1',
      ]);
      setAvailableProducts(products);
      console.log('可用美美币产品:', products);
    } catch (error) {
      console.error('获取美美币产品失败:', error);
    }
  };

  const handleBackPress = () => {
    if (isLoading) {
      return;
    }
    navigation.goBack();
  };

  const handlePackageSelect = (coinPackage: CoinPackage) => {
    setSelectedPackage(coinPackage);
  };

  const handlePurchase = async () => {
    if (!selectedPackage) {
      Alert.alert('请选择美美币包');
      return;
    }

    if (!agreeToTerms) {
      Alert.alert('请先同意用户协议', '购买前需要阅读并同意《美美币购买用户协议》');
      return;
    }

    try {
      setIsLoading(true);
      
      // 调用原生支付模块
      const result = await ApplePayModule.purchaseProduct(selectedPackage.productId);
      
      if (result.success) {
        // 更新用户数据库中的美美币信息
        if (user?.uid && selectedPackage.coins) {
          const updateSuccess = await subscriptionDataService.handleCoinPurchaseSuccess(
            user.uid,
            selectedPackage.coins
          );

          if (updateSuccess) {
            console.log('用户美美币数据已更新到数据库');
          } else {
            console.error('用户美美币数据更新失败');
          }
        }

        showSuccessToast(`恭喜您成功购买${selectedPackage.coins}美美币！`);
        setTimeout(() => {
          navigation.popToTop();
        }, 500);
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
        showSuccessToast('已恢复您的购买记录');
      } else {
        Alert.alert('恢复失败', result.error || '没有找到可恢复的购买记录');
      }
    } catch (error: any) {
      Alert.alert('恢复失败', error.message || '恢复购买时出现错误');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAgreement = () => {
    navigation.navigate('WebView', {
      url: 'https://xuhanpeace.github.io/facegolow-support/coin-purchase-agreement.html',
      title: '金币购买协议',
    });
  };

  // 获取按钮显示的文案
  const getButtonText = () => {
    if (!selectedPackage) return '立即购买';
    return `充值 ${selectedPackage.coins} 美美币 ${selectedPackage.price}`;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* 顶部背景视频区域 */}
      <View style={styles.videoContainer}>
        <Video
          source={require('../assets/v2.mp4')}
          style={styles.backgroundVideo}
          muted={true}
          repeat={true}
          resizeMode="cover"
          rate={1.0}
          ignoreSilentSwitch="obey"
        />
        {/* 视频底部渐变遮罩，实现过渡效果 */}
        <LinearGradient
          colors={['transparent', '#000']}
          style={styles.videoGradient}
          start={{x: 0, y: 0}}
          end={{x: 0, y: 1}}
        />
        {/* AI 生成提示文本 */}
        <Text style={styles.aiGeneratedText}>本视频由万相AI生成</Text>
      </View>

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          {/* 徽章 */}
          <View style={styles.badgeContainer}>
            <Image 
              source={require('../assets/mm-coins.png')} 
              style={styles.badgeIcon}
              resizeMode="contain"
            />
            <Text style={styles.badgeText}>美美币充值</Text>
          </View>
          
          {/* 关闭按钮 */}
          <TouchableOpacity style={styles.closeButton} onPress={handleBackPress}>
             <FontAwesome name="times" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.contentContainer}>
          {/* 标题区域 */}
          <View style={styles.textSection}>
            <Text style={styles.mainTitle}>获取更多灵感</Text>
            <Text style={styles.subTitle}>
              充值美美币，解锁更多高级创意写真模版，让每一次创作都惊艳朋友圈！
            </Text>
          </View>

          {/* 美美币包列表 */}
          <View style={styles.packagesContainer}>
            {coinPackages.map((coinPackage) => {
              const isSelected = selectedPackage?.id === coinPackage.id;
              
              return (
                <TouchableOpacity
                  key={coinPackage.id}
                  style={[
                    styles.packageCard,
                    isSelected && styles.packageCardSelected,
                  ]}
                  onPress={() => handlePackageSelect(coinPackage)}
                  activeOpacity={0.8}
                >
                  <View style={styles.packageContent}>
                    <View style={styles.packageLeft}>
                      <View style={styles.radioButton}>
                        {isSelected && <View style={styles.radioButtonInner} />}
                      </View>
                      <View style={{marginLeft: 12}}>
                        <View style={{flexDirection: 'row', alignItems: 'center', left: -4}}>
                          <Image 
                            source={require('../assets/mm-coins.png')} 
                            style={styles.coinIconSmall}
                            resizeMode="contain"
                          />
                          <Text style={styles.packageTitle}>{coinPackage.coins} 美美币</Text>
                        </View>
                        <Text style={styles.packageDescription}>解锁高级模版</Text>
                      </View>
                    </View>
                    
                    <View style={styles.packageRight}>
                      {coinPackage.isPopular && (
                        <View style={styles.popularBadge}>
                          <Text style={styles.popularText}>热门</Text>
                        </View>
                      )}
                      <Text style={styles.packagePrice}>{coinPackage.price}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* 协议勾选 */}
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
                <Text style={styles.linkText} onPress={handleOpenAgreement}>《美美币购买用户协议》</Text>
              </Text>
            </TouchableOpacity>
          </View>

          {/* 底部按钮 */}
          <View style={styles.bottomContainer}>
            <GradientButton
              title={getButtonText()}
              onPress={handlePurchase}
              disabled={!selectedPackage || !agreeToTerms || isLoading}
              loading={isLoading}
              variant="primary"
              style={styles.purchaseButton}
              textStyle={{ fontWeight: 'bold', fontSize: 18 }}
            />
            
            <TouchableOpacity onPress={handleRestorePurchases} style={styles.restoreButton}>
              <Text style={styles.restoreText}>恢复购买</Text>
            </TouchableOpacity>
          </View>
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
  safeArea: {
    flex: 1,
  },
  videoContainer: {
    width: '100%',
    height: VIDEO_HEIGHT + 100, // 稍微增加高度以便渐变过渡更自然
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 0,
  },
  backgroundVideo: {
    width: '100%',
    height: '100%',
  },
  videoGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 150, // 渐变层高度
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
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  badgeIcon: {
    width: 20,
    height: 20,
    marginRight: 2,
  },
  badgeText: {
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
    alignItems: 'center', // 居中对齐，因为上面没有全屏背景
  },
  mainTitle: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 12,
    letterSpacing: 1,
    textAlign: 'center',
  },
  subTitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
    textAlign: 'center',
  },
  packagesContainer: {
    gap: 16,
    marginBottom: 24,
  },
  packageCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  packageCardSelected: {
    borderColor: '#fff',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  packageContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  packageLeft: {
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
  coinIconSmall: {
    width: 20,
    height: 20,
    // marginRight: 8,
  },
  packageTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  packageDescription: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 13,
    marginTop: 4,
  },
  packageRight: {
    alignItems: 'flex-end',
  },
  popularBadge: {
    backgroundColor: '#FF4500',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  popularText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  packagePrice: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
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
  bottomContainer: {
    marginTop: 10,
  },
  purchaseButton: {
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
  aiGeneratedText: {
    position: 'absolute',
    bottom: 20, // 位于视频区域底部
    alignSelf: 'center',
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: 10,
    letterSpacing: 1,
  },
});

export default CoinPurchaseScreen;
