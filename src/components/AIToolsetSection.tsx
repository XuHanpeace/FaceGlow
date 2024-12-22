import React from 'react';
import FeatureCard from './FeatureCard';
import SectionContainer from './SectionContainer';
import { View, Text, StyleSheet } from 'react-native';
import { useModal } from './modal';

const AIToolsetSection: React.FC = () => {
  const { showModal } = useModal();

  const handleCardPress = (title: string, subtitle: string) => {
    showModal(
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>{title}</Text>
        <Text style={styles.modalSubtitle}>{subtitle}</Text>
        <Text style={styles.modalDescription}>
          这是一个 AI 工具，您可以使用它来创建独特的内容。更多功能正在开发中...
        </Text>
      </View>
    );
  };

  return (
    <SectionContainer title="AI工具集" horizontalScroll={true}>
      <FeatureCard
        title="故事生成器"
        subtitle="有趣,创造性"
        backgroundColor="#E8F4FF"
        onPress={() => handleCardPress("故事生成器", "有趣,创造性")}
      />
      <FeatureCard
        title="画作生成器"
        subtitle="有趣,创造性"
        backgroundColor="#FFF4E6"
        onPress={() => handleCardPress("画作生成器", "有趣,创造性")}
      />
      <FeatureCard
        title="绘画,艺术"
        subtitle="有趣,创造性"
        backgroundColor="#E6FFE6"
        onPress={() => handleCardPress("绘画,艺术", "有趣,创造性")}
      />
      <FeatureCard
        title="音乐生成器"
        subtitle="旋律,节奏"
        backgroundColor="#FFE6E6"
        onPress={() => handleCardPress("音乐生成器", "旋律,节奏")}
      />
      <FeatureCard
        title="视频编辑器"
        subtitle="剪辑,特效"
        backgroundColor="#E6E6FF"
        onPress={() => handleCardPress("视频编辑器", "剪辑,特效")}
      />
    </SectionContainer>
  );
};

const styles = StyleSheet.create({
  modalContent: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default AIToolsetSection; 