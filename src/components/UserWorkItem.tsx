import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, useColorScheme } from 'react-native';
import { UserWork, WorkStatusText, WorkStatusColor } from '../types/auth';

interface UserWorkItemProps {
  work: UserWork;
  onPress?: (work: UserWork) => void;
  onLike?: (workId: string) => void;
  onDownload?: (workId: string) => void;
}

const UserWorkItem: React.FC<UserWorkItemProps> = ({ 
  work, 
  onPress, 
  onLike, 
  onDownload 
}) => {
  const isDarkMode = useColorScheme() === 'dark';

  const handlePress = () => {
    if (onPress) {
      onPress(work);
    }
  };

  const handleLike = () => {
    if (onLike) {
      onLike(work._id || '');
    }
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload(work._id || '');
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return '刚刚';
    } else if (diffInHours < 24) {
      return `${diffInHours}小时前`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <TouchableOpacity 
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? '#1a1a1a' : '#f8f9fa' }
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* 作品图片 */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: work.result_image || work.original_image }}
          style={styles.image}
          resizeMode="cover"
        />
        
        {/* 状态标签 */}
        <View style={[
          styles.statusBadge,
          { backgroundColor: WorkStatusColor[work.status] }
        ]}>
          <Text style={styles.statusText}>
            {WorkStatusText[work.status]}
          </Text>
        </View>

        {/* 公开/私密标签 */}
        <View style={[
          styles.visibilityBadge,
          { backgroundColor: work.is_public ? '#4CAF50' : '#FF9800' }
        ]}>
          <Text style={styles.visibilityText}>
            {work.is_public ? '公开' : '私密'}
          </Text>
        </View>
      </View>

      {/* 作品信息 */}
      <View style={styles.infoContainer}>
        <Text style={[
          styles.templateId,
          { color: isDarkMode ? '#888' : '#666' }
        ]}>
          模板: {work.template_id}
        </Text>
        
        <Text style={[
          styles.createTime,
          { color: isDarkMode ? '#666' : '#999' }
        ]}>
          {formatDate(work.created_at)}
        </Text>

        {/* 统计信息 */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={[
              styles.statLabel,
              { color: isDarkMode ? '#666' : '#999' }
            ]}>点赞</Text>
            <Text style={[
              styles.statValue,
              { color: isDarkMode ? '#fff' : '#333' }
            ]}>{work.likes}</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[
              styles.statLabel,
              { color: isDarkMode ? '#666' : '#999' }
            ]}>下载</Text>
            <Text style={[
              styles.statValue,
              { color: isDarkMode ? '#fff' : '#333' }
            ]}>{work.download_count}</Text>
          </View>

          {work.processing_time && (
            <View style={styles.statItem}>
              <Text style={[
                styles.statLabel,
                { color: isDarkMode ? '#666' : '#999' }
              ]}>耗时</Text>
              <Text style={[
                styles.statValue,
                { color: isDarkMode ? '#fff' : '#333' }
              ]}>{work.processing_time}s</Text>
            </View>
          )}
        </View>

        {/* 操作按钮 */}
        <View style={styles.actionContainer}>
          <TouchableOpacity 
            style={[
              styles.actionButton,
              { backgroundColor: isDarkMode ? '#333' : '#e9ecef' }
            ]}
            onPress={handleLike}
          >
            <Text style={[
              styles.actionButtonText,
              { color: isDarkMode ? '#fff' : '#333' }
            ]}>❤️ 点赞</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.actionButton,
              { backgroundColor: isDarkMode ? '#333' : '#e9ecef' }
            ]}
            onPress={handleDownload}
          >
            <Text style={[
              styles.actionButtonText,
              { color: isDarkMode ? '#fff' : '#333' }
            ]}>⬇️ 下载</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    height: 200,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  visibilityBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  visibilityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  infoContainer: {
    padding: 16,
  },
  templateId: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  createTime: {
    fontSize: 12,
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default UserWorkItem;
