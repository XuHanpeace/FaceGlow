import { useRef, useImperativeHandle, forwardRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useUserBalance } from '../hooks/useUser';
import UserAvatar from './UserAvatar';

type HomeHeaderNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export interface HomeHeaderRef {
  playCoinIconAnimation: () => void;
}

interface HomeHeaderProps {
  onProfilePress?: () => void;
}

const HomeHeader = forwardRef<HomeHeaderRef, HomeHeaderProps>((props, ref) => {
  const { onProfilePress } = props;
  const navigation = useNavigation<HomeHeaderNavigationProp>();
  
  // 使用用户hooks获取数据
  const { balanceFormatted } = useUserBalance();
  
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

  const handleProfilePress = () => {
    if (onProfilePress) {
      onProfilePress();
    } else {
      // 默认导航到个人页面
      navigation.navigate('NewProfile');
    }
  };

  return (
    <View style={styles.container}>
      {/* 左侧余额区域 */}
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

      {/* 右侧按钮区域 */}
      <View style={styles.rightContainer}>
        <TouchableOpacity style={styles.profileButton} onPress={handleProfilePress}>
          <UserAvatar size={36} />
        </TouchableOpacity>
      </View>
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
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceIcon: {
    width: 36,
    height: 36,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

HomeHeader.displayName = 'HomeHeader';

export default HomeHeader;
