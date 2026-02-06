import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { useTypedSelector } from '../store/hooks';
import UserAvatar from './UserAvatar';

// 已移除 @callstack/liquid-glass 依赖（其原生模块在 RN 0.83 会向 RCTView 发 setColor: 导致崩溃）

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Tab 配置
type TabConfig = {
  key: string;
  icon: string;
  label: string;
  route: string;
};

const TABS: TabConfig[] = [
  { key: 'create', icon: 'magic', label: '创作', route: 'NewHome' },
  { key: 'tasks', icon: 'gift', label: '任务', route: 'TaskCenter' },
  { key: 'profile', icon: 'user', label: '我的', route: 'NewProfile' },
];

// 需要隐藏底部菜单的页面
const HIDDEN_ROUTES = [
  'BeforeCreation',
  'CreationResult',
  'SelfieGuide',
  'NewAuth',
  'VerificationCode',
  'Subscription',
  'CoinPurchase',
  'UserWorkPreview',
  'AboutUs',
  'WebView',
  'VideoTest',
  'DebugTest',
  'CheckIn',
  'AlbumMarket',
];

interface FloatingBottomTabProps {
  currentRoute: string;
  onTabPress: (route: string) => void;
}

// 获取底部安全区域高度（iPhone X 及以上机型）
const getBottomInset = (): number => {
  const { height, width } = Dimensions.get('window');
  // iPhone X 及以上机型的特征：屏幕高度大于812或宽度大于375且高宽比大于2
  const isIphoneX = Platform.OS === 'ios' && (
    (height >= 812 || width >= 812) && 
    (height / width > 2 || width / height > 2)
  );
  return isIphoneX ? 34 : 0;
};

const FloatingBottomTab: React.FC<FloatingBottomTabProps> = ({
  currentRoute,
  onTabPress,
}) => {
  const bottomInset = getBottomInset();
  // 整个胶囊的缩放动画
  const capsuleScaleAnim = useRef(new Animated.Value(1)).current;
  
  // 判断是否应该隐藏底部菜单
  const shouldHide = HIDDEN_ROUTES.includes(currentRoute);
  
  // 显示/隐藏动画值 - 根据初始状态设置初始值
  const initialOpacity = shouldHide ? 0 : 1;
  const initialTranslateY = shouldHide ? 100 : 0;
  const opacityAnim = useRef(new Animated.Value(initialOpacity)).current;
  const translateYAnim = useRef(new Animated.Value(initialTranslateY)).current;
  
  // 从 Redux 获取任务状态
  const { hasUnclaimedRewards, hasIncompleteTasks } = useTypedSelector(state => state.task);
  
  // 判断是否显示任务红点
  const showTaskBadge = hasUnclaimedRewards || hasIncompleteTasks;

  // 监听路由变化，播放显示/隐藏动画
  useEffect(() => {
    if (shouldHide) {
      // 隐藏动画：淡出 + 向下移动
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: 100, // 向下移动 100px
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // 显示动画：淡入 + 向上移动回原位
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(translateYAnim, {
          toValue: 0,
          friction: 8,
          tension: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [shouldHide]);

  // 震动反馈配置
  const hapticOptions = {
    enableVibrateFallback: true,
    ignoreAndroidSystemSettings: false,
  };

  // 点击时整个胶囊缩放动画 + 震动反馈
  const handleTabPress = (route: string) => {
    // 如果点击的是当前页面，不执行任何操作
    if (route === currentRoute) {
      return;
    }
    
    // 触发震动反馈
    ReactNativeHapticFeedback.trigger('impactLight', hapticOptions);
    
    // 整个胶囊缩放动画
    Animated.sequence([
      Animated.timing(capsuleScaleAnim, {
        toValue: 0.95,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(capsuleScaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 200,
        useNativeDriver: true,
      }),
    ]).start();
    
    // 调用外部的 onTabPress
    onTabPress(route);
  };

  // 获取当前选中的 tab
  const getActiveTab = () => {
    const tab = TABS.find(t => t.route === currentRoute);
    return tab?.key || 'create';
  };

  const activeTab = getActiveTab();

  // 渲染 tab icon
  const renderTabIcon = (tab: TabConfig, isActive: boolean) => {
    // Profile tab 使用 UserAvatar
    if (tab.key === 'profile') {
      return <UserAvatar size={26} showMembership={false} clickable={false} />;
    }
    
    // 其他 tab 使用 FontAwesome icon
    return (
      <FontAwesome
        name={tab.icon}
        size={24}
        color={isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.5)'}
      />
    );
  };

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          bottom: Math.max(bottomInset, 10) + 10,
          opacity: opacityAnim,
          transform: [{ translateY: translateYAnim }],
        },
        shouldHide && styles.hiddenContainer,
      ]}
      pointerEvents={shouldHide ? 'none' : 'box-none'}
    >
      <Animated.View 
        style={[
          styles.tabBarWrapper,
          { transform: [{ scale: capsuleScaleAnim }] },
        ]}
      >
        {/* 使用半透明背景（BlurView 原生模块在某些环境会报 Unimplemented component，改用纯色背景保底） */}
        <View style={[StyleSheet.absoluteFill, styles.backgroundLayer]} />
        
        {/* Tab 按钮 */}
        <View style={styles.tabContainer}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const showBadge = tab.key === 'tasks' && showTaskBadge;
            // 选中白色，未选中半透明白色
            const textColor = isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.5)';
            
            return (
              <TouchableOpacity
                key={tab.key}
                style={styles.tabButton}
                onPress={() => handleTabPress(tab.route)}
                activeOpacity={0.7}
              >
                <View style={styles.iconContainer}>
                  {renderTabIcon(tab, isActive)}
                  {/* 红点徽章 */}
                  {showBadge && (
                    <View style={styles.badge} />
                  )}
                </View>
                {/* 文字标签 */}
                <Text style={[styles.tabLabel, { color: textColor }]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>
    </Animated.View>
  );
};

// 胶囊尺寸（约为原来的1.2倍）
const TAB_BAR_WIDTH = Math.min(SCREEN_WIDTH - 80, 264);
const TAB_BAR_HEIGHT = 64;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  hiddenContainer: {
    // 隐藏时禁用交互，但保持渲染以支持动画
  },
  tabBarWrapper: {
    width: TAB_BAR_WIDTH,
    height: TAB_BAR_HEIGHT,
    borderRadius: TAB_BAR_HEIGHT / 2, // 完美胶囊形状
    overflow: 'hidden',
    // iOS 阴影
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    // Android 阴影
    elevation: 20,
  },
  backgroundLayer: {
    backgroundColor: 'rgba(30, 30, 30, 0.92)',
  },
  tabContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
    borderWidth: 1.5,
    borderColor: '#1a1a1a',
  },
});

export default FloatingBottomTab;
