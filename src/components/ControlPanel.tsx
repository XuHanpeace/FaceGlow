import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Text,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'react-native-image-picker';
import { callFusion } from '../services/tcb';
import { ImageComparison } from './ImageComparison';
import { ModelTemplate } from './TemplateGrid';
import cosService, { COSUploadResult } from '../services/COSService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ControlPanelProps {
  selectedTemplate: ModelTemplate;
  onUpload?: (imageUri: string) => void;
  onGenerate?: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  selectedTemplate,
  onUpload: _onUpload,
  onGenerate: _onGenerate,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [userImage, setUserImage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const selectedImage = selectedTemplate.imageUrl;
  const modelId = selectedTemplate.modelId;
  const animatedHeight = useRef(new Animated.Value(80)).current;
  // 获取屏幕高度
  const screenHeight = Dimensions.get('window').height;
  const expandedHeight = screenHeight * 0.80; // 屏幕高度的75%

  // 监听 generatedImage 变化，自动调整高度
  useEffect(() => {
    if (generatedImage && isExpanded) {
      // 当有生成的图片且面板已展开时，自动调整到75%高度
      Animated.spring(animatedHeight, {
        toValue: expandedHeight,
        useNativeDriver: false,
        friction: 8,
        tension: 40,
      }).start();
    }
  }, [generatedImage, isExpanded, animatedHeight, expandedHeight]);

  // 监听 selectedTemplate 变化，重置相关数据
  useEffect(() => {
    // 重置生成的图片
    setGeneratedImage(null);
    // 重置加载状态
    setIsLoading(false);
    // 如果面板已展开，重置到默认展开高度
    if (isExpanded) {
      Animated.spring(animatedHeight, {
        toValue: 400,
        useNativeDriver: false,
        friction: 8,
        tension: 40,
      }).start();
    }
  }, [selectedTemplate.id, isExpanded, animatedHeight]);

  // 组件挂载时从本地存储加载已上传的图片URL
  useEffect(() => {
    loadUploadedImageUrl();
  }, []);

  // 从本地存储加载已上传的图片URL
  const loadUploadedImageUrl = async () => {
    try {
      const savedUrl = await AsyncStorage.getItem('UPLOADED_IMAGE_URL');
      if (savedUrl) {
        setUploadedImageUrl(savedUrl);
        setUserImage(savedUrl);
        console.log('📱 从本地存储加载已上传的图片URL:', savedUrl);
      }
    } catch (error) {
      console.error('❌ 加载本地存储的图片URL失败:', error);
    }
  };

  // 保存图片URL到本地存储
  const saveImageUrlToStorage = async (imageUrl: string) => {
    try {
      await AsyncStorage.setItem('UPLOADED_IMAGE_URL', imageUrl);
      console.log('💾 图片URL已保存到本地存储:', imageUrl);
    } catch (error) {
      console.error('❌ 保存图片URL到本地存储失败:', error);
    }
  };

  const toggleExpand = () => {
    // 如果有生成的图片，展开到屏幕高度的75%，否则展开到400
    const toValue = isExpanded ? 80 : (generatedImage ? expandedHeight : 400);
    setIsExpanded(!isExpanded);
    Animated.spring(animatedHeight, {
      toValue,
      useNativeDriver: false,
      friction: 8,
      tension: 40,
    }).start();
  };

  const handleImageSelection = async () => {
    try {
      const options: ImagePicker.ImageLibraryOptions = {
        mediaType: 'photo',
        quality: 1,
      };

      // 显示操作表单让用户选择
      Alert.alert(
        '选择图片来源',
        '请选择图片来源',
        [
          {
            text: '相册',
            onPress: async () => {
              try {
                const result = await ImagePicker.launchImageLibrary(options);
                handleImageResult(result);
              } catch (error) {
                console.error('❌ 从相册选择图片失败:', error);
                Alert.alert('错误', '从相册选择图片失败');
              }
            },
          },
          {
            text: '相机',
            onPress: async () => {
              try {
                const result = await ImagePicker.launchCamera(options);
                handleImageResult(result);
              } catch (error) {
                console.error('❌ 从相机拍照失败:', error);
                Alert.alert('错误', '从相机拍照失败');
              }
            },
          },
          {
            text: '取消',
            style: 'cancel',
          },
        ],
        { cancelable: true },
      );
    } catch (error) {
      console.error('❌ 选择图片失败:', error);
      Alert.alert('错误', '选择图片失败');
    }
  };

  const handleImageResult = async (result: ImagePicker.ImagePickerResponse) => {
    if (!result.didCancel && result.assets && result.assets[0]) {
      const asset = result.assets[0];
      const base64Image = asset.base64;
      const filePath = asset.uri;
      const fileName = asset.fileName || `image_${Date.now()}.jpg`;

      if (base64Image) {
        // 设置base64图片到state（用于显示）
        setUserImage(`data:image/jpeg;base64,${base64Image}`);
      }

      if (filePath) {
        try {
          setIsUploading(true);
          console.log('📤 开始上传图片到COS...');
          console.log('  - 文件路径:', filePath);
          console.log('  - 文件名:', fileName);

          // 调用cosService上传图片
          const uploadResult = await cosService.uploadFile(filePath, fileName, 'face-swap');

          if (uploadResult.success && uploadResult.url) {
            console.log('✅ 图片上传成功！');
            console.log('  - 图片URL:', uploadResult.url);
            console.log('  - 文件Key:', uploadResult.fileKey);
            console.log('  - ETag:', uploadResult.etag);

            // 保存到state
            setUploadedImageUrl(uploadResult.url);
            setUserImage(uploadResult.url);

            // 保存到本地存储
            await saveImageUrlToStorage(uploadResult.url);

            // 显示成功提示
            Alert.alert(
              '上传成功',
              `图片已成功上传到COS！\n\n图片地址：${uploadResult.url}`,
              [{ text: '知道了', style: 'default' }]
            );

            // 如果面板未展开，自动展开
            if (!isExpanded) {
              toggleExpand();
            }
          } else {
            throw new Error(uploadResult.error || '上传失败');
          }
        } catch (error) {
          console.error('❌ 图片上传失败:', error);
          Alert.alert(
            '上传失败',
            `图片上传失败：${error}\n\n请检查网络连接或稍后重试`,
            [{ text: '知道了', style: 'default' }]
          );
          
          // 上传失败时，如果之前有已上传的图片，恢复显示
          if (uploadedImageUrl) {
            setUserImage(uploadedImageUrl);
          }
        } finally {
          setIsUploading(false);
        }
      }
    }
  };



  const handleGenerate = async () => {
    try {
      setIsLoading(true);
      setGeneratedImage(null); // 清空之前的结果

      const params = {
        projectId: 'at_1888958525505814528',
        modelId: modelId,
        imageUrl: userImage,
      };

      const result = await callFusion(params);
      console.log('result', result);

      // 设置生成的图片
      if (result && result.data && result.data.FusedImage) {
        setGeneratedImage(result.data.FusedImage);
      }
    } catch (error) {
      // console.error('完整错误对象:', JSON.stringify(error, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  function renderContent() {
    if (generatedImage && isExpanded && selectedImage) {
      return (
        <View style={styles.resultContainer}>
          <ImageComparison
            beforeImage={selectedImage}
            afterImage={generatedImage}
            width={PREVIEW_IMAGE_WIDTH}
            height={400}
          />
        </View>
      );
    }
    if (selectedImage) {
      return (
        <View style={styles.imageRow}>
          <Image
            source={{ uri: selectedImage }}
            style={[styles.selectedImage, isExpanded && styles.expandedImage]}
          />
          <Image
            source={{ uri: 'https://img.icons8.com/?size=100&id=7811&format=png&color=000000' }}
            style={[styles.arrowIcon, isExpanded && styles.expandedArrow]}
          />
          <TouchableOpacity onPress={handleImageSelection}>
            {userImage ? (
              <Image
                source={{ uri: userImage }}
                style={[styles.selectedImage, isExpanded && styles.expandedImage]}
              />
            ) : (
              <View style={[styles.addButton, isExpanded && styles.expandedImage]}>
                <Image
                  source={{
                    uri: 'https://img.icons8.com/?size=100&id=1501&format=png&color=000000',
                  }}
                  style={styles.plusIcon}
                />
              </View>
            )}
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={[styles.addButton, isExpanded && styles.expandedImage]}
        onPress={handleImageSelection}
      >
        {userImage ? (
          <Image
            source={{ uri: userImage }}
            style={[styles.selectedImage, isExpanded && styles.expandedImage]}
          />
        ) : (
          <Image
            source={{
              uri: 'https://img.icons8.com/?size=100&id=1501&format=png&color=000000',
            }}
            style={styles.plusIcon}
          />
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.controlBar, { height: animatedHeight }]}>
        <TouchableOpacity style={styles.expandButton} onPress={toggleExpand}>
          <Image
            source={{ uri: 'https://img.icons8.com/?size=100&id=2775&format=png&color=000000' }}
            style={[styles.arrowIcon, isExpanded && styles.arrowIconRotated]}
          />
        </TouchableOpacity>

        {isExpanded && <Text style={styles.title}>加入你的正脸照来换脸</Text>}

        <View style={styles.contentContainer}>{renderContent()}</View>

        {isExpanded && userImage && (
          <TouchableOpacity
            style={[styles.generateButton, (isLoading || isUploading) && styles.generateButtonDisabled]}
            onPress={handleGenerate}
            disabled={isLoading || isUploading}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#000" />
                <Text style={styles.loadingText}>生成中...</Text>
              </View>
            ) : isUploading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#000" />
                <Text style={styles.loadingText}>上传中...</Text>
              </View>
            ) : (
              <Text style={styles.generateButtonText}>开始生成</Text>
            )}
          </TouchableOpacity>
        )}

        {!isExpanded && !userImage && (
          <TouchableOpacity
            style={[styles.uploadButton, isUploading && styles.uploadButtonDisabled]}
            onPress={() => {
              handleImageSelection();
            }}
            disabled={isUploading}
          >
            {isUploading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#000" />
                <Text style={styles.uploadButtonText}>上传中...</Text>
              </View>
            ) : (
              <Text style={styles.uploadButtonText}>添加</Text>
            )}
          </TouchableOpacity>
        )}

        {/* 显示上传状态信息 */}
        {isUploading && (
          <View style={styles.uploadStatusContainer}>
            <Text style={styles.uploadStatusText}>正在上传图片到COS...</Text>
          </View>
        )}
      </Animated.View>
    </View>
  );
};

const PREVIEW_IMAGE_WIDTH = Dimensions.get('window').width - 32;
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  controlBar: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: '#fff',
    height: 80,
    paddingHorizontal: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  expandButton: {
    position: 'absolute',
    left: 16,
    top: 16,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  arrowIcon: {
    width: 20,
    height: 20,
    tintColor: '#666',
  },
  arrowIconRotated: {
    transform: [{ rotate: '180deg' }],
  },
  selectedImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  expandedImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  addButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusIcon: {
    width: '48%',
    height: '48%',
    tintColor: '#666',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButton: {
    position: 'absolute',
    right: 16,
    top: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#5EE7DF',
    borderRadius: 20,
    zIndex: 1,
  },
  uploadButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '700',
  },
  expandedPanel: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 80, // controlBar的高度
    left: 0,
    right: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  title: {
    position: 'absolute',
    top: 25,
    left: 70,
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  imageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  expandedArrow: {
    width: 40,
    height: 40,
  },
  generateButton: {
    width: 150,
    marginBottom: 30,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#5EE7DF',
    borderRadius: 25,
    alignSelf: 'center',
  },
  generateButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  generateButtonDisabled: {
    backgroundColor: '#ccc',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  resultContainer: {
    width: PREVIEW_IMAGE_WIDTH,
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 12,
    alignItems: 'center',
    overflow: 'hidden',
  },
  resultTitle: {
    color: '#000',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  resultImage: {
    height: 400,
    width: 600,
  },
  uploadStatusContainer: {
    position: 'absolute',
    top: 100, // 调整位置，避免与控制栏重叠
    left: 0,
    right: 0,
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    zIndex: 1,
  },
  uploadStatusText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  uploadedInfoContainer: {
    position: 'absolute',
    top: 100, // 调整位置，避免与控制栏重叠
    left: 0,
    right: 0,
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    zIndex: 1,
  },
  uploadedInfoText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  copyUrlButton: {
    marginTop: 5,
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: '#5EE7DF',
    borderRadius: 20,
  },
  copyUrlButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '700',
  },
  uploadButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.7,
  },
});

export default ControlPanel;
