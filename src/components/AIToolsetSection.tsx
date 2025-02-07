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
      </View>,
    );
  };

  return (
    <SectionContainer title="创意, 有趣, 写真" horizontalScroll={true}>
      <FeatureCard
        title="AI换脸"
        backgroundColor="#fff"
        imageSource={'https://static.pica-ai.com/_next/static/media/route_02_mobile.52f53604.png'}
        onPress={() => handleCardPress('故事生成器', '有趣,创造性')}
        buttonText="开始"
      />
      <FeatureCard
        title="证件照"
        backgroundColor="#fff"
        imageSource={'https://static.pica-ai.com/_next/static/media/route_03_mobile.00a24444.png'}
        onPress={() => handleCardPress('画作生成器', '有趣,创造性')}
        buttonText="开始"
      />
      <FeatureCard
        title="照片修复"
        imageSource={'https://static.pica-ai.com/_next/static/media/route_01_mobile.f9f3aecc.png'}
        backgroundColor="#fff"
        onPress={() => handleCardPress('绘画,艺术', '有趣,创造性')}
        buttonText="开始"
      />
      <FeatureCard
        title="AI写真"
        imageSource={'https://img.pica-cdn.com/image/aigc/2b52aa71d77e477588b2456eb9429254.webp'}
        backgroundColor="#fff"
        onPress={() => handleCardPress('绘画,艺术', '有趣,创造性')}
        buttonText="开始"
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
