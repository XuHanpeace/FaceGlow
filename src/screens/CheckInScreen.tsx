import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
  Alert,
  Modal,
  Animated,
  TouchableWithoutFeedback,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { RootStackParamList } from '../types/navigation';
import { themeColors } from '../config/theme';
import { checkInService } from '../services/checkInService';
import { rewardService } from '../services/rewardService';
import { useAppDispatch } from '../store/hooks';
import { fetchUserProfile } from '../store/middleware/asyncMiddleware';
import { CoinRewardModal, CoinRewardModalRef } from '../components/CoinRewardModal';

type CheckInScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const DAY_NAMES = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

const CheckInScreen: React.FC = () => {
  const navigation = useNavigation<CheckInScreenNavigationProp>();
  const dispatch = useAppDispatch();
  const [checkInStatus, setCheckInStatus] = useState<boolean[]>(
    [false, false, false, false, false, false, false]
  );
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [todayReward, setTodayReward] = useState(10);
  const coinRewardModalRef = useRef<CoinRewardModalRef>(null);
  const horizontalScrollViewRef = useRef<ScrollView>(null);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const loadCheckInData = useCallback(async () => {
    try {
      const status = await checkInService.getWeekCheckInStatus();
      setCheckInStatus(status);
      
      const checkedIn = await checkInService.hasCheckedInToday();
      setHasCheckedInToday(checkedIn);
      
      // 计算今天的奖励
      const dayOfWeek = checkInService.getTodayDayOfWeek();
      const reward = checkInService.getRewardAmount(dayOfWeek);
      setTodayReward(reward);
    } catch (error) {
      console.error('[CheckInScreen] 加载签到数据失败:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCheckInData();
      // 显示动画
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // 延迟滚动到当前日期
      setTimeout(() => {
        const dayOfWeek = checkInService.getTodayDayOfWeek();
        const itemWidth = 62; // 每个item的宽度（50 + 12间距）
        const scrollPosition = Math.max(0, dayOfWeek * itemWidth - SCREEN_WIDTH / 2 + itemWidth / 2);
        horizontalScrollViewRef.current?.scrollTo({ x: scrollPosition, animated: true });
      }, 300);
    }, [loadCheckInData, slideAnim, opacityAnim])
  );

  const handleCheckIn = async () => {
    if (hasCheckedInToday) {
      // 已签到，显示"明天通知我"（暂不实现推送功能）
      Alert.alert('提示', '明天记得来签到哦！');
      return;
    }

    if (isCheckingIn) {
      return;
    }

    setIsCheckingIn(true);

    try {
      // 执行签到
      const checkInResult = await checkInService.checkInToday();
      
      if (!checkInResult.success) {
        Alert.alert('签到失败', checkInResult.error || '请稍后重试');
        setIsCheckingIn(false);
        return;
      }

      const rewardAmount = checkInResult.rewardAmount || 10;

      // 发放奖励
      const rewardResult = await rewardService.grantReward(
        rewardAmount,
        '每日签到奖励',
        `checkin_${Date.now()}`
      );

      if (!rewardResult.success) {
        Alert.alert('奖励发放失败', rewardResult.error || '请稍后重试');
        setIsCheckingIn(false);
        return;
      }

      // 刷新用户余额
      await dispatch(fetchUserProfile());

      // 刷新签到状态
      await loadCheckInData();

      // 显示奖励弹窗
      setTimeout(() => {
        coinRewardModalRef.current?.show(rewardAmount);
      }, 300);

      console.log('✅ 签到成功，获得奖励:', rewardAmount);
    } catch (error: any) {
      console.error('[CheckInScreen] 签到失败:', error);
      Alert.alert('签到失败', error.message || '请稍后重试');
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleBackPress = () => {
    // 关闭动画
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      navigation.goBack();
    });
  };

  const dayOfWeek = checkInService.getTodayDayOfWeek();

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="none"
      onRequestClose={handleBackPress}
    >
      <TouchableWithoutFeedback onPress={handleBackPress}>
        <Animated.View
          style={[
            styles.mask,
            {
              opacity: opacityAnim,
            },
          ]}
        />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
          <View style={styles.content}>
            {/* 渐变背景 */}
            <LinearGradient
              colors={themeColors.primary.gradient}
              start={themeColors.primary.start}
              end={themeColors.primary.end}
              style={StyleSheet.absoluteFill}
            />

            <SafeAreaView style={styles.safeArea}>
              {/* 头部 */}
              <View style={styles.header}>
                <View style={styles.placeholder} />
                <Text style={styles.headerTitle}>每日签到</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleBackPress}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <FontAwesome name="times" size={20} color="#fff" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.scrollContainer}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                {/* 标题文字 */}
                <View style={styles.titleSection}>
                  <Text style={styles.title}>每天回来获得奖励</Text>

                  {/* 间隔提示 */}
                  <View style={styles.intervalBadge}>
                    <FontAwesome name="fire" size={14} color="#fff" />
                    <Text style={styles.intervalText}>1-日间隔</Text>
                  </View>

                  {/* 中央奖励区域 */}
                  <View style={styles.rewardCenter}>
                    <View style={styles.bellContainer}>
                      <Image
                        source={require('../assets/mm-coins.png')}
                        style={styles.bellIcon}
                        resizeMode="contain"
                      />
                      {!hasCheckedInToday && (
                        <View style={styles.notificationBadge}>
                          <Text style={styles.notificationText}>1</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.rewardAmount}>+{todayReward} 金币</Text>
                  </View>
                </View>

                {/* 一周签到状态 - 竖胶囊型，水平滚动 */}
                <ScrollView
                  ref={horizontalScrollViewRef}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.weekStatusScrollContent}
                  style={styles.weekStatusScrollView}
                >
                  {checkInStatus.map((checked, index) => {
                    const isToday = index === dayOfWeek;
                    const reward = checkInService.getRewardAmount(index);
                    const isWeekendDay = index >= 5;

                    return (
                      <View key={index} style={styles.dayItem}>
                        <View
                          style={[
                            styles.dayCapsule,
                            checked && styles.dayCapsuleChecked,
                            isToday && !checked && styles.dayCapsuleToday,
                            isWeekendDay && !checked && styles.dayCapsuleWeekend,
                          ]}
                        >
                          {checked ? (
                            <FontAwesome name="check" size={20} color="#fff" />
                          ) : (
                            <Image
                              source={require('../assets/mm-coins.png')}
                              style={styles.dayCoinIcon}
                              resizeMode="contain"
                            />
                          )}
                        </View>
                        <Text style={styles.dayNameText}>{DAY_NAMES[index]}</Text>
                        <Text style={styles.dayRewardText}>{reward}</Text>
                      </View>
                    );
                  })}
                </ScrollView>
              </ScrollView>

              {/* 签到按钮 - 固定在底部 */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[
                    styles.checkInButton,
                    (hasCheckedInToday || isCheckingIn) && styles.checkInButtonDisabled,
                  ]}
                  onPress={handleCheckIn}
                  disabled={isCheckingIn}
                  activeOpacity={0.8}
                >
                  <Text style={styles.checkInButtonText}>
                    {hasCheckedInToday ? '明天通知我' : isCheckingIn ? '签到中...' : '签到'}
                  </Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </View>
        </TouchableWithoutFeedback>
      </Animated.View>

      {/* 奖励弹窗 */}
      <CoinRewardModal ref={coinRewardModalRef} onClose={() => {}} />
    </Modal>
  );
};

const styles = StyleSheet.create({
  mask: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.85,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  placeholder: {
    width: 32,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  weekStatusScrollView: {
    marginTop: 20,
  },
  weekStatusScrollContent: {
    paddingHorizontal: 10,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginTop: 10,
    marginBottom: 12,
  },
  intervalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 30,
  },
  intervalText: {
    fontSize: 12,
    color: '#fff',
    marginLeft: 6,
  },
  rewardCenter: {
    alignItems: 'center',
    marginBottom: 20,
  },
  bellContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  bellIcon: {
    width: 100,
    height: 100,
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  notificationText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  rewardAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  weekStatusContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: 10,
    minWidth: SCREEN_WIDTH - 40,
  },
  dayItem: {
    alignItems: 'center',
    marginRight: 12,
    width: 50,
  },
  dayCapsule: {
    width: 50,
    height: 80,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayCapsuleChecked: {
    backgroundColor: '#FFD700',
  },
  dayCapsuleToday: {
    borderWidth: 2,
    borderColor: '#fff',
  },
  dayCapsuleWeekend: {
    backgroundColor: 'rgba(255, 215, 0, 0.4)',
  },
  dayCoinIcon: {
    width: 28,
    height: 28,
  },
  dayNameText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
    marginBottom: 4,
  },
  dayRewardText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '400',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  checkInButton: {
    width: '100%',
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  checkInButtonDisabled: {
    opacity: 0.7,
  },
  checkInButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: themeColors.primary.gradient[0],
  },
});

export default CheckInScreen;

