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
}

const UserWorkCard: React.FC<UserWorkCardProps> = ({ work, onPress }) => {
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
    if (!timestamp) return '未知时间';
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <TouchableOpacity style={styles.workItem} onPress={handlePress} activeOpacity={0.8}>
      <Image 
        source={{ uri: getCoverImage() }} 
        style={styles.workImage}
        resizeMode="cover"
      />
      <View style={styles.workInfo}>
        <Text style={styles.workTitle} numberOfLines={1}>
          {work.activity_title}
        </Text>
        <Text style={styles.workDate}>
          {formatDate(work.created_at)}
        </Text>
        <View style={styles.workStats}>
          <View style={styles.statItem}>
            <FontAwesome name="heart" size={12} color="#FF6B9D" />
            <Text style={styles.statText}>{work.likes || '0'}</Text>
          </View>
          <View style={styles.statItem}>
            <FontAwesome name="download" size={12} color="#4CAF50" />
            <Text style={styles.statText}>{work.download_count || '0'}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  workItem: {
    width: 160,
    height: 249, // 9:14 比例 (160 * 14 / 9 = 248.89)
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  workImage: {
    width: '100%',
    height: 180, // 固定图片高度
  },
  workInfo: {
    padding: 12,
    flex: 1, // 让文案区域占用剩余空间
  },
  workTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  workDate: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 8,
  },
  workStats: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    color: '#fff',
    fontSize: 11,
    opacity: 0.7,
  },
});

export default UserWorkCard;
