import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, FlatList, ListRenderItem, useColorScheme } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import AIToolsetSection from '../components/AIToolsetSection';
import RecommendationSection from '../components/RecommendationSection';
import { RecommendationSectionRef } from '../components/RecommendationSection';
import BlurBackground from '../components/BlurBackground';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

type Props = {
  navigation: HomeScreenNavigationProp;
};

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const [sections] = React.useState(['AI工具集', '推荐']);
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
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#000' : '#fff' }]}>
      <BlurBackground />
      
      <FlatList
        data={sections}
        renderItem={renderSection}
        keyExtractor={(item, index) => item + index}
        onEndReached={loadMoreSections}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
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
