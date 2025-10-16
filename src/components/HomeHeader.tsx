import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useUserAvatar, useUserBalance } from '../hooks/useUser';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

type HomeHeaderNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface HomeHeaderProps {
  onUpgradePress?: () => void;
  onProfilePress?: () => void;
}

const HomeHeader: React.FC<HomeHeaderProps> = ({
  onUpgradePress,
  onProfilePress,
}) => {
  const navigation = useNavigation<HomeHeaderNavigationProp>();
  
  // 使用用户hooks获取数据
  const { avatarSource, hasAvatar } = useUserAvatar();
  const { balance, balanceFormatted } = useUserBalance();

  const handleProfilePress = () => {
    if (onProfilePress) {
      onProfilePress();
    } else {
      // 默认导航到个人页面
      navigation.navigate('Profile');
    }
  };

  const handleUpgradePress = () => {
    navigation.navigate('Subscription');
  };

  return (
    <View style={styles.container}>
      {/* 左侧余额区域 */}
      <View style={styles.balanceContainer}>
        <TouchableOpacity 
          style={styles.balanceInfo}
          onPress={() => navigation.navigate('CoinPurchase')}
        >
          <Text style={styles.balanceLabel}>美美币</Text>
          <View style={styles.balanceValue}>
            <Text style={styles.balanceNumber}>{balanceFormatted}</Text>
            <FontAwesome name="bitcoin" size={16} color="#FFD700" style={styles.balanceIcon} />
          </View>
        </TouchableOpacity>
      </View>

      {/* 右侧按钮区域 */}
      <View style={styles.rightContainer}>
        <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgradePress}>
          <Text style={styles.upgradeText}>升级</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.profileButton} onPress={handleProfilePress}>
          {hasAvatar ? (
            <Image source={avatarSource} style={styles.profileAvatar} />
          ) : (
            <FontAwesome name="user" size={18} color="#fff" />
          )}
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
    paddingHorizontal: 20,
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
    marginLeft: 4,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  upgradeButton: {
    backgroundColor: '#FF6B9D',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  upgradeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
});

export default HomeHeader;
