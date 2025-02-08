import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import Modal from '../components/modal/Modal';
import ControlPanel from '../components/ControlPanel';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'Detail'>;

const DetailScreen: React.FC<Props> = () => {
  const [selectedTemplate, setSelectedTemplate] = useState({
    id: '1',
    imageUrl: 'https://img.pica-cdn.com/image/aigc/dd9c961862dba5af874c3e6bd6b31a65.webp',
  });
  const [isModalVisible, setIsModalVisible] = useState(false);

  const templates = [
    {
      id: '1',
      imageUrl: 'https://img.pica-cdn.com/image/aigc/dd9c961862dba5af874c3e6bd6b31a65.webp',
    },
    {
      id: '2',
      imageUrl: 'https://img.pica-cdn.com/image/aigc/2b52aa71d77e477588b2456eb9429254.webp',
    },
    // 添加更多模板...
  ];

  const handleTemplateSelect = (template: (typeof templates)[0]) => {
    setSelectedTemplate(template);
  };

  const handleUploadPhoto = () => {
    setIsModalVisible(true);
  };

  return (
    <View style={styles.container}>
      {/* 顶部模板预览 */}
      <View style={styles.previewContainer}>
        <Image source={{ uri: selectedTemplate.imageUrl }} style={styles.previewImage} />
      </View>

      {/* 底部模板列表 */}
      <View style={styles.templatesContainer}>
        <Text style={styles.title}>选择模板</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templatesList}>
          {templates.map(template => (
            <TouchableOpacity
              key={template.id}
              onPress={() => handleTemplateSelect(template)}
              style={[
                styles.templateItem,
                selectedTemplate.id === template.id && styles.selectedTemplate,
              ]}
            >
              <Image source={{ uri: template.imageUrl }} style={styles.templateImage} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 底部上传按钮 */}
      <TouchableOpacity style={styles.uploadButton} onPress={handleUploadPhoto}>
        <Text style={styles.uploadButtonText}>上传照片</Text>
      </TouchableOpacity>

      {/* 上传照片模态框 */}
      <ControlPanel selectedImage={selectedTemplate.imageUrl} onUpload={() => {}} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  previewContainer: {
    height: SCREEN_WIDTH * 1.2,
    width: SCREEN_WIDTH,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  templatesContainer: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  templatesList: {
    flexDirection: 'row',
  },
  templateItem: {
    width: 80,
    height: 80,
    marginRight: 8,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedTemplate: {
    borderColor: '#5EE7DF',
  },
  templateImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  uploadButton: {
    position: 'absolute',
    bottom: 32,
    left: 16,
    right: 16,
    backgroundColor: '#5EE7DF',
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  modalContent: {
    padding: 16,
  },
  modalButton: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  modalButtonText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default DetailScreen;
