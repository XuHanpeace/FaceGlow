import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  BackHandler,
  Image,
  Platform,
  Dimensions,
  SafeAreaView,
  FlatList,
  AppState,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { NativeModules } from 'react-native';
import { subscriptionDataService } from '../services/subscriptionDataService';
import { useAuthState } from '../hooks/useAuthState';
import { coinPackages, CoinPackage } from '../config/revenueCatConfig';
import { useAppDispatch } from '../store/hooks';
import { fetchUserProfile } from '../store/middleware/asyncMiddleware';
import { authService } from '../services/auth/authService';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import GradientButton from '../components/GradientButton';
import { showSuccessToast, showInfoToast } from '../utils/toast';
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
  const dispatch = useAppDispatch();
  const [selectedPackage, setSelectedPackage] = useState<CoinPackage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const videoRef = useRef<any>(null);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    // 初始化时获取可用产品
    fetchAvailableProducts();
    // 默认选中 120美美币产品
    const defaultPackage = coinPackages.find(pkg => pkg.id === 'coins120');
    if (defaultPackage) {
      setSelectedPackage(defaultPackage);
      // 延迟滚动，确保FlatList已渲染
      setTimeout(() => {
        const index = coinPackages.findIndex(pkg => pkg.id === 'coins120');
        if (index !== -1 && flatListRef.current) {
          flatListRef.current.scrollToIndex({
            index,
            animated: false, // 初始加载不需要动画
            viewPosition: 0.5, // 居中
          });
        }
      }, 300);
    } else if (coinPackages.length > 0) {
      // 如果找不到120美美币，则选择第一个
      setSelectedPackage(coinPackages[0]);
      setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToIndex({
            index: 0,
            animated: false,
            viewPosition: 0.5,
          });
        }
      }, 300);
    }
  }, []);

  // 在购买Loading时禁用返回按钮
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isLoading) {
        showInfoToast('支付处理中，请稍候...');
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [isLoading]);

  // 监听应用状态变化，当从后台回到前台时恢复视频播放
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // 从后台回到前台，恢复视频播放
        if (videoRef.current) {
          videoRef.current.resume();
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const fetchAvailableProducts = async () => {
    try {
      const products = await ApplePayModule.getAvailableProducts([
        'com.digitech.faceglow.assets.coins.48',
        'com.digitech.faceglow.assets.coins.120',
        'com.digitech.faceglow.assets.coins.198',
        'com.digitech.faceglow.assets.coins.498',
        'com.digitech.faceglow.assets.coins1', // Backward compatibility
      ]);
      console.log('可用美美币产品:', products);
    } catch (error) {
      console.error('获取美美币产品失败:', error);
    }
  };

  const handleBackPress = () => {
    if (isLoading) {
      showInfoToast('支付处理中，请稍候...');
      return;
    }
    navigation.goBack();
  };

  const handlePackageSelect = (coinPackage: CoinPackage) => {
    setSelectedPackage(coinPackage);
    
    // 滚动到选中项，使其居中显示
    const index = coinPackages.findIndex(pkg => pkg.id === coinPackage.id);
    if (index !== -1 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index,
          animated: true,
          viewPosition: 0.5, // 0.5 表示居中
        });
      }, 100);
    }
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
            
            // 刷新本地用户数据，确保余额及时更新
            try {
              const currentUserId = authService.getCurrentUserId();
              if (currentUserId) {
                await dispatch(fetchUserProfile({ userId: currentUserId }));
              }
              console.log('用户数据已刷新，余额已更新');
            } catch (refreshError) {
              console.error('刷新用户数据失败:', refreshError);
              // 即使刷新失败，也不影响购买成功的提示
            }
          } else {
            console.error('用户美美币数据更新失败');
          }
        }

        showSuccessToast(`恭喜您成功购买${selectedPackage.coins}美美币！`);
        setTimeout(() => {
          navigation.goBack();
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
    if (isLoading) return '正在查询支付结果，请稍候...';
    if (!selectedPackage) return '立即购买';
    return `充值 ${selectedPackage.price} · 得 ${selectedPackage.coins} 美美币`;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* 顶部背景视频区域 */}
      <View style={styles.videoContainer}>
        <Video
          ref={videoRef}
          source={require('../assets/v2.mp4')}
          style={styles.backgroundVideo}
          muted={true}
          repeat={true}
          resizeMode="cover"
          rate={1.0}
          ignoreSilentSwitch="obey"
          paused={false}
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

          {/* 美美币包列表 - 横向FlatList */}
          <View style={styles.packagesContainer}>
            <FlatList
              ref={flatListRef}
              data={coinPackages}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.flatListContent}
              keyExtractor={(item) => item.id}
              onScrollToIndexFailed={(info) => {
                // 如果滚动失败，延迟重试
                setTimeout(() => {
                  flatListRef.current?.scrollToIndex({
                    index: info.index,
                    animated: true,
                    viewPosition: 0.5,
                  });
                }, 100);
              }}
              renderItem={({ item: coinPackage }) => {
                const isSelected = selectedPackage?.id === coinPackage.id;
                
                return (
                  <TouchableOpacity
                    style={[
                      styles.packageCard,
                      isSelected && styles.packageCardSelected,
                    ]}
                    onPress={() => handlePackageSelect(coinPackage)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.packageContent}>
                      {/* 选中指示器 - 左上角 */}
                      <View style={styles.radioButton}>
                        {isSelected && <View style={styles.radioButtonInner} />}
                      </View>
                      
                      {/* 标签 - 右上角 */}
                      <View style={styles.packageTop}>
                        {coinPackage.isPopular && (
                          <View style={styles.popularBadge}>
                            <LinearGradient
                              colors={['#FF5722', '#FF7043']}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                              style={StyleSheet.absoluteFill}
                            />
                            <View style={styles.badgeContent}>
                              <Text style={styles.popularText}>热门</Text>
                            </View>
                          </View>
                        )}
                        {coinPackage.isBestValue && (
                          <View style={styles.bestValueBadge}>
                            <LinearGradient
                              colors={['#4CAF50', '#66BB6A']}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                              style={StyleSheet.absoluteFill}
                            />
                            <View style={styles.badgeContent}>
                              <Text style={styles.bestValueText}>节省{coinPackage.bonusPercent?.replace(/[^0-9]/g, '') || '10'}%</Text>
                            </View>
                          </View>
                        )}
                        {!coinPackage.isPopular && !coinPackage.isBestValue && (
                          <View style={styles.placeholderBadge} />
                        )}
                      </View>
                      
                      {/* 美美币图标和数量 */}
                      <View style={styles.coinInfoContainer}>
                        <Image 
                          source={require('../assets/mm-coins.png')} 
                          style={styles.coinIcon}
                          resizeMode="contain"
                        />
                        <Text style={styles.coinAmount}>{coinPackage.coins}</Text>
                        <Text style={styles.coinLabel}>美美币</Text>
                      </View>
                      
                      {/* 价格区域 */}
                      <View style={styles.priceContainer}>
                        {coinPackage.originalPrice && (
                          <Text style={styles.originalPrice}>{coinPackage.originalPrice}</Text>
                        )}
                        <Text style={styles.packagePrice}>{coinPackage.price}</Text>
                      </View>
                      
                      {/* 描述 */}
                      <Text style={styles.packageDescription} numberOfLines={1}>
                        {coinPackage.description.length > 12 
                          ? coinPackage.description.substring(0, 12) + '...' 
                          : coinPackage.description}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
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
    paddingBottom: 20,
  },
  textSection: {
    marginBottom: 40,
    paddingHorizontal: 20,
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
    marginBottom: 24,
    height: 220,
    width: '100%',
  },
  flatListContent: {
    paddingHorizontal: SCREEN_WIDTH / 2 - 70, // 使第一个和最后一个卡片能够居中
    paddingVertical: 8,
    gap: 12,
  },
  packageCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 10,
    paddingHorizontal: 8,
    width: 140,
    marginRight: 12,
    position: 'relative',
  },
  packageCardSelected: {
    borderColor: '#fff',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#fff',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  packageContent: {
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '100%',
  },
  packageTop: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 6,
    minHeight: 20,
    position: 'absolute',
    top: 4,
    right: 4,
    zIndex: 1,
  },
  popularBadge: {
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 20,
  },
  popularText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  bestValueBadge: {
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 20,
  },
  bestValueText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  badgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  placeholderBadge: {
    height: 20,
  },
  coinInfoContainer: {
    alignItems: 'center',
    marginVertical: 8,
    marginTop: 26,
  },
  coinIcon: {
    width: 36,
    height: 36,
    marginBottom: 6,
  },
  coinAmount: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 2,
  },
  coinLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontWeight: '500',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 4,
  },
  originalPrice: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    textDecorationLine: 'line-through',
    textDecorationStyle: 'solid',
  },
  packagePrice: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bonusText: {
    display: 'none',
  },
  packageDescription: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 14,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 4,
    left: 4,
    zIndex: 2,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  agreementContainer: {
    paddingHorizontal: 20,
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
    paddingHorizontal: 20,
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
