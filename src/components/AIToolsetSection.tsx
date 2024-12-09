import React from 'react';
import FeatureCard from './FeatureCard';
import SectionContainer from './SectionContainer';

const AIToolsetSection: React.FC = () => {
  return (
    <SectionContainer title="AI工具集" horizontalScroll={true}>
      <FeatureCard
        title="故事生成器"
        subtitle="有趣,创造性"
        backgroundColor="#E8F4FF"
        onPress={() => console.log('故事生成器')}
      />
      <FeatureCard
        title="画作生成器"
        subtitle="有趣,创造性"
        backgroundColor="#FFF4E6"
        onPress={() => console.log('画作生成器')}
      />
      <FeatureCard
        title="绘画,艺术"
        subtitle="有趣,创造性"
        backgroundColor="#E6FFE6"
        onPress={() => console.log('绘画,艺术')}
      />
      <FeatureCard
        title="音乐生成器"
        subtitle="旋律,节奏"
        backgroundColor="#FFE6E6"
        onPress={() => console.log('音乐生成器')}
      />
      <FeatureCard
        title="视频编辑器"
        subtitle="剪辑,特效"
        backgroundColor="#E6E6FF"
        onPress={() => console.log('视频编辑器')}
      />
    </SectionContainer>
  );
};

export default AIToolsetSection; 