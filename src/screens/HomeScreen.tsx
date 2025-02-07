import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, FlatList, ListRenderItem, useColorScheme, Button } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import HeaderSection from '../components/HeaderSection';
import AIToolsetSection from '../components/AIToolsetSection';
import RecommendationSection from '../components/RecommendationSection';
import { RecommendationSectionRef } from '../components/RecommendationSection';
import { checkLoginStatus } from '../services/tcb';
import { useNavigation } from '@react-navigation/native';
import { ImageComparison } from '../components/ImageComparison';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

type Props = {
  navigation: HomeScreenNavigationProp;
};

const HomeScreen: React.FC<Props> = () => {
  const [sections] = useState(['AI工具集', '推荐']);
  const recommendationRef = useRef<RecommendationSectionRef>(null);
  const isDarkMode = useColorScheme() === 'dark';
  const navigation = useNavigation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    checkLoginState();
  }, []);

  const checkLoginState = async () => {
    const userInfo = await checkLoginStatus();
    setIsLoggedIn(!!userInfo);
  };

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
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#000' : '#fff' }]}>
      <HeaderSection
        title="欢迎使用"
        subtitle="探索更多功能"
        description="这里是主页面，您可以浏览所有内容和功能。"
      />
      <ImageComparison
        beforeImage={'https://static.pica-ai.com/_next/static/media/enhance-before-6.084ea67f.png'}
        afterImage={'https://static.pica-ai.com/_next/static/media/enhance-after-6.97c23d2e.png'}
        width={300}
        height={400}
      />
      <FlatList
        data={sections}
        renderItem={renderSection}
        keyExtractor={(item, index) => item + index}
        onEndReached={loadMoreSections}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
      />
      {!isLoggedIn && <Button title="登录" onPress={() => navigation.navigate('Login')} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default HomeScreen;
