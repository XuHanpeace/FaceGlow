import { useRef, useImperativeHandle, forwardRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useUserBalance, useUser } from '../hooks/useUser';
import { CheckInIcon } from './CheckInIcon';
import { useCheckInStatus } from '../hooks/useCheckInStatus';
import { CheckInModal } from './CheckInModal';

type HomeHeaderNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export interface HomeHeaderRef {
  playCoinIconAnimation: () => void;
}

interface HomeHeaderProps {
  onProfilePress?: () => void;
}

const HomeHeader = forwardRef<HomeHeaderRef, HomeHeaderProps>((props, ref) => {
  const navigation = useNavigation<HomeHeaderNavigationProp>();
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  
  // 使用用户hooks获取数据
  const { balanceFormatted } = useUserBalance();
  const { isLoggedIn } = useUser();
  
  // 签到状态
  const { showRedDot, shouldShake } = useCheckInStatus();
  
  // 美美币图标旋转动画
  const coinIconRotateY = useRef(new Animated.Value(0)).current;

  // 暴露播放图标旋转动画的API
  useImperativeHandle(ref, () => ({
    playCoinIconAnimation: () => {
      // 重置动画值
      coinIconRotateY.setValue(0);
      
      // 向屏幕内方向旋转720度（Y轴旋转，两圈）
      Animated.timing(coinIconRotateY, {
        toValue: 1,
        duration: 1200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    },
  }));

  // 旋转角度插值：0 到 720 度（Y轴旋转，向屏幕内，旋转两圈）
  const coinIconRotation = coinIconRotateY.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '720deg'],
  });

  const handleCheckInPress = () => {
    setShowCheckInModal(true);
  };

  return (
    <View style={styles.container}>
      {/* 左侧品牌文本（带渐变效果） */}
      <View style={styles.leftContainer}>
        <Text style={styles.brandText}>美颜换换</Text>
        {/* 签到入口 - 仅登录用户显示 */}
        {isLoggedIn && (
          <CheckInIcon
            onPress={handleCheckInPress}
            showRedDot={showRedDot}
            shouldShake={shouldShake}
            size={24}
            iconColor="#fff"
            style={styles.checkInIcon}
          />
        )}
      </View>

      {/* 右侧金币区域（移除头像入口，Profile 入口已移至底部菜单） */}
      <View style={styles.rightContainer}>
        <View style={styles.balanceContainer}>
          <TouchableOpacity 
            style={styles.balanceInfo}
            onPress={() => navigation.navigate('CoinPurchase')}
          >
            <View style={styles.balanceValue}>
              <View style={styles.balanceIconContainer}>
                <Animated.Image 
                  source={require('../assets/mm-coins.png')} 
                  style={[
                    styles.balanceIcon,
                    {
                      transform: [{ rotateY: coinIconRotation }],
                    },
                  ]}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.balanceNumber}>{balanceFormatted}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* 签到Modal - 仅登录用户显示 */}
      {isLoggedIn && (
        <CheckInModal
          visible={showCheckInModal}
          onClose={() => setShowCheckInModal(false)}
        />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 15,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  brandContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  brandText: {
    fontSize: 26,
    color: '#fff',
    fontWeight: '700',
    fontFamily: Platform.select({
      ios: 'Helvetica Neue-Bold', // iOS 使用苹方字体（更现代的中文字体）
      android: 'sans-serif-condensed', // Android 使用紧凑型无衬线字体（更优雅）
    }),
    letterSpacing: 1, // 增加字间距，让文字更优雅
    marginRight: 4,
  },
  checkInIcon: {},
  gradientText: {
    justifyContent: 'center',
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  freeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
  },
  freeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  balanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceLabel: {
    color: '#fff',
    fontSize: 14,
    marginRight: 8,
  },
  balanceValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceNumber: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 4,
  },
  balanceIconContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceIcon: {
    width: 20,
    height: 20,
    marginRight: 4,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

HomeHeader.displayName = 'HomeHeader';

export default HomeHeader;
