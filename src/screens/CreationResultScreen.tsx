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
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { ImageComparison } from '../components/ImageComparison';
import { callFaceFusionCloudFunction } from '../services/tcb/tcb';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type CreationResultScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type CreationResultScreenRouteProp = RouteProp<RootStackParamList, 'CreationResult'>;


const CreationResultScreen: React.FC = () => {
  const navigation = useNavigation<CreationResultScreenNavigationProp>();
  const route = useRoute<CreationResultScreenRouteProp>();
  const { albumData, selfieUrl, activityId } = route.params;
  
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    albumData.template_list[0]?.template_id || ''
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [fusionResults, setFusionResults] = useState<{ [templateId: string]: string }>({});
  const [showComparison, setShowComparison] = useState(false);
  const [failedTemplates, setFailedTemplates] = useState<{ [templateId: string]: string }>({});

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
      
      // 调用真实的换脸云函数
      const result = await callFaceFusionCloudFunction({
        projectId:  activityId,
        modelId: templateId,
        imageUrl: selfieUrl,
      });
      
      if (result.code === 0 && result.data) {
        console.log(`✅ 模板 ${templateId} 换脸成功`);
        console.log(`🖼️ 换脸结果: ${result.data.FusedImage}`);
        
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

  const handleSavePress = () => {
    Alert.alert(
      '保存作品',
      '作品已保存到本地相册',
      [
        { text: '确定', onPress: () => console.log('作品已保存') }
      ]
    );
  };

  const handleSharePress = () => {
    Alert.alert(
      '分享作品',
      '分享功能开发中...',
      [
        { text: '确定' }
      ]
    );
  };

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
        <Text style={styles.backIcon}>←</Text>
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
            <Text style={styles.loadingText}>🎨 美颜换换正在认真创作中</Text>
            <Text style={styles.loadingSubtext}>✨ 请稍候，马上就好啦</Text>
          </View>
        </View>
      )}

      {/* 底部信息区域 */}
      <View style={styles.bottomContainer}>
        {/* 模板选择列表 */}
        <View style={styles.templateListContainer}>
          <Text style={styles.templateListTitle}>选择模板</Text>
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
                        <Text style={styles.retryText}>✨ 再来一次</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  
                  {/* 处理中状态 */}
                  {isCurrentProcessing && (
                    <View style={styles.processingOverlay}>
                      <Text style={styles.processingText}>🎨 AI正在认真创作中...</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 操作按钮 */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSavePress}>
            <Text style={styles.saveButtonText}>保存作品</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.shareButton} onPress={handleSharePress}>
            <Text style={styles.shareButtonText}>分享</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
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
    backgroundColor: '#000',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  templateListContainer: {
    marginBottom: 20,
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
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#5EE7DF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  shareButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CreationResultScreen;

