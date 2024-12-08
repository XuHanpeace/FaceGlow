import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import HeaderSection from '../components/HeaderSection';

const FeedScreen = () => {
  return (
    <View style={styles.container}>
      <HeaderSection
        title="动态"
        subtitle="最新内容"
        description="查看好友和关注的人发布的最新动态。"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 18,
    color: '#333',
  },
});

export default FeedScreen; 