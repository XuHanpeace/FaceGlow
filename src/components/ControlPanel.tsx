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

interface ControlPanelProps {
  selectedImage: string | null;
  onUpload?: (imageUri: string) => void;
  onGenerate?: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  selectedImage,
  onUpload: _onUpload,
  onGenerate: _onGenerate,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [userImage, _setUserImage] = useState<string>('https://iai-face-demo-user-upload-1254418846.cos.ap-guangzhou.myqcloud.com/facefuse-4-2.png');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
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
                // console.error('Error picking image:', error);
              }
            },
          },
          {
            text: '相机',
            onPress: async () => {
              const result = await ImagePicker.launchCamera(options);
              handleImageResult(result);
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
      // console.error('Error picking image:', error);
    }
  };

  const handleImageResult = (result: ImagePicker.ImagePickerResponse) => {
    if (!result.didCancel && result.assets && result.assets[0]) {
      const base64Image = result.assets[0].base64;
      if (base64Image) {
        // setUserImage(base64Image);
      }

      if (!isExpanded) {
        toggleExpand();
      }
    }
  };



  const handleGenerate = async () => {
    try {
      setIsLoading(true);
      setGeneratedImage(null); // 清空之前的结果

      const params = {
        projectId: 'at_1888958525505814528',
        modelId: 'mt_1956738875868848128',
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
            style={[styles.generateButton, isLoading && styles.generateButtonDisabled]}
            onPress={handleGenerate}
            disabled={isLoading}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#000" />
                <Text style={styles.loadingText}>生成中...</Text>
              </View>
            ) : (
              <Text style={styles.generateButtonText}>开始生成</Text>
            )}
          </TouchableOpacity>
        )}

        {!isExpanded && !userImage && (
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => {
              handleImageSelection();
            }}
          >
            <Text style={styles.uploadButtonText}>添加</Text>
          </TouchableOpacity>
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
});

export default ControlPanel;
