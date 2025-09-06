import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useUser, useUserAvatar, useUserBalance } from '../hooks/useUser';

/**
 * 用户信息卡片组件
 * 展示用户头像、姓名、余额等信息
 */
const UserInfoCard: React.FC = () => {
  const { userInfo, isLoggedIn } = useUser();
  const { avatarSource, hasAvatar } = useUserAvatar();
  const { balanceFormatted } = useUserBalance();

  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <Text style={styles.notLoggedInText}>请先登录</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.avatarContainer}>
        {hasAvatar ? (
          <Image source={avatarSource} style={styles.avatar} />
        ) : (
          <View style={styles.defaultAvatar}>
            <Text style={styles.defaultAvatarText}>👤</Text>
          </View>
        )}
      </View>
      
      <View style={styles.userInfo}>
        <Text style={styles.username}>{userInfo.name || userInfo.username}</Text>
        <Text style={styles.phoneNumber}>{userInfo.phoneNumber}</Text>
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>余额:</Text>
          <Text style={styles.balanceAmount}>¥{balanceFormatted}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  defaultAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultAvatarText: {
    fontSize: 20,
    color: '#666',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  phoneNumber: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
  },
  notLoggedInText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    padding: 20,
  },
});

export default UserInfoCard;
