import React, { forwardRef } from 'react';
import SectionContainer from './SectionContainer';
import { AIFeatureCard } from './AIFeatureCard';
import { AIFaceSwapIntro } from './AIFaceSwapIntro';
import { AIIDPhotoIntro } from './AIIDPhotoIntro';
import { HotCommentSection } from './HotCommentSection';

// 定义 ref 的类型
export interface RecommendationSectionRef {
  fetchData: () => Promise<void>;
}

const RecommendationSection = forwardRef<RecommendationSectionRef>((props, ref) => {

  return (
    <SectionContainer title="为照片添加AI色彩" horizontalScroll={false}>
      <AIFeatureCard
        title="修复破损老照片"
        description="采用 deepseek 尖端 AI 修复技术，智能修复老照片的破损、褪色、折痕等问题。让破旧的黑白照片重现往日光彩，帮助您守护珍贵的家庭回忆。"
        beforeImage={'https://static.pica-ai.com/_next/static/media/before.e3bdb174.jpg'}
        afterImage={'https://static.pica-ai.com/_next/static/media/after.dedcbed1.jpg'}
      />
      <AIFaceSwapIntro
        templateImage="https://img.pica-cdn.com/image/aigc/dd9c961862dba5af874c3e6bd6b31a65.webp"
        // templateImage="https://static.pica-ai.com/_next/static/media/right_sample.89e22a28.png"
        onPress={() => console.log('Button pressed')}
      />
      <AIIDPhotoIntro onPress={() => console.log('Button pressed')} />
      <HotCommentSection />
    </SectionContainer>
  );
});

export default RecommendationSection;
