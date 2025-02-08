import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ImageComparison } from './ImageComparison';

interface AIFeatureCardProps {
  title: string;
  description: string;
  beforeImage: string;
  afterImage: string;
  imageWidth?: number;
  imageHeight?: number;
}

export const AIFeatureCard: React.FC<AIFeatureCardProps> = ({
  title,
  description,
  beforeImage,
  afterImage,
  imageWidth = 360,
  imageHeight = 200,
}) => {
  return (
    <View style={styles.container}>
      {/* 图片对比区域 */}
      <View style={styles.imageContainer}>
        <ImageComparison
          beforeImage={beforeImage}
          afterImage={afterImage}
          width={imageWidth}
          height={imageHeight}
        />
      </View>

      {/* 文字内容区域 */}
      <View style={styles.contentContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description} numberOfLines={3}>{description}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    width: 360,
  },
  imageContainer: {
    width: '100%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  contentContainer: {
    padding: 12,
    paddingTop: 10,
    paddingBottom: 14,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    lineHeight: 18,
    color: '#666',
    opacity: 0.8,
  },
});