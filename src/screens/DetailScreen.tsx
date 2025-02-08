import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import ControlPanel from '../components/ControlPanel';
import TemplatePreview from '../components/TemplatePreview';
import TemplateGrid from '../components/TemplateGrid';


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
      height: 220,
    },
    {
      id: '2',
      imageUrl: 'https://img.pica-cdn.com/image/aigc/2b52aa71d77e477588b2456eb9429254.webp',
      height: 320,
    },
    {
      id: '3',
      imageUrl: 'https://img.pica-cdn.com/image/aigc/1eb46ad8228627726ba30aa18c21f45f.webp',
      height: 200,
    },
    {
      id: '4',
      imageUrl: 'https://img.pica-cdn.com/image/aigc/3861a3758b53329f1f51161e19c5d503.webp',
      height: 200,
    },
    {
      id: '5',
      imageUrl: 'https://img.pica-cdn.com/image/aigc/b5b034233845dae902572567b3100143.webp',
      height: 300,
    },
    {
      id: '6',
      imageUrl: 'https://img.pica-cdn.com/image/aigc/489af1be76714a2f2a55e50c29dc71a1.webp',
      height: 200,
    },
  ];

  const handleTemplateSelect = (template: (typeof templates)[0]) => {
    setSelectedTemplate(template);
  };

  const handleUploadPhoto = () => {
    setIsModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <TemplatePreview imageUrl={selectedTemplate.imageUrl} />

        <TemplateGrid
          templates={templates}
          selectedId={selectedTemplate.id}
          onSelect={handleTemplateSelect}
        />
      </ScrollView>

      <TouchableOpacity style={styles.uploadButton} onPress={handleUploadPhoto}>
        <Text style={styles.uploadButtonText}>上传照片</Text>
      </TouchableOpacity>

      <ControlPanel selectedImage={selectedTemplate.imageUrl} onUpload={() => {}} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginTop: 16,
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
});

export default DetailScreen;
