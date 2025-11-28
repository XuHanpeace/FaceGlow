import React from 'react';
import { View, Image, StyleSheet, ViewStyle, ImageStyle, TouchableOpacity } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useUser, useUserAvatar } from '../hooks/useUser';

interface UserAvatarProps {
  /** 头像尺寸 */
  size?: number;
  /** 自定义样式 */
  style?: ViewStyle;
  /** 头像图片样式 */
  imageStyle?: ImageStyle;
  /** 是否显示会员标签 (已废弃，仅用于兼容旧接口，现在只控制金边) */
  showMembership?: boolean;
  /** 长按回调 */
  onLongPress?: () => void;
  /** 是否可点击（用于控制默认头像无自拍时不响应） */
  clickable?: boolean;
}

/**
 * 用户头像组件
 * 自动显示头像、默认图标和会员金边
 */
const UserAvatar: React.FC<UserAvatarProps> = ({
  size = 48,
  style,
  imageStyle,
  showMembership = true,
  onLongPress,
  clickable = true,
}) => {
  const { userProfile, hasSelfies } = useUser();
  const { avatarSource, hasAvatar } = useUserAvatar();
  
  // 如果使用默认头像且无自拍，则不响应点击
  const isClickable = clickable && (hasAvatar || hasSelfies);

  // 获取会员信息
  const getMembershipInfo = () => {
    if (!userProfile || !showMembership) return null;

    const isPremium = userProfile.is_premium || false;
    const premiumExpiresAt = userProfile.premium_expires_at;
    const subscriptionType = userProfile.subscription_type;

    if (isPremium && premiumExpiresAt) {
      const now = Date.now();
      if (now < premiumExpiresAt) {
        return { type: subscriptionType };
      }
    }
    return null;
  };

  const membershipInfo = getMembershipInfo();
  const isPremium = !!membershipInfo;
  
  // 根据会员类型决定边框颜色
  const getBorderColor = () => {
    if (!membershipInfo) return 'transparent';
    // yearly = 金色 (#FFD700), monthly = 银色 (#FFFFFF)
    return membershipInfo.type === 'yearly' ? '#FFD700' : '#FFFFFF';
  };

  const borderColor = getBorderColor();
  const borderWidth = isPremium ? 1 : 0;

  const AvatarContent = (
    <View style={[
      styles.avatarWrapper, 
      { 
        width: size, 
        height: size, 
        borderRadius: size / 2,
        borderWidth: borderWidth,
        borderColor: borderColor
      },
    ]}>
      {hasAvatar && avatarSource ? (
        <Image 
          source={typeof avatarSource === 'string' ? { uri: avatarSource } : avatarSource} 
          style={[
            styles.avatarImage, 
            { 
              width: size - borderWidth * 2, 
              height: size - borderWidth * 2, 
              borderRadius: (size - borderWidth * 2) / 2 
            },
            imageStyle
          ]} 
        />
      ) : (
        <View style={[
          styles.defaultAvatar, 
          { 
            width: size - borderWidth * 2, 
            height: size - borderWidth * 2, 
            borderRadius: (size - borderWidth * 2) / 2 
          }
        ]}>
          <FontAwesome name="user-circle" size={(size - borderWidth * 2) * 0.625} color="#ccc" />
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {isClickable && onLongPress ? (
        <TouchableOpacity
          onLongPress={onLongPress}
          activeOpacity={0.8}
          delayLongPress={500}
        >
          {AvatarContent}
        </TouchableOpacity>
      ) : (
        AvatarContent
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  avatarWrapper: {
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333',
  },
  avatarImage: {
    resizeMode: 'cover',
  },
  defaultAvatar: {
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default UserAvatar;
