import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { UserWorkModel } from '../types/model/user_works';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type UserWorkPreviewScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type UserWorkPreviewScreenRouteProp = RouteProp<RootStackParamList, 'UserWorkPreview'>;

const UserWorkPreviewScreen: React.FC = () => {
  const navigation = useNavigation<UserWorkPreviewScreenNavigationProp>();
  const route = useRoute<UserWorkPreviewScreenRouteProp>();
  const { work } = route.params;
  
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleImagePress = (index: number) => {
    setSelectedImageIndex(index);
  };

  // 获取所有换脸结果图片
  const getAllImages = () => {
    const images = [];
    
    // 添加活动图片
    if (work.activity_image) {
      images.push({
        url: work.activity_image,
        type: 'activity',
        title: '活动图片'
      });
    }
    
    // 添加所有换脸结果
    if (work.result_data && work.result_data.length > 0) {
      work.result_data.forEach((result, index) => {
        images.push({
          url: result.result_image,
          type: 'result',
          title: `换脸结果 ${index + 1}`,
          templateId: result.template_id
        });
      });
    }
    
    return images;
  };

  const allImages = getAllImages();
  const selectedImage = allImages[selectedImageIndex];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" translucent />
      
      {/* 头部导航 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {work.activity_title}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* 主图片展示区域 */}
      <View style={styles.mainImageContainer}>
        {selectedImage ? (
          <Image 
            source={{ uri: selectedImage.url }} 
            style={styles.mainImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.noImageContainer}>
            <Text style={styles.noImageText}>暂无图片</Text>
          </View>
        )}
        
        {/* 图片信息覆盖层 */}
        <View style={styles.imageOverlay}>
          <Text style={styles.imageTitle}>{selectedImage?.title || '未知'}</Text>
        </View>
      </View>

      {/* 作品信息区域 */}
      <View style={styles.infoContainer}>
        <Text style={styles.workTitle}>{work.activity_title}</Text>
        <Text style={styles.workDescription}>{work.activity_description}</Text>
        
        <View style={styles.workStats}>
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>❤️</Text>
            <Text style={styles.statText}>{work.likes || '0'}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>📥</Text>
            <Text style={styles.statText}>{work.download_count || '0'}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>📅</Text>
            <Text style={styles.statText}>
              {work.created_at ? new Date(work.created_at).toLocaleDateString() : '未知时间'}
            </Text>
          </View>
        </View>
      </View>

      {/* 缩略图列表 */}
      {allImages.length > 1 && (
        <View style={styles.thumbnailContainer}>
          <Text style={styles.thumbnailTitle}>浏览图片</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbnailList}
          >
            {allImages.map((image, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.thumbnailItem,
                  selectedImageIndex === index && styles.selectedThumbnail
                ]}
                onPress={() => handleImagePress(index)}
              >
                <Image 
                  source={{ uri: image.url }} 
                  style={styles.thumbnailImage}
                  resizeMode="cover"
                />
                <Text style={styles.thumbnailLabel} numberOfLines={1}>
                  {image.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
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
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 20,
  },
  placeholder: {
    width: 40,
  },
  mainImageContainer: {
    flex: 1,
    position: 'relative',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  noImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.6,
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
  infoContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  workTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  workDescription: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.8,
    lineHeight: 20,
    marginBottom: 16,
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
  thumbnailContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  thumbnailTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  thumbnailList: {
    paddingRight: 20,
  },
  thumbnailItem: {
    marginRight: 12,
    alignItems: 'center',
  },
  selectedThumbnail: {
    opacity: 0.8,
  },
  thumbnailImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginBottom: 4,
  },
  thumbnailLabel: {
    color: '#fff',
    fontSize: 10,
    opacity: 0.7,
    textAlign: 'center',
  },
});

export default UserWorkPreviewScreen;
