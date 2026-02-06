import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Animated,
  Platform,
  UIManager,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { ImageComparison } from '../components/ImageComparison';
import { callFaceFusionCloudFunction } from '../services/tcb/tcb';
import { userWorkService } from '../services/database/userWorkService';
import { aegisService } from '../services/monitoring/aegisService';
import { imageUploadService } from '../services/imageUploadService';
import { UserWorkModel, ResultData } from '../types/model/user_works';
import { authService } from '../services/auth/authService';
import { shareService } from '../services/shareService';
import { ShareModal } from '../components/ShareModal';
import GradientButton from '../components/GradientButton';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { showSuccessToast, showErrorToast, showInfoToast } from '../utils/toast';
import BackButton from '../components/BackButton';
import ReactNativeHapticFeedback from "react-native-haptic-feedback";
import { useAppDispatch } from '../store/hooks';
import { fetchUserWorks, updateWorkItem } from '../store/slices/userWorksSlice';

// 启用 Android 上的布局动画
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type CreationResultScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type CreationResultScreenRouteProp = RouteProp<RootStackParamList, 'CreationResult'>;


const CreationResultScreen: React.FC = () => {
  const navigation = useNavigation<CreationResultScreenNavigationProp>();
  const route = useRoute<CreationResultScreenRouteProp>();
  const dispatch = useAppDispatch();
  const { albumData, selfieUrl, activityId } = route.params;
  
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    albumData?.template_list?.[0]?.template_id || ''
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // 新增保存状态，用于防抖
  const [fusionResults, setFusionResults] = useState<{ [templateId: string]: string }>({});
  const [failedTemplates, setFailedTemplates] = useState<{ [templateId: string]: string }>({});
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareImageUrl, setShareImageUrl] = useState<string>('');
  const [isPanelExpanded, setIsPanelExpanded] = useState(false); // 默认收起

  const slideAnim = useRef(new Animated.Value(0)).current;

  const togglePanel = () => {
    const toValue = isPanelExpanded ? 0 : 1;
    
    Animated.timing(slideAnim, {
      toValue,
      duration: 200,
      useNativeDriver: false, // height 动画不支持 native driver
    }).start();
    
    setIsPanelExpanded(!isPanelExpanded);
  };

  const selectedTemplate = albumData.template_list.find(
    template => template.template_id === selectedTemplateId
  );

  const selectedResult = selectedTemplate ? fusionResults[selectedTemplateId] : '';

  // 面板列表高度插值
  const listHeight = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 160], // 展开时的高度
  });

  // 辅助函数：获取用户友好的错误信息
  const getUserFriendlyErrorMessage = (error: any) => {
    const message = typeof error === 'string' ? error : (error?.message || '');
    
    // 处理常见的技术性错误
    if (message.includes('503') || message.includes('Service Unavailable')) {
      return '服务器繁忙，请稍后重试';
    }
    if (message.includes('500') || message.includes('Internal Server Error')) {
      return '服务器开小差了，请稍后重试';
    }
    if (message.includes('401') || message.includes('403')) {
      return '登录已过期，请重新登录';
    }
    if (message.includes('Network Error') || message.includes('timeout')) {
      return '网络连接不稳定，请检查网络';
    }
    
    // 如果是已知的业务错误信息（通常是中文），则直接返回
    if (/[\u4e00-\u9fa5]/.test(message) && message.length < 50) {
      return message;
    }
    
    // 默认错误信息
    return '操作失败，请稍后重试';
  };

  // 处理单个模板的换脸（真实请求）
  const processTemplate = async (templateId: string) => {
    setIsProcessing(true);
    
    try {
      console.log(`🔄 开始处理模板: ${templateId}`);
      console.log(`📸 使用自拍: ${selfieUrl}`);
      
      // 获取当前模板的价格
      const currentTemplate = albumData.template_list.find(t => t.template_id === templateId);
      const templatePrice = albumData.price || 0;
      
      console.log(`💰 [CreationResult] 模板价格: ${templatePrice}`);
      
      // 调用真实的换脸云函数
      // 优先使用 template 的 projectId，如果没有则使用 activityId 作为兜底
      const projectId = currentTemplate?.projectId || activityId;
      const result = await callFaceFusionCloudFunction({
        projectId: projectId || '',
        modelId: templateId || '',
        imageUrl: selfieUrl || '',
        price: albumData.price,
      });
      
      console.log(`📥 [CreationResult] 云函数返回:`, JSON.stringify(result, null, 2));
      
      // 处理余额不足错误
      const resultWithError = result as typeof result & { error?: string; currentBalance?: number; requiredAmount?: number };
      if (result.code === -2 || resultWithError.error === 'INSUFFICIENT_BALANCE') {
        setIsProcessing(false);
        Alert.alert(
          '💎 余额不足',
          `换脸需要${templatePrice}美美币，当前余额${resultWithError.currentBalance || 0}美美币\n是否前往充值？`,
          [
            { text: '取消', style: 'cancel' },
            { 
              text: '去充值', 
              onPress: () => navigation.navigate('CoinPurchase')
            }
          ]
        );
        return;
      }
      
      if (result.code === 0 && result.data) {
        console.log(`✅ 模板 ${templateId} 换脸成功`);
        console.log(`🖼️ 换脸结果: ${result.data.FusedImage}`);
        
        // 埋点：换脸成功（使用 fg_action_ 前缀，包含专辑标题）
        aegisService.reportUserAction('fusion_success', {
          template_id: templateId,
          activity_id: activityId,
          album_id: albumData?.album_id || '',
          album_title: albumData?.album_name || '', // 专辑标题
        });
        
        // 触发成功震动
        const options = {
          enableVibrateFallback: true,
          ignoreAndroidSystemSettings: false,
        };
        ReactNativeHapticFeedback.trigger("impactLight", options);
        
        setFusionResults(prev => ({
          ...prev,
          [templateId]: result.data!.FusedImage
        }));
        
        // 清除失败状态
        setFailedTemplates(prev => {
          const newFailed = { ...prev };
          delete newFailed[templateId];
          return newFailed;
        });
      } else {
        console.log(`❌ 模板 ${templateId} 换脸失败:`, result.message);
        
        // 埋点：换脸失败（使用 fg_error_ 前缀，包含专辑标题）
        aegisService.reportError(`fusion_failed: ${result.message}`, {
          template_id: templateId,
          activity_id: activityId,
          album_id: albumData?.album_id || '',
          album_title: albumData?.album_name || '', // 专辑标题
          error_code: result.code?.toString() || '-1',
        });
        
        // 融合失败时展开面板并显示Toast
        setIsPanelExpanded(true);
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }).start();
        
        const friendlyMsg = getUserFriendlyErrorMessage(result.message);
        showErrorToast(friendlyMsg); // 使用错误样式的Toast

        setFailedTemplates(prev => ({
          ...prev,
          [templateId]: friendlyMsg
        }));
      }
    } catch (error: any) {
      console.error('❌ 换脸处理异常:', error);
      
      // 融合异常时展开面板并显示Toast
      setIsPanelExpanded(true);
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
      
      const friendlyMsg = getUserFriendlyErrorMessage(error);
      showErrorToast(friendlyMsg); // 使用错误样式的Toast

      setFailedTemplates(prev => ({
        ...prev,
        [templateId]: friendlyMsg
      }));
    } finally {
      setIsProcessing(false);
    }
  };

  // 页面加载时处理第一张模板
  useEffect(() => {
    // 埋点：进入创作结果页面（使用 fg_pv_ 和 fg_action_ 前缀，包含专辑标题）
    aegisService.reportPageView('creation_result');
    aegisService.reportUserAction('enter_creation_result', {
      album_id: albumData?.album_id || '',
      album_title: albumData?.album_name || '', // 专辑标题
      activity_id: activityId,
      template_count: albumData?.template_list?.length || 0,
    });
    
    if (albumData?.template_list?.length && albumData?.template_list?.length > 0) {
      const firstTemplateId = albumData?.template_list?.[0]?.template_id || '';
      processTemplate(firstTemplateId);
    }
  }, []);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleSavePress = async () => {
    // 震动反馈
    const options = {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    };
    ReactNativeHapticFeedback.trigger("impactLight", options);

    // 防抖检查
    if (isSaving) return;
    setIsSaving(true);

    const userId = authService.getCurrentUserId();
    if (!userId) {
      Alert.alert('😔 保存失败', '小主，请先登录后再保存作品哦～');
      setIsSaving(false);
      return;
    }

    // 检查是否有任何换脸结果
    const hasAnyResults = Object.keys(fusionResults).length > 0;
    if (!hasAnyResults) {
      Alert.alert('😅 保存失败', '小主，请先完成换脸后再保存作品吧～');
      setIsSaving(false);
      return;
    }

    try {
      // 构建结果数据 - 包含所有已完成的换脸结果
      const resultData: ResultData[] = [];
      
      // 遍历所有模板，收集已完成的换脸结果
      albumData.template_list.forEach(template => {
        const fusionResult = fusionResults[template.template_id];
        if (fusionResult) {
          resultData.push({
            template_id: template.template_id,
            template_image: template.template_url,
            result_image: fusionResult, // 临时URL，稍后会被COS URL替换
          });
        }
      });
      
      // 如果没有换脸结果，提示用户
      if (resultData.length === 0) {
        Alert.alert('😅 保存失败', '小主，还没有完成任何换脸，请先完成换脸后再保存吧～');
        setIsSaving(false);
        return;
      }

      // 1. 上传所有结果图片到COS（替换临时URL为永久URL）
      console.log('📤 开始上传图片到COS...');
      const imageUrls = resultData.map(r => r.result_image).filter(Boolean) as string[];
      
      // 显示上传进度提示
      if (imageUrls.length > 0) {
        showInfoToast(`正在上传 ${imageUrls.length} 张图片到云端...`);
      }
      
      const uploadResults = await imageUploadService.uploadImagesToCOS(
        imageUrls, 
        'user_works',
        albumData.album_id // 传入 album_id 用于文件命名
      );
      
      // 检查上传结果
      const failedUploads = uploadResults.filter(r => !r.success);
      if (failedUploads.length > 0) {
        console.error('❌ 部分图片上传失败:', failedUploads);
        Alert.alert(
          '😢 上传失败',
          `${failedUploads.length} 张图片上传失败，请检查网络连接后重试`
        );
        setIsSaving(false);
        return;
      }

      // 2. 更新 resultData，使用COS URL替换临时URL
      const cosUrlMap = new Map<string, string>();
      imageUrls.forEach((url, index) => {
        if (uploadResults[index].cosUrl) {
          cosUrlMap.set(url, uploadResults[index].cosUrl!);
        }
      });

      const resultDataWithCOS = resultData.map(result => ({
        ...result,
        result_image: result.result_image && cosUrlMap.get(result.result_image) 
          ? cosUrlMap.get(result.result_image)! 
          : result.result_image,
      }));

      console.log('✅ 所有图片已上传到COS，开始保存作品记录...');

      // 3. 构建用户作品数据（使用COS URL）
      const workData: Omit<UserWorkModel, '_id' | 'uid'> = {
        activity_id: activityId || '',
        activity_type: 'fusion',
        activity_title: albumData.album_name, // 使用相册名称作为活动标题
        activity_description: albumData.album_description,
        activity_image: albumData.album_image,
        album_id: albumData.album_id,
        likes: '0',
        is_public: '1', // 默认公开
        download_count: '0',
        result_data: resultDataWithCOS,
        ext_data: JSON.stringify({
          selfie_url: selfieUrl,
          completed_templates: resultData.map(r => r.template_id),
          total_templates: albumData.template_list.length,
          fusion_time: Date.now(),
        }),
      };

      console.log('🔄 开始保存用户作品到数据库:', workData);

      const result = await userWorkService.createWork(workData);

      if (result.success && result.data?.id) {
        // 埋点：作品保存成功（使用 fg_action_ 前缀，包含专辑标题）
        aegisService.reportUserAction('work_saved', {
          activity_id: activityId,
          album_id: albumData?.album_id || '',
          album_title: albumData?.album_name || '', // 专辑标题
          result_count: resultData.length,
        });
        
        // 构建完整作品对象，立即添加到 Redux store 顶部，确保新作品立即显示
        // 这样即使服务器延迟或分页问题，用户也能立即看到新保存的作品
        const now = Date.now();
        const newWork: UserWorkModel = {
          ...workData,
          _id: result.data.id,
          createdAt: now,
          updatedAt: now,
        };
        
        // 立即添加到 store 顶部（updateWorkItem 会自动处理排序）
        dispatch(updateWorkItem(newWork));
        
        // 同时刷新作品列表，同步服务器数据（如果服务器返回的数据不同，会被合并）
        dispatch(fetchUserWorks());

        showSuccessToast(`太棒了！已保存 ${resultData.length} 个作品到云端，可以在个人中心查看哦～`);
        // 保存成功后返回上一页
        setTimeout(() => {
          navigation.goBack();
        }, 800);
      } else {
        Alert.alert('😢 保存失败', getUserFriendlyErrorMessage(result.error) || '哎呀，保存作品失败了，再试一次吧～');
        setIsSaving(false);
      }
    } catch (error: any) {
      console.error('❌ 保存作品异常:', error);
      Alert.alert('😱 保存失败', getUserFriendlyErrorMessage(error) || '哎呀，保存作品时出错了，再试一次吧～');
      setIsSaving(false);
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
          showSuccessToast('图片已保存到相册');
        } else {
          Alert.alert('提示', result.error || '保存失败');
        }
      },
    },
  ];

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    
    // 埋点：用户选择模板（使用 fg_action_ 前缀，包含专辑标题）
    const currentTemplate = albumData.template_list.find(t => t.template_id === templateId);
    aegisService.reportUserAction('select_template', {
      template_id: templateId,
      template_name: currentTemplate?.template_name || '',
      album_id: albumData?.album_id || '',
      album_title: albumData?.album_name || '', // 专辑标题
      activity_id: activityId,
      has_result: fusionResults[templateId] ? 'yes' : 'no',
    });
    
    // 如果该模板还没有换脸结果，则发起请求
    if (!fusionResults[templateId]) {
      processTemplate(templateId);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" translucent />
      
      {/* 返回按钮 - 浮动在左上角 */}
      <BackButton iconType="arrow" onPress={handleBackPress} />

      {/* 图片对比区域 - 全屏 */}
      <View style={styles.imageComparisonContainer}>
        {selectedTemplate ? (
          selectedResult ? (
            <ImageComparison
              beforeImage={selectedTemplate.template_url}
              afterImage={selectedResult}
              width={screenWidth}
              height={screenHeight}
            />
          ) : (
            <ImageComparison
              beforeImage={selectedTemplate.template_url}
              afterImage={selectedTemplate.template_url}
              width={screenWidth}
              height={screenHeight}
            />
          )
        ) : (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>暂无模板</Text>
          </View>
        )}
      </View>

      {/* 全局Loading遮罩 */}
      {isProcessing && (
        <View style={styles.globalLoadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6B9D" />
            <Text style={styles.loadingText}>美颜换换正在认真创作中</Text>
            <Text style={styles.loadingSubtext}>请稍候，马上就好啦</Text>
          </View>
        </View>
      )}

      {/* 底部信息区域 - 绝对定位覆盖在图片上 */}
      <View style={styles.bottomContainer}>
        {/* 标题和展开/收起按钮区域 */}
        <TouchableOpacity 
          style={styles.panelHeader} 
          onPress={togglePanel}
          activeOpacity={0.8}
        >
          <View style={styles.headerContent}>
            <Text style={styles.templateListTitle}>选择作品</Text>
            <View style={styles.expandIconContainer}>
              <FontAwesome 
                name={isPanelExpanded ? "angle-down" : "angle-up"} 
                size={20} 
                color="#fff" 
              />
            </View>
          </View>
        </TouchableOpacity>

        {/* 模板选择列表 - 可折叠 */}
        <Animated.View style={[styles.templateListWrapper, { height: listHeight }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.templateList}
          >
            {albumData.template_list.map((template) => {
              const isFailed = failedTemplates[template.template_id];
              const isCurrentProcessing = isProcessing && selectedTemplateId === template.template_id;
              const isSelected = selectedTemplateId === template.template_id;
              
              return (
                <TouchableOpacity
                  key={template.template_id}
                  style={[
                    styles.templateItem,
                    { opacity: isSelected ? 1 : 0.5 }, // 未选中时透明度降低
                    isFailed && styles.failedTemplateItem
                  ]}
                  onPress={() => handleTemplateSelect(template.template_id)}
                >
                  <Image
                    source={{ uri: template.template_url }}
                    style={[
                      styles.templateImage,
                      isFailed && styles.failedTemplateImage
                    ]}
                    resizeMode="cover"
                  />
                  
                  {/* 失败状态提示 */}
                  {isFailed && (
                    <View style={styles.failedOverlay}>
                      <Text style={styles.failedText}>重试</Text>
                      <TouchableOpacity
                        style={styles.retryButton}
                        onPress={() => {
                          setFailedTemplates(prev => {
                            const newFailed = { ...prev };
                            delete newFailed[template.template_id];
                            return newFailed;
                          });
                          setSelectedTemplateId(template.template_id);
                          processTemplate(template.template_id);
                        }}
                      >
                        <FontAwesome name="refresh" size={12} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  )}
                  
                  {/* 处理中状态 */}
                  {isCurrentProcessing && (
                    <View style={styles.processingOverlay}>
                      <ActivityIndicator size="small" color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* 操作按钮 - 始终可见 */}
        <View style={styles.actionButtonsContainer}>
          <GradientButton
            title="保存作品"
            onPress={handleSavePress}
            variant="primary"
            size="large"
            style={styles.saveButton}
            fontSize={16}
            borderRadius={22}
            loading={isSaving} // 显示加载状态
            disabled={isSaving} // 禁用按钮
          />
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
  imageComparisonContainer: {
    flex: 1, // 占满全屏
    justifyContent: 'center',
    alignItems: 'center',
  },
  globalLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 40,
    paddingVertical: 30,
    borderRadius: 20,
  },
  loadingText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  loadingSubtext: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.7,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.7,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#131313',
    paddingHorizontal: 20,
    paddingBottom: 40, // 底部安全距离
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    zIndex: 100,
    // 阴影效果
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  panelHeader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    position: 'relative',
  },
  templateListTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  expandIconContainer: {
    marginLeft: 8,
  },
  templateListWrapper: {
    overflow: 'hidden',
  },
  templateList: {
    paddingRight: 20,
    paddingBottom: 10,
  },
  templateItem: {
    marginRight: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
    // padding: 2, // border space removed
  },
  selectedTemplateItem: {
    // 移除之前的边框样式
  },
  templateImage: {
    width: 90,
    height: 140, // 9:14 比例
    borderRadius: 12,
  },
  failedTemplateItem: {
    borderColor: '#FF6B6B',
    borderWidth: 1.5,
  },
  failedTemplateImage: {
    opacity: 0.6,
  },
  failedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  failedText: {
    color: '#FF6B6B',
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 4,
  },
  retryButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.8)',
    padding: 6,
    borderRadius: 12,
  },
  retryText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: '#5EE7DF',
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    marginTop: 4,
  },
  saveButton: {
    flex: 1,
  },
});

export default CreationResultScreen;
