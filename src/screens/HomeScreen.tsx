import React from 'react';
import {View, StyleSheet} from 'react-native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../types/navigation';
import HeaderSection from '../components/HeaderSection';
import FeatureCard from '../components/FeatureCard';
import SectionContainer from '../components/SectionContainer';
import RecommendationCard from '../components/RecommendationCard';

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Home'
>;

type Props = {
  navigation: HomeScreenNavigationProp;
};

const HomeScreen: React.FC<Props> = ({navigation}) => {
  return (
    <View style={styles.container}>
      <HeaderSection
        title="欢迎使用"
        subtitle="探索更多功能"
        description="这里是主页面，您可以浏览所有内容和功能。"
      />
      <SectionContainer title="AI工具集" horizontalScroll={true}>
        <FeatureCard
          title="故事生成器"
          subtitle="有趣,创造性"
          backgroundColor="#E8F4FF"
          onPress={() => console.log('故事生成器')}
        />
        <FeatureCard
          title="画��生成器"
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
      <SectionContainer title="推荐" horizontalScroll={false}>
        <RecommendationCard
          image="https://img1.baidu.com/it/u=1700243739,1439894999&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=625"
          title="自然风景1"
          subtitle="感受大自然的美妙"
          count={538}
          onPress={() => console.log('自然风景1')}
        />
        <RecommendationCard
          image="https://gimg2.baidu.com/image_search/src=http%3A%2F%2Fsafe-img.xhscdn.com%2Fbw1%2Fc88852a3-ab48-45f3-a9a0-3f17448786dd%3FimageView2%2F2%2Fw%2F1080%2Fformat%2Fjpg&refer=http%3A%2F%2Fsafe-img.xhscdn.com&app=2002&size=f9999,10000&q=a80&n=0&g=0n&fmt=auto?sec=1736349758&t=79b46ceb5cae3af6751ae519ec2e968b"
          title="自然风景2"
          subtitle="品尝各种美味的料理"
          count={25}
          onPress={() => console.log('自然风景2')}
        />
        <RecommendationCard
          image="https://img2.baidu.com/it/u=1925016482,747703762&fm=253&fmt=auto&app=138&f=JPEG?w=800&h=1179"
          title="自然风景3"
          subtitle="探索建筑物里的独特风光"
          count={562}
          onPress={() => console.log('自然风景3')}
        />
        <RecommendationCard
          image="https://c-ssl.dtstatic.com/uploads/blog/202009/29/20200929010001_bb458.thumb.1000_0.jpg"
          title="自然风景4"
          subtitle="了解各种野生动物生活"
          count={107}
          onPress={() => console.log('自然风景4')}
        />
      </SectionContainer>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default HomeScreen; 