import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Dimensions,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import * as ImagePicker from 'react-native-image-picker';
import { PermissionsAndroid, Platform } from 'react-native';
import { useAppDispatch } from '../store/hooks';
import { uploadSelfie } from '../store/middleware/asyncMiddleware';
import { cosService } from '../services/cos/COSService';
import { userDataService } from '../services/database/userDataService';
import { authService } from '../services/auth/authService';

type SelfieGuideScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const SelfieGuideScreen: React.FC = () => {
  const navigation = useNavigation<SelfieGuideScreenNavigationProp>();
  const dispatch = useAppDispatch();
  const [showModal, setShowModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  const handleClosePress = () => {
    navigation.goBack();
  };

  const handleContinuePress = () => {
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
  };

  const requestPermissions = async (source: 'library' | 'camera') => {
    if (Platform.OS === 'android') {
      if (source === 'camera') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: '相机权限',
            message: '需要相机权限来拍摄照片',
            buttonNeutral: '稍后询问',
            buttonNegative: '取消',
            buttonPositive: '确定',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          {
            title: '存储权限',
            message: '需要存储权限来访问相册',
            buttonNeutral: '稍后询问',
            buttonNegative: '取消',
            buttonPositive: '确定',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
    }
    return true; // iOS 权限在 Info.plist 中配置
  };

  const handlePhotoLibrary = async () => {
    setShowModal(false);
    const hasPermission = await requestPermissions('library');
    if (hasPermission) {
      await selectImage('library');
    } else {
      Alert.alert('权限被拒绝', '需要相册权限才能选择图片');
    }
  };

  const handleCamera = async () => {
    setShowModal(false);
    const hasPermission = await requestPermissions('camera');
    if (hasPermission) {
      await selectImage('camera');
    } else {
      Alert.alert('权限被拒绝', '需要相机权限才能拍照');
    }
  };

  const selectImage = async (source: 'library' | 'camera') => {
    try {
      console.log(`开始选择图片，来源: ${source}`);
      
      const options: ImagePicker.ImageLibraryOptions = {
        mediaType: 'photo',
        quality: 1,
        includeBase64: true,
      };

      let result: ImagePicker.ImagePickerResponse;

      if (source === 'library') {
        console.log('调用相册选择器...');
        result = await ImagePicker.launchImageLibrary(options);
        console.log('相册选择结果:', result);
      } else {
        console.log('调用相机...');
        result = await ImagePicker.launchCamera(options);
        console.log('相机拍照结果:', result);
      }

      if (result.didCancel) {
        console.log('用户取消了选择');
        return;
      }

      if (result.errorCode) {
        console.error('ImagePicker错误:', result.errorCode, result.errorMessage);
        Alert.alert('错误', `选择图片失败: ${result.errorMessage}`);
        return;
      }

      if (result.assets && result.assets[0]) {
        console.log('选择成功，开始上传流程');
        await handleImageUpload(result.assets[0]);
      } else {
        console.log('没有选择到图片');
      }
    } catch (error) {
      console.error('选择图片失败:', error);
      Alert.alert('错误', `选择图片失败: ${error}`);
    }
  };

  const handleImageUpload = async (asset: ImagePicker.Asset) => {
    try {
      setIsUploading(true);
      setUploadProgress(0);

      if (!asset.uri) {
        throw new Error('图片路径无效');
      }

      // 1. 上传图片到COS
      console.log('开始上传图片到COS:', asset.uri);
      const uploadResult = await cosService.uploadFile(
        asset.uri,
        `selfie_${Date.now()}.jpg`,
        'selfies'
      );

      if (!uploadResult.success || !uploadResult.url) {
        throw new Error(uploadResult.error || 'COS上传失败');
      }

      console.log('COS上传成功:', uploadResult.url);
      setUploadProgress(50);

      // 2. 调用Redux异步操作上传自拍照
      console.log('开始调用Redux上传自拍照');
      const imageData = {
        uri: asset.uri,
        type: asset.type || 'image/jpeg',
        name: asset.fileName || `selfie_${Date.now()}.jpg`,
      };

      const selfieResult = await dispatch(uploadSelfie({ imageData })).unwrap();
      console.log('Redux上传自拍照成功:', selfieResult);
      setUploadProgress(80);

      // 3. 更新用户信息（如果有用户ID）
      try {
        const currentUserId = authService.getCurrentUserId();
        if (currentUserId) {
          console.log('开始更新用户信息');
          await userDataService.updateUserSelfie(currentUserId, uploadResult.url);
          console.log('用户信息更新成功');
        }
      } catch (error) {
        console.warn('更新用户信息失败:', error);
        // 不影响主流程
      }

      setUploadProgress(100);
      
      // 上传完成后延迟返回主页
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        Alert.alert(
          '上传成功',
          '自拍照上传成功！现在可以使用AI风格了。',
          [
            {
              text: '确定',
              onPress: () => navigation.navigate('NewHome'),
            },
          ]
        );
      }, 500);

    } catch (error: any) {
      console.error('上传失败:', error);
      Alert.alert('上传失败', error.message || '图片上传失败，请重试');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent={true} backgroundColor="transparent" />
      
      {/* 关闭按钮 */}
      <TouchableOpacity style={styles.closeButton} onPress={handleClosePress}>
        <Text style={styles.closeIcon}>✕</Text>
      </TouchableOpacity>

      {/* 主要内容 */}
      <View style={styles.content}>
        {/* 标题 */}
        <Text style={styles.title}>创作AI头像</Text>
        <Text style={styles.subtitle}>别担心,这是一次性操作</Text>

        {/* 流程说明 */}
        <View style={styles.processContainer}>
          <View style={styles.processStep}>
            <View style={styles.photoContainer}>
              <View style={styles.photoPlaceholder} />
              <View style={styles.photoPlaceholder} />
              <View style={styles.photoPlaceholder} />
            </View>
            <Text style={styles.processText}>Your photos</Text>
          </View>

          <View style={styles.arrowContainer}>
            <Text style={styles.arrow}>→</Text>
            <Text style={styles.arrow}>→</Text>
          </View>

          <View style={styles.processStep}>
            <View style={styles.photoContainer}>
              <View style={styles.photoPlaceholder} />
            </View>
            <Text style={styles.processText}>AI profile</Text>
          </View>
        </View>

        {/* 结果说明 */}
        <Text style={styles.resultText}>Amazing results in one tap</Text>

        {/* 预览图片区域 */}
        <View style={styles.previewContainer}>
          <View style={styles.previewImage}>
            {/* 这里可以放置预览图片 */}
          </View>
        </View>
      </View>

      {/* 底部按钮 */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.continueButton, isUploading && styles.continueButtonDisabled]}
          onPress={handleContinuePress}
          disabled={isUploading}
        >
          {isUploading ? (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.uploadingText}>上传中 {uploadProgress}%</Text>
            </View>
          ) : (
            <Text style={styles.continueButtonText}>继续</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* 选择图片来源弹窗 */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleModalClose}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleModalClose}
        >
          <View style={styles.modalContainer}>
            <TouchableOpacity
              style={styles.modalContent}
              activeOpacity={1}
              onPress={() => {}}
            >
              {/* 关闭按钮 */}
              <TouchableOpacity style={styles.modalCloseButton} onPress={handleModalClose}>
                <Text style={styles.modalCloseIcon}>✕</Text>
              </TouchableOpacity>

              {/* 标题 */}
              <Text style={styles.modalTitle}>从...拍照</Text>

              {/* 选择按钮 */}
              <TouchableOpacity style={styles.modalButton} onPress={handlePhotoLibrary}>
                <Text style={styles.modalButtonText}>照片图库</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalButton} onPress={handleCamera}>
                <Text style={styles.modalButtonText}>相机</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeIcon: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingTop: 120,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 40,
    opacity: 0.8,
  },
  processContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  processStep: {
    alignItems: 'center',
  },
  photoContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  photoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  processText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  arrowContainer: {
    alignItems: 'center',
  },
  arrow: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 2,
  },
  resultText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 30,
  },
  previewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  continueButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#666',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  uploadingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    maxWidth: 300,
  },
  modalContent: {
    backgroundColor: '#333',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseIcon: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    marginTop: 10,
  },
  modalButton: {
    width: '100%',
    backgroundColor: '#555',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SelfieGuideScreen;
