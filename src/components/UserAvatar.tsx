import React from 'react';
import { View, Image, StyleSheet, ViewStyle, ImageStyle, Text, TouchableOpacity } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useUser, useUserAvatar } from '../hooks/useUser';
import { colors } from '../config/theme';

interface UserAvatarProps {
  /** 头像尺寸 */
  size?: number;
  /** 自定义样式 */
  style?: ViewStyle;
  /** 头像图片样式 */
  imageStyle?: ImageStyle;
  /** 是否显示会员标签 */
  showMembership?: boolean;
  /** 长按回调 */
  onLongPress?: () => void;
  /** 是否可点击（用于控制默认头像无自拍时不响应） */
  clickable?: boolean;
}

/**
 * 用户头像组件
 * 自动显示头像、默认图标和会员标签
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

  // 计算会员等级
  const getMembershipInfo = () => {
    if (!userProfile || !showMembership) return null;

    const isPremium = userProfile.is_premium || false;
    const premiumExpiresAt = userProfile.premium_expires_at;
    const subscriptionType = userProfile.subscription_type;

    if (isPremium && premiumExpiresAt) {
      const now = Date.now();
      if (now < premiumExpiresAt) {
        // 会员有效
        if (subscriptionType === 'yearly') {
          return { label: '年会员', type: 'yearly' };
        } else if (subscriptionType === 'monthly') {
          return { label: '月会员', type: 'monthly' };
        }
      }
    }
    return null;
  };

  const membershipInfo = getMembershipInfo();
  
  // 根据头像尺寸自动计算标签字体大小
  const labelFontSize = 9;

  const AvatarContent = (
    <View style={[styles.avatarWrapper, { width: size, height: size, borderRadius: size / 2 }]}>
      {hasAvatar && avatarSource ? (
        <Image 
          source={typeof avatarSource === 'string' ? { uri: avatarSource } : avatarSource} 
          style={[
            styles.avatarImage, 
            { width: size, height: size, borderRadius: size / 2 },
            imageStyle
          ]} 
        />
      ) : (
        <View style={[styles.defaultAvatar, { width: size, height: size, borderRadius: size / 2 }]}>
          <FontAwesome name="user-circle" size={size * 0.625} color="#ccc" />
        </View>
      )}
      {/* 会员标签 - 右下角 */}
      {membershipInfo && (
        <View 
          style={[
            styles.membershipBadge,
            {
              bottom: -labelFontSize * 0.5,
              right: -labelFontSize * 0.3,
              paddingHorizontal: 2,
              paddingVertical: labelFontSize * 0.3,
              borderRadius: labelFontSize * 0.8,
            }
          ]}
        >
          <Text 
            style={[
              styles.membershipText,
              { fontSize: labelFontSize }
            ]}
          >
            {membershipInfo.label}
          </Text>
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
    overflow: 'visible',
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
  membershipBadge: {
    position: 'absolute',
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  membershipText: {
    color: '#fff',
    fontSize: 9,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});

export default UserAvatar;

