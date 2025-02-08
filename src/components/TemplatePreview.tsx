import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TemplatePreviewProps {
  imageUrl: string;
  title?: string;
  subtitle?: string;
}

const TemplatePreview: React.FC<TemplatePreviewProps> = ({ imageUrl, title, subtitle }) => {
  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title || '✨ 一键生成艺术照'}</Text>
        <Text style={styles.subtitle}>{subtitle || '快来解锁你的绝美写真！'}</Text>
      </View>
      <Image source={{ uri: imageUrl }} style={styles.previewImage} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: SCREEN_WIDTH * 1.4,
    width: SCREEN_WIDTH,
    padding: 16,
  },
  previewImage: {
    width: '100%',
    height: '85%',
    resizeMode: 'cover',
    borderRadius: 16,
  },
  textContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default TemplatePreview; 