import React, { useRef, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Image,
  StatusBar,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useAppDispatch, useTypedSelector } from '../store/hooks';
import { fetchTasks, claimTaskReward, updateTaskProgress } from '../store/slices/taskSlice';
import { TaskWithProgress, getTotalRewardAmount, TaskType } from '../types/model/task';
import { CoinRewardModal, CoinRewardModalRef } from '../components/CoinRewardModal';
import { fetchUserProfile } from '../store/middleware/asyncMiddleware';
import GradientButton from '../components/GradientButton';
import { checkInService } from '../services/checkInService';
import { rewardService } from '../services/rewardService';
import { useUser } from '../hooks/useUser';

type TaskCenterScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DAY_NAMES = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

const TaskCenterScreen: React.FC = () => {
  const navigation = useNavigation<TaskCenterScreenNavigationProp>();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const coinRewardModalRef = useRef<CoinRewardModalRef>(null);
  const { isLoggedIn } = useUser();
  
  const { tasks, loading, totalClaimableReward } = useTypedSelector(state => state.task);
  
  // 签到状态
  const [checkInStatus, setCheckInStatus] = useState<boolean[]>(
    [false, false, false, false, false, false, false]
  );
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [todayReward, setTodayReward] = useState(10);
  const [consecutiveDays, setConsecutiveDays] = useState(0);
  
  // 计算已领取的总奖励
  const totalReward = getTotalRewardAmount();
  const claimedReward = tasks
    .filter(t => t.status === 'claimed')
    .reduce((sum, t) => sum + t.rewardAmount, 0);

  // 加载签到数据
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
      console.error('[TaskCenter] 加载签到数据失败:', error);
    }
  }, []);

  // 加载任务数据
  useFocusEffect(
    useCallback(() => {
      dispatch(fetchTasks());
      loadCheckInData();
    }, [dispatch, loadCheckInData])
  );

  // 处理领取奖励
  const handleClaimReward = async (task: TaskWithProgress) => {
    if (task.status !== 'completed') return;
    
    try {
      const result = await dispatch(claimTaskReward(task.id)).unwrap();
      
      // 刷新用户余额
      await dispatch(fetchUserProfile());
      
      // 显示奖励弹窗
      if (result.rewardAmount) {
        setTimeout(() => {
          coinRewardModalRef.current?.show(result.rewardAmount as number);
        }, 300);
      }
    } catch (error) {
      console.error('[TaskCenter] 领取奖励失败:', error);
      Alert.alert('领取失败', String(error));
    }
  };

  // 处理去完成
  const handleGoComplete = (task: TaskWithProgress) => {
    switch (task.taskType) {
      case TaskType.SELFIE_UPLOAD:
        navigation.navigate('SelfieGuide', { isNewUser: true });
        break;
      case TaskType.SPRING_CREATION:
      case TaskType.VIDEO_CREATION:
        navigation.navigate('NewHome', undefined);
        break;
      case TaskType.WORK_SHARE:
      case TaskType.WORK_DOWNLOAD:
        navigation.navigate('NewProfile');
        break;
      default:
        navigation.navigate('NewHome', undefined);
    }
  };

  // 处理签到
  const handleCheckIn = async () => {
    // 检查登录态
    if (!isLoggedIn) {
      navigation.navigate('NewAuth');
      return;
    }
    
    if (hasCheckedInToday || isCheckingIn) {
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
    } catch (error: unknown) {
      console.error('[TaskCenter] 签到失败:', error);
      const errorMessage = error instanceof Error ? error.message : '签到失败';
      Alert.alert('签到失败', errorMessage);
    } finally {
      setIsCheckingIn(false);
    }
  };

  // 渲染任务卡片
  const renderTaskCard = (task: TaskWithProgress) => {
    const progress = `${task.progress.currentCount}/${task.targetCount}`;
    const isCompleted = task.status === 'completed';
    const isClaimed = task.status === 'claimed';
    
    return (
      <View key={task.id} style={styles.taskCard}>
        {/* 左侧图标 */}
        <View style={[styles.taskIcon, { backgroundColor: task.iconBgColor }]}>
          <FontAwesome name={task.icon} size={20} color="#fff" />
        </View>
        
        {/* 中间内容 */}
        <View style={styles.taskContent}>
          <View style={styles.taskTitleRow}>
            <Text style={styles.taskTitle}>{task.title}</Text>
            <Text style={styles.taskProgress}>({progress})</Text>
          </View>
          <Text style={styles.taskDescription}>{task.description}</Text>
        </View>
        
        {/* 右侧奖励和按钮 */}
        <View style={styles.taskRight}>
          <Text style={styles.taskReward}>+{task.rewardAmount}</Text>
          {isClaimed ? (
            <View style={styles.claimedBadge}>
              <Text style={styles.claimedText}>已完成</Text>
            </View>
          ) : isCompleted ? (
            <GradientButton
              title="领取"
              onPress={() => handleClaimReward(task)}
              size="small"
              height={32}
              width={70}
              fontSize={13}
              borderRadius={16}
              colors={['#FFD700', '#FFA500']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              textStyle={{ color: '#000' }}
            />
          ) : (
            <GradientButton
              title="去完成"
              onPress={() => handleGoComplete(task)}
              size="small"
              height={32}
              width={70}
              fontSize={13}
              borderRadius={16}
            />
          )}
        </View>
      </View>
    );
  };

  // 渲染签到日期项
  const renderCheckInDay = (index: number) => {
    const checked = checkInStatus[index];
    const dayOfWeek = checkInService.getTodayDayOfWeek();
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
              <FontAwesome name="check" size={16} color="#fff" />
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
  };

  const dayOfWeek = checkInService.getTodayDayOfWeek();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#131313" />
      
      {/* 头部 */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.placeholder} />
        <Text style={styles.headerTitle}>新人任务</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
          {/* 每日签到区域 */}
          <View style={styles.checkInSection}>
            {/* 签到标题和奖励 */}
            <View style={styles.checkInHeader}>
              <View style={styles.checkInTitleRow}>
                <FontAwesome name="calendar-check-o" size={18} color="#FFD700" />
                <Text style={styles.checkInTitle}>每日签到</Text>
              </View>
              <View style={styles.checkInRewardBadge}>
                <Text style={styles.checkInRewardText}>+{todayReward}</Text>
                <Image
                  source={require('../assets/mm-coins.png')}
                  style={styles.checkInCoinIcon}
                  resizeMode="contain"
                />
              </View>
            </View>

            {/* 一周签到状态 */}
            <View style={styles.weekStatusContainer}>
              {checkInStatus.map((_, index) => renderCheckInDay(index))}
            </View>

            {/* 签到按钮 */}
            <GradientButton
              title={!isLoggedIn ? '请先登录' : hasCheckedInToday ? '今日已签到' : isCheckingIn ? '签到中...' : '立即签到'}
              onPress={handleCheckIn}
              disabled={!isLoggedIn || hasCheckedInToday || isCheckingIn}
              loading={isCheckingIn}
              variant="primary"
              size="large"
              width={undefined}
              height={44}
              fontSize={15}
              borderRadius={22}
              style={styles.checkInButton}
            />
          </View>

          {/* 奖励概览卡片 */}
          <View style={styles.rewardOverview}>
            <LinearGradient
              colors={['#FF6B9D', '#FF8E53']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.rewardGradient}
            >
              <View style={styles.rewardContent}>
                <View style={styles.rewardLeft}>
                  <Text style={styles.rewardLabel}>完成任务可获得</Text>
                  <View style={styles.rewardAmountRow}>
                    <Image
                      source={require('../assets/mm-coins.png')}
                      style={styles.coinIcon}
                      resizeMode="contain"
                    />
                    <Text style={styles.rewardAmount}>{totalReward}</Text>
                    <Text style={styles.rewardUnit}>美美币</Text>
                  </View>
                </View>
                <View style={styles.rewardRight}>
                  <View style={styles.progressCircle}>
                    <Text style={styles.progressText}>{claimedReward}/{totalReward}</Text>
                    <Text style={styles.progressLabel}>已领取</Text>
                  </View>
                </View>
              </View>
              
              {/* 可领取奖励提示 */}
              {totalClaimableReward > 0 && (
                <View style={styles.claimableTip}>
                  <FontAwesome name="gift" size={14} color="#FFD700" />
                  <Text style={styles.claimableTipText}>
                    有 {totalClaimableReward} 美美币待领取
                  </Text>
                </View>
              )}
            </LinearGradient>
          </View>

          {/* 任务列表标题 */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionDot} />
              <Text style={styles.sectionTitle}>完成任务赢好礼</Text>
              <View style={styles.sectionDot} />
            </View>
          </View>

          {/* 任务列表 */}
          <View style={styles.taskList}>
            {tasks.map(renderTaskCard)}
          </View>
        </ScrollView>

      {/* 奖励弹窗 */}
      <CoinRewardModal ref={coinRewardModalRef} onClose={() => {}} />
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 120, // 为底部菜单留出空间
  },
  // 签到区域
  checkInSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  checkInHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkInTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkInTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  checkInRewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  checkInRewardText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  checkInCoinIcon: {
    width: 16,
    height: 16,
    marginLeft: 4,
  },
  weekStatusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dayItem: {
    alignItems: 'center',
    flex: 1,
  },
  dayCapsule: {
    width: 36,
    height: 56,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    paddingVertical: 6,
  },
  dayCapsuleChecked: {
    backgroundColor: '#FFD700',
  },
  dayCapsuleToday: {
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  dayCapsuleWeekend: {
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
  },
  dayCoinIcon: {
    width: 18,
    height: 18,
    marginBottom: 2,
  },
  capsuleRewardText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
  },
  dayNameText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
  },
  checkInButton: {
    width: '100%',
  },
  // 奖励概览
  rewardOverview: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  rewardGradient: {
    // paddingHorizontal: 16,
    // paddingVertical: 16,
  },
  rewardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
     paddingHorizontal: 16,
    paddingVertical: 16,
  },
  rewardLeft: {
    flex: 1,
  },
  rewardLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  rewardAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coinIcon: {
    width: 28,
    height: 28,
    marginRight: 8,
  },
  rewardAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  rewardUnit: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 8,
    alignSelf: 'flex-end',
    marginBottom: 6,
  },
  rewardRight: {
    alignItems: 'center',
  },
  progressCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  progressLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  claimableTip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  claimableTipText: {
    fontSize: 13,
    color: '#FFD700',
    marginLeft: 6,
    fontWeight: '500',
  },
  // 任务列表
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF6B9D',
    marginHorizontal: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  taskList: {
    gap: 12,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  taskIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  taskContent: {
    flex: 1,
    marginRight: 12,
  },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  taskProgress: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
    marginLeft: 6,
  },
  taskDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  taskRight: {
    alignItems: 'flex-end',
  },
  taskReward: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 6,
  },
  claimedBadge: {
    width: 70,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  claimedText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.4)',
  },
});

export default TaskCenterScreen;
