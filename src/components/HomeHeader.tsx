import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useUser, useUserBalance } from '../hooks/useUser';
import UserAvatar from './UserAvatar';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import GradientButton from './GradientButton';

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
  const { userProfile, isLoggedIn } = useUser();
  const { balance, balanceFormatted } = useUserBalance();
  
  // 检查是否是年度会员
  const isYearlyMember = () => {
    if (!userProfile) return false;
    const isPremium = userProfile.is_premium || false;
    const premiumExpiresAt = userProfile.premium_expires_at;
    const subscriptionType = userProfile.subscription_type;
    
    if (isPremium && premiumExpiresAt && subscriptionType === 'yearly') {
      const now = Date.now();
      return now < premiumExpiresAt;
    }
    return false;
  };
  
  const showUpgradeButton = !isYearlyMember();

  const handleProfilePress = () => {
    if (onProfilePress) {
      onProfilePress();
    } else {
      // 默认导航到个人页面
      navigation.navigate('Profile');
    }
  };

  const handleUpgradePress = () => {
    // 检查是否已登录，如果没有登录则导航到登录页面
    if (!isLoggedIn) {
      navigation.navigate('NewAuth');
      return;
    }
    // 已登录，导航到订阅页面
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
        {showUpgradeButton && (
          <GradientButton
            title="升级"
            onPress={handleUpgradePress}
            variant="primary"
            size="small"
            fontSize={12}
            borderRadius={19}
            style={styles.upgradeButton}
          />
        )}
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
