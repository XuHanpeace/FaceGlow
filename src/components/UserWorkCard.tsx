import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { UserWorkModel } from '../types/model/user_works';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

interface UserWorkCardProps {
  work: UserWorkModel;
  onPress: (work: UserWorkModel) => void;
  cardWidth?: number;
}

const UserWorkCard: React.FC<UserWorkCardProps> = ({ work, onPress, cardWidth = 180 }) => {
  const handlePress = () => {
    onPress(work);
  };

  // 获取作品封面图片（优先使用换脸结果，回退到活动图片）
  const getCoverImage = () => {
    if (work.result_data && work.result_data.length > 0) {
      return work.result_data[0].result_image;
    }
    return work.activity_image;
  };

  // 格式化创建时间
  const formatDate = (timestamp?: number) => {
    if (!timestamp) return null;
    return new Date(timestamp).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // 获取subtitle内容（优先级：描述 > 结果数量 > 时间）
  const getSubtitle = () => {
    // 优先使用活动描述
    if (work.activity_description && work.activity_description.trim()) {
      return work.activity_description.trim();
    }
    // 其次显示结果数量
    if (work.result_data && work.result_data.length > 0) {
      return `${work.result_data.length} 张作品`;
    }
    // 最后显示时间（如果有）
    return formatDate(work.created_at);
  };

  const subtitle = getSubtitle();

  // 根据宽度计算高度（保持比例）
  const cardHeight = (cardWidth / 180) * 280;
  const imageHeight = (cardWidth / 180) * 220;

  return (
    <TouchableOpacity 
      style={[styles.workItem, { width: cardWidth, height: cardHeight }]} 
      onPress={handlePress} 
      activeOpacity={0.8}
    >
      <Image 
        source={{ uri: getCoverImage() }} 
        style={[styles.workImage, { height: imageHeight }]}
        resizeMode="cover"
      />
      <View style={styles.workInfo}>
        <Text style={styles.workTitle} numberOfLines={1}>
          {work.activity_title}
        </Text>
        {subtitle && (
          <View style={styles.subtitleContainer}>
            <Text style={styles.workSubtitle} numberOfLines={1}>
              {subtitle}
            </Text>
            <FontAwesome name="heart" size={12} color="#FF6B9D" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  workItem: {
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  workImage: {
    width: '100%',
  },
  workInfo: {
    padding: 12,
    flex: 1,
    justifyContent: 'center',
  },
  workTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  workSubtitle: {
    flex: 1,
    color: '#fff',
    fontSize: 12,
    opacity: 0.6,
  },
});

export default UserWorkCard;
