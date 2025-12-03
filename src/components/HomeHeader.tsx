import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useUserBalance } from '../hooks/useUser';
import UserAvatar from './UserAvatar';

type HomeHeaderNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface HomeHeaderProps {
  onProfilePress?: () => void;
}

const HomeHeader: React.FC<HomeHeaderProps> = ({
  onProfilePress,
}) => {
  const navigation = useNavigation<HomeHeaderNavigationProp>();
  
  // 使用用户hooks获取数据
  const { balanceFormatted } = useUserBalance();

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
            <Image 
              source={require('../assets/mm-coins.png')} 
              style={styles.balanceIcon}
              resizeMode="contain"
            />
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
};

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
  balanceIcon: {
    width: 36,
    height: 36
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  upgradeButton: {
    marginRight: 8,
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

export default HomeHeader;
