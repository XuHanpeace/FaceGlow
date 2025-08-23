import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import ControlPanel from '../components/ControlPanel';
import TemplatePreview from '../components/TemplatePreview';
import TemplateGrid, { ModelTemplate } from '../components/TemplateGrid';

type Props = NativeStackScreenProps<RootStackParamList, 'Detail'>;

const templates: ModelTemplate[] = [
  {
    id: '1',
    imageUrl: 'https://img.pica-cdn.com/image/aigc/dd9c961862dba5af874c3e6bd6b31a65.webp',
    modelId: 'mt_1956738875868848128',
    height: 220,
  },
  {
    id: '2',
    imageUrl: 'https://img.pica-cdn.com/image/aigc/2b52aa71d77e477588b2456eb9429254.webp',
    modelId: 'mt_1956935572981030912',
    height: 320,
  },
  {
    id: '3',
    imageUrl: 'https://img.pica-cdn.com/image/aigc/1eb46ad8228627726ba30aa18c21f45f.webp',
    modelId: 'mt_1956738875868848128',
    height: 200,
  },
  {
    id: '4',
    imageUrl: 'https://img.pica-cdn.com/image/aigc/3861a3758b53329f1f51161e19c5d503.webp',
    modelId: 'mt_1956738875868848128',
    height: 200,
  },
  {
    id: '5',
    imageUrl: 'https://img.pica-cdn.com/image/aigc/b5b034233845dae902572567b3100143.webp',
    modelId: 'mt_1956738875868848128',
    height: 300,
  },
  {
    id: '6',
    imageUrl: 'https://img.pica-cdn.com/image/aigc/489af1be76714a2f2a55e50c29dc71a1.webp',
    modelId: 'mt_1956738875868848128',
    height: 200,
  },
];


const DetailScreen: React.FC<Props> = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<ModelTemplate>(templates[0]);
  const [, setIsModalVisible] = useState(false);


  const handleTemplateSelect = (template: ModelTemplate) => {
    setSelectedTemplate(template);
  };

  const handleUploadPhoto = () => {
    setIsModalVisible(true);
  };

  const handleGenerate = () => {
    console.log('开始生成AI换脸...');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <TemplatePreview imageUrl={selectedTemplate.imageUrl} />

        <TemplateGrid
          templates={templates}
          selectedId={selectedTemplate.id}
          onSelect={(template: ModelTemplate) => handleTemplateSelect(template)}
        />
      </ScrollView>

      <TouchableOpacity style={styles.uploadButton} onPress={handleUploadPhoto}>
        <Text style={styles.uploadButtonText}>上传照片</Text>
      </TouchableOpacity>

      <ControlPanel
        selectedTemplate={selectedTemplate}
        onUpload={() => {}}
        onGenerate={handleGenerate}
      />
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
