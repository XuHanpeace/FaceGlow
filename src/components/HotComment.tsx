import React from 'react';
import { StyleSheet, View, Text, Image } from 'react-native';

interface HotCommentProps {
  avatar: string | number; // 支持网络图片或本地图片
  comment: string;
  rating: number;
  detail: string;
}

export const HotComment: React.FC<HotCommentProps> = ({ avatar, comment, rating, detail }) => {
  // 生成星星评分
  const renderStars = () => {
    return Array(5)
      .fill(0)
      .map((_, index) => (
        <Image
          key={index}
          source={{
            uri: 'https://img.icons8.com/?size=100&id=uIdTRQRhrqmA&format=png&color=000000',
          }} // 请确保添加星星图标
          style={[styles.star, { opacity: index < rating ? 1 : 0.3 }]}
        />
      ));
  };

  return (
    <View style={styles.container}>
      <Image source={typeof avatar === 'string' ? { uri: avatar } : avatar} style={styles.avatar} />
      <View style={styles.header}>
        <View style={styles.contentWrapper}>
          <Text style={styles.comment}>{comment}</Text>
          <View style={styles.ratingContainer}>{renderStars()}</View>
          <Text style={styles.detail}>{detail}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginVertical: 8,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  contentWrapper: {
    flex: 1,
    flexShrink: 1,
  },
  comment: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  ratingContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  star: {
    width: 16,
    height: 16,
    marginRight: 2,
  },
  detail: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    flexWrap: 'wrap',
  },
});
