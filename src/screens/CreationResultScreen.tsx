import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { ImageComparison } from '../components/ImageComparison';
import { callFaceFusionCloudFunction } from '../services/tcb/tcb';
import { userWorkService } from '../services/database/userWorkService';
import { balanceService } from '../services/balanceService';
import { useAuthState } from '../hooks/useAuthState';
import { UserWorkModel, ResultData } from '../types/model/user_works';
import { authService } from '../services/auth/authService';
import { shareService } from '../services/shareService';
import { ShareModal } from '../components/ShareModal';
import GradientButton from '../components/GradientButton';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type CreationResultScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type CreationResultScreenRouteProp = RouteProp<RootStackParamList, 'CreationResult'>;


const CreationResultScreen: React.FC = () => {
  const navigation = useNavigation<CreationResultScreenNavigationProp>();
  const route = useRoute<CreationResultScreenRouteProp>();
  const { albumData, selfieUrl, activityId } = route.params;
  const { user } = useAuthState();
  
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    albumData.template_list[0]?.template_id || ''
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [fusionResults, setFusionResults] = useState<{ [templateId: string]: string }>({});
  const [showComparison, setShowComparison] = useState(false);
  const [failedTemplates, setFailedTemplates] = useState<{ [templateId: string]: string }>({});
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareImageUrl, setShareImageUrl] = useState<string>('');

  const selectedTemplate = albumData.template_list.find(
    template => template.template_id === selectedTemplateId
  );

  const selectedResult = selectedTemplate ? fusionResults[selectedTemplateId] : '';

  // 处理单个模板的换脸（真实请求）
  const processTemplate = async (templateId: string) => {
    setIsProcessing(true);
    
    try {
      console.log(`🔄 开始处理模板: ${templateId}`);
      console.log(`📸 使用自拍: ${selfieUrl}`);
      
      // 获取当前模板的价格
      const currentTemplate = albumData.template_list.find(t => t.template_id === templateId);
      const templatePrice = currentTemplate?.price || 0;
      
      // 检查用户余额是否充足
      if (user?.uid && templatePrice > 0) {
        const balanceCheck = await balanceService.checkBalance(user.uid, templatePrice);
        
        if (!balanceCheck.sufficient) {
          setIsProcessing(false);
          Alert.alert(
            '💎 余额不足',
            `换脸需要${templatePrice}美美币，当前余额${balanceCheck.currentBalance}美美币\n是否前往充值？`,
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
      }
      
      // 调用真实的换脸云函数
      const result = await callFaceFusionCloudFunction({
        projectId:  activityId,
        modelId: templateId,
        imageUrl: selfieUrl,
      });
      
      if (result.code === 0 && result.data) {
        console.log(`✅ 模板 ${templateId} 换脸成功`);
        console.log(`🖼️ 换脸结果: ${result.data.FusedImage}`);
        
        // 扣除用户美美币
        if (user?.uid && templatePrice > 0) {
          const deductResult = await balanceService.deductBalance({
            userId: user.uid,
            amount: templatePrice,
            description: `AI换脸消费 - ${currentTemplate?.template_name || '模板'}`,
            relatedId: `fusion_${templateId}_${Date.now()}`,
            metadata: {
              fusion: {
                template_id: templateId,
                activity_id: activityId,
                result_url: result.data.FusedImage
              }
            }
          });

          if (!deductResult.success) {
            console.error('扣除美美币失败:', deductResult.error);
            // 即使扣除美美币失败，也显示换脸结果，但记录错误
          } else {
            console.log(`💰 已扣除${templatePrice}美美币，当前余额: ${deductResult.newBalance}`);
          }
        }
        
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
        setFailedTemplates(prev => ({
          ...prev,
          [templateId]: result.message || '换脸处理失败，请重试'
        }));
      }
    } catch (error: any) {
      console.error('❌ 换脸处理异常:', error);
      setFailedTemplates(prev => ({
        ...prev,
        [templateId]: error.message || '网络请求失败，请重试'
      }));
    } finally {
      setIsProcessing(false);
    }
  };

  // 页面加载时处理第一张模板
  useEffect(() => {
    if (albumData.template_list.length > 0) {
      const firstTemplateId = albumData.template_list[0].template_id;
      processTemplate(firstTemplateId);
    }
  }, []);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleSavePress = async () => {
    const userId = authService.getCurrentUserId();
    if (!userId) {
      Alert.alert('😔 保存失败', '小主，请先登录后再保存作品哦～');
      return;
    }

    // 检查是否有任何换脸结果
    const hasAnyResults = Object.keys(fusionResults).length > 0;
    if (!hasAnyResults) {
      Alert.alert('😅 保存失败', '小主，请先完成换脸后再保存作品吧～');
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
            result_image: fusionResult,
          });
        }
      });
      
      // 如果没有换脸结果，提示用户
      if (resultData.length === 0) {
        Alert.alert('😅 保存失败', '小主，还没有完成任何换脸，请先完成换脸后再保存吧～');
        return;
      }

      // 构建用户作品数据
      const workData: Omit<UserWorkModel, '_id'> = {
        uid: userId,
        activity_id: activityId,
        activity_title: albumData.album_name, // 使用相册名称作为活动标题
        activity_description: albumData.album_description,
        activity_image: albumData.album_image,
        album_id: albumData.album_id,
        likes: '0',
        is_public: '1', // 默认公开
        download_count: '0',
        result_data: resultData,
        ext_data: JSON.stringify({
          selfie_url: selfieUrl,
          completed_templates: resultData.map(r => r.template_id),
          total_templates: albumData.template_list.length,
          fusion_time: Date.now(),
        }),
        created_at: Date.now(),
        updated_at: Date.now(),
      };

      console.log('🔄 开始保存用户作品:', workData);

      const result = await userWorkService.createWork(workData);

      if (result.success) {
        Alert.alert(
          '🎉 保存成功',
          `太棒了！已保存 ${resultData.length} 个换脸作品到云端，可以在个人中心查看哦～`,
          [
            { text: '好的', onPress: () => console.log('作品保存成功') }
          ]
        );
      } else {
        Alert.alert('😢 保存失败', result.error?.message || '哎呀，保存作品失败了，再试一次吧～');
      }
    } catch (error: any) {
      console.error('❌ 保存作品异常:', error);
      Alert.alert('😱 保存失败', error.message || '哎呀，保存作品时出错了，再试一次吧～');
    }
  };

  const handleSharePress = () => {
    // 获取当前选中的换脸结果
    const currentResult = selectedResult;
    
    if (!currentResult) {
      Alert.alert('提示', '请先完成换脸后再分享');
      return;
    }
    
    // 显示分享Modal
    setShareImageUrl(currentResult);
    setShowShareModal(true);
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

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    
    // 如果该模板还没有换脸结果，则发起请求
    if (!fusionResults[templateId]) {
      processTemplate(templateId);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" translucent />
      
      {/* 返回按钮 - 浮动在左上角 */}
      <TouchableOpacity style={styles.floatingBackButton} onPress={handleBackPress}>
        <FontAwesome name="arrow-left" size={12} color="#fff" />
      </TouchableOpacity>

      {/* 图片对比区域 - 顶到页面顶部 */}
      <View style={styles.imageComparisonContainer}>
        {selectedTemplate ? (
          <ImageComparison
            beforeImage={selectedTemplate.template_url} // 默认显示模板图片
            afterImage={selectedResult || selectedTemplate.template_url} // 如果有结果则显示结果，否则显示模板
            width={screenWidth}
            height={screenHeight * 0.7}
          />
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

      {/* 底部信息区域 */}
      <View style={styles.bottomContainer}>
        {/* 模板选择列表 */}
        <View style={styles.templateListContainer}>
          <Text style={styles.templateListTitle}>选择作品</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.templateList}
          >
            {albumData.template_list.map((template) => {
              const isFailed = failedTemplates[template.template_id];
              const isCurrentProcessing = isProcessing && selectedTemplateId === template.template_id;
              
              return (
                <TouchableOpacity
                  key={template.template_id}
                  style={[
                    styles.templateItem,
                    selectedTemplateId === template.template_id && styles.selectedTemplateItem,
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
                      <Text style={styles.failedText}>😔 小脸有点害羞，再试一次吧</Text>
                      <TouchableOpacity
                        style={styles.retryButton}
                        onPress={() => {
                          // 1. 先清除失败状态
                          setFailedTemplates(prev => {
                            const newFailed = { ...prev };
                            delete newFailed[template.template_id];
                            return newFailed;
                          });
                          
                          // 2. 设置选中状态
                          setSelectedTemplateId(template.template_id);
                          
                          // 3. 最后处理模板
                          processTemplate(template.template_id);
                        }}
                      >
                        <FontAwesome name="magic" size={16} color="#fff" />
                        <Text style={styles.retryText}>再来一次</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  
                  {/* 处理中状态 */}
                  {isCurrentProcessing && (
                    <View style={styles.processingOverlay}>
                      <ActivityIndicator size="small" color="#fff" />
                      <Text style={styles.processingText}>AI正在认真创作中...</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 操作按钮 */}
        <View style={styles.actionButtonsContainer}>
          <GradientButton
            title="保存作品"
            onPress={handleSavePress}
            variant="primary"
            size="large"
            style={styles.saveButton}
            fontSize={16}
            borderRadius={22}
          />
          
          {/* <GradientButton
            title="分享"
            onPress={handleSharePress}
            variant="secondary"
            size="large"
            style={styles.shareButton}
            fontSize={16}
            borderRadius={22}
          /> */}
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
  floatingBackButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  backIcon: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  imageComparisonContainer: {
    flex: 1,
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
    backgroundColor: '#131313',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  templateListContainer: {
    marginBottom: 20,
    marginTop: 20,
  },
  templateListTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  templateList: {
    paddingRight: 20,
  },
  templateItem: {
    marginRight: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
    padding: 2, // 预留border空间
  },
  selectedTemplateItem: {
    backgroundColor: 'rgba(94, 231, 223, 0.2)',
    borderWidth: 2,
    borderColor: '#5EE7DF',
    padding: 0, // 选中时移除padding，用border填充
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
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  failedText: {
    color: '#FF6B6B',
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
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
    gap: 12,
    marginTop: 10,
  },
  saveButton: {
    flex: 1,
  },
  shareButton: {
    flex: 1,
  },
});

export default CreationResultScreen;

