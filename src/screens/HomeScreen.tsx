import React, { useState, useRef } from 'react';
import { View, StyleSheet, FlatList, ListRenderItem, useColorScheme } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import HeaderSection from '../components/HeaderSection';
import AIToolsetSection from '../components/AIToolsetSection';
import RecommendationSection from '../components/RecommendationSection';
import { RecommendationSectionRef } from '../components/RecommendationSection';

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Home'
>;

type Props = {
  navigation: HomeScreenNavigationProp;
};

const HomeScreen: React.FC<Props> = () => {
  const [sections, setSections] = useState(['AI工具集', '推荐']);
  const recommendationRef = useRef<RecommendationSectionRef>(null);
  const isDarkMode = useColorScheme() === 'dark';

  const loadMoreSections = () => {
    recommendationRef.current?.fetchData();
  };

  const renderSection: ListRenderItem<string> = ({ item }) => {
    if (item === 'AI工具集') {
      return <AIToolsetSection />;
    } else if (item === '推荐') {
      return <RecommendationSection ref={recommendationRef} />;
    }
    return null;
  };

  return (
    <View style={[
      styles.container, 
      { backgroundColor: isDarkMode ? '#000' : '#fff' }
    ]}>
      <HeaderSection
        title="欢迎使用"
        subtitle="探索更多功能"
        description="这里是主页面，您可以浏览所有内容和功能。"
      />
      <FlatList
        data={sections}
        renderItem={renderSection}
        keyExtractor={(item, index) => item + index}
        onEndReached={loadMoreSections}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default HomeScreen; 