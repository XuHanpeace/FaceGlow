import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { launchCamera, launchImageLibrary, ImagePickerResponse, MediaType } from 'react-native-image-picker';
import nativeCOSService, { COSConfig } from '../services/nativeCOS';

const COSUploadTestScreen: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const isDarkMode = useColorScheme() === 'dark';

  // COS配置
  const COS_CONFIG: COSConfig = {
    secretId: 'SECRETID',
    secretKey: 'SECRETKEY',
    bucket: 'myhh',
    region: 'ap-nanjing',
    appId: '1257391807',
  };

  useEffect(() => {
    checkInitialization();
    setupEventListeners();
  }, []);

  // 检查初始化状态
  const checkInitialization = async () => {
    try {
      const initialized = await nativeCOSService.isInitialized();
      setIsInitialized(initialized);
    } catch (error) {
      console.error('检查初始化状态失败:', error);
    }
  };

  // 设置事件监听器
  const setupEventListeners = () => {
    // 监听上传进度
    const progressListener = nativeCOSService.onUploadProgress((progress) => {
      setUploadProgress(progress.progress);
    });

    // 监听上传完成
    const completeListener = nativeCOSService.onUploadComplete((result) => {
      setIsUploading(false);
      if (result.success && result.url) {
        setUploadedImageUrl(result.url);
        Alert.alert('成功', '图片上传成功！');
      } else {
        Alert.alert('失败', `上传失败: ${result.error}`);
      }
    });

    // 清理监听器
    return () => {
      progressListener.remove();
      completeListener.remove();
    };
  };

  // 初始化COS服务
  const initializeCOS = async () => {
    try {
      if (COS_CONFIG.secretId === 'SECRETID' || COS_CONFIG.secretKey === 'SECRETKEY') {
        Alert.alert(
          '配置提示', 
          '请先在代码中配置您的真实COS信息：\n\n' +
          '1. 替换 SECRETID 为您的真实 SecretId\n' +
          '2. 替换 SECRETKEY 为您的真实 SecretKey\n' +
          '3. 确认 bucket、region、appId 配置正确',
          [{ text: '知道了', style: 'default' }]
        );
        return;
      }

      await nativeCOSService.initialize(COS_CONFIG);
      setIsInitialized(true);
      Alert.alert('成功', 'COS服务初始化成功！');
    } catch (error) {
      Alert.alert('错误', 'COS服务初始化失败：' + error);
    }
  };

  // 拍照
  const takePhoto = () => {
    const options = {
      mediaType: 'photo' as MediaType,
      quality: 'high' as any,
      saveToPhotos: false,
    };

    launchCamera(options, (response: ImagePickerResponse) => {
      if (response.didCancel) {
        console.log('用户取消拍照');
      } else if (response.errorCode) {
        Alert.alert('错误', '拍照失败：' + response.errorMessage);
      } else if (response.assets && response.assets[0]) {
        const imageUri = response.assets[0].uri;
        if (imageUri) {
          setSelectedImage(imageUri);
          setUploadedImageUrl(null);
        }
      }
    });
  };

  // 选择相册图片
  const selectFromGallery = () => {
    const options = {
      mediaType: 'photo' as MediaType,
      quality: 'high' as any,
      selectionLimit: 1,
    };

    launchImageLibrary(options, (response: ImagePickerResponse) => {
      if (response.didCancel) {
        console.log('用户取消选择');
      } else if (response.errorCode) {
        Alert.alert('错误', '选择图片失败：' + response.errorMessage);
      } else if (response.assets && response.assets[0]) {
        const imageUri = response.assets[0].uri;
        if (imageUri) {
          setSelectedImage(imageUri);
          setUploadedImageUrl(null);
        }
      }
    });
  };

  // 上传图片到COS
  const uploadImage = async () => {
    if (!selectedImage) {
      Alert.alert('提示', '请先选择或拍摄图片');
      return;
    }

    if (!isInitialized) {
      Alert.alert('提示', '请先初始化COS服务');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // 获取文件名
      const fileName = selectedImage.split('/').pop() || 'image.jpg';
      
      // 上传文件
      await nativeCOSService.uploadFile(selectedImage, fileName, 'uploads');
      
    } catch (error) {
      setIsUploading(false);
      Alert.alert('错误', '上传失败：' + error);
    }
  };

  // 清除选择
  const clearSelection = () => {
    setSelectedImage(null);
    setUploadedImageUrl(null);
    setUploadProgress(0);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDarkMode ? '#000' : '#fff' }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: isDarkMode ? '#fff' : '#000' }]}>
          COS图片上传验证
        </Text>
        <Text style={[styles.subtitle, { color: isDarkMode ? '#ccc' : '#666' }]}>
          测试拍照上传和相册上传功能
        </Text>
      </View>

      {/* COS状态 */}
      <View style={[styles.statusCard, { backgroundColor: isDarkMode ? '#333' : '#f5f5f5' }]}>
        <Text style={[styles.statusTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
          COS服务状态
        </Text>
        <View style={styles.statusRow}>
          <Text style={[styles.statusLabel, { color: isDarkMode ? '#ccc' : '#666' }]}>
            初始化状态：
          </Text>
          <Text style={[styles.statusValue, { color: isInitialized ? '#4CAF50' : '#f44336' }]}>
            {isInitialized ? '已初始化' : '未初始化'}
          </Text>
        </View>
        {isInitialized && (
          <View style={styles.statusRow}>
            <Text style={[styles.statusLabel, { color: isDarkMode ? '#ccc' : '#666' }]}>
              存储桶：
            </Text>
            <Text style={[styles.statusValue, { color: isDarkMode ? '#fff' : '#000' }]}>
              {COS_CONFIG.bucket}
            </Text>
          </View>
        )}
      </View>

      {/* 图片选择区域 */}
      <View style={[styles.imageSection, { backgroundColor: isDarkMode ? '#333' : '#f5f5f5' }]}>
        <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
          选择图片
        </Text>
        
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.button} onPress={takePhoto}>
            <Text style={styles.buttonText}>📷 拍照</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.button} onPress={selectFromGallery}>
            <Text style={styles.buttonText}>🖼️ 相册</Text>
          </TouchableOpacity>
        </View>

        {selectedImage && (
          <View style={styles.selectedImageContainer}>
            <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
            <TouchableOpacity style={styles.clearButton} onPress={clearSelection}>
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* 上传区域 */}
      {selectedImage && (
        <View style={[styles.uploadSection, { backgroundColor: isDarkMode ? '#333' : '#f5f5f5' }]}>
          <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
            上传到COS
          </Text>
          
          <TouchableOpacity 
            style={[styles.uploadButton, isUploading && styles.uploadButtonDisabled]} 
            onPress={uploadImage}
            disabled={isUploading}
          >
            {isUploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.uploadButtonText}>🚀 开始上传</Text>
            )}
          </TouchableOpacity>

          {isUploading && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[styles.progressFill, { width: `${uploadProgress}%` }]} 
                />
              </View>
              <Text style={[styles.progressText, { color: isDarkMode ? '#fff' : '#000' }]}>
                {uploadProgress.toFixed(1)}%
              </Text>
            </View>
          )}
        </View>
      )}

      {/* 上传结果 */}
      {uploadedImageUrl && (
        <View style={[styles.resultSection, { backgroundColor: isDarkMode ? '#333' : '#f5f5f5' }]}>
          <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
            上传结果
          </Text>
          
          <View style={styles.resultContainer}>
            <Image source={{ uri: uploadedImageUrl }} style={styles.resultImage} />
            <Text style={[styles.resultUrl, { color: isDarkMode ? '#4CAF50' : '#4CAF50' }]}>
              {uploadedImageUrl}
            </Text>
          </View>
        </View>
      )}

      {/* 功能说明 */}
      <View style={[styles.infoSection, { backgroundColor: isDarkMode ? '#333' : '#f5f5f5' }]}>
        <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
          功能说明
        </Text>
        <Text style={[styles.infoText, { color: isDarkMode ? '#ccc' : '#666' }]}>
          • 拍照上传：使用设备摄像头拍摄照片并上传到COS{'\n'}
          • 相册上传：从设备相册选择图片并上传到COS{'\n'}
          • 支持进度显示和上传结果预览{'\n'}
          • 自动生成唯一的文件路径和名称
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  statusCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  imageSection: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  selectedImageContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  selectedImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  clearButton: {
    position: 'absolute',
    top: -8,
    right: 60,
    backgroundColor: '#f44336',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  uploadSection: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  uploadButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  uploadButtonDisabled: {
    backgroundColor: '#ccc',
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
  },
  resultSection: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  resultContainer: {
    alignItems: 'center',
  },
  resultImage: {
    width: 150,
    height: 150,
    borderRadius: 8,
    resizeMode: 'cover',
    marginBottom: 12,
  },
  resultUrl: {
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  infoSection: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default COSUploadTestScreen;
