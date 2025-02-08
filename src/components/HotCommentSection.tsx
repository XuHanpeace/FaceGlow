import React from 'react';
import { StyleSheet, View, Text, ScrollView, Dimensions } from 'react-native';
import { HotComment } from './HotComment';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 评论数据接口
interface CommentData {
  id: string;
  avatar: string; // 本地图片资源
  comment: string;
  rating: number;
  detail: string;
}

// 模拟数据
const comments: CommentData[] = [
  {
    id: '1',
    avatar:
      'https://img2.baidu.com/it/u=2575555370,1390809248&fm=253&fmt=auto&app=120&f=JPEG?w=800&h=800',
    comment: '我爱了我爱了！',
    rating: 5,
    detail: '绝绝子！这个照片增强器真的无敌了，效果直接拉满！已经疯狂安利给我所有姐妹了～',
  },
  {
    id: '2',
    avatar:
      'https://b0.bdstatic.com/1ecfbac8c6ae62d0da0bd6fbd33f02d0.jpg@h_1280',
    comment: '换脸神器！',
    rating: 5,
    detail:
      '这个真的太上头了！给爸爸发了好多整活滤镜，笑死根本停不下来，家人们都在玩，属于是老少皆宜了！',
  },
  {
    id: '3',
    avatar:
      'https://wx4.sinaimg.cn/mw690/005UJ76vgy1htcqockgebj30km0km0ud.jpg',
    comment: '真的太顶了',
    rating: 5,
    detail:
      '这软件也太离谱了吧！可以把自己变成WWE巨星，太炸裂了！朋友们都在问这是什么神仙软件，我直接开始狂推！',
  },
  {
    id: '4',
    avatar:
      'https://img0.baidu.com/it/u=3575219953,3873429185&fm=253&fmt=auto?w=500&h=500',
    comment: '越更新越爱了',
    rating: 5,
    detail:
      '开发团队简直太卷了！每次更新都是惊喜，高清效果直接破防！充会员真的很值，这波血赚，我真的会谢！',
  },
];

export const HotCommentSection: React.FC = () => {
  // 将评论分成左右两列
  const leftComments = comments.filter((_, index) => index % 2 === 0);
  const rightComments = comments.filter((_, index) => index % 2 === 1);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>用户真心推荐</Text>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.waterfall}>
          {/* 左列 */}
          <View style={styles.column}>
            {leftComments.map(comment => (
              <HotComment
                key={comment.id}
                avatar={comment.avatar}
                comment={comment.comment}
                rating={comment.rating}
                detail={comment.detail}
              />
            ))}
          </View>

          {/* 右列 */}
          <View style={styles.column}>
            {rightComments.map(comment => (
              <HotComment
                key={comment.id}
                avatar={comment.avatar}
                comment={comment.comment}
                rating={comment.rating}
                detail={comment.detail}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH, // 设置宽度为屏幕宽度
    backgroundColor: '#F8F8F8',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    padding: 16,
    paddingBottom: 8,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  waterfall: {
    flexDirection: 'row',
    paddingHorizontal: 8,
  },
  column: {
    flex: 1,
    paddingHorizontal: 4, // 减小水平内边距
  },
});
