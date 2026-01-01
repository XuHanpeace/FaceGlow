import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Modal,
  Alert,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FastImage from 'react-native-fast-image';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import * as ImagePicker from 'react-native-image-picker';
import { PermissionsAndroid, Platform, Linking } from 'react-native';
import { useAppDispatch } from '../store/hooks';
import { uploadSelfie, fetchUserProfile } from '../store/middleware/asyncMiddleware';
import { useUser } from '../hooks/useUser';
import { cosService } from '../services/cos/COSService';
import { userDataService } from '../services/database/userDataService';
import { authService } from '../services/auth/authService';
import { rewardService } from '../services/rewardService';
import { eventService } from '../services/eventService';
import GradientButton from '../components/GradientButton';
import BackButton from '../components/BackButton';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

const { width: screenWidth } = Dimensions.get('window');

type SelfieGuideScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// 推荐示例数据
const exampleSize = (screenWidth - 40 - 24) / 3;

const goodExamples = [
  {
    id: '1',
    image: require('../assets/good1.png'),
    label: '清晰正脸',
    description: '脸部清晰，表情自然',
  },
  {
    id: '2',
    image: require('../assets/good2.png'),
    label: '半身照',
    description: '避免逆光，肤色还原',
  },
  {
    id: '3',
    image: require('../assets/good3.png'),
    label: '人像突出',
    description: '背景干净，无强烈遮挡',
  },
];

// 应避免示例数据
const badExamples = [
  {
    id: '1',
    image: require('../assets/bad1.png'),
    label: '遮挡面部',
    description: '避免墨镜、口罩、头发挡住脸部',
  },
  {
    id: '2',
    image: require('../assets/bad2.png'),
    label: '未正对镜头',
    description: '侧脸或拍摄角度过大影响识别',
  },
  {
    id: '3',
    image: require('../assets/bad3.png'),
    label: '人像过小',
    description: '人物过小、模糊或未出现在画面中心',
  },
];

const SelfieGuideScreen: React.FC = () => {
  const navigation = useNavigation<SelfieGuideScreenNavigationProp>();
  const route = useRoute();
  const dispatch = useAppDispatch();
  const { setDefaultSelfieUrl } = useUser();
  const [showModal, setShowModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedImage, setSelectedImage] = useState<ImagePicker.Asset | null>(null);
  
  // 从路由参数获取是否为新用户
  const isNewUser = (route.params as { isNewUser?: boolean })?.isNewUser ?? false;

  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return '图片上传失败，请重试';
  };

  const handleClosePress = () => {
    navigation.goBack();
  };

  const handleChangePhoto = async () => {
    // 检查是否是真实用户
    const authResult = await authService.requireRealUser();
    
    if (!authResult.success) {
      if (authResult.error?.code === 'ANONYMOUS_USER' || 
          authResult.error?.code === 'NOT_LOGGED_IN') {
            navigation.navigate('NewAuth') 
      }
      return;
    }
    
    setShowModal(true);
  };

  const handleContinuePress = async () => {
    // 检查是否是真实用户
    const authResult = await authService.requireRealUser();
    
    if (!authResult.success) {
      if (authResult.error?.code === 'ANONYMOUS_USER' || 
          authResult.error?.code === 'NOT_LOGGED_IN') {
            navigation.navigate('NewAuth') 
      }
      return;
    }
    
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
  };

  /**
   * 引导用户去设置中开启权限
   * @param permissionType 权限类型：'album' | 'camera'
   */
  const guideToSettings = (permissionType: 'album' | 'camera') => {
    const permissionText = permissionType === 'album' 
      ? '我们仅用于保存您的作品图片，不会访问您的其他信息。我们重视并保护您的隐私安全。'
      : '我们仅用于拍摄照片，不会访问您的其他信息。我们重视并保护您的隐私安全。';
    
    Alert.alert(
      '"美颜换换"需要您的授权',
      permissionText,
      [
        {
          text: '取消',
          style: 'cancel',
        },
        {
          text: '去设置',
          onPress: async () => {
            try {
              await Linking.openSettings();
            } catch (error) {
              console.error('打开设置失败:', error);
              Alert.alert('提示', '无法打开设置，请手动前往系统设置开启权限');
            }
          },
        },
      ],
      { cancelable: true }
    );
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
      guideToSettings('album');
    }
  };

  const handleCamera = async () => {
    setShowModal(false);
    const hasPermission = await requestPermissions('camera');
    if (hasPermission) {
      await selectImage('camera');
    } else {
      guideToSettings('camera');
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
        // 统一视为权限问题，引导用户去设置开启权限
        const permissionType = source === 'camera' ? 'camera' : 'album';
        guideToSettings(permissionType);
        return;
      }

      if (result.assets && result.assets[0]) {
        console.log('选择成功，设置预览照片');
        setSelectedImage(result.assets[0]);
        setShowModal(false);
      } else {
        console.log('没有选择到图片');
      }
    } catch (error) {
      console.error('选择图片失败:', error);
      // 统一视为权限问题，引导用户去设置开启权限
      const permissionType = source === 'camera' ? 'camera' : 'album';
      guideToSettings(permissionType);
    }
  };

  const handleImageUpload = async () => {
    if (!selectedImage) {
      Alert.alert('提示', '请先选择一张照片');
      return;
    }

    const asset = selectedImage;
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
          
          // 获取用户现有数据，更新自拍列表
          const userResponse = await userDataService.getUserByUid();
          const existingSelfieList = userResponse.data?.record?.selfie_list || [];
          
          // 将新的自拍URL添加到列表中
          const updatedSelfieList = [...existingSelfieList, uploadResult.url];
          
          // uid 在底层自动获取
          await userDataService.updateUserData({
            selfie_url: uploadResult.url,
            selfie_list: updatedSelfieList
          });
          console.log('用户信息更新成功');
          
          // 设置新上传的自拍为默认自拍（倒序第一张）
          setDefaultSelfieUrl(uploadResult.url);
          console.log('设置新自拍为默认自拍:', uploadResult.url);
          
          // 如果是新用户（进入页面时已判断），发放首次上传奖励
          if (isNewUser) {
            console.log('🎁 新用户首次上传自拍，发放奖励');
            const rewardResult = await rewardService.grantFirstSelfieReward();
            if (rewardResult.success) {
              // 刷新用户数据（uid 在底层自动获取）
              await dispatch(fetchUserProfile());
              console.log('✅ 新用户奖励发放成功，新余额:', rewardResult.newBalance);
              
              // 关闭上传页面
              setIsUploading(false);
              setUploadProgress(0);
              
              // 先关闭页面
              handleClosePress();
              
              // 等待页面关闭动画完成（React Navigation 默认动画时长约 300ms），然后发送事件
              setTimeout(() => {
                eventService.emitShowRewardModal(10);
                console.log('📢 已发送奖励弹窗事件');
              }, 350);
              
              return; // 提前返回，不执行后续逻辑
            } else {
              console.error('发放新用户奖励失败:', rewardResult.error);
            }
          }
        }
      } catch (error) {
        console.warn('更新用户信息失败:', error);
        // 不影响主流程
      }

      setUploadProgress(100);
      
      // 非新用户：上传完成后延迟返回主页
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        Alert.alert(
          '上传成功',
          '自拍照上传成功！现在可以使用AI风格了。',
          [
            {
              text: '确定',
              onPress: () => handleClosePress()
            },
          ]
        );
      }, 500);

    } catch (error: unknown) {
      console.error('上传失败:', error);
      Alert.alert('上传失败', getErrorMessage(error));
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent={true} backgroundColor="transparent" />

      <SafeAreaView
        style={[styles.safeAreaHeader, { paddingTop: 0 }]}
      >
        <View style={styles.headerRow}>
        <View style={styles.headerPlaceholder} />
        <Text style={styles.headerTitle}>自拍小贴士</Text>
        <BackButton
          iconType="close"
          onPress={handleClosePress}
          absolute={false}
          style={styles.headerCloseButton}
        />
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* 为获得最佳效果 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>推荐拍摄案例</Text>
          <View style={styles.examplesContainer}>
            {goodExamples.map((example) => (
              <View key={example.id} style={styles.exampleItem}>
                <View style={styles.exampleImageContainer}>
                  <FastImage
                    source={example.image}
                    style={styles.exampleImage}
                    resizeMode={FastImage.resizeMode.cover}
                  />
                  <View style={styles.goodIconContainer}>
                    <FontAwesome name="check" size={16} color="#fff" />
                  </View>
                </View>
                <Text style={styles.exampleLabel}>{example.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 应避免的事项 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>建议避开的姿势</Text>
          <View style={styles.examplesContainer}>
            {badExamples.map((example) => (
              <View key={example.id} style={styles.exampleItem}>
                <View style={styles.exampleImageContainer}>
                  <FastImage
                    source={example.image}
                    style={styles.exampleImage}
                    resizeMode={FastImage.resizeMode.cover}
                  />
                  <View style={styles.badIconContainer}>
                    <FontAwesome name="close" size={16} color="#fff" />
                  </View>
                </View>
                <Text style={styles.exampleLabel}>{example.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 照片预览区域 */}
        {selectedImage && (
          <View style={styles.previewContainer}>
            <Image
              source={{ uri: selectedImage.uri }}
              style={styles.previewImage}
              resizeMode="cover"
            />
            <TouchableOpacity 
              style={[styles.changePhotoButton, isUploading && styles.changePhotoButtonDisabled]} 
              onPress={handleChangePhoto}
              disabled={isUploading}
            >
              <Text style={styles.changePhotoText}>更换自拍</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* 底部按钮 */}
      <View style={styles.bottomContainer}>
        {/* 新用户促销文案 */}
        {isNewUser && !selectedImage && (
          <View style={styles.promoContainer}>
            <View style={styles.promoText}>
              <Text style={styles.promoTextMain}>首次创作AI头像，立得</Text>
              <View style={styles.coinContainer}>
                <Image
                  source={require('../assets/mm-coins.png')}
                  style={styles.promoCoinIcon}
                  resizeMode="contain"
                />
                <Text style={styles.coinAmount}>10</Text>
              </View>
              <Text style={styles.promoTextMain}>美美币奖励～</Text>
            </View>
          </View>
        )}
        
        {selectedImage ? (
          <GradientButton
            title={isUploading ? `上传中 ${uploadProgress}%` : '上传自拍'}
            onPress={handleImageUpload}
            variant="primary"
            size="large"
            height={50}
            fontSize={16}
            borderRadius={25}
            disabled={isUploading}
            loading={isUploading}
            style={styles.uploadButton}
          />
        ) : (
          <GradientButton
            title="选择自拍"
            onPress={handleContinuePress}
            variant="primary"
            size="large"
            height={50}
            fontSize={16}
            borderRadius={25}
            style={styles.continueButton}
          />
        )}
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
              <Text style={styles.modalTitle}>选择您的自拍</Text>

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
    backgroundColor: '#131313',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  safeAreaHeader: {
    backgroundColor: '#131313',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  headerPlaceholder: {
    width: 32,
    height: 32,
  },
  headerCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  examplesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  exampleItem: {
    flex: 1,
    alignItems: 'center',
  },
  exampleImageContainer: {
    position: 'relative',
    width: exampleSize,
    height: exampleSize,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  exampleImage: {
    width: '100%',
    height: '100%',
  },
  goodIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(244, 67, 54, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exampleLabel: {
    fontSize: 12,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.9,
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: 30,
    position: 'relative',
  },
  previewImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  changePhotoButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  changePhotoText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  changePhotoButtonDisabled: {
    opacity: 0.5,
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 16,
    backgroundColor: '#131313',
  },
  continueButton: {
    width: '100%',
  },
  uploadButton: {
    width: '100%',
  },
  promoContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 8,
  },
  promoText: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  promoTextMain: {
    color: '#fff',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
  },
  coinContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  promoCoinIcon: {
    width: 16,
    height: 16,
  },
  coinAmount: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    lineHeight: 14,
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
    right: 10,
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
