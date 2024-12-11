import React, { useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import RecommendationCard from './RecommendationCard';
import SectionContainer from './SectionContainer';
import { openNewNativeScreen } from '../navigation/nativeNavigationUtils';

// 定义推荐卡片的数据类型
interface RecommendationItem {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  count: number;
}

const MOCK_IMAGES = [
  'https://img0.baidu.com/it/u=648319078,1238542641&fm=253&app=138&f=JPEG?w=800&h=800',
  'https://c-ssl.dtstatic.com/uploads/blog/202009/29/20200929010001_bb458.thumb.1000_0.jpg',
  'https://gimg2.baidu.com/image_search/src=http%3A%2F%2Fsafe-img.xhscdn.com%2Fbw1%2F9a38e052-2a29-4abd-bb14-bb47ed10094d%3FimageView2%2F2%2Fw%2F1080%2Fformat%2Fjpg&refer=http%3A%2F%2Fsafe-img.xhscdn.com&app=2002&size=f9999,10000&q=a80&n=0&g=0n&fmt=auto?sec=1736349758&t=ea5e234f20da0f6b456246b87f6cec7f',
  'https://gimg2.baidu.com/image_search/src=http%3A%2F%2Fsafe-img.xhscdn.com%2Fbw1%2F7276623c-ff06-4b48-8af1-93b6df94fc37%3FimageView2%2F2%2Fw%2F1080%2Fformat%2Fjpg&refer=http%3A%2F%2Fsafe-img.xhscdn.com&app=2002&size=f9999,10000&q=a80&n=0&g=0n&fmt=auto?sec=1736349758&t=906566823710867de5236a8c3f314faa'
];

// Mock 数据生成函数
const generateMockData = (page: number): RecommendationItem[] => {
  return Array(4).fill(null).map((_, index) => ({
    id: `${page}-${index}`,
    image: MOCK_IMAGES[index], // 使用固定的图片数组
    title: `推荐内容 ${page * 4 + index + 1}`,
    subtitle: `这是第 ${page * 4 + index + 1} 个���荐内容的描述`,
    count: Math.floor(Math.random() * 1000)
  }));
};

// 模拟API请求
const fetchRecommendations = async (page: number): Promise<RecommendationItem[]> => {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 1000));
  return generateMockData(page);
};

// 定义 ref 的类型
export interface RecommendationSectionRef {
  fetchData: () => Promise<void>;
}

const RecommendationSection = forwardRef<RecommendationSectionRef>((_, ref) => {
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (loading) return;

    try {
      setLoading(true);
      const newData = await fetchRecommendations(page);
      setRecommendations(prev => [...prev, ...newData]);
      setPage(prev => prev + 1);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    } finally {
      setLoading(false);
    }
  }, [page, loading]);

  // 暴露 fetchData 方法给父组件
  useImperativeHandle(ref, () => ({
    fetchData
  }));

  // 初始加载
  React.useEffect(() => {
    fetchData();
  }, []);

  const handleCardPress = (item: RecommendationItem) => {
    openNewNativeScreen('RecommendationDetail', {
      id: item.id,
      title: item.title,
      // 传递其他可能需要的参数
      image: item.image,
      subtitle: item.subtitle,
      count: item.count
    });
  };

  return (
    <SectionContainer 
      title="推荐" 
      horizontalScroll={false}
    >
      {recommendations.map((item) => (
        <RecommendationCard
          key={item.id}
          image={item.image}
          title={item.title}
          subtitle={item.subtitle}
          count={item.count}
          onPress={() => handleCardPress(item)}
        />
      ))}
    </SectionContainer>
  );
});

export default RecommendationSection; 