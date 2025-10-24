import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
  Dimensions,
  ScrollView,
  FlatList,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { UserWorkModel } from '../types/model/user_works';
import { ImageComparison } from '../components/ImageComparison';
import { shareService } from '../services/shareService';
import { ShareModal } from '../components/ShareModal';
import { Alert } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import GradientButton from '../components/GradientButton';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type UserWorkPreviewScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type UserWorkPreviewScreenRouteProp = RouteProp<RootStackParamList, 'UserWorkPreview'>;

const UserWorkPreviewScreen: React.FC = () => {
  const navigation = useNavigation<UserWorkPreviewScreenNavigationProp>();
  const route = useRoute<UserWorkPreviewScreenRouteProp>();
  const { work } = route.params;
  
  const [selectedResultIndex, setSelectedResultIndex] = useState(0);
  const [showComparison, setShowComparison] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareImageUrl, setShareImageUrl] = useState<string>('');
  const flatListRef = useRef<FlatList>(null);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleSharePress = () => {
    const currentResult = work.result_data?.[selectedResultIndex];
    if (currentResult) {
      setShareImageUrl(currentResult.result_image);
      setShowShareModal(true);
    }
  };

  // 分享选项配置
  const getShareOptions = () => [
    {
      id: 'save',
      icon: '💾',
      iconName: 'download',
      iconColor: '#4CAF50', // 绿色 - 保存
      label: '保存到相册',
      onPress: async () => {
        const result = await shareService.saveImageToAlbum(shareImageUrl);
        if (result.success) {
          Alert.alert('✅ 成功', '图片已保存到相册');
        } else {
          Alert.alert('提示', result.error || '保存失败');
        }
      },
    },
    {
      id: 'wechat',
      icon: '💬',
      iconName: 'wechat',
      iconColor: '#07C160', // 微信绿
      label: '微信好友',
      onPress: async () => {
        const result = await shareService.shareToWeChatSession(shareImageUrl);
        if (!result.success) {
          Alert.alert('提示', result.error || '分享失败');
        }
      },
    },
    {
      id: 'moments',
      icon: '🔗',
      iconName: 'link',
      iconColor: '#2196F3', // 蓝色 - 链接
      label: '朋友圈',
      onPress: async () => {
        const result = await shareService.shareToWeChatTimeline(shareImageUrl);
        if (!result.success) {
          Alert.alert('提示', result.error || '分享失败');
        }
      },
    },
  ];

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / screenWidth);
    setSelectedResultIndex(index);
  };

  // 获取自拍照URL（从ext_data中解析）
  const getSelfieUrl = (): string | null => {
    try {
      if (work.ext_data) {
        const extData = JSON.parse(work.ext_data);
        return extData.selfie_url || null;
      }
    } catch (error) {
      console.error('解析ext_data失败:', error);
    }
    return null;
  };

  const selfieUrl = getSelfieUrl();
  const currentResult = work.result_data?.[selectedResultIndex];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" translucent />
      
      {/* 头部导航 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <FontAwesome name="arrow-left" size={12} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {work.activity_title}
        </Text>
        <TouchableOpacity style={styles.shareButton} onPress={handleSharePress}>
          <FontAwesome name="share-alt" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* 对比模式切换按钮 */}
      <View style={styles.comparisonToggle}>
        <GradientButton
          title="对比模式"
          onPress={() => setShowComparison(true)}
          variant={showComparison ? "primary" : "secondary"}
          size="medium"
          style={styles.toggleButton}
          colors={showComparison ? undefined : ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.1)']}
        />
        <GradientButton
          title="单图模式"
          onPress={() => setShowComparison(false)}
          variant={!showComparison ? "primary" : "secondary"}
          size="medium"
          style={styles.toggleButton}
          colors={!showComparison ? undefined : ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.1)']}
        />
      </View>

      {/* 主图片展示区域 - 左右滑动 */}
      <FlatList
        ref={flatListRef}
        data={work.result_data || []}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        keyExtractor={(item, index) => `result-${index}`}
        renderItem={({ item, index }) => (
          <View style={styles.imageSlide}>
            {showComparison && selfieUrl && item.template_image ? (
              // 对比模式：显示换脸前后对比
              <ImageComparison
                beforeImage={item.template_image}
                afterImage={item.result_image}
                width={screenWidth}
                height={screenHeight * 0.6}
              />
            ) : (
              // 单图模式：只显示换脸结果
              <Image
                source={{ uri: item.result_image }}
                style={styles.resultImage}
                resizeMode="cover"
              />
            )}
            
            {/* 图片信息覆盖层 */}
            <View style={styles.imageOverlay}>
              <Text style={styles.imageTitle}>
                换脸结果 {index + 1} / {work.result_data?.length || 0}
              </Text>
            </View>
          </View>
        )}
      />

      {/* 底部信息区域 */}
      <View style={styles.bottomContainer}>
        {/* 指示器 */}
        {work.result_data && work.result_data.length > 1 && (
          <View style={styles.indicatorContainer}>
            {work.result_data.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  index === selectedResultIndex && styles.activeIndicator,
                ]}
              />
            ))}
          </View>
        )}

        {/* 作品统计 */}
        <View style={styles.workStats}>
          <View style={styles.statItem}>
            <FontAwesome name="heart" size={18} color="#FF6B9D" />
            <Text style={styles.statText}>{work.likes || '0'}</Text>
          </View>
          <View style={styles.statItem}>
            <FontAwesome name="download" size={18} color="#4CAF50" />
            <Text style={styles.statText}>{work.download_count || '0'}</Text>
          </View>
          <View style={styles.statItem}>
            <FontAwesome name="calendar" size={18} color="#2196F3" />
            <Text style={styles.statText}>
              {work.created_at ? new Date(work.created_at).toLocaleDateString() : '未知'}
            </Text>
          </View>
        </View>
      </View>

      {/* 分享Modal */}
      <ShareModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        options={getShareOptions()}
        title="分享作品"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131313',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareIcon: {
    fontSize: 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 20,
  },
  comparisonToggle: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  toggleButton: {
    flex: 1,
  },
  toggleText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    fontWeight: '500',
  },
  toggleTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  imageSlide: {
    width: screenWidth,
    height: screenHeight * 0.6,
    position: 'relative',
  },
  resultImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 16,
  },
  imageTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: '#5EE7DF',
  },
  workStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  statText: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.7,
  },
});

export default UserWorkPreviewScreen;
