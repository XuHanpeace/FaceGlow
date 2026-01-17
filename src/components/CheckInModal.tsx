import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  Image,
  Alert,
  Modal,
  Animated,
  TouchableWithoutFeedback,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { checkInService } from '../services/checkInService';
import { rewardService } from '../services/rewardService';
import { useAppDispatch } from '../store/hooks';
import { fetchUserProfile } from '../store/middleware/asyncMiddleware';
import { CoinRewardModal, CoinRewardModalRef } from './CoinRewardModal';
import GradientButton from './GradientButton';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const DAY_NAMES = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

interface CheckInModalProps {
  visible: boolean;
  onClose: () => void;
}

export const CheckInModal: React.FC<CheckInModalProps> = ({ visible, onClose }) => {
  const dispatch = useAppDispatch();
  const [checkInStatus, setCheckInStatus] = useState<boolean[]>(
    [false, false, false, false, false, false, false]
  );
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [todayReward, setTodayReward] = useState(10);
  const [consecutiveDays, setConsecutiveDays] = useState(0); // 连续签到天数
  const coinRewardModalRef = useRef<CoinRewardModalRef>(null);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [localVisible, setLocalVisible] = useState(false);

  const loadCheckInData = useCallback(async () => {
    try {
      const status = await checkInService.getWeekCheckInStatus();
      setCheckInStatus(status);
      
      const checkedIn = await checkInService.hasCheckedInToday();
      setHasCheckedInToday(checkedIn);
      
      // 计算连续签到天数
      const dayOfWeek = checkInService.getTodayDayOfWeek();
      const consecutive = checkInService.calculateConsecutiveDays(status, dayOfWeek);
      setConsecutiveDays(consecutive);
      
      // 计算今天的奖励（考虑连续签到）
      const reward = checkInService.getRewardAmount(dayOfWeek, consecutive);
      setTodayReward(reward);
    } catch (error) {
      console.error('[CheckInModal] 加载签到数据失败:', error);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      setLocalVisible(true);
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
    } else if (localVisible) {
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
        setLocalVisible(false);
      });
    }
  }, [visible, loadCheckInData, slideAnim, opacityAnim, localVisible]);

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
      console.error('[CheckInModal] 签到失败:', error);
      Alert.alert('签到失败', error.message || '请稍后重试');
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleBackPress = () => {
    onClose();
  };

  if (!localVisible) {
    return null;
  }

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
            height: SCREEN_HEIGHT < 700 ? SCREEN_HEIGHT * 0.65 : SCREEN_HEIGHT * 0.55,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
          <View style={styles.content}>
            {/* 黑色背景 */}
            <View style={styles.blackBackground} />

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

              <View style={styles.contentWrapper}>
                {/* 中央奖励区域 */}
                <View style={styles.rewardCenter}>
                  <View style={styles.bellContainer}>
                    {/* 高斯模糊光晕效果 - 使用阴影模拟 */}
                    <View style={styles.blurGlowShadow} />
                    
                    <Image
                      source={require('../assets/mm-coins.png')}
                      style={styles.bellIcon}
                      resizeMode="contain"
                    />
                  </View>
                  <Text style={styles.rewardAmount}>+{todayReward} 金币</Text>
                </View>

                {/* 一周签到状态 - 竖胶囊型，水平滚动 */}
                <View
                  style={styles.weekStatusContainer}
                >
                  {checkInStatus.map((checked, index) => {
                    const isToday = index === dayOfWeek;
                    const reward = checkInService.getRewardAmount(index, consecutiveDays);
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
                            <>
                              <FontAwesome name="check" size={18} color="#fff" />
                              <Text style={styles.capsuleRewardText}>{reward}</Text>
                            </>
                          ) : (
                            <>
                              <Image
                                source={require('../assets/mm-coins.png')}
                                style={styles.dayCoinIcon}
                                resizeMode="contain"
                              />
                              <Text style={styles.capsuleRewardText}>{reward}</Text>
                            </>
                          )}
                        </View>
                        <Text style={styles.dayNameText}>{DAY_NAMES[index]}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* 签到按钮 - 固定在底部，不遮挡内容 */}
              <View style={styles.buttonContainer}>
                <GradientButton
                  title={hasCheckedInToday ? '明天通知我' : isCheckingIn ? '签到中...' : '签到'}
                  onPress={handleCheckIn}
                  disabled={hasCheckedInToday || isCheckingIn}
                  loading={isCheckingIn}
                  variant="primary"
                  size="large"
                  width={undefined}
                  height={50}
                  fontSize={16}
                  borderRadius={30}
                  style={styles.checkInButton}
                />
              </View>
            </SafeAreaView>
          </View>
        </TouchableWithoutFeedback>
      </Animated.View>

      {/* 奖励弹窗 */}
      <CoinRewardModal ref={coinRewardModalRef} onClose={() => {
        // 奖励弹窗关闭后，自动关闭签到半幅层
        onClose();
      }} />
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
  },
  blackBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#131313',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'transparent'
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
  contentWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  weekStatusScrollView: {
    flex: 1,
  },
  weekStatusContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  rewardCenter: {
    alignItems: 'center',
    marginBottom: 30,
  },
  bellContainer: {
    position: 'relative',
    marginBottom: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blurGlowShadow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFD700',
    bottom: 0,
    zIndex: 0,
    // 使用阴影模拟高斯模糊
    shadowColor: '#FFD700',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.8,
    shadowRadius: 30, // 大范围模糊
    elevation: 0, // Android 不使用 elevation
  },
  bellIcon: {
    width: 80,
    height: 80,
    zIndex: 1,
    position: 'relative',
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  dayItem: {
    alignItems: 'center',
    marginRight: 12,
    width: 40,
  },
  dayCapsule: {
    width: 40,
    height: 65,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 8,
    // 阴影效果
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
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
    width: 20,
    height: 20,
    marginBottom: 4,
  },
  capsuleRewardText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  dayNameText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '500',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: '#131313', // 确保按钮区域有背景，不会透明
  },
  checkInButton: {
    width: '100%',
  },
});

