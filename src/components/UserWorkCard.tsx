import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { UserWorkModel, TaskStatus } from '../types/model/user_works';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { DeleteIcon } from './DeleteIcon';
import FastImage from 'react-native-fast-image';
import Video from 'react-native-video';

interface UserWorkCardProps {
  work: UserWorkModel;
  onPress: (work: UserWorkModel) => void;
  onDelete?: (work: UserWorkModel) => void;
  cardWidth?: number;
}

const UserWorkCard: React.FC<UserWorkCardProps> = ({ work, onPress, onDelete, cardWidth = 180 }) => {
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handlePress = () => {
    if (isDeleting) {
      setIsDeleting(false);
      return;
    }
    onPress(work);
  };

  const handleLongPress = () => {
    setIsDeleting(true);
  };
  
  const handleDelete = () => {
    Alert.alert(
      '删除作品',
      '确定要删除这个作品吗？此操作无法撤销。',
      [
        {
          text: '取消',
          style: 'cancel',
          onPress: () => setIsDeleting(false)
        },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => {
            setIsDeleting(false);
            onDelete && onDelete(work);
          }
        }
      ]
    );
  };

  // 解析 ext_data
  const getExtData = () => {
    try {
      if (work.ext_data) {
        return JSON.parse(work.ext_data);
      }
    } catch (e) {
      console.error('Failed to parse ext_data', e);
    }
    return {};
  };

  const extData = getExtData();
  // 优先使用顶层 taskStatus，兼容旧数据 ext_data.task_status
  const taskStatus = work.taskStatus || extData.task_status;
  // 增强 selfieUrl 获取逻辑：优先 ext_data，其次尝试取 result_data 中的 template_image (原图)
  const selfieUrl = extData.selfie_url || (work.result_data?.[0]?.template_image);

  // 判断 result_image 是否是视频文件
  const isVideoUrl = (url?: string) => {
    if (!url) return false;
    const urlLower = url.toLowerCase();
    return urlLower.endsWith('.mp4') || urlLower.includes('.mp4?') || extData.task_type === 'image_to_video' || extData.task_type === 'video_effect';
  };

  // 获取作品封面图片（如果 result_image 是视频，使用 activity_image 作为封面）
  const getCoverImage = () => {
    const resultImage = work.result_data?.[0]?.result_image;
    
    // 如果 result_image 是视频文件，优先使用ext_data.prompt_data.srcImage作为兜底，否则使用 activity_image 或 template_image 作为封面（不能使用视频URL作为封面）
    if (resultImage && isVideoUrl(resultImage)) {
      let cover = work.activity_image || work.result_data?.[0]?.template_image || '';
      // 尝试从extData.prompt_data.srcImage获取兜底图片
      try {
        if (extData?.prompt_data?.srcImage) {
          cover = extData.prompt_data.srcImage;
        }
      } catch (e) {
        console.error('获取视频兜底图片失败:', e);
      }
      return cover;
    }
    
    // 如果是 asyncTask 且 result_image 为空 (生成中/失败)，优先展示 activity_image 或 template_image
    if (work.activity_type === 'asyncTask' && (!resultImage)) {
       return work.activity_image || work.result_data?.[0]?.template_image || '';
    }
    
    // 如果有 result_image 且不是视频，直接使用
    if (resultImage && !isVideoUrl(resultImage)) {
      return resultImage;
    }
    
    // 兜底：使用 activity_image 或 template_image
    return work.activity_image || work.result_data?.[0]?.template_image || '';
  };

  // 获取视频URL（如果是视频作品）
  const getVideoUrl = () => {
    const resultImage = work.result_data?.[0]?.result_image;
    if (resultImage && isVideoUrl(resultImage)) {
      return resultImage;
    }
    // 也可以从 ext_data 中获取
    if (extData.video_url && isVideoUrl(extData.video_url)) {
      return extData.video_url;
    }
    return null;
  };

  const coverImage = getCoverImage();
  const videoUrl = getVideoUrl();
  const isVideoWork = !!videoUrl;
  
  // 视频加载失败状态
  const [videoFailed, setVideoFailed] = React.useState(false);
  
  // 获取视频失败时的兜底图片（从ext_data.prompt_data.srcImage获取）
  const getFallbackImage = () => {
    try {
      if (extData?.prompt_data?.srcImage) {
        return extData.prompt_data.srcImage;
      }
    } catch (e) {
      console.error('获取兜底图片失败:', e);
    }
    return null;
  };
  
  const fallbackImage = getFallbackImage();

  // 格式化创建时间
  const formatDate = (timestamp?: number) => {
    if (!timestamp) return null;
    const time = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
    return new Date(time).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const getSubtitle = () => {
    if (work.activity_description && work.activity_description.trim()) {
      return work.activity_description.trim();
    }
    if (work.result_data && work.result_data.length > 0) {
      return `${work.result_data.length} 张作品`;
    }
    return '';
  };

  const subtitle = getSubtitle();
  const dateStr = formatDate(work.createdAt);

  // 根据宽度计算高度
  const cardHeight = (cardWidth / 180) * 280; 
  const imageHeight = (cardWidth / 180) * 220;

  return (
    <TouchableOpacity 
      style={[styles.workItem, { width: cardWidth, height: cardHeight }]} 
      onPress={handlePress} 
      onLongPress={handleLongPress}
      delayLongPress={500}
      activeOpacity={0.8}
    >
      <View style={{ position: 'relative' }}>
        {/* 如果是视频作品，显示视频播放器；否则显示图片 */}
        {isVideoWork && videoUrl && !videoFailed ? (
          <Video
            source={{ uri: videoUrl }}
            style={[styles.workImage, { height: imageHeight }]}
            resizeMode="cover"
            paused={true}
            muted={true}
            repeat={false}
            playInBackground={false}
            playWhenInactive={false}
            poster={coverImage}
            posterResizeMode="cover"
            onError={(error) => {
              console.error('视频播放错误:', error);
              setVideoFailed(true);
            }}
          />
        ) : (
          <FastImage 
            source={{ uri: videoFailed && fallbackImage ? fallbackImage : coverImage }} 
            style={[styles.workImage, { height: imageHeight }]}
            resizeMode={FastImage.resizeMode.cover}
          />
        )}
        
        {/* 视频标识 */}
        {isVideoWork && (
          <View style={styles.videoBadge}>
            <FontAwesome name="play-circle" size={14} color="#fff" />
            <Text style={styles.videoBadgeText}>视频</Text>
          </View>
        )}

        {/* 任务状态覆盖层 */}
        {taskStatus === TaskStatus.PENDING && (
          <View style={styles.statusOverlay}>
            <ActivityIndicator size="small" color="#00E096" />
            <Text style={styles.statusText}>生成中...</Text>
          </View>
        )}
        
        {taskStatus === TaskStatus.FAILED && (
          <View style={styles.statusOverlay}>
            <FontAwesome name="exclamation-circle" size={24} color="#FF4D4F" />
            <Text style={styles.statusText}>生成失败</Text>
          </View>
        )}
        
        {/* 自定义 Overlay: 无渐变，左下角头像，右下角时间 */}
        <View style={styles.imageOverlay}>
          <View style={styles.overlayContent}>
            {/* 左下角：自拍头像 (放大) */}
            <View style={styles.selfieContainer}>
              {selfieUrl ? (
                <FastImage 
                  source={{ uri: selfieUrl }} 
                  style={styles.overlaySelfie} 
                  resizeMode={FastImage.resizeMode.cover}
                />
              ) : null}
            </View>

            {/* 右下角：时间 (增加对比度) */}
            {dateStr && (
              <View style={styles.dateContainer}>
                <Text style={styles.overlayDateText}>
                  {dateStr}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
      
      {isDeleting && (
        <View style={styles.deleteOverlay}>
          <DeleteIcon onPress={handleDelete} />
        </View>
      )}

      <View style={styles.workInfo}>
        <Text style={styles.workTitle} numberOfLines={1}>
          {work.activity_title}
        </Text>
        
        <View style={styles.bottomRow}>
          <Text style={styles.workSubtitle} numberOfLines={1}>
            {subtitle || work.activity_title}
          </Text>
          <FontAwesome name="heart" size={12} color="#FF6B9D" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  workItem: {
    marginBottom: 0, // Remove bottom margin to let grid gap handle spacing
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  workImage: {
    width: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    justifyContent: 'flex-end',
    paddingBottom: 8,
    paddingHorizontal: 8,
  },
  overlayContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  selfieContainer: {
    width: 32, // 放大容器
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlaySelfie: {
    width: 40, // 放大头像 (24 -> 32)
    height: 40,
    borderRadius: 20,
    borderWidth: 2, // 稍微加粗边框
    borderColor: '#fff',
  },
  dateContainer: {
    // 可选：添加一个极淡的背景或阴影以确保可见性
    // backgroundColor: 'rgba(0,0,0,0.3)',
    // paddingHorizontal: 6,
    // paddingVertical: 2,
    // borderRadius: 4,
  },
  overlayDateText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.8)', // 增强阴影
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    opacity: 0.9,
  },
  workInfo: {
    paddingHorizontal: 6,
    flex: 1,
    justifyContent: 'center',
  },
  workTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  workSubtitle: {
    flex: 1,
    color: '#fff',
    fontSize: 12,
    opacity: 0.6,
    marginRight: 8,
  },
  deleteOverlay: {
    position: 'absolute',
    top: 4,
    right: 4,
    zIndex: 10,
  },
  statusOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 8,
    fontWeight: '600',
  },
  videoBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  videoBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default UserWorkCard;
