import React from 'react';
import FeatureCard from './FeatureCard';
import SectionContainer from './SectionContainer';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

const AIToolsetSection: React.FC = () => {

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleCardPress = (title: string, subtitle: string) => {
    navigation.navigate('Detail', {
      id: title,
      title,
      content: subtitle, // Using subtitle as content for DetailScreen
    });
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
        title="COS测试"
        imageSource={'https://img.icons8.com/color/96/000000/cloud-storage.png'}
        backgroundColor="#fff"
        onPress={() => navigation.navigate('COSUploadTest')}
        buttonText="测试"
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

export default AIToolsetSection;
